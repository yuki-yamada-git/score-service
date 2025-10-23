import { DESIGN_REVIEW_SYSTEM_PROMPT } from "@/app/lib/design-review-prompt";
import {
  InvalidAnalysisResultError,
  parseDesignReviewResultResponse,
} from "@/app/lib/analysis-result";
import { requestOpenAiAnalysis } from "@/app/lib/openai";

type DesignReviewRequestPayload = {
  apiKey?: string;
  prompt?: string;
  model?: string;
};

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  if (typeof payload !== "object" || payload === null) {
    return Response.json({ error: "Request body must be an object" }, { status: 400 });
  }

  const { apiKey, prompt, model } = payload as DesignReviewRequestPayload;

  if (typeof apiKey !== "string" || !apiKey.trim()) {
    return Response.json({ error: "apiKey is required" }, { status: 400 });
  }

  if (typeof prompt !== "string" || !prompt.trim()) {
    return Response.json({ error: "prompt is required" }, { status: 400 });
  }

  const sanitizedModel =
    typeof model === "string" && model.trim().length > 0 ? model.trim() : undefined;

  try {
    const { id, content } = await requestOpenAiAnalysis({
      apiKey: apiKey.trim(),
      prompt: prompt.trim(),
      systemPrompt: DESIGN_REVIEW_SYSTEM_PROMPT,
      model: sanitizedModel,
    });

    const result = parseDesignReviewResultResponse(content);

    return Response.json({ id, result });
  } catch (error) {
    if (error instanceof InvalidAnalysisResultError) {
      return Response.json({ error: error.message }, { status: 422 });
    }

    const message = error instanceof Error ? error.message : "Unknown error";

    return Response.json({ error: message }, { status: 502 });
  }
}
