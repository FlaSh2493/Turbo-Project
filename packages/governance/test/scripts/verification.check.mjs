import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, describe, it } from "node:test";

import {
  buildBlock,
  parseBlock,
  readMutation,
  survivorsOf,
  withBlock,
} from "../../scripts/verification.mjs";

const dirs = [];
after(() => dirs.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

function repo(files) {
  const dir = mkdtempSync(join(tmpdir(), "verification-"));
  dirs.push(dir);
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), typeof text === "string" ? text : JSON.stringify(text));
  }
  return dir;
}

const SHA = "abc1234def5678";
const survivors = [
  { file: "src/chunk.ts", line: 7, column: 10, mutator: "EqualityOperator", replacement: "ids.length >= 0" },
  { file: "src/pause.ts", line: 24, column: 3, mutator: "BlockStatement", replacement: "{}" },
];
const REPORT = {
  files: {
    "src/pause.ts": {
      mutants: [
        { status: "Killed", mutatorName: "ConditionalExpression", replacement: "true", location: { start: { line: 3 } } },
        { status: "Survived", mutatorName: "BlockStatement", replacement: "{\n}", location: { start: { line: 24, column: 3 } } },
      ],
    },
    "src/chunk.ts": {
      mutants: [{ status: "NoCoverage", mutatorName: "EqualityOperator", replacement: "ids.length >= 0", location: { start: { line: 7, column: 10 } } }],
    },
  },
};

describe("뮤테이션 리포트 읽기", () => {
  it("Survived와 NoCoverage만 모으고 바뀐 코드의 줄바꿈을 접는다", () => {
    assert.deepEqual(survivorsOf(REPORT), [
      survivors[0],
      { ...survivors[1], replacement: "{ }" },
    ]);
  });

  it("test:mutation 스크립트가 없으면 쓰지 않는 레포다", () => {
    assert.deepEqual(readMutation(repo({ "package.json": { scripts: {} } }), SHA), { state: "none" });
  });

  it("리포트가 없거나, 다른 커밋에서 돌린 리포트면 믿지 않는다", () => {
    const pkg = { scripts: { "test:mutation": "mutation run" } };
    assert.equal(readMutation(repo({ "package.json": pkg }), SHA).state, "missing");
    const stale = repo({
      "package.json": pkg,
      "reports/mutation/mutation.json": REPORT,
      "reports/mutation/head.json": { sha: "fff0000", base: "origin/develop" },
    });
    assert.deepEqual(readMutation(stale, SHA), { state: "stale", ranAt: "fff0000" });
  });

  it("다른 base에서 돌린 리포트면 믿지 않는다. base는 갈라진 커밋으로 비교한다", () => {
    const dir = repo({
      "package.json": { scripts: { "test:mutation": "mutation run" } },
      "reports/mutation/mutation.json": REPORT,
      "reports/mutation/head.json": { sha: SHA, base: "origin/develop" },
    });
    const forks = { "origin/develop": "f1", "abc999": "f1", "origin/main": "f2" };
    const forkPointOf = (ref) => forks[ref] ?? null;
    assert.equal(readMutation(dir, SHA, { expectedBase: "abc999", forkPointOf }).state, "ok");
    assert.deepEqual(readMutation(dir, SHA, { expectedBase: "origin/main", forkPointOf }), {
      state: "otherBase",
      ranBase: "origin/develop",
    });
  });

  it("돌린 뒤 base ref가 움직여도 돌릴 때 고정한 base 커밋으로 비교한다", () => {
    const dir = repo({
      "package.json": { scripts: { "test:mutation": "mutation run" } },
      "reports/mutation/mutation.json": REPORT,
      // origin/develop은 돌린 뒤 다른 곳으로 움직였다. 돌릴 때의 커밋은 old1이다.
      "reports/mutation/head.json": { sha: SHA, base: "origin/develop", baseSha: "old1" },
    });
    const forks = { "origin/develop": "f-new", old1: "f-old", "pr-base": "f-new" };
    const forkPointOf = (ref) => forks[ref] ?? null;
    assert.deepEqual(readMutation(dir, SHA, { expectedBase: "pr-base", forkPointOf }), {
      state: "otherBase",
      ranBase: "origin/develop",
    });
    forks["pr-base"] = "f-old";
    assert.equal(readMutation(dir, SHA, { expectedBase: "pr-base", forkPointOf }).state, "ok");
  });

  it("지금 커밋 리포트면 살아남은 변이를 돌려준다", () => {
    const dir = repo({
      "package.json": { scripts: { "test:mutation": "mutation run" } },
      "reports/mutation/mutation.json": REPORT,
      "reports/mutation/head.json": { sha: SHA, base: "origin/develop" },
    });
    assert.equal(readMutation(dir, SHA).survivors.length, 2);
  });
});

