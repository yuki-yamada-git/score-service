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
