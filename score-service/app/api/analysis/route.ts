import { fetchBacklogDocumentTree } from "@/app/lib/backlog";
import type { BacklogDocumentTreeNode } from "@/app/lib/backlog";
import type { DesignReviewResult } from "@/app/lib/design-review";
import { generateDesignReviewPrompt } from "@/app/lib/design-review-prompt";
import { requestOpenAiAnalysis } from "@/app/lib/openai";

const HTTP_STATUS = {
  badRequest: 400,
  internalServerError: 500,
  badGateway: 502,
} as const;

type AnalysisRequestBody = {
  backlogProjectId: unknown;
  designDocumentId?: unknown;
  documentId?: unknown;
  backlogApiKey: unknown;
  openAiApiKey: unknown;
};

type ValidatedAnalysisRequest = {
  backlogProjectId: number;
  targetDocumentId: number;
  backlogApiKey: string;
  openAiApiKey: string;
};

export async function POST(request: Request): Promise<Response> {
  let body: AnalysisRequestBody;

  try {
    body = (await request.json()) as AnalysisRequestBody;
  } catch {
    return jsonError("Request body must be valid JSON", HTTP_STATUS.badRequest);
  }

  const validationResult = validateRequestBody(body);
  if (!validationResult.ok) {
    return jsonError(validationResult.error, HTTP_STATUS.badRequest);
  }

  const backlogBaseUrl = process.env.BACKLOG_BASE_URL;
  if (!backlogBaseUrl) {
    return jsonError("Backlog base URL is not configured", HTTP_STATUS.internalServerError);
  }

  let documentTree: BacklogDocumentTreeNode;
  try {
    documentTree = await fetchBacklogDocumentTree({
      baseUrl: backlogBaseUrl,
      apiKey: validationResult.value.backlogApiKey,
      documentId: validationResult.value.targetDocumentId,
    });
  } catch (error) {
    return jsonError(
      getErrorMessage(error, "Failed to retrieve Backlog document tree"),
      HTTP_STATUS.badGateway,
    );
  }

  const prompt = generateDesignReviewPrompt({
    projectId: validationResult.value.backlogProjectId,
    documentTree,
  });

  let analysisContent: string;
  try {
    const analysisResult = await requestOpenAiAnalysis({
      apiKey: validationResult.value.openAiApiKey,
      prompt,
    });
    analysisContent = analysisResult.content;
  } catch (error) {
    return jsonError(
      getErrorMessage(error, "Failed to request OpenAI analysis"),
      HTTP_STATUS.badGateway,
    );
  }

  let reviewResult: DesignReviewResult;
  try {
    reviewResult = parseDesignReviewResult(analysisContent);
  } catch (error) {
    return jsonError(
      getErrorMessage(error, "OpenAI response could not be parsed"),
      HTTP_STATUS.badGateway,
    );
  }

  return Response.json(reviewResult);
}

type ValidationSuccess = { ok: true; value: ValidatedAnalysisRequest };
type ValidationFailure = { ok: false; error: string };
type ValidationResult = ValidationSuccess | ValidationFailure;

function validateRequestBody(body: AnalysisRequestBody | unknown): ValidationResult {
  if (!isRecord(body)) {
    return { ok: false, error: "Request body must be an object" };
  }

  const backlogProjectIdResult = parsePositiveInteger(
    body.backlogProjectId,
    "backlogProjectId",
  );
  if (!backlogProjectIdResult.ok) {
    return backlogProjectIdResult;
  }

  const documentIdInput = body.documentId ?? body.designDocumentId;
  if (documentIdInput === undefined) {
    return { ok: false, error: "designDocumentId is required" };
  }

  const targetDocumentIdResult = parsePositiveInteger(documentIdInput, "designDocumentId");
  if (!targetDocumentIdResult.ok) {
    return targetDocumentIdResult;
  }

  const backlogApiKeyResult = parseNonEmptyString(body.backlogApiKey, "backlogApiKey");
  if (!backlogApiKeyResult.ok) {
    return backlogApiKeyResult;
  }

  const openAiApiKeyResult = parseNonEmptyString(body.openAiApiKey, "openAiApiKey");
  if (!openAiApiKeyResult.ok) {
    return openAiApiKeyResult;
  }

  return {
    ok: true,
    value: {
      backlogProjectId: backlogProjectIdResult.value,
      targetDocumentId: targetDocumentIdResult.value,
      backlogApiKey: backlogApiKeyResult.value,
      openAiApiKey: openAiApiKeyResult.value,
    },
  };
}

type StringParseFailure = { ok: false; error: string };
type StringParseSuccess = { ok: true; value: string };
type StringParseResult = StringParseSuccess | StringParseFailure;

function parseNonEmptyString(value: unknown, fieldName: string): StringParseResult {
  if (typeof value !== "string") {
    return { ok: false, error: `${fieldName} must be a string` };
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return { ok: false, error: `${fieldName} is required` };
  }

  return { ok: true, value: trimmed };
}

type IntegerParseFailure = { ok: false; error: string };
type IntegerParseSuccess = { ok: true; value: number };
type IntegerParseResult = IntegerParseSuccess | IntegerParseFailure;

