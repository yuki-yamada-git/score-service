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
  /**
   * Backlog のプロジェクト識別子。URL の `projects/{projectIdOrKey}` に利用する。
   * 例: "PRJ" や "123"
   */
  projectIdOrKey: string;
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

type BacklogDocumentContentFields = {
  /**
  * Backlog Document (Beta) では本文が複数のフィールドに分かれて返却される場合がある。
  * content/shownContent は旧来のドキュメント API との互換フィールド、body/bodyHTML は Document (Beta) で利用される。
   */
  content?: string | null;
  shownContent?: string | null;
  body?: string | null;
  bodyHTML?: string | null;
  bodyHtml?: string | null;
  htmlContent?: string | null;
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
} & BacklogDocumentContentFields;

type BacklogDocumentResponse = Omit<BacklogDocument, "content"> &
  BacklogDocumentContentFields;

type BacklogDocumentContentResponse = BacklogDocumentContentFields;

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
  private readonly projectIdOrKey: string;

  constructor({ baseUrl, apiKey, projectIdOrKey }: BacklogClientOptions) {
    if (!baseUrl) {
      throw new Error("Backlog baseUrl is required");
    }

    if (!apiKey) {
      throw new Error("Backlog API key is required");
    }

    if (!projectIdOrKey?.trim()) {
      throw new Error("Backlog projectIdOrKey is required");
    }

    const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
    this.baseApiUrl = new URL("api/v2/", normalizedBase);
    this.apiKey = apiKey;
    this.projectIdOrKey = projectIdOrKey.trim();
  }

  /**
   * 指定したドキュメント ID を起点に木構造を取得する。
   */
  async fetchDocumentTree(
    documentId: string | number,
    options: FetchBacklogDocumentTreeOptions = {},
  ): Promise<BacklogDocumentTreeNode> {
    const visited = new Set<string>();
    const maxDepth = options.maxDepth ?? Number.POSITIVE_INFINITY;
    const normalizedDocumentId = normalizeDocumentId(documentId);

    if (maxDepth < 0) {
      throw new Error("maxDepth must be greater than or equal to 0");
    }

    return this.buildTree(normalizedDocumentId, visited, 0, maxDepth);
  }

  private async buildTree(
    documentId: string,
    visited: Set<string>,
    depth: number,
    maxDepth: number,
    childSummary?: BacklogDocumentChild,
  ): Promise<BacklogDocumentTreeNode> {
    const cacheKey = documentId;

    if (visited.has(cacheKey)) {
      throw new Error(`Detected circular reference for document ${documentId}`);
    }

    visited.add(cacheKey);

    try {
      const document = await this.fetchDocument(documentId);
      let children: BacklogDocumentTreeNode[] = [];

      if (depth < maxDepth && (childSummary?.hasChildren ?? true)) {
        const childSummaries = await this.fetchDocumentChildren(documentId);
        children = await Promise.all(
          childSummaries.map((child) =>
            this.buildTree(
              normalizeDocumentId(child.id),
              visited,
              depth + 1,
              maxDepth,
              child,
            ),
          ),
        );
      }

      return {
        ...document,
        children,
      };
    } finally {
      visited.delete(cacheKey);
    }
  }

  private async fetchDocument(documentId: string): Promise<BacklogDocument> {
    const response = await this.request<BacklogDocumentResponse>(
      this.buildDocumentPath(documentId),
    );

    // Document (Beta) では本文が `content` だけでなく `body` や `bodyHTML`
    // として返るケースがあり、さらにメタデータ API では本文が含まれず
    // `/content` エンドポイントを別途呼び出す必要がある。
    // そのためレスポンスに含まれる複数の候補フィールドを確認し、
    // いずれも欠落している場合は `/content` から再取得する。
    const inlineContent = pickDocumentContent(response);
    const content =
      inlineContent !== undefined
        ? inlineContent
        : await this.fetchDocumentContent(documentId);

    if (content === undefined || content === null) {
      throw new Error(`Backlog document ${documentId} did not contain content`);
    }

    return {
      ...response,
      content,
    } satisfies BacklogDocument;
  }

  private async fetchDocumentContent(
    documentId: string,
  ): Promise<string | null | undefined> {
    const response = await this.request<BacklogDocumentContentResponse>(
      this.buildDocumentPath(documentId, "content"),
    );

    return pickDocumentContent(response);
  }

  private async fetchDocumentChildren(
    documentId: string,
  ): Promise<BacklogDocumentChild[]> {
    const children = await this.request<BacklogDocumentChild[]>(
      this.buildDocumentPath(documentId, "children"),
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
      const detail = await extractBacklogErrorDetail(response);
      const statusMessage = detail
        ? `${statusText} (${detail})`
        : statusText;

      throw new Error(
        `Backlog API request failed with status ${response.status}: ${statusMessage}`,
      );
    }

    return (await response.json()) as T;
  }

  private buildDocumentPath(documentId: string, suffix?: string): string {
    const normalizedSuffix = suffix ? `/${suffix}` : "";
    return `projects/${this.projectIdOrKey}/documents/${documentId}${normalizedSuffix}`;
  }
}

