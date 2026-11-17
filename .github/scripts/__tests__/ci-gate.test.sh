#!/usr/bin/env bash
# ci-gate.sh 회귀 테스트.
#
# ## 케이스에 [의도] / [고정] 표시가 붙어 있다
#
# [의도] — 스크립트 머리 주석의 판정 규칙에서 **왜 이 기대값이 옳은지 도출된다.**
#          판정을 뒤집는 분기(fail-closed·skipped 구분·자기검사)가 여기 속한다.
# [고정] — 현재 동작을 그대로 굳힌 것이다. 옳다고 논증한 것이 아니라 **바뀌면 알고
#          싶어서** 넣었다. 공백 정규화·대소문자 같은 부수 동작.
#
# 이 구분이 있는 이유: 테스트가 결함을 스펙으로 굳히는 사고가 이 저장소에 있었다
# (#101 F4 — 지뢰였던 규칙의 출력을 테스트가 정답으로 고정하고 있었다).
# 나중에 어디를 의심할지 알려면 "검증된 기대" 와 "관찰된 동작" 이 갈려 있어야 한다.

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$HERE/lib.sh"
SUITE="ci-gate"

# 돌연변이 검사가 사본을 넘겨줄 수 있게 한다.
GATE="${GATE_SCRIPT:-$HERE/../ci-gate.sh}"

NJ3='{"changes":{},"afds":{},"afds-registry":{}}'
NJ_SUB='{"changes":{},"sub":{}}'

# expect <설명> <pass|fail> <CHECKS> <NEEDS_JSON> [기대문구]
#
# 주의: 게이트를 **이 함수 안에서 직접** 실행하고 곧바로 $? 를 읽는다.
# 별도 헬퍼로 감싸 `out=$(run ...)` 로 부르면 종료코드가 명령 치환 서브셸에 갇혀
# 바깥으로 전파되지 않는다 — 실제로 그렇게 짰다가 29건이 거짓 실패했다.
expect() {
  local desc="$1" want="$2" checks="$3" nj="$4" needle="${5:-}" out rc got
  out=$(CHECKS="$checks" NEEDS_JSON="$nj" DETECT_REASON="test" GITHUB_STEP_SUMMARY= bash "$GATE" 2>&1)
  rc=$?
  got=pass; [ "$rc" -ne 0 ] && got=fail
  RC=$rc
  if [ "$got" != "$want" ]; then
    ng "$desc" "기대 판정=$want 실제=$got (exit=$rc)" "$(printf '%s' "$out" | tail -12)"
    return
  fi
  if [ -n "$needle" ]; then assert_contains "$desc" "$out" "$needle"; else ok "$desc"; fi
}

echo "[A. 판정 규칙 전수 스윕 — result 6종 × should_run 3종]  [의도]"
# 근거: 머리 주석의 판정표.
#   success -> OK / failure·cancelled -> 실패 / skipped&false -> OK(정당한 스킵)
#   skipped&true -> 실패(배선 오류) / 그 밖 -> 실패(fail-closed)
for result in success failure cancelled skipped bogus ""; do
  for should in true false ""; do
    want=fail
    case "$result" in
      success) want=pass ;;
      skipped) [ "$should" = "false" ] && want=pass ;;
    esac
    expect "result=${result:-<빈>} should_run=${should:-<빈>}" "$want" \
      "changes|true|success|changes
sub|${should}|${result}|sub" "$NJ_SUB"
  done
done

echo "[B. 실제 CI 시나리오]  [의도]"
expect "① 정상" pass "changes|true|success|changes
afds-test|true|success|afds
afds-registry-test|false|skipped|afds-registry" "$NJ3"
expect "② 정당한 스킵 — 관련 경로 변경 없음" pass "changes|true|success|changes
afds-test|false|skipped|afds
afds-registry-test|false|skipped|afds-registry" "$NJ3" "정당한 스킵"
expect "③ 실패 전파 — 부분 성공을 통과로 세지 않는다" fail "changes|true|success|changes
afds-test|true|failure|afds
afds-registry-test|true|success|afds-registry" "$NJ3" "하위 체크가 failure"
expect "④ 배선 오류 — 같은 skipped 인데 ②와 판정이 갈린다" fail "changes|true|success|changes
afds-test|true|skipped|afds
afds-registry-test|false|skipped|afds-registry" "$NJ3" "배선 오류"
expect "⑤ changes 실패 → 하위가 값 없이 스킵" fail "changes|true|failure|changes
afds-test||skipped|afds
afds-registry-test||skipped|afds-registry" "$NJ3"
expect "changes 취소" fail "changes|true|cancelled|changes
afds-test||skipped|afds
afds-registry-test||skipped|afds-registry" "$NJ3"

