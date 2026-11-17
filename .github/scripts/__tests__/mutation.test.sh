#!/usr/bin/env bash
# 돌연변이 검사 — "테스트가 실제로 무언가를 잡는가" 를 검사한다.
#
# ## 왜 필요한가
#
# 스위트가 "0 실패" 를 보고해도 그것이 **무언가를 검사한 결과**라는 보장은 없다.
# 이 저장소가 반복해 밟은 형태가 정확히 그것이다. 그래서 스크립트 사본에 결함을 심고
# 스위트가 **실제로 실패하는지** 확인한다. 살아남은 돌연변이는 곧 검사 구멍이다.
#
# ## 이 러너 자체에도 양성 대조군이 있다
#
# 러너가 고장나면 "모든 돌연변이가 죽었다" 고 보고하면서 아무것도 검사하지 않는다.
# 실제 사례가 있다 — 다른 레인이 파괴 재현에서 앵커를 `Popconfirm` 으로 썼는데 실제는
# `PopConfirm` 이라 **치환이 조용히 실패하고 "통과" 가 나왔다.**
#
# 그래서 돌연변이마다:
#   1. 사본이 원본과 **실제로 달라졌는지 단정**한다 (치환 횟수 ≥ 1)
#   2. 그 뒤에 스위트를 돌려 **실패하는지** 확인한다
#   3. 사본을 버린다
# 1 없이 2만 하면 "치환 실패 → 원본 그대로 → 스위트 통과" 를 돌연변이 생존으로 잘못 읽는다.
# 그리고 돌연변이 목록이 비면 이 파일이 통째로 무동작이므로 그것도 실패로 본다.

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$HERE/lib.sh"
SUITE="mutation"

GATE_SRC="$HERE/../ci-gate.sh"
DETECT_SRC="$HERE/../ci-detect-changes.sh"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

MUTATIONS=0
SURVIVORS=""

# mutate <id> <대상 gate|detect> <찾을 문자열> <바꿀 문자열>
mutate() {
  local id="$1" target="$2" from="$3" to="$4"
  local src copy suite
  case "$target" in
    gate)      src="$GATE_SRC";   suite="$HERE/ci-gate.test.sh" ;;
    detect)    src="$DETECT_SRC"; suite="$HERE/ci-detect.test.sh" ;;
    structure) src="$HERE/../../workflows/ci.yml"; suite="$HERE/ci-structure.test.sh" ;;
    pnpmrun)   src="$HERE/../pnpm-run.sh"; suite="$HERE/pnpm-run.test.sh" ;;
    *) ng "$id: 대상이 잘못됐다 ($target)"; return ;;
  esac
  MUTATIONS=$((MUTATIONS + 1))
  copy="$WORK/mut-$id.sh"

  # ── 1. 치환이 실제로 심겼는지 단정 ───────────────────────────────────────
  local count
  count=$(FROM="$from" TO="$to" SRC="$src" COPY="$copy" python3 - <<'PY'
import os
src = open(os.environ['SRC'], encoding='utf-8').read()
frm, to = os.environ['FROM'], os.environ['TO']
n = src.count(frm)
if n:
    open(os.environ['COPY'], 'w', encoding='utf-8').write(src.replace(frm, to))
print(n)
PY
)
  if [ "${count:-0}" -lt 1 ]; then
    ng "$id: 돌연변이를 심지 못했다 — 앵커가 원본에 없다" \
       "앵커: $(printf '%s' "$from" | head -1)" \
       "→ 이 결과를 '돌연변이 생존' 으로 읽으면 안 된다. 러너 결함이다."
    return
  fi
  if diff -q "$src" "$copy" >/dev/null 2>&1; then
    ng "$id: 치환했다는데 사본이 원본과 같다" "러너 결함이다."
    return
  fi
  chmod +x "$copy"

  # ── 2. 스위트가 이 돌연변이를 잡는가 ─────────────────────────────────────
  local out rc
  case "$target" in
    gate)      out=$(GATE_SCRIPT="$copy" bash "$suite" 2>&1); rc=$? ;;
    detect)    out=$(DETECT_SCRIPT="$copy" bash "$suite" 2>&1); rc=$? ;;
    structure) out=$(CI_YML="$copy" bash "$suite" 2>&1); rc=$? ;;
    pnpmrun)   out=$(PNPM_RUN_SCRIPT="$copy" bash "$suite" 2>&1); rc=$? ;;
  esac
  if [ "$rc" -ne 0 ]; then
    ok "$id (치환 ${count}곳) — 스위트가 잡았다"
  else
    SURVIVORS="${SURVIVORS} ${id}"
    ng "$id (치환 ${count}곳) — ★ 생존: 스위트가 못 잡았다" \
       "$(printf '%s' "$out" | tail -3)"
  fi
  rm -f "$copy"
}

echo "[ci-gate.sh 돌연변이]"
mutate "gate-배선오류-무력화" gate \
  '          verdict="✘ 배선 오류 — 돌아야 했는데 스킵됐다"
          FAILED=1' \
  '          verdict="OK"'
mutate "gate-실패전파-무력화" gate \
  '      verdict="✘ 실패 — 하위 체크가 ${result}"
      FAILED=1' \
  '      verdict="OK"'
