import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

// PR 본문 맨 위 `## 검증` 블록. judge가 쓰고 gate가 읽는다.
export const OPEN = "<!-- verification sha=";
export const CLOSE = "<!-- /verification -->";
const DATA = "<!-- verification-data ";
const VERDICT_OPEN = "<!-- verdict -->";
const VERDICT_CLOSE = "<!-- /verdict -->";
const LEGACY = [["<!-- risk-grade sha=", "<!-- /risk-grade -->"]];

export const MUTATION_REPORT = "reports/mutation/mutation.json";
export const MUTATION_HEAD = "reports/mutation/head.json";
const SURVIVED = ["Survived", "NoCoverage"];

const readJson = (root, path) =>
  existsSync(join(root, path))
    ? JSON.parse(readFileSync(join(root, path), "utf8"))
    : null;

export function usesMutation(root) {
  const pkg = readJson(root, "package.json");
  return Boolean(pkg?.scripts?.["test:mutation"]);
}

export function survivorsOf(report) {
  const found = [];
  for (const [file, { mutants = [] }] of Object.entries(report?.files ?? {}))
    for (const mutant of mutants)
      if (SURVIVED.includes(mutant.status))
        found.push({
          file,
          line: mutant.location?.start?.line ?? 0,
          column: mutant.location?.start?.column ?? 0,
          mutator: mutant.mutatorName,
          replacement: (mutant.replacement ?? "").replace(/\s+/g, " ").trim(),
        });
  return found.sort(
    (a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.column - b.column,
  );
}

// 리포트가 없거나, 지금 커밋에서 돌린 것이 아니거나, 다른 base에서 돌린 것이면 살아남은 변이를 믿지 않는다.
// base는 이름이 아니라 갈라진 커밋(merge-base)으로 비교한다. 같은 커밋도 origin/develop, sha처럼 다르게 적힐 수 있다.
export function readMutation(root, sha, { expectedBase = null, forkPointOf = null } = {}) {
  if (!usesMutation(root)) return { state: "none" };
  const report = readJson(root, MUTATION_REPORT);
  const head = readJson(root, MUTATION_HEAD);
  if (!report || !head) return { state: "missing" };
  if (head.sha !== sha) return { state: "stale", ranAt: head.sha };
  if (expectedBase && forkPointOf) {
    // 돌릴 때 고정한 base 커밋(baseSha)으로 비교한다. 이전 버전 리포트만 ref 이름(base)을 쓴다.
    const ran = forkPointOf(head.baseSha ?? head.base);
    if (!ran || ran !== forkPointOf(expectedBase)) return { state: "otherBase", ranBase: head.base };
  }
  return { state: "ok", survivors: survivorsOf(report) };
}

export const mutantLabel = ({ file, line, column }) => `${file}:${line}:${column}`;
const code = (text) => `\`${String(text).replace(/`/g, "'")}\``;
const cell = (text) => String(text ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");

const MUTATION_DETAIL = {
  missing: "리포트가 없다. `pnpm test:mutation --changed`를 돌린 뒤 다시 판정한다",
  stale: "리포트가 지금 커밋에서 돌린 것이 아니다. `pnpm test:mutation --changed`를 다시 돌린다",
  otherBase: "리포트가 이 PR의 base가 아닌 다른 base에서 돌린 것이다. `pnpm test:mutation --changed --base <PR base>`로 다시 돌린다",
};

// 표의 한 줄. ok가 null이면 해당 없음이다. 실패한 줄의 fix는 "고칠 것"으로 올린다.
export function mutationRow(mutation, judged) {
  const label = "뮤테이션 테스트에서 살아남은 변이가 모두 동등 변이다";
  if (mutation.state === "none") return { label, ok: null, result: "이 레포는 뮤테이션 테스트를 쓰지 않는다" };
  if (mutation.state !== "ok") return { label, ok: false, result: "리포트를 쓸 수 없다", fix: [MUTATION_DETAIL[mutation.state]] };
  const total = mutation.survivors.length;
  if (total === 0) return { label, ok: true, result: "살아남은 변이 없음" };
  if (!judged)
    return { label, ok: false, result: `${total}개를 판정하지 못했다`, fix: ["claude CLI가 있는지 확인하고 다시 판정한다"] };
  const toKill = mutation.survivors
    .map((mutant, index) => ({ mutant, ...judged[index] }))
    .filter((each) => !each.equivalent);
  if (toKill.length === 0) return { label, ok: true, result: `${total}개 모두 동등 변이` };
  return {
    label,
    ok: false,
    result: `${total}개 중 ${toKill.length}개는 테스트가 못 잡는다`,
    fix: toKill.map(
      ({ mutant, reason }) =>
        `${code(mutantLabel(mutant))} ${mutant.mutator} ${code(mutant.replacement)}가 살아남았다. 결과가 달라지는 입력: ${reason}. 이 입력으로 테스트를 더한다`,
    ),
  };
}

export function testRow(test) {
  const label = "바뀐 동작을 확인하는 테스트가 있다";
  if (!test) return { label, ok: false, result: "판정하지 못했다", fix: ["claude CLI가 있는지 확인하고 다시 판정한다"] };
  if (test.flag)
    return { label, ok: false, result: test.summary || "테스트가 없는 동작이 있다", fix: [`테스트를 더한다. ${test.reason}`] };
  return { label, ok: true, result: test.summary || "있음" };
}

const mark = (ok) => (ok === null ? "➖" : ok ? "✅" : "❌");

export function buildBlock({ sha, base = null, version, skipped = null, test = null, mutation = { state: "none" }, judged = null }) {
  const rows = skipped ? [] : [testRow(test), mutationRow(mutation, judged)];
  const failed = rows.filter((row) => row.ok === false);
  const pass = failed.length === 0;
  const short = code(sha.slice(0, 7));
  const pairs = mutation.state === "ok" && judged ? mutation.survivors.map((mutant, index) => ({ mutant, ...judged[index] })) : [];
  const equivalents = pairs.filter((each) => each.equivalent);
  const fixes = failed.flatMap((row) => row.fix ?? []);

  const status = skipped ? `✅ 판정 생략 · ${skipped}` : pass ? "✅ 판정 통과" : `❌ 판정 실패 · 고칠 것 ${fixes.length}개`;
  const verdict = [VERDICT_OPEN, `**${status}** · ${short} · [아래 검증 보기](#검증)`, VERDICT_CLOSE].join("\n");

  const lines = [
    `${OPEN}${sha} -->`,
    "## 검증",
    "",
    `${short}${base ? ` · base ${code(base)}` : ""} · governance@${version}`,
    "",
  ];
  if (skipped) lines.push(`${skipped}이라 판정하지 않았다.`);
  else
    lines.push(
      "| | Claude 판정 | 결과 |",
      "| :-: | --- | --- |",
      ...rows.map((row) => `| ${mark(row.ok)} | ${row.label} | ${cell(row.result)} |`),
      "",
      "레포 CI와 테스트 건너뛰기·검사 끄기는 CI가 확인하고, 결과는 아래 merge-gate 체크에 나온다.",
    );
  if (fixes.length > 0) lines.push("", "### 고칠 것", "", ...fixes.map((fix, index) => `${index + 1}. ${fix}`));
  if (equivalents.length > 0)
    lines.push(
      "",
      `<details><summary>동등 변이 ${equivalents.length}개 (테스트로 잡을 수 없어서 뺐다)</summary>`,
      "",
      "| 위치 | 변이 | 결과가 같은 이유 |",
      "| --- | --- | --- |",
      ...equivalents.map(({ mutant, reason }) => `| ${code(mutantLabel(mutant))} | ${mutant.mutator} ${code(mutant.replacement)} | ${cell(reason)} |`),
      "",
      "</details>",
    );
  if (!skipped && test?.reason && !test.flag)
    lines.push("", "<details><summary>판정 이유</summary>", "", test.reason, "", "</details>");
  const data = { pass, base, skipped: Boolean(skipped), mutation: mutation.state };
  lines.push(`${DATA}${JSON.stringify(data)} -->`, CLOSE);
  return { pass, block: lines.join("\n"), verdict };
}

export function parseBlock(body) {
  const text = body ?? "";
  const start = text.indexOf(OPEN);
  const end = text.indexOf(CLOSE, start);
  if (start < 0 || end < 0) return null;
  const inner = text.slice(start, end);
  const sha = inner.slice(OPEN.length).match(/^([0-9a-f]+)/)?.[1];
  const dataAt = inner.indexOf(DATA);
  if (!sha || dataAt < 0) return null;
  try {
    const data = JSON.parse(inner.slice(dataAt + DATA.length, inner.indexOf(" -->", dataAt)));
    return { sha, ...data };
  } catch {
    return null;
  }
}

function cut(text, open, close) {
  const start = text.indexOf(open);
  const end = text.indexOf(close, start);
  if (start < 0 || end < 0) return text;
  return `${text.slice(0, start).trimEnd()}\n\n${text.slice(end + close.length).trimStart()}`;
}

// 예전 블록과 지난 블록을 지운다. 판정 결과 한 줄은 첫 `## ` 섹션 앞에, 검증 칸은 `## 수락 기준` 앞에 넣는다.
// 수락 기준이 없는 본문(revert PR 등)은 검증 칸을 맨 끝에 붙인다.
export function withBlock(body, block, verdict = null) {
  let text = body ?? "";
  for (const [open, close] of [[OPEN, CLOSE], [VERDICT_OPEN, VERDICT_CLOSE], ...LEGACY]) text = cut(text, open, close);
  text = text.trim();
  const criteria = text.search(/^## 수락 기준\s*$/m);
  text =
    criteria < 0
      ? `${text ? `${text}\n\n` : ""}${block}`
      : `${text.slice(0, criteria).trimEnd()}\n\n${block}\n\n${text.slice(criteria)}`;
  if (!verdict) return text.trim();
  const heading = text.search(/^(## |<!-- verification sha=)/m);
  const before = text.slice(0, heading).trimEnd();
  return `${before ? `${before}\n\n` : ""}${verdict}\n\n${text.slice(heading)}`.trim();
}
