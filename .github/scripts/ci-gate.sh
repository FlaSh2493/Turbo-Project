#!/usr/bin/env bash
# CI 집계 게이트 — 이것이 필수 체크(required status check)로 지정되는 유일한 job 이다.
#
# ## 이 스크립트가 존재하는 이유
#
# "스킵된 하위 체크를 성공으로 집계" 만 하면 **정당한 스킵**(경로가 무관해서 안 돌았다)과
# **배선 오류**(돌아야 했는데 안 돌았다)가 똑같이 초록이 된다. 겉으로 구분되지 않는 그 둘을
# 가르는 것이 이 게이트의 전부다. 구분하지 못하면 이 게이트 자체가 다음 결함이 된다.
#
# ## 입력
#
# CHECKS 환경변수. 한 줄에 `<이름>|<should_run>|<result>|<needs_key>`.
#   should_run : changes job 이 판정한 "돌아야 했는가" (true|false)
#   result     : needs.<job>.result (success|failure|cancelled|skipped)
#   needs_key  : 이 행이 대응하는 job id. NEEDS_JSON 의 키와 대조하는 데 쓴다.
#
# NEEDS_JSON 환경변수. `${{ toJSON(needs) }}`. 아래 자기검사의 기준이 된다.
#
# ## 자기검사 — "검사 0건"과 "전부 통과"를 구분한다
#
# 이 게이트의 이전 판은 CHECKS 가 비어도 초록이었다. 한 건도 안 봤는데 "모두 통과" 라고
# 보고한 것이다. 필수 체크가 그러면 브랜치 보호는 켜져 있으나 아무것도 막지 못한다 —
# 이 PR 이 고치려는 결함(`test` 이름 충돌)과 정확히 같은 부류다. 그래서:
#
#   - 검사한 행 수를 세어 로그·요약에 남긴다. 0 이면 실패한다.
#   - needs 에 있으나 CHECKS 에 없는 job 이 있으면 실패한다. job 을 추가하고 CHECKS
#     갱신을 잊으면, 그 job 이 실패해도 게이트가 초록이 되기 때문이다.
#
# ## 판정
#
#   result=success                       → OK
#   result=failure | cancelled           → 실패 (전파)
#   result=skipped & should_run=false    → OK (정당한 스킵)
#   result=skipped & should_run=true     → 실패 (배선 오류)
#   그 밖의 값 / 빈 값                    → 실패 (fail-closed)
#   검사한 행이 0건                       → 실패 (아무것도 안 본 것이다)
#   needs 에 있는데 CHECKS 에 없다        → 실패 (배선 누락)
#   CHECKS 에 있는데 needs 에 없다        → 실패 (유령 행)
set -uo pipefail

FAILED=0
SUMMARY=""
EXAMINED=0
COVERED=""

echo "── relevance 판정 근거 ──"
echo "  ${DETECT_REASON:-(없음)}"
echo

printf '%-16s %-11s %-11s %s\n' "체크" "돌아야했나" "결과" "판정"
printf '%-16s %-11s %-11s %s\n' "────────────────" "───────────" "───────────" "────────────────"

while IFS='|' read -r name should_run result needs_key; do
  # 공백 제거
  name="$(echo "${name:-}" | tr -d '[:space:]')"
  should_run="$(echo "${should_run:-}" | tr -d '[:space:]')"
  result="$(echo "${result:-}" | tr -d '[:space:]')"
  needs_key="$(echo "${needs_key:-}" | tr -d '[:space:]')"
  [ -z "$name" ] && continue
  EXAMINED=$((EXAMINED + 1))
  COVERED="${COVERED} ${needs_key}"

  verdict=""
  case "$result" in
    success)
      verdict="OK"
      ;;
    failure | cancelled)
      verdict="✘ 실패 — 하위 체크가 ${result}"
      FAILED=1
      ;;
    skipped)
      case "$should_run" in
        false)
          verdict="OK (정당한 스킵 — 관련 경로 변경 없음)"
          ;;
        true)
          verdict="✘ 배선 오류 — 돌아야 했는데 스킵됐다"
          FAILED=1
          ;;
        *)
          # changes job 이 값을 못 냈다는 뜻. fail-closed.
          verdict="✘ 판정 불가 — should_run='${should_run}' (fail-closed)"
          FAILED=1
          ;;
      esac
      ;;
    *)
      verdict="✘ 알 수 없는 결과 '${result}' (fail-closed)"
      FAILED=1
      ;;
  esac

  printf '%-16s %-11s %-11s %s\n' "$name" "${should_run:-?}" "${result:-?}" "$verdict"
  SUMMARY="${SUMMARY}| \`${name}\` | ${should_run:-?} | ${result:-?} | ${verdict} |"$'\n'
done <<EOF
${CHECKS}
EOF

