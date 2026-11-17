#!/usr/bin/env bash
# 릴리스 가드 회귀 테스트 — `changeset-grade.sh` 와 `snapshot-versions.sh`.
#
# **이 검사가 막는 것은 「검사가 다른 것을 재는 것」이다.** 릴리스 가드가
# `git diff --quiet` 로 「범프가 일어났나」를 재던 시절, 빈 changeset 이 소진되면
# 삭제가 곧 변경이므로 가드를 통과해 **거짓 범프 커밋**이 남았다(실측 `c42a780` —
# 메시지는 「버전 범프 및 CHANGELOG 갱신」인데 버전·CHANGELOG 변경 0건).
#
# 그래서 여기서 고정하는 것은 **등급 유무의 판정**이고, 실제 파일을 만들어 먹인다 —
# 형태를 손으로 짜지 않으면 「우리 저장소에 그 형태가 없어서 통과」가 된다.
#
# [의도] / [고정] 표시는 다른 스위트와 같은 뜻이다.

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$HERE/lib.sh"
SUITE="release-guard"

SCRIPT="${CHANGESET_GRADE_SCRIPT:-$HERE/../changeset-grade.sh}"

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

# grade <디렉터리> — count/graded 만 뽑는다(stderr 목록은 버린다)
grade() { bash "$SCRIPT" "$1" 2>/dev/null; }
val() { printf '%s\n' "$1" | grep "^$2=" | cut -d= -f2; }

mk() { # mk <디렉터리> <파일명> <본문>
  mkdir -p "$1"
  printf '%s' "$3" >"$1/$2"
}

FM_EMPTY='---
---

무릴리스다.
'
FM_GRADED="---
'@turbo-project/afds': patch
---

패치다.
"

# ── ① changeset 이 없다 → 아무것도 기대하지 않는다 ─────────────────────────────
D="$WORK/none"; mkdir -p "$D"
OUT="$(grade "$D")"
assert_eq "changeset 0건 — count" "0" "$(val "$OUT" count)"
assert_eq "changeset 0건 — graded" "0" "$(val "$OUT" graded)"

# ── ② 빈 것만 있다 → count 는 세고 graded 는 0 ★ 이번 사고의 경우 ─────────────
D="$WORK/empty"; mk "$D" a.md "$FM_EMPTY"; mk "$D" b.md "$FM_EMPTY"
OUT="$(grade "$D")"
assert_eq "★ 빈 것만 2건 — count 는 2" "2" "$(val "$OUT" count)"
assert_eq "★ 빈 것만 2건 — graded 는 0 (범프를 기대하지 않는다)" "0" "$(val "$OUT" graded)"

# ── ③ 등급 있는 것 → graded 로 센다 ──────────────────────────────────────────
D="$WORK/graded"; mk "$D" a.md "$FM_GRADED"
OUT="$(grade "$D")"
assert_eq "등급 있는 것 1건 — count" "1" "$(val "$OUT" count)"
assert_eq "등급 있는 것 1건 — graded" "1" "$(val "$OUT" graded)"

# ── ④ 섞여 있다 → 등급 있는 것만 graded ──────────────────────────────────────
D="$WORK/mixed"; mk "$D" a.md "$FM_EMPTY"; mk "$D" b.md "$FM_GRADED"; mk "$D" c.md "$FM_EMPTY"
OUT="$(grade "$D")"
assert_eq "섞임 3건 — count" "3" "$(val "$OUT" count)"
assert_eq "섞임 3건 — graded 는 1" "1" "$(val "$OUT" graded)"

# ── ⑤ README.md 는 세지 않는다 ───────────────────────────────────────────────
D="$WORK/readme"; mk "$D" README.md "설명 문서다."; mk "$D" a.md "$FM_GRADED"
OUT="$(grade "$D")"
assert_eq "[고정] README.md 는 대기 changeset 이 아니다" "1" "$(val "$OUT" count)"

