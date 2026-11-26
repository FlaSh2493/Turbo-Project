import { createHash } from "node:crypto";
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

import { criteria, VERSION } from "../src/governance.mjs";
import {
  checkBaseBranch,
  isPromotion,
  isRevertPr,
  originalPrNumber,
} from "./pr-rules.mjs";
import {
  buildBlock,
  mutantLabel,
  readMutation,
  withBlock,
} from "./verification.mjs";

const testTable = (text) => {
  const start = text.indexOf("## 테스트 없음");
  const end = text.indexOf("\n## ", start + 1);
  return text.slice(start, end < 0 ? undefined : end).trim();
};

// range는 `<base>...<sha>`다. 판정 도중 HEAD가 바뀌어도 처음 읽은 커밋으로 판정한다.
export const testPrompt = (range, criteriaText = criteria()) =>
  `이 레포의 변경(git diff ${range})을 아래 기준으로 판정한다. 코드는 고치지 않는다. 필요하면 바뀐 파일과 그 파일을 쓰는 곳, 테스트 파일을 읽는다. diff에서 보이는 것만 근거로 삼는다.

${testTable(criteriaText)}

답은 아래 한 줄만 쓴다. 한 줄 결과는 표에 들어갈 20자 안쪽 말이다(예: 바뀐 동작 4개 모두 테스트 있음). 있음이면 이유에 테스트가 필요한 파일:라인을 단다.
- missing-test: 있음|없음 — 한 줄 결과 | 이유`;

// 값 뒤에는 구분자(—, –, -)와 이유만 올 수 있다. 양식을 그대로 돌려준 `있음|없음` 같은 답은 판정으로 보지 않는다.
const TEST_LINE = /^\s*-\s*missing-test:\s*(있음|없음)\s*(?:[—–-]\s*(.*))?$/;

// `한 줄 결과 | 이유`로 나눈다. `|`가 없으면 이유만 쓴 답으로 본다.
export function parseTestJudgement(text) {
  for (const line of (text ?? "").split("\n")) {
    const match = line.match(TEST_LINE);
    if (!match) continue;
    const answer = (match[2] ?? "").trim();
    const at = answer.indexOf(" | ");
    return at < 0
      ? { flag: match[1] === "있음", summary: "", reason: answer }
      : { flag: match[1] === "있음", summary: answer.slice(0, at).trim(), reason: answer.slice(at + 3).trim() };
  }
  return null;
}

export const mutantPrompt = (range, survivors) =>
  `이 레포의 변경(git diff ${range})에 바뀐 줄만 뮤테이션 테스트를 돌렸고, 아래 변이가 살아남았다. 변이마다 동등 변이인지 판정한다. 코드는 고치지 않는다. 필요하면 해당 파일과 그 함수를 쓰는 곳을 읽는다.

동등 변이는 코드를 바꿔도 어떤 값을 넣든 결과가 같은 변이다. 결과가 달라지는 입력을 하나라도 찾으면 동등 변이가 아니다. 애매하면 동등 변이가 아니다.

${survivors.map((each, index) => `${index + 1}. ${mutantLabel(each)} (파일:줄:열) | ${each.mutator} | ${each.replacement}`).join("\n")}

답은 변이마다 한 줄만 쓴다. 동등이면 결과가 같은 이유를, 아님이면 결과가 달라지는 입력을 쓴다.
${survivors.map((_, index) => `- ${index + 1}: 동등|아님 — 이유`).join("\n")}`;

