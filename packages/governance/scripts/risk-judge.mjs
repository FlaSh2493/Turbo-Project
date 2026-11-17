import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { codeownersProblem, criteria, VERSION } from "../src/governance.mjs";
import {
  classify,
  DEFAULT_CONFIG,
  isRevertPr,
  LABEL_COLORS,
  LEGACY_LABELS,
  LABEL_DESCRIPTIONS,
  LABELS,
  originalPrNumber,
  parseCodeowners,
  reviewersFor,
  SIGNALS,
  TIERS,
} from "./risk-tier.mjs";

const OPEN = "<!-- risk-grade sha=";
const CLOSE = "<!-- /risk-grade -->";
const KEYS = Object.keys(SIGNALS);

const riskTable = (text) => {
  const start = text.indexOf("### high:");
  const end = text.indexOf("\n아래는 기계가 정한다", start);
  return text.slice(start, end < 0 ? undefined : end).trim();
};

export const prompt = (base, criteriaText = criteria()) =>
  `이 레포의 변경(git diff ${base}...HEAD)이 아래 신호에 해당하는지 판정한다. 코드는 고치지 않는다. 필요하면 바뀐 파일과 그 파일을 쓰는 곳을 읽는다. diff에서 보이는 것만 근거로 삼고, diff로 알 수 없는 것은 추측하지 않고 없음으로 둔다.

${riskTable(criteriaText)}

답은 아래 ${KEYS.length}줄만 쓴다. 있음이면 이유에 근거 파일:라인을 단다.
${KEYS.map((key) => `- ${key}: 있음|없음 — 이유`).join("\n")}`;

const LINE = new RegExp(
  `^\\s*-\\s*(${KEYS.join("|")}):\\s*(있음|없음)\\s*(?:[—-]\\s*)?(.*)$`,
);

export function parseJudgement(text) {
  const judgement = {};
  for (const line of (text ?? "").split("\n")) {
    const match = line.match(LINE);
    if (match)
      judgement[match[1]] = {
        flag: match[2] === "있음",
        reason: match[3].trim(),
      };
  }
  return KEYS.every((key) => judgement[key]) ? judgement : null;
}

export function filesFromNumstat(text) {
  return (text ?? "")
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [additions, deletions, path] = line.split("\t");
      return {
        path,
        additions: Number(additions) || 0,
        deletions: Number(deletions) || 0,
      };
    });
}

export function argValue(args, names) {
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (names.includes(arg)) return args[index + 1];
    const name = names.find((each) => arg.startsWith(`${each}=`));
    if (name) return arg.slice(name.length + 1);
  }
  return undefined;
}

const VALUE_ARGS = ["--base", "-B", "--body", "-b", "--body-file", "-F"];
const FLAG_ARGS = ["--fill", "-f", "--fill-first", "--fill-verbose"];
const TITLE_ARGS = ["--title", "-t"];

export function createArgs(args, { base, title, bodyFile }) {
  const kept = [];
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (VALUE_ARGS.includes(arg)) index += 1;
    else if (FLAG_ARGS.includes(arg)) continue;
    else if (!VALUE_ARGS.some((name) => arg.startsWith(`${name}=`)))
      kept.push(arg);
  }
  return [
    "pr",
    "create",
    ...kept,
    "--base",
    base,
    "--body-file",
    bodyFile,
    ...(argValue(args, TITLE_ARGS) === undefined ? ["--title", title] : []),
  ];
}

export function isSettled(result) {
  return result.reasons.some((reason) =>
    ["승격·백포트 PR", "revert PR"].includes(reason),
  );
}

const mention = (logins) =>
  logins.length > 0 ? logins.map((login) => `@${login}`).join(", ") : "없음";

const names = (logins) => (logins.length > 0 ? logins.join(", ") : "없음");

const judged = (reason) => reason.startsWith("위험 판정: ");

export function grounds({ result, judgement }) {
  const signals = judgement
    ? result.reasons.filter((reason) => !judged(reason))
    : result.reasons;
  const risks = judgement
    ? Object.entries(SIGNALS).map(([key, name]) => {
        const { flag, reason } = judgement[key];
        return `- ${flag ? "⚠️" : "✅"} ${name}: ${flag ? "있음" : "없음"}${reason ? ` — ${reason}` : ""}`;
      })
    : [];
  return [...signals.map((reason) => `- ${reason}`), ...risks];
}

export function section({ sha, result, reviewers, judgement = null }) {
  const reviewer =
    reviewers.requested.length > 0
      ? mention(reviewers.requested)
      : result.tier === "low"
        ? "없음"
        : "없음 (기본 오너 셀프머지)";
  const lines = grounds({ result, judgement });
  return [
    `${OPEN}${sha} -->`,
    "## 위험 등급",
    "",
    `**${result.tier}** · 리뷰어 ${reviewer} · 다른 오너: ${names(reviewers.suggested)} · 기준 governance@${VERSION}`,
    ...(lines.length > 0 ? ["", ...lines] : []),
    CLOSE,
  ].join("\n");
}

