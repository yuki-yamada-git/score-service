"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  FIELD_DEFINITIONS,
  INITIAL_VALUES,
  type ConfigurationFieldId,
  type PreviewState,
  buildPreview,
  parseConfigurationJson,
} from "@/app/lib/configuration-form";
import { copyTextToClipboard } from "@/app/lib/copy-to-clipboard";

type ConfigurationFormProps = {
  /**
   * フォーム内で保持している値が更新された際に呼び出されるコールバック。
   * プレビューの表示だけでなく、親コンポーネントからも入力値を参照できるようにする。
   */
  onValuesChange?: (values: Record<ConfigurationFieldId, string>) => void;
};

const IMPORT_PLACEHOLDER = `{
  "backlog": {
    ...
  },
  "openAi": {
    ...
  }
}`;

export function ConfigurationForm({ onValuesChange }: ConfigurationFormProps) {
  const [values, setValues] = useState<Record<ConfigurationFieldId, string>>({
    ...INITIAL_VALUES,
  });
  const [hasCopied, setHasCopied] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const importTextAreaRef = useRef<HTMLTextAreaElement | null>(null);

  // フォームで管理している値からプレビュー用の JSON を生成する。
  const preview = useMemo<PreviewState>(() => buildPreview(values), [values]);

  useEffect(() => {
    if (!onValuesChange) {
      return;
    }

    onValuesChange({ ...values });
  }, [onValuesChange, values]);

  // 各入力フィールドの変更を受け取り、対応する値を更新する。
  const handleChange = (fieldId: ConfigurationFieldId, nextValue: string) => {
    setValues((current) => ({
      ...current,
      [fieldId]: nextValue,
    }));
  };

  // 入力値とコピー状態を初期化する。
  const handleReset = () => {
    setValues({ ...INITIAL_VALUES });
    setHasCopied(false);
    setImportError(null);
    setImportText("");
    setIsImportOpen(false);
  };

  const handleCopy = async () => {
    // プレビュー内容をテキスト化し、クリップボードへのコピー結果を表示に反映する。
    const text = JSON.stringify(preview, null, 2);
    const copied = await copyTextToClipboard(text);

    if (copied) {
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
      return;
    }

    setHasCopied(false);
  };

  const handleToggleImport = () => {
    setIsImportOpen((current) => {
      const next = !current;

      if (!next) {
        setImportText("");
        setImportError(null);
      }

      return next;
    });

    // インポートパネルを開いたときにテキストエリアへフォーカスする。
    if (!isImportOpen) {
      if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
        window.requestAnimationFrame(() => {
          importTextAreaRef.current?.focus();
        });
        return;
      }

      importTextAreaRef.current?.focus();
    }
  };

  const handleImport = () => {
    if (!importText.trim()) {
      setImportError("JSON を入力してください。");
      return;
    }

    const nextValues = parseConfigurationJson(importText);

    if (!nextValues) {
      setImportError("JSON の内容を読み取れませんでした。形式を確認してください。");
      return;
    }

    setValues(nextValues);
    setHasCopied(false);
    setImportError(null);
    setImportText("");
    setIsImportOpen(false);
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

        <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg border border-transparent bg-slate-800 px-5 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700"
            onClick={handleReset}
          >
            クリア
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg border border-sky-500/70 bg-slate-900 px-5 py-2 text-sm font-semibold text-sky-400 transition hover:bg-slate-900/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 focus:ring-offset-slate-950"
            onClick={handleToggleImport}
          >
            JSON をインポート
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
          {importError && !isImportOpen ? (
            <span className="text-xs font-medium text-rose-400 sm:basis-full sm:text-right">
              {importError}
            </span>
          ) : null}
        </div>

        {isImportOpen ? (
          <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/80 p-4">
            <label className="grid gap-2" htmlFor="configuration-import-json">
              <span className="text-xs font-medium text-slate-300">
                コピーした JSON を貼り付けてください
              </span>
              <textarea
                id="configuration-import-json"
                ref={importTextAreaRef}
                className="h-40 w-full rounded-lg border border-slate-700 bg-slate-900/80 px-4 py-3 text-xs text-slate-100 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
                placeholder={IMPORT_PLACEHOLDER}
                spellCheck={false}
                value={importText}
                onChange={(event) => {
                  setImportText(event.target.value);
                  if (importError) {
                    setImportError(null);
                  }
                }}
              />
            </label>
            {importError ? (
              <span className="text-xs font-medium text-rose-400">{importError}</span>
            ) : null}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg border border-transparent bg-slate-800 px-5 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700"
                onClick={handleToggleImport}
              >
                キャンセル
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg border border-sky-500/70 bg-sky-500 px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 focus:ring-offset-slate-950"
                onClick={handleImport}
              >
                読み込む
              </button>
            </div>
          </div>
        ) : null}
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
