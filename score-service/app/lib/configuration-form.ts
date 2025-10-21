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