function parsePositiveInteger(value: unknown, fieldName: string): IntegerParseResult {
  if (typeof value !== "string" && typeof value !== "number") {
    return { ok: false, error: `${fieldName} must be a number` };
  }

  const numericValue = typeof value === "number" ? value : Number.parseInt(value, 10);

  if (!Number.isFinite(numericValue) || !Number.isInteger(numericValue)) {
    return { ok: false, error: `${fieldName} must be an integer` };
  }

  if (numericValue <= 0) {
    return { ok: false, error: `${fieldName} must be greater than 0` };
  }

  return { ok: true, value: numericValue };
}

function parseDesignReviewResult(content: string): DesignReviewResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content) as unknown;
  } catch {
    throw new Error("OpenAI response was not valid JSON");
  }

  const validationError = validateDesignReviewResult(parsed);
  if (validationError) {
    throw new Error(validationError);
  }

  return parsed as DesignReviewResult;
}

type ValidationError = string | null;

function validateDesignReviewResult(payload: unknown): ValidationError {
  if (!isRecord(payload)) {
    return "Response must be an object";
  }

  if (!("rootDocument" in payload)) {
    return "Response is missing rootDocument";
  }

  return validateDocumentResult(payload.rootDocument, "rootDocument");
}

function validateDocumentResult(value: unknown, path: string): ValidationError {
  if (!isRecord(value)) {
    return `${path} must be an object`;
  }

  if (!isNonEmptyString(value.id)) {
    return `${path}.id must be a non-empty string`;
  }

  if (!isNonEmptyString(value.documentTitle)) {
    return `${path}.documentTitle must be a non-empty string`;
  }

  const breadcrumbs = value.breadcrumbs;
  if (!Array.isArray(breadcrumbs) || breadcrumbs.some((item) => !isBreadcrumb(item))) {
    return `${path}.breadcrumbs must be an array of breadcrumbs`;
  }

  const totalScoreError = validateScore(value.totalScore, `${path}.totalScore`);
  if (totalScoreError) {
    return totalScoreError;
  }

  const overallEvaluationError = validateOverallEvaluation(
    value.overallEvaluation,
    `${path}.overallEvaluation`,
  );
  if (overallEvaluationError) {
    return overallEvaluationError;
  }

  if (!Array.isArray(value.sectionEvaluations)) {
    return `${path}.sectionEvaluations must be an array`;
  }

  for (let index = 0; index < value.sectionEvaluations.length; index += 1) {
    const sectionError = validateSection(
      value.sectionEvaluations[index],
      `${path}.sectionEvaluations[${index}]`,
    );
    if (sectionError) {
      return sectionError;
    }
  }

  if (!Array.isArray(value.improvementSuggestions)) {
    return `${path}.improvementSuggestions must be an array`;
  }

  for (let index = 0; index < value.improvementSuggestions.length; index += 1) {
    const improvementError = validateImprovement(
      value.improvementSuggestions[index],
      `${path}.improvementSuggestions[${index}]`,
    );
    if (improvementError) {
      return improvementError;
    }
  }

  if (!Array.isArray(value.childDocuments)) {
    return `${path}.childDocuments must be an array`;
  }

  for (let index = 0; index < value.childDocuments.length; index += 1) {
    const childError = validateDocumentResult(
      value.childDocuments[index],
      `${path}.childDocuments[${index}]`,
    );
    if (childError) {
      return childError;
    }
  }

  return null;
}

function validateScore(value: unknown, path: string): ValidationError {
  if (!isRecord(value)) {
    return `${path} must be an object`;
  }

  if (!isNumber(value.value)) {
    return `${path}.value must be a number`;
  }

  if (!isNumber(value.max)) {
    return `${path}.max must be a number`;
  }

  return null;
}

function validateOverallEvaluation(value: unknown, path: string): ValidationError {
  if (!isRecord(value)) {
    return `${path} must be an object`;
  }

  if (!isNonEmptyString(value.ratingLabel)) {
    return `${path}.ratingLabel must be a non-empty string`;
  }

  if (!isNonEmptyString(value.summary)) {
    return `${path}.summary must be a non-empty string`;
  }

  return null;
}

function validateSection(value: unknown, path: string): ValidationError {
  if (!isRecord(value)) {
    return `${path} must be an object`;
  }

  if (!isNonEmptyString(value.id)) {
    return `${path}.id must be a non-empty string`;
  }

  if (!isNonEmptyString(value.title)) {
    return `${path}.title must be a non-empty string`;
  }

  const scoreError = validateScore(value.score, `${path}.score`);
  if (scoreError) {
    return scoreError;
  }

  if (!isNonEmptyString(value.summary)) {
    return `${path}.summary must be a non-empty string`;
  }

  if (!Array.isArray(value.highlights) || value.highlights.some((item) => !isNonEmptyString(item))) {
    return `${path}.highlights must be an array of non-empty strings`;
  }

  return null;
}

function validateImprovement(value: unknown, path: string): ValidationError {
  if (!isRecord(value)) {
    return `${path} must be an object`;
  }

  if (!isNonEmptyString(value.title)) {
    return `${path}.title must be a non-empty string`;
  }

  if (!isNonEmptyString(value.description)) {
    return `${path}.description must be a non-empty string`;
  }

  return null;
}

function isBreadcrumb(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  if (!isNonEmptyString(value.label)) {
    return false;
  }

  if (value.href !== undefined && typeof value.href !== "string") {
    return false;
  }

  return true;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
