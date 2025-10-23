import { describe, expect, it } from "vitest";

import { getBacklogBaseUrl } from "@/app/lib/server-config";

describe("getBacklogBaseUrl", () => {
  it("throws when BACKLOG_BASE_URL is not set", () => {
    expect(() => getBacklogBaseUrl({} as NodeJS.ProcessEnv)).toThrow(
      "Environment variable BACKLOG_BASE_URL is required",
    );
  });

  it("normalizes the URL when it is valid", () => {
    const env = {
      BACKLOG_BASE_URL: " https://example.backlog.com/ ",
    } satisfies NodeJS.ProcessEnv;

    expect(getBacklogBaseUrl(env)).toBe("https://example.backlog.com");
  });

  it("throws when the value is not a valid URL", () => {
    const env = {
      BACKLOG_BASE_URL: "not-a-url",
    } satisfies NodeJS.ProcessEnv;

    expect(() => getBacklogBaseUrl(env)).toThrow(
      "Environment variable BACKLOG_BASE_URL must be a valid URL",
    );
  });

  it("throws when the URL contains a path", () => {
    const env = {
      BACKLOG_BASE_URL: "https://example.backlog.com/path",
    } satisfies NodeJS.ProcessEnv;

    expect(() => getBacklogBaseUrl(env)).toThrow(
      "Environment variable BACKLOG_BASE_URL must not include a path, query, or fragment",
    );
  });
});
