import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, describe, it } from "node:test";

import {
  AGENTS_BLOCK,
  BASE_CONFIG,
  check,
  init,
  runArgs,
  strykerBin,
} from "../src/mutation.mjs";
import base from "../src/base.mjs";
import {
  changedLines,
  mutateList,
  mutateMatcher,
  mutatePatterns,
  survivorLine,
  survivors,
  unquotePath,
} from "../src/changed.mjs";

const dirs = [];
after(() =>
  dirs.forEach((dir) => rmSync(dir, { recursive: true, force: true })),
);

function repo(files = {}) {
  const dir = mkdtempSync(join(tmpdir(), "mutation-"));
  dirs.push(dir);
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), text);
  }
  return dir;
}

const read = (dir, path) => readFileSync(join(dir, path), "utf8");
const pkg = (scripts = {}) => JSON.stringify({ name: "app", scripts });
const RUN = { "test:mutation": "mutation run" };
const BASE_IMPORT = 'import base from "@turbo-project/mutation/base";\n';

describe("base", () => {
  it("vitest 러너 플러그인을 패키지 안의 절대 경로로 준다", () => {
    assert.equal(base.testRunner, "vitest");
    assert.ok(existsSync(base.plugins[0]), base.plugins[0]);
  });

  it("점수로 막지 않는다", () => {
    assert.equal(base.thresholds.break, null);
  });

  it("레포가 정하지 않아도 src의 .ts 파일 전체를 대상으로 하고 테스트는 뺀다", () => {
    assert.equal(base.mutate[0], "src/**/*.ts");
    assert.ok(base.mutate.includes("!**/__tests__/**"));
  });

  it("문자열 변이는 만들지 않는다", () => {
    assert.deepEqual(base.mutator.excludedMutations, ["StringLiteral"]);
  });

  it("Stryker 실행 파일을 찾는다", () => {
    assert.ok(existsSync(strykerBin()));
  });
});

describe("run", () => {
  it("레포 설정이 없으면 패키지 base로 돌린다", () => {
    const dir = repo();
    assert.deepEqual(runArgs(dir, ["--mutate", "a.ts"]), [
      "run",
      BASE_CONFIG,
      "--mutate",
      "a.ts",
    ]);
  });

  it("레포 설정이 있으면 Stryker가 그 파일을 찾게 둔다", () => {
    const dir = repo({ "stryker.config.mjs": BASE_IMPORT });
    assert.deepEqual(runArgs(dir, []), ["run"]);
  });
});

describe("init", () => {
  it("빈 레포에 스크립트, .gitignore 항목, AGENTS.md 섹션을 넣고 설정 파일은 만들지 않는다", () => {
    const dir = repo({ "package.json": pkg({ test: "vitest run" }) });
    const result = init(dir);
    assert.deepEqual(result.todo, []);
    const scripts = JSON.parse(read(dir, "package.json")).scripts;
    assert.equal(scripts["test:mutation"], "mutation run");
    assert.equal(scripts.test, "vitest run");
    assert.equal(read(dir, ".gitignore"), ".stryker-tmp*\nreports/mutation\n");
    assert.equal(read(dir, "AGENTS.md"), `${AGENTS_BLOCK}\n`);
    assert.equal(existsSync(join(dir, "stryker.config.mjs")), false);
    assert.deepEqual(check(dir).errors, []);
  });

  it("AGENTS.md가 있으면 끝에 mutation 블록을 붙이고, 다시 돌려도 한 번만 붙인다", () => {
    const dir = repo({
      "package.json": pkg(),
      "AGENTS.md": "# 앱\n\n## 명령\n\n- pnpm test\n",
    });
    init(dir);
    init(dir);
    assert.equal(
      read(dir, "AGENTS.md"),
      `# 앱\n\n## 명령\n\n- pnpm test\n\n${AGENTS_BLOCK}\n`,
    );
  });

  it("블록 안만 지금 버전으로 다시 쓰고 블록 밖은 그대로 둔다", () => {
    const old = "<!-- BEGIN:mutation -->\n## 뮤테이션\n\n- 다른 문장\n<!-- END:mutation -->";
    const dir = repo({ "package.json": pkg(RUN), "AGENTS.md": `# 앱\n\n${old}\n\n## 아래\n` });
    init(dir);
    assert.equal(read(dir, "AGENTS.md"), `# 앱\n\n${AGENTS_BLOCK}\n\n## 아래\n`);
  });

  it("블록 밖에 같은 명령이 적혀 있어도 블록을 넣는다", () => {
    const dir = repo({ "package.json": pkg(RUN), "AGENTS.md": "- `pnpm test:mutation` 설명\n" });
    init(dir);
    assert.ok(read(dir, "AGENTS.md").includes(AGENTS_BLOCK));
  });

  it("이미 적용된 레포는 아무것도 바꾸지 않는다", () => {
    const files = {
      "package.json": pkg(RUN),
      ".gitignore": "node_modules\n.stryker-tmp*\nreports/mutation",
      "AGENTS.md": `${AGENTS_BLOCK}\n`,
    };
    const dir = repo(files);
    assert.deepEqual(init(dir), { done: [], todo: [] });
    for (const [path, text] of Object.entries(files))
      assert.equal(read(dir, path), text);
  });

  it("다른 test:mutation 스크립트는 mutation run으로 바꾼다", () => {
    const dir = repo({ "package.json": pkg({ "test:mutation": "stryker run" }) });
    const { done } = init(dir);
    assert.ok(done.some((line) => /"stryker run"에서/.test(line)));
  });

  it("package.json이 없으면 남은 일로 알린다", () => {
    assert.deepEqual(init(repo()).todo, ["package.json이 없습니다."]);
  });
});

