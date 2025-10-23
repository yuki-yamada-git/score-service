import { afterEach, describe, expect, it, vi } from "vitest";

import {
  BacklogClient,
  fetchBacklogDocumentTree,
  type BacklogDocumentTreeNode,
} from "@/app/lib/backlog";

describe("BacklogClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requires baseUrl, apiKey, and projectIdOrKey", () => {
    expect(() =>
      new BacklogClient({ baseUrl: "", apiKey: "key", projectIdOrKey: "PRJ" }),
    ).toThrow("Backlog baseUrl is required");

    expect(() =>
      new BacklogClient({
        baseUrl: "https://example",
        apiKey: "",
        projectIdOrKey: "PRJ",
      }),
    ).toThrow("Backlog API key is required");

    expect(() =>
      new BacklogClient({
        baseUrl: "https://example",
        apiKey: "key",
        projectIdOrKey: "",
      }),
    ).toThrow("Backlog projectIdOrKey is required");
  });

  it("fetches document tree recursively", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo) => {
      const url = new URL(String(input));

      if (url.pathname === "/api/v2/projects/PRJ/documents/1") {
        return createJsonResponse({
          id: 1,
          projectId: 99,
          name: "Root",
          content: "Root content",
        });
      }

      if (url.pathname === "/api/v2/projects/PRJ/documents/1/children") {
        return createJsonResponse([
          { id: 2, name: "Child", hasChildren: true },
          { id: 3, name: "Leaf", hasChildren: false },
        ]);
      }

      if (url.pathname === "/api/v2/projects/PRJ/documents/2") {
        return createJsonResponse({
          id: 2,
          projectId: 99,
          name: "Child",
          content: "Child content",
        });
      }

      if (url.pathname === "/api/v2/projects/PRJ/documents/2/children") {
        return createJsonResponse([
          { id: 4, name: "Grand child", hasChildren: false },
        ]);
      }

      if (url.pathname === "/api/v2/projects/PRJ/documents/3") {
        return createJsonResponse({
          id: 3,
          projectId: 99,
          name: "Leaf",
          content: "Leaf content",
        });
      }

      if (url.pathname === "/api/v2/projects/PRJ/documents/3/children") {
        throw new Error("Leaf children should not be fetched when hasChildren is false");
      }

      if (url.pathname === "/api/v2/projects/PRJ/documents/4") {
        return createJsonResponse({
          id: 4,
          projectId: 99,
          name: "Grand child",
          content: "Grand content",
        });
      }

      if (url.pathname === "/api/v2/projects/PRJ/documents/4/children") {
        throw new Error("Leaf children should not be fetched when hasChildren is false");
      }

      throw new Error(`Unhandled request for ${url.pathname}`);
    });

    vi.stubGlobal("fetch", fetchMock);

    const client = new BacklogClient({
      baseUrl: "https://example.backlog.com",
      apiKey: "secret",
      projectIdOrKey: "PRJ",
    });

    const tree = await client.fetchDocumentTree(1);

    const expected: BacklogDocumentTreeNode = {
      id: 1,
      projectId: 99,
      name: "Root",
      content: "Root content",
      children: [
        {
          id: 2,
          projectId: 99,
          name: "Child",
          content: "Child content",
          children: [
            {
              id: 4,
              projectId: 99,
              name: "Grand child",
              content: "Grand content",
              children: [],
            },
          ],
        },
        {
          id: 3,
          projectId: 99,
          name: "Leaf",
          content: "Leaf content",
          children: [],
        },
      ],
    };

    expect(tree).toEqual(expected);

    const requestedUrls = fetchMock.mock.calls.map(([input]) =>
      new URL(String(input)),
    );

    expect(
      requestedUrls.some(
        (url) =>
          url.pathname === "/api/v2/projects/PRJ/documents/1" &&
          url.searchParams.get("apiKey") === "secret",
      ),
    ).toBe(true);
    expect(
      requestedUrls.some(
        (url) =>
          url.pathname === "/api/v2/projects/PRJ/documents/1/children" &&
          url.searchParams.get("apiKey") === "secret",
      ),
    ).toBe(true);
  });

  it("throws when the API returns an error", async () => {
    const fetchMock = vi.fn(async () =>
      createErrorResponse(401, "Unauthorized"),
    );

    vi.stubGlobal("fetch", fetchMock);

    const client = new BacklogClient({
      baseUrl: "https://example.backlog.com",
      apiKey: "secret",
      projectIdOrKey: "PRJ",
    });

    await expect(client.fetchDocumentTree(1)).rejects.toThrow(
      "Backlog API request failed with status 401: Unauthorized",
    );
  });

  it("includes details from Backlog error responses", async () => {
    const fetchMock = vi.fn(async () =>
      createErrorResponse(
        400,
        "Bad Request",
        {
          message: "パラメーターが不正です",
          errors: [
            { message: "projectIdOrKey が存在しません" },
            { message: "apiKey が正しくありません" },
          ],
        },
      ),
    );

    vi.stubGlobal("fetch", fetchMock);

    const client = new BacklogClient({
      baseUrl: "https://example.backlog.com",
      apiKey: "secret",
      projectIdOrKey: "PRJ",
    });

    const expectedMessage =
      "Backlog API request failed with status 400: Bad Request " +
      "(パラメーターが不正です; projectIdOrKey が存在しません; apiKey が正しくありません)";

    await expect(client.fetchDocumentTree(1)).rejects.toThrow(expectedMessage);
  });

  it("falls back to raw text when error response is not JSON", async () => {
    const fetchMock = vi.fn(async () =>
      createErrorResponse(
        502,
        "Bad Gateway",
        "Upstream error: unexpected HTML",
        {
          "content-type": "text/plain",
        },
      ),
    );

    vi.stubGlobal("fetch", fetchMock);

    const client = new BacklogClient({
      baseUrl: "https://example.backlog.com",
      apiKey: "secret",
      projectIdOrKey: "PRJ",
    });

    await expect(client.fetchDocumentTree(1)).rejects.toThrow(
      "Backlog API request failed with status 502: Bad Gateway (Upstream error: unexpected HTML)",
    );
  });

  it("allows documents with empty string content", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo) => {
      const url = new URL(String(input));

      if (url.pathname.endsWith("/documents/10")) {
        return createJsonResponse({
          id: 10,
          projectId: 7,
          name: "Empty",
          content: "",
        });
      }

      if (url.pathname.endsWith("/documents/10/children")) {
        return createJsonResponse([]);
      }

      throw new Error("Unexpected request");
    });

    vi.stubGlobal("fetch", fetchMock);

    const client = new BacklogClient({
      baseUrl: "https://example.backlog.com",
      apiKey: "secret",
      projectIdOrKey: "PRJ",
    });

    const document = await client.fetchDocumentTree(10);

    expect(document.content).toBe("");
  });

  it("fetches content from the dedicated endpoint when metadata lacks it", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo) => {
      const url = new URL(String(input));

      if (url.pathname.endsWith("/documents/55")) {
        return createJsonResponse({
          id: 55,
          projectId: 9,
          name: "Metadata only",
        });
      }

      if (url.pathname.endsWith("/documents/55/content")) {
        return createJsonResponse({
          bodyHTML: "<p>Document body</p>",
        });
      }

      if (url.pathname.endsWith("/documents/55/children")) {
        return createJsonResponse([]);
      }

      throw new Error(`Unexpected request to ${url.pathname}`);
    });

    vi.stubGlobal("fetch", fetchMock);

    const client = new BacklogClient({
      baseUrl: "https://example.backlog.com",
      apiKey: "secret",
      projectIdOrKey: "PRJ",
    });

    const document = await client.fetchDocumentTree(55);

    expect(document.content).toBe("<p>Document body</p>");
  });

  it("URL エンコード済みのドキュメント ID でリクエストする", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo) => {
      const url = new URL(String(input));

      if (url.pathname === "/api/v2/projects/PRJ/documents/DOC%205") {
        return createJsonResponse({
          id: 5,
          projectId: 42,
          name: "Encoded",
          content: "Encoded content",
        });
      }

      if (url.pathname === "/api/v2/projects/PRJ/documents/DOC%205/children") {
        return createJsonResponse([]);
      }

      throw new Error(`Unexpected request to ${url.pathname}`);
    });

    vi.stubGlobal("fetch", fetchMock);

    const client = new BacklogClient({
      baseUrl: "https://example.backlog.com",
      apiKey: "secret",
      projectIdOrKey: "PRJ",
    });

    const document = await client.fetchDocumentTree(" DOC 5 ");

    expect(document.name).toBe("Encoded");
    expect(document.children).toHaveLength(0);

    const requestedUrls = fetchMock.mock.calls.map(([input]) => String(input));
    expect(requestedUrls).toContain(
      "https://example.backlog.com/api/v2/projects/PRJ/documents/DOC%205?apiKey=secret",
    );
    expect(requestedUrls).toContain(
      "https://example.backlog.com/api/v2/projects/PRJ/documents/DOC%205/children?apiKey=secret",
    );
  });

  it("supports the helper function", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo) => {
      const url = new URL(String(input));

      if (url.pathname.endsWith("/documents/DOC-5")) {
        return createJsonResponse({
          id: 5,
          projectId: 42,
          name: "Single",
          content: "Single content",
        });
      }

      if (url.pathname.endsWith("/documents/DOC-5/children")) {
        return createJsonResponse([]);
      }

      throw new Error("Unexpected request");
    });

    vi.stubGlobal("fetch", fetchMock);

    const tree = await fetchBacklogDocumentTree({
      baseUrl: "https://example.backlog.com",
      apiKey: "secret",
      projectIdOrKey: "PRJ",
      documentId: "DOC-5",
    });

    expect(tree.children).toHaveLength(0);
    expect(tree.name).toBe("Single");
  });

  it("requires a valid document id", async () => {
    const client = new BacklogClient({
      baseUrl: "https://example.backlog.com",
      apiKey: "secret",
      projectIdOrKey: "PRJ",
    });

    await expect(client.fetchDocumentTree(0)).rejects.toThrow(
      "documentId must be a positive integer or a non-empty string",
    );

    await expect(client.fetchDocumentTree(-10)).rejects.toThrow(
      "documentId must be a positive integer or a non-empty string",
    );

    await expect(client.fetchDocumentTree(1.5)).rejects.toThrow(
      "documentId must be a positive integer or a non-empty string",
    );

    await expect(client.fetchDocumentTree(" ")).rejects.toThrow(
      "documentId must be a positive integer or a non-empty string",
    );
  });
});

function createJsonResponse<T>(data: T): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    statusText: "OK",
    headers: {
      "content-type": "application/json",
    },
  });
}

function createErrorResponse(
  status: number,
  statusText: string,
  body?: unknown,
  headers?: HeadersInit,
): Response {
  let payload: BodyInit | null = null;
  let resolvedHeaders: HeadersInit | undefined;

  if (typeof body === "string") {
    payload = body;
  } else if (body !== undefined) {
    payload = JSON.stringify(body);
    resolvedHeaders = { "content-type": "application/json" };
  }

  return new Response(payload, {
    status,
    statusText,
    headers: { ...resolvedHeaders, ...headers },
  });
}
