#!/usr/bin/env bash
# 워크플로 구조 불변식 검사.
#
# ## 왜 gate 스크립트가 아니라 여기인가
#
# 이 파일의 핵심 검사는 **`jobs − {gate}` 가 `gate.needs` 와 같은가** 다. ci.yml 에 job 을
# 추가하고 `gate.needs` 갱신을 잊으면 그 job 이 실패해도 게이트가 초록이 된다.
#
# 이것을 ci-gate.sh 안에서 막을 수는 없다. 게이트는 `toJSON(needs)` 로 **자기 needs 만**
# 볼 수 있고 워크플로의 job 목록은 볼 수 없다. bash 로 YAML 을 grep 해 세는 방법은 이
# 저장소가 반복해 밟은 "스캔이 대상보다 좁다" 를 새로 들이는 짓이다. 그래서 **진짜 YAML
# 파서**로 CI 에서 검사한다.
#
# ## 파서는 fail-closed 다
#
# yq → python3+PyYAML → node+repo yaml 순으로 시도하고 **셋 다 없으면 실패**한다.
# 판정할 수 없으면 통과가 아니다. 어느 경로를 탔는지 로그에 남긴다 — 러너가 바뀌어
# 조용히 다른 파서를 타면 알아야 한다.

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$HERE/lib.sh"
SUITE="ci-structure"
WF="$HERE/../../workflows"
# 돌연변이 검사가 사본을 넘겨줄 수 있게 한다.
CI_YML_PATH="${CI_YML:-$WF/ci.yml}"

command -v jq >/dev/null 2>&1 || {
  echo "::error title=구조 검사 불가::jq 가 없다 (fail-closed)."; exit 1
}

# 이 저장소에서 워크플로 스텝의 `run` 텍스트를 뽑는 **유일한 곳**이다 — 아래 모든 검사가
# `.run` 을 이 함수의 출력에서 얻는다. 그래서 여기서 주석 줄(`^\s*#`)을 떼면 그걸 쓰는 모든
# 검사에 한 번에 적용된다. 안 떼면 `run: |` 블록 안에서 실행 줄만 주석 처리해도(스텝 자체는
# 그대로라 존재·if·이름 단정을 다 통과) `.run` 문자열에는 그 텍스트가 여전히 남아 있어서
# "실행 중"으로 잘못 잡힌다(실측: figma-token-bridge 줄을 주석 처리해도 관련 검사가 초록이었다).
PARSER=""
yaml2json() { # yaml2json <파일>
  local raw
  case "$PARSER" in
    yq)     raw="$(yq -o=json '.' "$1")" ;;
    python) raw="$(python3 -c 'import sys,yaml,json; json.dump(yaml.safe_load(open(sys.argv[1])),sys.stdout)' "$1")" ;;
    node)   raw="$(node -e 'const Y=require(process.env.YAML_MOD),fs=require("fs");process.stdout.write(JSON.stringify(Y.parse(fs.readFileSync(process.argv[1],"utf8"))))' "$1")" ;;
  esac
  printf '%s' "$raw" | jq '
    def strip_run_comments: split("\n") | map(select(test("^[ \t]*#") | not)) | join("\n");
    walk(if type == "object" and has("run") and (.run | type == "string")
         then .run |= strip_run_comments else . end)'
}
pick_parser() {
  if command -v yq >/dev/null 2>&1; then PARSER=yq; return 0; fi
  if python3 -c 'import yaml' >/dev/null 2>&1; then PARSER=python; return 0; fi
  local m
  m="$(ls -d "$HERE"/../../../node_modules/.pnpm/yaml@*/node_modules/yaml 2>/dev/null | head -1)"
  if [ -n "$m" ] && command -v node >/dev/null 2>&1; then
    YAML_MOD="$(cd "$m" && pwd)"; export YAML_MOD; PARSER=node; return 0
  fi
  return 1
}
if ! pick_parser; then
  echo "::error title=구조 검사 불가::YAML 파서가 없다 — yq · python3+PyYAML · node+yaml 모두 부재 (fail-closed)."
  exit 1
fi
echo "YAML 파서: $PARSER"

CI_JSON="$(yaml2json "$CI_YML_PATH")"
[ -n "$CI_JSON" ] || { echo "::error::ci.yml 파싱 실패 (fail-closed)"; exit 1; }

# 파서가 실제로 내용을 읽었는지 확인하는 양성 대조군.
# 이게 없으면 빈 JSON 을 받고 모든 검사가 조용히 통과할 수 있다.
seen_jobs="$(printf '%s' "$CI_JSON" | jq -r '.jobs | keys | length')"
if [ "${seen_jobs:-0}" -lt 2 ]; then
  echo "::error title=파서 대조군 실패::ci.yml 에서 job 을 ${seen_jobs:-0}개만 읽었다. 파싱이 죽었다."
  exit 1
fi
echo "대조군: ci.yml 에서 job ${seen_jobs}개를 읽었다 — 파서가 살아 있다"

# YAML 1.1 파서(PyYAML 등)는 `on:` 을 **boolean true** 로 읽어 JSON 키가 "true" 가 된다.
# 그러면 `.on.foo // "null"` 류 단언이 전부 "null" 을 받아 **조용히 통과**한다.
# 그래서 트리거 객체를 정규화하고, 키가 하나도 없으면 실패한다(대조군).
ON() { jq -c '(.on // .["true"]) // {}'; }
on_keys="$(printf '%s' "$CI_JSON" | ON | jq -r 'keys | length')"
if [ "${on_keys:-0}" -lt 1 ]; then
  echo "::error title=트리거 대조군 실패::ci.yml 의 트리거 키를 0개 읽었다. on/true 키 정규화가 깨졌다."
  exit 1
fi
echo "대조군: ci.yml 트리거 키 ${on_keys}개를 읽었다"
echo

echo "[핵심 — jobs ⊄ needs 를 막는다]"
JOBS="$(printf '%s' "$CI_JSON" | jq -r '.jobs | keys[]' | grep -v '^gate$' | sort | tr '\n' ' ')"
NEEDS="$(printf '%s' "$CI_JSON" | jq -r '.jobs.gate.needs[]' | sort | tr '\n' ' ')"
assert_eq "jobs − {gate} == gate.needs" "$JOBS" "$NEEDS"

