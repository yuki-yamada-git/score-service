/**
 * クリップボード API を利用してテキストをコピーするユーティリティ。
 * API が使用できない環境では false を返し、呼び出し元でフォールバックを判断する。
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  const clipboard = typeof navigator !== "undefined" ? navigator.clipboard : undefined;

  if (!clipboard?.writeText) {
    return false;
  }

  try {
    await clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("Failed to copy text to clipboard", error);
    return false;
  }
}
