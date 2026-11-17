import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { VERSION } from "../../src/governance.mjs";

import {
  argValue,
  createArgs,
  filesFromNumstat,
  grounds,
  isSettled,
  parseJudgement,
  section,
  withSection,
} from "../../scripts/risk-judge.mjs";

const answer = `
판정 결과다.
- untestable: 없음
- wider-access: 없음 — 권한 분기를 바꾸지 않았다
- external-effect: 없음
- bulk-change: 없음
- stored-format: 있음 — src/shared/lib/storage.ts:12 localStorage 키를 바꿨다
- new-pattern: 없음
- missing-test: 없음
`;
const off = { flag: false, reason: "" };

describe("위험 판정 읽기", () => {
  it("모든 신호의 있음·없음과 이유를 읽는다", () => {
    assert.deepEqual(parseJudgement(answer), {
      untestable: off,
      "wider-access": { flag: false, reason: "권한 분기를 바꾸지 않았다" },
      "external-effect": off,
      "bulk-change": off,
      "stored-format": {
        flag: true,
        reason: "src/shared/lib/storage.ts:12 localStorage 키를 바꿨다",
      },
      "new-pattern": off,
      "missing-test": off,
    });
  });

  it("신호가 하나라도 빠지면 판정으로 보지 않는다", () => {
    assert.equal(parseJudgement(answer.replace("- missing-test: 없음\n", "")), null);
  });

  it("있음·없음이 아닌 값은 판정으로 보지 않는다", () => {
    assert.equal(parseJudgement(answer.replace("untestable: 없음", "untestable: 모름")), null);
  });

  it("예전 신호 이름은 판정으로 보지 않는다", () => {
    assert.equal(
      parseJudgement("- auth: 없음\n- irreversible: 없음\n- new-pattern: 없음"),
      null,
    );
  });
});

describe("diff 읽기", () => {
  it("numstat을 파일, 추가, 삭제로 읽고 바이너리는 0으로 센다", () => {
    assert.deepEqual(filesFromNumstat("3\t1\tsrc/a.ts\n-\t-\tlogo.png\n"), [
      { path: "src/a.ts", additions: 3, deletions: 1 },
      { path: "logo.png", additions: 0, deletions: 0 },
    ]);
  });
});

describe("판정이 필요한지", () => {
  it("승격과 revert만 Claude 판정 없이 등급이 정해진다", () => {
    assert.equal(isSettled({ tier: "low", reasons: ["승격·백포트 PR"] }), true);
    assert.equal(isSettled({ tier: "low", reasons: ["revert PR"] }), true);
    assert.equal(isSettled({ tier: "medium", reasons: ["위험 판정 없음: x"] }), false);
  });
});

