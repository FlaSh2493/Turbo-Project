import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, describe, it } from "node:test";

import {
  AGENTS_BLOCK,
  codeownersProblem,
  criteria,
  init,
  UNCONFIRMED,
  VERSION,
} from "../src/governance.mjs";

const dirs = [];
after(() =>
  dirs.forEach((dir) => rmSync(dir, { recursive: true, force: true })),
);

function repo(files = {}) {
  const dir = mkdtempSync(join(tmpdir(), "governance-"));
  dirs.push(dir);
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), text);
  }
  return dir;
}

const read = (dir, path) => readFileSync(join(dir, path), "utf8");
const ANSWERS = { owners: ["no1flash"] };
const HUSKY = { ".husky/pre-commit": "pnpm lint-staged\n" };

describe("init", () => {
  it("오너만 받으면 레포에서 찾은 기본 승인 경로로 CODEOWNERS를 표시 없이 만든다", () => {
    const dir = repo({ ...HUSKY, "package.json": "{}", "src/proxy.ts": "", "next.config.ts": "" });
    const { todo } = init(dir, ANSWERS);
    assert.deepEqual(todo, []);
    const codeowners = read(dir, ".github/CODEOWNERS");
    for (const line of [
      "/.github/workflows/ @no1flash",
      "/.github/CODEOWNERS @no1flash",
      "/package.json @no1flash",
      "/src/proxy.ts @no1flash",
    ])
      assert.ok(codeowners.includes(line), line);
    assert.ok(codeowners.indexOf("*.md") < codeowners.indexOf("/package.json"));
    assert.ok(!codeowners.includes("docs/governance.md"));
    assert.equal(codeownersProblem(codeowners), null);
  });

  it("터미널이 아니면 레포에서 찾은 경로에 '확인 필요'와 오너 자리표시를 붙이고 남은 일로 알린다", () => {
    const dir = repo({ ...HUSKY, "package.json": "{}", "src/proxy.ts": "" });
    const { todo } = init(dir);
    const codeowners = read(dir, ".github/CODEOWNERS");
    assert.match(codeowners, new RegExp(UNCONFIRMED));
    assert.match(codeowners, /\/src\/proxy\.ts @메인-오너/);
    assert.ok(todo.some((line) => line.startsWith(".github/CODEOWNERS")));
  });

  it("훅 도구가 있으면 package.json 스크립트를 건드리지 않는다", () => {
    const dir = repo({ ...HUSKY, "package.json": JSON.stringify({ scripts: { lint: "eslint ." } }) });
    init(dir, ANSWERS);
    assert.deepEqual(JSON.parse(read(dir, "package.json")).scripts, { lint: "eslint ." });
  });

  it("AGENTS.md 끝에 governance 블록을 한 번만 넣고 기존 내용은 둔다", () => {
    const dir = repo({ ...HUSKY, "AGENTS.md": "# 레포\n\n## 이 레포\n" });
    init(dir, ANSWERS);
    init(dir, ANSWERS);
    assert.equal(read(dir, "AGENTS.md"), `# 레포\n\n## 이 레포\n\n${AGENTS_BLOCK}\n`);
  });

  it("AGENTS.md가 없으면 governance 블록만 있는 파일을 만든다", () => {
    const dir = repo(HUSKY);
    init(dir, ANSWERS);
    assert.equal(read(dir, "AGENTS.md"), `${AGENTS_BLOCK}\n`);
  });

  it("블록 안만 지금 버전으로 다시 쓰고 블록 밖은 그대로 둔다", () => {
    const old = "<!-- BEGIN:governance -->\n## PR\n\n- 다른 문장\n<!-- END:governance -->";
    const dir = repo({ ...HUSKY, "AGENTS.md": `# 레포\n\n${old}\n\n## 아래\n` });
    init(dir, ANSWERS);
    assert.equal(read(dir, "AGENTS.md"), `# 레포\n\n${AGENTS_BLOCK}\n\n## 아래\n`);
  });

  it("블록 밖에 같은 명령이 적혀 있어도 블록을 넣는다", () => {
    const dir = repo({ ...HUSKY, "AGENTS.md": "# 레포\n\n- `governance judge` 설명\n" });
    init(dir, ANSWERS);
    assert.ok(read(dir, "AGENTS.md").includes(AGENTS_BLOCK));
  });

  it("docs/governance.md는 만들지 않는다", () => {
    const dir = repo(HUSKY);
    init(dir, ANSWERS);
    assert.equal(existsSync(join(dir, "docs/governance.md")), false);
  });

  it("PR 템플릿에 revert 칸이 있다", () => {
    const dir = repo(HUSKY);
    init(dir, ANSWERS);
    const template = read(dir, ".github/pull_request_template.md");
    assert.match(template, /되돌린 이유/);
  });

  it("이미 있는 CODEOWNERS, PR 템플릿은 덮어쓰지 않는다", () => {
    const files = {
      ...HUSKY,
      ".github/CODEOWNERS": "/package.json @no1flash\n",
      ".github/pull_request_template.md": "## 우리 템플릿\n",
    };
    const dir = repo(files);
    init(dir, ANSWERS);
    for (const [path, text] of Object.entries(files)) assert.equal(read(dir, path), text, path);
  });
});

