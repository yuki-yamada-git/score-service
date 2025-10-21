import type { DesignReviewResult } from "@/app/lib/design-review";

export const MOCK_DESIGN_REVIEW_RESULT: DesignReviewResult = {
  documentTitle: "GC_SAAS-71 利用者ログイン画面",
  breadcrumbs: [
    { label: "ログイン画面" },
    { label: "GC_SAAS-71 利用者ログイン画面" },
  ],
  totalScore: {
    value: 59,
    max: 100,
  },
  overallEvaluation: {
    ratingLabel: "要改善 (C)",
    summary:
      "ログイン画面の基本要件は満たしているが、案内とエラーメッセージの表現に改善の余地がある。体験を滑らかにするための調整を提案する。",
  },
  sectionEvaluations: [
    {
      id: "structure",
      title: "画面構成と導線",
      score: {
        value: 21,
        max: 30,
      },
      summary:
        "主要機能の配置は適切で、初回利用者でも迷いにくい構成になっている。一方で補助情報が分散しており、視線移動が多くなる印象。",
      highlights: [
        "フォーム周りのラベルと入力欄の距離が近く、視認性は良好。",
        "パスワード再設定リンクが他要素と同列にあり、重要度が下がっている。",
        "ヘルプ情報が画面右下に小さく配置されており、気づきにくい。",
      ],
    },
    {
      id: "ui-text",
      title: "文言・フィードバック",
      score: {
        value: 18,
        max: 30,
      },
      summary:
        "説明文が長文化しており、特にモバイル表示で折り返しが多く読みにくい。エラー文の語調もシステム寄りで、利用者視点の配慮が不足。",
      highlights: [
        "ログイン案内文が 3 行以上になるため、要点を箇条書き化したい。",
        "エラーメッセージが『認証に失敗しました (code:401)』とシステム語彙。利用者にとって必要な再入力案内が不足。",
        "ヘルプリンク文言が『FAQ を確認』で抽象的。より具体的な行動を促す表現が望ましい。",
      ],
    },
    {
      id: "accessibility",
      title: "アクセシビリティと可搬性",
      score: {
        value: 20,
        max: 40,
      },
      summary:
        "基本的なコントラスト比は担保されているが、ボタンのフォーカス表現が弱くキーボード操作での利用者は気づきにくい。",
      highlights: [
        "主要ボタンのフォーカスリングが 1px と細く、背景色とのコントラストが不足。",
        "ヘルプモーダルにキーボードフォーカスが閉じ込められず、操作が散逸する恐れ。",
        "画面タイトルが h1 ではなく div で実装されているため、スクリーンリーダーで読み上げ順が不自然。",
      ],
    },
  ],
  improvementSuggestions: [
    {
      title: "誘導テキストの簡潔化",
      description:
        "ログイン説明とエラー文を 2 文以内で完結させ、再設定リンクへの誘導を追加。箇条書きや太字を活用して視線の停留を作る。",
    },
    {
      title: "フォーカス状態の強調",
      description:
        "主要ボタンに 2px 以上のフォーカスリングと、背景とのコントラスト比 3:1 を満たす配色を適用。",
    },
    {
      title: "ヘルプ導線の再配置",
      description:
        "再設定とヘルプの導線をフォーム直下にまとめ、二段階で選べるようラベルを整理する。",
    },
  ],
};
