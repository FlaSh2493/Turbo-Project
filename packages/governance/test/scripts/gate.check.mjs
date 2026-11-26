import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { bypassFindings, evaluate, summary } from "../../scripts/gate.mjs";

const DIFF = `diff --git a/src/a.test.ts b/src/a.test.ts
--- a/src/a.test.ts
+++ b/src/a.test.ts
@@ -3,0 +4,3 @@ describe("a", () => {
+  it.skip("느리다", () => {});
+  it("괜찮다", () => {});
+  xit("빼 둔다", () => {});
+  it.only
+  ("괄호가 다음 줄", () => {});
@@ -10,1 +13,1 @@
-  // eslint-disable-next-line
+  const ok = 1;
diff --git a/src/b.ts b/src/b.ts
--- a/src/b.ts
+++ b/src/b.ts
@@ -1,0 +2,2 @@
+// @ts-ignore
+// Stryker disable next-line all
diff --git a/README.md b/README.md
--- a/README.md
+++ b/README.md
@@ -1,0 +2 @@
+\`it.skip\`은 쓰지 않는다. eslint-disable도.
`;

describe("검사 우회", () => {
  it("코드 파일에 새로 들어간 건너뛰기와 끄는 주석을 줄 번호와 함께 찾는다", () => {
    assert.deepEqual(
      bypassFindings(DIFF).map(({ file, line, name }) => `${file}:${line} ${name}`),
      [
        "src/a.test.ts:4 테스트 건너뛰기",
        "src/a.test.ts:6 테스트 건너뛰기",
        "src/a.test.ts:7 테스트 건너뛰기",
        "src/b.ts:2 타입 검사 끄기",
        "src/b.ts:3 뮤테이션 끄기",
      ],
    );
  });

  it("문맥 줄의 it에 이어 .only만 새로 붙인 경우도 찾는다", () => {
    const diff = [
      "diff --git a/src/c.test.ts b/src/c.test.ts",
      "--- a/src/c.test.ts",
      "+++ b/src/c.test.ts",
      "@@ -10,3 +10,3 @@ describe(\"c\", () => {",
      "   it",
      "-  (\"case\", () => {});",
      "+  .only(\"case\", () => {});",
      "   const after = 1;",
    ].join("\n");
    assert.deepEqual(bypassFindings(diff).map(({ line, name }) => `${line} ${name}`), ["11 테스트 건너뛰기"]);
  });

  it("문맥 줄은 줄 번호만 세고 검사하지 않는다", () => {
    const diff = [
      "+++ b/src/d.test.ts",
      "@@ -1,2 +1,3 @@",
      "   it.skip(\"이미 있던 skip\", () => {});",
      "+  const x = 1;",
      "   done();",
    ].join("\n");
    assert.deepEqual(bypassFindings(diff), []);
  });

  it("지운 줄과 문서는 보지 않는다", () => {
    const found = bypassFindings(DIFF);
    assert.ok(!found.some((each) => each.file === "README.md"));
    assert.ok(!found.some((each) => each.name === "eslint 끄기"));
  });

  it("문자열이나 정규식 안의 글자는 우회로 보지 않고, 주석의 끄는 지시만 잡는다", () => {
    const diff = [
      "+++ b/src/e.ts",
      "@@ -0,0 +1,8 @@",
      '+const rule = { pattern: /eslint-disable/ };',
      '+const fixture = "+  it.skip(\\"x\\", () => {});";',
      "+const note = '// @ts-ignore 은 쓰지 않는다';",
      "+const tpl = `Stryker disable`;",
      "+// eslint-disable-next-line no-console",
      "+/* @ts-nocheck */",
      "+  {/* eslint-disable-line */}",
      "+console.log('x'); // Stryker disable next-line all: 이유",
    ].join("\n");
    assert.deepEqual(
      bypassFindings(diff).map(({ line, name }) => `${line} ${name}`),
      ["5 eslint 끄기", "6 타입 검사 끄기", "7 eslint 끄기", "8 뮤테이션 끄기"],
    );
  });

  it("여러 줄 템플릿 문자열 안의 글자는 보지 않고, 문자열이 닫힌 뒤의 코드는 본다", () => {
    const diff = [
      "+++ b/src/g.test.ts",
      "@@ -0,0 +1,6 @@",
      "+const DIFF = `",
      "+  it.skip(\"x\", () => {});",
      "+// @ts-ignore",
      "+\\`escaped\\` 도 문자열 안이다",
      "+`;",
      "+it.only(\"진짜\", () => {});",
    ].join("\n");
    assert.deepEqual(bypassFindings(diff).map(({ line }) => line), [6]);
  });

  it("템플릿 보간식 안의 호출은 실행되는 코드라 잡는다. 보간식 안의 템플릿도 따라간다", () => {
    const source = [
      "const name = `${it.only(\"case\", () => {})}`;",
      "const nested = `a ${`b ${xit(\"x\", () => {})}`} c`;",
      "const plain = `it.skip 은 글자일 뿐`;",
    ].join("\n");
    const diff = ["+++ b/src/h.test.ts", "@@ -0,0 +1,3 @@", ...source.split("\n").map((l) => `+${l}`)].join("\n");
    assert.deepEqual(bypassFindings(diff, () => source).map(({ line }) => line), [1, 2]);
  });

  it("블록 주석 안의 따옴표는 문자열을 열지 않는다", () => {
    const source = ["/* A backtick (`) is a delimiter. */", "it.only(\"case\", () => {});"].join("\n");
    const diff = ["+++ b/src/i.test.ts", "@@ -0,0 +1,2 @@", ...source.split("\n").map((l) => `+${l}`)].join("\n");
    assert.deepEqual(bypassFindings(diff, () => source).map(({ line }) => line), [2]);
  });

  it("diff가 문자열 중간부터 보여도 파일 전체로 상태를 정해 추가된 줄을 잡는다", () => {
    const source = ["const fixture = `", "a", "b", "c", "d", "`;", 'it.only("case", () => {});'].join("\n");
    // -U3 diff는 마지막 줄만 추가돼서 c 줄부터 보인다.
    const diff = [
      "+++ b/src/j.test.ts",
      "@@ -4,4 +4,4 @@",
      " c",
      " d",
      " `;",
      '-it("case", () => {});',
      '+it.only("case", () => {});',
    ].join("\n");
    assert.deepEqual(bypassFindings(diff, () => source).map(({ line }) => line), [7]);
  });

  it("주석의 끄는 지시는 주석 맨 앞에 있을 때만 잡는다", () => {
    const source = ["// eslint-disable 설명 링크는 문서에 있다", "// 설명: eslint-disable 은 쓰지 않는다", "const a = 1; /* @ts-ignore */"].join("\n");
    const diff = ["+++ b/src/k.ts", "@@ -0,0 +1,3 @@", ...source.split("\n").map((l) => `+${l}`)].join("\n");
    assert.deepEqual(bypassFindings(diff, () => source).map(({ line, name }) => `${line} ${name}`), ["1 eslint 끄기", "3 타입 검사 끄기"]);
  });

  const asDiff = (path, source, added) =>
    [`+++ b/${path}`, `@@ -0,0 +1,${source.split("\n").length} @@`, ...source.split("\n").map((l, i) => `${added.includes(i + 1) ? "+" : " "}${l}`)].join("\n");

  it("it 뒤에 주석이 붙고 다음 줄에 .skip이 와도 잡는다", () => {
    const source = ['it // 임시로 건너뜀', '  .skip("case", () => {});'].join("\n");
    assert.deepEqual(bypassFindings(asDiff("src/l.test.ts", source, [1, 2]), () => source).map(({ line }) => line), [2]);
  });

  it("정규식 리터럴 안의 글자는 보지 않고, 나눗셈 뒤의 호출은 잡는다", () => {
    const source = [
      "const pattern = /it.skip/;",
      "const quote = /'/; it.only(\"x\", () => {});",
      "const half = total / 2; it.skip(\"y\", () => {});",
      "if (/eslint-disable/.test(line)) return;",
    ].join("\n");
    assert.deepEqual(
      bypassFindings(asDiff("src/m.test.ts", source, [1, 2, 3, 4]), () => source).map(({ line }) => line),
      [2, 3],
    );
  });

  it("파일 첫 줄이 빈 줄이어도 줄 번호가 어긋나지 않는다", () => {
    const source = ["", 'it.only("case", () => {});'].join("\n");
    assert.deepEqual(bypassFindings(asDiff("src/n.test.ts", source, [2]), () => source).map(({ line }) => line), [2]);
  });

  it("문자열이 끼어 있어도 문자열 밖의 건너뛰기 호출은 잡는다", () => {
    const diff = ['+++ b/src/f.test.ts', "@@ -0,0 +1 @@", '+  it.only("it.skip이라는 이름", () => {});'].join("\n");
    assert.deepEqual(bypassFindings(diff).map(({ name }) => name), ["테스트 건너뛰기"]);
  });
});