describe("init의 pre-push 훅", () => {
  const LINE = "pnpm exec governance judge || true";
  const gitRepo = (files = {}) => {
    const dir = repo(files);
    execFileSync("git", ["init", "-q"], { cwd: dir });
    return dir;
  };

  it("husky를 쓰면 .husky/pre-push 끝에 판정 줄을 한 번만 더한다", () => {
    const dir = repo({ ".husky/pre-push": "pnpm check-types\n" });
    init(dir, ANSWERS);
    init(dir, ANSWERS);
    assert.equal(read(dir, ".husky/pre-push"), `pnpm check-types\n${LINE}\n`);
  });

  it("lefthook을 쓰면 설정 파일의 pre-push에 명령을 더하고 기존 설정은 둔다", () => {
    const dir = repo({ "lefthook.yml": "# 우리 설정\npre-commit:\n  commands:\n    lint:\n      run: pnpm lint\n" });
    init(dir, ANSWERS);
    init(dir, ANSWERS);
    const text = read(dir, "lefthook.yml");
    assert.match(text, /# 우리 설정/);
    assert.match(text, /run: pnpm lint/);
    assert.equal(text.match(/governance judge/g).length, 1);
    assert.match(text, /pre-push:\n {2}commands:\n {4}governance-judge:\n {6}run: pnpm exec governance judge \|\| true/);
  });

  it("simple-git-hooks를 쓰면 package.json의 pre-push에 이어 붙인다", () => {
    const dir = repo({
      "package.json": JSON.stringify({ "simple-git-hooks": { "pre-push": "pnpm test" } }),
    });
    init(dir, ANSWERS);
    init(dir, ANSWERS);
    assert.equal(
      JSON.parse(read(dir, "package.json"))["simple-git-hooks"]["pre-push"],
      `pnpm test && (${LINE})`,
    );
  });

  it("훅 도구가 없으면 git 훅에 넣고, 팀원 PC에도 깔리게 prepare에 설치 명령을 더한다", () => {
    const dir = gitRepo({ "package.json": JSON.stringify({ scripts: { prepare: "pnpm build" } }) });
    const { done } = init(dir, ANSWERS);
    init(dir, ANSWERS);
    assert.match(read(dir, ".git/hooks/pre-push"), new RegExp(`^#!/bin/sh\\n${LINE.replace(/[|]/g, "\\|")}\\n$`));
    assert.equal(
      JSON.parse(read(dir, "package.json")).scripts.prepare,
      "pnpm build && (governance hook || true)",
    );
    assert.ok(done.some((line) => /prepare/.test(line)));
  });

  it("git의 hooksPath 설정을 따른다", () => {
    const dir = gitRepo({ "package.json": "{}" });
    execFileSync("git", ["config", "core.hooksPath", "githooks"], { cwd: dir });
    init(dir, ANSWERS);
    assert.match(read(dir, "githooks/pre-push"), /governance judge/);
  });

  it("git 레포가 아니면 실패하지 않고 남은 일로 알린다", () => {
    const dir = repo();
    const { todo } = init(dir, ANSWERS);
    assert.ok(todo.some((line) => line.includes("governance hook")));
  });
});

describe("공통 기준", () => {
  it("설치된 버전을 머리에 달고 criteria.md를 그대로 보여 준다", () => {
    const text = criteria();
    assert.ok(text.startsWith(`<!-- @turbo-project/governance@${VERSION} -->\n# 변경 거버넌스 공통 기준`));
    assert.match(text, /### high: 테스트가 증명하지 못하는 변경/);
    assert.match(text, /### medium: 테스트가 판단하지 못하는 변경/);
  });
});

describe("CODEOWNERS 확인", () => {
  it("없거나 표시가 남아 있으면 문제를 알려 주고, 메인 오너 한 명이면 통과한다", () => {
    assert.match(codeownersProblem(null), /없습니다/);
    assert.match(codeownersProblem("/x @메인-오너\n"), /남아 있습니다/);
    assert.match(codeownersProblem(`# ${UNCONFIRMED}\n/x @a\n`), /남아 있습니다/);
    assert.equal(codeownersProblem("/x @no1flash\n"), null);
  });
});
