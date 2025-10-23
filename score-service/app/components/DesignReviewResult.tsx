import type { DesignReviewResult } from "@/app/lib/design-review";

type DesignReviewResultProps = {
  result: DesignReviewResult;
};

export function DesignReviewResult({ result }: DesignReviewResultProps) {
  return (
    <section className="space-y-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg ring-1 ring-white/5">
      <header className="space-y-4">
        <nav aria-label="ドキュメントの場所">
          <ol className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            {result.breadcrumbs.map((breadcrumb, index) => (
              <li key={breadcrumb.label} className="flex items-center gap-2">
                {index > 0 ? <span className="text-slate-600">&gt;</span> : null}
                {breadcrumb.href ? (
                  <a
                    href={breadcrumb.href}
                    className="rounded px-1 py-0.5 text-slate-300 transition hover:bg-slate-800 hover:text-slate-100"
                  >
                    {breadcrumb.label}
                  </a>
                ) : (
                  <span>{breadcrumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-300">設計書レビュー</p>
            <h2 className="text-2xl font-semibold text-slate-50 sm:text-3xl">
              {result.documentTitle}
            </h2>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="rounded-xl border border-slate-700 bg-slate-950/70 px-6 py-4 text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">総点数</p>
              <p className="text-3xl font-bold text-sky-400">
                {result.totalScore.value}
                <span className="ml-1 text-base font-medium text-slate-500">
                  /{result.totalScore.max}
                </span>
              </p>
            </div>

            <div className="max-w-xs space-y-1 rounded-xl border border-slate-700 bg-slate-950/70 px-6 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">総評価</p>
              <p className="text-sm font-semibold text-amber-300">{result.overallEvaluation.ratingLabel}</p>
              <p className="text-xs text-slate-300">{result.overallEvaluation.summary}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-slate-100">項目別評価</h3>
        <div className="grid gap-4">
          {result.sectionEvaluations.map((section) => (
            <article
              key={section.id}
              className="space-y-4 rounded-xl border border-slate-800 bg-slate-950/70 p-5"
            >
              <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-base font-semibold text-slate-100">{section.title}</h4>
                  <p className="text-sm text-slate-300">{section.summary}</p>
                </div>
                <div className="rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-2 text-center">
                  <p className="text-[0.7rem] uppercase tracking-[0.3em] text-slate-500">Score</p>
                  <p className="text-lg font-bold text-sky-300">
                    {section.score.value}
                    <span className="ml-1 text-xs font-medium text-slate-500">
                      /{section.score.max}
                    </span>
                  </p>
                </div>
              </header>

              <ul className="space-y-2 text-sm text-slate-300">
                {section.highlights.map((highlight, index) => (
                  <li key={`${section.id}-highlight-${index}`} className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-sky-400" aria-hidden />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-100">改善提案</h3>
        <div className="grid gap-3">
          {result.improvementSuggestions.map((suggestion) => (
            <article
              key={suggestion.title}
              className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/70 p-5"
            >
              <h4 className="text-base font-semibold text-slate-200">
                {suggestion.title}
              </h4>
              <p className="text-sm text-slate-300">{suggestion.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
