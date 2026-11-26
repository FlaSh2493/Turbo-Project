#!/usr/bin/env node
import { spawnSync } from "node:child_process";

import {
  changedTargets,
  clearHead,
  clearReport,
  headSha,
  isClean,
  mutateMatcher,
  mutatePatterns,
  readHead,
  resolveCommit,
  readReport,
  resolveBase,
  survivorLine,
  survivors,
  writeEmptyReport,
  writeHead,
} from "./src/changed.mjs";
import { check, init, runArgs, strykerBin } from "./src/mutation.mjs";

const [command, ...args] = process.argv.slice(2);
const root = process.cwd();

const USAGE = `사용법: mutation <명령> [인자]
  init       처음 한 번. test:mutation 스크립트, .gitignore 항목, AGENTS.md의 mutation 블록을 넣습니다
  run        Stryker를 돌립니다. 레포에 stryker.config.mjs가 있으면 그 파일을, 없으면 패키지 base를 씁니다.
             인자는 stryker run에 그대로 넘깁니다 (예: --mutate 'src/shared/lib/format.ts')
  run --changed [--base <ref>]
             base(기본 origin/develop, 없으면 origin/main)에서 바뀐 줄만 돌립니다.
             끝나면 돌린 커밋을 reports/mutation/head.json에 남깁니다
  survivors [--json]
             마지막 리포트에서 살아남은 변이를 보여 줍니다. 있으면 실패로 끝납니다
  check      레포 설정이 base를 쓰는지, testRunner·plugins를 덮어쓰지 않는지, 스크립트가 맞는지 봅니다`;

function option(name) {
  const index = args.indexOf(name);
  if (index < 0) return { value: undefined, rest: args };
  return {
    value: args[index + 1],
    rest: [...args.slice(0, index), ...args.slice(index + 2)],
  };
}

async function runChanged() {
  const { value, rest } = option("--base");
  const extra = rest.filter((arg) => arg !== "--changed");
  const base = resolveBase(root, value);
  if (!base) {
    console.error("base 브랜치를 찾지 못했습니다. --base <ref>로 지정하세요.");
    return 1;
  }
  clearHead(root);
  clearReport(root);
  // 대상 계산과 완료 기록에 같은 커밋을 쓴다. 도는 중에 HEAD가 바뀌면 기록하지 않는다.
  // base도 시작할 때 커밋 SHA로 고정해서 diff와 기록에 같이 쓴다.
  const sha = headSha(root);
  const baseSha = resolveCommit(root, base);
  if (!baseSha) {
    console.error(`base ${base}를 커밋으로 찾지 못했습니다. git fetch를 했는지 확인하세요.`);
    return 1;
  }
  const clean = isClean(root);
  if (!clean)
    console.log("커밋하지 않은 변경이 있어 이번 결과는 커밋 완료 기록(head.json)을 남기지 않습니다. 커밋한 뒤 다시 돌리면 남습니다.");
  const isTarget = mutateMatcher(await mutatePatterns(root));
  const targets = changedTargets(root, baseSha, sha, isTarget);
  const unchanged = () => headSha(root) === sha && (!clean || isClean(root));
  if (targets.length === 0) {
    console.log(`${base}에서 바뀐 뮤테이션 대상 줄이 없습니다.`);
    writeEmptyReport(root);
    if (!unchanged()) {
      console.error("도는 중에 커밋이나 작업 트리가 바뀌어 완료 기록을 남기지 않았습니다. 다시 돌리세요.");
      return 1;
    }
    if (clean) writeHead(root, sha, base, baseSha);
    return 0;
  }
  console.log(`${base}에서 바뀐 ${targets.length}개 범위만 돌립니다.`);
  const run = spawnSync(
    process.execPath,
    [strykerBin(), ...runArgs(root, [...extra, "--mutate", targets.join(",")])],
    { stdio: "inherit" },
  );
  if (run.status !== 0) return run.status ?? 1;
  if (!readReport(root)) {
    console.error("Stryker가 reports/mutation/mutation.json을 쓰지 않았습니다. 레포 설정의 reporters에 json을 두고 기본 경로를 쓰세요.");
    return 1;
  }
  if (!unchanged()) {
    console.error("도는 중에 커밋이나 작업 트리가 바뀌어 완료 기록을 남기지 않았습니다. 다시 돌리세요.");
    return 1;
  }
  if (clean) writeHead(root, sha, base, baseSha);
  return 0;
}

function showSurvivors() {
  const report = readReport(root);
  if (!report) {
    console.error("뮤테이션 리포트가 없습니다. `pnpm test:mutation --changed`를 먼저 돌리세요.");
    return 1;
  }
  const found = survivors(report);
  if (args.includes("--json")) {
    console.log(JSON.stringify({ head: readHead(root), survivors: found }, null, 2));
  } else if (found.length === 0) {
    console.log("살아남은 변이가 없습니다.");
  } else {
    console.log(`살아남은 변이 ${found.length}개 (파일:라인 | 변이 | 바뀐 코드)`);
    for (const each of found) console.log(`- ${survivorLine(each)}`);
  }
  return found.length === 0 ? 0 : 1;
}

if (command === "init") {
  const { done, todo } = init(root);
  for (const line of done) console.log(`- ${line}`);
  if (done.length === 0 && todo.length === 0) console.log("이미 적용돼 있습니다.");
  if (todo.length > 0) console.log("\n남은 일:");
  for (const line of todo) console.log(`- ${line}`);
  process.exitCode = todo.length === 0 ? 0 : 1;
} else if (command === "run" && args.includes("--changed")) {
  process.exitCode = await runChanged();
} else if (command === "run") {
  clearHead(root);
  clearReport(root);
  const run = spawnSync(process.execPath, [strykerBin(), ...runArgs(root, args)], {
    stdio: "inherit",
  });
  process.exitCode = run.status ?? 1;
} else if (command === "survivors") {
  process.exitCode = showSurvivors();
} else if (command === "check") {
  const { errors } = check(root);
  for (const error of errors) console.log(`실패: ${error}`);
  if (errors.length === 0) console.log("뮤테이션 설정이 맞습니다.");
  process.exitCode = errors.length === 0 ? 0 : 1;
} else {
  console.log(USAGE);
  process.exitCode = command ? 1 : 0;
}
