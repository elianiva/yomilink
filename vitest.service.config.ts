import { defineConfig } from "vitest/config";

const baseConfig = {
  environment: "jsdom",
  alias: {
    "@": new URL("./src/", import.meta.url).pathname,
    "cloudflare:workers": new URL(
      "./src/__tests__/mocks/cloudflare-workers.ts",
      import.meta.url,
    ).pathname,
  },
  globals: true,
  setupFiles: ["./src/__tests__/setup/index.ts"],
};

export default defineConfig({
  test: {
    ...baseConfig,
    environment: "jsdom",
    include: [
      "src/**/*.test.ts",
    ],
    name: "service",
  },
});
