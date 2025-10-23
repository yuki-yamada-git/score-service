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

export type DesignReviewResult = {
  documentTitle: string;
  breadcrumbs: DesignReviewBreadcrumb[];
  totalScore: DesignReviewScore;
  overallEvaluation: {
    ratingLabel: string;
    summary: string;
  };
  sectionEvaluations: DesignReviewSection[];
  improvementSuggestions: DesignReviewImprovement[];
};