/**
 * 利便性のためのヘルパー関数。
 * クライアントを生成して即座に木構造を取得する。
 */
export async function fetchBacklogDocumentTree(
  options: BacklogClientOptions & {
    documentId: string | number;
    treeOptions?: FetchBacklogDocumentTreeOptions;
  },
): Promise<BacklogDocumentTreeNode> {
  const client = new BacklogClient({
    baseUrl: options.baseUrl,
    apiKey: options.apiKey,
    projectIdOrKey: options.projectIdOrKey,
  });

  return client.fetchDocumentTree(options.documentId, options.treeOptions);
}

async function extractBacklogErrorDetail(
  response: Response,
): Promise<string | undefined> {
  let bodyText: string;

  try {
    bodyText = await response.text();
  } catch {
    return undefined;
  }

  const trimmedBody = bodyText.trim();
  if (!trimmedBody) {
    return undefined;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      const data = JSON.parse(trimmedBody);
      const messages = extractErrorMessages(data);

      if (messages.length > 0) {
        return sanitizeErrorDetail(messages.join("; "));
      }
    } catch {
      // JSON として扱えない場合はテキストにフォールバックする
    }
  }

  return sanitizeErrorDetail(trimmedBody);
}

function extractErrorMessages(value: unknown): string[] {
  const messages: string[] = [];
  const seen = new Set<unknown>();

  const visit = (node: unknown) => {
    if (node === null || node === undefined) {
      return;
    }

    if (typeof node === "string") {
      const trimmed = node.trim();
      if (trimmed) {
        messages.push(trimmed);
      }
      return;
    }

    if (typeof node !== "object") {
      return;
    }

    if (seen.has(node)) {
      return;
    }

    seen.add(node);

    if (Array.isArray(node)) {
      for (const item of node) {
        visit(item);
      }
      return;
    }

    const record = node as Record<string, unknown>;
    const candidateKeys = [
      "message",
      "error",
      "detail",
      "details",
      "description",
      "reason",
    ];

    for (const key of candidateKeys) {
      const valueForKey = record[key];
      if (typeof valueForKey === "string") {
        const trimmed = valueForKey.trim();
        if (trimmed) {
          messages.push(trimmed);
        }
      }
    }

    const errorsField = record.errors;
    if (Array.isArray(errorsField)) {
      for (const item of errorsField) {
        visit(item);
      }
    }

    for (const nested of Object.values(record)) {
      visit(nested);
    }
  };

  visit(value);

  const uniqueMessages = new Set(messages);
  return Array.from(uniqueMessages);
}

function sanitizeErrorDetail(detail: string): string {
  return detail.replace(/\s+/g, " ").trim();
}

function normalizeDocumentId(documentId: string | number): string {
  if (typeof documentId === "number") {
    if (!Number.isInteger(documentId) || documentId <= 0) {
      throw new Error(
        "documentId must be a positive integer or a non-empty string",
      );
    }

    return String(documentId);
  }

  if (typeof documentId === "string") {
    const trimmed = documentId.trim();

    if (!trimmed) {
      throw new Error(
        "documentId must be a positive integer or a non-empty string",
      );
    }

    return trimmed;
  }

  throw new Error("documentId must be a string or number");
}

function pickDocumentContent(
  source: BacklogDocumentContentFields,
): string | null | undefined {
  const candidates = [
    source.content,
    source.shownContent,
    source.body,
    source.bodyHTML,
    source.bodyHtml,
    source.htmlContent,
  ];

  for (const value of candidates) {
    if (value !== undefined && value !== null) {
      return value;
    }
  }

  return undefined;
}

