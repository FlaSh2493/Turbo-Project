#!/usr/bin/env bash
# ci-detect-changes.sh 회귀 테스트.
#
# 실제 git 저장소를 임시로 만들어 브랜치마다 커밋하고 스크립트를 그대로 실행한다.
# 경로 판정은 `case` 패턴에 달려 있어 문자열 모사로는 재현되지 않는다 — 예를 들어
# `case` 의 `*` 가 `/` 를 넘는지, `packages/afds/*` 와 `is_known_irrelevant` 중 무엇이
# 먼저 매치하는지는 실제 실행으로만 확인된다.
#
# [의도] / [고정] 표시는 ci-gate.test.sh 와 같은 뜻이다.

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$HERE/lib.sh"
SUITE="ci-detect"

DETECT="${DETECT_SCRIPT:-$HERE/../ci-detect-changes.sh}"

WORK="$(mktemp -d)"
cleanup() { rm -rf "$WORK"; }
trap cleanup EXIT

git init -q -b main "$WORK/repo"
cd "$WORK/repo" || { echo "임시 저장소 생성 실패"; exit 1; }
git config user.email t@example.com
git config user.name test
mkdir -p packages/afds/src
printf 'seed\n' > README.md
git add -A >/dev/null && git commit -qm base
BASE="$(git rev-parse HEAD)"

# case_files <설명> <기대 afds> <기대 registry> <라벨> <파일...>
#   라벨: 의도 | 고정
n=0
case_files() {
  local desc="$1" want_a="$2" want_x="$3" tag="$4"; shift 4
  n=$((n + 1))
  git checkout -q -b "t$n" "$BASE"
  local f
  for f in "$@"; do
    mkdir -p "$(dirname "$f")"
    printf 'changed-%s\n' "$n" > "$f"
  done
  git add -A >/dev/null && git commit -qm "c$n"

  local out rc afds registry
  # **종료코드를 반드시 본다.** stdout 만 파싱하면 스크립트가 실패해도 통과로 읽힌다 —
  # `emit` 뒤에 `exit 42` 를 붙인 돌연변이가 이 스위트를 20/20 으로 통과했다(생존).
  # 실제 CI 에서는 `changes` job 이 죽는 결함인데 테스트가 못 봤다.
  out=$(BASE_SHA="$BASE" EVENT=pull_request GITHUB_OUTPUT=/dev/null bash "$DETECT" 2>&1)
  rc=$?
  afds=$(printf '%s' "$out" | sed -n 's/^  afds *= *//p' | tail -1)
  registry=$(printf '%s' "$out" | sed -n 's/^  afds_registry *= *//p' | tail -1)

  # 이 스크립트는 모든 경로에서 0 으로 끝나야 한다. fail_closed 도 `emit; exit 0` 이다 —
  # 판정을 못 해도 job 을 죽이지 않고 "전부 실행" 으로 넘기는 것이 설계이기 때문이다.
  if [ "$rc" -ne 0 ]; then
    ng "[$tag] $desc — 스크립트가 종료코드 $rc 로 끝났다 (0이어야 한다)" \
       "$(printf '%s' "$out" | tail -6)"
  elif [ "$afds" = "$want_a" ] && [ "$registry" = "$want_x" ]; then
    ok "[$tag] $desc → afds=$afds registry=$registry (rc=0)"
  else
    ng "[$tag] $desc" "기대 afds=$want_a registry=$want_x" "실제 afds=$afds registry=$registry (rc=$rc)" \
       "$(printf '%s' "$out" | tail -6)"
  fi
  git checkout -q "$BASE" 2>/dev/null
}