const HEAD = "abc1234def";
const passed = { sha: HEAD, pass: true, base: "develop", skipped: false, mutation: "ok" };
const failed = (result) => result.checks.filter((each) => !each.ok).map((each) => each.name);

describe("머지 게이트", () => {
  it("판정이 지금 커밋에서 통과했고 우회가 없으면 통과한다", () => {
    const result = evaluate({ block: passed, headSha: HEAD, bypass: [] });
    assert.equal(result.ok, true);
  });

  it("뮤테이션은 판정 결과로만 보고 CI 리포트를 따로 확인하지 않는다", () => {
    const result = evaluate({ block: passed, headSha: HEAD, bypass: [] });
    assert.deepEqual(result.checks.map((each) => each.name), ["판정이 지금 커밋 기준이다", "검사를 건너뛰지 않았다"]);
  });

  it("판정이 없거나, 다른 커밋 것이거나, 실패면 막는다", () => {
    assert.deepEqual(failed(evaluate({ block: null, headSha: HEAD, bypass: [] })), ["판정이 PR 본문에 있다"]);
    assert.deepEqual(failed(evaluate({ block: { ...passed, sha: "fff0000" }, headSha: HEAD, bypass: [] })), ["판정이 지금 커밋 기준이다"]);
    assert.deepEqual(failed(evaluate({ block: { ...passed, pass: false }, headSha: HEAD, bypass: [] })), ["판정을 통과했다"]);
  });

  it("검사 우회가 있으면 막는다", () => {
    const bypass = [{ file: "src/a.test.ts", line: 4, name: "테스트 건너뛰기", text: 'it.skip("x")' }];
    assert.deepEqual(failed(evaluate({ block: passed, headSha: HEAD, bypass })), ["검사를 건너뛰지 않았다"]);
  });

  it("판정하지 않은 승격·revert PR은 판정 생략으로 통과한다", () => {
    const skipped = { sha: HEAD, pass: true, skipped: true, mutation: "none" };
    assert.equal(evaluate({ block: skipped, headSha: HEAD, bypass: [] }).ok, true);
  });

  it("merge queue에서는 검사 우회만 본다", () => {
    const result = evaluate({ block: null, headSha: HEAD, bypass: [], mergeGroup: true });
    assert.deepEqual(result.checks.map((each) => each.name), ["검사를 건너뛰지 않았다"]);
    assert.equal(result.ok, true);
  });

  it("판정한 base와 지금 base가 다르면 막는다", () => {
    const result = evaluate({ block: passed, headSha: HEAD, baseRef: "release/1.0", bypass: [] });
    assert.deepEqual(failed(result), ["판정이 지금 base 기준이다"]);
    assert.equal(evaluate({ block: passed, headSha: HEAD, baseRef: "develop", bypass: [] }).ok, true);
  });
});

describe("체크 요약", () => {
  it("머지 가능 여부, 실패 건수, 고칠 것을 적는다", () => {
    const text = summary(evaluate({ block: null, headSha: HEAD, bypass: [] }));
    assert.match(text, /^## merge-gate: ❌ 머지 불가 · 1개 실패/);
    assert.match(text, /- ❌ \*\*판정이 PR 본문에 있다\*\*/);
    assert.match(text, /  - 고칠 것: 로컬에서 `pnpm exec governance judge`/);
    assert.match(text, /- ✅ \*\*검사를 건너뛰지 않았다\*\*/);
  });
});
