/**
 * Backlog のドキュメント API を利用してドキュメント情報を取得するためのクライアント。
 * 仕様は Backlog API ドキュメント (https://developer.nulab.com/docs/backlog/api/2/) を参照。
 * 指定したドキュメント ID を起点に子ドキュメントをたどり、木構造を構築する。
 */
export type BacklogClientOptions = {
  /**
   * Backlog スペースのベース URL。
   * 例: https://example.backlog.com
   */
  baseUrl: string;
  /** Backlog の個人 API キー。 */
  apiKey: string;
};

/**
 * Backlog のドキュメントを表す型。
 * API から返却されるフィールドのうち、ライブラリで利用する主要なものを定義する。
 */
export type BacklogUser = {
  id: number;
  userId: string;
  name: string;
  roleType: number;
  mailAddress?: string;
};

export type BacklogAttachment = {
  id: number;
  name: string;
  size: number;
};

export type BacklogStar = {
  id: number;
  comment?: string | null;
  created: string;
  presenter: BacklogUser;
  receiver: BacklogUser;
};

export type BacklogTag = {
  id: number;
  name: string;
};

export type BacklogDocument = {
  id: number;
  projectId: number;
  name: string;
  content: string;
  folderId?: number | null;
  parentId?: number | null;
  tags?: BacklogTag[];
  share?: number;
  shownContent?: string;
  draft?: boolean;
  archive?: boolean;
  createdUser?: BacklogUser;
  updatedUser?: BacklogUser;
  created?: string;
  updated?: string;
  attachments?: BacklogAttachment[];
  stars?: BacklogStar[];
};

/**
 * Backlog のドキュメントの子情報 (content を含まない簡易情報)。
 */
export type BacklogDocumentChild = {
  id: number;
  name: string;
  projectId?: number;
  parentId?: number | null;
  hasChildren?: boolean;
  displayOrder?: number;
};

/**
 * 子ドキュメントを含む Backlog ドキュメントの木構造。
 */
export type BacklogDocumentTreeNode = BacklogDocument & {
  children: BacklogDocumentTreeNode[];
};

/**
 * ドキュメントツリー取得時に指定できるオプション。
 */
export type FetchBacklogDocumentTreeOptions = {
  /**
   * 再帰で辿る最大の深さ。0 を指定するとルートのみを取得する。
   * 省略した場合は子孫をすべて取得する。
   */
  maxDepth?: number;
};

/**
 * Backlog API を呼び出すための薄いクライアント実装。
 */
export class BacklogClient {
  private readonly baseApiUrl: URL;
  private readonly apiKey: string;

  constructor({ baseUrl, apiKey }: BacklogClientOptions) {
    if (!baseUrl) {
      throw new Error("Backlog baseUrl is required");
    }

    if (!apiKey) {
      throw new Error("Backlog API key is required");
    }

    const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
    this.baseApiUrl = new URL("api/v2/", normalizedBase);
    this.apiKey = apiKey;
  }

  /**
   * 指定したドキュメント ID を起点に木構造を取得する。
   */
  async fetchDocumentTree(
    documentId: number,
    options: FetchBacklogDocumentTreeOptions = {},
  ): Promise<BacklogDocumentTreeNode> {
    const visited = new Set<number>();
    const maxDepth = options.maxDepth ?? Number.POSITIVE_INFINITY;

    if (!Number.isInteger(documentId) || documentId <= 0) {
      throw new Error("documentId must be a positive integer");
    }

    if (maxDepth < 0) {
      throw new Error("maxDepth must be greater than or equal to 0");
    }

    return this.buildTree(documentId, visited, 0, maxDepth);
  }

  private async buildTree(
    documentId: number,
    visited: Set<number>,
    depth: number,
    maxDepth: number,
    childSummary?: BacklogDocumentChild,
  ): Promise<BacklogDocumentTreeNode> {
    if (visited.has(documentId)) {
      throw new Error(`Detected circular reference for document ${documentId}`);
    }

    visited.add(documentId);

    try {
      const document = await this.fetchDocument(documentId);
      let children: BacklogDocumentTreeNode[] = [];

      if (depth < maxDepth && (childSummary?.hasChildren ?? true)) {
        const childSummaries = await this.fetchDocumentChildren(documentId);
        children = await Promise.all(
          childSummaries.map((child) =>
            this.buildTree(child.id, visited, depth + 1, maxDepth, child),
          ),
        );
      }

      return {
        ...document,
        children,
      };
    } finally {
      visited.delete(documentId);
    }
  }

  private async fetchDocument(documentId: number): Promise<BacklogDocument> {
    const response = await this.request<BacklogDocument>(`documents/${documentId}`);

    if (!response.content) {
      throw new Error(`Backlog document ${documentId} did not contain content`);
    }

    return response;
  }

  private async fetchDocumentChildren(documentId: number): Promise<BacklogDocumentChild[]> {
    const children = await this.request<BacklogDocumentChild[]>(
      `documents/${documentId}/children`,
    );
    if (!Array.isArray(children)) {
      return [];
    }

    return [...children].sort((a, b) => {
      const orderA = a.displayOrder ?? 0;
      const orderB = b.displayOrder ?? 0;
      return orderA - orderB;
    });
  }

  private async request<T>(path: string): Promise<T> {
    const url = new URL(path.replace(/^\//, ""), this.baseApiUrl);
    url.searchParams.set("apiKey", this.apiKey);

    let response: Response;
    try {
      response = await fetch(url);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown network error";
      throw new Error(`Backlog API request failed: ${message}`);
    }

    if (!response.ok) {
      const statusText = response.statusText || "Unknown error";
      throw new Error(
        `Backlog API request failed with status ${response.status}: ${statusText}`,
      );
    }

    return (await response.json()) as T;
  }
}

/**
 * 利便性のためのヘルパー関数。
 * クライアントを生成して即座に木構造を取得する。
 */
export async function fetchBacklogDocumentTree(
  options: BacklogClientOptions & {
    documentId: number;
    treeOptions?: FetchBacklogDocumentTreeOptions;
  },
): Promise<BacklogDocumentTreeNode> {
  const client = new BacklogClient({
    baseUrl: options.baseUrl,
    apiKey: options.apiKey,
  });

  return client.fetchDocumentTree(options.documentId, options.treeOptions);
}
