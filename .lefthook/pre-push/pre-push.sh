#!/bin/sh
# pre-push 6단계를 순서대로 돈다. stdin(push 대상 ref 목록)은 첫 단계 block-main-push.sh 가 읽는다.
#
# `run:` 잡이 아니라 `script:` 잡인 이유 — lefthook 은 `run:` 잡을 push 할 파일이 없으면(이미 push 한
# 브랜치에서 `git push origin feat:main`, HEAD == @{push}) 「no matching push files」로 건너뛴다. 가드가
# 통째로 안 돈 채 rc=0 이 된다(2.2.0 실측). `script:` 잡은 건너뛰지 않는다.
set -e
cd "$(git rev-parse --show-toplevel)"

sh .github/scripts/block-main-push.sh
sh .github/scripts/check-changeset.sh </dev/null
pnpm check-types </dev/null
pnpm --filter @turbo-project/afds lint </dev/null
pnpm knip </dev/null
node .github/scripts/check-package-boundaries.mjs </dev/null
