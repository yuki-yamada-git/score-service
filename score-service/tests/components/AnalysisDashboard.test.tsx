import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AnalysisDashboard } from "../../app/components/AnalysisDashboard";
import { MOCK_DESIGN_REVIEW_RESULT } from "../../app/lib/sample-review";

const ORIGINAL_FETCH = globalThis.fetch;

describe("AnalysisDashboard", () => {
  afterEach(() => {
    if (ORIGINAL_FETCH) {
      globalThis.fetch = ORIGINAL_FETCH;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (globalThis as any).fetch;
    }

    vi.restoreAllMocks();
  });

  it("posts configuration and renders the analysis result when the request succeeds", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ result: MOCK_DESIGN_REVIEW_RESULT }),
    });

    globalThis.fetch = fetchMock as unknown as typeof fetch;

    render(<AnalysisDashboard />);

    const projectInput = screen.getByLabelText("Backlog の Project ID") as HTMLInputElement;
    fireEvent.change(projectInput, { target: { value: "123" } });

    const startButton = screen.getByRole("button", { name: "分析開始" }) as HTMLButtonElement;
    fireEvent.click(startButton);

    expect(startButton.disabled).toBe(true);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const requestBody = JSON.parse(requestInit.body as string) as {
      configuration: { backlogProjectId?: string };
    };

    expect(requestBody.configuration.backlogProjectId).toBe("123");

    await waitFor(() => {
      expect(
        screen.getByText(MOCK_DESIGN_REVIEW_RESULT.rootDocument.documentTitle),
      ).toBeTruthy();
    });

    expect(startButton.disabled).toBe(false);
  });

  it("shows an error message when the analysis request fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Server Error",
      json: async () => ({ message: "Server error" }),
    });

    globalThis.fetch = fetchMock as unknown as typeof fetch;

    render(<AnalysisDashboard />);

    const startButton = screen.getByRole("button", { name: "分析開始" }) as HTMLButtonElement;
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeTruthy();
    });

    expect(startButton.disabled).toBe(false);
    expect(
      screen.queryByText(MOCK_DESIGN_REVIEW_RESULT.rootDocument.documentTitle),
    ).toBeNull();
  });
});
