import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers";

declare module "../node_modules/.pnpm/@voidzero-dev+vite-plus-test@0.1.15_@opentelemetry+api@1.9.1_@types+node@25.5.0_@voidze_c9e6b1d4331b82a582014b7e91fabad5/node_modules/@voidzero-dev/vite-plus-test/dist/@vitest/expect/index.js" {
	interface Assertion<T = any> extends TestingLibraryMatchers<any, T> {}
	interface AsymmetricMatchersContaining extends TestingLibraryMatchers<any, any> {}
}