echo "[무조건 실행 불변식 — 이 job 들은 어떤 조건으로도 스킵되면 안 된다]"
# `changes` 는 관련성 판정의 유일한 원천이고 `scripts-test` 는 판정 스크립트 자신의
# 회귀 테스트다. 둘 중 하나라도 스킵되면 gate 가 "정당한 스킵" 으로 통과시킨다.
#
# 실제로 그 구멍이 있었다: `scripts-test` 에 `if: false` 를 붙이고 CHECKS 를
# `scripts-test|false|...` 로 바꾸자 이 스위트가 21/21 로 통과했고 gate 도 통과했다.
#
# ## 무엇을 단정하고 무엇은 못 하는가
#
# 단정한다 — job 레벨 `if` · `needs` · `strategy`(matrix exclude) · `continue-on-error`
#            부재, 스텝 레벨 `if` 부재, CHECKS 의 should_run 이 **리터럴 `true`**.
# 단정하지 못한다 — 러너 부재/취소 같은 실행 환경 요인, GitHub 측 재실행 정책,
#            그리고 이 워크플로가 다른 워크플로에 의해 호출되는 경우의 상위 조건
#            (현재 `ci.yml` 은 `workflow_call` 트리거가 없어 최상위로만 실행되므로
#             해당 없음 — 아래에서 그 사실 자체를 단정한다).
# `format` 은 #199 에서 더했다 — 포맷은 저장소 전체의 속성이라 `changes` 판정에 매달면
# 「문서만 고친 PR」이 검사를 건너뛴다. 조건 없이 도는 것이 요구사항이므로 여기 등록한다.
# `secret-scan` — 비밀은 어느 경로에나 들어오므로 관련성 판정에 매달 수 없다.
ALWAYS_JOBS="changes scripts-test format secret-scan"
for j in $ALWAYS_JOBS; do
  JOB="$(printf '%s' "$CI_JSON" | jq -c --arg j "$j" '.jobs[$j] // {}')"
  assert_eq "$j: job 이 존재한다" "true" "$(printf '%s' "$JOB" | jq -r '(keys|length) > 0')"
  # `has()` 를 쓴다. `.if // "null"` 은 **`if: false` 를 못 잡는다** — jq 의 `//` 는
  # `false` 를 falsy 로 보아 대체값을 내놓기 때문이다. 실제로 그 구멍이 있었다.
  assert_eq "$j: job 레벨 if 없음" "false" "$(printf '%s' "$JOB" | jq -r 'has("if")')"
  assert_eq "$j: needs 없음 (간접 스킵 경로 차단)" "false" "$(printf '%s' "$JOB" | jq -r 'has("needs")')"
  assert_eq "$j: strategy 없음 (matrix exclude 차단)" "false" "$(printf '%s' "$JOB" | jq -r 'has("strategy")')"
  assert_eq "$j: continue-on-error 없음" "false" "$(printf '%s' "$JOB" | jq -r 'has("continue-on-error")')"
  # **`select(.if)` 가 아니라 `select(has("if"))` 다.** 위 105-107 이 job 레벨에 대해 적어 둔
  # 바로 그 함정이 여기 그대로 남아 있었다 — jq 의 `select(.if)` 는 값이 falsy 면 거르므로
  # **`if: false`(불리언)를 못 잡는다.** 실측:
  #     echo '{"steps":[{"if":false},{"if":"${{ false }}"},{}]}'
  #       | jq '[.steps[]|select(.if)]|length'       → 1   (불리언 false 를 놓친다)
  #       | jq '[.steps[]|select(has("if"))]|length' → 2
  # 그리고 `if: false` 는 **스텝을 끄는 가장 직접적인 방법**이다 — 문자열
  # `${{ false }}` 만 막고 불리언을 남기면 이 단정의 이름이 거짓이 된다.
  # (#217 리뷰가 잡았다. 개념도 처방도 이 파일에 이미 있었고 **한 자리에만 적용돼** 있었다.)
  assert_eq "$j: 스텝 레벨 if 없음" "0" "$(printf '%s' "$JOB" | jq -r '[.steps[]? | select(has("if"))] | length')"
  # **스텝 레벨 `continue-on-error` 도 막는다.** 위의 job 레벨 검사로는 안 잡힌다 —
  # 스텝에 붙으면 그 스텝만 돌리고 **실패를 삼켜** job 은 초록이 된다. 결과는 `if: false`
  # 와 같다: 검사가 빨간불을 낼 수 없으면 검사가 아니다.
  # #199 에서 포맷 잡을 더할 때 돌연변이(`구조-format-실패삼킴`)가 **생존**해 드러난 구멍이고,
  # `changes`·`scripts-test` 에도 같은 우회가 열려 있었다.
  assert_eq "$j: 스텝 레벨 continue-on-error 없음" "0" \
    "$(printf '%s' "$JOB" | jq -r '[.steps[]? | select(has("continue-on-error"))] | length')"
  # CHECKS 의 should_run 이 표현식이 아니라 리터럴 true 여야 한다.
  SR="$(printf '%s' "$CI_JSON" | jq -r '.jobs.gate.steps[] | select(.env.CHECKS) | .env.CHECKS' \
        | awk -F'|' -v j="$j" 'NF>=4 {gsub(/^[ \t]+|[ \t]+$/,"",$4); if ($4==j) {gsub(/^[ \t]+|[ \t]+$/,"",$2); print $2}}')"
  assert_eq "$j: CHECKS 의 should_run 이 리터럴 true" "true" "$SR"
done
echo "[secret-scan — 스캔이 실제로 무언가를 본다]"
# 조건·실패삼킴은 위 루프가 막는다. 남는 것은 스텝을 두고 **내용을 비우는** 형태다 —
# 해시 검증을 빼거나, `--redact` 를 빼 로그에 비밀을 찍거나, 범위를 빼 전수 스캔(이력의
# 폐기 토큰 4건으로 항상 빨강)으로 만드는 것.
SS_RUN="$(printf '%s' "$CI_JSON" | jq -r '.jobs["secret-scan"].steps[]? | (.run // "")')"
# 부분 문자열 헬퍼가 아니라 `assert_eq` 로 쓴다 — harness.md §2 가 이 스위트의 단정 수를
# 「`assert_eq` 호출 지점 × 루프」로 읽는다.
ss_has() { case "$SS_RUN" in *"$1"*) echo true ;; *) echo false ;; esac; }
assert_eq "secret-scan: 받은 바이너리를 sha256 으로 검증한다" "true" "$(ss_has 'sha256sum -c')"
assert_eq "secret-scan: -v·--redact 로 스캔하고 머지 커밋도 remerge diff 로 본다" "true" \
  "$(ss_has 'gitleaks git -v --redact --no-banner --log-opts="--diff-merges=remerge $RANGE"')"
# gitleaks 는 풀리지 않는 범위에서 exit 0 이다(실측 8.30.1) — 범위를 먼저 git 으로 푸는 대입이 fail-closed 의 전부다.
assert_eq "secret-scan: 범위를 스캔 전에 git 으로 풀어 본다" "true" "$(ss_has 'N="$(git rev-list --count "$RANGE")"')"
# ci.yml 이 다른 워크플로에서 호출될 수 없음을 단정한다 — 그래야 위 "상위 조건 없음" 이 성립한다.
assert_eq "ci.yml 은 workflow_call 트리거가 없다 (상위 조건 경로 부재)" "false" \
  "$(printf '%s' "$CI_JSON" | ON | jq -r 'has("workflow_call")')"

