#!/usr/bin/env bash
# 워크스페이스 패키지의 **버전만** 뽑아 한 덩이 문자열로 낸다.
#
# 릴리스 가드가 「범프가 일어났나」를 판정하는 데 쓴다. `git diff` 로는 그 질문에 답할 수
# 없다 — `changeset version` 이 무릴리스 changeset 을 **소진**하면 삭제가 곧 변경이므로
# 범프가 없어도 diff 가 생긴다(실측 `c42a780`).
#
# ## ★ 목록의 정본은 `pnpm-workspace.yaml` 이다 — `find` 깊이로 대신하지 마라
#
# 초판은 `find packages apps -maxdepth 2` 였다. 그 범위는 **`packages/config/*` 를 놓친다**
# (`packages` 기준 깊이 3 이다) — 정본이 선언한 8건 중 **5건만** 잡혔다.
#
# **다만 그것이 당장 오작동을 내지는 않았다.** 실측: changesets 가 쓰는
# `@manypkg/get-packages` 는 이 저장소에서 **5건만** 본다 — `packages/config/*` 를
# 워크스페이스로 인식하지 않는다. 그래서 그 패키지를 선언한 changeset 은
# `changeset status` 가 **「not in the workspace」로 거절**하고, PR 단계의
# `changeset-check` 가 먼저 실패한다. 즉 그 경우는 릴리스 가드에 도달하지 않는다.
#
# **그런데도 정본을 읽는 쪽이 맞다.** 이 스냅샷이 지켜야 하는 성질은 하나다 —
# **changesets 가 올릴 수 있는 패키지를 하나도 빠뜨리지 않는 것**(상위집합). 빠뜨리면
# 「올랐는데 안 올랐다고 판정」해서 릴리스를 막는다. 깊이로 범위를 정하면 그 성질이
# **우연히** 성립하고, 워크스페이스 glob 이나 manypkg 의 중첩 glob 지원이 바뀌면 조용히
# 깨진다. 정본을 읽으면 항상 상위집합이다. 남는 비용은 **changesets 가 모르는 패키지가
# BEFORE·AFTER 양쪽에 같은 상수로 들어가는 것**뿐이고 판정에 영향이 0 이다.
#
# ## 판정할 수 없으면 실패한다 (fail-closed)
#
# 다룰 수 없는 패턴(`!` 제외 · `**`)이나 패키지 0건은 **오류로 낸다.** 부분 목록을 조용히
# 내면 위 사고가 그대로 재발한다 — **적게 센 목록은 「범프 없음」과 구별되지 않는다.**
set -uo pipefail

ROOT="${1:-.}"
WS="$ROOT/pnpm-workspace.yaml"

if [ ! -f "$WS" ]; then
  echo "::error title=워크스페이스 정본 없음::$WS 를 읽을 수 없다 — 패키지 목록을 만들 수 없다." >&2
  exit 1
fi

# `packages:` 블록의 항목만 뽑는다. 인용부호는 걷는다.
PATTERNS="$(awk '
  /^packages:[[:space:]]*$/ { inblk = 1; next }
  inblk && /^[^[:space:]-]/ { inblk = 0 }
  inblk && /^[[:space:]]*-[[:space:]]*/ {
    line = $0
    sub(/^[[:space:]]*-[[:space:]]*/, "", line)
    gsub(/^['"'"'"]|['"'"'"][[:space:]]*$/, "", line)
    if (line != "") print line
  }
' "$WS")"

if [ -z "$PATTERNS" ]; then
  echo "::error title=워크스페이스 패턴 0건::$WS 의 packages: 목록을 읽지 못했다." >&2
  exit 1
fi

case "$PATTERNS" in
  *'!'* | *'**'*)
    echo "::error title=다룰 수 없는 워크스페이스 패턴::제외(!) 또는 ** 패턴이 있다. 이 스크립트를 함께 고쳐라." >&2
    printf '%s\n' "$PATTERNS" >&2
    exit 1
    ;;
esac

FOUND=0
OUT=""
while IFS= read -r pat; do
  [ -n "$pat" ] || continue
  for d in $ROOT/$pat; do
    [ -f "$d/package.json" ] || continue
    case "$d" in *node_modules*) continue ;; esac
    rel="${d#"$ROOT"/}"
    v="$(grep -m1 '"version"' "$d/package.json" | sed -e 's/.*"version"[[:space:]]*:[[:space:]]*"//' -e 's/".*//')"
    OUT="${OUT}${rel}	${v}
"
    FOUND=$((FOUND + 1))
  done
done <<EOF
$PATTERNS
EOF

if [ "$FOUND" -eq 0 ]; then
  echo "::error title=워크스페이스 패키지 0건::패턴은 읽었는데 패키지를 찾지 못했다 — 범프 판정을 할 수 없다." >&2
  exit 1
fi

# **정렬해서 낸다** — 글롭 순서는 로케일·파일시스템에 달려 있어, 정렬하지 않으면 전후 비교가
# 순서 때문에 어긋나 「올랐다」로 오판한다.
printf '%s' "$OUT" | sort
