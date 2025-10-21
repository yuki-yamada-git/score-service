import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { HeroSection } from "../../app/components/HeroSection";

test("HeroSection renders the Next.js logo and instructions", () => {
  const markup = renderToStaticMarkup(<HeroSection />);

  assert.ok(
    markup.includes("Next.js logo"),
    "Expected markup to include the Next.js logo alt text"
  );
  assert.ok(
    markup.includes("app/page.tsx"),
    "Expected markup to include the edited file path"
  );
});
