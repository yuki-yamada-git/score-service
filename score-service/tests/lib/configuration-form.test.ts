import { describe, expect, it } from "vitest";

import {
  FIELD_DEFINITIONS,
  INITIAL_VALUES,
  buildPreview,
  parseConfigurationJson,
  type ConfigurationFieldId,
} from "@/app/lib/configuration-form";

const FILLED_VALUES: Record<ConfigurationFieldId, string> = {
  backlogProjectId: "123",
  designDocumentId: "456",
  requirementsDocumentId: "789",
  backlogApiKey: "backlog-key",
  openAiApiKey: "openai-key",
};

describe("configuration-form utilities", () => {
  it("exposes field definitions for every field id", () => {
    const definedIds = new Set(FIELD_DEFINITIONS.map((field) => field.id));

    for (const fieldId of Object.keys(INITIAL_VALUES) as ConfigurationFieldId[]) {
      expect(definedIds.has(fieldId)).toBe(true);
    }
  });

  it("creates preview JSON with only filled values", () => {
    expect(buildPreview(FILLED_VALUES)).toEqual({
      backlog: {
        projectId: "123",
        designDocumentId: "456",
        requirementsDocumentId: "789",
        apiKey: "backlog-key",
      },
      openAi: {
        apiKey: "openai-key",
      },
    });
  });

  it("omits empty values from the preview JSON", () => {
    expect(
      buildPreview({
        backlogProjectId: "",
        designDocumentId: "",
        requirementsDocumentId: "",
        backlogApiKey: "",
        openAiApiKey: "",
      }),
    ).toEqual({ backlog: {}, openAi: {} });
  });

  it("parses JSON text into form values", () => {
    const jsonText = JSON.stringify(
      {
        backlog: {
          projectId: 999,
          designDocumentId: "456",
          requirementsDocumentId: "789",
          apiKey: "backlog-key",
        },
        openAi: {
          apiKey: "openai-key",
        },
      },
      null,
      2,
    );

    expect(parseConfigurationJson(jsonText)).toEqual({
      backlogProjectId: "999",
      designDocumentId: "456",
      requirementsDocumentId: "789",
      backlogApiKey: "backlog-key",
      openAiApiKey: "openai-key",
    });
  });

  it("returns null when JSON cannot be parsed", () => {
    expect(parseConfigurationJson("{")).toBeNull();
  });

  it("returns null when JSON lacks recognized sections", () => {
    expect(parseConfigurationJson("{}")).toBeNull();
  });

  it("returns initial values when sections are present but empty", () => {
    const parsed = parseConfigurationJson(
      JSON.stringify({ backlog: {}, openAi: {} }),
    );

    expect(parsed).toEqual(INITIAL_VALUES);
  });
});