export function parseMutantJudgement(text, count) {
  const found = new Map();
  for (const line of (text ?? "").split("\n")) {
    // 동등이면 결과가 같은 이유, 아님이면 결과가 달라지는 입력이 꼭 있어야 한다.
    const match = line.match(/^\s*-\s*(\d+):\s*(동등|아님)\s*[—–-]\s*(\S.*)$/);
    if (match)
      found.set(Number(match[1]), {
        equivalent: match[2] === "동등",
        reason: match[3].trim(),
      });
  }
  const result = Array.from({ length: count }, (_, index) => found.get(index + 1));
  return result.every(Boolean) ? result : null;
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

export function report({ sha, pass, skipped, test, mutation, judged }) {
  const lines = [`검증 ${pass ? "통과" : "실패"} (커밋 ${sha.slice(0, 7)})`];
  if (skipped) return [...lines, `- ${skipped}이라 판정하지 않았습니다`].join("\n");
  lines.push(
    test
      ? `- 테스트: ${test.flag ? "없음" : "있음"}${test.reason ? ` — ${test.reason}` : ""}`
      : "- 테스트: 판정하지 못했습니다",
  );
  if (mutation.state === "ok" && mutation.survivors.length > 0 && judged)
    mutation.survivors.forEach((mutant, index) =>
      lines.push(
        `- ${judged[index].equivalent ? "동등 변이" : "잡아야 할 변이"} ${mutantLabel(mutant)} ${mutant.mutator} \`${mutant.replacement}\` — ${judged[index].reason}`,
      ),
    );
  else if (mutation.state === "ok" && mutation.survivors.length > 0)
    lines.push(
      `- 뮤테이션: 살아남은 변이 ${mutation.survivors.length}개를 판정하지 못했습니다. claude CLI를 확인하고 다시 돌리세요`,
    );
  else if (mutation.state === "ok") lines.push("- 뮤테이션: 살아남은 변이 없음");
  else if (mutation.state !== "none")
    lines.push("- 뮤테이션: `pnpm test:mutation --changed`를 지금 커밋에서 다시 돌리세요");
  return lines.join("\n");
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

const CLAUDE_TOOLS = [
  "--allowedTools",
  "Read",
  "Grep",
  "Glob",
  "Bash(git diff:*)",
  "Bash(git log:*)",
  "Bash(git show:*)",
];

// 작업한 세션과 섞이지 않게 새 claude 프로세스로 판정한다. 같은 입력이면 저장한 결과를 쓴다.
function askClaude(store, key, text, parse) {
  const saved = join(store, `${key}.json`);
  if (existsSync(saved)) return JSON.parse(readFileSync(saved, "utf8"));
  const result = parse(
    tryRun("claude", ["-p", text, ...CLAUDE_TOOLS], { timeout: 10 * 60 * 1000 }),
  );
  if (result) writeFileSync(saved, JSON.stringify(result));
  return result;
}

const digest = (value) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 12);

if (
  process.argv[1] &&
  realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const args = process.argv.slice(2);
  const create = args[0] === "--create";
  const extra = create ? args.slice(1) : [];
  const sha = tryRun("git", ["rev-parse", "HEAD"]);
  const store = join(
    tryRun("git", ["rev-parse", "--git-common-dir"]) || ".git",
    "governance",
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
      "열린 PR이 없습니다. PR은 `pnpm exec governance judge --create <gh pr create 인자>`로 열면 검증 결과가 함께 붙습니다.",
    );
    process.exit(0);
  }
  const baseName =
    pr?.baseRefName ??
    argValue(extra, ["--base", "-B"]) ??
    view?.defaultBranchRef?.name ??
    "main";
  const head = pr?.headRefName ?? tryRun("git", ["branch", "--show-current"]);
  const allowed = checkBaseBranch(baseName, head);
  if (!allowed.ok) {
    console.error(
      pr
        ? `실패: PR #${pr.number}. ${allowed.message} \`gh pr edit ${pr.number} --base develop\`으로 base를 바꾼 뒤 다시 돌리세요.`
        : `실패: ${allowed.message} --base를 바꿔 다시 돌리세요.`,
    );
    process.exit(1);
  }
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

  let skipped = null;
  if (isPromotion(head, baseName)) skipped = "승격·백포트 PR";
  else if (isRevertPr(title, body)) {
    const original = originalPrNumber(body, repo);
    const merged =
      original &&
      readJson("gh", ["api", `repos/${repo}/pulls/${original}`])?.merged_at;
    if (merged) skipped = "revert PR";
    else
      console.log(
        "revert PR로 보지 않습니다: 원래 PR이 이 레포에서 머지된 PR이 아닙니다. 일반 PR처럼 판정합니다.",
      );
  }

  let test = null;
  let mutation = { state: "none" };
  let judged = null;
  // 같은 커밋이라도 base가 바뀌면 diff가 달라지므로 캐시 키에 diff 기준 커밋과 기준 버전을 넣는다.
  const forkPoint = tryRun("git", ["merge-base", base, sha]) || base;
  const range = `${base}...${sha}`;
  const forkPointOf = (ref) => tryRun("git", ["merge-base", ref, sha]) || null;
  const cacheKey = `${sha}.${forkPoint.slice(0, 12)}.${VERSION}`;
  if (!skipped) {
    console.log(`검증: ${range} 를 새 세션의 Claude로 판정합니다`);
    test = askClaude(store, `${cacheKey}.test`, testPrompt(range), parseTestJudgement);
    mutation = readMutation(process.cwd(), sha, { expectedBase: base, forkPointOf });
    if (mutation.state === "ok" && mutation.survivors.length > 0) {
      const { survivors } = mutation;
      judged = askClaude(
        store,
        `${cacheKey}.mutants-${digest(survivors)}`,
        mutantPrompt(range, survivors),
        (text) => parseMutantJudgement(text, survivors.length),
      );
    }
  }

  const { pass, block, verdict } = buildBlock({ sha, base: baseName, version: VERSION, skipped, test, mutation, judged });
  console.log(report({ sha, pass, skipped, test, mutation, judged }));
  const file = join(store, `${sha}.body.md`);
  writeFileSync(file, withBlock(body, block, verdict));
  if (!pass && !pr) {
    console.error("검증에 실패해 PR은 만들지 않았습니다. 위 안내대로 고친 뒤 다시 돌리세요.");
    process.exit(1);
  }
  if (pr) {
    try {
      run("gh", ["pr", "edit", String(pr.number), "--body-file", file]);
    } catch {
      console.error(
        `PR #${pr.number} 본문을 고치지 못했습니다. 판정은 저장해 뒀으니 다시 돌리면 본문만 다시 고칩니다.`,
      );
      process.exit(1);
    }
  } else {
    try {
      const url = run(
        "gh",
        createArgs(extra, { base: baseName, title, bodyFile: file }),
        { stdio: ["ignore", "pipe", "inherit"] },
      );
      console.log(url);
    } catch {
      console.error(
        "PR을 만들지 못했습니다. 브랜치를 push했는지와 위 gh 오류를 확인하세요.",
      );
      process.exit(1);
    }
  }
  if (!pass) process.exit(1);
}
