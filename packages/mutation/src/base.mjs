import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

export default {
  testRunner: "vitest",
  plugins: [require.resolve("@stryker-mutator/vitest-runner")],
  mutate: [
    "src/**/*.ts",
    "!**/__tests__/**",
    "!**/*.{test,spec}.ts",
    "!**/*.d.ts",
    "!**/index.ts",
    "!src/**/generated/**",
    "!src/**/msw/**",
    "!**/e2e/**",
    "!**/*.stories.ts",
  ],
  // 문자열 변이는 로그·에러 문구에서 잡을 필요가 없는 변이를 많이 만든다.
  mutator: { excludedMutations: ["StringLiteral"] },
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
