import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { ConfigurationForm } from "../../app/components/ConfigurationForm";

const REQUIRED_LABELS = [
  "Backlog の Project ID",
  "設計書の ID",
  "要件定義書の ID",
  "Backlog API Key",
  "OpenAI API Key",
];

test("ConfigurationForm renders all required input fields and preview", () => {
  const markup = renderToStaticMarkup(<ConfigurationForm />);

  for (const label of REQUIRED_LABELS) {
    assert.ok(markup.includes(label), `Expected markup to include the label: ${label}`);
  }

  assert.ok(
    markup.includes("JSON をコピー"),
    "Expected markup to include a button to copy the JSON payload",
  );

  assert.ok(
    markup.includes("&quot;backlog&quot;: {"),
    "Expected markup to include a backlog object in the preview",
  );
  assert.ok(
    markup.includes("&quot;openAi&quot;: {"),
    "Expected markup to include an OpenAI object in the preview",
  );
});
