#!/usr/bin/env bash
# CI 오케스트레이터의 경로 관련성(relevance) 판정 — 저장소에서 이 판정을 하는 유일한 곳.
#
# ## fail-closed 가 이 스크립트의 설계 원칙이다
#
# relevance 를 잘못 판정하면 필요한 검사를 **조용히** 건너뛴다. 이 저장소가 반복해 밟은
# 패턴이 정확히 그것이다. 그래서 이 스크립트는 "판정할 수 없으면 실행한다" 로 넘어진다:
#
#   - base 커밋을 모른다 (workflow_dispatch 등)      → 전부 관련 있음
#   - base 커밋이 로컬에 없다                        → 전부 관련 있음
#   - diff 를 못 냈다                                → 전부 관련 있음
#   - 변경 파일이 0건이다 (있을 수 없는 상태)         → 전부 관련 있음
#   - 알려진 무관 목록에 없는 경로가 나왔다           → 전부 관련 있음
#
# 마지막 항목이 핵심이다. "관련 있는 경로" 를 열거하는 방식(allowlist of relevant)은
# 새 디렉터리가 생기면 조용히 빠진다. 그래서 반대로 **"확실히 무관한 경로"** 만 열거하고,
# 그 목록에 없는 것은 전부 관련 있음으로 처리한다. 새 디렉터리는 자동으로 검사를 받는다.
#
# 출력(GITHUB_OUTPUT): afds=true|false, afds_registry=true|false, reason=<판정 근거>
set -uo pipefail

AFDS=false
AFDS_REGISTRY=false
REASON=""
# packages/afds 경로가 실제로 매치됐을 때만 REASON 에 의존 결합 문구를 붙인다 — AFDS=true 는
# apps/storybook 등 다른 분기에서도 켜지므로 이 변수 없이는 「afds 가 안 바뀐 PR」에서도
# 문구가 붙는다(registry.json 만 바뀐 PR 이 그 예 — AFDS_REGISTRY 는 켜지지만 packages/afds 는 아니다).
AFDS_REGISTRY_DEP=false

emit() {
  {
    echo "afds=$AFDS"
    echo "afds_registry=$AFDS_REGISTRY"
    echo "reason=$REASON"
  } >>"${GITHUB_OUTPUT:-/dev/stdout}"
  echo "── relevance 판정 결과 ──────────────────────────────"
  echo "  afds     = $AFDS"
  echo "  afds_registry = $AFDS_REGISTRY"
  echo "  근거     = $REASON"
}

fail_closed() {
  AFDS=true
  AFDS_REGISTRY=true
  REASON="fail-closed: $1"
  echo "::warning title=relevance 판정 불가::$1 — 안전을 위해 모든 검사를 실행한다"
  emit
  exit 0
}

# ── 1. base 커밋 확인 ───────────────────────────────────────────────────────
if [ "${EVENT:-}" != "pull_request" ]; then
  fail_closed "pull_request 이벤트가 아니다 (event=${EVENT:-unset})"
fi
if [ -z "${BASE_SHA:-}" ]; then
  fail_closed "github.event.pull_request.base.sha 가 비어 있다"
fi

# **네트워크를 쓰지 않는다.** 예전 판은 `git fetch origin ...` 으로 base 브랜치를
# 받아왔는데, checkout 이 `persist-credentials: false` 라 비공개 저장소에서 인증이 없어
# 항상 실패했다. 그러면 이 스크립트가 영구히 fail-closed 로 떨어져 **판정이 죽은 채
# 조용히 전량 실행**된다 — 초록이라 로그를 파기 전에는 보이지 않는다.
# (run 33127902979 에서 실제로 그렇게 나왔다: "fail-closed: base 브랜치 fetch 실패".)
#
# pull_request 이벤트에서 checkout 은 병합 ref(refs/pull/N/merge)를 받고, fetch-depth: 0
# 이므로 base 커밋이 그 병합 커밋의 조상으로 **이미 로컬에 있다.** 받아올 필요가 없다.
if ! git cat-file -e "${BASE_SHA}^{commit}" 2>/dev/null; then
  fail_closed "base 커밋이 로컬에 없다 (${BASE_SHA}) — checkout 의 fetch-depth 확인"
fi

# ── 2. diff ─────────────────────────────────────────────────────────────────
# `...` (three-dot) = merge-base 기준. base 에만 있는 커밋을 변경으로 세지 않는다.
if ! FILES=$(git diff --name-only --no-relative "${BASE_SHA}...HEAD" 2>/dev/null); then
  fail_closed "git diff 실패 (${BASE_SHA}...HEAD)"
fi
if [ -z "$FILES" ]; then
  fail_closed "변경 파일이 0건이다 — PR 에서는 있을 수 없는 상태다"
fi

echo "── 변경 파일 ($(echo "$FILES" | wc -l | tr -d ' ')건) ──"
echo "$FILES" | sed 's/^/  /'
echo

