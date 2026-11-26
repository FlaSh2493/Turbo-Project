import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

import { minimatch } from "minimatch";

import { BASE_CONFIG, repoConfigs } from "./mutation.mjs";

export const REPORT_FILE = "reports/mutation/mutation.json";
export const HEAD_FILE = "reports/mutation/head.json";
export const BASE_CANDIDATES = ["origin/develop", "origin/main"];
const SURVIVED = ["Survived", "NoCoverage"];

// Stryker처럼 minimatch로 패턴을 앞에서부터 차례로 적용한다. 뒤에 오는 포함 패턴이 앞의 제외를 되살린다.
export function mutateMatcher(patterns) {
  return (path) => {
    let included = false;
    for (const pattern of patterns) {
      const negate = pattern.startsWith("!");
      // Stryker는 패턴을 절대 경로로 풀어 비교하므로 `./src/**`와 `src/**`가 같다. 앞의 ./를 떼고 맞춘다.
      const glob = (negate ? pattern.slice(1) : pattern).replace(/^(?:\.\/)+/, "");
      if (minimatch(path, glob, { dot: true })) included = !negate;
    }
    return included;
  };
}

// 레포 설정이 있으면 그 mutate를, 없거나 mutate가 없으면 base의 mutate를 쓴다.
// --mutate는 설정의 mutate를 통째로 대신하므로, 바뀐 줄을 넘기기 전에 이 범위로 먼저 거른다.
export async function mutatePatterns(root) {
  const loadModule = async (path) => (await import(pathToFileURL(path).href)).default;
  const base = await loadModule(BASE_CONFIG);
  const [name] = repoConfigs(root);
  if (!name) return base.mutate;
  const path = join(root, name);
  const config = name.endsWith(".json") ? JSON.parse(readFileSync(path, "utf8")) : await loadModule(path);
  return config?.mutate ?? base.mutate;
}

// git이 따옴표로 감싸 출력한 경로(공백, 따옴표, 비ASCII 등)를 되돌린다.
export function unquotePath(path) {
  if (!path.startsWith('"')) return path;
  const bytes = [];
  const body = path.slice(1, -1);
  for (let index = 0; index < body.length; index += 1) {
    const char = body[index];
    if (char !== "\\") {
      bytes.push(...Buffer.from(char));
      continue;
    }
    const next = body[index + 1];
    const octal = body.slice(index + 1, index + 4);
    if (/^[0-7]{3}$/.test(octal)) {
      bytes.push(parseInt(octal, 8));
      index += 3;
    } else {
      bytes.push(...Buffer.from({ n: "\n", t: "\t", '"': '"', "\\": "\\" }[next] ?? next));
      index += 1;
    }
  }
  return Buffer.from(bytes).toString("utf8");
}

// `git diff -U0` 출력에서 새 쪽(+) 줄 범위를 파일별로 모은다. 지운 줄만 있는 hunk는 뺀다.
export function changedLines(diff) {
  const files = new Map();
  let file = null;
  for (const line of (diff ?? "").split("\n")) {
    if (line.startsWith("+++ ")) {
      const path = unquotePath(line.slice(4));
      file = path === "/dev/null" ? null : path.replace(/^"?b\//, "");
      continue;
    }
    const hunk = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/);
    if (!hunk || !file) continue;
    const start = Number(hunk[1]);
    const count = hunk[2] === undefined ? 1 : Number(hunk[2]);
    if (count === 0) continue;
    if (!files.has(file)) files.set(file, []);
    files.get(file).push([start, start + count - 1]);
  }
  return files;
}

export const mutateList = (files, isTarget) =>
  [...files]
    .filter(([path]) => isTarget(path))
    .flatMap(([path, ranges]) =>
      ranges.map(([start, end]) => `${path}:${start}-${end}`),
    );

const git = (root, args) =>
  execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();

const refExists = (root, ref) => {
  try {
    git(root, ["rev-parse", "--verify", "--quiet", `${ref}^{commit}`]);
    return true;
  } catch {
    return false;
  }
};

// ref를 커밋 SHA로 바꾼다. 돌린 뒤 ref가 움직여도 기록한 base는 그대로다.
export function resolveCommit(root, ref) {
  try {
    return git(root, ["rev-parse", "--verify", "--quiet", `${ref}^{commit}`]);
  } catch {
    return null;
  }
}

export function resolveBase(root, base) {
  if (base) return base;
  return BASE_CANDIDATES.find((ref) => refExists(root, ref)) ?? null;
}

// 이름을 바꾸면서 고친 파일(R)도 넣는다. 대상은 실행을 시작할 때 고정한 커밋(sha)으로 계산한다.
export function changedTargets(root, base, sha, isTarget) {
  const diff = git(root, [
    "-c",
    "core.quotePath=false",
    "diff",
    "-U0",
    "--no-color",
    "--no-ext-diff",
    "--diff-filter=AMR",
    `${base}...${sha}`,
  ]);
  return mutateList(changedLines(diff), isTarget);
}

export const headSha = (root) => git(root, ["rev-parse", "HEAD"]);

function writeJson(root, path, value) {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), `${JSON.stringify(value, null, 2)}\n`);
}

// 바뀐 대상이 없을 때도 리포트를 남겨서, 뒤에서 읽는 쪽이 "돌리지 않음"과 "살아남은 변이 없음"을 구분하게 한다.
export const writeEmptyReport = (root) =>
  writeJson(root, REPORT_FILE, { schemaVersion: "2", thresholds: {}, files: {} });

export const writeHead = (root, sha, base, baseSha) =>
  writeJson(root, HEAD_FILE, { sha, base, baseSha });

// 일부만 돌리는 실행이 끝나면 리포트가 바뀌므로, 실행을 시작할 때 완료 기록부터 지운다.
export const clearHead = (root) => rmSync(join(root, HEAD_FILE), { force: true });

// 레포 설정이 json 리포터를 빼면 이전 리포트가 남아 이번 결과처럼 읽힌다. 돌리기 전에 지운다.
export const clearReport = (root) => rmSync(join(root, REPORT_FILE), { force: true });

// 커밋하지 않은 변경이 있으면 Stryker가 검사한 내용과 커밋이 다르다.
export const isClean = (root) =>
  git(root, ["status", "--porcelain", "--untracked-files=normal"]) === "";

export function readReport(root) {
  const path = join(root, REPORT_FILE);
  return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : null;
}

export function readHead(root) {
  const path = join(root, HEAD_FILE);
  return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : null;
}

export function survivors(report) {
  const found = [];
  for (const [file, { mutants = [] }] of Object.entries(report?.files ?? {}))
    for (const mutant of mutants)
      if (SURVIVED.includes(mutant.status))
        found.push({
          file,
          line: mutant.location?.start?.line ?? 0,
          column: mutant.location?.start?.column ?? 0,
          mutator: mutant.mutatorName,
          replacement: mutant.replacement ?? "",
          status: mutant.status,
        });
  return found.sort(
    (a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.column - b.column,
  );
}

export const survivorLine = ({ file, line, column, mutator, replacement }) =>
  `${file}:${line}:${column} | ${mutator} | ${replacement.replace(/\s+/g, " ").trim()}`;
