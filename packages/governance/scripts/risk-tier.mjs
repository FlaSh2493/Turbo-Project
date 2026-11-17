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
export const TEST_PATTERNS = [
  "/__tests__/",
  "(^|/)e2e/",
  "\\.(test|spec|stories)\\.[cm]?[jt]sx?$",
];
export const DEFAULT_CONFIG = {
  protectedBranches: PROTECTED_BRANCHES,
  testPatterns: TEST_PATTERNS,
};

export function checkBaseBranch(base, head, sources = MAIN_SOURCES) {
  if (base !== "main") return { ok: true };
  if (sources.some((source) => globToRegExp(source).test(head)))
    return { ok: true };
  return {
    ok: false,
    message: `main으로는 ${sources.filter((source) => source !== "main").join(", ")}에서만 PR을 엽니다. 지금은 ${head} → main입니다. 운영 수정이면 hotfix/* 브랜치로 옮기세요.`,
  };
}

export const TIERS = ["low", "medium", "high"];
export const LABELS = {
  low: "risk:low",
  medium: "risk:medium",
  high: "risk:high",
};
export const LEGACY_LABELS = ["risk:A", "risk:B", "risk:C"];
export const LABEL_COLORS = { low: "0E8A16", medium: "FBCA04", high: "D93F0B" };
export const LABEL_DESCRIPTIONS = {
  low: "셀프머지",
  medium: "리뷰어가 의도와 증거 확인",
  high: "오너 승인",
};

export const HIGH_RISKS = {
  untestable: "테스트가 증명하지 못함",
};
export const RISKS = {
  "wider-access": "권한이 넓어짐",
  "external-effect": "밖에서 실제로 일어남",
  "bulk-change": "한 번에 여러 개",
  "stored-format": "이미 나간 것과 안 맞음",
  "new-pattern": "새 패턴",
};
export const TEST_GAP = {
  "missing-test": "테스트 없음",
};
export const SIGNALS = { ...HIGH_RISKS, ...RISKS, ...TEST_GAP };
const MISSING_JUDGEMENT =
  "위험 판정 없음: Claude 판정을 얻지 못했습니다. claude CLI가 있는지 확인하고 pnpm exec governance judge를 다시 실행하세요";

const escapeRegExp = (text) => text.replace(/[.+?^${}()|[\]\\]/g, "\\$&");

export function codeownersPattern(pattern) {
  const anchored = pattern.startsWith("/");
  const directory = pattern.endsWith("/");
  const body = pattern.replace(/^\//, "").replace(/\/$/, "");
  const source = body
    .split("/")
    .map((part) =>
      part === "**" ? ".*" : escapeRegExp(part).replace(/\*/g, "[^/]*"),
    )
    .join("/");
  const prefix = anchored || body.includes("/") ? "^" : "(^|.*/)";
  const suffix = directory ? "/.*$" : "(/.*)?$";
  return new RegExp(`${prefix}${source}${suffix}`);
}

export function parseCodeowners(text) {
  return (text ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const [pattern, ...owners] = line.split(/\s+/);
      return {
        pattern,
        matcher: codeownersPattern(pattern),
        owned: owners.length > 0,
        owners: owners.map((owner) => owner.replace(/^@/, "")),
      };
    });
}

export function isOwned(rules, path) {
  let owned = false;
  for (const rule of rules) if (rule.matcher.test(path)) owned = rule.owned;
  return owned;
}

const ruleOf = (rules, path) => {
  let found = null;
  for (const rule of rules) if (rule.matcher.test(path)) found = rule;
  return found;
};

export const ownersOf = (rules, path) => ruleOf(rules, path)?.owners ?? [];

const same = (x, y) => x.toLowerCase() === y.toLowerCase();
const unique = (logins) =>
  logins.filter(
    (login, index) => logins.findIndex((each) => same(each, login)) === index,
  );

export function defaultOwnersOf(featureOwners, codeowners) {
  const star = featureOwners.find((rule) => rule.pattern === "*");
  return star ? star.owners : unique(codeowners.flatMap((rule) => rule.owners));
}

const featureOwnersOf = (rules, path) => {
  const rule = ruleOf(rules, path);
  return rule && rule.pattern !== "*" ? rule.owners : [];
};