describe("PR 본문의 등급", () => {
  const block = section({
    sha: "abc1234def",
    result: { tier: "high", reasons: ["승격·백포트 PR"] },
    reviewers: { requested: ["main"], suggested: ["sub", "infra"] },
  });

  it("등급, 리뷰어, 다른 오너를 한 줄로 담고 다른 오너에게는 알림이 가지 않게 @를 붙이지 않는다", () => {
    assert.match(block, /\*\*high\*\* · 리뷰어 @main · 다른 오너: sub, infra/);
    assert.doesNotMatch(block, /@sub|@infra/);
  });

  it("어느 버전의 기준으로 판정했는지 등급 줄 끝에 적는다", () => {
    assert.match(block, / · 기준 governance@\d+\.\d+\.\d+/);
  });

  it("리뷰어가 없으면 셀프머지라고 적는다", () => {
    const self = section({
      sha: "abc1234",
      result: { tier: "medium", reasons: [] },
      reviewers: { requested: [], suggested: ["sub"] },
    });
    assert.match(self, /리뷰어 없음 \(기본 오너 셀프머지\)/);
  });

  it("위험 판정을 받았으면 모든 신호의 있음·없음과 이유를 근거로 적고 같은 이유를 두 번 적지 않는다", () => {
    const judgement = parseJudgement(answer);
    const result = {
      tier: "medium",
      reasons: [
        "revert PR로 보지 않음: x",
        "위험 판정: 이미 나간 것과 안 맞음 — src/shared/lib/storage.ts:12 localStorage 키를 바꿨다",
      ],
    };
    const lines = grounds({ result, judgement });
    assert.deepEqual(lines, [
      "- revert PR로 보지 않음: x",
      "- ✅ 테스트가 증명하지 못함: 없음",
      "- ✅ 권한이 넓어짐: 없음 — 권한 분기를 바꾸지 않았다",
      "- ✅ 밖에서 실제로 일어남: 없음",
      "- ✅ 한 번에 여러 개: 없음",
      "- ⚠️ 이미 나간 것과 안 맞음: 있음 — src/shared/lib/storage.ts:12 localStorage 키를 바꿨다",
      "- ✅ 새 패턴: 없음",
      "- ✅ 테스트 없음: 없음",
    ]);
    const body = section({
      sha: "abc1234",
      result,
      reviewers: { requested: ["main"], suggested: [] },
      judgement,
    });
    assert.ok(
      body.includes(
        `## 위험 등급\n\n**medium** · 리뷰어 @main · 다른 오너: 없음 · 기준 governance@${VERSION}\n\n${lines.join("\n")}\n<!-- /risk-grade -->`,
      ),
    );
  });

  it("판정 없이 정해진 등급은 그 사유만 근거로 적는다", () => {
    assert.deepEqual(
      grounds({
        result: { tier: "high", reasons: ["승격·백포트 PR"] },
        judgement: null,
      }),
      ["- 승격·백포트 PR"],
    );
    assert.match(
      block,
      /\n\n- 승격·백포트 PR\n<!-- \/risk-grade -->/,
    );
  });

  it("근거가 없으면 등급 줄만 남긴다", () => {
    const bare = section({
      sha: "abc1234",
      result: { tier: "low", reasons: [] },
      reviewers: { requested: [], suggested: [] },
    });
    assert.match(bare, /## 위험 등급\n\n\*\*low\*\* · [^\n]*\n<!-- \/risk-grade -->$/);
  });

  it("티켓 키 아래, 첫 섹션 앞에 넣고 다시 판정하면 한 번만 남긴다", () => {
    const first = withSection("ABC-1\n\n## 요약\n\n내용", block);
    assert.ok(first.startsWith(`ABC-1\n\n${block}\n\n## 요약\n\n내용`));
    const again = withSection(
      first,
      block.replace("sha=abc1234def", "sha=fff0000"),
    );
    assert.equal(again.match(/<!-- risk-grade /g).length, 1);
    assert.ok(again.startsWith("ABC-1\n\n<!-- risk-grade sha=fff0000"));
  });

  it("섹션이 없는 본문은 끝에 붙인다", () => {
    assert.equal(withSection("내용", block), `내용\n\n${block}`);
    assert.equal(withSection("", block), block);
  });
});

describe("--create 인자", () => {
  it("긴 이름, 짧은 이름, = 형식으로 값을 읽는다", () => {
    assert.equal(argValue(["--base", "develop"], ["--base", "-B"]), "develop");
    assert.equal(argValue(["-B", "staging"], ["--base", "-B"]), "staging");
    assert.equal(argValue(["--base=main"], ["--base", "-B"]), "main");
    assert.equal(argValue(["--title", "x"], ["--base", "-B"]), undefined);
  });

  it("본문·base·fill 인자를 빼고 base와 등급을 넣은 본문 파일을 붙인다", () => {
    assert.deepEqual(
      createArgs(
        ["--draft", "-B", "main", "--title", "제목", "--body", "본문", "--fill"],
        { base: "develop", title: "제목", bodyFile: "/tmp/body.md" },
      ),
      ["pr", "create", "--draft", "--title", "제목", "--base", "develop", "--body-file", "/tmp/body.md"],
    );
  });

  it("제목이 없으면 계산한 제목을 넣는다", () => {
    assert.deepEqual(
      createArgs(["--draft", "-F", "a.md", "--fill-first"], {
        base: "develop",
        title: "마지막 커밋",
        bodyFile: "b.md",
      }),
      ["pr", "create", "--draft", "--base", "develop", "--body-file", "b.md", "--title", "마지막 커밋"],
    );
  });
});
