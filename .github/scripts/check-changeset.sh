#!/usr/bin/env sh
# 릴리스 규율(H2 pre-push / H3 에이전트 훅 공용): 패키지 변경 시 changeset 필수.
# changeset 부재면 exit 1 + 안내. 의도적 무릴리스는 `pnpm changeset add --empty`.

# git 은 훅에 GIT_DIR 을 주입한다 — linked worktree 에서는 <main>/.git/worktrees/<name>.
# 이때 GIT_WORK_TREE 는 주입되지 않고, GIT_DIR 만 있고 GIT_WORK_TREE 가 없으면 git 은
# "자기 cwd" 를 워크트리 루트로 간주한다. changesets 는 changeset 파일 목록을 구할 때
# cwd=<repo>/.changeset 에서 `git diff --name-only --no-relative` 를 돌리므로, 그 가짜
# 루트 밖에 있는 .changeset/*.md 가 목록에서 사라져 "changeset 없음" 오판이 난다.
# (메인 체크아웃을 보는 문제가 아니다 — 경로 스코프가 .changeset/ 로 좁혀지는 문제다.)
# 두 변수를 걷어내면 git 이 cwd 에서 저장소를 다시 찾아 워크트리를 올바로 해석한다.
unset GIT_DIR GIT_WORK_TREE

# 이 스크립트는 자기가 지키는 저장소 안에 있으므로, cwd 가 아니라 **스크립트 위치**를
# 기준으로 워크트리 루트를 찾는다. H2 훅은 워크트리 루트에서 실행되지만 H3 에이전트
# 훅은 저장소 밖 cwd 에서 호출될 수 있다. 위에서 변수를 걷어낸 뒤이므로 rev-parse 는
# 그 디렉터리 기준으로 올바른 루트를 돌려준다.
script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" 2>/dev/null && pwd)
root=$(git -C "${script_dir:-.}" rev-parse --show-toplevel 2>/dev/null)
if [ -z "$root" ]; then
  echo "⚠️  git 워크트리를 찾을 수 없어 changeset 검증을 실행하지 못했습니다." >&2
  echo "   (스크립트 위치: ${script_dir:-불명})" >&2
  exit 1
fi
cd "$root" || exit 1

# `changeset status`의 종료코드만으로는 "changeset 없음"과 "실행 실패"(pnpm 부재·
# origin/main 미fetch·changeset 설정 오류)를 구분할 수 없다. 실패 시 원문을 그대로
# 보여주고, 실행 실패는 별도 메시지로 안내한다.
# 대조할 base. CI(changeset-check.yml)는 PR 의 실제 base 를 쓰지만, 로컬 훅은 그 브랜치가
# 어느 base 로 향할지 알 수 없다. base 가 origin/main 보다 앞서 있고 그 앞선 커밋이
# changeset 을 들고 있으면 changeset 없는 변경도 통과하므로(false pass), main 이 아닌
# base 로 작업할 때는 지정해야 한다. 예: CHANGESET_BASE=origin/feat/jake git push
base=${CHANGESET_BASE:-origin/main}

out=$(pnpm changeset status --since="$base" 2>&1)
status=$?

if [ "$status" -eq 0 ]; then
  exit 0
fi

# changesets CLI가 "변경된 패키지에 changeset이 없음"으로 실패한 경우만 릴리스 규율 위반.
if printf '%s' "$out" | grep -qiE 'no changesets? ((are|were) )?(present|found)'; then
  echo "🦋 changeset이 없습니다 — 패키지 변경에는 changeset이 필요합니다." >&2
  echo "   릴리스 대상:   pnpm changeset" >&2
  echo "   의도적 무릴리스: pnpm changeset add --empty" >&2
  exit 1
fi

# 그 외 실패는 검증 자체가 성립하지 않은 것 — 원문을 그대로 노출하고 원인 종료코드를 보존한다.
echo "⚠️  changeset 검증을 실행하지 못했습니다 (exit ${status}). changeset 부재와는 다른 문제입니다." >&2
echo "   확인: pnpm 설치 여부 · '${base}' ref 존재 여부(git fetch) · .changeset/config.json" >&2
echo "--- changeset status 출력 ---" >&2
printf '%s\n' "$out" >&2
exit "$status"
