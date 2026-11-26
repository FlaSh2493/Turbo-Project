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
  criteria,
  init,
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
const HUSKY = { ".husky/pre-commit": "pnpm lint-staged\n" };

describe("init", () => {
  it("PR 템플릿과 AGENTS.md 블록을 만들고 CODEOWNERS는 만들지 않는다", () => {
    const dir = repo({ ...HUSKY, "package.json": "{}" });
    const { todo } = init(dir);
    assert.deepEqual(todo, []);
    assert.ok(existsSync(join(dir, ".github/pull_request_template.md")));
    assert.equal(existsSync(join(dir, ".github/CODEOWNERS")), false);
    assert.equal(read(dir, "AGENTS.md"), `${AGENTS_BLOCK}\n`);
  });

  it("훅 도구가 있으면 package.json 스크립트를 건드리지 않는다", () => {
    const dir = repo({ ...HUSKY, "package.json": JSON.stringify({ scripts: { lint: "eslint ." } }) });
    init(dir);
    assert.deepEqual(JSON.parse(read(dir, "package.json")).scripts, { lint: "eslint ." });
  });

  it("AGENTS.md 끝에 governance 블록을 한 번만 넣고 기존 내용은 둔다", () => {
    const dir = repo({ ...HUSKY, "AGENTS.md": "# 레포\n\n## 이 레포\n" });
    init(dir);
    init(dir);
    assert.equal(read(dir, "AGENTS.md"), `# 레포\n\n## 이 레포\n\n${AGENTS_BLOCK}\n`);
  });

  it("AGENTS.md가 없으면 governance 블록만 있는 파일을 만든다", () => {
    const dir = repo(HUSKY);
    init(dir);
    assert.equal(read(dir, "AGENTS.md"), `${AGENTS_BLOCK}\n`);
  });

  it("블록 안만 지금 버전으로 다시 쓰고 블록 밖은 그대로 둔다", () => {
    const old = "<!-- BEGIN:governance -->\n## PR\n\n- 다른 문장\n<!-- END:governance -->";
    const dir = repo({ ...HUSKY, "AGENTS.md": `# 레포\n\n${old}\n\n## 아래\n` });
    init(dir);
    assert.equal(read(dir, "AGENTS.md"), `# 레포\n\n${AGENTS_BLOCK}\n\n## 아래\n`);
  });

  it("블록 밖에 같은 명령이 적혀 있어도 블록을 넣는다", () => {
    const dir = repo({ ...HUSKY, "AGENTS.md": "# 레포\n\n- `governance judge` 설명\n" });
    init(dir);
    assert.ok(read(dir, "AGENTS.md").includes(AGENTS_BLOCK));
  });

  it("docs/governance.md는 만들지 않는다", () => {
    const dir = repo(HUSKY);
    init(dir);
    assert.equal(existsSync(join(dir, "docs/governance.md")), false);
  });

  it("PR 템플릿은 먼저 볼 섹션부터 두고, 수락 기준 앞에 검증이 들어갈 자리가 있다", () => {
    const dir = repo(HUSKY);
    init(dir);
    const template = read(dir, ".github/pull_request_template.md");
    const headings = [...template.matchAll(/^## (.+)$/gm)].map((match) => match[1]);
    assert.deepEqual(headings.slice(0, 7), ["요약", "주의할 점", "직접 확인할 것", "영향받는 곳", "수락 기준", "렌더 테스트로 확인한 흐름", "되돌리는 방법"]);
    assert.match(template, /`## 검증`은 governance judge가 넣는다/);
    assert.match(template, /되돌린 이유/);
    assert.doesNotMatch(template, /^## (변경사항|테스트|QA 시나리오|영향 분석)$/m);
  });

  it("이미 있는 PR 템플릿은 덮어쓰지 않는다", () => {
    const files = {
      ...HUSKY,
      ".github/pull_request_template.md": "## 우리 템플릿\n",
    };
    const dir = repo(files);
    init(dir);
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
    init(dir);
    init(dir);
    assert.equal(read(dir, ".husky/pre-push"), `pnpm check-types\n${LINE}\n`);
  });

  it("lefthook을 쓰면 설정 파일의 pre-push에 명령을 더하고 기존 설정은 둔다", () => {
    const dir = repo({ "lefthook.yml": "# 우리 설정\npre-commit:\n  commands:\n    lint:\n      run: pnpm lint\n" });
    init(dir);
    init(dir);
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
    init(dir);
    init(dir);
    assert.equal(
      JSON.parse(read(dir, "package.json"))["simple-git-hooks"]["pre-push"],
      `pnpm test && (${LINE})`,
    );
  });

  it("훅 도구가 없으면 git 훅에 넣고, 팀원 PC에도 깔리게 prepare에 설치 명령을 더한다", () => {
    const dir = gitRepo({ "package.json": JSON.stringify({ scripts: { prepare: "pnpm build" } }) });
    const { done } = init(dir);
    init(dir);
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
    init(dir);
    assert.match(read(dir, "githooks/pre-push"), /governance judge/);
  });

  it("git 레포가 아니면 실패하지 않고 남은 일로 알린다", () => {
    const dir = repo();
    const { todo } = init(dir);
    assert.ok(todo.some((line) => line.includes("governance hook")));
  });
});

describe("머지 기준", () => {
  it("설치된 버전을 머리에 달고 criteria.md를 그대로 보여 준다", () => {
    const text = criteria();
    assert.ok(text.startsWith(`<!-- @turbo-project/governance@${VERSION} -->\n# 머지 기준`));
    assert.match(text, /## 테스트 없음/);
    assert.match(text, /## 동등 변이/);
    assert.doesNotMatch(text, /risk:|CODEOWNERS 오너/);
  });
});
