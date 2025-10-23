import type { DesignReviewResult } from "@/app/lib/design-review";

export const MOCK_DESIGN_REVIEW_RESULT: DesignReviewResult = {
  rootDocument: {
    id: "overall",
    documentTitle: "GC_SAAS 設計ドキュメント全体レビュー",
    breadcrumbs: [{ label: "全体ドキュメント" }],
    totalScore: {
      value: 76,
      max: 100,
    },
    overallEvaluation: {
      ratingLabel: "改善余地あり (B)",
      summary:
        "主要な体験は成立しているものの、誘導文言・アクセシビリティ・階層間の整合性に一部ばらつきがある。個別ドキュメントの改善で全体品質を底上げしたい。",
    },
    sectionEvaluations: [
      {
        id: "coherence",
        title: "設計全体の整合性",
        score: {
          value: 24,
          max: 30,
        },
        summary:
          "各ドキュメントで想定するユーザー導線は概ね一貫しているが、一部で注釈の語調や図表の配置が異なり認知コストが高い箇所が見られる。",
        highlights: [
          "主要画面の遷移図は統一された表記で整えられている。",
          "UI テキストの基準がドキュメントごとに微妙に異なり、レビュー時の判断基準が揃いづらい。",
          "補足情報の配置位置が画面ごとに異なるため、ユーザーの視線移動が安定しない。",
        ],
      },
      {
        id: "ux-quality",
        title: "体験品質と指標",
        score: {
          value: 26,
          max: 40,
        },
        summary:
          "想定ユースケースに対する必要十分なフローは定義済み。ただし要約レベルの KPI が未定義の箇所があり、改善効果を測定しづらい。",
        highlights: [
          "主要業務フローは成功・失敗パターンがそれぞれ記載されている。",
          "ユーザー属性ごとのサポート導線が不足しており、例外ケースに対する配慮が薄い。",
          "分析イベントの設計が一部ドキュメントで欠落している。",
        ],
      },
      {
        id: "governance",
        title: "ガバナンスと公開準備",
        score: {
          value: 26,
          max: 30,
        },
        summary:
          "レビュー体制や運用ルールは明記されているが、公開判断の合意プロセスがドキュメントによって異なり、承認の遅延リスクがある。",
        highlights: [
          "セキュリティとプライバシーのチェックリストは最新化されている。",
          "リリース判定フローが画面ごとに別紙参照となっており、検索性が低い。",
          "文書の更新履歴フォーマットが統一されていない。",
        ],
      },
    ],
    improvementSuggestions: [
      {
        title: "UI 文言と注釈の統一ルール策定",
        description:
          "各ドキュメントで用いる語彙・注釈の書式・図表の凡例をテンプレート化し、レビュー時の揺らぎを減らす。",
      },
      {
        title: "公開判断プロセスの再整理",
        description:
          "共通の承認フロー図を作成し、各ドキュメントから参照できるようリンク構造を揃える。",
      },
    ],
    childDocuments: [
      {
        id: "login-screen",
        documentTitle: "GC_SAAS-71 利用者ログイン画面",
        breadcrumbs: [
          { label: "ログイン" },
          { label: "GC_SAAS-71 利用者ログイン画面" },
        ],
        totalScore: {
          value: 59,
          max: 100,
        },
        overallEvaluation: {
          ratingLabel: "要改善 (C)",
          summary:
            "ログイン体験の主要導線は成立しているが、誘導テキストとエラー時のフォローが不十分。視認性とアクセシビリティ面の底上げが必要。",
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
              "主要機能の配置は適切で迷いにくいが、補助情報が分散して視線移動が多い。",
            highlights: [
              "フォーム周りのラベルと入力欄の距離が近く視認性は良好。",
              "パスワード再設定リンクが他要素と同列にあり重要度が下がっている。",
              "ヘルプ情報が画面右下に小さく配置されており気づきにくい。",
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
              "説明文が長文化し、特にモバイル表示で折り返しが多い。エラーメッセージもシステム語彙寄り。",
            highlights: [
              "ログイン案内文が 3 行以上で要点が伝わりにくい。",
              "エラーメッセージが『認証に失敗しました (code:401)』と利用者視点の案内が不足。",
              "ヘルプリンク文言が抽象的で具体的行動を促せていない。",
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
              "コントラスト比は担保されているが、フォーカス表現が弱くキーボード操作での気づきが難しい。",
            highlights: [
              "主要ボタンのフォーカスリングが 1px で背景とのコントラストが不足。",
              "ヘルプモーダルにキーボードフォーカスが閉じ込められず操作が散逸する恐れ。",
              "画面タイトルが h1 ではなく div 実装で読み上げ順が不自然。",
            ],
          },
        ],
        improvementSuggestions: [
          {
            title: "誘導テキストの簡潔化",
            description:
              "ログイン説明とエラー文を 2 文以内で完結させ、再設定リンクへの誘導を追加する。",
          },
          {
            title: "フォーカス状態の強調",
            description:
              "主要ボタンに 2px 以上のフォーカスリングと十分なコントラスト比を適用する。",
          },
          {
            title: "ヘルプ導線の再配置",
            description:
              "再設定とヘルプ導線をフォーム直下にまとめ、重要情報へのアクセス性を高める。",
          },
        ],
        childDocuments: [
          {
            id: "login-error-modal",
            documentTitle: "GC_SAAS-71 エラーモーダル詳細設計",
            breadcrumbs: [
              { label: "ログイン" },
              { label: "GC_SAAS-71 利用者ログイン画面" },
              { label: "エラーモーダル" },
            ],
            totalScore: {
              value: 68,
              max: 100,
            },
            overallEvaluation: {
              ratingLabel: "準備良好 (B)",
              summary:
                "モーダルの構造と操作フローは明確だが、可視化されるメッセージのトーンが全体方針とややズレている。",
            },
            sectionEvaluations: [
              {
                id: "modal-structure",
                title: "モーダル構造",
                score: {
                  value: 24,
                  max: 30,
                },
                summary:
                  "操作手順は完結にまとまっているが、閉じる操作の分岐が図に反映されていない。",
                highlights: [
                  "ボタン配置とフォーカス遷移が図示されている。",
                  "キャンセル時の戻り先が注釈のみで表現されており図に反映できていない。",
                ],
              },
              {
                id: "copy-tone",
                title: "メッセージとトーン",
                score: {
                  value: 20,
                  max: 40,
                },
                summary:
                  "文言例はあるが、想定ユーザー属性ごとの言い回しが揃っていない。",
                highlights: [
                  "再入力を促すメッセージとサポート案内が併記されている。",
                  "管理者向けと一般ユーザー向けの語調が混在している。",
                  "テキスト長の想定がなく、UI 上で折り返しが想像しづらい。",
                ],
              },
              {
                id: "a11y",
                title: "アクセシビリティ",
                score: {
                  value: 24,
                  max: 30,
                },
                summary:
                  "ラベル構造は明示されているが、スクリーンリーダー向けの読み上げ順序は未定義。",
                highlights: [
                  "heading レベルとラベル紐付けは整理されている。",
                  "読み上げ順が文章でのみ説明されており、チェックが難しい。",
                ],
              },
            ],
            improvementSuggestions: [
              {
                title: "モーダルフロー図の更新",
                description:
                  "閉じる操作の分岐を図に追記し、例外パターンを視覚的に理解できるようにする。",
              },
              {
                title: "メッセージトーンの統一",
                description:
                  "ユーザータイプごとに語調ガイドラインを用意し、文言例に反映する。",
              },
            ],
            childDocuments: [],
          },
        ],
      },
      {
        id: "help-center",
        documentTitle: "GC_SAAS-88 ヘルプセンター導線",
        breadcrumbs: [
          { label: "サポート" },
          { label: "GC_SAAS-88 ヘルプセンター導線" },
        ],
        totalScore: {
          value: 82,
          max: 100,
        },
        overallEvaluation: {
          ratingLabel: "良好 (A)",
          summary:
            "導線設計とナビゲーションは整理されており、サポートへの接続体験も一貫している。詳細設計の更新頻度を確保できれば公開準備は整う。",
        },
        sectionEvaluations: [
          {
            id: "information-architecture",
            title: "情報設計",
            score: {
              value: 30,
              max: 35,
            },
            summary:
              "FAQ・チュートリアル・問い合わせが用途別に整理され、ユーザーが迷いにくい構成。",
            highlights: [
              "問い合わせ種別ごとの案内フローが図式化されている。",
              "セルフサーブ向け記事の更新ガイドラインが明記されている。",
            ],
          },
          {
            id: "operations",
            title: "運用と更新",
            score: {
              value: 28,
              max: 35,
            },
            summary:
              "更新手順は整備されているが、担当範囲の明示と SLA の記載が足りない。",
            highlights: [
              "週次レビューの実施方法が明確。",
              "問い合わせ対応 SLA が暫定値のまま。",
            ],
          },
          {
            id: "localization",
            title: "多言語展開",
            score: {
              value: 24,
              max: 30,
            },
            summary:
              "主要言語の翻訳フローは確立されているが、監査プロセスが書かれていない。",
            highlights: [
              "翻訳管理ツールの設定が整理されている。",
              "監査チェックリストが未整備。",
            ],
          },
        ],
        improvementSuggestions: [
          {
            title: "担当範囲と SLA の明文化",
            description:
              "問い合わせ種別ごとの担当チームと目標応答時間を追記し、運用負荷を可視化する。",
          },
          {
            title: "翻訳監査プロセスの追加",
            description:
              "監査タイミングと責任者を決め、翻訳品質を定期的にレビューする。",
          },
        ],
        childDocuments: [],
      },
    ],
  },
};