echo
echo "검사 대상 ${EXAMINED}건"

# ── 자기검사 1: 한 건도 안 봤으면 실패 ───────────────────────────────────────
# 초록이 "위반 0건" 인지 "아무것도 안 봤다" 인지 구분되지 않으면 게이트가 아니다.
if [ "$EXAMINED" -eq 0 ]; then
  echo "::error title=CI gate 자기검사 실패::검사한 체크가 0건이다. CHECKS 입력이 비었거나 형식이 깨졌다."
  FAILED=1
fi

# ── 자기검사 2: needs 에 있는데 CHECKS 에 없는 job ──────────────────────────
# job 을 needs 에 추가하고 CHECKS 갱신을 잊으면 그 job 이 실패해도 게이트가 초록이 된다.
if [ -n "${NEEDS_JSON:-}" ]; then
  if ! command -v jq >/dev/null 2>&1; then
    echo "::error title=CI gate 자기검사 불가::jq 가 없어 needs 대조를 못 했다 (fail-closed)."
    FAILED=1
  else
    # jq 의 종료코드를 반드시 본다. 파싱이 실패하면 키가 0개로 나오는데, 그것을
    # "빠진 job 없음" 으로 읽으면 깨진 입력이 곧 통과가 된다(fail-open).
    if ! NEEDS_KEYS=$(printf '%s' "$NEEDS_JSON" | jq -r 'keys[]' 2>&1); then
      echo "::error title=CI gate 자기검사 불가::NEEDS_JSON 파싱 실패 (fail-closed): ${NEEDS_KEYS}"
      FAILED=1
      NEEDS_KEYS=""
    elif [ -z "$NEEDS_KEYS" ]; then
      # gate 는 needs 를 반드시 갖는다. 0개면 입력이 잘못된 것이다.
      echo "::error title=CI gate 자기검사 불가::NEEDS_JSON 에 job 이 0개다 (fail-closed)."
      FAILED=1
    fi
    NEEDS_KEYS=$(printf '%s' "$NEEDS_KEYS" | tr '\n' ' ')
    MISSING=""
    for key in $NEEDS_KEYS; do
      case " ${COVERED} " in
        *" ${key} "*) ;;
        *) MISSING="${MISSING} ${key}" ;;
      esac
    done
    # 반대 방향도 본다. CHECKS 에만 있는 행은 **어떤 job 의 결과도 아닌 값**을 들고 있다
    # (복붙으로 남은 유령 행). 그런 행이 하드코딩된 success 면 게이트가 그것을 통과로 센다.
    GHOST=""
    for key in $COVERED; do
      case " ${NEEDS_KEYS} " in
        *" ${key} "*) ;;
        *) GHOST="${GHOST} ${key}" ;;
      esac
    done
    if [ -n "$GHOST" ]; then
      echo "::error title=CI gate 유령 행::CHECKS 에 있으나 needs 에 없는 job:${GHOST} — 어떤 job 의 결과도 아닌 값을 집계하고 있다."
      FAILED=1
    fi
    if [ -n "$MISSING" ]; then
      echo "::error title=CI gate 배선 누락::needs 에 있으나 CHECKS 에 없는 job:${MISSING} — 이 job 은 실패해도 게이트가 잡지 못한다."
      FAILED=1
    elif [ -n "$NEEDS_KEYS" ]; then
      # NEEDS_KEYS 는 위에서 공백 구분 한 줄로 정규화했다. 줄 수가 아니라 **단어 수**를
      # 세야 한다 — 줄로 세면 항상 1 이 나온다(실제로 그렇게 틀렸다).
      echo "needs 대조 OK — needs 의 job $(printf '%s' "$NEEDS_KEYS" | wc -w | tr -d ' ')개가 모두 CHECKS 에 있다."
    fi
  fi
else
  echo "::error title=CI gate 자기검사 불가::NEEDS_JSON 이 비어 needs 대조를 못 했다 (fail-closed)."
  FAILED=1
fi

echo

# GitHub Actions 요약에도 남긴다 — 로그를 파고들지 않아도 보이게.
if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
  {
    echo "## CI gate"
    echo
    echo "relevance 판정: ${DETECT_REASON:-(없음)}"
    echo
    echo "검사 대상 **${EXAMINED}건**"
    echo
    echo "| 체크 | 돌아야 했나 | 결과 | 판정 |"
    echo "|---|---|---|---|"
    printf '%s' "$SUMMARY"
  } >>"$GITHUB_STEP_SUMMARY"
fi

if [ "$FAILED" -ne 0 ]; then
  echo "::error title=CI gate 실패::하나 이상의 하위 체크가 통과하지 않았다. 위 표를 확인하라."
  exit 1
fi

echo "✔ CI gate 통과 — 모든 하위 체크가 성공했거나 정당하게 스킵됐다."
