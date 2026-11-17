#!/usr/bin/env bash
# main 직접 push 차단 가드(`block-main-push.sh`) 회귀 테스트.
#
# 실제 push 없이 git 이 pre-push 훅 stdin 으로 주는 줄 형태를 그대로 흘려 넣는다.
# 판정만 고정한다(종료코드) — 안내 문구는 바꿔도 이 스위트가 깨지지 않게 한 단정만 문구를 본다.

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$HERE/lib.sh"
SUITE="pre-push-guard"

SCRIPT="$HERE/../block-main-push.sh"
Z=0000000000000000000000000000000000000000
A=1111111111111111111111111111111111111111
B=2222222222222222222222222222222222222222

# run <stdin> — 종료코드를 출력한다
run() { printf '%s' "$1" | sh "$SCRIPT" >/dev/null 2>&1; echo $?; }

assert_eq "main 대상 push 는 막는다" "1" "$(run "refs/heads/feat $A refs/heads/main $B
")"
assert_eq "다른 브랜치 대상 push 는 통과한다" "0" "$(run "refs/heads/feat $A refs/heads/feat $B
")"
assert_eq "main 삭제 push 도 막는다" "1" "$(run "(delete) $Z refs/heads/main $B
")"
assert_eq "빈 stdin(보낼 ref 없음)은 통과한다" "0" "$(run "")"
assert_eq "여러 줄 중 하나만 main 이어도 막는다" "1" "$(run "refs/heads/a $A refs/heads/a $Z
refs/heads/b $A refs/heads/main $B
refs/tags/v1 $A refs/tags/v1 $Z
")"
assert_eq "[고정] 이름에 main 이 든 다른 브랜치는 통과한다" "0" "$(run "refs/heads/x $A refs/heads/main-fix $B
")"
assert_contains "안내가 PR 경로를 알려준다" \
  "$(printf 'refs/heads/feat %s refs/heads/main %s\n' "$A" "$B" | sh "$SCRIPT" 2>&1)" "PR"

# 배선 — lefthook.yml 의 pre-push 가 스크립트를 `use_stdin: true` 로 부르고, 스크립트가 가드를
# changeset 검사보다 먼저 부르는가. 가드 파일만 있고 훅에서 빠지거나 `use_stdin` 이 빠지면 위 단정은
# 전부 통과하면서 아무것도 막지 않는다(use_stdin 없이는 가드가 빈 입력을 받아 main 대상 push 도 통과한다).
# `run:` 이 아니라 `script:` 여야 한다 — `run:` 잡은 push 할 파일이 없으면 lefthook 이 건너뛴다(아래 행동 단정).
ROOT="$HERE/../../.."
PRE_PUSH="$(sed -n '/^pre-push:/,$p' "$ROOT/lefthook.yml")"
HOOK_SH="$ROOT/.lefthook/pre-push/pre-push.sh"
GUARD_LINE="$(grep -n 'block-main-push.sh' "$HOOK_SH" | head -1 | cut -d: -f1)"
CHANGESET_LINE="$(grep -n 'check-changeset.sh' "$HOOK_SH" | head -1 | cut -d: -f1)"
assert_eq "배선 — pre-push 스크립트가 가드를 changeset 검사보다 먼저 부른다" "true" \
  "$([ -n "$GUARD_LINE" ] && [ -n "$CHANGESET_LINE" ] && [ "$GUARD_LINE" -lt "$CHANGESET_LINE" ] && echo true || echo false)"
assert_eq "배선 — pre-push 잡이 use_stdin: true 로 push ref 를 받는다" "true" \
  "$(printf '%s\n' "$PRE_PUSH" | grep -q 'use_stdin: true' && echo true || echo false)"
assert_eq "배선 — pre-push 잡이 script: 로 스크립트를 부른다(run: 은 건너뛰어진다)" "true" \
  "$(printf '%s\n' "$PRE_PUSH" | grep -q 'script: pre-push.sh' && echo true || echo false)"

