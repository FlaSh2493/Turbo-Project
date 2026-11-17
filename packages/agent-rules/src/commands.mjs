import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";

import {
  AGENTS_FILE,
  BEGIN,
  COMMON_OUT,
  PACKAGE_ROOT,
  blockOf,
  generate,
  insertBlock,
  markdownIn,
  validate,
} from "./core.mjs";

const TEMPLATES = join(PACKAGE_ROOT, "templates");
const INIT = "agent-rules init";
const CHECK = "agent-rules check";
const PRETTIER_LINES = [AGENTS_FILE, `${COMMON_OUT}/`];

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const writeJson = (path, value) =>
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
const template = (name) => readFileSync(join(TEMPLATES, name), "utf8");

function updatePackageJson(root, done) {
  const path = join(root, "package.json");
  if (!existsSync(path)) return;
  const pkg = readJson(path);
  const scripts = { ...(pkg.scripts ?? {}) };
  const changes = [];
  for (const [name, command] of [
    ["agents:init", INIT],
    ["agents:check", CHECK],
  ])
    if (scripts[name] !== command) {
      scripts[name] = command;
      changes.push(name);
    }
  if (changes.length === 0) return;
  writeJson(path, { ...pkg, scripts });
  done.push(`package.json: ${changes.join(", ")}`);
}

function ensurePrettierIgnore(root, done) {
  const path = join(root, ".prettierignore");
  const text = existsSync(path) ? readFileSync(path, "utf8") : "";
  const missing = PRETTIER_LINES.filter(
    (line) => !text.split("\n").includes(line),
  );
  if (missing.length === 0) return;
  const prefix = text && !text.endsWith("\n") ? "\n" : "";
  writeFileSync(
    path,
    `${text}${prefix}\n# @turbo-project/agent-rules\n${missing.join("\n")}\n`,
  );
  done.push(".prettierignore에 AGENTS.md와 공통 규칙 폴더를 더했습니다.");
}

const OTHER_BLOCK = /<!-- BEGIN:([\w-]+) -->[\s\S]*?<!-- END:\1 -->/g;

function ensureAgents(root, done) {
  const path = join(root, AGENTS_FILE);
  const text = existsSync(path) ? readFileSync(path, "utf8") : "";
  if (text.replace(OTHER_BLOCK, "").trim()) return;
  const others = (text.match(OTHER_BLOCK) ?? []).filter(
    (block) => !block.startsWith(BEGIN),
  );
  writeFileSync(
    path,
    `${[template("AGENTS.md").trimEnd(), ...others].join("\n\n")}\n`,
  );
  done.push(`${AGENTS_FILE} 견본을 만들었습니다. 에이전트에게 빈칸을 채우게 하세요.`);
}

export function init(root) {
  const done = [];
  const todo = [];
  ensureAgents(root, done);
  updatePackageJson(root, done);
  ensurePrettierIgnore(root, done);

  const result = sync(root);
  todo.push(...result.errors);
  done.push(...result.written.map((path) => `${path}를 썼습니다.`));
  return { done, todo };
}

const staleCommon = (root, files) =>
  markdownIn(root, COMMON_OUT).filter((path) => !files.has(path));

export function sync(root) {
  const generated = generate(root);
  if (generated.agentsText && !blockOf(generated.agentsText))
    generated.agentsText = insertBlock(generated.agentsText, generated.block);
  const errors = validate(root, generated);
  if (errors.length > 0) return { errors, written: [] };
  const written = [];
  const write = (path, content) => {
    const target = join(root, path);
    if (existsSync(target) && readFileSync(target, "utf8") === content) return;
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content);
    written.push(path);
  };
  for (const [path, content] of generated.files) write(path, content);
  for (const path of staleCommon(root, generated.files)) {
    rmSync(join(root, path));
    written.push(`${path} (지움)`);
  }
  write(AGENTS_FILE, insertBlock(generated.agentsText, generated.block));
  return { errors, written };
}

export function check(root) {
  const generated = generate(root);
  const errors = validate(root, generated);
  if (errors.length > 0) return { errors };
  const fix = "`pnpm exec agent-rules init`을 돌리세요";
  if (blockOf(generated.agentsText) !== generated.block)
    errors.push(`${AGENTS_FILE}의 agent-rules 블록이 설치된 버전과 다릅니다. ${fix}.`);
  for (const [path, content] of generated.files) {
    const target = join(root, path);
    if (!existsSync(target) || readFileSync(target, "utf8") !== content)
      errors.push(`${path}가 설치된 버전과 다릅니다. ${fix}.`);
  }
  for (const path of staleCommon(root, generated.files))
    errors.push(`${path}는 설치된 버전에 없는 파일입니다. ${fix}.`);
  return { errors };
}