export function reviewersFor({
  tier,
  files,
  featureOwners,
  codeowners,
  author,
}) {
  if (tier !== "medium" && tier !== "high") return { requested: [], suggested: [] };
  const others = (logins) => logins.filter((login) => !same(login, author));
  const defaults = defaultOwnersOf(featureOwners, codeowners);
  const features = unique(
    files.flatMap((file) => featureOwnersOf(featureOwners, file.path)),
  );
  const result = (requested, candidates) => {
    const picked = unique(requested);
    return {
      requested: picked,
      suggested: unique(others(candidates)).filter(
        (login) => !picked.some((each) => same(each, login)),
      ),
    };
  };
  const main = defaults[0];
  const authorIsMain = Boolean(main && same(main, author));
  if (
    defaults.some((login) => same(login, author)) &&
    (tier === "medium" || authorIsMain)
  )
    return result(
      [],
      [
        ...features,
        ...defaults,
        ...(tier === "high"
          ? files
              .filter((file) => isOwned(codeowners, file.path))
              .flatMap((file) => ownersOf(codeowners, file.path))
          : []),
      ],
    );
  if (tier === "high") {
    const owned = files
      .filter((file) => isOwned(codeowners, file.path))
      .map((file) => others(ownersOf(codeowners, file.path)));
    const picked = owned
      .map(
        (owners) =>
          owners.find((login) => main && same(login, main)) ?? owners[0],
      )
      .filter(Boolean);
    return result(picked.length > 0 ? picked : others([main ?? ""]).filter(Boolean), [
      ...owned.flat(),
      ...others(defaults),
      ...features,
    ]);
  }
  const requested = [];
  const candidates = [];
  let featureFound = false;
  for (const file of files) {
    const owners = others(featureOwnersOf(featureOwners, file.path));
    const [first, ...rest] = owners.length > 0 ? owners : others(defaults);
    if (owners.length > 0) featureFound = true;
    if (first) requested.push(first);
    candidates.push(...rest);
  }
  if (featureFound) candidates.push(...defaults);
  return result(requested, candidates);
}

const matchesAny = (path, patterns) =>
  patterns.some((pattern) => new RegExp(pattern).test(path));

const flagged = (judgement, signals) =>
  Object.entries(signals)
    .filter(([key]) => judgement[key]?.flag)
    .map(
      ([key, name]) =>
        `위험 판정: ${name}${judgement[key].reason ? ` — ${judgement[key].reason}` : ""}`,
    );

export function classify({ pr, files, config, codeowners }) {
  const reasons = [];
  const promotion = [pr.head, pr.base].every((branch) =>
    config.protectedBranches.includes(branch),
  );
  if (pr.sameRepo && promotion) {
    return { tier: "low", reasons: ["승격·백포트 PR"] };
  }
  if (isRevertPr(pr.title, pr.body)) {
    if (pr.revertVerified) return { tier: "low", reasons: ["revert PR"] };
    reasons.push(
      "revert PR로 보지 않음: 원래 PR이 이 레포에서 머지된 PR이 아닙니다",
    );
  }
  if (!pr.judgement)
    return { tier: "medium", reasons: [...reasons, MISSING_JUDGEMENT] };
  const missingTest = flagged(pr.judgement, TEST_GAP);
  const blocked = missingTest.length > 0 ? { blocked: missingTest[0] } : {};
  const high = flagged(pr.judgement, HIGH_RISKS);
  if (high.length > 0) {
    const source = files.filter(
      (file) => !matchesAny(file.path, config.testPatterns),
    );
    const unowned = source.every((file) => !isOwned(codeowners, file.path))
      ? [
          "바뀐 파일이 CODEOWNERS에 없어 GitHub가 머지를 막지 않습니다. 맞으면 CODEOWNERS에 더하세요",
        ]
      : [];
    return {
      tier: "high",
      reasons: [...reasons, ...high, ...unowned],
      ...blocked,
    };
  }
  const medium = flagged(pr.judgement, RISKS);
  if (medium.length > 0)
    return { tier: "medium", reasons: [...reasons, ...medium], ...blocked };
  return { tier: "low", reasons: [...reasons, "신호 없음"], ...blocked };
}
