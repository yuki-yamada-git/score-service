const ENV_BACKLOG_BASE_URL = "BACKLOG_BASE_URL";

export function getBacklogBaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  const rawValue = env[ENV_BACKLOG_BASE_URL];

  if (typeof rawValue !== "string") {
    throw new Error(`Environment variable ${ENV_BACKLOG_BASE_URL} is required`);
  }

  const trimmedValue = rawValue.trim();

  if (!trimmedValue) {
    throw new Error(`Environment variable ${ENV_BACKLOG_BASE_URL} is required`);
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmedValue);
  } catch {
    throw new Error(
      `Environment variable ${ENV_BACKLOG_BASE_URL} must be a valid URL`,
    );
  }

  if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
    throw new Error(
      `Environment variable ${ENV_BACKLOG_BASE_URL} must use http or https`,
    );
  }

  if ((parsedUrl.pathname && parsedUrl.pathname !== "/") || parsedUrl.search || parsedUrl.hash) {
    throw new Error(
      `Environment variable ${ENV_BACKLOG_BASE_URL} must not include a path, query, or fragment`,
    );
  }

  return parsedUrl.origin;
}
