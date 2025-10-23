import { afterEach, describe, expect, it, vi } from "vitest";

import { BacklogClient } from "@/app/lib/backlog";

describe("BacklogClient", () => {
  const baseUrl = "https://example.backlog.com";
  const apiKey = "dummy-key";
  const projectIdOrKey = "PRJ";

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("content が null のとき shownContent を利用する", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 1,
            projectId: 99,
            name: "サンプルドキュメント",
            content: null,
            shownContent: "<p>HTML コンテンツ</p>",
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }));

    vi.stubGlobal("fetch", fetchMock);

    const client = new BacklogClient({ baseUrl, apiKey, projectIdOrKey });
    const tree = await client.fetchDocumentTree(1);

    expect(tree.content).toBe("<p>HTML コンテンツ</p>");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("content と shownContent の両方が存在しない場合はエラーになる", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 1,
            projectId: 99,
            name: "空ドキュメント",
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({}), { status: 200 }),
      );

    vi.stubGlobal("fetch", fetchMock);

    const client = new BacklogClient({ baseUrl, apiKey, projectIdOrKey });

    await expect(client.fetchDocumentTree(1)).rejects.toThrow(
      "Backlog document 1 did not contain content",
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("/content エンドポイントから本文を補完する", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 1,
            projectId: 99,
            name: "サマリーのみ",
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ content: "<p>本文</p>" }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify([]), { status: 200 }),
      );

    vi.stubGlobal("fetch", fetchMock);

    const client = new BacklogClient({ baseUrl, apiKey, projectIdOrKey });
    const tree = await client.fetchDocumentTree(1);

    expect(tree.content).toBe("<p>本文</p>");
    const secondCallUrl = fetchMock.mock.calls[1]?.[0];
    expect(String(secondCallUrl)).toBe(
      "https://example.backlog.com/api/v2/documents/1/content?apiKey=dummy-key&projectIdOrKey=PRJ",
    );
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
