import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);

export const PACKAGE_NAME = "@turbo-project/mutation";
export const BASE_CONFIG = join(
  dirname(fileURLToPath(import.meta.url)),
  "base.mjs",
);
export const SCRIPT = "mutation run";
export const IGNORES = [".stryker-tmp*", "reports/mutation"];
export const AGENTS_FILE = "AGENTS.md";
export const AGENTS_LINE =
  "- `lib/`의 순수 함수를 바꿨으면 push 전에 `pnpm test:mutation --mutate '<파일>'`을 돌린다. CI에서는 돌지 않는다. 살아남은 변이는 테스트로 잡고, 잡을 수 없는 동등 변이만 PR 본문에 `파일:라인 | 변이 | 이유`로 남긴다.";
export const AGENTS_BLOCK = `<!-- BEGIN:mutation -->\n## 뮤테이션\n\n${AGENTS_LINE}\n<!-- END:mutation -->`;
const BLOCK = /<!-- BEGIN:mutation -->[\s\S]*?<!-- END:mutation -->/;
const STRYKER_CONFIG = /^\.?stryker\.(conf|config)\.(json|js|mjs|cjs)$/;
const LOCKED = ["testRunner", "plugins"];

export function strykerBin() {
  const manifest = require.resolve("@stryker-mutator/core/package.json");
  const { bin } = JSON.parse(readFileSync(manifest, "utf8"));
  return join(dirname(manifest), bin.stryker);
}

export const repoConfigs = (root) =>
  readdirSync(root).filter((name) => STRYKER_CONFIG.test(name));

export const runArgs = (root, args) =>
  repoConfigs(root).length > 0
    ? ["run", ...args]
    : ["run", BASE_CONFIG, ...args];

function readOrNull(root, path) {
  const target = join(root, path);
  return existsSync(target) ? readFileSync(target, "utf8") : null;
}

function addScript(root) {
  const text = readOrNull(root, "package.json");
  if (text === null) return { todo: "package.json이 없습니다." };
  const pkg = JSON.parse(text);
  const current = pkg.scripts?.["test:mutation"];
  if (current === SCRIPT) return {};
  pkg.scripts = { ...pkg.scripts, "test:mutation": SCRIPT };
  writeFileSync(
    join(root, "package.json"),
    `${JSON.stringify(pkg, null, 2)}\n`,
  );
  return {
    done: current
      ? `package.json test:mutation을 "${current}"에서 "${SCRIPT}"로 바꿨습니다.`
      : `package.json에 "test:mutation": "${SCRIPT}"를 더했습니다.`,
  };
}

function addIgnores(root) {
  const text = readOrNull(root, ".gitignore") ?? "";
  const lines = text.split("\n").map((line) => line.trim());
  const missing = IGNORES.filter((line) => !lines.includes(line));
  if (missing.length === 0) return {};
  const prefix = text && !text.endsWith("\n") ? "\n" : "";
  writeFileSync(
    join(root, ".gitignore"),
    `${text}${prefix}${missing.join("\n")}\n`,
  );
  return { done: `.gitignore에 ${missing.join(", ")}를 더했습니다.` };
}

function addAgentsLine(root) {
  const text = readOrNull(root, AGENTS_FILE) ?? "";
  const next = BLOCK.test(text)
    ? text.replace(BLOCK, AGENTS_BLOCK)
    : `${text.trim() ? `${text.trimEnd()}\n\n` : ""}${AGENTS_BLOCK}\n`;
  if (next === text) return {};
  writeFileSync(join(root, AGENTS_FILE), next);
  return { done: `${AGENTS_FILE}의 mutation 블록에 뮤테이션 명령을 넣었습니다.` };
}

export function init(root) {
  const done = [];
  const todo = [];
  for (const step of [addScript, addIgnores, addAgentsLine]) {
    const result = step(root);
    if (result.done) done.push(result.done);
    if (result.todo) todo.push(result.todo);
  }
  return { done, todo };
}

export function check(root) {
  const errors = [];
  for (const name of repoConfigs(root)) {
    const text = readFileSync(join(root, name), "utf8");
    if (!text.includes(`${PACKAGE_NAME}/base`))
      errors.push(
        `${name}이 ${PACKAGE_NAME}/base를 쓰지 않습니다. base를 펼치고 바꿀 값만 쓰거나, 바꿀 값이 없으면 파일을 지우세요.`,
      );
    const locked = LOCKED.filter((key) =>
      new RegExp(`\\b${key}\\s*:`).test(text),
    );
    if (locked.length > 0)
      errors.push(
        `${name}이 ${locked.join(", ")}를 덮어씁니다. 이 값은 base가 정합니다.`,
      );
  }
  const pkg = readOrNull(root, "package.json");
  if (pkg !== null && JSON.parse(pkg).scripts?.["test:mutation"] !== SCRIPT)
    errors.push(
      `package.json test:mutation이 "${SCRIPT}"가 아닙니다. \`pnpm exec mutation init\`을 돌리세요.`,
    );
  return { errors };
}
