import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { FooterLinks } from "../../app/components/FooterLinks";
import { FOOTER_LINKS } from "../../app/lib/links";

const escapeAttribute = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

test("FooterLinks renders every configured footer link", () => {
  const markup = renderToStaticMarkup(<FooterLinks />);

  for (const link of FOOTER_LINKS) {
    assert.ok(
      markup.includes(`href=\"${escapeAttribute(link.href)}\"`),
      `Expected markup to include href ${link.href}`
    );
    assert.ok(
      markup.includes(link.label),
      `Expected markup to include label ${link.label}`
    );
    assert.ok(
      markup.includes(`alt=\"${link.icon.alt}\"`),
      `Expected markup to include icon alt ${link.icon.alt}`
    );
  }
});