describe("check", () => {
  it("base를 펼치고 다른 값만 덮어쓴 설정은 통과한다", () => {
    const dir = repo({
      "package.json": pkg(RUN),
      "stryker.config.mjs": `${BASE_IMPORT}export default { ...base, concurrency: 2 };\n`,
    });
    assert.deepEqual(check(dir).errors, []);
  });

  it("base를 쓰지 않는 설정은 실패한다", () => {
    const dir = repo({
      "package.json": pkg(RUN),
      "stryker.config.json": "{}",
    });
    assert.match(check(dir).errors[0], /stryker\.config\.json이 .*base를 쓰지 않습니다/);
  });

  it("testRunner나 plugins를 덮어쓰면 실패한다", () => {
    const dir = repo({
      "package.json": pkg(RUN),
      "stryker.config.mjs": `${BASE_IMPORT}export default { ...base, plugins: [] };\n`,
    });
    assert.match(check(dir).errors[0], /plugins를 덮어씁니다/);
  });

  it("test:mutation 스크립트가 다르면 실패한다", () => {
    const dir = repo({ "package.json": pkg({ "test:mutation": "stryker run" }) });
    assert.equal(check(dir).errors.length, 1);
  });
});

const DIFF = `diff --git a/src/api/pause.ts b/src/api/pause.ts
--- a/src/api/pause.ts
+++ b/src/api/pause.ts
@@ -10,0 +11,3 @@ export function pause() {
+  if (ids.length > 50) throw new Error("too many");
+  const result = [];
+  return result;
@@ -30,2 +33 @@ function other() {
-  a();
-  b();
+  c();
@@ -40,3 +40,0 @@ function gone() {
-  x();
diff --git a/src/api/pause.test.ts b/src/api/pause.test.ts
--- a/src/api/pause.test.ts
+++ b/src/api/pause.test.ts
@@ -1,0 +2,2 @@
+  it("x", () => {});
+  it("y", () => {});
diff --git a/src/old.ts b/src/old.ts
--- a/src/old.ts
+++ /dev/null
@@ -1,2 +0,0 @@
-export const a = 1;
-export const b = 2;
`;

