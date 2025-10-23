import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["tests/**/*.{test,spec}.{ts,tsx}"],
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "next/image": path.resolve(__dirname, "tests/mocks/next-image.tsx"),
      "@testing-library/react": path.resolve(
        __dirname,
        "tests/mocks/testing-library-react.ts",
      ),
    },
  },
});
