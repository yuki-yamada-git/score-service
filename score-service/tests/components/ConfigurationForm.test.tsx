import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ConfigurationForm } from "../../app/components/ConfigurationForm";
import { INITIAL_VALUES } from "../../app/lib/configuration-form";

describe("ConfigurationForm", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders all required input fields and preview", () => {
    render(<ConfigurationForm />);

    expect(screen.getByLabelText("Backlog の Project ID")).toBeTruthy();
    expect(screen.getByLabelText("設計書の ID")).toBeTruthy();
    expect(screen.getByLabelText("要件定義書の ID")).toBeTruthy();
    expect(screen.getByLabelText("Backlog API Key")).toBeTruthy();
    expect(screen.getByLabelText("OpenAI API Key")).toBeTruthy();
    expect(screen.getByText("JSON をコピー")).toBeTruthy();
    expect(screen.getByText("JSON をインポート")).toBeTruthy();
    expect(screen.getByText("プレビュー")).toBeTruthy();
  });

  it("calls onValuesChange when inputs are updated", async () => {
    const handleValuesChange = vi.fn();
    render(<ConfigurationForm onValuesChange={handleValuesChange} />);

    await waitFor(() => {
      expect(handleValuesChange).toHaveBeenCalledWith({
        ...INITIAL_VALUES,
      });
    });

    const projectInput = screen.getByLabelText("Backlog の Project ID") as HTMLInputElement;
    fireEvent.change(projectInput, { target: { value: "42" } });

    await waitFor(() => {
      expect(handleValuesChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          backlogProjectId: "42",
        }),
      );
    });
  });

  it("resets internal state when initialValues prop changes", async () => {
    const handleValuesChange = vi.fn();
    const { rerender } = render(
      <ConfigurationForm
        onValuesChange={handleValuesChange}
        initialValues={{ backlogProjectId: "123" }}
      />,
    );

    const projectInput = screen.getByLabelText(
      "Backlog の Project ID",
    ) as HTMLInputElement;

    expect(projectInput.value).toBe("123");

    fireEvent.change(projectInput, { target: { value: "456" } });
    expect(projectInput.value).toBe("456");

    rerender(
      <ConfigurationForm
        onValuesChange={handleValuesChange}
        initialValues={{ backlogProjectId: "789" }}
      />,
    );

    await waitFor(() => {
      expect(projectInput.value).toBe("789");
    });
  });
});
