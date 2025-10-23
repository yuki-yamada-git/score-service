import { NextResponse } from "next/server";

import { MOCK_DESIGN_REVIEW_RESULT } from "@/app/lib/sample-review";

type AnalysisRequestPayload = {
  configuration?: Record<string, unknown>;
  preview?: unknown;
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as AnalysisRequestPayload;

    if (!payload || typeof payload !== "object") {
      return NextResponse.json(
        { error: "Invalid request payload" },
        { status: 400 },
      );
    }

    // TODO: Backlog / OpenAI 連携の実装が揃い次第、ここで実際のスコアリングを行う。
    return NextResponse.json({ result: MOCK_DESIGN_REVIEW_RESULT });
  } catch (error) {
    console.error("Failed to parse analysis request", error);
    return NextResponse.json(
      { error: "Unable to parse request body" },
      { status: 400 },
    );
  }
}