# ── 4. 판정 ─────────────────────────────────────────────────────────────────
# 확실히 무관한 경로만 열거한다. 여기 없는 것은 전부 "관련 있음" 이다(fail-closed).
is_known_irrelevant() {
  case "$1" in
    .changeset/*) return 0 ;;
    .claude/*) return 0 ;;
    .vscode/*) return 0 ;;
    lefthook.yml | .lefthook/*) return 0 ;;
    .github/ISSUE_TEMPLATE/*) return 0 ;;
    .github/PULL_REQUEST_TEMPLATE*) return 0 ;;
    .github/workflows/chromatic.yml) return 0 ;;
    .github/workflows/changeset-check.yml) return 0 ;;
    .github/workflows/release.yml) return 0 ;;
    docs/*) return 0 ;;
    LICENSE | *.md) return 0 ;;
    .gitignore | .npmrc | .prettierignore) return 0 ;;
    *) return 1 ;;
  esac
}

UNKNOWN=""
while IFS= read -r f; do
  [ -z "$f" ] && continue
  matched=0

  case "$f" in
    # afds 패키지 자신은 afds-registry 도 켠다 — afds-registry 가 `@turbo-project/afds: workspace:*` 를
    # 쓰고, 그 테스트가 afds 소스를 직접 읽는다(`arbitrary-token-ratchet` 이 afds bricks 를
    # 센다 · `registry-consistency`·`guard` 가 `packages/afds` 를 읽는다). 켜지 않으면 afds
    # 만 바꾼 PR 에서 afds-registry 의 lint·레지스트리 정합·validate·테스트가 전부 건너뛴다
    # (afds-test.yml 은 afds-registry 테스트를 돌리지 않는다 — afds-registry-test.yml 이 맡는다).
    # 아래 나머지 afds 경로는 afds-registry 의 입력이 아니라 켜지 않는다.
    packages/afds/*)
      AFDS=true
      AFDS_REGISTRY=true
      AFDS_REGISTRY_DEP=true
      matched=1
      ;;
    # **apps/storybook** · 잠금파일 · 자기 워크플로 · 오케스트레이터 · 판정 스크립트
    #
    # `.claude/rules/*` 가 여기 있는 이유: afds-test.yml 의 문서 인용 검사가 **그 경로를
    # 입력으로 읽는다.** 아래 `is_known_irrelevant` 의 `.claude/*` 분류가 맞았던 것은 그
    # 경로를 읽는 검사가 없었을 때까지다. 실제로 `.claude/rules/afds-storybook-headless.md`
    # 에서 미해소 import 가 나왔다 — 그 파일만 바꾸는 PR 에서 검사가 돌지 않으면 그대로
    # 들어간다. (`.claude/` 의 나머지 — 명령·설정·스킬 — 는 여전히 무관이다.)
    #
    # **루트 `README.md` 는 넣지 않았다.** 같은 검사가 그 파일도 읽지만 `@turbo-project/afds`
    # 언급이 **0건**이다(실측). 관련성을 실측 없이 넓히면 루트 오타 하나에 빌드·타입·
    # 린트·테스트가 전부 도는데, 그 비용은 `[의도] 루트 md 만` 회귀 테스트가 지키는
    # 결정이다. 남는 구멍은 "루트 README 만 바꾸는 PR 에서 문서 검사가 돌지 않는다" 이고,
    # 검사가 증분이 아니라 전수이므로 **다음 afds PR 에서 잡힌다** — 유실이 아니라 지연이다.
    #
    # apps/storybook 이 여기 있는 이유: afds-test.yml 의 `pnpm check-types` 는 turbo 로
    # **모노레포 전체**를 돌리고 그 scope 에 @turbo-project/storybook-app 이 들어 있다.
    # 즉 storybook 변경이 이 검사에 실제로 영향한다. (fail-closed 분기가 실제 실행에서
    # 이 경로를 미분류로 잡아내 추가했다 — run 33128200081.)
    apps/storybook/* | pnpm-lock.yaml | \
      .claude/rules/* | \
      .github/workflows/afds-test.yml | \
      .github/workflows/ci.yml | .github/scripts/*)
      AFDS=true
      matched=1
      ;;
  esac

  case "$f" in
    # afds-registry 패키지 · afds compositions(레지스트리 정합) · **승인 정본** · 잠금파일 · 자기 워크플로 등
    #
    # 컴포지션·승인 정본이 afds 에 있던 시절의 두 경로(`packages/afds/src/compositions/*`,
    # `packages/afds/compositions.approved.json`)를 제거했다 — **둘 다 실재하지 않는다**(실측).
    # 승인 정본은 자체 CLI 철거와 함께 사라졌다.
    # 루트 `registry.json` 이 여기 있는 이유: shadcn 규격 산출물이고 afds-registry 의
    # `generate:registry` 가 만든다. afds-registry-test.yml 의 정합 검증(`git diff`)과 규격
    # 검사(`validate:registry`)가 **그 파일을 대상으로** 돈다. 넣지 않으면 fail-closed 로
    # 잡히긴 하지만, 그건 "분류를 못 했다" 지 "관련 있다고 판정했다" 가 아니다.
    packages/afds-registry/* | pnpm-lock.yaml | registry.json | \
      .github/workflows/afds-registry-test.yml | .github/workflows/ci.yml | .github/scripts/*)
      AFDS_REGISTRY=true
      matched=1
      ;;
  esac

  if [ "$matched" -eq 0 ] && ! is_known_irrelevant "$f"; then
    UNKNOWN="$f"
    break
  fi
done <<EOF
$FILES
EOF

if [ -n "$UNKNOWN" ]; then
  fail_closed "알려진 무관 목록에 없는 경로: ${UNKNOWN}"
fi

REASON="diff 판정 성공 (base=${BASE_SHA})"
if [ "$AFDS_REGISTRY_DEP" = "true" ]; then
  REASON="${REASON}; packages/afds 변경은 afds_registry 도 켠다"
fi
emit
