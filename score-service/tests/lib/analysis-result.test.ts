import { describe, expect, it } from "vitest";

import { parseDesignReviewResultResponse } from "@/app/lib/analysis-result";
import { MOCK_DESIGN_REVIEW_RESULT } from "@/app/lib/sample-review";

describe("parseDesignReviewResultResponse", () => {
  it("returns the design review result when the JSON matches the expected structure", () => {
    const json = JSON.stringify(MOCK_DESIGN_REVIEW_RESULT);

    const result = parseDesignReviewResultResponse(json);

    expect(result).toEqual(MOCK_DESIGN_REVIEW_RESULT);
  });

  it("trims surrounding whitespace from string fields", () => {
    const raw = JSON.parse(JSON.stringify(MOCK_DESIGN_REVIEW_RESULT));

    raw.rootDocument.documentTitle = `  ${raw.rootDocument.documentTitle}  `;
    raw.rootDocument.overallEvaluation.summary = `\n${raw.rootDocument.overallEvaluation.summary}   `;
    raw.rootDocument.sectionEvaluations[0].title = ` ${raw.rootDocument.sectionEvaluations[0].title}\t`;
    raw.rootDocument.sectionEvaluations[0].highlights[0] = `  ${raw.rootDocument.sectionEvaluations[0].highlights[0]}  `;
    raw.rootDocument.improvementSuggestions[0].description = `\n${raw.rootDocument.improvementSuggestions[0].description}  `;

    const json = JSON.stringify(raw);

    const result = parseDesignReviewResultResponse(json);

    expect(result).toEqual(MOCK_DESIGN_REVIEW_RESULT);
  });

  it("throws an error when required fields are missing", () => {
    const json = JSON.stringify({});

    expect(() => parseDesignReviewResultResponse(json)).toThrowError(
      "rootDocument field is required in OpenAI response",
    );
  });

  it("throws an error when string fields are blank", () => {
    const raw = JSON.parse(JSON.stringify(MOCK_DESIGN_REVIEW_RESULT));
    raw.rootDocument.documentTitle = "   ";

    const json = JSON.stringify(raw);

    expect(() => parseDesignReviewResultResponse(json)).toThrowError(
      "rootDocument.documentTitle must be a non-empty string",
    );
  });
});
