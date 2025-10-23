# アプリケーション概要

Score Service は、UX/UI 設計レビューのための入力フォームとレビュー結果ビューアを備えた Next.js アプリケーションです。ChatGPT を利用した自動レビュー連携を想定しており、現在はモックデータで表示を確認できます。

## 技術スタック

- **フロントエンドフレームワーク**: Next.js 15 (App Router)
- **UI ライブラリ**: React 19, Tailwind CSS 4
- **言語 / 型**: TypeScript 5
- **テスト**: Vitest 2
- **Lint / フォーマット**: ESLint 9

## コマンド

```bash
# 依存関係のインストール
npm install

# 開発サーバーを起動 (http://localhost:3000)
npm run dev

# 型チェックと Lint
npm run lint

# テスト実行
npm test
```

## ディレクトリ構成

```
score-service/
├── app/                # Next.js App Router のエントリポイント
│   ├── components/     # UI コンポーネント群
│   ├── lib/            # クライアントサイドで利用するユーティリティ
│   ├── globals.css     # Tailwind ベースのグローバルスタイル
│   └── page.tsx        # ダッシュボードのトップページ
├── tests/              # Vitest によるユニットテスト
├── public/             # 静的アセット
├── types/              # 共通の型定義
└── ...
```

## 主要コンポーネント

- `app/page.tsx`: `AnalysisDashboard` を描画するトップレベルのページです。
- `app/components/AnalysisDashboard.tsx`: 設定フォーム・レビュー結果表示・アクションボタンを束ねるコンテナコンポーネントです。
- `app/components/ConfigurationForm.tsx`: Backlog / OpenAI 連携情報を入力し、JSON プレビューやインポート・コピー機能を提供します。
- `app/components/DesignReviewResult.tsx`: ChatGPT から返されるレビュー結果をセクション別に表示します。

## 主要ユーティリティ

- `app/lib/configuration-form.ts`: フォーム定義、プレビュー JSON 生成、JSON インポート機能を提供します。
- `app/lib/backlog.ts`: Backlog API を通じてドキュメントツリーを取得するクライアント実装です (未使用ですが統合予定)。
- `app/lib/openai.ts`: OpenAI Chat Completions API を呼び出し、レビュー結果を取得するためのユーティリティです。
- `app/lib/sample-review.ts`: UI 表示確認用のモックレビュー結果を定義します。

## 今後の拡張ポイント

- OpenAI API との連携を実装し、`MOCK_DESIGN_REVIEW_RESULT` を実データで置き換える。
- Backlog API から設計書データを取得し、プロンプト生成に利用する。
- UI テストや Storybook を導入してコンポーネントの回帰検証を強化する。

さらに詳細な実装指針は [AI Coding ガイド](./ai-coding-guide.md) を参照してください。
