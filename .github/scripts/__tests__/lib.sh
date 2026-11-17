#!/usr/bin/env bash
# CI 스크립트 회귀 테스트의 공용 하네스.
#
# ## 왜 단언 수를 세는가
#
# "0 실패" 는 두 가지를 뜻할 수 있다 — 위반이 없었거나, **아무것도 안 봤거나.**
# 이 저장소가 반복해 밟은 것이 후자다(`cd &&` 단락으로 뒷명령이 안 돎, `$?` 가 파이프
# 마지막 명령의 것, zsh 의 인용 없는 변수가 단어 분리되지 않아 pathspec 이 아무것도
# 매치하지 않음, jq 파싱 실패를 "빠진 항목 없음" 으로 읽음). 전부 **초록으로 보였다.**
#
# 그래서 이 하네스는 실행한 단언 수를 세어 남기고, **0 이면 실패**한다.
# 각 스위트는 끝에 `finish <최소 기대 단언 수>` 를 부른다.

set -uo pipefail

PASS=0
FAIL=0
SUITE="${SUITE:-suite}"

# ok <설명> — 통과 기록
ok() { PASS=$((PASS + 1)); printf '  ✔ %s\n' "$1"; }

# ng <설명> [상세...] — 실패 기록
ng() {
  FAIL=$((FAIL + 1))
  printf '  ✘ %s\n' "$1"
  shift
  for line in "$@"; do printf '       %s\n' "$line"; done
}

# assert_eq <설명> <기대> <실제>
assert_eq() {
  if [ "$2" = "$3" ]; then ok "$1"; else ng "$1" "기대: [$2]" "실제: [$3]"; fi
}

# assert_contains <설명> <건초더미> <바늘>
assert_contains() {
  case "$2" in
    *"$3"*) ok "$1" ;;
    *) ng "$1" "다음 문구를 찾지 못했다: [$3]" "실제 출력:" "$(printf '%s' "$2" | head -20)" ;;
  esac
}

# assert_not_contains <설명> <건초더미> <바늘>
assert_not_contains() {
  case "$2" in
    *"$3"*) ng "$1" "있어서는 안 될 문구가 있다: [$3]" ;;
    *) ok "$1" ;;
  esac
}

# finish <최소 기대 단언 수> — 스위트 종료. 단언이 너무 적으면 그 자체가 실패다.
finish() {
  local min="${1:-1}" total=$((PASS + FAIL))
  printf '\n=== %s: 통과 %d / 실패 %d / 단언 %d건 ===\n' "$SUITE" "$PASS" "$FAIL" "$total"
  if [ "$total" -lt "$min" ]; then
    printf '::error title=%s 단언 부족::단언 %d건은 기대치 %d건보다 적다. 스위트가 도중에 죽었을 수 있다.\n' \
      "$SUITE" "$total" "$min"
    return 1
  fi
  [ "$FAIL" -eq 0 ]
}
