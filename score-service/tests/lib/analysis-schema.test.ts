import { describe, expect, it } from "vitest";

import { analysisRequestSchema, analysisResponseSchema } from "@/app/lib/analysis-schema";
import { MOCK_DESIGN_REVIEW_RESULT } from "@/app/lib/sample-review";

describe("analysis schemas", () => {
  it("parses numeric identifier strings into numbers", () => {
    const parsed = analysisRequestSchema.parse({
      backlog: {
        projectId: "00123",
        designDocumentId: 456,
        requirementsDocumentId: "7890",
        apiKey: "backlog-key",
      },
      openAi: {
        apiKey: "openai-key",
      },
    });

    expect(parsed.backlog.projectId).toBe(123);
    expect(parsed.backlog.designDocumentId).toBe(456);
    expect(parsed.backlog.requirementsDocumentId).toBe(7890);
  });

  it("rejects requests when required fields are missing", () => {
    const result = analysisRequestSchema.safeParse({
      backlog: {
        projectId: "100", // missing other required fields
      },
      openAi: {},
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues.map((issue) => issue.message);
      expect(issues).toContain("Design document ID is required");
      expect(issues).toContain("Requirements document ID is required");
      expect(issues).toContain("Backlog API key is required");
      expect(issues).toContain("OpenAI API key is required");
    }
  });

  it("validates analysis responses against the DesignReviewResult schema", () => {
    const parsed = analysisResponseSchema.parse(MOCK_DESIGN_REVIEW_RESULT);

    expect(parsed).toEqual(MOCK_DESIGN_REVIEW_RESULT);
  });
});
