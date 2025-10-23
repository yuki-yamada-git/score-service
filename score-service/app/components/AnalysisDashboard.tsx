"use client";

import React, { useCallback, useState } from "react";

import { ConfigurationForm } from "@/app/components/ConfigurationForm";
import { DesignReviewResult } from "@/app/components/DesignReviewResult";
import {
  INITIAL_VALUES,
  type ConfigurationFieldId,
} from "@/app/lib/configuration-form";
import type { DesignReviewResult as DesignReviewResultType } from "@/app/lib/design-review";

type ConfigurationValues = Record<ConfigurationFieldId, string>;

const GENERIC_ERROR_MESSAGE = "分析に失敗しました。時間を置いて再度お試しください。";
const DOCUMENT_ID_REQUIRED_MESSAGE =
  "設計書 ID または要件定義書 ID のいずれかを入力してください。";

export function AnalysisDashboard() {
  const [configurationValues, setConfigurationValues] = useState<ConfigurationValues>({
    ...INITIAL_VALUES,
  });
  const [reviewResult, setReviewResult] = useState<DesignReviewResultType | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleConfigurationChange = useCallback((nextValues: ConfigurationValues) => {
    setConfigurationValues({ ...nextValues });
  }, []);

  const handleStartAnalysis = useCallback(async () => {
    if (isAnalyzing) {
      return;
    }

    const backlogProjectId = configurationValues.backlogProjectId.trim();
    const designDocumentId = configurationValues.designDocumentId.trim();
    const requirementsDocumentId =
      configurationValues.requirementsDocumentId.trim();
    const hasDesignDocumentId = designDocumentId.length > 0;
    const hasRequirementsDocumentId = requirementsDocumentId.length > 0;

    setErrorMessage(null);

    if (!hasDesignDocumentId && !hasRequirementsDocumentId) {
      setErrorMessage(DOCUMENT_ID_REQUIRED_MESSAGE);
      setReviewResult(null);
      return;
    }

    setIsAnalyzing(true);

    try {
      const backlogPayload: {
        baseUrl: string;
        projectId: string;
        apiKey: string;
        designDocumentId?: string;
        requirementsDocumentId?: string;
      } = {
        baseUrl: configurationValues.backlogBaseUrl,
        projectId: backlogProjectId,
        apiKey: configurationValues.backlogApiKey,
      };

      if (hasDesignDocumentId) {
        backlogPayload.designDocumentId = designDocumentId;
      }

      if (hasRequirementsDocumentId) {
        backlogPayload.requirementsDocumentId = requirementsDocumentId;
      }

      const response = await fetch("/api/analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          backlog: backlogPayload,
          openAi: {
            apiKey: configurationValues.openAiApiKey,
          },
        }),
      });

      if (!response.ok) {
        let message = GENERIC_ERROR_MESSAGE;

        try {
          const payload = (await response.json()) as { error?: unknown };
          if (payload && typeof payload.error === "string" && payload.error.trim()) {
            message = payload.error;
          }
        } catch (parseError) {
          console.error("Failed to parse analysis error response", parseError);
        }

        setErrorMessage(message);
        setReviewResult(null);
        return;
      }

      const payload = (await response.json()) as {
        result?: DesignReviewResultType;
      };

      if (!payload?.result) {
        throw new Error("Analysis result was not found in the response body");
      }

      setReviewResult(payload.result);
      setErrorMessage(null);
    } catch (error) {
      console.error("Failed to start analysis", error);
      setReviewResult(null);
      setErrorMessage(GENERIC_ERROR_MESSAGE);
      setReviewResult(null);
    } finally {
      setIsAnalyzing(false);
    }
  }, [configurationValues, isAnalyzing]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-12 px-6 py-12 lg:px-12">
        <header className="space-y-4 text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-sky-400">
            Score Service
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-50 sm:text-5xl">
            連携設定のセットアップ
          </h1>
        </header>

        <ConfigurationForm
          onValuesChange={handleConfigurationChange}
          initialValues={configurationValues}
        />

        <footer className="text-center text-xs text-slate-500 sm:text-left">
          入力した情報はこのページ内でのみ保持され、外部へ送信されません。
        </footer>

        <div className="space-y-3">
          {errorMessage ? (
            <div
              role="alert"
              className="rounded-lg border border-rose-500/50 bg-rose-500/10 px-4 py-3 text-sm text-rose-100"
            >
              {errorMessage}
            </div>
          ) : null}

          <div className="flex justify-center sm:justify-end">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-lg bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-sky-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
              onClick={handleStartAnalysis}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <span className="flex items-center gap-2">
                  <svg
                    aria-hidden
                    className="h-4 w-4 animate-spin text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  分析中...
                </span>
              ) : (
                "分析開始"
              )}
            </button>
          </div>
        </div>

        <div className="pb-8">
          {reviewResult ? (
            <DesignReviewResult result={reviewResult} />
          ) : (
            <section className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-8 text-center text-sm text-slate-400">
              ChatGPT へのレビュー依頼結果がここに表示されます。上部の設定を入力し「分析開始」を押すと、サンプルのレビュー結果が表示されます。
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
