#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";

import {
  CODEOWNERS_FILE,
  criteria,
  init,
} from "./src/governance.mjs";
import { installGitHook } from "./src/hooks.mjs";

const [command, ...args] = process.argv.slice(2);
const RISK_JUDGE = join(
  dirname(fileURLToPath(import.meta.url)),
  "scripts",
  "risk-judge.mjs",
);
const root = process.cwd();

const USAGE = `사용법: governance <명령> [인자]
  init          처음 한 번. CODEOWNERS(레포에서 찾은 기본 승인 경로. 터미널이면 오너를 묻고, 아니면 '# 확인 필요'),
                PR 템플릿, AGENTS.md의 governance 블록(PR 생성 명령)을 없을 때만 만들고,
                레포가 쓰는 훅 도구(husky, lefthook, simple-git-hooks)의 pre-push에 등급 판정을 넣습니다.
                훅 도구가 없으면 git 훅에 넣고 prepare에 \`governance hook\`을 더해 팀원 PC에도 깔리게 합니다
  hook          git pre-push 훅에 등급 판정을 넣습니다. 훅 도구가 없는 레포의 prepare에서 돕니다
  criteria      설치된 버전의 공통 기준을 출력합니다
  judge         이 브랜치의 열린 PR을 판정해 등급 라벨, 리뷰어, 본문 등급 블록을 고칩니다. pre-push 훅과 base를 바꾼 뒤에 돕니다
  judge --create <gh pr create 인자>
                판정한 뒤 등급 라벨, 리뷰어, 본문 등급 블록을 넣어 PR을 엽니다. 이미 열린 PR이 있으면 그 PR을 판정합니다`;

async function ask() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  let owners = [];
  while (owners.length === 0)
    owners = (await rl.question("? CODEOWNERS 오너(GitHub 아이디, 첫 사람이 메인 오너): "))
      .split(/[,\s]+/)
      .filter(Boolean);
  rl.close();
  return { owners };
}

if (command === "init") {
  const interactive =
    process.stdin.isTTY && !existsSync(join(root, CODEOWNERS_FILE));
  const { done, todo } = init(root, interactive ? await ask() : null);
  for (const line of done) console.log(`- ${line}`);
  if (todo.length > 0) console.log("\n남은 일:");
  for (const line of todo) console.log(`- ${line}`);
  process.exitCode = todo.length === 0 ? 0 : 1;
} else if (command === "hook") {
  const result = installGitHook(root);
  if (result.error) console.log(result.error);
} else if (command === "criteria") {
  console.log(criteria());
} else if (command === "judge") {
  const run = spawnSync(process.execPath, [RISK_JUDGE, ...args], {
    stdio: "inherit",
  });
  process.exitCode = run.status ?? 1;
} else {
  console.log(USAGE);
  process.exitCode = command ? 1 : 0;
}
