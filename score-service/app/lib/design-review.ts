export type DesignReviewBreadcrumb = {
  label: string;
  href?: string;
};

export type DesignReviewScore = {
  value: number;
  max: number;
};

export type DesignReviewSection = {
  id: string;
  title: string;
  score: DesignReviewScore;
  summary: string;
  highlights: string[];
};

export type DesignReviewImprovement = {
  title: string;
  description: string;
};

export type DesignReviewDocumentResult = {
  /**
   * ドキュメント識別子。子ドキュメントを含む階層構造での key 用に利用する。
   */
  id: string;
  documentTitle: string;
  breadcrumbs: DesignReviewBreadcrumb[];
  totalScore: DesignReviewScore;
  overallEvaluation: {
    ratingLabel: string;
    summary: string;
  };
  sectionEvaluations: DesignReviewSection[];
  improvementSuggestions: DesignReviewImprovement[];
  childDocuments: DesignReviewDocumentResult[];
};

export type DesignReviewResult = {
  /**
   * ルートドキュメント（全体ドキュメント）のレビュー結果。
   * 子ドキュメントを通じて個別ドキュメントの評価が再帰的にぶら下がる。
   */
  rootDocument: DesignReviewDocumentResult;
};