echo "[정상 판정]"
# afds 만 바뀐 PR 도 afds-registry 를 켠다 — afds-registry 가 afds 에 의존하고 그 테스트가 afds 소스를
# 읽는다(`arbitrary-token-ratchet` 이 afds bricks 를 센다). false 면 그 PR 에서 afds-registry 의
# lint·레지스트리 정합·validate·테스트가 전부 건너뛴다.
case_files "afds 소스만 — afds-registry 가 afds 에 의존한다" true true 의도 packages/afds/src/bricks/button/button.tsx
case_files "afds 깊은 경로 — case 의 * 는 / 를 넘는다" true true 의도 packages/afds/src/a/b/c/d.ts
case_files "afds-registry 소스" false true 의도 packages/afds-registry/src/x.ts
# 컴포지션은 afds-registry 로 이전됐다 — `packages/afds/src/compositions/` 는 **실재하지 않는다**(실측).
# 그래서 afds-registry 축의 패턴에서 뺐다. 이 경로가 다시 나타나도 `packages/afds/*` 로 양쪽이 켜진다.
case_files "afds 하위 옛 compositions 경로 — packages/afds/* 로 양쪽" true true 의도 packages/afds/src/compositions/x.tsx
case_files "잠금파일 — 양쪽" true true 의도 pnpm-lock.yaml
# afds 축의 나머지 경로는 afds-registry 의 입력이 아니다 — 의존 결합은 `packages/afds/*` 에만 있다.
case_files "apps/storybook — afds check-types 가 모노레포 전체를 돈다" true false 의도 apps/storybook/.storybook/main.cjs
case_files "ci.yml — 양쪽" true true 의도 .github/workflows/ci.yml
case_files "판정 스크립트 자신 — 양쪽" true true 의도 .github/scripts/ci-gate.sh
case_files "changeset 만" false false 의도 .changeset/foo.md
case_files ".claude 만" false false 의도 .claude/x.md
# `.claude/rules/*` 는 afds 다 — afds-test.yml 의 문서 인용 검사가 그 경로를 **입력으로
# 읽는다**(`.claude/rules/afds-storybook-headless.md` 에 실제로 미해소 import 가 있었다).
# `.claude/` 의 나머지는 위 줄 그대로 무관이다.
case_files ".claude/rules — 문서 인용 검사의 입력이다" true false 의도 .claude/rules/afds-component-tokens.md
case_files "chromatic.yml 만 — gate 밖에서 독립 실행된다" false false 의도 .github/workflows/chromatic.yml
case_files "루트 md 만" false false 의도 README.md
case_files "docs/ 만" false false 의도 docs/guide.md
# 아래는 매칭 '순서' 가 결과를 가른다. is_known_irrelevant 의 *.md 가 아니라
# packages/afds/* 가 먼저 걸린다 — 패키지 안의 문서는 무관이 아니다.
case_files "packages/afds 안의 md — *.md 에 삼켜지지 않는다" true true 의도 packages/afds/docs/overview.md

echo "[fail-closed — 판정할 수 없으면 실행한다]"
case_files "미지의 최상위 디렉터리" true true 의도 brandnewdir/x.ts
case_files "목록에 없는 새 워크플로" true true 의도 .github/workflows/brand-new.yml

# 아래 넷은 파일 변경이 아니라 입력 자체가 망가진 경우다.
env_case() { # env_case <설명> <BASE_SHA> <EVENT>
  local desc="$1" out rc afds registry
  out=$(BASE_SHA="$2" EVENT="$3" GITHUB_OUTPUT=/dev/null bash "$DETECT" 2>&1)
  rc=$?
  afds=$(printf '%s' "$out" | sed -n 's/^  afds *= *//p' | tail -1)
  registry=$(printf '%s' "$out" | sed -n 's/^  afds_registry *= *//p' | tail -1)
  if [ "$rc" -ne 0 ]; then
    ng "[의도] $desc — 스크립트가 종료코드 $rc 로 끝났다 (fail_closed 도 0 이어야 한다)"
  elif [ "$afds" = true ] && [ "$registry" = true ]; then ok "[의도] $desc → 전량 실행 (rc=0)"
  else ng "[의도] $desc" "기대 afds=true registry=true" "실제 afds=$afds registry=$registry"; fi
}
git checkout -q -b tenv "$BASE"
mkdir -p packages/afds/src
printf 'x\n' > packages/afds/src/z.ts
git add -A >/dev/null
git commit -qm cenv
env_case "base 커밋이 로컬에 없다" 0000000000000000000000000000000000000000 pull_request
env_case "base sha 가 빈 값" "" pull_request
env_case "pull_request 이벤트가 아니다" "$BASE" push
git checkout -q "$BASE"
git checkout -q -b tsame "$BASE"
env_case "변경 0건 — PR 에서는 있을 수 없다" "$BASE" pull_request

finish 20
