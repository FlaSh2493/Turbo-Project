import { execFileSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { isAbsolute, join } from "node:path";

import { parseDocument } from "yaml";

export const HOOK_COMMAND = "pnpm exec governance judge || true";
export const INSTALL_SCRIPT = "governance hook || true";
const MARK = "governance judge";
const LEFTHOOK_FILES = [
  "lefthook.yml",
  "lefthook.yaml",
  ".lefthook.yml",
  ".lefthook.yaml",
];

const readOrNull = (path) =>
  existsSync(path) ? readFileSync(path, "utf8") : null;

const readPkg = (root) => {
  const text = readOrNull(join(root, "package.json"));
  return text === null ? null : JSON.parse(text);
};

const writePkg = (root, pkg) =>
  writeFileSync(join(root, "package.json"), `${JSON.stringify(pkg, null, 2)}\n`);

function appendLine(path, line) {
  const lines = (readOrNull(path) ?? "").split("\n");
  while (lines.at(-1) === "") lines.pop();
  if (lines.some((each) => each.includes(MARK))) return false;
  if (lines.length === 0) lines.push("#!/bin/sh");
  lines.push(line);
  writeFileSync(path, `${lines.join("\n")}\n`);
  chmodSync(path, 0o755);
  return true;
}

const husky = {
  name: "husky",
  detect: (root) => existsSync(join(root, ".husky")),
  install(root) {
    const path = join(root, ".husky/pre-push");
    return appendLine(path, HOOK_COMMAND) ? ".husky/pre-push" : null;
  },
};

const lefthook = {
  name: "lefthook",
  detect: (root) => LEFTHOOK_FILES.some((file) => existsSync(join(root, file))),
  install(root) {
    const file = LEFTHOOK_FILES.find((each) => existsSync(join(root, each)));
    const text = readFileSync(join(root, file), "utf8");
    if (text.includes(MARK)) return null;
    const doc = parseDocument(text);
    doc.setIn(["pre-push", "commands", "governance-judge", "run"], HOOK_COMMAND);
    writeFileSync(join(root, file), doc.toString());
    return file;
  },
};

const simpleGitHooks = {
  name: "simple-git-hooks",
  detect: (root) => Boolean(readPkg(root)?.["simple-git-hooks"]),
  install(root) {
    const pkg = readPkg(root);
    const hooks = pkg["simple-git-hooks"];
    const current = hooks["pre-push"];
    if (current?.includes(MARK)) return null;
    hooks["pre-push"] = current ? `${current} && (${HOOK_COMMAND})` : HOOK_COMMAND;
    writePkg(root, pkg);
    return "package.json의 simple-git-hooks";
  },
};

export const HOOK_TOOLS = [husky, lefthook, simpleGitHooks];

export function gitHooksDir(root) {
  const dir = execFileSync("git", ["rev-parse", "--git-path", "hooks"], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
  return isAbsolute(dir) ? dir : join(root, dir);
}

export function installGitHook(root) {
  let dir;
  try {
    dir = gitHooksDir(root);
  } catch {
    return { error: "git 레포가 아니라 pre-push 훅을 설치하지 못했습니다." };
  }
  mkdirSync(dir, { recursive: true });
  return { installed: appendLine(join(dir, "pre-push"), HOOK_COMMAND) };
}

function addPrepare(root) {
  const pkg = readPkg(root);
  if (!pkg) return false;
  const scripts = { ...(pkg.scripts ?? {}) };
  if (String(scripts.prepare ?? "").includes("governance hook")) return false;
  scripts.prepare = scripts.prepare
    ? `${scripts.prepare} && (${INSTALL_SCRIPT})`
    : INSTALL_SCRIPT;
  pkg.scripts = scripts;
  writePkg(root, pkg);
  return true;
}

export function addPrePushHook(root) {
  const tool = HOOK_TOOLS.find((each) => each.detect(root));
  if (tool) {
    const where = tool.install(root);
    return where
      ? { done: `${tool.name}의 pre-push 훅(${where})에 등급 판정을 넣었습니다.` }
      : {};
  }
  const result = installGitHook(root);
  if (result.error) return { todo: `${result.error} git 레포에서 \`pnpm exec governance hook\`을 돌리세요.` };
  const prepare = addPrepare(root);
  if (!result.installed && !prepare) return {};
  return {
    done: `훅 도구가 없어 git pre-push 훅에 등급 판정을 넣었습니다.${prepare ? ` 팀원 PC에도 깔리도록 package.json prepare에 \`${INSTALL_SCRIPT}\`을 더했습니다.` : ""}`,
  };
}
