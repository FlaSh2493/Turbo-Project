import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { addPrePushHook } from "./hooks.mjs";

export const PACKAGE_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const PACKAGE_NAME = "@turbo-project/governance";
export const VERSION = JSON.parse(
  readFileSync(join(PACKAGE_ROOT, "package.json"), "utf8"),
).version;
export const CRITERIA_FILE = join(PACKAGE_ROOT, "criteria.md");

export const AGENTS_FILE = "AGENTS.md";
export const PR_TEMPLATE = ".github/pull_request_template.md";
export const AGENTS_LINES = [
  "- PR은 `pnpm exec governance judge --create <gh pr create 인자>`로 연다. 별도 Claude 세션이 테스트 없음과 동등 변이를 판정해 PR 본문 맨 위에 결과 한 줄을, `## 수락 기준` 앞에 `## 검증`을 넣는다. push할 때마다 pre-push 훅이 다시 판정하고, base를 바꾸면 `pnpm exec governance judge`를 다시 돌린다.",
  "- `## 검증`은 직접 쓰지 않는다. 나머지 본문은 플랜에서 옮긴다.",
  "- 사람 리뷰 없이 머지 게이트(`merge-gate`)가 통과하면 머지할 수 있다. 실패하면 체크 요약의 안내대로 고친다.",
];
export const AGENTS_BLOCK = `<!-- BEGIN:governance -->\n## PR\n\n${AGENTS_LINES.join("\n")}\n<!-- END:governance -->`;
const BLOCK = /<!-- BEGIN:governance -->[\s\S]*?<!-- END:governance -->/;

const TEMPLATES = join(PACKAGE_ROOT, "templates");

const readOrNull = (root, path) =>
  existsSync(join(root, path)) ? readFileSync(join(root, path), "utf8") : null;

export function criteria() {
  return `<!-- ${PACKAGE_NAME}@${VERSION} -->\n${readFileSync(CRITERIA_FILE, "utf8")}`;
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
  return { done: `${AGENTS_FILE}의 governance 블록에 PR을 여는 명령과 머지 게이트를 넣었습니다.` };
}

export function init(root) {
  const done = [];
  const todo = [];
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
  return { done, todo };
}
