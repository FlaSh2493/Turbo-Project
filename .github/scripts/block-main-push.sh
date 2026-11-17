#!/usr/bin/env sh
# main 직접 push 차단(로컬) — `lefthook.yml` 의 pre-push 가 changeset 검사보다 먼저 부른다.
# git 이 pre-push stdin 으로 주는 `<local ref> <local sha> <remote ref> <remote sha>` 줄 중
# remote ref 가 refs/heads/main 인 것이 하나라도 있으면 막는다(삭제 push 도 같은 줄 형태다).
#
# release.yml 의 버전 범프는 `git push --no-verify` 라 이 훅을 타지 않는다 — 영향 없다.
# 같은 이유로 사람도 --no-verify 로 우회할 수 있다. 서버 강제는 ruleset 몫이다(docs/info/harness.md §9).

blocked=0
while read -r local_ref local_sha remote_ref remote_sha; do
  if [ "$remote_ref" = "refs/heads/main" ]; then
    blocked=1
    echo "⛔ main 브랜치에 직접 push 할 수 없습니다 (${local_ref:-?} → ${remote_ref})." >&2
  fi
done

if [ "$blocked" -eq 1 ]; then
  echo "   브랜치를 만들어 push 하고 PR 을 여세요:" >&2
  echo "     git switch -c <브랜치명>" >&2
  echo "     git push -u origin <브랜치명>" >&2
  exit 1
fi
exit 0
