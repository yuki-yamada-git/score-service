import type { ReactElement } from "react";
import { act } from "react-dom/test-utils";
import { createRoot, type Root } from "react-dom/client";

type RenderResult = {
  container: HTMLElement;
  rerender: (ui: ReactElement) => void;
  unmount: () => void;
};

type WaitForOptions = {
  timeout?: number;
  interval?: number;
};

let activeRoot: Root | null = null;
let activeContainer: HTMLElement | null = null;

function cleanup() {
  if (activeRoot) {
    act(() => {
      activeRoot?.unmount();
    });
    activeRoot = null;
  }

  if (activeContainer) {
    activeContainer.remove();
    activeContainer = null;
  }
}

export function render(ui: ReactElement): RenderResult {
  cleanup();

  activeContainer = document.createElement("div");
  document.body.appendChild(activeContainer);
  activeRoot = createRoot(activeContainer);

  act(() => {
    activeRoot!.render(ui);
  });

  return {
    container: activeContainer!,
    rerender(nextUi: ReactElement) {
      act(() => {
        activeRoot!.render(nextUi);
      });
    },
    unmount() {
      cleanup();
    },
  };
}

function queryAllElements(): HTMLElement[] {
  return Array.from(document.body.querySelectorAll<HTMLElement>("*")).filter(
    (element) => element.isConnected,
  );
}

function matchTextContent(element: Element, text: string) {
  return (element.textContent ?? "").includes(text);
}

function getAccessibleName(element: HTMLElement) {
  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel) {
    return ariaLabel.trim();
  }

  return (element.textContent ?? "").trim();
}

function matchesRole(element: HTMLElement, role: string) {
  if (element.getAttribute("role")) {
    return element.getAttribute("role") === role;
  }

  if (role === "button") {
    return element.tagName.toLowerCase() === "button";
  }

  return false;
}

function findLabel(text: string) {
  const labels = Array.from(document.querySelectorAll<HTMLLabelElement>("label"));
  return labels.find((label) => (label.textContent ?? "").includes(text)) ?? null;
}

function getControlForLabel(label: HTMLLabelElement) {
  if (label.htmlFor) {
    const target = document.getElementById(label.htmlFor);
    if (target) {
      return target;
    }
  }

  return label.querySelector("input, textarea, select");
}

export const screen = {
  getByText(text: string) {
    const element = queryAllElements().find((node) => matchTextContent(node, text));
    if (!element) {
      throw new Error(`Unable to find an element with text: ${text}`);
    }
    return element;
  },
  queryByText(text: string) {
    return queryAllElements().find((node) => matchTextContent(node, text)) ?? null;
  },
  getByRole(role: string, options?: { name?: string }) {
    const candidates = queryAllElements().filter((element) => matchesRole(element, role));
    if (options?.name) {
      const named = candidates.find(
        (element) => getAccessibleName(element) === options.name,
      );
      if (named) {
        return named;
      }
    }

    if (candidates.length === 0) {
      throw new Error(`Unable to find an element with role: ${role}`);
    }

    return candidates[0];
  },
  getByLabelText(text: string) {
    const label = findLabel(text);
    if (!label) {
      throw new Error(`Unable to find label with text: ${text}`);
    }

    const control = getControlForLabel(label);
    if (!control) {
      throw new Error(`Unable to find control for label: ${text}`);
    }

    return control as HTMLElement;
  },
};

export const fireEvent = {
  click(element: Element) {
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    element.dispatchEvent(event);
  },
  change(element: Element, init: { target: { value: string } }) {
    const target = element as HTMLInputElement | HTMLTextAreaElement;
    target.value = init.target.value;
    const inputEvent = new Event("input", { bubbles: true });
    element.dispatchEvent(inputEvent);
    const changeEvent = new Event("change", { bubbles: true });
    element.dispatchEvent(changeEvent);
  },
};

export async function waitFor(
  assertion: () => void,
  { timeout = 1000, interval = 50 }: WaitForOptions = {},
): Promise<void> {
  const start = Date.now();

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      assertion();
      return;
    } catch (error) {
      if (Date.now() - start >= timeout) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }
}