export function report({ sha, result, reviewers, judgement }) {
  const risks = judgement
    ? Object.entries(SIGNALS).map(([key, name]) => {
        const { flag, reason } = judgement[key];
        return `  - ${name}: ${flag ? "있음" : "없음"}${reason ? ` — ${reason}` : ""}`;
      })
    : ["  - 판정하지 않음 (승격·백포트, revert, 판정 실패)"];
  return [
    `등급 ${result.tier} (커밋 ${sha.slice(0, 7)})`,
    ...result.reasons.map((reason) => `- ${reason}`),
    `리뷰어: ${mention(reviewers.requested)}`,
    `다른 오너: ${names(reviewers.suggested)}`,
    "위험 판정:",
    ...risks,
  ].join("\n");
}

export function withSection(body, block) {
  let text = body ?? "";
  const start = text.indexOf(OPEN);
  const end = text.indexOf(CLOSE);
  if (start >= 0 && end > start)
    text = `${text.slice(0, start).trimEnd()}\n\n${text.slice(end + CLOSE.length).trimStart()}`;
  text = text.trim();
  if (!text) return block;
  const heading = text.search(/^## /m);
  if (heading < 0) return `${text}\n\n${block}`;
  const before = text.slice(0, heading).trimEnd();
  return `${before ? `${before}\n\n` : ""}${block}\n\n${text.slice(heading)}`;
}

const run = (cmd, args, options = {}) =>
  execFileSync(cmd, args, {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    stdio: ["ignore", "pipe", "ignore"],
    ...options,
  }).trim();

const tryRun = (cmd, args, options) => {
  try {
    return run(cmd, args, options);
  } catch {
    return "";
  }
};

const readJson = (cmd, args) => JSON.parse(tryRun(cmd, args) || "null");

function judge(base, store, sha) {
  const saved = join(store, `${sha}.judgement.json`);
  if (existsSync(saved)) return JSON.parse(readFileSync(saved, "utf8"));
  console.log(`위험 판정: ${base}...HEAD 를 새 세션의 Claude로 판정합니다`);
  const judgement = parseJudgement(
    tryRun(
      "claude",
      [
        "-p",
        prompt(base),
        "--allowedTools",
        "Read",
        "Grep",
        "Glob",
        "Bash(git diff:*)",
        "Bash(git log:*)",
        "Bash(git show:*)",
      ],
      { timeout: 10 * 60 * 1000 },
    ),
  );
  if (judgement) writeFileSync(saved, JSON.stringify(judgement));
  return judgement;
}

function applyToPr(repo, number, tier, reviewers) {
  for (const each of TIERS)
    tryRun("gh", [
      "label",
      "create",
      LABELS[each],
      "--repo",
      repo,
      "--color",
      LABEL_COLORS[each],
      "--description",
      LABEL_DESCRIPTIONS[each],
      "--force",
    ]);
  const pr = readJson("gh", [
    "pr",
    "view",
    String(number),
    "--repo",
    repo,
    "--json",
    "reviewRequests,reviews,labels",
  ]);
  const lower = (logins) => logins.map((login) => login.toLowerCase());
  const pending = lower(
    (pr?.reviewRequests ?? []).map((each) => each.login ?? ""),
  );
  const reviewed = lower(
    (pr?.reviews ?? []).map((each) => each.author?.login ?? ""),
  );
  const toAsk = reviewers.requested.filter(
    (login) => ![...pending, ...reviewed].includes(login.toLowerCase()),
  );
  const toWithdraw = reviewers.suggested.filter((login) =>
    pending.includes(login.toLowerCase()),
  );
  try {
    run("gh", [
      "pr",
      "edit",
      String(number),
      "--repo",
      repo,
      "--add-label",
      LABELS[tier],
      ...[
        ...TIERS.filter((each) => each !== tier).map((each) => LABELS[each]),
        ...LEGACY_LABELS.filter((label) =>
          (pr?.labels ?? []).some((each) => each.name === label),
        ),
      ].flatMap((label) => ["--remove-label", label]),
      ...(toAsk.length > 0 ? ["--add-reviewer", toAsk.join(",")] : []),
      ...(toWithdraw.length > 0
        ? ["--remove-reviewer", toWithdraw.join(",")]
        : []),
    ]);
    console.log(
      `PR #${number}: 등급 ${tier}, 리뷰어 ${mention(reviewers.requested)}, 다른 오너 ${names(reviewers.suggested)}`,
    );
  } catch {
    console.log(`PR #${number}에 라벨이나 리뷰어를 반영하지 못했습니다`);
  }
}

if (
  process.argv[1] &&
  realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const problem = codeownersProblem(
    existsSync(".github/CODEOWNERS")
      ? readFileSync(".github/CODEOWNERS", "utf8")
      : null,
  );
  if (problem) {
    console.error(problem);
    process.exit(1);
  }
  const args = process.argv.slice(2);
  const create = args[0] === "--create";
  const extra = create ? args.slice(1) : [];
  const sha = tryRun("git", ["rev-parse", "HEAD"]);
  const store = join(
    tryRun("git", ["rev-parse", "--git-common-dir"]) || ".git",
    "risk-judge",
  );
  mkdirSync(store, { recursive: true });
  const view = readJson("gh", [
    "repo",
    "view",
    "--json",
    "nameWithOwner,isFork,parent,defaultBranchRef",
  ]);
  const repo =
    view?.isFork && view.parent
      ? `${view.parent.owner.login}/${view.parent.name}`
      : view?.nameWithOwner;
  const found = readJson("gh", [
    "pr",
    "view",
    "--json",
    "number,state,baseRefName,title,body,headRefName",
  ]);
  const pr = found && (!create || found.state === "OPEN") ? found : null;
  if (create && pr)
    console.log(
      `이 브랜치에는 이미 열린 PR #${pr.number}이 있습니다. 새로 만들지 않고 그 PR을 판정합니다.`,
    );
  if (!create && !pr) {
    console.log(
      "열린 PR이 없습니다. PR은 `pnpm exec governance judge --create <gh pr create 인자>`로 열면 등급이 함께 붙습니다.",
    );
    process.exit(0);
  }
  const baseName =
    pr?.baseRefName ??
    argValue(extra, ["--base", "-B"]) ??
    view?.defaultBranchRef?.name ??
    "main";
  const head = pr?.headRefName ?? tryRun("git", ["branch", "--show-current"]);
  const remote = tryRun("git", ["remote"]).split("\n").includes("upstream")
    ? "upstream"
    : "origin";
  tryRun("git", ["fetch", "--quiet", remote, baseName]);
  const base = `${remote}/${baseName}`;
  const bodyFile = argValue(extra, ["--body-file", "-F"]);
  const title =
    pr?.title ??
    argValue(extra, ["--title", "-t"]) ??
    tryRun("git", ["log", "-1", "--format=%s"]);
  const body =
    pr?.body ??
    (bodyFile && existsSync(bodyFile)
      ? readFileSync(bodyFile, "utf8")
      : (argValue(extra, ["--body", "-b"]) ?? ""));
  const originalNumber = originalPrNumber(body, repo);
  const revertVerified =
    isRevertPr(title, body) &&
    Boolean(
      originalNumber &&
      readJson("gh", ["api", `repos/${repo}/pulls/${originalNumber}`])
        ?.merged_at,
    );
  const prInfo = {
    title,
    body,
    head,
    base: baseName,
    sameRepo: true,
    revertVerified,
  };
  const files = filesFromNumstat(
    tryRun("git", ["diff", "--numstat", "--no-renames", `${base}...HEAD`]),
  );
  const config = DEFAULT_CONFIG;
  const codeowners = parseCodeowners(
    readFileSync(".github/CODEOWNERS", "utf8"),
  );
  const featureOwners = existsSync(".github/FEATURE_OWNERS")
    ? parseCodeowners(readFileSync(".github/FEATURE_OWNERS", "utf8"))
    : [];
  const settled = classify({
    pr: { ...prInfo, judgement: null },
    files,
    config,
    codeowners,
  });
  const judgement = isSettled(settled) ? null : judge(base, store, sha);
  const result = isSettled(settled)
    ? settled
    : classify({ pr: { ...prInfo, judgement }, files, config, codeowners });
  const author = tryRun("gh", ["api", "user", "--jq", ".login"]);
  const reviewers = reviewersFor({
    tier: result.tier,
    files,
    featureOwners,
    codeowners,
    author,
  });
  const block = section({ sha, result, reviewers, judgement });
  console.log(report({ sha, result, reviewers, judgement }));
  const file = join(store, `${sha}.body.md`);
  writeFileSync(file, withSection(body, block));
  const blocked = result.blocked
    ? `실패: ${result.blocked}. 바뀐 동작을 확인하는 테스트를 더한 뒤 다시 돌리세요.`
    : null;
  if (blocked && !pr) {
    console.error(`${blocked} PR은 만들지 않았습니다.`);
    process.exit(1);
  }
  let number = pr?.number;
  if (number) {
    try {
      run("gh", ["pr", "edit", String(number), "--body-file", file]);
    } catch {
      console.log(`PR #${number} 본문을 고치지 못했습니다`);
      process.exit(blocked ? 1 : 0);
    }
  } else {
    try {
      const url = run(
        "gh",
        createArgs(extra, { base: baseName, title, bodyFile: file }),
        { stdio: ["ignore", "pipe", "inherit"] },
      );
      number = Number(url.match(/\/pull\/(\d+)/)?.[1]);
      console.log(url);
    } catch {
      console.error(
        "PR을 만들지 못했습니다. 브랜치를 push했는지와 위 gh 오류를 확인하세요.",
      );
      process.exit(1);
    }
  }
  if (number) applyToPr(repo, number, result.tier, reviewers);
  if (blocked) {
    console.error(blocked);
    process.exit(1);
  }
}
