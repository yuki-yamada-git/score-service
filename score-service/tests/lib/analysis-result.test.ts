import { describe, expect, it } from "vitest";

import { parseDesignReviewResultResponse } from "@/app/lib/analysis-result";
import { MOCK_DESIGN_REVIEW_RESULT } from "@/app/lib/sample-review";

describe("parseDesignReviewResultResponse", () => {
  it("returns the design review result when the JSON matches the expected structure", () => {
    const json = JSON.stringify(MOCK_DESIGN_REVIEW_RESULT);

    const result = parseDesignReviewResultResponse(json);

    expect(result).toEqual(MOCK_DESIGN_REVIEW_RESULT);
  });

  it("throws an error when required fields are missing", () => {
    const json = JSON.stringify({});

    expect(() => parseDesignReviewResultResponse(json)).toThrowError(
      "rootDocument field is required in OpenAI response",
    );
  });
});