# ── ⑥ 판정 불가는 등급으로 센다 (fail-closed) ────────────────────────────────
# frontmatter 가 닫히지 않았거나 아예 없으면 **범프를 기대하는 쪽**으로 넘어진다.
# 그러면 안 올랐을 때 릴리스가 큰 소리로 실패한다 — 조용한 거짓 커밋보다 낫다.
D="$WORK/malformed"; mk "$D" a.md '---
닫히지 않았다
'
OUT="$(grade "$D")"
assert_eq "[의도] frontmatter 가 닫히지 않으면 등급으로 센다" "1" "$(val "$OUT" graded)"

D="$WORK/nofm"; mk "$D" a.md '본문만 있고 frontmatter 가 없다.
'
OUT="$(grade "$D")"
assert_eq "[의도] frontmatter 가 아예 없으면 등급으로 센다" "1" "$(val "$OUT" graded)"

# ── ⑦ 공백만 있는 frontmatter 는 빈 것이다 ───────────────────────────────────
D="$WORK/ws"; mk "$D" a.md '---

---

무릴리스다.
'
OUT="$(grade "$D")"
assert_eq "공백 줄만 있는 frontmatter 는 무릴리스다" "0" "$(val "$OUT" graded)"

# ── ⑧ 여러 패키지 선언도 등급 하나로 센다 (파일 단위다) ──────────────────────
D="$WORK/multi"; mk "$D" a.md "---
'@turbo-project/afds': patch
'@turbo-project/afds-registry': minor
---

둘이다.
"
OUT="$(grade "$D")"
assert_eq "파일 단위로 센다 — 패키지 2개 선언도 graded 1" "1" "$(val "$OUT" graded)"

# ── ⑨ 대조군 — 이 검사가 실제로 갈라내는가 ───────────────────────────────────
# 같은 개수인데 등급만 다른 두 디렉터리가 **다른 값**을 내야 한다. 같으면 판정이 죽었다.
E="$(val "$(grade "$WORK/empty")" graded)"
G="$(val "$(grade "$WORK/graded")" graded)"
if [ "$E" != "$G" ]; then
  ok "대조군 — 등급 유무가 실제로 갈린다 (빈 것 ${E} ≠ 등급 ${G})"
else
  ng "대조군 — 등급 유무가 갈리지 않는다" "둘 다 [$E] 다. 판정이 죽었다."
fi

# ── ⑩ GITHUB_OUTPUT 에도 쓴다 ────────────────────────────────────────────────
OUTFILE="$WORK/gh-output"
: >"$OUTFILE"
GITHUB_OUTPUT="$OUTFILE" bash "$SCRIPT" "$WORK/mixed" >/dev/null 2>&1
assert_contains "GITHUB_OUTPUT 에 count 를 쓴다" "$(cat "$OUTFILE")" "count=3"
assert_contains "GITHUB_OUTPUT 에 graded 를 쓴다" "$(cat "$OUTFILE")" "graded=1"

# ══════════════════════════════════════════════════════════════════════════════
#  snapshot-versions.sh — 「범프가 일어났나」의 분모
# ══════════════════════════════════════════════════════════════════════════════
#
# 초판이 `find packages apps -maxdepth 2` 였고 그 범위가 **`packages/config/*` 를 놓쳤다**
# (정본 8건 중 5건). 지켜야 하는 성질은 **changesets 가 올릴 수 있는 패키지를 하나도
# 빠뜨리지 않는 것**(상위집합)이고, 깊이로 범위를 정하면 그것이 우연히 성립한다.

SNAP="${SNAPSHOT_VERSIONS_SCRIPT:-$HERE/../snapshot-versions.sh}"

mkws() { # mkws <루트> <워크스페이스 패턴 블록>
  # `%b` 로 낸다 — 이중 인용 문자열의 `\n` 은 셸이 해석하지 않으므로 `%s` 로 내면
  # **리터럴 백슬래시-n 이 파일에 들어가** 패턴이 한 줄도 읽히지 않는다(실측: 0건).
  mkdir -p "$1"
  printf 'packages:\n%b' "$2" >"$1/pnpm-workspace.yaml"
}
mkpkg() { # mkpkg <디렉터리> <이름> <버전>
  mkdir -p "$1"
  printf '{\n  "name": "%s",\n  "version": "%s"\n}\n' "$2" "$3" >"$1/package.json"
}