echo "[문서 인용 축은 무조건 실행 잡에 있어야 한다]"
# **불변식**: 검사를 조건부 잡에 두려면 그 검사의 **입력 전체**가 그 잡의 관련성 조건에
# 포함돼야 한다. 인용 축은 그럴 수 없다 — 대상 문서가 `docs/`·`.claude/rules/`·두 패키지에
# 걸쳐 있고, 더 나쁘게는 **소스가 하나도 안 바뀌어도 깨진다**(릴리스가 changeset 을 소진하면
# 그것을 가리킨 인용이 사라진다). 그래서 무조건 실행 잡에 있어야 한다.
#
# 이 검사가 막는 회귀는 구체적이다: 이 스텝을 `afds-test.yml` 로 되돌리거나, ci.yml 안의
# 조건부 잡으로 옮기는 것. 둘 다 `docs/**` 만 바꾼 PR 에서 검사를 조용히 지운다 —
# 그것이 이 배선이 생긴 이유인 사고 그대로다.
#
# `grep` 이 아니라 파서로 **스텝 단위**를 본다(#227 이 같은 자리를 그렇게 고쳤다).
# `$CI_JSON` 을 쓴다 — `WF/ci.yml` 을 직접 읽으면 돌연변이 스위트가 넘기는 사본(`CI_YML`)을
# 보지 못해 이 단정이 돌연변이에 생존한다.
CITE_PAT="pnpm-run.sh packages/afds verify:docs:citations"
CITE_JOBS="$(printf '%s' "$CI_JSON" | jq -r --arg pat "$CITE_PAT" '
  .jobs | to_entries[]
  | select(any(.value.steps[]?; (.run // "") | contains($pat)))
  | .key' | sort | tr '\n' ' ')"
# 양성 대조군 — 스텝이 사라지면 아래 부분집합 검사는 **빈 집합이라 자동 통과**한다.
assert_eq "인용 축 대조군 — 그 스텝을 담은 잡을 1개 이상 찾았다" "true" \
  "$([ -n "${CITE_JOBS// /}" ] && echo true || echo false)"
CITE_OUTSIDE=""
for j in $CITE_JOBS; do
  case " $ALWAYS_JOBS " in
    *" $j "*) ;;
    *) CITE_OUTSIDE="${CITE_OUTSIDE}${j} " ;;
  esac
done
assert_eq "인용 축 스텝을 담은 잡이 전부 ALWAYS_JOBS 안이다" "" "${CITE_OUTSIDE% }"

echo "[CHECKS 배선]"
CHECK_KEYS="$(printf '%s' "$CI_JSON" | jq -r '.jobs.gate.steps[] | select(.env.CHECKS) | .env.CHECKS' \
  | awk 'NF' | awk -F'|' '{gsub(/^[ \t]+|[ \t]+$/,"",$4); print $4}' | sort | tr '\n' ' ')"
assert_eq "CHECKS 의 job id 집합 == gate.needs" "$NEEDS" "$CHECK_KEYS"
NEEDS_JSON_PRESENT="$(printf '%s' "$CI_JSON" | jq -r '[.jobs.gate.steps[] | select(.env.NEEDS_JSON)] | length')"
assert_eq "gate 에 NEEDS_JSON 이 주입된다" "1" "$NEEDS_JSON_PRESENT"

echo "[트리거]"
assert_eq "ci.yml pull_request 에 paths 없음" "null" \
  "$(printf '%s' "$CI_JSON" | ON | jq -c '.pull_request.paths // "null"' | tr -d '"')"
assert_eq "gate 는 if: always()" "true" \
  "$(printf '%s' "$CI_JSON" | jq -r '.jobs.gate.if | test("always") ')"

for f in afds-test afds-registry-test; do
  J="$(yaml2json "$WF/$f.yml")"
  jon="$(printf '%s' "$J" | ON)"
  assert_eq "$f.yml 트리거 대조군 — 키가 1개 이상" "true" "$(printf '%s' "$jon" | jq -r '(keys|length) >= 1')"
  assert_eq "$f.yml 에 pull_request 트리거 없음" "null" "$(printf '%s' "$jon" | jq -c '.pull_request // "null"' | tr -d '"')"
  assert_eq "$f.yml 에 push 트리거 없음" "null" "$(printf '%s' "$jon" | jq -c '.push // "null"' | tr -d '"')"
  assert_eq "$f.yml 은 workflow_call 로 호출 가능" "true" "$(printf '%s' "$jon" | jq -r 'has("workflow_call")')"
done

echo "[체크 이름 중복 — 필수 체크는 이름으로 매칭한다]"
NAMES="$(for f in afds-test afds-registry-test; do yaml2json "$WF/$f.yml" | jq -r '.jobs | keys[]'; done | sort)"
DUP="$(printf '%s\n' "$NAMES" | uniq -d | tr '\n' ' ')"
assert_eq "피호출 워크플로의 job 이름 중복 0" "" "$DUP"

echo "[권한 — 호출자 ⊇ 피호출자]"
CALLER="$(printf '%s' "$CI_JSON" | jq -r '.permissions | keys[]' | sort | tr '\n' ' ')"
for f in afds-test afds-registry-test; do
  J="$(yaml2json "$WF/$f.yml")"
  SUB="$(printf '%s' "$J" | jq -r '(.permissions // (.jobs[] | .permissions) // {}) | keys[]' | sort -u)"
  MISSING=""
  while IFS= read -r k; do
    [ -z "$k" ] && continue
    case " $CALLER " in *" $k "*) ;; *) MISSING="$MISSING $k" ;; esac
  done <<< "$SUB"
  assert_eq "$f.yml 의 권한이 호출자에 모두 있다" "" "$MISSING"
done

echo "[헬퍼 우회 차단 — 헬퍼가 있는데 안 쓰면 장식이다]"
# `pnpm --filter <pkg> <script>` 와 `pnpm -r <script>` 는 스크립트가 없어도 exit 0 이다.
# 그래서 워크플로는 pnpm-run.sh 를 거쳐야 한다. 새 호출부가 헬퍼를 건너뛰면 여기서 막는다.
#
# **예외가 없다** — `pnpm -r --if-present test:run` 도 막는다. 그 자리의 실행 집합은 아래
# [test:run 기대 집합 ↔ 실행 스텝] 이 대조한다. 예외를 들이려면 **정확한 명령 문자열**로 적고
# 목록에만 남은 「죽은 예외」도 함께 막아라 — 명령이 바뀌면 예외가 조용히 남는다.
#
# 실제 호출만 추린다. 두 가지를 먼저 걷어낸다.
#   1. 주석(# 로 시작하는 줄)
#   2. **따옴표 안의 문자열** — afds-registry-test.yml 의 에러 메시지가 안내용으로 같은 명령을
#      인용하고 있어서, 걷어내지 않으면 그것을 호출로 잡는다(실제로 오탐이 났다).
raw_pnpm_calls() { # stdin: 워크플로 본문
  sed 's/^[[:space:]]*//' | grep -v '^#' \
    | sed "s/'[^']*'/''/g" | sed 's/"[^"]*"/""/g' \
    | grep -E 'pnpm (--filter|-r )' \
    | sed 's/^run:[[:space:]]*//' | sed 's/^-[[:space:]]*//' \
    | sed 's/[[:space:]]*\\$//' \
    | grep -oE 'pnpm (--filter|-r )[^|;&]*' | sed 's/[[:space:]]*$//' | sort -u
}

# 양성 대조군 — 실재 워크플로에는 우회 호출이 0건이라 **0 이 「없다」인지 「탐지가 죽었다」인지
# 가를 수 없다.** 그래서 합성 입력으로 탐지를 먼저 증명한다: 실제 호출 둘은 잡고, 주석과
# 따옴표 안의 인용은 잡지 않아야 한다.
FIX_CALLS="$(raw_pnpm_calls <<'YAML'
      - run: pnpm -r --if-present test:run
        run: |
          pnpm --filter x lint
          # pnpm --filter commented lint
          echo "안내: 'pnpm --filter quoted build' 후 커밋"
YAML
)"
assert_eq "탐지 대조군 — 합성 입력에서 실제 호출 둘만 잡는다" \
  "pnpm --filter x lint|pnpm -r --if-present test:run" "$(printf '%s\n' "$FIX_CALLS" | LC_ALL=C sort | paste -sd'|' -)"

