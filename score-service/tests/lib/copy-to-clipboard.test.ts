import { afterEach, describe, expect, it, vi } from "vitest";

import { copyTextToClipboard } from "@/app/lib/copy-to-clipboard";

declare global {
  // vitest の実行環境で navigator を型安全にモックできるように宣言。
  // eslint-disable-next-line no-var
  var navigator: Navigator;
}

describe("copyTextToClipboard", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns true when clipboard API is available", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } } as Navigator);

    await expect(copyTextToClipboard("example"))
      .resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("example");
  });

  it("returns false when clipboard API is not available", async () => {
    vi.stubGlobal("navigator", {} as Navigator);

    await expect(copyTextToClipboard("example"))
      .resolves.toBe(false);
  });
});
