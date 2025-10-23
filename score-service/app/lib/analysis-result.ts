import type {
  DesignReviewBreadcrumb,
  DesignReviewDocumentResult,
  DesignReviewImprovement,
  DesignReviewResult,
  DesignReviewScore,
  DesignReviewSection,
} from "@/app/lib/design-review";

export class InvalidAnalysisResultError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidAnalysisResultError";
  }
}

export function parseDesignReviewResultResponse(content: string): DesignReviewResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch {
    throw new InvalidAnalysisResultError("OpenAI response must be valid JSON");
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new InvalidAnalysisResultError("OpenAI response JSON must be an object");
  }

  const rootDocument = (parsed as { rootDocument?: unknown }).rootDocument;

  if (!rootDocument || typeof rootDocument !== "object") {
    throw new InvalidAnalysisResultError("rootDocument field is required in OpenAI response");
  }

  return {
    rootDocument: parseDocumentResult(rootDocument, "rootDocument"),
  };
}

function parseDocumentResult(value: unknown, path: string): DesignReviewDocumentResult {
  if (typeof value !== "object" || value === null) {
    throw new InvalidAnalysisResultError(`${path} must be an object`);
  }

  const record = value as Record<string, unknown>;

  return {
    id: expectString(record.id, `${path}.id`),
    documentTitle: expectString(record.documentTitle, `${path}.documentTitle`),
    breadcrumbs: parseBreadcrumbs(record.breadcrumbs, `${path}.breadcrumbs`),
    totalScore: parseScore(record.totalScore, `${path}.totalScore`),
    overallEvaluation: parseOverallEvaluation(record.overallEvaluation, `${path}.overallEvaluation`),
    sectionEvaluations: parseSectionEvaluations(record.sectionEvaluations, `${path}.sectionEvaluations`),
    improvementSuggestions: parseImprovements(
      record.improvementSuggestions,
      `${path}.improvementSuggestions`,
    ),
    childDocuments: parseChildDocuments(record.childDocuments, `${path}.childDocuments`),
  };
}

function parseBreadcrumbs(value: unknown, path: string): DesignReviewBreadcrumb[] {
  const array = expectArray(value, path);

  return array.map((item, index) => {
    if (typeof item !== "object" || item === null) {
      throw new InvalidAnalysisResultError(`${path}[${index}] must be an object`);
    }

    const record = item as Record<string, unknown>;

    const breadcrumb: DesignReviewBreadcrumb = {
      label: expectString(record.label, `${path}[${index}].label`),
    };

    if (record.href !== undefined) {
      breadcrumb.href = expectString(record.href, `${path}[${index}].href`);
    }

    return breadcrumb;
  });
}

function parseScore(value: unknown, path: string): DesignReviewScore {
  if (typeof value !== "object" || value === null) {
    throw new InvalidAnalysisResultError(`${path} must be an object`);
  }

  const record = value as Record<string, unknown>;

  return {
    value: expectNumber(record.value, `${path}.value`),
    max: expectNumber(record.max, `${path}.max`),
  };
}

function parseOverallEvaluation(
  value: unknown,
  path: string,
): DesignReviewDocumentResult["overallEvaluation"] {
  if (typeof value !== "object" || value === null) {
    throw new InvalidAnalysisResultError(`${path} must be an object`);
  }

  const record = value as Record<string, unknown>;

  return {
    ratingLabel: expectString(record.ratingLabel, `${path}.ratingLabel`),
    summary: expectString(record.summary, `${path}.summary`),
  };
}

function parseSectionEvaluations(value: unknown, path: string): DesignReviewSection[] {
  const array = expectArray(value, path);

  return array.map((item, index) => {
    if (typeof item !== "object" || item === null) {
      throw new InvalidAnalysisResultError(`${path}[${index}] must be an object`);
    }

    const record = item as Record<string, unknown>;

    return {
      id: expectString(record.id, `${path}[${index}].id`),
      title: expectString(record.title, `${path}[${index}].title`),
      score: parseScore(record.score, `${path}[${index}].score`),
      summary: expectString(record.summary, `${path}[${index}].summary`),
      highlights: parseStringArray(record.highlights, `${path}[${index}].highlights`),
    };
  });
}

function parseImprovements(value: unknown, path: string): DesignReviewImprovement[] {
  const array = expectArray(value, path);

  return array.map((item, index) => {
    if (typeof item !== "object" || item === null) {
      throw new InvalidAnalysisResultError(`${path}[${index}] must be an object`);
    }

    const record = item as Record<string, unknown>;

    return {
      title: expectString(record.title, `${path}[${index}].title`),
      description: expectString(record.description, `${path}[${index}].description`),
    };
  });
}

function parseChildDocuments(value: unknown, path: string): DesignReviewDocumentResult[] {
  const array = expectArray(value, path);

  return array.map((item, index) => parseDocumentResult(item, `${path}[${index}]`));
}

function parseStringArray(value: unknown, path: string): string[] {
  const array = expectArray(value, path);

  return array.map((item, index) => expectString(item, `${path}[${index}]`));
}

function expectArray(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new InvalidAnalysisResultError(`${path} must be an array`);
  }

  return value;
}

function expectString(value: unknown, path: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new InvalidAnalysisResultError(`${path} must be a non-empty string`);
  }

  return value;
}

function expectNumber(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new InvalidAnalysisResultError(`${path} must be a number`);
  }

  return value;
}