describe("바뀐 줄", () => {
  it("새 쪽 줄 범위를 파일별로 모으고, 지우기만 한 hunk와 지운 파일은 뺀다", () => {
    const files = changedLines(DIFF);
    assert.deepEqual(files.get("src/api/pause.ts"), [
      [11, 13],
      [33, 33],
    ]);
    assert.equal(files.has("src/old.ts"), false);
  });

  it("base의 mutate 범위로 거른다: 테스트, 타입 선언, index, tsx, src 밖 파일은 뺀다", () => {
    const isTarget = mutateMatcher(base.mutate);
    assert.equal(isTarget("src/api/pause.ts"), true);
    assert.equal(isTarget("src/api/pause.test.ts"), false);
    assert.equal(isTarget("src/api/__tests__/pause.ts"), false);
    assert.equal(isTarget("src/types.d.ts"), false);
    assert.equal(isTarget("src/api/index.ts"), false);
    assert.equal(isTarget("src/ui/list.tsx"), false);
    assert.equal(isTarget("src/api/msw/handlers.ts"), false);
    assert.equal(isTarget("scripts/release.mjs"), false);
  });

  it("레포 설정이 있으면 그 mutate 범위를 쓴다", async () => {
    const dir = repo({
      "stryker.config.mjs": `${BASE_IMPORT.replace("@turbo-project/mutation/base", BASE_CONFIG)}export default { ...base, mutate: ["src/**/*.ts", "!src/vendor/**"] };\n`,
    });
    const isTarget = mutateMatcher(await mutatePatterns(dir));
    assert.equal(isTarget("src/api/pause.ts"), true);
    assert.equal(isTarget("src/vendor/sdk.ts"), false);
  });

  it("Stryker처럼 패턴을 순서대로 적용해 뒤의 포함 패턴이 앞의 제외를 되살린다", () => {
    const isTarget = mutateMatcher(["src/**/*.ts", "!src/generated/**", "src/generated/keep.ts"]);
    assert.equal(isTarget("src/generated/keep.ts"), true);
    assert.equal(isTarget("src/generated/other.ts"), false);
    assert.equal(isTarget("src/a.ts"), true);
  });

  it("./로 시작하는 패턴도 Stryker처럼 같은 파일로 본다. 제외 패턴도 같다", () => {
    const isTarget = mutateMatcher(["./src/**/*.ts", "!./src/generated/**"]);
    assert.equal(isTarget("src/a.ts"), true);
    assert.equal(isTarget("src/generated/x.ts"), false);
  });

  it("minimatch 문법(대괄호)을 Stryker와 같게 읽고, 닫히지 않은 중괄호에서 멈추지 않는다", () => {
    assert.equal(mutateMatcher(["src/[ab].ts"])("src/a.ts"), true);
    assert.equal(mutateMatcher(["src/[ab].ts"])("src/c.ts"), false);
    assert.equal(mutateMatcher(["src/a{.ts"])("src/a.ts"), false);
  });

  it("레포 설정이 없으면 base의 mutate를 쓴다", async () => {
    assert.deepEqual(await mutatePatterns(repo()), base.mutate);
  });

  it("git이 따옴표로 감싼 경로를 되돌린다", () => {
    assert.equal(unquotePath('"b/src/\\355\\225\\234\\352\\270\\200.ts"'), "b/src/한글.ts");
    assert.equal(unquotePath('"b/src/a \\"b\\".ts"'), 'b/src/a "b".ts');
    assert.equal(unquotePath("b/src/a.ts"), "b/src/a.ts");
    const quoted = changedLines('+++ "b/src/\\355\\225\\234.ts"\n@@ -0,0 +1 @@\n+x\n');
    assert.deepEqual([...quoted.keys()], ["src/한.ts"]);
  });

  it("Stryker --mutate 형식(파일:시작-끝)으로 바꾼다", () => {
    assert.deepEqual(mutateList(changedLines(DIFF), mutateMatcher(base.mutate)), [
      "src/api/pause.ts:11-13",
      "src/api/pause.ts:33-33",
    ]);
  });
});

describe("살아남은 변이", () => {
  const report = {
    files: {
      "src/b.ts": {
        mutants: [
          { status: "Killed", mutatorName: "EqualityOperator", replacement: "<", location: { start: { line: 3 } } },
          { status: "Survived", mutatorName: "ConditionalExpression", replacement: "true", location: { start: { line: 9 } } },
        ],
      },
      "src/a.ts": {
        mutants: [
          { status: "NoCoverage", mutatorName: "BlockStatement", replacement: "{\n}", location: { start: { line: 4 } } },
          { status: "Timeout", mutatorName: "UpdateOperator", replacement: "i--", location: { start: { line: 5 } } },
        ],
      },
    },
  };

  it("Survived와 NoCoverage만 파일, 줄 순서로 돌려준다", () => {
    assert.deepEqual(
      survivors(report).map(({ file, line, status }) => `${file}:${line} ${status}`),
      ["src/a.ts:4 NoCoverage", "src/b.ts:9 Survived"],
    );
  });

  it("같은 줄의 변이는 열 순서로 둔다", () => {
    const sameLine = {
      files: {
        "src/c.ts": {
          mutants: [
            { status: "Survived", mutatorName: "BooleanLiteral", replacement: "false", location: { start: { line: 2, column: 20 } } },
            { status: "Survived", mutatorName: "BooleanLiteral", replacement: "false", location: { start: { line: 2, column: 9 } } },
          ],
        },
      },
    };
    assert.deepEqual(
      survivors(sameLine).map(({ column }) => column),
      [9, 20],
    );
  });

  it("리포트가 비어 있으면 없다", () => {
    assert.deepEqual(survivors({ files: {} }), []);
    assert.deepEqual(survivors(null), []);
  });

  it("한 줄로 보여 줄 때 바뀐 코드의 줄바꿈을 접는다", () => {
    assert.equal(survivorLine(survivors(report)[0]), "src/a.ts:4:0 | BlockStatement | { }");
  });
});
