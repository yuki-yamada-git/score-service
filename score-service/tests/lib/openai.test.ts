import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";

import { requestOpenAiAnalysis } from "@/app/lib/openai";

describe("requestOpenAiAnalysis", () => {
  const fetchSpy = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchSpy);
  });

  afterEach(() => {
    fetchSpy.mockReset();
    vi.unstubAllGlobals();
  });

  it("calls the OpenAI chat completions endpoint with the provided key and prompt", async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "chatcmpl-123",
        choices: [
          {
            message: {
              role: "assistant",
              content: "analysis result",
            },
          },
        ],
      }),
    });

    const result = await requestOpenAiAnalysis({
      apiKey: "sk-test",
      prompt: "Please analyse",
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.openai.com/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer sk-test",
          "Content-Type": "application/json",
        }),
      }),
    );

    expect(result).toEqual({
      id: "chatcmpl-123",
      content: "analysis result",
    });
  });

  it("throws an error when the OpenAI API responds with a failure status", async () => {
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
    });

    await expect(
      requestOpenAiAnalysis({ apiKey: "sk-test", prompt: "Analyse" }),
    ).rejects.toThrowError(
      "OpenAI API request failed with status 401: Unauthorized",
    );
  });

  it("throws an error when the OpenAI response does not contain a message", async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({ id: "chatcmpl-456", choices: [] }),
    });

    await expect(
      requestOpenAiAnalysis({ apiKey: "sk-test", prompt: "Analyse" }),
    ).rejects.toThrowError("OpenAI API response did not contain a message");
  });
});
