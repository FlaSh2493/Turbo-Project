import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, readFileSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { parseBlock } from "./verification.mjs";

// 검사를 피해 가는 코드. 이번 diff에서 새로 들어간 줄만 본다.
// 호출은 문자열을 걷어 낸 코드에서, 끄는 지시는 주석 글에서 찾는다.
export const CALLS = [
  // 괄호가 다음 줄로 넘어간 호출도 잡도록 괄호를 요구하지 않는다.
  { name: "테스트 건너뛰기", pattern: /\b(?:it|test|describe|suite)\.(?:skip|only|todo)\b/ },
  { name: "테스트 건너뛰기", pattern: /\bx(?:it|test|describe)\s*(?:\(|$)/ },
];
export const DIRECTIVES = [
  { name: "eslint 끄기", pattern: /^\s*eslint-disable\b/ },
  { name: "타입 검사 끄기", pattern: /^\s*@ts-(?:ignore|nocheck)\b/ },
  { name: "뮤테이션 끄기", pattern: /^\s*Stryker disable\b/ },
];
export const BYPASS = [...CALLS, ...DIRECTIVES];
const CODE = /\.[cm]?[jt]sx?$/;

// 앞 줄의 `it`에 이어 `.only(`만 더한 경우를 잡는다.
const CHAINED = /^\s*\.(?:skip|only|todo)\b/;
const CALLEE_AT_END = /\b(?:it|test|describe|suite)\s*$/;

// 소스 전체를 앞에서부터 읽어 줄마다 코드(문자열·정규식 내용을 뺀 것)와 주석 조각을 나눈다.
// 상태(문자열, 템플릿, 블록 주석, 템플릿 보간식 `${…}`)는 줄을 넘어 이어진다.
// `/`가 정규식인지 나눗셈인지는 바로 앞의 코드로 정한다(값 뒤면 나눗셈, 연산자·여는 괄호·키워드 뒤면 정규식).
const REGEX_BEFORE =
  /(?:^|[(,=:[!&|?{};+\-*%<>~^]|\b(?:return|typeof|case|do|else|in|of|new|delete|void|throw|yield|await))\s*$/;

export function lexLines(source) {
  const lines = [];
  let code = "";
  let comments = [];
  let comment = null;
  let tail = ""; // 줄을 넘어 이어지는 최근 코드. 정규식 판단에 쓴다.
  let mode = "code"; // code | line | block | sq | dq | tpl | re
  let inClass = false;
  const frames = []; // 템플릿 보간식마다 { depth }
  const emit = (text) => {
    code += text;
    tail = (tail + text).slice(-40);
  };
  const endLine = () => {
    if (comment !== null) comments.push(comment);
    lines.push({ code, comments });
    code = "";
    comments = [];
    comment = mode === "block" ? "" : null;
    tail = `${tail}\n`.slice(-40);
  };
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    if (char === "\n") {
      if (mode === "line" || mode === "sq" || mode === "dq" || mode === "re") mode = "code";
      endLine();
      continue;
    }
    if (mode === "line" || mode === "block") {
      if (mode === "block" && char === "*" && next === "/") {
        comments.push(comment);
        comment = null;
        mode = "code";
        index += 1;
      } else comment += char;
      continue;
    }
    if (mode === "re") {
      if (char === "\\" && next !== "\n") index += 1;
      else if (char === "[") inClass = true;
      else if (char === "]") inClass = false;
      else if (char === "/" && !inClass) {
        while (/[a-z]/i.test(source[index + 1] ?? "")) index += 1;
        mode = "code";
        emit("/r/");
      }
      continue;
    }
    if (mode === "sq" || mode === "dq" || mode === "tpl") {
      if (char === "\\" && next !== "\n") index += 1;
      else if ((mode === "sq" && char === "'") || (mode === "dq" && char === '"')) {
        mode = "code";
        emit('""');
      } else if (mode === "tpl" && char === "`") {
        mode = "code";
        emit('""');
      } else if (mode === "tpl" && char === "$" && next === "{") {
        frames.push({ depth: 0 });
        mode = "code";
        emit("(");
        index += 1;
      }
      continue;
    }
    // code
    if (char === "/" && next === "/") {
      mode = "line";
      comment = "";
      index += 1;
    } else if (char === "/" && next === "*") {
      mode = "block";
      comment = "";
      index += 1;
    } else if (char === "/" && REGEX_BEFORE.test(tail)) {
      mode = "re";
      inClass = false;
    } else if (char === "'") mode = "sq";
    else if (char === '"') mode = "dq";
    else if (char === "`") mode = "tpl";
    else if (char === "{" && frames.length > 0) {
      frames.at(-1).depth += 1;
      emit(char);
    } else if (char === "}" && frames.length > 0) {
      if (frames.at(-1).depth === 0) {
        frames.pop();
        mode = "tpl";
        emit(")");
      } else {
        frames.at(-1).depth -= 1;
        emit(char);
      }
    } else emit(char);
  }
  endLine();
  return lines;
}

function ruleFor(entry, previousCode) {
  const call =
    CALLS.find(({ pattern }) => pattern.test(entry.code)) ??
    (CHAINED.test(entry.code) && CALLEE_AT_END.test(previousCode) ? CALLS[0] : null);
  if (call) return call;
  return DIRECTIVES.find(({ pattern }) => entry.comments.some((text) => pattern.test(text))) ?? null;
}

// diff에서 파일별로 추가된 줄 번호를 모은다. 소스를 못 얻을 때를 위해 hunk의 줄도 같이 둔다.
function addedLines(diff) {
  const files = new Map();
  let file = null;
  let line = 0;
  let hunk = null;
  for (const text of (diff ?? "").split("\n")) {
    if (text.startsWith("+++ ")) {
      const path = text.slice(4);
      file = path === "/dev/null" ? null : path.replace(/^b\//, "");
      if (file && CODE.test(file) && !files.has(file)) files.set(file, { added: new Set(), hunks: [] });
      if (file && !CODE.test(file)) file = null;
      continue;
    }
    if (text.startsWith("--- ") || text.startsWith("diff ") || text.startsWith("index ")) continue;
    const header = text.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (header) {
      line = Number(header[1]);
      if (file) files.get(file).hunks.push((hunk = { start: line, lines: [] }));
      continue;
    }
    if (!file || text.startsWith("-") || text.startsWith("\\")) continue;
    if (text.startsWith("+")) files.get(file).added.add(line);
    hunk.lines.push(text.slice(1));
    line += 1;
  }
  return files;
}

const previousCodeLine = (lexed, index) => {
  for (let at = index - 1; at >= 0; at -= 1) if (lexed[at]?.code.trim()) return lexed[at].code;
  return "";
};

// sourceOf(path)가 PR head의 파일 전체를 주면 그 전체로 문자열·주석 상태를 정한다.
// 못 주면 hunk에 보이는 줄만으로 정한다(앞부분이 잘린 문자열은 틀릴 수 있다).
export function bypassFindings(diff, sourceOf = () => null) {
  const found = [];
  for (const [file, { added, hunks }] of addedLines(diff)) {
    if (added.size === 0) continue;
    const source = sourceOf(file);
    const views =
      source !== null && source !== undefined
        ? [{ start: 1, raw: source.split("\n") }]
        : hunks.map((hunk) => ({ start: hunk.start, raw: hunk.lines }));
    for (const { start, raw } of views) {
      const lexed = lexLines(raw.join("\n"));
      raw.forEach((text, offset) => {
        const line = start + offset;
        if (!added.has(line)) return;
        const rule = ruleFor(lexed[offset], previousCodeLine(lexed, offset));
        if (rule) found.push({ file, line, name: rule.name, text: text.trim() });
      });
    }
  }
  return found.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
}

const check = (name, ok, detail, fix = "") => ({ name, ok, detail, fix });

// 뮤테이션 테스트는 로컬에서 돌리고 judge가 판정한다. 같은 커밋이면 CI에서 다시 돌려도 결과가 같아서 여기서는 판정 결과만 본다.
export function evaluate({ block, headSha, baseRef = null, bypass, mergeGroup = false }) {
  const checks = [];
  if (!mergeGroup) {
    if (!block)
      checks.push(check("판정이 PR 본문에 있다", false, "`## 검증` 블록이 없다", "로컬에서 `pnpm exec governance judge`를 돌린다"));
    else if (block.sha !== headSha)
      checks.push(
        check(
          "판정이 지금 커밋 기준이다",
          false,
          `판정한 커밋 ${block.sha.slice(0, 7)} ≠ 지금 커밋 ${headSha.slice(0, 7)}`,
          "로컬에서 `pnpm exec governance judge`를 다시 돌린다. push할 때 자동으로도 돈다",
        ),
      );
    else if (baseRef && block.base && block.base !== baseRef)
      checks.push(
        check(
          "판정이 지금 base 기준이다",
          false,
          `판정한 base ${block.base} ≠ 지금 base ${baseRef}`,
          "base를 바꿨으면 로컬에서 `pnpm exec governance judge`를 다시 돌린다",
        ),
      );
    else if (!block.pass)
      checks.push(check("판정을 통과했다", false, "PR 본문 `## 검증`의 결과가 실패다", "`## 검증`의 안내대로 고친 뒤 다시 판정한다"));
    else
      checks.push(
        check("판정이 지금 커밋 기준이다", true, `판정한 커밋 ${block.sha.slice(0, 7)}${block.skipped ? " · 승격·백포트, revert라 판정 생략" : ""}`),
      );
  }

  checks.push(
    bypass.length === 0
      ? check("검사를 건너뛰지 않았다", true, "테스트 건너뛰기, 경고를 끄는 주석 없음")
      : check(
          "검사를 건너뛰지 않았다",
          false,
          bypass.map((each) => `${each.file}:${each.line} ${each.name} \`${each.text}\``).join("; "),
          "건너뛰거나 끄지 말고 원인을 고친다",
        ),
  );

  return { ok: checks.every((each) => each.ok), checks };
}

export function summary({ ok, checks }) {
  return [
    `## merge-gate: ${ok ? "✅ 머지 가능" : `❌ 머지 불가 · ${checks.filter((each) => !each.ok).length}개 실패`}`,
    "",
    ...checks.flatMap((each) => [
      `- ${each.ok ? "✅" : "❌"} **${each.name}** — ${each.detail}`,
      ...(each.ok || !each.fix ? [] : [`  - 고칠 것: ${each.fix}`]),
    ]),
    "",
  ].join("\n");
}

// 파일 원문은 줄 번호가 어긋나지 않게 공백을 자르지 않는다. SHA 같은 한 줄 출력만 자른다.
const readRaw = (cmd, args) =>
  execFileSync(cmd, args, {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    stdio: ["ignore", "pipe", "ignore"],
  });
const run = (cmd, args) => readRaw(cmd, args).trim();

function context() {
  const path = process.env.GITHUB_EVENT_PATH;
  const event = path && existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : null;
  if (event?.pull_request)
    return {
      body: event.pull_request.body ?? "",
      head: event.pull_request.head.sha,
      base: event.pull_request.base.sha,
      baseRef: event.pull_request.base.ref,
    };
  if (event?.merge_group)
    return {
      mergeGroup: true,
      head: event.merge_group.head_sha,
      base: event.merge_group.base_sha,
    };
  const pr = JSON.parse(run("gh", ["pr", "view", "--json", "body,headRefOid,baseRefName"]));
  return {
    body: pr.body ?? "",
    head: pr.headRefOid,
    baseRef: pr.baseRefName,
    base: run("git", ["merge-base", `origin/${pr.baseRefName}`, pr.headRefOid]),
  };
}

if (
  process.argv[1] &&
  realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  let ctx;
  try {
    ctx = context();
  } catch {
    console.error("PR 정보를 읽지 못했습니다. pull_request, merge_group 이벤트에서 돌리거나, 로컬이면 열린 PR이 있는 브랜치에서 돌리세요.");
    process.exit(1);
  }
  const diff = run("git", ["diff", "-U3", "--no-color", "--no-ext-diff", `${ctx.base}...${ctx.head}`]);
  const result = evaluate({
    block: ctx.mergeGroup ? null : parseBlock(ctx.body),
    headSha: ctx.head,
    baseRef: ctx.baseRef,
    bypass: bypassFindings(diff, (path) => {
      try {
        return readRaw("git", ["show", `${ctx.head}:${path}`]);
      } catch {
        return null;
      }
    }),
    mergeGroup: ctx.mergeGroup,
  });
  const text = summary(result);
  console.log(text);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, text);
  process.exit(result.ok ? 0 : 1);
}
