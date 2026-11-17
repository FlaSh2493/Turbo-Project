import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  classify,
  DEFAULT_CONFIG,
  isOwned,
  parseCodeowners,
  reviewersFor,
  SIGNALS,
} from "../../scripts/risk-tier.mjs";

const codeowners = parseCodeowners(`
# 주석은 무시한다
/.github/                @a @b
/src/proxy.ts            @a @b
package.json             @a @b
/apps/*/config/          @a @b
/apps/server/            @a @b
/apps/server/docs/
Dockerfile*              @a @b
`);

const config = DEFAULT_CONFIG;

const NO_RISK = Object.fromEntries(
  Object.keys(SIGNALS).map((key) => [key, { flag: false, reason: "" }]),
);
const flag = (key, reason = "") => ({
  ...NO_RISK,
  [key]: { flag: true, reason },
});

const pr = (overrides) => ({
  title: "feat: x",
  body: "",
  head: "feat/x",
  base: "main",
  sameRepo: true,
  revertVerified: false,
  judgement: NO_RISK,
  ...overrides,
});
const file = (path, lines = 10) => ({ path, additions: lines, deletions: 0 });

describe("CODEOWNERS 읽기", () => {
  it("앞에 / 가 있는 디렉터리는 그 아래 전부다", () => {
    assert.equal(isOwned(codeowners, ".github/workflows/deploy.yml"), true);
    assert.equal(isOwned(codeowners, "docs/.github/x"), false);
  });

  it("슬래시 없는 패턴은 어느 깊이의 파일 이름에도 맞는다", () => {
    assert.equal(isOwned(codeowners, "package.json"), true);
    assert.equal(isOwned(codeowners, "apps/host/package.json"), true);
    assert.equal(isOwned(codeowners, "apps/static/Dockerfile.prod"), true);
  });

  it("* 는 한 단계 이름에만 맞는다", () => {
    assert.equal(isOwned(codeowners, "apps/host/config/webpack.ts"), true);
    assert.equal(isOwned(codeowners, "apps/host/src/config/x.ts"), false);
  });

  it("오너 없이 적은 아래 줄이 위 줄을 덮어 high 에서 뺀다", () => {
    assert.equal(isOwned(codeowners, "apps/server/app.js"), true);
    assert.equal(isOwned(codeowners, "apps/server/docs/csp.md"), false);
  });

  it("정확한 파일 경로는 그 파일만 맞는다", () => {
    assert.equal(isOwned(codeowners, "src/proxy.ts"), true);
    assert.equal(isOwned(codeowners, "src/proxy.tsx"), false);
  });
});

describe("등급", () => {
  it("승격 PR 은 판정 없이 low 다", () => {
    const result = classify({
      pr: pr({ head: "develop", judgement: null }),
      files: [file(".github/x.yml")],
      config,
      codeowners,
    });
    assert.equal(result.tier, "low");
  });

  it("보호 브랜치에서 일반 브랜치로 가는 PR은 승격으로 보지 않는다", () => {
    const result = classify({
      pr: pr({ head: "develop", base: "feat/x", judgement: flag("untestable") }),
      files: [file(".github/x.yml")],
      config,
      codeowners,
    });
    assert.equal(result.tier, "high");
  });

  it("보호 브랜치는 main, develop, staging이다", () => {
    for (const [head, base] of [["develop", "main"], ["staging", "main"], ["main", "develop"], ["develop", "staging"]])
      assert.equal(
        classify({ pr: pr({ head, base }), files: [file(".github/x.yml")], config, codeowners }).tier,
        "low",
        `${head} → ${base}`,
      );
  });

  it("revert PR 은 CODEOWNERS 경로를 되돌려도 판정 없이 low 다", () => {
    const result = classify({
      pr: pr({ title: 'Revert "ci: x"', revertVerified: true, judgement: null }),
      files: [file(".github/x.yml")],
      config,
      codeowners,
    });
    assert.equal(result.tier, "low");
  });

  it("CODEOWNERS 경로를 건드려도 판정에 신호가 없으면 low 다", () => {
    const result = classify({
      pr: pr(),
      files: [file("src/proxy.ts")],
      config,
      codeowners,
    });
    assert.deepEqual(result, { tier: "low", reasons: ["신호 없음"] });
  });

  it("테스트가 증명하지 못하는 변경이면 high 다", () => {
    const result = classify({
      pr: pr({ judgement: flag("untestable", "src/proxy.ts:3 로그인 체크") }),
      files: [file("src/proxy.ts")],
      config,
      codeowners,
    });
    assert.equal(result.tier, "high");
    assert.deepEqual(result.reasons, [
      "위험 판정: 테스트가 증명하지 못함 — src/proxy.ts:3 로그인 체크",
    ]);
  });

  it("high인데 바뀐 파일이 CODEOWNERS에 없으면 GitHub가 막지 않는다고 알린다", () => {
    const result = classify({
      pr: pr({ judgement: flag("untestable") }),
      files: [file("src/middleware/auth.ts"), file("src/middleware/auth.test.ts")],
      config,
      codeowners,
    });
    assert.equal(result.tier, "high");
    assert.match(result.reasons.at(-1), /CODEOWNERS에 없어 GitHub가 머지를 막지 않습니다/);
  });

  it("high 신호와 medium 신호가 같이 켜지면 high 다", () => {
    const result = classify({
      pr: pr({
        judgement: { ...flag("untestable"), "wider-access": { flag: true, reason: "" } },
      }),
      files: [file("src/proxy.ts")],
      config,
      codeowners,
    });
    assert.equal(result.tier, "high");
  });
});

