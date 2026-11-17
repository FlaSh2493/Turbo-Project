#!/usr/bin/env bash
# 어떤 스크립트를 **가져야 하는 패키지 집합**을 이름으로 고정한다.
#
# ## 왜 존재 단정이 아니라 집합 고정인가
#
# 실행을 `pnpm -r --if-present <script>` 로 하면 스크립트가 없는 패키지를 **설계상** 조용히
# 건너뛴다. 패키지별 `pnpm-run.sh <패키지> <script>` 로 하면 반대로 그 스크립트를 가진 **새
# 패키지를 아무도 부르지 않는다.** 어느 쪽이든 존재 단정만으로는 막을 수 없다.
#
# 그래서 필요한 것은 **기대 집합의 고정**이다. 두 방향을 모두 잡는다.
#   - 목록에 있는데 스크립트가 없다  → 그 패키지의 테스트가 조용히 안 돈다
#   - 스크립트가 있는데 목록에 없다  → 새 패키지가 생겼는데 아무도 모른다
#
# **개수로 쓰지 않는다.** "3개면 통과" 는 하나가 빠지고 하나가 늘면 그대로 통과한다.
#
# ## 사용법
#
#   bash .github/scripts/assert-script-owners.sh test:run packages/afds packages/afds-registry
set -uo pipefail

SCRIPT="${1:-}"
shift || true
EXPECTED=("$@")

if [ -z "$SCRIPT" ] || [ "${#EXPECTED[@]}" -eq 0 ]; then
  echo "::error title=사용법 오류::사용법: assert-script-owners.sh <스크립트명> <패키지 디렉터리...>"
  exit 2
fi

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"

# 워크스페이스 전체에서 그 스크립트를 **실제로** 가진 패키지를 찾는다.
ACTUAL="$(SCRIPT="$SCRIPT" ROOT="$ROOT" node -e '
  const fs = require("fs"), path = require("path");
  const root = process.env.ROOT, want = process.env.SCRIPT;
  const dirs = [];
  const scan = (rel, depth) => {
    const abs = path.join(root, rel);
    let ents;
    try { ents = fs.readdirSync(abs, { withFileTypes: true }); } catch { return; }
    for (const e of ents) {
      if (!e.isDirectory() || e.name === "node_modules" || e.name.startsWith(".")) continue;
      const sub = path.join(rel, e.name);
      if (fs.existsSync(path.join(root, sub, "package.json"))) dirs.push(sub);
      if (depth > 0) scan(sub, depth - 1);
    }
  };
  scan("packages", 2); scan("apps", 1);
  const owners = dirs.filter((d) => {
    try {
      const m = JSON.parse(fs.readFileSync(path.join(root, d, "package.json"), "utf8"));
      const v = (m.scripts || {})[want];
      return typeof v === "string" && v.trim() !== "";
    } catch { return false; }
  });
  process.stdout.write(owners.sort().join("\n"));
')"
SCAN_RC=$?
if [ "$SCAN_RC" -ne 0 ]; then
  echo "::error title=워크스페이스 스캔 실패::패키지를 훑지 못했다 (rc=${SCAN_RC}) — fail-closed."
  exit 2
fi

# 양성 대조군: 하나도 못 찾았으면 스캔이 죽은 것이다.
if [ -z "$ACTUAL" ]; then
  echo "::error title=스캔 대조군 실패::'${SCRIPT}' 를 가진 패키지를 0개 찾았다. 스캔이 죽었거나 전부 사라졌다."
  exit 2
fi

EXPECTED_SORTED="$(printf '%s\n' "${EXPECTED[@]}" | sort)"
FAILED=0

echo "'${SCRIPT}' 소유 패키지 대조"
echo "  기대: $(printf '%s' "$EXPECTED_SORTED" | tr '\n' ' ')"
echo "  실제: $(printf '%s' "$ACTUAL" | tr '\n' ' ')"

MISSING="$(comm -23 <(printf '%s\n' "$EXPECTED_SORTED") <(printf '%s\n' "$ACTUAL") | tr '\n' ' ')"
EXTRA="$(comm -13 <(printf '%s\n' "$EXPECTED_SORTED") <(printf '%s\n' "$ACTUAL") | tr '\n' ' ')"

if [ -n "${MISSING// /}" ]; then
  echo "::error title=스크립트 유실::${MISSING}에 '${SCRIPT}' 가 없다 — 그 패키지는 조용히 건너뛰어진다."
  FAILED=1
fi
if [ -n "${EXTRA// /}" ]; then
  echo "::error title=목록 미갱신::${EXTRA}가 '${SCRIPT}' 를 갖고 있는데 기대 목록에 없다 — 목록을 갱신하라."
  FAILED=1
fi

[ "$FAILED" -eq 0 ] && echo "✔ 일치"
exit "$FAILED"
