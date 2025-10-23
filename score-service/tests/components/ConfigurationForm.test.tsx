import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { ConfigurationForm } from "../../app/components/ConfigurationForm";

const REQUIRED_LABELS = [
  "Backlog の Project ID",
  "設計書の ID",
  "要件定義書の ID",
  "Backlog API Key",
  "OpenAI API Key",
];

describe("ConfigurationForm", () => {
  it("renders all required input fields and preview", () => {
    const markup = renderToStaticMarkup(<ConfigurationForm />);

    for (const label of REQUIRED_LABELS) {
      expect(markup.includes(label)).toBe(true);
    }

    expect(markup.includes("JSON をコピー")).toBe(true);
    expect(markup.includes("JSON をインポート")).toBe(true);
    expect(markup.includes("&quot;backlog&quot;: {")).toBe(true);
    expect(markup.includes("&quot;openAi&quot;: {")).toBe(true);
  });
});
