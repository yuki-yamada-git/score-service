import { ZodIssueCode, type ZodIssue } from "zod";

import { analysisRequestSchema } from "@/app/lib/analysis-schema";
import {
  InvalidAnalysisResultError,
  parseDesignReviewResultResponse,
} from "@/app/lib/analysis-result";
import { fetchBacklogDocumentTree } from "@/app/lib/backlog";
import type { BacklogDocumentTreeNode } from "@/app/lib/backlog";
import {
  DESIGN_REVIEW_SYSTEM_PROMPT,
  generateDesignReviewPrompt,
} from "@/app/lib/design-review-prompt";
import { requestOpenAiAnalysis } from "@/app/lib/openai";

const HTTP_STATUS = {
  badRequest: 400,
  internalServerError: 500,
  badGateway: 502,
} as const;

type JsonError = {
  error: string;
};

export async function POST(request: Request): Promise<Response> {
  let rawBody: unknown;

  try {
    rawBody = await request.json();
  } catch {
    return jsonError("Request body must be valid JSON", HTTP_STATUS.badRequest);
  }

  const parseResult = analysisRequestSchema.safeParse(rawBody);
  if (!parseResult.success) {
    const message = formatZodErrorMessages(parseResult.error.issues);
    return jsonError(message, HTTP_STATUS.badRequest);
  }

  const {
    backlog: {
      baseUrl: backlogBaseUrl,
      projectId,
      designDocumentId,
      requirementsDocumentId,
      apiKey: backlogApiKey,
    },
    openAi: { apiKey: openAiApiKey },
  } = parseResult.data;

  const documentId = designDocumentId ?? requirementsDocumentId;

  if (!documentId) {
    return jsonError(
      "Either Design document ID or Requirements document ID is required",
      HTTP_STATUS.badRequest,
    );
  }

  let documentTree: BacklogDocumentTreeNode;
  try {
    documentTree = await fetchBacklogDocumentTree({
      baseUrl: backlogBaseUrl,
      apiKey: backlogApiKey,
      projectIdOrKey: projectId,
      documentId,
    });
  } catch (error) {
    return jsonError(
      getErrorMessage(error, "Failed to retrieve Backlog document tree"),
      HTTP_STATUS.badGateway,
    );
  }

  const prompt = generateDesignReviewPrompt({
    projectId,
    documentTree,
  });

  let analysisContent: string;
  try {
    const analysis = await requestOpenAiAnalysis({
      apiKey: openAiApiKey,
      prompt,
      systemPrompt: DESIGN_REVIEW_SYSTEM_PROMPT,
    });
    analysisContent = analysis.content;
  } catch (error) {
    return jsonError(
      getErrorMessage(error, "Failed to request OpenAI analysis"),
      HTTP_STATUS.badGateway,
    );
  }

  try {
    const result = parseDesignReviewResultResponse(analysisContent);
    return Response.json(result);
  } catch (error) {
    if (error instanceof InvalidAnalysisResultError) {
      return jsonError(error.message, HTTP_STATUS.badGateway);
    }

    return jsonError(
      getErrorMessage(error, "OpenAI response could not be parsed"),
      HTTP_STATUS.badGateway,
    );
  }
}

function jsonError(message: string, status: number): Response {
  const payload: JsonError = { error: message };
  return Response.json(payload, { status });
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function formatZodErrorMessages(issues: ZodIssue[]): string {
  const messages = new Set<string>();

  const collect = (issue: ZodIssue) => {
    if (issue.message) {
      messages.add(issue.message);
    }

    switch (issue.code) {
      case ZodIssueCode.invalid_union: {
        for (const error of issue.unionErrors) {
          for (const nestedIssue of error.issues) {
            collect(nestedIssue);
          }
        }
        break;
      }
      case ZodIssueCode.invalid_arguments: {
        for (const nestedIssue of issue.argumentsError.issues) {
          collect(nestedIssue);
        }
        break;
      }
      case ZodIssueCode.invalid_return_type: {
        for (const nestedIssue of issue.returnTypeError.issues) {
          collect(nestedIssue);
        }
        break;
      }
      default:
        break;
    }
  };

  for (const issue of issues) {
    collect(issue);
  }

  return Array.from(messages).join("; ");
}
