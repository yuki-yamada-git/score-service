/**
 * OpenAI のチャット補完 API を利用して分析をリクエストするユーティリティ。
 * API キーと分析内容を受け取り、OpenAI にリクエストを送信して結果のテキストを返す。
 */
export type RequestOpenAiAnalysisOptions = {
  /** OpenAI の API キー。 */
  apiKey: string;
  /** 分析してほしい内容。 */
  prompt: string;
  /** 任意で指定できるシステムメッセージ。 */
  systemPrompt?: string;
  /** 利用するモデル。省略時は gpt-4o-mini を利用する。 */
  model?: string;
};

export type OpenAiAnalysisResult = {
  /** OpenAI が返すリクエスト ID。 */
  id: string;
  /** アシスタントからの応答テキスト。 */
  content: string;
};

type OpenAiChatCompletionResponse = {
  id: string;
  choices?: Array<{
    message?: {
      role?: string;
      content?: string | null;
    };
  }>;
};

const OPENAI_CHAT_COMPLETIONS_ENDPOINT = "https://api.openai.com/v1/chat/completions";

/**
 * OpenAI に分析を依頼し、返却されたテキストを取得する。
 *
 * @throws API キーが空の場合や、OpenAI からエラーが返された場合は例外を投げる。
 */
export async function requestOpenAiAnalysis({
  apiKey,
  prompt,
  systemPrompt,
  model = "gpt-4o-mini",
}: RequestOpenAiAnalysisOptions): Promise<OpenAiAnalysisResult> {
  if (!apiKey) {
    throw new Error("OpenAI API key is required");
  }

  const messages = [
    ...(systemPrompt
      ? [{ role: "system" as const, content: systemPrompt }]
      : []),
    { role: "user" as const, content: prompt },
  ];

  const response = await fetch(OPENAI_CHAT_COMPLETIONS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0,
    }),
  });

  if (!response.ok) {
    const statusText = response.statusText || "Unknown error";
    throw new Error(
      `OpenAI API request failed with status ${response.status}: ${statusText}`,
    );
  }

  const payload = (await response.json()) as OpenAiChatCompletionResponse;
  const content = payload.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("OpenAI API response did not contain a message");
  }

  return {
    id: payload.id,
    content,
  };
}