echo "[C. 자기검사 — 전부 일부러 깨뜨린 경우]  [의도]"
expect "CHECKS 빈 값 → 검사 0건은 통과가 아니다" fail "" "$NJ3" "검사한 체크가 0건"
expect "needs 전부 누락" fail "changes|true|success|changes" "$NJ3" "배선 누락"
expect "needs 일부 누락" fail "changes|true|success|changes
afds-test|true|success|afds" "$NJ3" "배선 누락"
expect "needs_key 오타 → 배선 누락으로 걸린다" fail "changes|true|success|changes
afds-test|true|success|afdsX
afds-registry-test|true|success|afds-registry" "$NJ3" "배선 누락"
expect "needs 에 신규 job 추가 미반영" fail "changes|true|success|changes
afds-test|true|success|afds
afds-registry-test|true|success|afds-registry" '{"changes":{},"afds":{},"afds-registry":{},"lint":{}}' "배선 누락"
expect "유령 행 — needs 에 없는 job 의 하드코딩 success" fail "changes|true|success|changes
afds-test|true|success|afds
afds-registry-test|true|success|afds-registry
ghost|true|success|ghost" "$NJ3" "유령 행"
expect "NEEDS_JSON 빈 값 → 대조 불가는 실패" fail "changes|true|success|changes
afds-test|true|success|afds
afds-registry-test|true|success|afds-registry" "" "NEEDS_JSON 이 비어"
expect "NEEDS_JSON 깨진 JSON → fail-open 금지" fail "changes|true|success|changes
afds-test|true|success|afds
afds-registry-test|true|success|afds-registry" "not-json" "파싱 실패"
expect "NEEDS_JSON job 0개" fail "changes|true|success|changes
afds-test|true|success|afds
afds-registry-test|true|success|afds-registry" "{}" "job 이 0개"

echo "[D. 보고 숫자가 실제 개수와 맞는가 — 계수 자체 검증]  [의도]"
# 근거: 이 줄들은 "몇 개를 봤는지" 를 드러내려고 넣은 것이다. 숫자가 틀리면 넣은 의미가
# 없다. 실제로 needs 를 공백 구분으로 정규화한 뒤 줄 수로 세어 항상 1 이 나온 적이 있다.
expect "needs 3개 → '검사 대상 3건'" pass "changes|true|success|changes
afds-test|true|success|afds
afds-registry-test|true|success|afds-registry" "$NJ3" "검사 대상 3건"
expect "needs 3개 → 'job 3개'" pass "changes|true|success|changes
afds-test|true|success|afds
afds-registry-test|true|success|afds-registry" "$NJ3" "needs 의 job 3개"
expect "needs 2개 → 'job 2개'" pass "changes|true|success|changes
afds-test|true|success|afds" '{"changes":{},"afds":{}}' "needs 의 job 2개"
expect "needs 1개 → 'job 1개'" pass "changes|true|success|changes" '{"changes":{}}' "needs 의 job 1개"

echo "[E. 입력 정규화]  [고정] — 옳다고 논증한 것이 아니라 바뀌면 알고 싶은 동작"
expect "앞뒤 공백은 무시된다" pass "changes|true|success|changes
afds-test| true | success |afds
afds-registry-test|true|success|afds-registry" "$NJ3"
expect "필드 초과는 fail-closed" fail "changes|true|success|changes|extra
afds-test|true|success|afds
afds-registry-test|true|success|afds-registry" "$NJ3"
expect "대문자 True 는 true 로 보지 않는다" fail "changes|true|success|changes
afds-test|True|skipped|afds
afds-registry-test|true|success|afds-registry" "$NJ3"

finish 40
