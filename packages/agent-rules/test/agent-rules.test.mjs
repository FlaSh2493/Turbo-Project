import assert from "node:assert/strict";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readlinkSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, describe, it } from "node:test";

import { check, init, sync } from "../src/commands.mjs";
import {
  BEGIN,
  CLAUDE_LINK,
  END,
  detectPresets,
  listPresets,
  loadPreset,
  parseRuleFile,
  readExceptions,
  ruleIndex,
} from "../src/core.mjs";

const dirs = [];
after(() =>
  dirs.forEach((dir) => rmSync(dir, { recursive: true, force: true })),
);

const PKG = JSON.stringify({
  name: "web",
  packageManager: "pnpm@10.0.0",
  scripts: { lint: "eslint .", prepare: "husky" },
  dependencies: { react: "19", next: "16", "@tanstack/react-query": "5" },
});

function repo(files = {}) {
  const dir = mkdtempSync(join(tmpdir(), "agent-rules-"));
  dirs.push(dir);
  for (const [path, text] of Object.entries({ "package.json": PKG, ...files })) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), text);
  }
  return dir;
}

const read = (dir, path) => readFileSync(join(dir, path), "utf8");
const write = (dir, path, text) => writeFileSync(join(dir, path), text);
const pkgOf = (dir) => JSON.parse(read(dir, "package.json"));

const AGENTS = `# web

# 레포 규칙

## 이 레포

- 스택: Next.js

## 예외

없다.
`;

describe("패키지 규칙 원본", () => {
  const presets = listPresets().map((name) => loadPreset(name));

  it("모든 규칙 제목이 [ID] 형식이고 ID가 겹치지 않는다", () => {
    const ids = presets.flatMap((preset) =>
      [...(preset.agents ? [preset.agents] : []), ...preset.files].flatMap(
        (file) => file.sections.map((section) => section.id),
      ),
    );
    assert.equal(new Set(ids).size, ids.length);
    assert.ok(ids.length > 20);
  });

  it("base에 AGENTS.md와 🔒 안전 규칙이 있다", () => {
    const base = loadPreset("base");
    assert.ok(base.agents);
    const locked = base.agents.sections
      .filter((s) => s.locked)
      .map((s) => s.id);
    assert.deepEqual(locked.sort(), [
      "BASE-CONFIRM",
      "BASE-GENERATED",
      "BASE-NO-BYPASS",
    ]);
  });

  it("공통 파일 이름이 겹치지 않는다", () => {
    const names = presets.flatMap((preset) => preset.files.map((f) => f.name));
    assert.equal(new Set(names).size, names.length);
  });

  it("공통 파일마다 블록 목록에 붙일 when이 있다", () => {
    for (const file of presets.flatMap((preset) => preset.files))
      assert.ok(file.when, `${file.name}에 when이 없다`);
  });

  it("규칙이 가리키는 [ID]는 모두 있는 규칙이다", () => {
    const index = ruleIndex(presets);
    for (const rule of index.values())
      for (const [, id] of rule.text.matchAll(/`\[([A-Z][A-Z0-9-]*)\]`/g))
        assert.ok(index.has(id), `${rule.id}가 없는 ${id}를 가리킨다`);
  });
});

