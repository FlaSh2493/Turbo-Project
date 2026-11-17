import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

export default {
  testRunner: "vitest",
  plugins: [require.resolve("@stryker-mutator/vitest-runner")],
  mutate: [
    "src/**/lib/**/*.ts",
    "!**/__tests__/**",
    "!**/*.{test,spec}.ts",
    "!**/*.d.ts",
    "!**/index.ts",
    "!src/**/generated/**",
    "!src/**/msw/**",
  ],
  vitest: { related: true },
  coverageAnalysis: "perTest",
  dryRunTimeoutMinutes: 10,
  reporters: ["clear-text", "progress", "html", "json"],
  htmlReporter: { fileName: "reports/mutation/index.html" },
  thresholds: { high: 80, low: 60, break: null },
  ignoreStatic: true,
  incremental: true,
  incrementalFile: "reports/mutation/stryker-incremental.json",
};