mutate "gate-알수없는결과-통과" gate \
  '      verdict="✘ 알 수 없는 결과 '"'"'${result}'"'"' (fail-closed)"
      FAILED=1' \
  '      verdict="OK"'
mutate "gate-검사0건-허용" gate 'if [ "$EXAMINED" -eq 0 ]; then' 'if false; then'
mutate "gate-배선누락-무력화" gate 'if [ -n "$MISSING" ]; then' 'if false; then'
mutate "gate-유령행-무력화" gate 'if [ -n "$GHOST" ]; then' 'if false; then'
mutate "gate-jq종료코드-무시" gate 'elif [ -z "$NEEDS_KEYS" ]; then' 'elif false; then'

echo "[ci-detect-changes.sh 돌연변이]"
mutate "detect-failclosed-반전" detect \
  '  AFDS=true
  AFDS_REGISTRY=true
  REASON="fail-closed: $1"' \
  '  AFDS=false
  AFDS_REGISTRY=false
  REASON="fail-closed: $1"'
mutate "detect-미분류경로-무시" detect '    *) return 1 ;;' '    *) return 0 ;;'
mutate "detect-변경0건-허용" detect 'if [ -z "$FILES" ]; then' 'if false; then'
# codex 독립 리뷰가 HIGH 로 잡은 것 — 스위트가 스크립트의 **종료코드**를 안 봤다.
mutate "detect-종료코드-무시" detect 'REASON="${REASON}; packages/afds 변경은 afds_registry 도 켠다"
fi
emit' 'REASON="${REASON}; packages/afds 변경은 afds_registry 도 켠다"
fi
emit
exit 42'
# 의존 결합 — 빠지면 afds 만 바꾼 PR 에서 afds-registry 의 lint·정합·validate·테스트가 전부 건너뛴다.
mutate "detect-afds의존결합-제거" detect '    packages/afds/*)
      AFDS=true
      AFDS_REGISTRY=true' '    packages/afds/*)
      AFDS=true'

echo "[ci.yml 돌연변이 — 구조 불변식]"
# codex 가 HIGH 로 잡은 것 — "scripts-test 는 항상 실행된다" 를 아무것도 강제하지 않았다.
mutate "구조-scripts-test-조건부화" structure \
  '  scripts-test:
    runs-on: ubuntu-latest' \
  '  scripts-test:
    if: false
    runs-on: ubuntu-latest'
mutate "구조-should_run-표변조" structure \
  '            scripts-test|true|' \
  '            scripts-test|false|'
# #199 의 `format` 잡(지금은 knip·인용 축). `scripts-test` 와 같은 부류 — **조건 없이 돌아야** 하는 잡이므로
# 조건부화·실패삼킴이 붙는 순간 검사가 있는 척만 한다.
mutate "구조-format-조건부화" structure \
  '  format:
    runs-on: ubuntu-latest' \
  '  format:
    if: false
    runs-on: ubuntu-latest'
mutate "구조-format-실패삼킴" structure \
  '      - name: Knip
        run: pnpm knip' \
  '      - name: Knip
        continue-on-error: true
        run: pnpm knip'
# secret-scan — 조건 없이 돌아야 하고, gate 가 그 결과를 봐야 한다.
mutate "구조-secret-scan-gate누락" structure \
  'needs: [changes, afds, afds-registry, scripts-test, format, secret-scan]' \
  'needs: [changes, afds, afds-registry, scripts-test, format]'
mutate "구조-secret-scan-실패삼킴" structure \
  '      - name: Scan commits introduced by this change
        env:' \
  '      - name: Scan commits introduced by this change
        continue-on-error: true
        env:'
mutate "구조-secret-scan-redact제거" structure \
  'gitleaks git -v --redact --no-banner' \
  'gitleaks git -v --no-banner'
mutate "구조-secret-scan-범위검증제거" structure \
  'N="$(git rev-list --count "$RANGE")"' \
  'N=0'
mutate "구조-changes-조건부화" structure \
  '  changes:
    runs-on: ubuntu-latest' \
  '  changes:
    if: false
    runs-on: ubuntu-latest'

echo "[pnpm-run.sh 돌연변이 — 새로 생긴 단일 지점]"
mutate "헬퍼-빈문자열-허용" pnpmrun \
  'if (typeof v !== "string" || v.trim() === "") {' \
  'if (typeof v !== "string") {'
mutate "헬퍼-종료코드-삼킴" pnpmrun 'exit "$RC"' 'exit 0'
mutate "헬퍼-ROOT이동-제거" pnpmrun 'if ! cd "$ROOT"; then' 'if false; then'

echo
# ── 3. 러너 자체가 무동작이 아닌가 ─────────────────────────────────────────
if [ "$MUTATIONS" -lt 16 ]; then
  ng "돌연변이 목록이 너무 적다 (${MUTATIONS}개)" "목록이 비면 이 파일은 통째로 무동작이다."
fi
printf '심은 돌연변이 %d개' "$MUTATIONS"
[ -n "$SURVIVORS" ] && printf ' / 생존:%s' "$SURVIVORS"
printf '\n'

finish 18
