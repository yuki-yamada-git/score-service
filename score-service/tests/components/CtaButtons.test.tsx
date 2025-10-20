import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { CtaButtons } from "../../app/components/CtaButtons";
import { CTA_LINKS } from "../../app/lib/links";

const escapeAttribute = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

test("CtaButtons renders a link for each CTA entry", () => {
  const markup = renderToStaticMarkup(<CtaButtons />);

  for (const link of CTA_LINKS) {
    assert.ok(
      markup.includes(`href=\"${escapeAttribute(link.href)}\"`),
      `Expected markup to include href ${link.href}`
    );
    assert.ok(
      markup.includes(link.label),
      `Expected markup to include label ${link.label}`
    );
  }
});

