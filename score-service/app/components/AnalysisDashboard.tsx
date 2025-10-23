"use client";

import { useState } from "react";

import { ConfigurationForm } from "@/app/components/ConfigurationForm";
import { DesignReviewResult } from "@/app/components/DesignReviewResult";
import type { DesignReviewResult as DesignReviewResultType } from "@/app/lib/design-review";
import { MOCK_DESIGN_REVIEW_RESULT } from "@/app/lib/sample-review";

export function AnalysisDashboard() {
  const [reviewResult, setReviewResult] = useState<DesignReviewResultType | null>(null);

  const handleStartAnalysis = () => {
    // TODO: OpenAI との連携実装後に、実際のレビュー結果で置き換える。
    setReviewResult(MOCK_DESIGN_REVIEW_RESULT);
  };

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
          <p className="mx-auto max-w-2xl text-base text-slate-300 sm:mx-0">
            Backlog と OpenAI を接続するために必要な情報を入力してください。今は保存や通信は行われませんが、入力内容を JSON
            としてコピーできるので、実装が揃ったときにそのまま利用できます。
          </p>
        </header>

        <ConfigurationForm />

        <footer className="text-center text-xs text-slate-500 sm:text-left">
          入力した情報はこのページ内でのみ保持され、外部へ送信されません。
        </footer>

        <div className="flex justify-center sm:justify-end">
          <button
            type="button"
            className="rounded-lg bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-sky-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            onClick={handleStartAnalysis}
          >
            分析開始
          </button>
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