describe("규칙 파일 읽기", () => {
  it("코드 블록 안의 ## 는 규칙 제목으로 보지 않는다", () => {
    const parsed = parseRuleFile(
      "# 제목\n\n## [A-ONE] 하나\n\n```markdown\n## QA 시나리오\n```\n",
    );
    assert.equal(parsed.sections.length, 1);
    assert.match(parsed.sections[0].text, /## QA 시나리오/);
  });

  it("frontmatter의 when을 읽고 사본의 frontmatter에서는 뺀다", () => {
    const parsed = parseRuleFile(
      "---\nwhen: '테스트를 쓸 때'\npaths:\n  - 'src/**'\n---\n\n# 제목\n",
    );
    assert.equal(parsed.when, "테스트를 쓸 때");
    assert.equal(parsed.frontmatter, "---\npaths:\n  - 'src/**'\n---\n");
  });

  it("when만 있는 frontmatter는 사본에 남기지 않는다", () => {
    const parsed = parseRuleFile("---\nwhen: '규칙을 고칠 때'\n---\n\n# 제목\n");
    assert.equal(parsed.when, "규칙을 고칠 때");
    assert.equal(parsed.frontmatter, null);
  });

  it("ID가 없는 ## 제목은 오류다", () => {
    assert.throws(() => parseRuleFile("## 그냥 제목\n"), /\[ID\]/);
  });

  it("🔒 표시를 잠긴 규칙으로 읽는다", () => {
    const [section] = parseRuleFile("## 🔒 [A-LOCK] 잠금\n").sections;
    assert.equal(section.locked, true);
    assert.equal(section.id, "A-LOCK");
  });
});

describe("묶음 감지", () => {
  it("base는 항상, 기술 묶음은 의존성이 있을 때만 쓴다", () => {
    assert.deepEqual(detectPresets(repo()), [
      "base",
      "frontend/fsd",
      "frontend/data-layer",
      "frontend/nextjs",
    ]);
    assert.deepEqual(detectPresets(repo({ "package.json": "{}" })), ["base"]);
  });

  it("pnpm 워크스페이스 패키지의 의존성도 본다", () => {
    const dir = repo({
      "package.json": "{}",
      "pnpm-workspace.yaml": "packages:\n  - apps/*\n",
      "apps/web/package.json": JSON.stringify({
        dependencies: { "@turbo-project/afds": "1" },
      }),
    });
    assert.ok(detectPresets(dir).includes("frontend/afds"));
  });
});

describe("init", () => {
  it("빈 레포에 AGENTS.md·스크립트·공통 규칙을 만들고 check를 통과한다", () => {
    const dir = repo();
    const { todo } = init(dir);
    assert.deepEqual(todo, []);
    const agents = read(dir, "AGENTS.md");
    assert.ok(agents.indexOf(BEGIN) < agents.indexOf("# 레포 규칙"));
    assert.match(agents, /\[BASE-REQ\]/);
    assert.match(agents, /\(\.agents\/rules\/common\/nextjs\.md\)/);
    for (const path of [
      ".agents/rules/common/fsd.md",
      ".agents/rules/common/rule-format.md",
    ])
      assert.ok(existsSync(join(dir, path)), path);
    assert.equal(existsSync(join(dir, ".agents/rules/common/afds.md")), false);
    assert.equal(existsSync(join(dir, ".github/workflows/agent-rules.yml")), false);
    const { scripts } = pkgOf(dir);
    assert.equal(scripts.prepare, "husky");
    assert.equal(scripts["agents:init"], "agent-rules init");
    assert.equal(scripts["agents:check"], "agent-rules check");
    assert.equal(scripts.lint, "eslint .");
    assert.match(read(dir, ".prettierignore"), /\.agents\/rules\/common\//);
    assert.deepEqual(check(dir).errors, []);
  });

  it("블록의 공통 파일 목록에 언제 읽는지를 붙이고 사본에는 when을 남기지 않는다", () => {
    const dir = repo();
    init(dir);
    const agents = read(dir, "AGENTS.md");
    assert.match(agents, /같은 이름의 `\.agents\/rules\/custom\/` 파일이 있으면 함께 읽는다/);
    assert.match(agents, /^- 테스트를 쓸 때는 \[testing\]\(\.agents\/rules\/common\/testing\.md\)$/m);
    assert.doesNotMatch(read(dir, ".agents/rules/common/testing.md"), /^when:/m);
    assert.ok(read(dir, ".agents/rules/common/rule-format.md").startsWith("<!--"));
  });

  it(".claude/rules에 규칙 폴더를 연결한다", () => {
    const dir = repo();
    init(dir);
    const link = join(dir, CLAUDE_LINK);
    assert.ok(lstatSync(link).isSymbolicLink());
    assert.equal(readlinkSync(link), "../../.agents/rules");
    assert.ok(existsSync(join(dir, ".claude/rules/agent-rules/common/testing.md")));
  });

  it(".claude/rules/agent-rules가 다른 것으로 있으면 덮지 않고 알린다", () => {
    const dir = repo({ ".claude/rules/agent-rules/mine.md": "내 규칙\n" });
    const { todo } = init(dir);
    assert.ok(todo.some((line) => line.includes(CLAUDE_LINK)));
    assert.equal(read(dir, ".claude/rules/agent-rules/mine.md"), "내 규칙\n");
    assert.ok(check(dir).errors.some((e) => e.includes(CLAUDE_LINK)));
  });

  it("손으로 쓴 AGENTS.md는 제목 아래에 블록만 넣고 내용을 그대로 둔다", () => {
    const dir = repo({ "AGENTS.md": "# web\n\n손으로 쓴 지침이다.\n" });
    init(dir);
    const agents = read(dir, "AGENTS.md");
    assert.ok(agents.startsWith("# web\n\n" + BEGIN));
    assert.match(agents, new RegExp(`${END}\n\n# 레포 규칙\n\n손으로 쓴 지침이다.`));
  });

  it("두 번 돌려도 바뀌는 것이 없다", () => {
    const dir = repo();
    init(dir);
    const before = read(dir, "AGENTS.md");
    const { done } = init(dir);
    assert.deepEqual(done, []);
    assert.equal(read(dir, "AGENTS.md"), before);
  });

  it("다른 패키지가 AGENTS.md에 쓴 블록은 그대로 둔다", () => {
    const dir = repo();
    init(dir);
    const other =
      "<!-- BEGIN:other -->\n## 다른 패키지\n\n- 다른 패키지 문장\n<!-- END:other -->";
    writeFileSync(join(dir, "AGENTS.md"), `${read(dir, "AGENTS.md").trimEnd()}\n\n${other}\n`);
    const before = read(dir, "AGENTS.md");
    init(dir);
    assert.equal(read(dir, "AGENTS.md"), before);
    assert.deepEqual(check(dir).errors, []);
  });

  it("다른 패키지 블록만 있는 AGENTS.md에는 견본을 넣고 그 블록을 뒤에 남긴다", () => {
    const other =
      "<!-- BEGIN:other -->\n## 다른 패키지\n\n- 다른 패키지 문장\n<!-- END:other -->";
    const dir = repo({ "AGENTS.md": `${other}\n` });
    init(dir);
    const agents = read(dir, "AGENTS.md");
    const line = (pattern) => agents.search(pattern);
    assert.ok(line(BEGIN) < line(/^## 이 레포$/m));
    assert.ok(line(/^## 예외$/m) < line(/^<!-- BEGIN:other -->$/m));
    assert.equal(agents.split(other).length, 2);
    assert.deepEqual(check(dir).errors, []);
  });
});

describe("sync", () => {
  it("블록 밖은 그대로 두고 블록과 common/만 다시 쓴다", () => {
    const dir = repo({ "AGENTS.md": AGENTS });
    sync(dir);
    const agents = read(dir, "AGENTS.md");
    const broken = agents.replace("# 공통 규칙", "# 공통 규칙 (손댐)");
    write(dir, "AGENTS.md", `${broken}\n## 추가\n\n사람이 쓴 줄\n`);
    write(dir, ".agents/rules/common/fsd.md", "손댐\n");
    write(dir, ".agents/rules/common/old.md", "예전 파일\n");
    const { written } = sync(dir);
    assert.ok(written.includes(".agents/rules/common/old.md (지움)"));
    const after = read(dir, "AGENTS.md");
    assert.doesNotMatch(after, /손댐/);
    assert.match(after, /사람이 쓴 줄/);
    assert.deepEqual(check(dir).errors, []);
  });

  it("AGENTS.md가 없으면 아무것도 쓰지 않고 알린다", () => {
    const dir = repo();
    const { errors, written } = sync(dir);
    assert.deepEqual(written, []);
    assert.match(errors[0], /init/);
    assert.equal(existsSync(join(dir, ".agents")), false);
  });

  it("모노레포는 공통 파일 paths를 워크스페이스 경로로 바꾼다", () => {
    const dir = repo({
      "AGENTS.md": AGENTS,
      "pnpm-workspace.yaml": "packages:\n  - apps/*\n",
    });
    sync(dir);
    assert.match(read(dir, ".agents/rules/common/fsd.md"), /- 'apps\/\*\/src\/\*\*'/);
  });
});

describe("예외", () => {
  it("끄기와 바꾸기 모두 공통 문서를 그대로 두고 블록 밖만 바뀐다", () => {
    const text = AGENTS.replace(
      "없다.",
      "- [FSD-SPLIT] 끈다. 이유: 린트\n- [CODE-LOG] 이 레포에서는 디버그 로그만 남긴다. 이유: 테스트",
    );
    const dir = repo({ "AGENTS.md": text });
    sync(dir);
    assert.match(read(dir, ".agents/rules/common/fsd.md"), /FSD-SPLIT/);
    assert.deepEqual(check(dir).errors, []);
    assert.match(read(dir, ".agents/rules/common/code-conventions.md"), /CODE-LOG/);
    assert.deepEqual(
      readExceptions(read(dir, "AGENTS.md")).map((e) => e.id),
      ["FSD-SPLIT", "CODE-LOG"],
    );
  });

  it("없는 규칙이나 🔒 규칙을 적으면 sync와 check가 실패한다", () => {
    const text = AGENTS.replace(
      "없다.",
      "- [FSD-SPIT] 끈다. 이유: 오타\n- [BASE-CONFIRM] 끈다. 이유: 귀찮다",
    );
    const dir = repo({ "AGENTS.md": text });
    const { errors, written } = sync(dir);
    assert.deepEqual(written, []);
    assert.ok(errors.some((e) => /"FSD-SPIT"는 없는 규칙/.test(e)));
    assert.ok(errors.some((e) => /"BASE-CONFIRM"는 🔒/.test(e)));
  });
});

describe("check", () => {
  it("common/을 손으로 고치면 실패한다", () => {
    const dir = repo({ "AGENTS.md": AGENTS });
    sync(dir);
    write(dir, ".agents/rules/common/fsd.md", "손댐\n");
    assert.ok(check(dir).errors.some((e) => e.includes("common/fsd.md")));
  });

  it("블록을 손으로 고치면 실패한다", () => {
    const dir = repo({ "AGENTS.md": AGENTS });
    sync(dir);
    write(dir, "AGENTS.md", read(dir, "AGENTS.md").replace("# 공통 규칙", "# 공통"));
    assert.ok(check(dir).errors.some((e) => e.includes("블록")));
  });

  it(".claude/rules 연결이 없으면 실패한다", () => {
    const dir = repo({ "AGENTS.md": AGENTS });
    sync(dir);
    rmSync(join(dir, CLAUDE_LINK));
    assert.ok(check(dir).errors.some((e) => e.includes(CLAUDE_LINK)));
  });

  it("AGENTS.md가 없는 규칙 파일을 링크하면 실패한다", () => {
    const text = AGENTS.replace(
      "## 예외",
      "## 규칙 파일\n\n- 결제를 다룰 때는 [payment.md](.agents/rules/custom/payment.md)\n\n## 예외",
    );
    const dir = repo({ "AGENTS.md": text });
    sync(dir);
    assert.ok(check(dir).errors.some((e) => e.includes(".agents/rules/custom/payment.md")));
    mkdirSync(join(dir, ".agents/rules/custom"));
    write(dir, ".agents/rules/custom/payment.md", "# 결제\n");
    assert.deepEqual(check(dir).errors, []);
  });

  it("견본의 [예: …] 줄에 있는 링크는 검사하지 않는다", () => {
    const text = AGENTS.replace(
      "## 예외",
      "## 규칙 파일\n\n- [예: 결제를 다룰 때는 [payment.md](.agents/rules/custom/payment.md)]\n\n## 예외",
    );
    const dir = repo({ "AGENTS.md": text });
    sync(dir);
    assert.deepEqual(check(dir).errors, []);
  });

  it("블록 밖을 고치는 것은 검사하지 않는다", () => {
    const dir = repo({ "AGENTS.md": AGENTS });
    sync(dir);
    write(dir, "AGENTS.md", `${read(dir, "AGENTS.md")}\n## 새 섹션\n`);
    assert.deepEqual(check(dir).errors, []);
  });
});

describe("플랜", () => {
  it("공통 규칙은 docs/plans를 가리키지 않고, 워크트리와 플랜 찾는 법을 담는다", () => {
    const dir = repo({ "AGENTS.md": AGENTS });
    init(dir);
    const all = [
      read(dir, "AGENTS.md"),
      read(dir, ".agents/rules/common/plan.md"),
      read(dir, ".agents/rules/common/qa-scenario.md"),
    ].join("\n");
    assert.doesNotMatch(all, /docs\/plans/);
    assert.match(all, /\.claude\/worktrees/);
    assert.match(all, /## \[PLAN-FIND\] 찾는 법/);
    assert.match(all, /PR 본문으로 플랜을 대신하지 않는다/);
    assert.match(all, /### 직접 확인할 것/);
    assert.equal(existsSync(join(dir, ".agents/rules/common/docs.md")), false);
  });

  it(".claude/settings.json은 만들지 않는다", () => {
    const dir = repo({ "AGENTS.md": AGENTS });
    init(dir);
    assert.equal(existsSync(join(dir, ".claude/settings.json")), false);
  });
});