# 행동 — 실제 lefthook 으로 main 대상 stdin 을 흘려 훅이 막는지. yml 텍스트만 보면 lefthook 의
# 런타임 skip(「no matching push files」)을 못 잡는다. 임시 저장소에 가드·yml·스크립트만 복사한다
# (스크립트의 첫 단계가 막으므로 뒤 단계는 돌지 않는다).
LEFTHOOK_BIN="$ROOT/node_modules/.bin/lefthook"
if [ -x "$LEFTHOOK_BIN" ]; then
  T="$(mktemp -d)"
  git init -q --bare "$T/o.git"
  git clone -q "$T/o.git" "$T/w" 2>/dev/null
  mkdir -p "$T/w/.github/scripts" "$T/w/.lefthook/pre-push"
  cp "$SCRIPT" "$T/w/.github/scripts/"
  cp "$ROOT/lefthook.yml" "$T/w/"
  cp "$HOOK_SH" "$T/w/.lefthook/pre-push/"
  (
    cd "$T/w" || exit 1
    git config user.email t@t && git config user.name t
    git checkout -qb feat && echo 1 >f && git add -A && git commit -qm c
    SHA="$(git rev-parse HEAD)"
    MAIN_IN="refs/heads/feat $SHA refs/heads/main $B
"
    # 출력도 캡처한다 — rc 만 보면 가드가 안 돌아도 뒤 단계(check-changeset 등)가 실패해 rc=1 이 나와 거짓 통과한다.
    hook() { printf '%s' "$MAIN_IN" | "$LEFTHOOK_BIN" run pre-push --no-auto-install >"$T/out.$1" 2>&1; echo $?; }
    # 사례 3 — upstream 없음
    echo "no-upstream $(hook no-upstream)" >"$T/rc"
    git push -q -u origin feat 2>/dev/null
    # 사례 1 — 이미 push 한 브랜치(HEAD == @{push}): `run:` 잡이었다면 전부 건너뛰고 rc=0
    echo "pushed $(hook pushed)" >>"$T/rc"
    # 사례 2 — 원격보다 앞선 브랜치
    echo 2 >g && git add -A && git commit -qm c2
    echo "ahead $(hook ahead)" >>"$T/rc"
  )
  assert_eq "행동 — upstream 없는 브랜치 → main 은 훅이 막는다" "1" "$(grep '^no-upstream' "$T/rc" | cut -d' ' -f2)"
  assert_contains "행동 — upstream 없는 브랜치 → main: 출력에 가드의 차단 문구가 있다" "$(cat "$T/out.no-upstream")" "main 브랜치에 직접 push"
  assert_eq "행동 — 이미 push 한 브랜치(HEAD==@{push}) → main 도 훅이 막는다(run: 이면 건너뛰어 0)" "1" "$(grep '^pushed' "$T/rc" | cut -d' ' -f2)"
  assert_contains "행동 — 이미 push 한 브랜치(HEAD==@{push}) → main: 출력에 가드의 차단 문구가 있다" "$(cat "$T/out.pushed")" "main 브랜치에 직접 push"
  assert_eq "행동 — 원격보다 앞선 브랜치 → main 은 훅이 막는다" "1" "$(grep '^ahead' "$T/rc" | cut -d' ' -f2)"
  assert_contains "행동 — 원격보다 앞선 브랜치 → main: 출력에 가드의 차단 문구가 있다" "$(cat "$T/out.ahead")" "main 브랜치에 직접 push"
  rm -rf "$T"
  BEHAVE=6
else
  # CI 의 scripts-test 잡은 pnpm install 을 하지 않아 lefthook 바이너리가 없다 — 로컬(설치된 곳)에서만 돈다.
  echo "  - 행동 단정 6건 건너뜀 — node_modules/.bin/lefthook 없음 (pnpm install 후 로컬에서 돈다)"
  BEHAVE=0
fi

finish $((10 + BEHAVE))
