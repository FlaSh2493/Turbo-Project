import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { prompt } from "../../scripts/risk-judge.mjs";
import {
  checkBaseBranch,
  isRevertPr,
  originalPrNumber,
} from "../../scripts/risk-tier.mjs";

describe("main으로 가는 PR의 출처 브랜치", () => {
  for (const head of ["develop", "staging", "hotfix/ABC-8679", "release/abc-8721"]) {
    it(`${head} → main은 허용한다`, () => {
      assert.equal(checkBaseBranch("main", head).ok, true);
    });
  }

  for (const head of [
    "feature/agent-chat-sse",
    "codex/abc-8492",
    "cherry-pick/overview-prod",
    "develop-old",
  ]) {
    it(`${head} → main은 막고 고칠 방법을 알려 준다`, () => {
      const result = checkBaseBranch("main", head);
      assert.equal(result.ok, false);
      assert.match(result.message, /hotfix\/\*/);
    });
  }

  it("main이 아닌 base는 출처와 관계없이 허용한다", () => {
    assert.equal(
      checkBaseBranch("develop", "feature/anything").ok,
      true,
    );
  });

});

describe("revert PR", () => {
  it("제목이 revert로 시작하거나 본문에 Reverts 줄이 있으면 revert PR이다", () => {
    assert.equal(isRevertPr('Revert "feat: 필터"', ""), true);
    assert.equal(isRevertPr("fix: 필터", "Reverts acme/web#350"), true);
    assert.equal(isRevertPr("fix: revert 버튼 문구", ""), false);
  });

  it("주석 안의 Reverts 줄은 세지 않는다", () => {
    assert.equal(isRevertPr("fix: 필터", "<!--\nReverts #350\n-->"), false);
  });
});

describe("원래 PR 번호", () => {
  const repo = "acme/web";

  it("PR 템플릿 revert 칸의 원래 PR에서 읽는다", () => {
    const body = "## revert\n\n- 원래 PR: #362\n- 되돌린 이유: 첫 화면이 빈다";
    assert.equal(originalPrNumber(body, repo), 362);
  });

  it("revert 칸이 없으면 GitHub가 만든 Reverts 줄에서 읽는다", () => {
    assert.equal(originalPrNumber(`Reverts ${repo}#350`, repo), 350);
  });

  it("원래 PR 칸에 번호가 없으면 Reverts 줄에서 읽는다", () => {
    const body = `## revert\n\n- 원래 PR: 지난주 필터 작업\n\nReverts ${repo}#350`;
    assert.equal(originalPrNumber(body, repo), 350);
  });

  it("다른 레포를 가리키면 번호를 쓰지 않는다", () => {
    assert.equal(originalPrNumber("- 원래 PR: other/repo#123", repo), null);
    assert.equal(originalPrNumber("Reverts acme/other#350", repo), null);
    assert.equal(originalPrNumber(`- 원래 PR: ${repo}#123`, repo), 123);
  });

  it("채우지 않은 템플릿 주석 안의 칸은 읽지 않는다", () => {
    const body = "<!--\n## revert\n\n- 원래 PR: #1\n-->\n";
    assert.equal(originalPrNumber(body, repo), null);
  });

  it("둘 다 없으면 null이다", () => {
    assert.equal(originalPrNumber("되돌린다", repo), null);
  });
});

describe("위험 판정 프롬프트", () => {
  it("criteria.md의 high·medium·테스트 없음 표를 그대로 넣고, 기계 판정 부분은 넣지 않는다", () => {
    const text = prompt("origin/develop");
    assert.match(text, /\| untestable +\| 테스트가 증명하지 못함/);
    assert.match(text, /\| wider-access +\| 권한이 넓어짐/);
    assert.match(text, /\| new-pattern +\| 새 패턴/);
    assert.match(text, /\| missing-test +\| 테스트 없음/);
    assert.doesNotMatch(text, /기계가 정한다/);
  });

  it("모든 신호를 한 줄씩 답하게 한다", () => {
    const text = prompt("origin/develop");
    for (const key of ["untestable", "wider-access", "external-effect", "bulk-change", "stored-format", "new-pattern", "missing-test"])
      assert.match(text, new RegExp(`^- ${key}: 있음\\|없음 — 이유$`, "m"));
  });

  it("레포 기준 문서를 따로 읽게 하지 않는다", () => {
    const text = prompt("origin/develop");
    assert.doesNotMatch(text, /docs\/governance\.md/);
    assert.doesNotMatch(text, /AGENTS\.md/);
  });

  it("공통 기준을 고치면 프롬프트가 따라 바뀐다", () => {
    const text = prompt("origin/develop", "### high: x\n\n| untestable | 바뀐 정의 |\n\n아래는 기계가 정한다.");
    assert.match(text, /바뀐 정의/);
  });
});
