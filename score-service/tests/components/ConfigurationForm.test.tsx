import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import { useState } from "react";

import { ConfigurationForm } from "../../app/components/ConfigurationForm";
import { INITIAL_VALUES } from "../../app/lib/configuration-form";

const REQUIRED_LABELS = [
  "Backlog の Project ID",
  "設計書の ID",
  "要件定義書の ID",
  "Backlog API Key",
  "OpenAI API Key",
];

describe("ConfigurationForm", () => {
  it("renders all required input fields and preview", () => {
    const customValues = {
      ...INITIAL_VALUES,
      backlogProjectId: "123456",
      designDocumentId: "987654321",
      openAiApiKey: "sk-test",
    };

    const markup = renderToStaticMarkup(
      <ConfigurationForm value={customValues} onChange={() => {}} />,
    );

    for (const label of REQUIRED_LABELS) {
      expect(markup.includes(label)).toBe(true);
    }

    expect(markup.includes("JSON をコピー")).toBe(true);
    expect(markup.includes("JSON をインポート")).toBe(true);
    expect(markup.includes("&quot;backlog&quot;: {")).toBe(true);
    expect(markup.includes("&quot;openAi&quot;: {")).toBe(true);
    expect(markup.includes("&quot;projectId&quot;: &quot;123456&quot;)).toBe(true);
    expect(markup.includes("&quot;designDocumentId&quot;: &quot;987654321&quot;)).toBe(true);
    expect(markup.includes("&quot;apiKey&quot;: &quot;sk-test&quot;)).toBe(true);
  });

  it("calls onChange when input values update", () => {
    const handleChange = vi.fn();
    const container = document.createElement("div");
    document.body.appendChild(container);

    const root = createRoot(container);

    function Wrapper() {
      const [formValues, setFormValues] = useState({
        ...INITIAL_VALUES,
      });

      return (
        <ConfigurationForm
          value={formValues}
          onChange={(nextValues) => {
            handleChange(nextValues);
            setFormValues(nextValues);
          }}
        />
      );
    }

    act(() => {
      root.render(<Wrapper />);
    });

    const projectIdInput = container.querySelector(
      "input#backlogProjectId",
    ) as HTMLInputElement;

    expect(projectIdInput.value).toBe("");

    act(() => {
      projectIdInput.value = "246810";
      projectIdInput.dispatchEvent(new Event("input", { bubbles: true }));
    });

    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({ backlogProjectId: "246810" }),
    );
    expect(projectIdInput.value).toBe("246810");

    act(() => {
      root.unmount();
    });

    container.remove();
  });
});
