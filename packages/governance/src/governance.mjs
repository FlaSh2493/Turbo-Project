import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { addPrePushHook } from "./hooks.mjs";

export const PACKAGE_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const PACKAGE_NAME = "@turbo-project/governance";
export const VERSION = JSON.parse(
  readFileSync(join(PACKAGE_ROOT, "package.json"), "utf8"),
).version;
export const CRITERIA_FILE = join(PACKAGE_ROOT, "criteria.md");

export const UNCONFIRMED = "확인 필요";
export const OWNER_PLACEHOLDER = "@메인-오너";
export const AGENTS_FILE = "AGENTS.md";
export const CODEOWNERS_FILE = ".github/CODEOWNERS";
export const PR_TEMPLATE = ".github/pull_request_template.md";
export const AGENTS_LINE =
  "- PR은 `pnpm exec governance judge --create <gh pr create 인자>`로 연다. 등급 라벨, 리뷰어, 본문 등급 블록이 함께 붙는다. base를 바꾸면 `pnpm exec governance judge`를 다시 돌린다.";
export const AGENTS_BLOCK = `<!-- BEGIN:governance -->\n## PR\n\n${AGENTS_LINE}\n<!-- END:governance -->`;
const BLOCK = /<!-- BEGIN:governance -->[\s\S]*?<!-- END:governance -->/;

export const FIXED_PATH_CANDIDATES = [
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  ".npmrc",
  ".nvmrc",
  "next.config.ts",
  "next.config.js",
  "next.config.mjs",
  "vite.config.ts",
  "Dockerfile",
  "src/proxy.ts",
  "src/middleware.ts",
  ".claude/settings.json",
];
const ALWAYS_FIXED = [".github/workflows/", CODEOWNERS_FILE];

const TEMPLATES = join(PACKAGE_ROOT, "templates");

const readOrNull = (root, path) =>
  existsSync(join(root, path)) ? readFileSync(join(root, path), "utf8") : null;

export function criteria() {
  return `<!-- ${PACKAGE_NAME}@${VERSION} -->\n${readFileSync(CRITERIA_FILE, "utf8")}`;
}

export function codeownersProblem(text) {
  if (text === null)
    return `${CODEOWNERS_FILE}이 없습니다. \`pnpm exec governance init\`이 만듭니다.`;
  if (text.includes(UNCONFIRMED) || text.includes(OWNER_PLACEHOLDER))
    return `${CODEOWNERS_FILE}에 '${UNCONFIRMED}'나 ${OWNER_PLACEHOLDER}가 남아 있습니다. 막을 경로와 오너를 확인하고 표시를 지우세요.`;
  return null;
}

export function detectFixedPaths(root) {
  const found = FIXED_PATH_CANDIDATES.filter((path) =>
    existsSync(join(root, path)),
  );
  const moreDockerfiles = readdirSync(root).some(
    (name) => name.startsWith("Dockerfile") && name !== "Dockerfile",
  );
  if (!moreDockerfiles) return found;
  return [...found.filter((path) => path !== "Dockerfile"), "Dockerfile*"];
}

export const defaultAnswers = (root) => ({
  owners: [],
  fixedPaths: detectFixedPaths(root),
});

const ownerPath = (path) =>
  path.startsWith("/") || path.startsWith("*") ? path : `/${path}`;

export function codeownersText(answers, { unconfirmed = false } = {}) {
  const owners =
    answers.owners.length > 0
      ? answers.owners.map((owner) => `@${owner.replace(/^@/, "")}`).join(" ")
      : OWNER_PLACEHOLDER;
  const line = (path) => `${ownerPath(path)} ${owners}`;
  return [
    "# GitHub가 Code Owner 승인을 요구할 경로와 오너. 등급은 이 파일로 정하지 않는다. 테스트가 증명하지 못하는 경로(CI·배포, 빌드 설정, 모든 요청이 거쳐 가는 코드)만 넣는다.",
    "# 첫 오너가 메인 오너다. 메인 오너는 ruleset 우회 목록에 둬서 자기 PR을 셀프머지한다.",
    "# 아래 줄이 위 줄을 덮어쓴다. 오너 없이 적은 줄은 그 경로를 승인 대상에서 뺀다.",
    ...(unconfirmed
      ? [
          `# ${UNCONFIRMED}: 경로와 오너를 확인하고 ${OWNER_PLACEHOLDER}를 실제 GitHub 아이디로 바꾼 뒤 이 줄을 지운다.`,
        ]
      : []),
    "",
    ...ALWAYS_FIXED.map(line),
    "",
    "# 문서는 막지 않는다.",
    "*.md",
    "",
    ...answers.fixedPaths.map(line),
    "",
  ].join("\n");
}

function writeIfMissing(root, path, content) {
  if (existsSync(join(root, path))) return false;
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), content);
  return true;
}

function addAgentsLine(root) {
  const text = readOrNull(root, AGENTS_FILE) ?? "";
  const next = BLOCK.test(text)
    ? text.replace(BLOCK, AGENTS_BLOCK)
    : `${text.trim() ? `${text.trimEnd()}\n\n` : ""}${AGENTS_BLOCK}\n`;
  if (next === text) return {};
  writeFileSync(join(root, AGENTS_FILE), next);
  return { done: `${AGENTS_FILE}의 governance 블록에 PR을 연 뒤 돌릴 판정 명령을 넣었습니다.` };
}

export function init(root, answers = null) {
  const done = [];
  const todo = [];
  const unconfirmed = answers === null;

  if (
    writeIfMissing(
      root,
      CODEOWNERS_FILE,
      codeownersText({ ...defaultAnswers(root), ...answers }, { unconfirmed }),
    )
  )
    done.push(
      unconfirmed
        ? `${CODEOWNERS_FILE}을 추천 경로로 만들었습니다. 경로를 확인하고 ${OWNER_PLACEHOLDER}를 메인 오너 아이디로 바꾸세요.`
        : `${CODEOWNERS_FILE}을 만들었습니다.`,
    );
  if (
    writeIfMissing(
      root,
      PR_TEMPLATE,
      readFileSync(join(TEMPLATES, "pull_request_template.md"), "utf8"),
    )
  )
    done.push(`${PR_TEMPLATE}를 만들었습니다.`);

  for (const step of [addAgentsLine(root), addPrePushHook(root)]) {
    if (step.done) done.push(step.done);
    if (step.todo) todo.push(step.todo);
  }

  const problem = codeownersProblem(readOrNull(root, CODEOWNERS_FILE));
  if (problem) todo.push(problem);
  return { done, todo };
}
