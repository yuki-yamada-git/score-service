import type { BacklogDocumentTreeNode } from "@/app/lib/backlog";

export const DESIGN_REVIEW_SYSTEM_PROMPT = `あなたは品質管理のスペシャリストです。設計ドキュメントを分析し、スコアを評価してください。
評価は厳格に行ってください。以下の基準に従ってください：
【各項目の評価基準（0～5点）】
- 0点: 該当項目が欠落している、または重大な問題がある
- 1点: 不十分で、多くの改善が必要
- 2点: 最低限の要素はあるが、不足が目立つ
- 3点: 指定項目がすべて満たされている（標準的・及第点）
- 4点: より進んだ設計ができており、優れている
- 5点: 非の打ちどころがなく、模範的

評価項目：
- モジュール分割の適切さ（0～5点）：機能の責務が明確か、依存関係が適切か。
- 拡張性（0～5点）：将来的な機能追加・仕様変更への対応しやすさ。
- 保守性（0～5点）：コード・設計の読みやすさ、変更容易性、テスト容易性。
- 可用性・信頼性（0～5点）：障害発生時のリカバリ、フェイルオーバー設計、冗長構成
- 性能・スケーラビリティ（0～5点）：負荷増加時の対応、キャッシュ戦略、ボトルネックの考慮
- セキュリティ（0～5点）：認証・認可、データ保護、通信の暗号化、脆弱性対策
- ユーザビリティ・操作性（0～5点）：インターフェース設計（UI／API）、エラーハンドリング
- データ設計（0～5点）：スキーマ設計、正規化／非正規化、整合性制約、インデックス設計
- 運用性（0～5点）：ロギング、モニタリング、アラート設計、バックアップ・リストア方式
- テスト戦略（0～5点）：単体テスト、結合テスト、E2Eテスト、テストカバレッジ、モック／スタブの設計
- 可視性・ドキュメント性（0～5点）：モジュール間図、シーケンス図、クラス図、仕様書との整合性
- 再利用性（0～5点）：共通部品設計、ライブラリ抽出、モジュール独立性
- 一貫性（0～5点）：命名規則、設計パターンの統一、コードスタイル方針の明示
- 総評（0～5点）：上記に加え、設計全体の整合性・非機能要件への配慮・将来性などを総合的に判断
- 各評価項目に関して、対象となる機能の性質から重みを付けて評価してください。機能によって考慮すべき内容であれば重く、考慮すべき内容でなければ軽く評価してください。

以下のJSON形式で評価結果を出力してください：
{
"scoreDetails": {
"モジュール分割の適切さ": 0～5の数値,
"拡張性": 0～5の数値,
"保守性": 0～5の数値,
"可用性・信頼性": 0～5の数値,
"性能・スケーラビリティ": 0～5の数値,
"セキュリティ": 0～5の数値,
"ユーザビリティ・操作性": 0～5の数値,
"データ設計": 0～5の数値,
"運用性": 0～5の数値,
"テスト戦略": 0～5の数値,
"可視性・ドキュメント性": 0～5の数値,
"再利用性": 0～5の数値,
"一貫性": 0～5の数値,
"総評": 0～5の数値
},
"overall": 0～5の数値,
"summary": "評価の総評コメント"
}`;

const MAX_DOCUMENT_SUMMARIES = 25;
const MAX_CONTENT_PREVIEW_LENGTH = 400;

export type GenerateDesignReviewPromptOptions = {
  projectId: number;
  documentTree: BacklogDocumentTreeNode;
};

type SummaryState = {
  count: number;
  truncated: boolean;
};

export function generateDesignReviewPrompt({
  projectId,
  documentTree,
}: GenerateDesignReviewPromptOptions): string {
  const lines: string[] = [];
  const summaries: string[] = [];
  const state: SummaryState = { count: 0, truncated: false };

  lines.push(`プロジェクト ID: ${projectId}`);
  lines.push(
    "Backlog から取得したドキュメント構成と本文要約を以下に列挙します。階層が深いほどインデントが深くなります。",
  );

  appendDocumentSummary(documentTree, [], summaries, state);

  if (summaries.length > 0) {
    lines.push(summaries.join("\n"));
  }

  if (state.truncated) {
    lines.push(
      `※ ドキュメント数が多いため ${MAX_DOCUMENT_SUMMARIES} 件までで要約を打ち切っています。残りは Backlog 上の原本に準拠してください。`,
    );
  }

  lines.push(
    "上記の情報を踏まえ、提供した評価基準に従って厳格に評価し、重大な欠陥や改善提案があれば明確に記載してください。",
  );

  return lines.join("\n\n");
}

function appendDocumentSummary(
  node: BacklogDocumentTreeNode,
  ancestors: string[],
  lines: string[],
  state: SummaryState,
): void {
  if (state.count >= MAX_DOCUMENT_SUMMARIES) {
    if (!state.truncated) {
      const indent = createIndent(ancestors.length);
      lines.push(
        `${indent}※ これ以降のドキュメント要約は省略しました (${MAX_DOCUMENT_SUMMARIES} 件まで表示)`,
      );
      state.truncated = true;
    }
    return;
  }

  state.count += 1;

  const path = [...ancestors, node.name];
  const indent = createIndent(ancestors.length);
  const summary = summarizeContent(node.content);

  lines.push(`${indent}- ドキュメント: ${node.name} (ID: ${node.id})`);
  lines.push(`${indent}  パス: ${path.join(" > ")}`);
  lines.push(`${indent}  要約: ${summary}`);

  if (node.children.length > 0) {
    lines.push(`${indent}  子ドキュメント数: ${node.children.length}`);

    for (const child of node.children) {
      appendDocumentSummary(child, path, lines, state);
      if (state.truncated) {
        break;
      }
    }
  }
}

function summarizeContent(content: string): string {
  const normalized = normalizeWhitespace(content);

  if (!normalized) {
    return "(本文なし)";
  }

  if (normalized.length <= MAX_CONTENT_PREVIEW_LENGTH) {
    return normalized;
  }

  return `${normalized.slice(0, MAX_CONTENT_PREVIEW_LENGTH - 1)}…`;
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\r?\n+/g, " ").replace(/\s+/g, " ").trim();
}

function createIndent(depth: number): string {
  return "  ".repeat(depth);
}
