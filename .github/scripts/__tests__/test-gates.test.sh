#!/usr/bin/env bash
# **게이트 성격의 vitest 파일 집합을 이름으로 고정한다.**
#
# ## 왜 필요한가 — 축 간 비대칭 (#170)
#
# 셸 축은 이름으로 고정된다 — `run-all.sh` 가 스위트 이름을 하드코딩하므로 파일을 지우면
# `EXIT=1` 이다. **vitest 축은 글롭 수집이라 파일을 지우면 조용히 줄어든다** — 실측
# (`e804d7d`): 아래 목록의 `rule-globs.test.ts` 를 지우면 `afds test:run` 이 파일 수만
# 하나 줄고(72 → 71) **exit 0** 이며 `verify:docs` 를 포함한 다른 검사도 전부 통과했다.
# 즉 **게이트를 우회하는 가장 쉬운 방법이 그 파일을 지우는 것**이다.
#
# ## 왜 셸인가
#
# **vitest 로 쓰면 자기가 닫으려는 구멍에 자기가 빠진다.** 셸로 쓰면 `run-all.sh` 목록이
# 이 파일의 존재를 잡는다(그 목록 자체는 `ci-structure` 가 디렉터리와 양방향 대조한다).
#
# ## 무엇을 목록에 넣는가 — 다음 사람이 판단할 수 있어야 한다
#
# 「이것이 없으면 무언가가 조용히 통과한다」로 잡으면 **저장소의 테스트 파일 전부**가
# 해당한다 — 회귀 테스트는 다 그렇다. 그래서 두 갈래로 좁혔다.
#
#   (a) **트리·산출물 전체를 훑는 단정** — 파일이 추가되면 적용 범위가 **자동으로 늘어난다.**
#       지우면 그 정책이 트리 전체에서 사라진다.
#   (b) **기록된 결정의 전제인 헬퍼 계약** — 현재 `citation-drift` 하나뿐이다(아래).
#
# **넣지 않는 것**: 개별 컴포넌트·훅의 동작, 특정 파일의 과거 회귀. 지워도 그 하나만 잃는다.
#
# 그래서 `composition-files`·`derive-dependencies`·`transform`·`spec-description` 은
# **빠져 있다** — 생성기가 의존하는 헬퍼 계약이지만, 지워도 정책이 트리 전체에서 사라지지
# 않고 `registry-consistency`·`shadcn-registry-closure` 가 산출물을 대조하므로 결과가
# 조용하지 않다. **「일관성」을 이유로 그것들을 추가하지 마라** — 기준이 (a)·(b) 다.
#
# ## ★ 이 목록이 신뢰 경계다
#
# 이 목록은 **정본**이다. 항목을 빼는 것을 막는 기계는 없다 — 디렉터리에 파일이 그대로
# 있으므로 대조할 상대가 없다. **diff 에 드러나는 것이 방어다.** `mustCover` ·
# `WF_SCRIPT_EXPECT` · `KNOWN_MISSING_TESTS` 와 같은 종류의 환원 불가능한 비용이다.
# 「래칫」이라는 말이 기계적 잠금을 함의하지만 **여기에 잠금은 없다.**
#
# **★ 항목을 뺄 때 함께 할 일 — 왜 게이트가 아니게 됐는지 그 줄에 적고 지워라.**
# 이름을 빼는 사람은 아무 실패도 보지 않으므로(그것이 위의 「잠금이 없다」다) 실패 메시지에
# 적힌 안내가 닿지 않는다. 그래서 목록을 읽는 자리에 적어 둔다. 근거를 남기지 않은 삭제는
# 리뷰에서 되돌려라 — 그 판단이 남지 않으면 다음 사람이 같은 자리를 또 판단해야 한다.
#
# ## 왜 한 방향만 검사하는가
#
# `assert-script-owners.sh` 는 양방향(목록에 있는데 없다 / 있는데 목록에 없다)이지만
# 여기서는 **「목록에 있는데 파일이 없다」만** 검사한다. 게이트가 아닌 테스트 파일이
# 정당하게 **다수** 존재하므로 역방향은 오류가 아니다. 새 게이트를 만들면
# **사람이 이 목록에 적어야 한다** — 그것을 강제하는 기계는 없다(위 신뢰 경계).
#
# **개수로 쓰지 않는다.** "16개면 통과" 는 하나가 빠지고 하나가 늘면 그대로 통과한다.

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$HERE/lib.sh"
SUITE="test-gates"