RAW_CALLS="$(cat "$WF"/*.yml | raw_pnpm_calls)"
assert_eq "헬퍼를 거치지 않는 pnpm 호출 0건" "" "$(printf '%s' "$RAW_CALLS" | paste -sd';' -)"

# ── 헬퍼 인자가 그 워크플로의 패키지인가 ────────────────────────────────────
# 위 검사는 "헬퍼를 거쳤는가" 만 본다. **인자가 틀리면 그대로 통과한다** — 실측했다:
#
#   $ bash .github/scripts/pnpm-run.sh packages/afds lint     # afds-registry 워크플로에서
#   ▶ @turbo-project/afds (packages/afds) 의 'lint' 실행           # rc=0
#
# 즉 `afds-registry-test.yml` 이 afds 를 lint 하고 초록이 될 수 있다. 헬퍼는 자기가 받은 인자가
# **맞는 패키지인지** 알 방법이 없다(그 지식은 워크플로에만 있다). 그래서 여기서 고정한다.
#
# 이름으로 적는다 — 개수로 세면 한 줄이 afds-registry 에서 afds 로 바뀌어도 총계는 같다.
#
# `afds-registry-test.yml` 은 `packages/afds` 도 부른다 — 컴포지션이 afds-registry 로 이전되며
# (upstream #143) 이 워크플로의 소스가 실제로 `@turbo-project/afds/*` 서브패스를 import 하고,
# afds 의 `exports` 는 `types` 조건이 `dist/*.d.ts` 를 가리켜 afds 를 먼저 빌드하지 않으면
# 타입체크가 TS2307 로 깨진다(실측). 그래서 이 워크플로 하나에는 두 패키지가 정당하게 섞인다.
#
# ★ 처음엔 이것을 "콤마 허용 목록"(둘 중 하나면 통과)으로 짰다가 독립 리뷰(PR #143, H2)가
# 깼다 — 허용 목록은 **어느 값이 몇 번 나오는지**를 안 본다. `afds-registry-test.yml` 의
# check-types/lint/test/build/generate:registry **5개 스텝 전부**를 `packages/afds` 로
# 치환해도(= afds-registry 호출 0건) 허용 목록 검사는 42/42 로 통과했다 — 위 "개수로 세면 …
# 총계는 같다" 경고가 스스로 지적한 실패 형태 그대로였다. 그래서 **패키지별 최소 호출 수**로
# 바꾼다 — `afds-registry-test.yml` 은 afds-registry 를 최소 5회(현재 실제 호출 수), afds 를 최소
# 1회(빌드 스텝 하나) 불러야 한다. afds-registry 호출이 전부 afds 로 바뀌면 afds-registry 최소 5회
# 단정이 즉시 깨진다. 다른 패키지가 새로 섞이는 것은 여전히 이름(포함 여부)으로 막는다.
declare -a WF_PKG_EXPECT=(
  # afds 3회 = lint · test:run · verify:docs. figma-token-bridge 는 test:run 하나다.
  "afds-test.yml|packages/afds:3,packages/figma-token-bridge:1"
  "chromatic.yml|packages/afds:1"
  # 6 → 5: 자체 CLI 철거로 `Build` 스텝이 사라졌다(`build` 가 `generate:registry` 하나뿐이라
  # 정합 검증 스텝과 중복). **이름 목록(WF_SCRIPT_EXPECT)은 함께 줄이지 않는다** — 카운트는
  # "다른 패키지가 섞이는 것" 만 막고, 검사 소멸은 이름 단정이 막는다.
  "afds-registry-test.yml|packages/afds-registry:5,packages/afds:1"
  "release.yml|packages/afds-registry:1"
  "deploy-storybook.yml|apps/storybook:1"
)
WRONG=""
CHECKED=0
for pair in "${WF_PKG_EXPECT[@]}"; do
  f="${pair%%|*}"; spec="${pair##*|}"
  [ -f "$WF/$f" ] || { WRONG="${WRONG}${f}(파일 없음); "; continue; }

  # spec 은 "패키지:최소호출수" 를 콤마로 나열한 것 — 포함 검사용으로 패키지 이름만 뽑는다.
  allowed=",$(printf '%s' "$spec" | tr ',' '\n' | awk -F: '{print $1}' | tr '\n' ',')"
  # 파일을 직접 grep 하지 않는다 — yaml2json 을 거쳐야 주석 처리된 실행 줄이 빠진다(위 주석).
  calls="$(printf '%s' "$(yaml2json "$WF/$f")" | jq -r '.jobs[].steps[]? | (.run // "")' \
    | grep -oE 'pnpm-run\.sh [^ ]+' | awk '{print $2}')"

  while IFS= read -r dir; do
    [ -z "$dir" ] && continue
    CHECKED=$((CHECKED + 1))
    case "$allowed" in
      *",${dir},"*) ;;
      *) WRONG="${WRONG}${f} → ${dir} (등록되지 않은 패키지); " ;;
    esac
  done <<< "$calls"

  while IFS= read -r pm; do
    [ -z "$pm" ] && continue
    p="${pm%%:*}"; min="${pm##*:}"
    n="$(printf '%s\n' "$calls" | grep -c -F -x "$p")"
    [ "$n" -ge "$min" ] || WRONG="${WRONG}${f} → ${p} 호출 ${n}건 (최소 ${min}건 필요); "
  done <<< "$(printf '%s' "$spec" | tr ',' '\n')"
done
# 양성 대조군 — 한 줄도 못 읽었으면 이 검사가 무동작이다.
assert_eq "헬퍼 인자 대조군 — 호출을 1건 이상 읽었다" "true" "$([ "$CHECKED" -ge 1 ] && echo true || echo false)"
assert_eq "헬퍼가 그 워크플로의 패키지를 부르고, 등록된 최소 횟수를 채운다" "" "$WRONG"

