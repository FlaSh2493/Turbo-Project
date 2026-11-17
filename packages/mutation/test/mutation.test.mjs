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

  it("레포가 정하지 않아도 lib 폴더의 순수 함수를 대상으로 한다", () => {
    assert.equal(base.mutate[0], "src/**/lib/**/*.ts");
    assert.ok(base.mutate.includes("!**/__tests__/**"));
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
