import { expect } from "vitest";

type TextContentExpectation = string | RegExp;

interface TextContentOptions {
  normalizeWhitespace?: boolean;
}

const isNode = (value: unknown): value is Node =>
  typeof value === "object" && value !== null && "nodeType" in (value as Node);

const isElement = (value: unknown): value is Element =>
  isNode(value) && (value as Node).nodeType === Node.ELEMENT_NODE;

const getTextContent = (
  element: Element,
  { normalizeWhitespace = true }: TextContentOptions = {}
): string => {
  const content = element.textContent ?? "";
  if (!normalizeWhitespace) return content;
  return content.replace(/\s+/g, " ").trim();
};

declare module "vitest" {
  interface Assertion<T = any> {
    toBeInTheDocument(): T;
    toHaveTextContent(
      expected: TextContentExpectation,
      options?: TextContentOptions
    ): T;
  }

  interface AsymmetricMatchersContaining {
    toBeInTheDocument(): void;
    toHaveTextContent(
      expected: TextContentExpectation,
      options?: TextContentOptions
    ): void;
  }
}

expect.extend({
  toBeInTheDocument(received: unknown) {
    const pass = isNode(received) && (received as Node).isConnected;

    return {
      pass,
      message: () =>
        pass
          ? "要素は DOM から切り離されていることを期待しました"
          : "要素が DOM 上に存在することを期待しました",
    };
  },
  toHaveTextContent(
    received: unknown,
    expected: TextContentExpectation,
    options?: TextContentOptions
  ) {
    if (!isElement(received)) {
      return {
        pass: false,
        message: () => "DOM 要素の textContent を評価する必要があります",
      };
    }

    const actual = getTextContent(received, options);
    const pass =
      expected instanceof RegExp ? expected.test(actual) : actual.includes(expected);

    return {
      pass,
      actual,
      expected,
      message: () =>
        pass
          ? `"${actual}" が期待値と一致しないことを期待しました`
          : `"${actual}" に "${String(expected)}" が含まれることを期待しました`,
    };
  },
});
