#!/usr/bin/env bash
# 대기 changeset 을 **등급 유무로 갈라 센다.**
#
# ## 왜 개수만으로는 안 되나
#
# `changeset add --empty` 로 만든 무릴리스 changeset 은 frontmatter 가 비어 있어
# **버전을 올리지 않는다.** 그런데 `changeset version` 은 그것도 **소진(삭제)** 하므로
# 작업 트리에는 변경이 생긴다. 그래서 `git diff --quiet` 로 「범프가 일어났나」를 재면
# **삭제를 범프로 읽는다.**
#
# 실측(`c42a780`): `main` 에 이런 커밋이 남았다.
#
#   chore(release): 버전 범프 및 CHANGELOG 갱신
#     .changeset/fullmode-doc-cleanup.md | 6 ------
#   → 버전 변경 0건 · CHANGELOG 변경 0건
#
# **커밋 메시지가 자기가 한 일을 잘못 말한다.** 빈 changeset 은 이 저장소의 일급 용법이므로
# (버전 규칙이 「무릴리스」 등급으로 규정한다) 없애는 방향으로 고칠 수 없다 —
# **가드가 등급을 구분해야 한다.**
#
# ## 출력
#
#   count=<대기 changeset 파일 수>      README.md 제외
#   graded=<그중 패키지를 선언한 수>     이것이 0 이면 범프를 기대하지 않는다
#
# `$GITHUB_OUTPUT` 이 설정돼 있으면 거기에도 쓴다. 사람이 읽을 목록은 stderr 로 낸다.
#
# ## 판정 불가는 등급 있음으로 센다 (fail-closed)
#
# frontmatter 를 못 읽으면 **범프를 기대하는 쪽**으로 넘어진다. 그러면 실제로 안 올랐을 때
# 릴리스가 **큰 소리로** 실패한다 — 조용히 거짓 커밋을 남기는 것보다 낫다.
set -uo pipefail

DIR="${1:-.changeset}"

# frontmatter 안에 공백 아닌 줄이 하나라도 있으면 등급이 있다.
# `exit` 는 END 로 점프하므로 상태를 한 곳에서만 출력한다 — 두 번 찍히지 않게.
grade_of() {
  awk '
    BEGIN { state = "malformed" }
    NR == 1 { if ($0 != "---") exit; next }
    /^---[[:space:]]*$/ { state = (found ? "graded" : "empty"); exit }
    /[^[:space:]]/ { found = 1 }
    END { print state }
  ' "$1"
}

COUNT=0
GRADED=0
while IFS= read -r f; do
  [ -n "$f" ] || continue
  COUNT=$((COUNT + 1))
  g="$(grade_of "$f")"
  case "$g" in
    graded) GRADED=$((GRADED + 1)); echo "  [등급] $f" >&2 ;;
    empty) echo "  [무릴리스] $f" >&2 ;;
    *) GRADED=$((GRADED + 1)); echo "  [판정불가 — 등급으로 센다] $f" >&2 ;;
  esac
done <<EOF
$(find "$DIR" -maxdepth 1 -name '*.md' ! -name 'README.md' -print 2>/dev/null | sort)
EOF

echo "count=${COUNT}"
echo "graded=${GRADED}"
if [ -n "${GITHUB_OUTPUT:-}" ]; then
  {
    echo "count=${COUNT}"
    echo "graded=${GRADED}"
  } >>"$GITHUB_OUTPUT"
fi
