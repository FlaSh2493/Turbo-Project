#!/usr/bin/env bash
# CI 판정 스크립트의 회귀 테스트 진입점.
#
# `ci-gate.sh` 와 `ci-detect-changes.sh` 는 이 저장소 CI 의 **판정 주체**다. 그것들이
# 조용히 틀리면 모든 PR 의 판정이 틀린다. 그런데 지금까지 자기 테스트가 없었다(#114).
#
# **아래 `for suite in ...` 목록이 스위트의 정본이다** — 수를 여기 적지 않는다(늙는다).
#   ci-gate.test.sh       집계 게이트의 판정 규칙과 자기검사
#   ci-detect.test.sh     경로 관련성 판정 (임시 git 저장소를 실제로 만들어 실행)
#   ci-structure.test.sh  워크플로 구조 불변식 — jobs ⊄ needs · 헬퍼 우회 차단 · 이 목록의 정합
#   pnpm-run.test.sh      pnpm-run.sh 헬퍼 (실제 임시 워크스페이스로 실행)
#   release-guard.test.sh 릴리스 가드 — 대기 changeset 등급 판정 · 워크스페이스 버전 스냅샷
#   test-gates.test.sh    게이트 성격의 vitest 파일 집합을 이름으로 고정 (#170)
#   pre-push-guard.test.sh main 직접 push 차단 훅(block-main-push.sh)
#   package-boundaries.test.sh 패키지 경계 검사(check-package-boundaries.mjs) — 위반 픽스처가 실제로 잡히는지
#   mutation.test.sh      위 스위트가 실제로 무언가를 잡는지 검사한다
#
# **목록에서 이름을 빼면 그 스위트가 조용히 안 돈다** — 파일 삭제는 여기서 `EXIT=1` 이지만
# 목록 축소는 아니다(실측: `mutation` 을 빼니 「스위트 4개 실행」으로 통과했다). 그래서
# **`ci-structure` 가 이 목록과 디렉터리의 `*.test.sh` 집합을 양방향 대조한다.**
#
# 마지막이 핵심이다. "0 실패" 는 위반이 없었다는 뜻일 수도, 아무것도 안 봤다는 뜻일
# 수도 있다. 돌연변이 검사가 그 둘을 가른다.
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FAILED=0
RAN=0

for suite in ci-gate ci-detect ci-structure pnpm-run mutation test-gates release-guard pre-push-guard package-boundaries; do
  echo "════════════════════════════════════════════════════════"
  echo "  $suite"
  echo "════════════════════════════════════════════════════════"
  RAN=$((RAN + 1))
  if bash "$HERE/$suite.test.sh"; then
    echo
  else
    FAILED=$((FAILED + 1))
    echo "::error title=$suite 실패::위 출력을 확인하라."
    echo
  fi
done

echo "════════════════════════════════════════════════════════"
echo "  스위트 ${RAN}개 실행 / 실패 ${FAILED}개"
echo "════════════════════════════════════════════════════════"

# 스위트를 하나도 못 돌렸으면 그것이 실패다 — 초록이 "통과" 인지 "안 돎" 인지 가른다.
if [ "$RAN" -eq 0 ]; then
  echo "::error title=테스트 미실행::스위트를 하나도 실행하지 못했다."
  exit 1
fi
[ "$FAILED" -eq 0 ]