describe("위험 판정", () => {
  for (const key of ["wider-access", "external-effect", "bulk-change", "stored-format", "new-pattern"]) {
    it(`${key}가 있음이면 medium이다`, () => {
      const result = classify({
        pr: pr({ judgement: flag(key, "src/features/a/x.ts:3") }),
        files: [file("src/features/a/x.ts")],
        config,
        codeowners,
      });
      assert.equal(result.tier, "medium");
      assert.deepEqual(result.reasons, [
        `위험 판정: ${SIGNALS[key]} — src/features/a/x.ts:3`,
      ]);
    });
  }

  it("현재 커밋의 판정이 없으면 medium다", () => {
    const result = classify({
      pr: pr({ judgement: null }),
      files: [file("src/proxy.ts")],
      config,
      codeowners,
    });
    assert.equal(result.tier, "medium");
    assert.match(result.reasons[0], /위험 판정 없음/);
  });

  it("승격·revert PR은 판정이 없어도 low다", () => {
    for (const overrides of [
      { head: "develop", judgement: null },
      { title: 'Revert "fix: x"', revertVerified: true, judgement: null },
    ])
      assert.equal(
        classify({
          pr: pr(overrides),
          files: [file("src/features/a/x.ts")],
          config,
          codeowners,
        }).tier,
        "low",
      );
  });
});

describe("테스트 없음", () => {
  it("테스트 없음이 있음이면 등급과 함께 막을 이유를 낸다", () => {
    for (const [judgement, tier] of [
      [flag("missing-test", "src/a.ts:3"), "low"],
      [{ ...flag("missing-test", "src/a.ts:3"), "bulk-change": { flag: true, reason: "" } }, "medium"],
      [{ ...flag("missing-test", "src/a.ts:3"), untestable: { flag: true, reason: "" } }, "high"],
    ]) {
      const result = classify({ pr: pr({ judgement }), files: [file("src/a.ts")], config, codeowners });
      assert.equal(result.tier, tier);
      assert.equal(result.blocked, "위험 판정: 테스트 없음 — src/a.ts:3");
    }
  });

  it("테스트 없음이 없음이면 막지 않는다", () => {
    const result = classify({ pr: pr(), files: [file("src/a.ts")], config, codeowners });
    assert.equal(result.blocked, undefined);
  });
});

describe("리뷰에서 나온 우회 막기", () => {
  it("포크의 develop 브랜치에서 온 PR 은 승격으로 보지 않는다", () => {
    const result = classify({
      pr: pr({ head: "develop", sameRepo: false, judgement: flag("untestable") }),
      files: [file(".github/x.yml")],
      config,
      codeowners,
    });
    assert.equal(result.tier, "high");
  });

  it("원래 PR 을 확인하지 못한 revert 는 일반 PR 처럼 판정한다", () => {
    const result = classify({
      pr: pr({ title: 'Revert "ci: x"', judgement: flag("untestable") }),
      files: [file(".github/x.yml")],
      config,
      codeowners,
    });
    assert.equal(result.tier, "high");
    assert.match(result.reasons[0], /revert PR로 보지 않음/);
  });

  it("확인하지 못한 revert 라도 다른 신호가 없으면 low 로 둔다", () => {
    const result = classify({
      pr: pr({ title: 'Revert "fix: x"' }),
      files: [file("src/features/a/x.ts")],
      config,
      codeowners,
    });
    assert.equal(result.tier, "low");
  });
});

