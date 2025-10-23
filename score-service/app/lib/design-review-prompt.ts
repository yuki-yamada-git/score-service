const BASE_INSTRUCTIONS = `あなたはプロダクトデザインのレビュアーです。提供された設計情報を評価し、改善点を提案します。`; 

export const DESIGN_REVIEW_SYSTEM_PROMPT = `${BASE_INSTRUCTIONS}\n\n出力は必ず有効な JSON で返し、コードブロックや余計な文字列は含めないでください。トップレベルは必ず { "rootDocument": {...} } の構造にしてください。\n\nrootDocument の各フィールド要件:\n- id: string\n- documentTitle: string\n- breadcrumbs: { label: string, href?: string } の配列\n- totalScore: { value: number, max: number }\n- overallEvaluation: { ratingLabel: string, summary: string }\n- sectionEvaluations: { id: string, title: string, score: { value: number, max: number }, summary: string, highlights: string[] } の配列\n- improvementSuggestions: { title: string, description: string } の配列\n- childDocuments: rootDocument と同じフィールド構造を持つオブジェクトの配列 (再帰的に定義)。子が無い場合は [] を返すこと。\n\nnull や undefined は使用せず、不要なフィールドは省略してください。配列フィールドが空の場合は [] を返し、highlights や improvementSuggestions も同様です。summary と description は日本語で 1〜3 文、highlights の各要素も日本語で記述してください。`;

export type BuildDesignReviewPromptOptions = {
  projectName: string;
  reviewObjectives: string[];
  documentSummaries: Array<{
    id: string;
    title: string;
    summary: string;
  }>;
};

export function buildDesignReviewPrompt({
  projectName,
  reviewObjectives,
  documentSummaries,
}: BuildDesignReviewPromptOptions): string {
  const objectivesText = reviewObjectives.length
    ? reviewObjectives.map((objective, index) => `${index + 1}. ${objective}`).join("\n")
    : "(指定なし)";
  const documentsText = documentSummaries.length
    ? documentSummaries
        .map((doc, index) => {
          return `${index + 1}. [${doc.id}] ${doc.title}\n要約: ${doc.summary}`;
        })
        .join("\n\n")
    : "(参照ドキュメント情報なし)";

  return `レビュー対象プロジェクト: ${projectName}\n\nレビュー目的:\n${objectivesText}\n\n参照ドキュメント一覧:\n${documentsText}\n\n上記の情報をもとに、評価結果と改善提案を作成してください。`;
import type { BacklogDocumentTreeNode } from "@/app/lib/backlog";

export type GenerateDesignReviewPromptOptions = {
  projectId: number;
  documentTree: BacklogDocumentTreeNode;
};

export function generateDesignReviewPrompt({
  projectId,
  documentTree,
}: GenerateDesignReviewPromptOptions): string {
  const documentCount = countDocuments(documentTree);
  return `Project ${projectId} document tree with ${documentCount} documents.`;
}

function countDocuments(node: BacklogDocumentTreeNode): number {
  return node.children.reduce((total, child) => total + countDocuments(child), 1);
}
