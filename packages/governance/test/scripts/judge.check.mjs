import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  argValue,
  createArgs,
  mutantPrompt,
  parseMutantJudgement,
  parseTestJudgement,
  report,
  testPrompt,
} from "../../scripts/judge.mjs";

const survivors = [
  { file: "src/chunk.ts", line: 7, column: 10, mutator: "EqualityOperator", replacement: "ids.length >= 0" },
  { file: "src/pause.ts", line: 24, column: 3, mutator: "BlockStatement", replacement: "{}" },
];

describe("테스트 판정 프롬프트", () => {
  it("criteria.md의 테스트 없음 표를 넣고 한 줄로 답하게 한다", () => {
    const text = testPrompt("origin/develop...abc1234");
    assert.match(text, /git diff origin\/develop\.\.\.abc1234/);
    assert.doesNotMatch(text, /\.\.\.HEAD/);
    assert.match(text, /\| missing-test \| 테스트 없음/);
    assert.match(text, /^- missing-test: 있음\|없음 — 한 줄 결과 \| 이유$/m);
  });

  it("예전 위험 신호는 묻지 않는다", () => {
    const text = testPrompt("origin/develop");
    for (const key of ["untestable", "wider-access", "external-effect", "bulk-change", "stored-format", "new-pattern"])
      assert.doesNotMatch(text, new RegExp(key));
  });

  it("공통 기준을 고치면 프롬프트가 따라 바뀐다", () => {
    const text = testPrompt("origin/develop", "## 테스트 없음\n\n| missing-test | 바뀐 정의 |\n\n## 다음");
    assert.match(text, /바뀐 정의/);
    assert.doesNotMatch(text, /## 다음/);
  });
});

describe("테스트 판정 읽기", () => {
  it("있음·없음, 한 줄 결과, 이유를 읽는다", () => {
    assert.deepEqual(parseTestJudgement("설명\n- missing-test: 있음 — 분기 1개에 테스트 없음 | src/a.ts:3 분기에 테스트가 없다"), {
      flag: true,
      summary: "분기 1개에 테스트 없음",
      reason: "src/a.ts:3 분기에 테스트가 없다",
    });
    assert.deepEqual(parseTestJudgement("- missing-test: 없음"), { flag: false, summary: "", reason: "" });
  });

  it("한 줄 결과 없이 이유만 쓴 답도 읽는다", () => {
    assert.deepEqual(parseTestJudgement("- missing-test: 있음 — src/a.ts:3 분기에 테스트가 없다"), {
      flag: true,
      summary: "",
      reason: "src/a.ts:3 분기에 테스트가 없다",
    });
  });

  it("답이 없으면 판정으로 보지 않는다", () => {
    assert.equal(parseTestJudgement("모르겠다"), null);
    assert.equal(parseTestJudgement("- missing-test: 모름"), null);
  });

  it("양식을 그대로 돌려준 답은 판정으로 보지 않는다", () => {
    assert.equal(parseTestJudgement("- missing-test: 있음|없음 — 이유"), null);
    assert.equal(parseTestJudgement("- missing-test: 없음|있음"), null);
  });
});

describe("동등 변이 판정", () => {
  it("변이마다 번호를 붙이고, 애매하면 동등 변이가 아니라고 알려 준다", () => {
    const text = mutantPrompt("origin/develop", survivors);
    assert.match(text, /^1\. src\/chunk\.ts:7:10 \(파일:줄:열\) \| EqualityOperator \| ids\.length >= 0$/m);
    assert.match(text, /^2\. src\/pause\.ts:24:3 \(파일:줄:열\) \| BlockStatement \| \{\}$/m);
    assert.match(text, /애매하면 동등 변이가 아니다/);
    assert.match(text, /^- 2: 동등\|아님 — 이유$/m);
  });

  it("변이 순서대로 판정을 돌려준다", () => {
    assert.deepEqual(
      parseMutantJudgement("- 2: 아님 — ids에 실패한 id가 하나 있을 때\n- 1: 동등 — 빈 배열이면 반복문이 돌지 않는다", 2),
      [
        { equivalent: true, reason: "빈 배열이면 반복문이 돌지 않는다" },
        { equivalent: false, reason: "ids에 실패한 id가 하나 있을 때" },
      ],
    );
  });

  it("하나라도 빠지면 판정으로 보지 않는다", () => {
    assert.equal(parseMutantJudgement("- 1: 동등 — x", 2), null);
  });

  it("양식을 그대로 돌려준 답은 동등 변이로 받지 않는다", () => {
    assert.equal(parseMutantJudgement("- 1: 동등|아님 — 이유", 1), null);
    assert.deepEqual(parseMutantJudgement("- 1: 동등 – 빈 배열", 1), [{ equivalent: true, reason: "빈 배열" }]);
  });

  it("이유가 없는 판정은 받지 않는다", () => {
    assert.equal(parseMutantJudgement("- 1: 동등", 1), null);
    assert.equal(parseMutantJudgement("- 1: 동등 —", 1), null);
    assert.equal(parseMutantJudgement("- 1: 아님", 1), null);
  });
});

describe("터미널 보고", () => {
  it("동등 변이와 잡아야 할 변이를 나눠 보여 준다", () => {
    const text = report({
      sha: "abc1234def",
      pass: false,
      skipped: null,
      test: { flag: false, reason: "" },
      mutation: { state: "ok", survivors },
      judged: [
        { equivalent: true, reason: "같다" },
        { equivalent: false, reason: "실패한 id가 있을 때" },
      ],
    });
    assert.match(text, /^검증 실패 \(커밋 abc1234\)/);
    assert.match(text, /- 동등 변이 src\/chunk\.ts:7/);
    assert.match(text, /- 잡아야 할 변이 src\/pause\.ts:24:3 .* — 실패한 id가 있을 때/);
  });

  it("살아남은 변이를 판정하지 못했으면 변이 없음과 구분해 알린다", () => {
    const failed = report({ sha: "abc1234", pass: false, test: { flag: false, reason: "" }, mutation: { state: "ok", survivors }, judged: null });
    assert.match(failed, /살아남은 변이 2개를 판정하지 못했습니다/);
    assert.doesNotMatch(failed, /살아남은 변이 없음/);
    const none = report({ sha: "abc1234", pass: true, test: { flag: false, reason: "" }, mutation: { state: "ok", survivors: [] }, judged: null });
    assert.match(none, /살아남은 변이 없음/);
  });

  it("판정하지 않은 PR은 이유만 적는다", () => {
    assert.match(
      report({ sha: "abc1234", pass: true, skipped: "revert PR", mutation: { state: "none" } }),
      /revert PR이라 판정하지 않았습니다/,
    );
  });
});

describe("--create 인자", () => {
  it("긴 이름, 짧은 이름, = 형식으로 값을 읽는다", () => {
    assert.equal(argValue(["--base", "develop"], ["--base", "-B"]), "develop");
    assert.equal(argValue(["-B", "staging"], ["--base", "-B"]), "staging");
    assert.equal(argValue(["--base=main"], ["--base", "-B"]), "main");
    assert.equal(argValue(["--title", "x"], ["--base", "-B"]), undefined);
  });

  it("본문·base·fill 인자를 빼고 base와 검증을 넣은 본문 파일을 붙인다", () => {
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