echo "[검사 스텝이 이름으로 존재하고 무조건 실행되는가]"
# 위 최소 호출 수 검사는 `pnpm-run.sh <패키지>` **출현 횟수만** 세고 **어느 스크립트인지 보지
# 않는다.** 독립 리뷰가 우회 3종을 실증했다:
#
#   · `validate:registry` 스텝에 `if: false`      → 48/48 통과 (스텝이 절대 실행되지 않는다)
#   · 그 스텝을 `check-types` 호출로 치환(수 유지) → 48/48 통과 (규격 검사 소멸)
#   · 스텝 삭제(수 감소)                          → 잡힘
#
# 즉 삭제만 막고 치환·조건무력화는 못 막는다. 그래서 **스크립트 이름**으로 존재를 단정하고,
# 그 스텝에 `if:` 가 붙어 있지 않은지까지 본다. 조건부 검사는 검사가 아니다.
#
# grep 이 아니라 YAML 파서로 스텝 단위를 본다 — `run` 본문 안의 문자열과 스텝의 `if` 키를
# 구분해야 하는데 grep 은 그 둘을 구분하지 못한다.
declare -a WF_SCRIPT_EXPECT=(
  "afds-registry-test.yml|packages/afds-registry|generate:registry"
  "afds-registry-test.yml|packages/afds-registry|validate:registry"
  # lint 스텝. 조건이나 continue-on-error 로 건너뛸 수 없다.
  "afds-test.yml|packages/afds|lint"
  # 테스트 실행 스텝. 아래 [test:run 기대 집합 ↔ 실행 스텝] 은 「어딘가에 실행 스텝이 있다」만
  # 보고, 그 스텝의 `if:`·`continue-on-error` 는 여기서 막는다.
  "afds-test.yml|packages/afds|test:run"
  "afds-test.yml|packages/figma-token-bridge|test:run"
  "afds-registry-test.yml|packages/afds-registry|test"
)
SCRIPT_WRONG=""
SCRIPT_CHECKED=0
for spec in "${WF_SCRIPT_EXPECT[@]}"; do
  f="${spec%%|*}"; rest="${spec#*|}"; pkg="${rest%%|*}"; script="${rest##*|}"
  [ -f "$WF/$f" ] || { SCRIPT_WRONG="${SCRIPT_WRONG}${f}(파일 없음); "; continue; }
  J="$(yaml2json "$WF/$f")"
  PAT="pnpm-run.sh ${pkg} ${script}"

  n="$(printf '%s' "$J" | jq --arg pat "$PAT" '[.jobs[].steps[]? | select((.run // "") | contains($pat))] | length')"
  SCRIPT_CHECKED=$((SCRIPT_CHECKED + 1))
  [ "${n:-0}" -ge 1 ] || SCRIPT_WRONG="${SCRIPT_WRONG}${f} → '${script}' 호출 스텝 없음; "

  # `if:` 가 붙은 스텝은 조건에 따라 통째로 건너뛴다 — 그러면 검사가 있는 척만 한다.
  cond="$(printf '%s' "$J" | jq --arg pat "$PAT" '[.jobs[].steps[]? | select((.run // "") | contains($pat)) | select(has("if"))] | length')"
  [ "${cond:-0}" -eq 0 ] || SCRIPT_WRONG="${SCRIPT_WRONG}${f} → '${script}' 스텝에 if: 가 붙어 있다; "

  # `continue-on-error: true` 는 스텝을 **돌리되 실패를 삼킨다.** 결과는 `if: false` 와 같다 —
  # 검사가 빨간불을 낼 수 없으면 검사가 아니다. (독립 리뷰 B4 가 이 우회를 실증했다.)
  coe="$(printf '%s' "$J" | jq --arg pat "$PAT" '[.jobs[].steps[]? | select((.run // "") | contains($pat)) | select(has("continue-on-error"))] | length')"
  [ "${coe:-0}" -eq 0 ] || SCRIPT_WRONG="${SCRIPT_WRONG}${f} → '${script}' 스텝에 continue-on-error 가 붙어 있다; "
done
assert_eq "검사 스텝 대조군 — 규칙을 1건 이상 읽었다" "true" "$([ "$SCRIPT_CHECKED" -ge 1 ] && echo true || echo false)"
assert_eq "검사 스텝이 스크립트 이름으로 존재하고 조건 없이 실행된다" "" "$SCRIPT_WRONG"

echo "[test:run 기대 집합 ↔ 실행 스텝]"
# afds-test.yml 의 `assert-script-owners.sh test:run <패키지...>` 는 **워크스페이스에서 test:run
# 을 가진 패키지 전체**를 기대 집합으로 고정한다(양방향 — 헬퍼 머리 주석). 그런데 실행은
# 패키지별 스텝이고 afds-registry 는 **다른 워크플로**(afds-registry-test.yml)가 돌린다. 그래서 목록에
# 패키지를 더하고 실행 스텝을 빠뜨리면 헬퍼는 초록인데 그 패키지 테스트는 아무 데서도 안 돈다.
# 목록의 모든 패키지가 두 워크플로 중 하나에서 `pnpm-run.sh <패키지> test(:run)` 로 실행되는지
# 대조한다. afds-registry 의 `test` 와 `test:run` 은 둘 다 `vitest run` 이다.
#
# **`packages/*` 만이 아니라 `apps/*` 도 잡는다.** `assert-script-owners.sh` 는
# `scan("packages", 2); scan("apps", 1)` 로 둘 다 훑어 기대 집합을 만든다(스크립트 실측). 여기서
# `packages/` 만 보면 `apps/storybook` 이 목록에 들어오고 실행 스텝이 빠져도 이 절이 못 잡는다.
OWNERS_WRONG=""
AT="$(yaml2json "$WF/afds-test.yml")"
XT="$(yaml2json "$WF/afds-registry-test.yml")"
OWNERS="$(printf '%s' "$AT" | jq -r '.jobs[].steps[]? | (.run // "") | select(contains("assert-script-owners.sh test:run"))' \
  | tr '\n' ' ' | sed 's/\\/ /g' | grep -oE 'assert-script-owners\.sh test:run( +(packages|apps)/[^ ]+)+' \
  | tr -s ' ' '\n' | grep -E '^(packages|apps)/' | sort -u)"
assert_eq "기대 집합 대조군 — assert-script-owners 인자를 1개 이상 읽었다" "true" \
  "$([ -n "$OWNERS" ] && echo true || echo false)"
RUN_TEXT="$(printf '%s\n%s' "$AT" "$XT" | jq -r '.jobs[].steps[]? | (.run // "")')"
while IFS= read -r pkg; do
  [ -z "$pkg" ] && continue
  printf '%s\n' "$RUN_TEXT" | grep -qE "pnpm-run\.sh ${pkg} test(:run)?([[:space:]]|$)" \
    || OWNERS_WRONG="${OWNERS_WRONG}${pkg}; "
done <<< "$OWNERS"
assert_eq "test:run 기대 집합의 모든 패키지가 afds-test·afds-registry-test 중 한 곳에서 실행된다" "" "$OWNERS_WRONG"