# ── ⑪ ★ 중첩 패키지를 잡는다 (초판이 놓친 그 형태) ───────────────────────────
W="$WORK/ws-nested"
mkws "$W" "  - 'packages/*'\n  - 'packages/config/*'\n"
mkpkg "$W/packages/afds" "@x/afds" "1.1.1"
mkpkg "$W/packages/config/eslint-config" "@x/eslint" "1.0.0"
mkpkg "$W/packages/config/tsconfig" "@x/tsconfig" "2.0.0"
OUT="$(bash "$SNAP" "$W" 2>/dev/null)"
assert_eq "★ 중첩 패키지까지 잡는다 — 3건" "3" "$(printf '%s\n' "$OUT" | grep -c .)"
assert_contains "★ packages/config/* 가 목록에 있다" "$OUT" "packages/config/eslint-config"
assert_contains "중첩 패키지의 버전을 읽는다" "$OUT" "2.0.0"

# ── ⑫ 정본과 양방향 대조 — 글롭이 선언한 것과 스크립트가 낸 것이 같은가 ──────
# 이 저장소 실물로 잰다. 한쪽만 세면 「적게 센 목록」이 조용히 통과한다.
REPO_ROOT="$(cd "$HERE/../../.." && pwd)"
DECLARED="$(
  cd "$REPO_ROOT" || exit 1
  awk '
    /^packages:[[:space:]]*$/ { b=1; next }
    b && /^[^[:space:]-]/ { b=0 }
    b && /^[[:space:]]*-/ { l=$0; sub(/^[[:space:]]*-[[:space:]]*/,"",l); gsub(/['"'"'"]/,"",l); print l }
  ' pnpm-workspace.yaml | while IFS= read -r pat; do
    for d in $pat; do [ -f "$d/package.json" ] && echo "$d"; done
  done | sort
)"
ACTUAL="$(bash "$SNAP" "$REPO_ROOT" 2>/dev/null | cut -f1 | sort)"
assert_eq "[고정] 정본 글롭이 선언한 집합과 스크립트 출력이 같다" "$DECLARED" "$ACTUAL"
assert_eq "대조군 — 그 집합이 비어 있지 않다" "true" "$([ -n "$DECLARED" ] && echo true || echo false)"

# ── ⑬ 정렬해서 낸다 (순서로 오판하지 않게) ───────────────────────────────────
OUT="$(bash "$SNAP" "$W" 2>/dev/null | cut -f1)"
assert_eq "출력이 정렬돼 있다" "$(printf '%s\n' "$OUT" | sort)" "$OUT"

# ── ⑭ fail-closed — 다룰 수 없는 패턴이면 실패한다 ──────────────────────────
W2="$WORK/ws-neg"; mkws "$W2" "  - 'packages/*'\n  - '!packages/skip'\n"
mkpkg "$W2/packages/a" "@x/a" "1.0.0"
bash "$SNAP" "$W2" >/dev/null 2>&1
assert_eq "[의도] 제외(!) 패턴이면 실패한다 — 부분 목록을 조용히 내지 않는다" "1" "$?"

W3="$WORK/ws-glob"; mkws "$W3" "  - 'packages/**'\n"
mkpkg "$W3/packages/a" "@x/a" "1.0.0"
bash "$SNAP" "$W3" >/dev/null 2>&1
assert_eq "[의도] ** 패턴이면 실패한다" "1" "$?"

# ── ⑮ fail-closed — 정본이 없거나 패키지가 0건이면 실패한다 ─────────────────
W4="$WORK/ws-none"; mkdir -p "$W4"
bash "$SNAP" "$W4" >/dev/null 2>&1
assert_eq "[의도] pnpm-workspace.yaml 이 없으면 실패한다" "1" "$?"

