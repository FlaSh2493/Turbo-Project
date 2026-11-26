const stripComments = (text) => (text ?? "").replace(/<!--[\s\S]*?-->/g, "");

export function isRevertPr(title, body) {
  return (
    /^revert\b/i.test(title ?? "") ||
    /^Reverts\s+\S*#\d+/m.test(stripComments(body))
  );
}

const sameRepoNumber = (match, repo) =>
  !match || (match[1] && repo && match[1] !== repo) ? null : Number(match[2]);

export function originalPrNumber(body, repo) {
  const text = stripComments(body);
  const field = text.match(/^[-*]\s*원래 PR\s*:\s*(.*)$/m)?.[1];
  const fromField = field?.match(/(?:([\w.-]+\/[\w.-]+))?#(\d+)/);
  if (fromField) return sameRepoNumber(fromField, repo);
  return sameRepoNumber(
    text.match(/^Reverts\s+(?:([\w.-]+\/[\w.-]+))?#(\d+)/m),
    repo,
  );
}

const globToRegExp = (glob) =>
  new RegExp(
    `^${glob.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*")}$`,
  );

export const PROTECTED_BRANCHES = ["main", "develop", "staging"];
export const MAIN_SOURCES = [...PROTECTED_BRANCHES, "hotfix/*", "release/*"];

export function checkBaseBranch(base, head, sources = MAIN_SOURCES) {
  if (base !== "main") return { ok: true };
  if (sources.some((source) => globToRegExp(source).test(head)))
    return { ok: true };
  return {
    ok: false,
    message: `main으로는 ${sources.filter((source) => source !== "main").join(", ")}에서만 PR을 엽니다. 지금은 ${head} → main입니다. 운영 수정이면 hotfix/* 브랜치로 옮기세요.`,
  };
}

export const isPromotion = (head, base, protectedBranches = PROTECTED_BRANCHES) =>
  [head, base].every((branch) => protectedBranches.includes(branch));
