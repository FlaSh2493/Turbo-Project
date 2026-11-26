#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { criteria, init } from "./src/governance.mjs";
import { installGitHook } from "./src/hooks.mjs";

const [command, ...args] = process.argv.slice(2);
const SCRIPTS = join(dirname(fileURLToPath(import.meta.url)), "scripts");
const root = process.cwd();

const USAGE = `사용법: governance <명령> [인자]
  init          처음 한 번. PR 템플릿을 없을 때만 만들고, AGENTS.md의 governance 블록을 넣고,
                레포가 쓰는 훅 도구(husky, lefthook, simple-git-hooks)의 pre-push에 판정을 넣습니다.
                훅 도구가 없으면 git 훅에 넣고 prepare에 \`governance hook\`을 더해 팀원 PC에도 깔리게 합니다
  hook          git pre-push 훅에 판정을 넣습니다. 훅 도구가 없는 레포의 prepare에서 돕니다
  criteria      설치된 버전의 머지 기준을 출력합니다
  judge         이 브랜치의 열린 PR을 판정해 본문의 판정 결과 한 줄과 \`## 검증\`을 고칩니다. pre-push 훅과 base를 바꾼 뒤에 돕니다
  judge --create <gh pr create 인자>
                판정한 뒤 \`## 검증\`을 넣어 PR을 엽니다. 이미 열린 PR이 있으면 그 PR을 판정합니다
  gate          머지 게이트. CI에서 돌고 Claude를 쓰지 않습니다. \`## 검증\`이 지금 커밋에서 통과했는지,
                검사를 건너뛰지 않았는지 봅니다`;

const runScript = (name) =>
  spawnSync(process.execPath, [join(SCRIPTS, name), ...args], {
    stdio: "inherit",
  }).status ?? 1;

if (command === "init") {
  const { done, todo } = init(root);
  for (const line of done) console.log(`- ${line}`);
  if (done.length === 0 && todo.length === 0) console.log("이미 적용돼 있습니다.");
  if (todo.length > 0) console.log("\n남은 일:");
  for (const line of todo) console.log(`- ${line}`);
  process.exitCode = todo.length === 0 ? 0 : 1;
} else if (command === "hook") {
  const result = installGitHook(root);
  if (result.error) console.log(result.error);
} else if (command === "criteria") {
  console.log(criteria());
} else if (command === "judge") {
  process.exitCode = runScript("judge.mjs");
} else if (command === "gate") {
  process.exitCode = runScript("gate.mjs");
} else {
  console.log(USAGE);
  process.exitCode = command ? 1 : 0;
}
