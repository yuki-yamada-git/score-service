import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchBacklogDocumentTree = vi.fn();
const generateDesignReviewPrompt = vi.fn();
const requestOpenAiAnalysis = vi.fn();
const mockSystemPrompt = "system-prompt";

vi.mock("@/app/lib/backlog", () => ({
  fetchBacklogDocumentTree,
}));

vi.mock("@/app/lib/design-review-prompt", () => ({
  DESIGN_REVIEW_SYSTEM_PROMPT: mockSystemPrompt,
  generateDesignReviewPrompt,
}));

vi.mock("@/app/lib/openai", () => ({
  requestOpenAiAnalysis,
}));

import type { BacklogDocumentTreeNode } from "@/app/lib/backlog";
import type { DesignReviewResult } from "@/app/lib/design-review";
import { MOCK_DESIGN_REVIEW_RESULT } from "@/app/lib/sample-review";
import { POST } from "@/app/api/analysis/route";

describe("POST /api/analysis", () => {
  const sampleTree: BacklogDocumentTreeNode = {
    id: 101,
    projectId: 42,
    name: "Root Document",
    content: "Root content",
    children: [],
  };

  const createRequest = (body: unknown) =>
    new Request("http://localhost/api/analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

  beforeEach(() => {
    process.env.BACKLOG_BASE_URL = "https://example.backlog.com";
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete process.env.BACKLOG_BASE_URL;
  });

  it("returns the design review result when analysis succeeds", async () => {
    fetchBacklogDocumentTree.mockResolvedValue(sampleTree);
    generateDesignReviewPrompt.mockReturnValue("Prompt text");
    requestOpenAiAnalysis.mockResolvedValue({
      id: "analysis-123",
      content: JSON.stringify(MOCK_DESIGN_REVIEW_RESULT as DesignReviewResult),
    });

    const response = await POST(
      createRequest({
        backlog: {
          projectId: "42",
          designDocumentId: "101",
          requirementsDocumentId: "202",
          apiKey: "backlog-key",
        },
        openAi: {
          apiKey: "openai-key",
        },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(MOCK_DESIGN_REVIEW_RESULT);

    expect(fetchBacklogDocumentTree).toHaveBeenCalledWith({
      baseUrl: "https://example.backlog.com",
      apiKey: "backlog-key",
      documentId: 101,
    });

    expect(generateDesignReviewPrompt).toHaveBeenCalledWith({
      projectId: 42,
      documentTree: sampleTree,
    });

    expect(requestOpenAiAnalysis).toHaveBeenCalledWith({
      apiKey: "openai-key",
      prompt: "Prompt text",
      systemPrompt: mockSystemPrompt,
    });
  });

  it("returns 400 when the request body is invalid", async () => {
    const response = await POST(
      createRequest({
        backlog: {
          projectId: "101",
        },
        openAi: {},
      }),
    );

    expect(response.status).toBe(400);
    const payload = (await response.json()) as { error: string };
    expect(payload.error).toContain("Design document ID is required");
    expect(payload.error).toContain("Requirements document ID is required");
    expect(payload.error).toContain("Backlog API key is required");
    expect(payload.error).toContain("OpenAI API key is required");
  });

  it("returns 502 when fetching the Backlog document tree fails", async () => {
    fetchBacklogDocumentTree.mockRejectedValue(
      new Error("Backlog API request failed"),
    );

    const response = await POST(
      createRequest({
        backlog: {
          projectId: 42,
          designDocumentId: 101,
          requirementsDocumentId: 202,
          apiKey: "backlog-key",
        },
        openAi: {
          apiKey: "openai-key",
        },
      }),
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: "Backlog API request failed",
    });
  });

  it("returns 502 when the OpenAI request fails", async () => {
    fetchBacklogDocumentTree.mockResolvedValue(sampleTree);
    generateDesignReviewPrompt.mockReturnValue("Prompt text");
    requestOpenAiAnalysis.mockRejectedValue(new Error("OpenAI error"));

    const response = await POST(
      createRequest({
        backlog: {
          projectId: 42,
          designDocumentId: 101,
          requirementsDocumentId: 202,
          apiKey: "backlog-key",
        },
        openAi: {
          apiKey: "openai-key",
        },
      }),
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({ error: "OpenAI error" });
  });

  it("returns 502 when the OpenAI response is not valid JSON", async () => {
    fetchBacklogDocumentTree.mockResolvedValue(sampleTree);
    generateDesignReviewPrompt.mockReturnValue("Prompt text");
    requestOpenAiAnalysis.mockResolvedValue({
      id: "analysis-123",
      content: "not json",
    });

    const response = await POST(
      createRequest({
        backlog: {
          projectId: 42,
          designDocumentId: 101,
          requirementsDocumentId: 202,
          apiKey: "backlog-key",
        },
        openAi: {
          apiKey: "openai-key",
        },
      }),
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: "OpenAI response must be valid JSON",
    });
  });

  it("returns 500 when the Backlog base URL is not configured", async () => {
    delete process.env.BACKLOG_BASE_URL;

    const response = await POST(
      createRequest({
        backlog: {
          projectId: 42,
          designDocumentId: 101,
          requirementsDocumentId: 202,
          apiKey: "backlog-key",
        },
        openAi: {
          apiKey: "openai-key",
        },
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Environment variable BACKLOG_BASE_URL is required",
    });
  });
});
