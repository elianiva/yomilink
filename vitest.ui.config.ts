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
};

export default defineConfig({
  test: {
    ...baseConfig,
    environment: "jsdom",
    include: [
      "src/**/*.test.tsx",
      "src/lib/utils.test.ts",
      "src/lib/error-types.test.ts",
      "src/hooks/use-rpc-error.test.ts",
      "src/features/goal-map/lib/validator.test.ts",
      "src/features/kitbuild/lib/layout.test.ts",
      "src/features/kitbuild/lib/floating-edge-utils.test.ts",
      "src/features/learner-map/lib/grid-layout.test.ts",
      "src/features/learner-map/lib/comparator.test.ts",
    ],
    setupFiles: ["./src/__tests__/setup/ui.ts"],
    name: "ui",
  },
});