# `GATES_ROOT` 는 **아래 자기검사만** 쓴다(`ci-structure` 의 `CI_YML` 선례). 실재 트리는
# 전부 보유하고 있어 **`ng` 분기가 한 번도 실행되지 않는다** — 판정 방향의 근거가 없는
# 상태다. 합성 트리를 먹여 그 분기를 실제로 밟는다. 값이 설정돼 있으면 자식 실행이다.
CHILD="${GATES_ROOT:+yes}"
ROOT="${GATES_ROOT:-$(cd "$HERE/../../.." && pwd)}"

# ── 게이트 목록 (정본) ────────────────────────────────────────────────────────
# 각 줄에 「무엇이 조용해지는가」를 적는다 — 이유 없는 이름은 다음 사람이 지운다.
GATES=(
  # (a) afds — 트리·산출물 전체
  "packages/afds/scripts/__test__/eslint-globs.test.ts|eslint 설정의 디렉터리 글롭이 죽어도 조용하다"
  "packages/afds/scripts/__test__/rule-globs.test.ts|.claude/rules 글롭이 죽어 규칙이 통째로 꺼져도 조용하다"
  "packages/afds/scripts/__test__/tokens-manifest.test.ts|매니페스트가 tokens/*.css 와 갈라져도 조용하다"
  "packages/afds/scripts/__test__/orphan-jsdoc.test.ts|아무것에도 붙지 않는 JSDoc 이 다시 늘어도 조용하다"
  "packages/afds/scripts/__test__/lint-ratchet.test.ts|`lint` 가 `eslint .` 로 되돌아가 afds 경고 래칫이 꺼져도 조용하다"
  "packages/afds/src/lib/__test__/story-determinism.test.ts|비결정적 스토리가 트리 어디에 생겨도 조용하다"
  "packages/afds/src/lib/__test__/wrapping-contract.test.ts|래핑 계약 위반이 트리 어디에 생겨도 조용하다"
  "packages/afds/src/bricks/form/calendar/__test__/story-date-independence.test.tsx|실행 날짜에 의존하는 스토리가 조용하다"
  # (a) afds-registry — 트리·산출물 전체
  "packages/afds-registry/src/__tests__/composition-stories.test.ts|스토리 없는 컴포지션이 등록돼도 조용하다"
  "packages/afds-registry/src/__tests__/composition-tests.test.ts|테스트 없는 컴포지션이 늘어도 조용하다(래칫)"
  "packages/afds-registry/src/__tests__/arbitrary-token-ratchet.test.ts|Tailwind 임의 값 래칫이 파일째 사라져도 조용하다"
  "packages/afds-registry/src/__tests__/type-bypass-ratchet.test.ts|타입 우회·lint 비활성 래칫이 파일째 사라져도 조용하다"
  "packages/afds-registry/src/__tests__/registry-consistency.test.ts|registry.json 이 소스와 갈라져도 조용하다"
  "packages/afds-registry/src/__tests__/shadcn-registry-closure.test.ts|전이 폐쇄·의존성·docs 누락이 조용하다"
  "packages/afds-registry/src/__tests__/docs-import-truth.test.ts|문서가 치환되지 않는 import 를 안내해도 조용하다"
  "packages/afds-registry/src/__tests__/guard.test.ts|생성 가드(루트 배럴·치환 규칙·override 실존)가 조용해진다"
  "packages/afds-registry/src/lib/__test__/story-determinism.test.ts|컴포지션 스토리의 비결정성이 조용하다"
  "packages/afds-registry/src/lib/__test__/wrapping-contract.test.ts|컴포지션의 래핑 계약 위반이 조용하다"
  "packages/afds-registry/src/compositions/__test__/story-date-independence.test.tsx|날짜 의존 컴포지션 스토리가 조용하다"
  # (b) 기록된 결정의 전제 — 이것만 헬퍼 계약이다
  #
  # #196 은 「어긋남 상한 게이트를 넣지 않는다」로 결정했고 그 근거가 **「정정 후 최대
  # 11줄」** 이다. 그 값은 드리프트 판정이 **최근접 매칭**이라는 전제에 서 있다. 첫 등장
  # 매칭으로 되돌아가면 관측 최대가 233줄로 튀고 **그 결정도 무효가 되는데**, 이 픽스처가
  # 없으면 아무것도 알아채지 못한다. 그래서 (b) 로 넣었다 — 「헬퍼 계약이니 일관성」이
  # 아니라 **기록된 결정의 전제라서** 다.
  "packages/afds/scripts/__test__/citation-drift.test.ts|#196 의 「게이트 불필요」 판정의 전제가 조용히 무효가 된다"
  #
  # #192 는 「완전 모드 실패 0 이므로 CI 배선은 **선택**」으로 결정했고(`harness.md` §9),
  # 그 전제가 **약칭을 경로 접미사로 해소한다**는 것이다. 되돌리면 완전 모드가 8건으로
  # 돌아가 그 결정이 무효가 되는데 — **CI 는 그것을 보지 못한다.** 실측: `uniqueBySuffix`
  # 를 무력화하면 CI 모드가 `EXIT=0` · 실패 0 이고 **강제 인용 수만 조용히 줄어든다**
  # (경로 99 → 94 · 줄인용 134 → 121 · 미검증 62 → 65). 완전 모드는 CI 에서 돌지 않으므로
  # 아무것도 실패하지 않는다. 그래서 (b) 다.
  #
  # **`citation-antecedent.test.ts` 는 넣지 않았다** — 같은 이슈의 형제 픽스처지만 기준을
  # 통과하지 못한다. 그 규칙을 되돌리면 `knownContentLoss` 의 `toast.tsx:89` 가 **죽은
  # 예외**가 되어 CI 모드가 `EXIT=1` 로 잡는다(실측). **조용하지 않으므로 (b) 가 아니다.**
  # 「형제니까 일관성」으로 추가하지 마라 — 위 기준이 (a)·(b) 다.
  "packages/afds/scripts/__test__/path-resolve.test.ts|#192 의 「배선은 선택」 판정의 전제(약칭 접미사 해소)가 조용히 무효가 된다"
)

