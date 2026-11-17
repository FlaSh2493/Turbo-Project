#!/usr/bin/env bash
# pnpm-run.sh 회귀 테스트.
#
# 헬퍼는 **새로 생긴 단일 지점**이다. 여기가 조용히 틀리면 그것을 쓰는 모든 스텝이
# 함께 틀린다. 그래서 실제 pnpm 워크스페이스를 임시로 만들어 돌린다.
#
# [의도] / [고정] 표시는 다른 스위트와 같은 뜻이다.

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$HERE/lib.sh"
SUITE="pnpm-run"

HELPER_SRC="${PNPM_RUN_SCRIPT:-$HERE/../pnpm-run.sh}"

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

# 헬퍼는 자기 위치에서 ROOT 를 유도한다(<root>/.github/scripts/pnpm-run.sh).
# 그래서 임시 워크스페이스 안에 같은 구조로 복사해 둔다.
mkdir -p "$WORK/.github/scripts" "$WORK/packages/ok" "$WORK/packages/empty" "$WORK/packages/noname"
cp "$HELPER_SRC" "$WORK/.github/scripts/pnpm-run.sh"
HELPER="$WORK/.github/scripts/pnpm-run.sh"

printf 'packages:\n  - "packages/*"\n' > "$WORK/pnpm-workspace.yaml"
printf '{"name":"tmp-root","private":true}\n' > "$WORK/package.json"
cat > "$WORK/packages/ok/package.json" <<'J'
{ "name": "@tmp/ok", "version": "0.0.0",
  "scripts": { "good": "exit 0", "boom": "exit 42", "blank": "" } }
J
printf '{"name":"@tmp/empty","version":"0.0.0"}\n' > "$WORK/packages/empty/package.json"
printf '{"version":"0.0.0","scripts":{"x":"exit 0"}}\n' > "$WORK/packages/noname/package.json"

# run <pkgDir> <script> — RC 를 이 셸에서 직접 잡는다(서브셸에 가두지 않는다)
OUT=""; RC=0
run() { OUT=$(bash "$HELPER" "$1" "$2" 2>&1); RC=$?; }

echo "[정상 경로]  [의도]"
run packages/ok good
assert_eq "존재하는 스크립트 → rc=0" "0" "$RC"
assert_contains "패키지 이름을 package.json 에서 읽는다" "$OUT" "@tmp/ok"

echo "[종료코드 전파 — 헬퍼가 삼키면 안 된다]  [의도]"
# 이것이 이 헬퍼의 존재 이유와 직결된다. 방금 고친 HIGH ① 이 정확히 "종료코드를
# 안 본다" 였으므로, 헬퍼가 같은 결함을 새로 만들지 않는지 실측한다.
run packages/ok boom
assert_eq "스크립트가 exit 42 → 헬퍼도 rc=42" "42" "$RC"

echo "[부재·불량 입력은 전부 실패]  [의도]"
run packages/ok nosuchscript
assert_eq "없는 스크립트 → rc=2" "2" "$RC"
assert_contains "없는 스크립트를 로그로 알린다" "$OUT" "스크립트 부재"
run packages/empty good
assert_eq "scripts 키 자체가 없다 → rc=2" "2" "$RC"
run packages/nowhere good
assert_eq "없는 패키지 디렉터리 → rc=2" "2" "$RC"
assert_contains "없는 디렉터리를 로그로 알린다" "$OUT" "패키지 없음"
run packages/noname x
assert_eq "package.json 에 name 이 없다 → rc=2" "2" "$RC"

echo "[★ 이름은 있는데 값이 빈 문자열]  [의도]"
# `"blank": ""` 는 **존재하지만 아무것도 실행하지 않는다.** 존재만 확인하는 가드는
# 이것을 통과시키므로 값이 비어 있지 않은지까지 본다.
run packages/ok blank
assert_eq "값이 빈 문자열 → rc=2" "2" "$RC"
assert_contains "빈 값도 '부재' 로 취급한다" "$OUT" "스크립트 부재"

echo "[인자 누락]  [고정]"
OUT=$(bash "$HELPER" 2>&1); RC=$?
assert_eq "인자 0개 → rc=2" "2" "$RC"
OUT=$(bash "$HELPER" packages/ok 2>&1); RC=$?
assert_eq "인자 1개 → rc=2" "2" "$RC"

echo "[깨진 매니페스트]  [의도]"
mkdir -p "$WORK/packages/broken"
printf '{ this is not json\n' > "$WORK/packages/broken/package.json"
run packages/broken good
assert_eq "파싱 불가 → rc=2 (fail-closed)" "2" "$RC"

finish 14
