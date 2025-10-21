"use client";

import { useMemo, useState } from "react";

type FieldId =
  | "backlogProjectId"
  | "designDocumentId"
  | "requirementsDocumentId"
  | "backlogApiKey"
  | "openAiApiKey";

type FieldDefinition = {
  id: FieldId;
  label: string;
  placeholder?: string;
  description?: string;
  type?: "text" | "password";
  autoComplete?: string;
};

type PreviewState = {
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

const FIELD_DEFINITIONS: FieldDefinition[] = [
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

const INITIAL_VALUES = FIELD_DEFINITIONS.reduce(
  (values, field) => {
    values[field.id] = "";
    return values;
  },
  {} as Record<FieldId, string>,
);

export function ConfigurationForm() {
  const [values, setValues] = useState<Record<FieldId, string>>(INITIAL_VALUES);
  const [hasCopied, setHasCopied] = useState(false);

  const preview = useMemo<PreviewState>(() => {
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
  }, [values]);

  const handleChange = (fieldId: FieldId, nextValue: string) => {
    setValues((current) => ({
      ...current,
      [fieldId]: nextValue,
    }));
  };

  const handleReset = () => {
    setValues(INITIAL_VALUES);
    setHasCopied(false);
  };

  const handleCopy = async () => {
    const text = JSON.stringify(preview, null, 2);

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "true");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy configuration", error);
      setHasCopied(false);
    }
  };

  return (
    <section className="space-y-10 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg ring-1 ring-white/5 backdrop-blur">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-slate-100">連携情報の入力</h2>
        <p className="text-sm text-slate-400">
          下記の項目を入力すると、下部のプレビューが自動的に更新されます。
        </p>
      </div>

      <form className="grid gap-6" onSubmit={(event) => event.preventDefault()}>
        {FIELD_DEFINITIONS.map((field) => (
          <label key={field.id} className="group grid gap-2">
            <span className="text-sm font-medium text-slate-200">{field.label}</span>
            <input
              id={field.id}
              autoComplete={field.autoComplete}
              className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 group-hover:border-slate-600"
              onChange={(event) => handleChange(field.id, event.target.value)}
              placeholder={field.placeholder}
              type={field.type ?? "text"}
              value={values[field.id]}
            />
            {field.description ? (
              <span className="text-xs text-slate-400">{field.description}</span>
            ) : null}
          </label>
        ))}

        <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg border border-transparent bg-slate-800 px-5 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700"
            onClick={handleReset}
          >
            クリア
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg border border-sky-500/70 bg-sky-500 px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 focus:ring-offset-slate-950"
            onClick={handleCopy}
          >
            JSON をコピー
          </button>
          {hasCopied ? (
            <span className="text-xs font-medium text-emerald-400">コピーしました</span>
          ) : null}
        </div>
      </form>

      <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/80 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">プレビュー</h3>
          <span className="text-xs text-slate-500">JSON</span>
        </div>
        <pre className="max-h-60 overflow-auto rounded-lg bg-slate-950/60 p-4 text-xs leading-relaxed text-slate-300 shadow-inner">
          {JSON.stringify(preview, null, 2)}
        </pre>
      </div>
    </section>
  );
}
