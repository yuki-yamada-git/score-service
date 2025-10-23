# AI Coding ガイド

このドキュメントは、AI アシスタントや新規参加メンバーが Score Service の機能を素早く拡張できるように、重要な前提条件と実装パターンをまとめたものです。

## 開発環境

- Node.js 18 以上を想定しています。`npm install` で依存関係を導入してください。
- Next.js 15 App Router 構成です。ページエントリは `app/page.tsx` から始まります。
- Tailwind CSS 4 を利用しているため、グローバルスタイルは `app/globals.css` に集約されています。

## コーディング規約

- すべて TypeScript (ESM) で実装されています。型情報を積極的に付与してください。
- UI コンポーネントは関数コンポーネント + フックで構成されています。`"use client";` が必要なコンポーネントではファイル先頭に記述します。
- ライブラリ (`app/lib/`) では副作用を最小化し、純粋なユーティリティとして実装します。エラーメッセージは人間が読んで理解できる内容を心がけてください。
- 非同期処理では `async/await` を使用し、Fetch API のエラーハンドリングを必ず実装します。

## 主要フロー

1. ユーザーが `ConfigurationForm` に Backlog / OpenAI 設定を入力すると、`buildPreview` でプレビュー JSON を生成します。
2. 「分析開始」ボタン (`AnalysisDashboard`) が押されると、現在は `MOCK_DESIGN_REVIEW_RESULT` をセットして UI を更新しています。
3. 今後は Backlog API (`app/lib/backlog.ts`) で設計情報を取得し、OpenAI API (`app/lib/openai.ts`) へプロンプトとして渡す想定です。
4. 応答は `DesignReviewResult` コンポーネントで表示できる `DesignReviewResult` 型に整形してください。

## 実装のヒント

- Backlog から取得したドキュメントツリーはプロンプト生成で利用するため、必要な部分のみを抽出して OpenAI へ渡します。ユースケースごとにラッパー関数を `app/lib/` 配下に追加するとテストしやすくなります。
- OpenAI API の呼び出し時は `requestOpenAiAnalysis` を利用し、`systemPrompt` でレビュー方針を制御します。レスポンスに複数の choice が含まれる場合は最初の message を採用しています。
- UI の状態管理は React Hooks を利用します。フォームの値は `ConfigurationForm` 内の `values` ステートで管理しているため、新しい項目を追加する場合は `configuration-form.ts` の定義を更新した上でフォームにフィールドを追加してください。
- JSON インポート機能を壊さないよう、`parseConfigurationJson` の挙動を確認しながら変更を加えます。テスト (`tests/lib/configuration-form.test.ts`) を更新することを忘れないでください。

## テスト指針

- ユニットテストは Vitest を利用します。`npm test` で全テストを実行できます。
- Fetch API を利用するユーティリティは `vi.stubGlobal("fetch", ...)` を使ってモックしてください (例: `tests/lib/openai.test.ts`, `tests/lib/backlog.test.ts`)。
- React コンポーネントは Testing Library を用いたスナップショットレスな検証を行っています。フォームの振る舞いを変更した場合は `tests/components/ConfigurationForm.test.tsx` を参照して期待値を更新します。
- Next.js 固有のモジュールは `tests/mocks/` にスタブを置いているため、必要に応じてここへ追加してください。

## Pull Request メモ

- 新機能は `docs/` に補足ドキュメントを追加して、背景や使い方を共有してください。
- テストと Lint を通過させた上で PR を作成します。コミットメッセージは英語で簡潔にまとめるのが望ましいです。
- UI の変更時はスクリーンショットを添付するとレビューがスムーズになります。

これらのポイントを押さえることで、AI でも安全かつ効率的にコードを生成・修正できます。疑問点があれば `docs/` に追記してナレッジを共有してください。
