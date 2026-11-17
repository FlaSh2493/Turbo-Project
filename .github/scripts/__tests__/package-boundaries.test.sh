#!/usr/bin/env bash
# check-package-boundaries.mjs 회귀 테스트.
#
# 현재 트리가 0건이라는 것만으로는 검사가 아무것도 안 본 것과 구분되지 않는다.
# 그래서 임시 워크스페이스에 위반을 심어 각각 exit 1 이 나는지 본다.

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$HERE/lib.sh"
SUITE="package-boundaries"

CHECK="$HERE/../check-package-boundaries.mjs"
ROOT="$(cd "$HERE/../../.." && pwd)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

# mk <dir> — a, b 두 패키지가 있고 b 가 a 에 의존하지 않는 정상 워크스페이스
mk() {
  mkdir -p "$1/packages/a/src" "$1/packages/b/src"
  printf '{"name":"pkg-a"}\n' > "$1/packages/a/package.json"
  printf '{"name":"pkg-b"}\n' > "$1/packages/b/package.json"
  printf "import { x } from './y'\nexport const z = x\n" > "$1/packages/a/src/i.ts"
  printf 'export const x = 1\n' > "$1/packages/a/src/y.ts"
  printf 'export const b = 1\n' > "$1/packages/b/src/i.ts"
}

out="$(node "$CHECK" 2>&1)"; rc=$?
assert_eq "현재 트리는 위반 0건이다" "0" "$rc"
assert_contains "현재 트리에서 소스를 실제로 읽었다" "$out" "위반 0건"

mk "$WORK/ok"
node "$CHECK" "$WORK/ok" >/dev/null 2>&1
assert_eq "대조군 — 정상 픽스처는 통과한다" "0" "$?"

mk "$WORK/rel"
printf "import { b } from '../../b/src/i'\nexport const q = b\n" > "$WORK/rel/packages/a/src/bad.ts"
out="$(node "$CHECK" "$WORK/rel" 2>&1)"; rc=$?
assert_eq "[의도] 다른 패키지로 넘어가는 상대경로 import 는 실패한다" "1" "$rc"
assert_contains "R1 error 주석이 파일을 가리킨다" "$out" "::error file=packages/a/src/bad.ts::R1"

mk "$WORK/dyn"
printf "export const q = () => import('../../b/src/i')\n" > "$WORK/dyn/packages/a/src/dyn.ts"
node "$CHECK" "$WORK/dyn" >/dev/null 2>&1
assert_eq "[의도] 동적 import() 도 실패한다" "1" "$?"

mk "$WORK/bt"
printf "export const q = () => import(\`../../b/src/i\`)\n" > "$WORK/bt/packages/a/src/bt.ts"
node "$CHECK" "$WORK/bt" >/dev/null 2>&1
assert_eq "[의도] 백틱 동적 import() 도 실패한다" "1" "$?"

mk "$WORK/tpl"
printf "export const s = \`import { b } from '../../b/src/i'\`\n" > "$WORK/tpl/packages/a/src/tpl.ts"
node "$CHECK" "$WORK/tpl" >/dev/null 2>&1
assert_eq "[고정] 템플릿 문자열 안의 import 는 코드가 아니다" "0" "$?"

mk "$WORK/edge"
printf '{"name":"pkg-a","dependencies":{"pkg-b":"workspace:*"}}\n' > "$WORK/edge/packages/a/package.json"
out="$(node "$CHECK" "$WORK/edge" 2>&1)"; rc=$?
assert_eq "[의도] 허용 밖 패키지 간선은 실패한다" "1" "$rc"
assert_contains "R3 error 주석이 package.json 을 가리킨다" "$out" "::error file=packages/a/package.json::R3"

mkdir -p "$WORK/empty/packages"
node "$CHECK" "$WORK/empty" >/dev/null 2>&1
assert_eq "[의도] 소스를 하나도 못 읽으면 실패한다(조용한 통과 방지)" "1" "$?"

finish 11
