#!/usr/bin/env node
import { spawnSync } from "node:child_process";

import { check, init, runArgs, strykerBin } from "./src/mutation.mjs";

const [command, ...args] = process.argv.slice(2);
const root = process.cwd();

const USAGE = `사용법: mutation <명령> [인자]
  init   처음 한 번. test:mutation 스크립트, .gitignore 항목, AGENTS.md의 mutation 블록을 없을 때만 넣습니다
  run    Stryker를 돌립니다. 레포에 stryker.config.mjs가 있으면 그 파일을, 없으면 패키지 base를 씁니다.
         인자는 stryker run에 그대로 넘깁니다 (예: --mutate 'src/shared/lib/format.ts')
  check  레포 설정이 base를 쓰는지, testRunner·plugins를 덮어쓰지 않는지, 스크립트가 맞는지 봅니다`;

if (command === "init") {
  const { done, todo } = init(root);
  for (const line of done) console.log(`- ${line}`);
  if (done.length === 0 && todo.length === 0) console.log("이미 적용돼 있습니다.");
  if (todo.length > 0) console.log("\n남은 일:");
  for (const line of todo) console.log(`- ${line}`);
  process.exitCode = todo.length === 0 ? 0 : 1;
} else if (command === "run") {
  const run = spawnSync(
    process.execPath,
    [strykerBin(), ...runArgs(root, args)],
    { stdio: "inherit" },
  );
  process.exitCode = run.status ?? 1;
} else if (command === "check") {
  const { errors } = check(root);
  for (const error of errors) console.log(`실패: ${error}`);
  if (errors.length === 0) console.log("뮤테이션 설정이 맞습니다.");
  process.exitCode = errors.length === 0 ? 0 : 1;
} else {
  console.log(USAGE);
  process.exitCode = command ? 1 : 0;
}
