import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  checkBaseBranch,
  isPromotion,
  isRevertPr,
  originalPrNumber,
} from "../../scripts/pr-rules.mjs";

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

describe("승격·백포트", () => {
  it("보호 브랜치끼리 오가는 PR만 승격·백포트다", () => {
    assert.equal(isPromotion("develop", "main"), true);
    assert.equal(isPromotion("main", "develop"), true);
    assert.equal(isPromotion("feat/x", "develop"), false);
    assert.equal(isPromotion("develop", "feat/x"), false);
  });
});