describe("검증 블록", () => {
  const judged = [
    { equivalent: true, reason: "빈 배열이면 반복문이 돌지 않는다" },
    { equivalent: false, reason: "실패한 id가 있을 때" },
  ];

  it("테스트와 뮤테이션이 모두 통과면 통과고, 결과를 표 첫 열의 ✅로 보여 준다", () => {
    const { pass, block, verdict } = buildBlock({
      sha: SHA,
      version: "1.0.0",
      test: { flag: false, summary: "2개 모두 있음", reason: "a.test.ts가 확인한다" },
      mutation: { state: "ok", survivors: [survivors[0]] },
      judged: [judged[0]],
    });
    assert.equal(pass, true);
    assert.match(verdict, /\*\*✅ 판정 통과\*\* · `abc1234` · \[아래 검증 보기\]\(#검증\)/);
    assert.match(block, /^<!-- verification sha=abc1234def5678 -->\n## 검증\n\n`abc1234` · governance@1\.0\.0/);
    assert.match(block, /\| ✅ \| 바뀐 동작을 확인하는 테스트가 있다 \| 2개 모두 있음 \|/);
    assert.match(block, /\| ✅ \| 뮤테이션 테스트에서 살아남은 변이가 모두 동등 변이다 \| 1개 모두 동등 변이 \|/);
    assert.match(block, /<details><summary>동등 변이 1개 \(테스트로 잡을 수 없어서 뺐다\)<\/summary>/);
    assert.match(block, /\| `src\/chunk\.ts:7:10` \| EqualityOperator `ids\.length >= 0` \| 빈 배열이면/);
    assert.match(block, /<details><summary>판정 이유<\/summary>\n\na\.test\.ts가 확인한다/);
    assert.doesNotMatch(block, /### 고칠 것/);
  });

  it("동등 변이가 아닌 변이가 있으면 실패고, 결과가 달라지는 입력을 고칠 것으로 올린다", () => {
    const { pass, block, verdict } = buildBlock({
      sha: SHA,
      version: "1.0.0",
      test: { flag: false, summary: "", reason: "" },
      mutation: { state: "ok", survivors },
      judged,
    });
    assert.equal(pass, false);
    assert.match(verdict, /❌ 판정 실패 · 고칠 것 1개/);
    assert.match(block, /\| ❌ \| 뮤테이션 테스트에서 살아남은 변이가 모두 동등 변이다 \| 2개 중 1개는 테스트가 못 잡는다 \|/);
    assert.match(block, /### 고칠 것\n\n1\. `src\/pause\.ts:24:3` BlockStatement `\{\}`가 살아남았다\. 결과가 달라지는 입력: 실패한 id가 있을 때/);
  });

  it("테스트가 없으면 이유를 고칠 것으로 올린다", () => {
    const { block } = buildBlock({ sha: SHA, version: "1", test: { flag: true, summary: "분기 1개에 테스트 없음", reason: "src/a.ts:3" } });
    assert.match(block, /\| ❌ \| 바뀐 동작을 확인하는 테스트가 있다 \| 분기 1개에 테스트 없음 \|/);
    assert.match(block, /1\. 테스트를 더한다\. src\/a\.ts:3/);
  });

  it("뮤테이션 테스트를 쓰지 않는 레포는 해당 없음으로 적는다", () => {
    const { pass, block } = buildBlock({ sha: SHA, version: "1", test: { flag: false, summary: "", reason: "" } });
    assert.equal(pass, true);
    assert.match(block, /\| ➖ \| 뮤테이션 테스트에서 살아남은 변이가 모두 동등 변이다 \| 이 레포는 뮤테이션 테스트를 쓰지 않는다 \|/);
  });

  it("테스트가 없거나 판정하지 못하면 실패다", () => {
    assert.equal(buildBlock({ sha: SHA, version: "1", test: { flag: true, reason: "x" } }).pass, false);
    assert.equal(buildBlock({ sha: SHA, version: "1", test: null }).pass, false);
  });

  it("리포트가 없거나 오래됐거나 다른 base 것이면 실패다", () => {
    for (const state of ["missing", "stale", "otherBase"])
      assert.equal(buildBlock({ sha: SHA, version: "1", test: { flag: false, reason: "" }, mutation: { state } }).pass, false);
  });

  it("판정하지 않은 PR은 통과로 적는다", () => {
    const { pass, block } = buildBlock({ sha: SHA, version: "1", skipped: "revert PR" });
    assert.equal(pass, true);
    assert.match(block, /revert PR이라 판정하지 않았다/);
  });

  it("gate가 읽을 수 있게 커밋과 결과를 남긴다", () => {
    const { block } = buildBlock({
      sha: SHA,
      base: "develop",
      version: "1",
      test: { flag: false, reason: "" },
      mutation: { state: "ok", survivors },
      judged,
    });
    assert.match(block, /· base `develop` ·/);
    assert.deepEqual(parseBlock(`ABC-1\n\n${block}\n\n## 요약`), {
      sha: SHA,
      pass: false,
      base: "develop",
      skipped: false,
      mutation: "ok",
    });
  });

  it("블록이 없거나 깨졌으면 null이다", () => {
    assert.equal(parseBlock("## 요약"), null);
    assert.equal(parseBlock("<!-- verification sha=abc -->\n<!-- /verification -->"), null);
  });
});

describe("PR 본문에 넣기", () => {
  const { block, verdict } = buildBlock({ sha: SHA, version: "1", skipped: "revert PR" });
  const body = "ABC-1\n\n## 요약\n\n내용\n\n## 수락 기준\n\n| 기준 |";

  it("판정 결과 한 줄은 티켓 키 아래 첫 섹션 앞에, 검증 칸은 수락 기준 앞에 넣는다", () => {
    const text = withBlock(body, block, verdict);
    assert.ok(text.startsWith(`ABC-1\n\n${verdict}\n\n## 요약\n\n내용\n\n${block}\n\n## 수락 기준`));
  });

  it("다시 판정하면 둘 다 한 번만 남긴다", () => {
    const first = withBlock(body, block, verdict);
    const again = withBlock(first, block.replace(`sha=${SHA}`, "sha=fff0000"), verdict);
    assert.equal(again.match(/<!-- verification sha=/g).length, 1);
    assert.equal(again.match(/<!-- verdict -->/g).length, 1);
    assert.match(again, /<!-- verification sha=fff0000/);
  });

  it("예전 위험 등급 블록은 지운다", () => {
    const old = "<!-- risk-grade sha=abc -->\n## 위험 등급\n\n**low**\n<!-- /risk-grade -->";
    const text = withBlock(`${old}\n\n## 요약`, block, verdict);
    assert.doesNotMatch(text, /위험 등급/);
    assert.ok(text.startsWith(`${verdict}\n\n## 요약`));
  });

  it("수락 기준이 없는 본문은 검증 칸을 끝에 붙인다", () => {
    assert.equal(withBlock("## 요약\n\n내용", block, verdict), `${verdict}\n\n## 요약\n\n내용\n\n${block}`);
    assert.equal(withBlock("", block, verdict), `${verdict}\n\n${block}`);
    assert.equal(withBlock("내용", block), `내용\n\n${block}`);
  });
});
