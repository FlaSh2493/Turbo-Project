#!/usr/bin/env node
import { check, init } from "./src/commands.mjs";

const [command] = process.argv.slice(2);
const root = process.cwd();

const print = (lines, label = "") => {
  for (const line of lines) console.log(`${label}${line}`);
};

if (command === "init" || command === "sync") {
  const { done, todo } = init(root);
  print(done, "- ");
  if (todo.length > 0) console.log("\n남은 일:");
  print(todo, "- ");
  if (done.length === 0 && todo.length === 0) console.log("이미 최신입니다.");
  process.exitCode = todo.length === 0 ? 0 : 1;
} else if (command === "check") {
  const { errors } = check(root);
  print(errors, "실패: ");
  if (errors.length === 0) console.log("공통 규칙과 예외가 맞습니다.");
  process.exitCode = errors.length === 0 ? 0 : 1;
} else {
  console.log(`사용법: agent-rules <init|check>
  init   처음 적용할 때와 버전을 올린 뒤 돌립니다. 없는 견본·스크립트를 만들고, AGENTS.md 블록과 .agents/rules/common/을 설치된 버전으로 다시 씁니다. 레포가 쓴 곳은 바꾸지 않습니다
  check  공통 규칙 사본과 AGENTS.md 블록·예외를 검사합니다`);
  process.exitCode = command ? 1 : 0;
}
