import { expect } from "vitest";

type MatcherResult = {
  pass: boolean;
  message: () => string;
};

type MaybeNode = Element | Node | null | undefined;

const isDomNode = (value: MaybeNode): value is Element | Node => {
  return value !== null && value !== undefined && typeof (value as Node).nodeType === "number";
};

const getNodeText = (node: MaybeNode): string => {
  if (!isDomNode(node)) {
    return "";
  }

  if ((node as Element).textContent !== undefined) {
    return (node as Element).textContent ?? "";
  }

  return "";
};

expect.extend({
  toBeInTheDocument(received: MaybeNode): MatcherResult {
    const pass = isDomNode(received)
      ? (received as Node).isConnected || Boolean((received as Node).ownerDocument?.documentElement?.contains(received as Node))
      : false;

    return {
      pass,
      message: () =>
        pass
          ? "受け取ったノードは DOM 上に存在しています。"
          : "受け取った値が DOM 上に存在しません。",
    };
  },
  toHaveTextContent(received: MaybeNode, expected: string | RegExp): MatcherResult {
    const textContent = getNodeText(received);
    const pass = expected instanceof RegExp ? expected.test(textContent) : textContent.includes(String(expected));

    return {
      pass,
      message: () =>
        pass
          ? "期待したテキストが DOM ノードに含まれています。"
          : `期待したテキストが見つかりません: ${String(expected)}\n実際のテキスト: ${textContent}`,
    };
  },
});

declare module "vitest" {
  interface Assertion<T = any> {
    toBeInTheDocument(): void;
    toHaveTextContent(expected: string | RegExp): void;
  }

  interface AsymmetricMatchersContaining {
    toBeInTheDocument(): void;
    toHaveTextContent(expected: string | RegExp): void;
  }
}