W5="$WORK/ws-empty"; mkws "$W5" "  - 'packages/*'\n"
bash "$SNAP" "$W5" >/dev/null 2>&1
assert_eq "[의도] 패턴은 읽었는데 패키지가 0건이면 실패한다" "1" "$?"

# ── ⑯ 대조군 — 버전이 바뀌면 출력이 바뀐다 (판정의 근거다) ──────────────────
B="$(bash "$SNAP" "$W" 2>/dev/null)"
mkpkg "$W/packages/afds" "@x/afds" "1.1.2"
A="$(bash "$SNAP" "$W" 2>/dev/null)"
if [ "$B" != "$A" ]; then
  ok "대조군 — 버전이 오르면 스냅샷이 달라진다"
else
  ng "대조군 — 버전이 올라도 스냅샷이 같다" "가드가 범프를 볼 수 없다."
fi

# ── ⑰ ★ 상위집합 성질 — 두 선언의 포함관계로 정적 대조한다 ──────────────────
#
# 이 스크립트가 지켜야 하는 성질은 **changesets 가 올릴 수 있는 패키지를 하나도 빠뜨리지
# 않는 것**이다. 그런데 changesets 의 목록은 `@manypkg/get-packages` 가 만들고, 그것은
# `package.json` 에 `workspaces` 필드가 있으면 그것을 읽는다(실측: `tool: "yarn"`).
#
# **그래서 두 선언의 포함관계를 재면 그 성질과 등가다:**
#
#   workspaces 필드가 있다  → manypkg = package.json#workspaces → 포함관계가 곧 상위집합
#   workspaces 필드가 없다  → manypkg = pnpm-workspace.yaml     → 두 집합이 같다
#
# **`node_modules` 를 요구하지 않는다** — 이 스위트가 도는 잡은 의존성을 설치하지 않는다.
# (manypkg 를 직접 부르는 판을 먼저 썼고 그 잡에서 fail-closed 로 죽었다.)

WS_YAML="$REPO_ROOT/pnpm-workspace.yaml"
PKG_JSON="$REPO_ROOT/package.json"

# `pnpm-workspace.yaml` 의 글롭
YAML_GLOBS="$(sed -n '/^packages:/,/^[^[:space:]-]/p' "$WS_YAML" \
  | sed -n "s/^[[:space:]]*-[[:space:]]*['\"]\{0,1\}\([^'\"]*\)['\"]\{0,1\}[[:space:]]*$/\1/p" | sort)"
# `package.json#workspaces` 의 글롭 (jq·node 없이)
JSON_GLOBS="$(tr -d ' \n' <"$PKG_JSON" \
  | sed -n 's/.*"workspaces":\[\([^]]*\)\].*/\1/p' | tr ',' '\n' | tr -d '"' | sed '/^$/d' | sort)"

assert_eq "대조군 — pnpm-workspace.yaml 글롭을 읽었다" "true" \
  "$([ -n "$YAML_GLOBS" ] && echo true || echo false)"
assert_eq "대조군 — package.json#workspaces 글롭을 읽었다" "true" \
  "$([ -n "$JSON_GLOBS" ] && echo true || echo false)"

MISSING="$(comm -23 <(printf '%s\n' "$JSON_GLOBS") <(printf '%s\n' "$YAML_GLOBS"))"
assert_eq "★ package.json#workspaces 글롭이 pnpm-workspace.yaml 에 포함된다 (상위집합 등가)" \
  "" "$MISSING"

# 대조군 — 포함관계가 깨지면 잡는가. 합성 입력으로 같은 비교를 돌린다.
FAKE_JSON="$(printf 'apps/*\npackages/*\npackages/only-in-json/*\n' | sort)"
BROKEN="$(comm -23 <(printf '%s\n' "$FAKE_JSON") <(printf '%s\n' "$YAML_GLOBS"))"
assert_eq "[의도] pnpm 선언에 없는 글롭이 있으면 비교가 그것을 지목한다" \
  "packages/only-in-json/*" "$BROKEN"

finish 29
