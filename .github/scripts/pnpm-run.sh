#!/usr/bin/env bash
# 워크스페이스 패키지의 스크립트를 **존재를 단정한 뒤** 실행한다.
#
# ## 왜 필요한가
#
# `pnpm --filter <pkg> <script>` 는 **스크립트가 없어도 exit 0** 이다(실측).
#
# (아래 전사는 실제 실행 기록이며 패키지 이름만 현재 이름으로 바꿨다.)
#   $ pnpm --filter @turbo-project/afds-registry lint
#   None of the selected packages has a "lint" script
#   $ echo $?
#   0
#
# 그래서 스크립트가 사라지거나 이름이 바뀌면 그 CI 스텝이 **아무것도 검사하지 않고
# 초록**이 된다. "우리는 그 스텝을 추가했다" 가 무동작일 수 있다는 뜻이다.
# `pnpm -r <script>` 도 같다. (`pnpm <script>` 는 루트에서 exit 254 로 실패한다.)
#
# ## 사용법
#
#   bash .github/scripts/pnpm-run.sh packages/afds lint
#
# 패키지 **이름**은 그 디렉터리의 package.json 에서 읽는다. 필터 문자열을 손으로 적으면
# 디렉터리와 어긋나도 아무도 모르기 때문이다.
#
# ## 종료코드
#
# 스크립트의 종료코드를 **그대로 전파**한다. 삼키면 이 헬퍼가 원래 막으려던 결함을
# 스스로 만드는 셈이다.
set -uo pipefail

PKG_DIR="${1:-}"
SCRIPT="${2:-}"

if [ -z "$PKG_DIR" ] || [ -z "$SCRIPT" ]; then
  echo "::error title=pnpm-run 사용법 오류::사용법: pnpm-run.sh <패키지 디렉터리> <스크립트명>"
  exit 2
fi

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
MANIFEST="$ROOT/$PKG_DIR/package.json"

if [ ! -f "$MANIFEST" ]; then
  echo "::error title=패키지 없음::${PKG_DIR}/package.json 이 없다 (ROOT=${ROOT})."
  exit 2
fi

# 이름과 스크립트 존재·비어있지 않음을 한 번에 확인한다.
# 값이 빈 문자열인 경우도 잡는다 — `"lint": ""` 는 존재하지만 아무것도 하지 않는다.
PKG_NAME="$(MANIFEST="$MANIFEST" SCRIPT="$SCRIPT" node -e '
  const fs = require("fs");
  let m;
  try {
    m = JSON.parse(fs.readFileSync(process.env.MANIFEST, "utf8"));
  } catch (e) {
    console.error("PARSE_ERROR " + e.message);
    process.exit(3);
  }
  const s = m.scripts || {};
  const v = s[process.env.SCRIPT];
  if (typeof v !== "string" || v.trim() === "") {
    console.error("MISSING");
    process.exit(4);
  }
  if (!m.name) {
    console.error("NO_NAME");
    process.exit(5);
  }
  process.stdout.write(m.name);
')"
CHECK_RC=$?

case "$CHECK_RC" in
  0) ;;
  3) echo "::error title=매니페스트 파싱 실패::${PKG_DIR}/package.json 을 읽지 못했다."; exit 2 ;;
  4) echo "::error title=스크립트 부재::${PKG_DIR} 에 '${SCRIPT}' 스크립트가 없거나 비어 있다 — 이 스텝은 아무것도 실행하지 않는다."; exit 2 ;;
  5) echo "::error title=패키지 이름 없음::${PKG_DIR}/package.json 에 name 이 없다."; exit 2 ;;
  *) echo "::error title=확인 실패::${PKG_DIR} 확인 중 알 수 없는 오류 (rc=${CHECK_RC})."; exit 2 ;;
esac

# **반드시 ROOT 에서 실행한다.** 다른 디렉터리에서 돌리면 그 워크스페이스에 이 패키지가
# 없어 `pnpm --filter` 가 "None of the selected packages" 로 **exit 0** 을 낸다 — 이
# 헬퍼가 막으려는 바로 그 결함이다. (초기 판이 실제로 그랬고 자기 테스트가 잡았다.)
if ! cd "$ROOT"; then
  echo "::error title=작업 디렉터리 이동 실패::${ROOT} 로 이동하지 못했다."
  exit 2
fi

echo "▶ ${PKG_NAME} (${PKG_DIR}) 의 '${SCRIPT}' 실행"
pnpm --filter "$PKG_NAME" "$SCRIPT"
RC=$?
if [ "$RC" -ne 0 ]; then
  echo "::error title=${SCRIPT} 실패::${PKG_NAME} 의 '${SCRIPT}' 가 종료코드 ${RC} 로 끝났다."
fi
exit "$RC"