describe("리뷰어와 다른 오너", () => {
  const codeowners = parseCodeowners(`
/.github/                @main @sub
/package.json            @main @sub
`);
  const featureOwners = parseCodeowners(`
*                         @main @sub
/src/features/report/     @kim
/src/features/agent/      @lee @choi
/src/features/legacy/
`);
  const ask = (tier, paths, author = "park", feature = featureOwners) =>
    reviewersFor({
      tier,
      files: paths.map((path) => file(path)),
      featureOwners: feature,
      codeowners,
      author,
    });

  it("low 등급은 아무도 요청하지 않는다", () => {
    assert.deepEqual(ask("low", ["src/features/report/a.ts"]), {
      requested: [],
      suggested: [],
    });
  });

  it("medium 등급에 피처 오너가 있으면 피처 오너를 지정하고 기본 오너는 모두 다른 오너로 둔다", () => {
    assert.deepEqual(ask("medium", ["src/features/report/a.ts"]), {
      requested: ["kim"],
      suggested: ["main", "sub"],
    });
  });

  it("medium 등급에서 같은 피처의 다른 오너도 다른 오너로 둔다", () => {
    assert.deepEqual(ask("medium", ["src/features/agent/a.ts"]), {
      requested: ["lee"],
      suggested: ["choi", "main", "sub"],
    });
  });

  it("medium 등급에 피처 오너가 없으면 메인 오너를 지정하고 다른 기본 오너는 다른 오너로 둔다", () => {
    assert.deepEqual(ask("medium", ["src/shared/lib/a.ts"]), {
      requested: ["main"],
      suggested: ["sub"],
    });
    assert.deepEqual(ask("medium", ["src/features/legacy/a.ts"]), {
      requested: ["main"],
      suggested: ["sub"],
    });
  });

  it("작성자가 피처 오너면 메인 오너를 지정한다", () => {
    assert.deepEqual(ask("medium", ["src/features/report/a.ts"], "Kim"), {
      requested: ["main"],
      suggested: ["sub"],
    });
  });

  it("FEATURE_OWNERS가 없으면 CODEOWNERS의 첫 오너가 메인 오너다", () => {
    assert.deepEqual(ask("medium", ["src/shared/lib/a.ts"], "park", []), {
      requested: ["main"],
      suggested: ["sub"],
    });
  });

  it("high 등급은 메인 오너를 지정하고 다른 기본 오너와 피처 오너를 다른 오너로 둔다", () => {
    assert.deepEqual(
      ask("high", [".github/workflows/a.yml", "src/features/report/a.ts"]),
      { requested: ["main"], suggested: ["sub", "kim"] },
    );
  });

  it("high 등급은 CODEOWNERS 줄 순서와 관계없이 메인 오너를 지정한다", () => {
    const owners = parseCodeowners(`
/package.json            @sub @main
`);
    assert.deepEqual(
      reviewersFor({
        tier: "high",
        files: [file("package.json")],
        featureOwners,
        codeowners: owners,
        author: "park",
      }),
      { requested: ["main"], suggested: ["sub"] },
    );
  });

  it("기본 오너가 올린 high 등급은 기본 오너가 아닌 CODEOWNERS 오너도 다른 오너로 둔다", () => {
    const owners = parseCodeowners(`
/.github/                @main @infra @sub
`);
    assert.deepEqual(
      reviewersFor({
        tier: "high",
        files: [file(".github/a.yml")],
        featureOwners,
        codeowners: owners,
        author: "main",
      }),
      { requested: [], suggested: ["sub", "infra"] },
    );
  });

  for (const tier of ["medium", "high"]) {
    it(`메인 오너가 올린 ${tier}등급은 아무도 요청하지 않고 피처 오너와 다른 기본 오너를 다른 오너로 둔다`, () => {
      assert.deepEqual(
        ask(tier, ["package.json", "src/features/agent/a.ts"], "main"),
        { requested: [], suggested: ["lee", "choi", "sub"] },
      );
    });
  }

  it("메인 오너가 아닌 기본 오너가 올린 medium은 셀프머지한다", () => {
    assert.deepEqual(ask("medium", ["src/features/agent/a.ts"], "sub"), {
      requested: [],
      suggested: ["lee", "choi", "main"],
    });
  });

  it("메인 오너가 아닌 기본 오너가 올린 high는 메인 오너를 지정한다", () => {
    assert.deepEqual(ask("high", ["package.json"], "sub").requested, ["main"]);
  });

  it("high인데 바뀐 파일이 CODEOWNERS에 없으면 메인 오너를 지정한다", () => {
    assert.deepEqual(ask("high", ["src/middleware/auth.ts"]), {
      requested: ["main"],
      suggested: ["sub"],
    });
  });
});
