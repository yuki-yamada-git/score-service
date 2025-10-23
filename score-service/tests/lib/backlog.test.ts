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

  it("requires baseUrl and apiKey", () => {
    expect(() => new BacklogClient({ baseUrl: "", apiKey: "key" })).toThrow(
      "Backlog baseUrl is required",
    );

    expect(() => new BacklogClient({ baseUrl: "https://example", apiKey: "" })).toThrow(
      "Backlog API key is required",
    );
  });

  it("fetches document tree recursively", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo) => {
      const url = new URL(String(input));

      if (url.pathname === "/api/v2/documents/1") {
        return createJsonResponse({
          id: 1,
          projectId: 99,
          name: "Root",
          content: "Root content",
        });
      }

      if (url.pathname === "/api/v2/documents/1/children") {
        return createJsonResponse([
          { id: 2, name: "Child", hasChildren: true },
          { id: 3, name: "Leaf", hasChildren: false },
        ]);
      }

      if (url.pathname === "/api/v2/documents/2") {
        return createJsonResponse({
          id: 2,
          projectId: 99,
          name: "Child",
          content: "Child content",
        });
      }

      if (url.pathname === "/api/v2/documents/2/children") {
        return createJsonResponse([
          { id: 4, name: "Grand child", hasChildren: false },
        ]);
      }

      if (url.pathname === "/api/v2/documents/3") {
        return createJsonResponse({
          id: 3,
          projectId: 99,
          name: "Leaf",
          content: "Leaf content",
        });
      }

      if (url.pathname === "/api/v2/documents/3/children") {
        throw new Error("Leaf children should not be fetched when hasChildren is false");
      }

      if (url.pathname === "/api/v2/documents/4") {
        return createJsonResponse({
          id: 4,
          projectId: 99,
          name: "Grand child",
          content: "Grand content",
        });
      }

      if (url.pathname === "/api/v2/documents/4/children") {
        throw new Error("Leaf children should not be fetched when hasChildren is false");
      }

      throw new Error(`Unhandled request for ${url.pathname}`);
    });

    vi.stubGlobal("fetch", fetchMock);

    const client = new BacklogClient({
      baseUrl: "https://example.backlog.com",
      apiKey: "secret",
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

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/v2/documents/1?apiKey=secret"),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/v2/documents/1/children?apiKey=secret"),
    );
  });

  it("throws when the API returns an error", async () => {
    const fetchMock = vi.fn(async () =>
      createErrorResponse(401, "Unauthorized"),
    );

    vi.stubGlobal("fetch", fetchMock);

    const client = new BacklogClient({
      baseUrl: "https://example.backlog.com",
      apiKey: "secret",
    });

    await expect(client.fetchDocumentTree(1)).rejects.toThrow(
      "Backlog API request failed with status 401: Unauthorized",
    );
  });

  it("supports the helper function", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo) => {
      const url = new URL(String(input));

      if (url.pathname.endsWith("/documents/5")) {
        return createJsonResponse({
          id: 5,
          projectId: 42,
          name: "Single",
          content: "Single content",
        });
      }

      if (url.pathname.endsWith("/documents/5/children")) {
        return createJsonResponse([]);
      }

      throw new Error("Unexpected request");
    });

    vi.stubGlobal("fetch", fetchMock);

    const tree = await fetchBacklogDocumentTree({
      baseUrl: "https://example.backlog.com",
      apiKey: "secret",
      documentId: 5,
    });

    expect(tree.children).toHaveLength(0);
    expect(tree.name).toBe("Single");
  });

  it("requires a positive integer document id", async () => {
    const client = new BacklogClient({
      baseUrl: "https://example.backlog.com",
      apiKey: "secret",
    });

    await expect(client.fetchDocumentTree(0)).rejects.toThrow(
      "documentId must be a positive integer",
    );

    await expect(client.fetchDocumentTree(-10)).rejects.toThrow(
      "documentId must be a positive integer",
    );

    await expect(client.fetchDocumentTree(1.5)).rejects.toThrow(
      "documentId must be a positive integer",
    );
  });
});

function createJsonResponse<T>(data: T): Response {
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    json: async () => data,
  } as unknown as Response;
}

function createErrorResponse(status: number, statusText: string): Response {
  return {
    ok: false,
    status,
    statusText,
    json: async () => ({}),
  } as unknown as Response;
}