# 정합 검사가 산출물을 실제로 대조하는지. (예전에는 산출물이 둘이었고 한쪽만 걸면 다른 쪽이
# 조용히 낡았다 — 자체 CLI 철거로 `src/registry/index.json` 이 사라져 지금은 하나다.)
DIFF_WRONG=""
J="$(yaml2json "$WF/afds-registry-test.yml")"
for target in "registry.json"; do
  # **인자로 좁힌다.** `contains` 만 쓰면 같은 run 블록의 **오류 메시지 문자열**에도 걸려,
  # `git diff --exit-code` 에서 인자를 통째로 빼도 통과한다(실측으로 확인한 우회다).
  n="$(printf '%s' "$J" | jq --arg t "$target" \
    '[.jobs[].steps[]? | select((.run // "") | test("git diff --exit-code[^\\n]*" + $t))] | length')"
  [ "${n:-0}" -ge 1 ] || DIFF_WRONG="${DIFF_WRONG}정합 검증이 '${target}' 을 대조하지 않는다; "

  # 인자를 그대로 둔 채 **실패만 삼키는** 형태가 남는다(독립 리뷰 N2):
  #
  #   git diff --exit-code registry.json || true \
  #     || { echo "::error::…"; exit 1; }
  #
  # 인자 단정은 만족하는데 드리프트를 삼킨다 — 실측: 원본은 EXIT=1, 이 형태는 **EXIT=0**.
  # 그래서 그 줄에 `|| true` 류가 붙지 않았는지 함께 본다.
  swallow="$(printf '%s' "$J" | jq --arg t "$target" \
    '[.jobs[].steps[]? | select((.run // "") | test("git diff --exit-code[^\\n]*" + $t)) | select((.run // "") | test("git diff[^\\n]*\\|\\|[ \\t]*(true|:)([ \\t\\\\]|$)"))] | length')"
  [ "${swallow:-0}" -eq 0 ] || DIFF_WRONG="${DIFF_WRONG}정합 검증이 '${target}' 의 실패를 삼킨다(|| true 류); "

  # 그리고 실패 경로가 실제로 잡을 내는지 — `exit 1` 이 같은 블록에 있어야 한다.
  # **주석은 세지 않는다.** `test("exit 1")` 은 run 본문 텍스트를 보므로
  # `|| { echo "::warning::…"; }  # exit 1` 처럼 **주석에만** 있어도 만족한다 —
  # 실측으로 확인한 우회다(55/55 통과하는데 드리프트를 삼킨다). 그래서 그 줄에 `#` 가
  # 앞서지 않는 것까지 본다. (셸 문법을 정규식으로 완전히 판정할 수는 없다 — 근본 해법은
  # 드리프트 픽스처로 스텝을 실제로 돌리는 자기검사이고 그건 이 검사의 범위 밖이다.)
  hard="$(printf '%s' "$J" | jq --arg t "$target" \
    '[.jobs[].steps[]? | select((.run // "") | test("git diff --exit-code[^\\n]*" + $t)) | select((.run // "") | test("(^|\\n)[^#\\n]*exit 1"))] | length')"
  [ "${hard:-0}" -ge 1 ] || DIFF_WRONG="${DIFF_WRONG}정합 검증에 exit 1 경로가 없다; "
done
assert_eq "정합 검증이 레지스트리 산출물을 대조한다" "" "$DIFF_WRONG"

# 스텝을 아무리 단정해도 **잡이 통째로 건너뛰면** 그 잡의 모든 게이트가 함께 죽는다.
# 위 스텝 단위 검사는 `.jobs[].steps[]` 만 보므로 잡의 `if` 를 보지 못한다(독립 리뷰 B5).
# 이건 이번 변경이 만든 구멍이 아니라 **선재 구멍**이고 스텝을 단정하는 모든 검사에 공통이라,
# 특정 워크플로가 아니라 **워크플로 전체**에 건다.
#
# 정당한 잡 `if` 는 허용 목록으로 **이름을 적어** 통과시킨다. 새 잡 `if` 는 목록에 없으면
# 실패하므로, 조용히 늘어나지 않고 반드시 근거와 함께 추가된다.
#
# **이름만 허용하면 값이 무방비다.** 독립 리뷰가 실증했다 — `ci.yml` 의 `afds-registry` 잡 `if` 를
# `needs.changes.outputs.afds_registry == 'true'` → `false` 로 바꿔도 이름은 그대로라 통과했고,
# 그러면 그 잡의 정합 검증·`validate:registry`·check-types·lint·test·build 가 **전부 죽는다.**
# 그래서 `워크플로|잡|기대값` 3-튜플로 **값까지** 대조한다.
declare -a JOB_IF_ALLOW=(
  # ci.yml 의 세 개는 이 저장소의 **변경 축 디스패치** 그 자체다.
  # afds/afds-registry 는 `changes` job 의 판정으로 실행 여부를 정한다(경로 무관 PR 에서 안 돌린다).
  # → 그 판정을 실제로 참조하는지 값으로 고정한다. `false` 같은 상수 치환이 여기서 막힌다.
  "ci.yml|afds|needs.changes.outputs."
  "ci.yml|afds-registry|needs.changes.outputs."
  # gate 는 `always()` 라 앞선 잡이 실패·건너뜀이어도 **반드시 돌아** 결과를 집계한다.
  # (값 고정은 위 `gate 는 if: always()` 단언이 이미 하고 있고, 여기서도 겹쳐 둔다.)
  "ci.yml|gate|always"
)
JOB_IF_WRONG=""
JOB_IF_CHECKED=0
for wf in "$WF"/*.yml; do
  wfname="$(basename "$wf")"
  JJ="$(yaml2json "$wf")"
  [ -n "$JJ" ] || { JOB_IF_WRONG="${JOB_IF_WRONG}${wfname}(파싱 실패); "; continue; }
  while IFS= read -r jobname; do
    [ -z "$jobname" ] && continue
    JOB_IF_CHECKED=$((JOB_IF_CHECKED + 1))
    key="${wfname}|${jobname}"
    want=""
    for a in "${JOB_IF_ALLOW[@]}"; do
      [ "${a%|*}" = "$key" ] && want="${a##*|}" && break
    done
    if [ -z "$want" ]; then
      JOB_IF_WRONG="${JOB_IF_WRONG}${key} 에 잡 레벨 if 가 있다(허용 목록에 없음); "
      continue
    fi
    actual="$(printf '%s' "$JJ" | jq -r --arg j "$jobname" '.jobs[$j].if // ""')"
    case "$actual" in
      *"$want"*) ;;
      *) JOB_IF_WRONG="${JOB_IF_WRONG}${key} 의 if 값이 '${want}' 를 담지 않는다(실제: '${actual}'); " ;;
    esac
  done <<< "$(printf '%s' "$JJ" | jq -r '.jobs | to_entries[] | select(.value | has("if")) | .key')"
done
# 대조군 — 허용 목록의 3개는 실제로 존재해야 한다. 0건이면 이 검사가 아무것도 안 본 것이다.
assert_eq "잡 if 대조군 — 잡 레벨 if 를 1건 이상 읽었다" "true" "$([ "$JOB_IF_CHECKED" -ge 1 ] && echo true || echo false)"
assert_eq "잡 레벨 if 는 허용 목록에 적힌 것만 있다" "" "$JOB_IF_WRONG"

echo "[호출 지점이 아니라 피호출자도 고정한다]"
# 워크플로가 `pnpm-run.sh <패키지> <스크립트>` 를 부르는 것을 고정해도, **그 스크립트가
# 무엇을 하는지는 고정되지 않는다.** `validate:registry` 를 `echo skipped` 로 바꾸면
# 워크플로 검사는 전부 통과한다(독립 리뷰 B6). 그래서 피호출자의 본문을 단정한다.
#
# **부분 문자열로는 부족하다.** 독립 리뷰가 실증한 우회 셋은 전부 그 문자열을 담고도 실효가 0 이다:
#
#   echo shadcn registry validate            → 출력만 한다
#   # shadcn registry validate               → 주석이라 아무것도 안 한다
#   true || shadcn registry validate …       → 앞이 참이라 뒤가 절대 실행되지 않는다
#
# 특히 뒤 둘은 **코드리뷰에서도 눈에 잘 안 띈다.** 그래서 "포함" 이 아니라 **그 명령으로 시작**
# 하는지로 좁힌다 — 셋 다 한 번에 막힌다.
#
# 셸은 늘 우회 가능하므로 완벽을 노리지 않는다. 목표는 우회 난이도를 **"눈에 안 띄는 한 단어"**
# 에서 **"명백히 수상한 문장"** 으로 올리는 것이다.
PKG_JSON="$HERE/../../../packages/afds-registry/package.json"
declare -a SCRIPT_BODY_EXPECT=(
  "validate:registry|shadcn registry validate"
  "generate:registry|tsx scripts/generate-manifest.ts"
)
BODY_WRONG=""
BODY_CHECKED=0
if [ -f "$PKG_JSON" ]; then
  for spec in "${SCRIPT_BODY_EXPECT[@]}"; do
    key="${spec%%|*}"; must="${spec##*|}"
    body="$(jq -r --arg k "$key" '.scripts[$k] // ""' "$PKG_JSON")"
    BODY_CHECKED=$((BODY_CHECKED + 1))
    case "$body" in
      "$must"*) ;;
      *) BODY_WRONG="${BODY_WRONG}scripts.${key} 가 '${must}' 로 시작하지 않는다(실제: '${body}'); " ;;
    esac
  done
else
  BODY_WRONG="packages/afds-registry/package.json 이 없다; "
fi
assert_eq "피호출자 대조군 — 스크립트를 1건 이상 읽었다" "true" "$([ "$BODY_CHECKED" -ge 1 ] && echo true || echo false)"
assert_eq "레지스트리 검사 스크립트가 그 도구로 시작한다" "" "$BODY_WRONG"

echo "[액션 고정]"
# **패턴을 앵커한다.** `uses: [^ ]+` 만 쓰면 `statuses: write` 가 걸린다 — `stat` + `uses: write`
# 로 부분 문자열이 맞기 때문이다. 실측: react-doctor.yml 의 `statuses: write` 가
# 「미고정 액션 write」로 보고됐다. 이 저장소는 `git push` 를 부분 문자열로 매칭해
# `git -C <path> push` 를 놓친 전례가 있다(배선되지 않아 삭제된 `git-push-changeset-guard.sh` 훅에서).
#
# **범위를 `ci.yml` 이 아니라 전체로 둔다.** 아래 「핀 일치」 검사만 전체를 돌던 탓에
# **새 워크플로의 고정 여부는 아무도 강제하지 않았다** — 일치는 두 곳이 같은 값을 쓰는지만 보고,
# 한 곳뿐인 액션은 태그여도 통과한다.
# **텍스트가 아니라 YAML 파서로 뽑는다.** 이 파일 머리가 이미 그 원칙을 적어 뒀는데
# 이 검사만 grep 이었다. grep 은 `uses:` 앞 문자를 앵커로 가리므로 **유효한 YAML 인데
# 못 보는 형태가 있다** — 실측(`0ff2ef6`):
#
#   - uses: x            잡음      [{ uses: x }]   잡음(중괄호 뒤 공백이 앵커에 걸린다)
#     uses: x            잡음      [{uses: x}]     **놓침**(앞 문자가 `{`)
#                                  - "uses": x     **놓침**(앞 문자가 `"`)
#
# 앵커를 넓히면 `statuses: write` 가 다시 걸린다(`stat` + `uses: write`). 즉 앵커를
# 조이면 형태를 놓치고 풀면 오탐이 난다 — **텍스트로는 양쪽을 동시에 만족할 수 없다.**
#
# 파서는 `uses` 가 **키**임을 알므로 둘 다 해결된다. 되돌리지 마라.

# job 레벨(`uses:` 로 재사용 워크플로 호출)과 스텝 레벨을 **둘 다** 모은다 — ci.yml 이
# 두 형태를 다 쓴다. 한쪽만 보면 그만큼이 조용히 검사 밖으로 나간다.
USES_ALL=""
USES_COUNT=0
PARSE_FAIL=""
for wf in "$WF"/*.yml; do
  J="$(yaml2json "$wf")"
  [ -n "$J" ] || { PARSE_FAIL="${PARSE_FAIL}$(basename "$wf") "; continue; }
  U="$(printf '%s' "$J" | jq -r '[(.jobs[]? | select(.uses) | .uses), (.jobs[]?.steps[]? | select(.uses) | .uses)] | .[]')"
  [ -z "$U" ] && continue
  USES_ALL="${USES_ALL}${U}
"
  USES_COUNT=$((USES_COUNT + $(printf '%s' "$U" | grep -c .)))
done
# 파싱 실패를 통과로 흘리지 않는다. 위 `jobs ⊄ needs` 검사는 ci.yml 하나만 보므로
# 다른 워크플로가 깨져도 여기까지 온다.
assert_eq "액션 고정 — 파싱 실패한 워크플로 0건" "" "${PARSE_FAIL% }"
# 0건을 읽고 통과하는 것이 최악이다. 파서 경로가 바뀌거나 jq 표현이 어긋나면 여기서 걸린다.
assert_eq "액션 고정 대조군 — uses 를 1건 이상 읽었다" "true" \
  "$([ "$USES_COUNT" -ge 1 ] && echo true || echo false)"

# 로컬 워크플로 호출(`./.github/workflows/*.yml`)은 고정 대상이 아니다 — 같은 저장소의
# 같은 커밋을 쓴다.
EXTERNAL="$(printf '%s' "$USES_ALL" | grep -v '^\./' | grep -v '^$' | sort -u)"

UNPINNED="$(printf '%s' "$EXTERNAL" | grep -vE '@[0-9a-f]{40}$' | tr '\n' ' ')"
assert_eq "모든 워크플로의 외부 액션은 전부 SHA 고정" "" "${UNPINNED% }"

# 형식만 보면 **지어낸 SHA 도 통과한다** — 실제로 그런 실수를 했다. 같은 액션이 워크플로
# 간에 서로 다른 핀을 쓰고 있으면 하나는 검증되지 않은 값일 가능성이 높으므로 대조한다.
# (핀을 올릴 때는 모든 워크플로를 함께 올린다는 규약이기도 하다.)
INCONSISTENT="$(printf '%s' "$EXTERNAL" | grep -E '@[0-9a-f]{40}$' \
  | awk -F'@' '{print $1"\t"$2}' | sort -u \
  | awk -F'\t' '{c[$1]=c[$1]" "$2} END {for (a in c) {n=split(c[a],p," "); if (n>1) printf "%s(%s) ", a, c[a]}}')"
assert_eq "같은 액션의 SHA 핀이 워크플로 간에 일치한다" "" "$INCONSISTENT"

# 위 다섯 형태를 실제로 먹여 고정한다. 실재 워크플로는 전부 평범한 형태라 **경계 두 개가
# 밟히는 입력이 없다** — 구현 형태가 유일한 보호막인 상태를 만들지 않는다.
PIN_FIX="$(mktemp -d)"
cat > "$PIN_FIX/f.yml" <<'YAML'
jobs:
  a:
    steps:
      - uses: pinned/ok@1111111111111111111111111111111111111111
      - uses: unpinned/plain@v4
      - name: x
        uses: unpinned/nested@v1
  b:
    steps: [{uses: unpinned/flow-nospace@v3}]
  c:
    steps: [{ uses: unpinned/flow-space@v6 }]
  d:
    steps:
      - "uses": unpinned/quoted@v5
    permissions:
      statuses: write
  e:
    uses: ./.github/workflows/local.yml
YAML
FIX_J="$(yaml2json "$PIN_FIX/f.yml")"
FIX_U="$(printf '%s' "$FIX_J" | jq -r '[(.jobs[]? | select(.uses) | .uses), (.jobs[]?.steps[]? | select(.uses) | .uses)] | .[]' | sort | tr '\n' ' ')"
rm -rf "$PIN_FIX"
assert_eq "픽스처 — 다섯 형태와 로컬 호출을 모두 뽑는다" \
  "./.github/workflows/local.yml pinned/ok@1111111111111111111111111111111111111111 unpinned/flow-nospace@v3 unpinned/flow-space@v6 unpinned/nested@v1 unpinned/plain@v4 unpinned/quoted@v5 " \
  "$FIX_U"
assert_eq "픽스처 — statuses: write 를 액션으로 세지 않는다" "0" \
  "$(printf '%s' "$FIX_U" | tr ' ' '\n' | grep -c '^write$')"

echo "[필수 체크 후보의 트리거 정합]"
CS="$(yaml2json "$WF/changeset-check.yml")"
cson="$(printf '%s' "$CS" | ON)"
assert_eq "changeset-check 트리거 대조군 — 키가 1개 이상" "true" "$(printf '%s' "$cson" | jq -r '(keys|length) >= 1')"
assert_eq "changeset-check 에 paths 없음" "null" "$(printf '%s' "$cson" | jq -c '.pull_request.paths // "null"' | tr -d '"')"
BR_CI="$(printf '%s' "$CI_JSON" | ON | jq -c '.pull_request.branches')"
assert_eq "브랜치 목록 대조군 — 비어 있지 않다" "true" "$([ "$BR_CI" != "null" ] && echo true || echo false)"
assert_eq "ci.yml 과 changeset-check 의 base 브랜치 목록이 같다" \
  "$BR_CI" "$(printf '%s' "$cson" | jq -c '.pull_request.branches')"

echo "[릴리스 범프의 git 작업이 로컬 훅에 막히지 않는다]"
# 범프 커밋은 정의상 "패키지 변경 + changeset 0건" 이라 lefthook pre-push 가 절대 통과하지
# 못한다. `pnpm install` 의 `prepare: lefthook install` 이 러너에도 훅을 설치하므로 CI 에서도 돈다.
# 실측: run 33491773296 이 이 지점에서 죽어 배포 스텝 전부 skip 됐다. 되돌아가지 않게 못 박는다.
REL_RAW="$(cat "$WF/release.yml")"
GIT_PUSH_N="$(printf '%s\n' "$REL_RAW" | grep -cE '^[[:space:]]*git push ' || true)"
assert_eq "release.yml 의 git push 대조군 — 1건 이상 찾았다" "true" \
  "$([ "${GIT_PUSH_N:-0}" -ge 1 ] && echo true || echo false)"
PUSH_BARE="$(printf '%s\n' "$REL_RAW" | grep -E '^[[:space:]]*git push ' | grep -vc -- '--no-verify' || true)"
assert_eq "release.yml 의 모든 git push 가 --no-verify 를 쓴다" "0" "${PUSH_BARE:-0}"
GIT_COMMIT_N="$(printf '%s\n' "$REL_RAW" | grep -cE '^[[:space:]]*git commit ' || true)"
assert_eq "release.yml 의 git commit 대조군 — 1건 이상 찾았다" "true" \
  "$([ "${GIT_COMMIT_N:-0}" -ge 1 ] && echo true || echo false)"
COMMIT_BARE="$(printf '%s\n' "$REL_RAW" | grep -E '^[[:space:]]*git commit ' | grep -vc -- '--no-verify' || true)"
assert_eq "release.yml 의 모든 git commit 이 --no-verify 를 쓴다" "0" "${COMMIT_BARE:-0}"

echo "[run 본문에 \${{ }} 보간 금지 — 셸 인젝션]"
# git 은 브랜치 이름에 `;` `$` `` ` `` `&` `|` `(` `)` 를 허용한다. 그 값을 run 본문에
# 직접 보간하면 셸 문법으로 해석된다. 값은 env 로 넘기고 인용해서 쓴다.
# 실측(2026-09-01): 레포 전체에서 위반은 release.yml 2건뿐이었고 그것을 고친 뒤 0건이다.
RUN_STEPS=0
INJECT=""
for wf in "$WF"/*.yml; do
  J="$(yaml2json "$wf")"
  N="$(printf '%s' "$J" | jq -r '[.jobs[]?.steps[]? | select(.run)] | length')"
  RUN_STEPS=$((RUN_STEPS + ${N:-0}))
  BAD="$(printf '%s' "$J" | jq -r --arg f "$(basename "$wf")" \
    '[.jobs[]?.steps[]? | select(.run) | select(.run | test("\\$\\{\\{")) | ($f + ":" + (.name // "(무명)"))] | .[]')"
  [ -n "$BAD" ] && INJECT="$INJECT $BAD"
done
assert_eq "run 스텝 대조군 — 1건 이상 읽었다" "true" \
  "$([ "$RUN_STEPS" -ge 1 ] && echo true || echo false)"
assert_eq "run 본문에 \${{ }} 를 보간하는 스텝 0건" "" "$(printf '%s' "$INJECT" | sed 's/^ *//')"

# ── run-all.sh 의 스위트 목록 ↔ 디렉터리의 *.test.sh (양방향) ─────────────────
#
# **왜 여기인가.** `run-all.sh` 는 스위트 이름을 하드코딩해 돌리므로 **파일을 지우면**
# `EXIT=1` 이다. 그런데 **목록에서 이름을 빼면 조용하다** — 실측: `mutation` 을 목록에서
# 뺐더니 「스위트 4개 실행」으로 통과했고 다른 검사도 전부 통과했다. 그 자리를 `run-all.sh`
# 자신이 막을 수는 없다(빠진 이름은 그 스크립트에 존재하지 않는다).
#
# 그래서 **이미 목록에 있는 스위트**가 대조한다. 이 파일이 지워지면 `run-all.sh` 가 잡고,
# 이 파일이 목록에서 빠지면 그때는 아무도 잡지 못한다 — **거기가 재귀의 종점이고 diff 가
# 방어다.** 한 단계라도 닫는 것이 안 닫는 것보다 낫다.
#
# **개수로 쓰지 않는다.** 양쪽 집합을 이름으로 비교한다.
RUN_ALL="$HERE/run-all.sh"
LISTED="$(sed -n 's/^for suite in \(.*\); do$/\1/p' "$RUN_ALL" | tr ' ' '\n' | grep -v '^$' | sort)"
PRESENT="$(cd "$HERE" && ls *.test.sh 2>/dev/null | sed 's/\.test\.sh$//' | sort)"
assert_eq "대조군 — run-all.sh 에서 스위트 목록을 읽었다" "true" \
  "$([ -n "$LISTED" ] && echo true || echo false)"
assert_eq "대조군 — 디렉터리에서 *.test.sh 를 읽었다" "true" \
  "$([ -n "$PRESENT" ] && echo true || echo false)"
assert_eq "목록에 있는데 파일이 없는 스위트 0건" "" \
  "$(comm -23 <(printf '%s\n' "$LISTED") <(printf '%s\n' "$PRESENT") | tr '\n' ' ' | sed 's/ *$//')"
assert_eq "파일이 있는데 목록에 없는 스위트 0건 (조용히 안 도는 스위트)" "" \
  "$(comm -13 <(printf '%s\n' "$LISTED") <(printf '%s\n' "$PRESENT") | tr '\n' ' ' | sed 's/ *$//')"

# 바닥값 — 스위트가 도중에 죽으면 단언이 모자라고, 그때 초록이 되지 않게 한다.
# **실제 수와 붙여 둔다.** 53 으로 느슨하던 동안 실제는 73 이었다 — 그 상태에서는
# 54번째 단언부터 전부 사라져도 통과한다.
finish 87
