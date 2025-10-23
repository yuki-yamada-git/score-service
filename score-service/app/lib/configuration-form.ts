/**
 * 連携設定フォームで使用するフィールド ID の列挙。
 * UI とロジックの両方で共有するため、ここに集約している。
 */
export type ConfigurationFieldId =
  | "backlogProjectId"
  | "designDocumentId"
  | "requirementsDocumentId"
  | "backlogApiKey"
  | "openAiApiKey";

/**
 * フィールドのラベルやプレースホルダーなど、表示に必要な情報の定義。
 */
export type FieldDefinition = {
  id: ConfigurationFieldId;
  label: string;
  placeholder?: string;
  description?: string;
  type?: "text" | "password";
  autoComplete?: string;
};

/**
 * フォームで入力された値から組み立てるプレビュー用の JSON 構造。
 */
export type PreviewState = {
  backlog: {
    projectId?: string;
    designDocumentId?: string;
    requirementsDocumentId?: string;
    apiKey?: string;
  };
  openAi: {
    apiKey?: string;
  };
};

/**
 * フォームで使用するフィールドの定義一覧。
 * UI とプレビュー生成の両方で共通利用する。
 */
export const FIELD_DEFINITIONS: FieldDefinition[] = [
  {
    id: "backlogProjectId",
    label: "Backlog の Project ID",
    placeholder: "例: 123456",
    description: "Backlog で対象プロジェクトを一意に識別する ID を入力します。",
  },
  {
    id: "designDocumentId",
    label: "設計書の ID",
    placeholder: "例: 987654321",
    description: "Backlog 上の設計書ページの ID を入力してください。",
  },
  {
    id: "requirementsDocumentId",
    label: "要件定義書の ID",
    placeholder: "例: 192837465",
    description: "Backlog 上の要件定義書ページの ID を入力してください。",
  },
  {
    id: "backlogApiKey",
    label: "Backlog API Key",
    placeholder: "例: abcdef1234567890",
    description: "Backlog の個人設定から発行できる API キーです。",
    type: "password",
    autoComplete: "off",
  },
  {
    id: "openAiApiKey",
    label: "OpenAI API Key",
    placeholder: "例: sk-...",
    description: "OpenAI の管理画面から取得した API キーを入力してください。",
    type: "password",
    autoComplete: "off",
  },
];

/**
 * 各フィールドの初期値を生成する。
 * 値はフォームの状態リセット時にも再利用する。
 */
export const INITIAL_VALUES = FIELD_DEFINITIONS.reduce(
  (values, field) => {
    values[field.id] = "";
    return values;
  },
  {} as Record<ConfigurationFieldId, string>,
);

/**
 * 入力値からプレビュー表示用の JSON を組み立てる。
 * 空の値は含めず、入力済みの項目のみ出力する。
 */
export function buildPreview(values: Record<ConfigurationFieldId, string>): PreviewState {
  const backlog: PreviewState["backlog"] = {};
  const openAi: PreviewState["openAi"] = {};

  if (values.backlogProjectId) {
    backlog.projectId = values.backlogProjectId;
  }

  if (values.designDocumentId) {
    backlog.designDocumentId = values.designDocumentId;
  }

  if (values.requirementsDocumentId) {
    backlog.requirementsDocumentId = values.requirementsDocumentId;
  }

  if (values.backlogApiKey) {
    backlog.apiKey = values.backlogApiKey;
  }

  if (values.openAiApiKey) {
    openAi.apiKey = values.openAiApiKey;
  }

  return { backlog, openAi };
}

/**
 * JSON テキストをフォームの入力値に変換する。
 * 想定外の構造や値が与えられた場合は null を返す。
 */
export function parseConfigurationJson(
  jsonText: string,
): Record<ConfigurationFieldId, string> | null {
  let parsed: unknown;

  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return null;
  }

  if (typeof parsed !== "object" || parsed === null) {
    return null;
  }

  const result: Record<ConfigurationFieldId, string> = {
    ...INITIAL_VALUES,
  };
  let hasAnyValue = false;

  const backlog = (parsed as { backlog?: unknown }).backlog;
  if (typeof backlog === "object" && backlog !== null) {
    const backlogRecord = backlog as Record<string, unknown>;

    hasAnyValue =
      assignIfValidValue(result, "backlogProjectId", backlogRecord.projectId) || hasAnyValue;
    hasAnyValue =
      assignIfValidValue(result, "designDocumentId", backlogRecord.designDocumentId) || hasAnyValue;
    hasAnyValue =
      assignIfValidValue(result, "requirementsDocumentId", backlogRecord.requirementsDocumentId) ||
      hasAnyValue;
    hasAnyValue = assignIfValidValue(result, "backlogApiKey", backlogRecord.apiKey) || hasAnyValue;
  } else if (backlog !== undefined) {
    return null;
  }

  const openAi = (parsed as { openAi?: unknown }).openAi;
  if (typeof openAi === "object" && openAi !== null) {
    const openAiRecord = openAi as Record<string, unknown>;

    hasAnyValue = assignIfValidValue(result, "openAiApiKey", openAiRecord.apiKey) || hasAnyValue;
  } else if (openAi !== undefined) {
    return null;
  }

  const hasRecognizedSection =
    (typeof backlog === "object" && backlog !== null) ||
    (typeof openAi === "object" && openAi !== null);

  if (!hasAnyValue && !hasRecognizedSection) {
    return null;
  }

  return result;
}

function assignIfValidValue(
  values: Record<ConfigurationFieldId, string>,
  fieldId: ConfigurationFieldId,
  source: unknown,
): boolean {
  if (source === undefined || source === null) {
    return false;
  }

  if (typeof source === "string") {
    values[fieldId] = source;
    return true;
  }

  if (typeof source === "number" || typeof source === "boolean") {
    values[fieldId] = String(source);
    return true;
  }

  return false;
}