MISSING=()
for entry in "${GATES[@]}"; do
  rel="${entry%%|*}"
  why="${entry#*|}"
  if [ -f "$ROOT/$rel" ]; then
    ok "$rel"
  else
    MISSING+=("$rel — 없으면: $why")
  fi
done

if [ "${#MISSING[@]}" -gt 0 ]; then
  ng "게이트 테스트 파일이 사라졌다" "${MISSING[@]}" \
    "이 파일들은 vitest 글롭으로 수집되므로 지우면 테스트 수만 줄고 **전부 통과한다.**" \
    "의도한 삭제라면 이 목록에서도 함께 빼고 왜 게이트가 아니게 됐는지 적어라."
fi

# 대조군 — 목록을 실제로 돌았는가. 0 이면 위 루프가 죽은 것이고 "위반 0건" 이 무의미하다.
assert_eq "대조군 — 게이트 목록을 1건 이상 검사했다" "true" \
  "$([ "${#GATES[@]}" -ge 1 ] && echo true || echo false)"

# ── 자기검사 — 파일이 없을 때 정말 실패하는가 ─────────────────────────────────
#
# 위 게이트 항목은 **전부 통과하는 입력**만 본다. `ng` 분기·`MISSING` 판정·메시지의 파일 이름은
# 실재 트리에서 밟히지 않으므로 **구현 형태가 유일한 보호막**이다. `if [ "${#MISSING[@]}"
# -gt 0 ]` 를 `if false` 로 바꿔도 실재 트리에서는 아무 검사도 실패하지 않는다.
#
# 그래서 자기 자신을 합성 트리에 대고 돌린다. 픽스처의 경로는 **`GATES` 배열에서 뽑는다** —
# 손으로 적으면 목록과 갈라져 「없는 파일을 지우는」 픽스처가 된다.
if [ -z "$CHILD" ]; then
  echo "[자기검사 — 합성 트리]  [의도]"
  SELF_WORK="$(mktemp -d)"
  trap 'rm -rf "$SELF_WORK"' EXIT

  # 완전한 트리 (음성 대조군) — 목록의 모든 경로를 빈 파일로 만든다. 검사는 `-f` 뿐이다.
  FULL="$SELF_WORK/full"
  for entry in "${GATES[@]}"; do
    rel="${entry%%|*}"
    mkdir -p "$FULL/$(dirname "$rel")" && : > "$FULL/$rel"
  done
  # 불완전한 트리 (양성 대조군) — 완전한 트리를 복사하고 **첫 항목 하나만** 지운다.
  VICTIM="${GATES[0]%%|*}"
  LACK="$SELF_WORK/lack"
  cp -R "$FULL" "$LACK" && rm -f "$LACK/$VICTIM"

  assert_eq "픽스처 — 완전한 트리에 첫 항목이 있다" "yes" \
    "$([ -f "$FULL/$VICTIM" ] && echo yes || echo no)"
  assert_eq "픽스처 — 불완전한 트리에서 첫 항목이 지워졌다" "yes" \
    "$([ ! -f "$LACK/$VICTIM" ] && echo yes || echo no)"

  SELF_OUT="$(GATES_ROOT="$FULL" bash "${BASH_SOURCE[0]}" 2>&1)"; SELF_RC=$?
  assert_eq "완전한 트리를 먹이면 통과한다 (거짓 실패가 아니다)" "0" "$SELF_RC"

  SELF_OUT="$(GATES_ROOT="$LACK" bash "${BASH_SOURCE[0]}" 2>&1)"; SELF_RC=$?
  # **건초더미를 grep 으로 좁히지 않는다** — 필터가 무언가를 가릴 수 있고, 실패 경로에서는
  # 자식 전체 출력이 근거로 쓸모 있다. 대신 **표식으로 감싼다**: 단정이 실패하면 `ng` 가
  # 건초더미를 그대로 토해내는데, 그 안의 `통과 N / 실패 N` 이 **스위트 자기 집계처럼
  # 보인다**(부모 요약은 맨 끝에 나온다). 표식 한 줄로 증거를 다 남기면서 오독을 없앤다.
  # 표식 문구에는 아래 needle 이 들어가지 않는다 — 들어가면 건초더미가 스스로를 만족시킨다.
  #
  # **여는 표식만 둔다.** `assert_contains` 는 건초더미를 `head -20` 으로 잘라 출력하므로
  # (`lib.sh:40`) 닫는 표식은 **원리적으로 보이지 않는다** — 실측으로 확인했다. 안 보이는
  # 표식을 소스에 남기면 다음 사람이 「출력이 잘렸나」를 다시 조사한다.
  SELF_OUT="── 이하 자식 실행 출력 (아래 「통과 N / 실패 N」 은 자식의 것이다) ──
${SELF_OUT}"
  # **종료코드만 보면 실패의 출처를 가릴 수 없다.** 파일이 하나 없으면 `ok` 도 하나 줄어서
  # `finish` 의 **단언 하한**(21 < 22)이 먼저 실패한다 — `MISSING` 분기를 `if false` 로
  # 죽여도 자식은 여전히 `EXIT=1` 이다. 그래서 종료코드 단정은 이름을 낮춰 두고,
  # **판정 자체는 `ng` 제목으로 고정한다.** (#203 리뷰 지적)
  assert_eq "자식이 0 을 내지 않는다 (실패의 출처는 아래에서 가린다)" "fail" \
    "$([ "$SELF_RC" -ne 0 ] && echo fail || echo pass)"
  assert_contains "게이트 파일이 없으면 MISSING 분기가 실패시킨다" "$SELF_OUT" \
    "게이트 테스트 파일이 사라졌다"
  # 실패했다는 것만으로는 부족하다 — **어느 파일인지** 알려주지 않으면 따라갈 수 없다.
  assert_contains "실패 메시지가 사라진 파일을 이름으로 지목한다" "$SELF_OUT" "$VICTIM"
fi

# 자식 실행은 21 + 대조군 1 = 22, 부모는 자기검사 6건이 더 붙어 28 이다. 실행 경로별로 최소치를
# 달리 적는다 — 하나로 적으면 큰 쪽이 자식에서 실패하거나 작은 쪽이 부모를 안 지킨다.
if [ -n "$CHILD" ]; then finish 22; else finish 28; fi
