# @turbo-project/governance

PR마다 위험 등급(low/medium/high)을 매겨 사람이 볼 PR만 고릅니다. `init`을 돌리면 아래 파일을 만들거나 고칩니다.

## 만드는 파일

없을 때만 만들고, 그 뒤로는 레포가 고칩니다.

| 파일 | 내용 |
| --- | --- |
| `.github/CODEOWNERS` | GitHub가 오너 승인을 요구할 경로와 오너. 등급은 이 파일로 정하지 않습니다 |
| `.github/pull_request_template.md` | PR 본문 양식 |

## 다른 파일에 더하거나 고치는 것

| 파일 | 하는 일 |
| --- | --- |
| `AGENTS.md` | `<!-- BEGIN:governance -->` 블록(`## PR`)을 넣습니다. 다시 돌리면 블록 안만 새로 씁니다 |
| pre-push 훅 | `pnpm exec governance judge \|\| true` 한 줄을 넣습니다. husky면 `.husky/pre-push`, lefthook이면 `lefthook.yml`, simple-git-hooks면 `package.json`, 셋 다 없으면 `.git/hooks/pre-push`입니다 |
| `package.json` | 훅 도구가 없을 때만 `prepare`에 `governance hook \|\| true`를 더합니다. 팀원이 설치하면 훅이 깔립니다 |

`judge`는 파일이 아니라 PR을 고칩니다. 등급 라벨, 리뷰어, 본문 맨 위 `## 위험 등급`을 붙입니다. `judge --create`는 판정한 결과를 넣어 PR을 엽니다.

## 사람이 돌릴 명령어

| 언제 | 명령어 |
| --- | --- |
| 처음 | `pnpm add -D -E @turbo-project/governance` → `pnpm exec governance init` |
| PR을 열 때 | `pnpm exec governance judge --create <gh pr create 인자>` (예: `--draft --base develop --title "..." --body-file body.md`) |
| base를 바꾼 뒤, 웹에서 PR을 연 뒤 | `pnpm exec governance judge` (push할 때는 훅이 돌립니다) |
| 버전을 올릴 때 | `package.json`의 `@turbo-project/governance` 버전을 바꾸고 `pnpm i`. 블록이 바뀐 버전이면 `pnpm exec governance init`도 |

판정은 `claude` CLI로 돌고, 없으면 medium이 됩니다. 동작이 바뀌었는데 그 동작을 확인하는 테스트가 없으면 `judge`가 실패로 끝나고, `--create`면 PR을 만들지 않습니다.

## init 뒤에 채울 것

사람이 직접 하거나 에이전트에게 시킵니다.

| 파일 | 채울 것 |
| --- | --- |
| `.github/CODEOWNERS` | `@메인-오너` 자리에 오너를 넣고 `# 확인 필요` 줄을 지웁니다. 오너는 write 권한이 있는 GitHub 아이디이고, 첫 사람이 메인 오너입니다. 표시가 남아 있으면 `judge`가 돌지 않습니다. 경로도 확인합니다. 테스트가 증명하지 못하는 경로(CI·배포, 빌드 설정, 모든 요청이 거쳐 가는 코드)만 넣고 기능 경로는 넣지 않습니다 |
| `.github/FEATURE_OWNERS` | 피처 오너를 두려면 CODEOWNERS 문법으로 만듭니다. medium 등급 PR의 리뷰어가 됩니다 |
| GitHub 설정 | 처음 적용한 PR을 머지한 뒤 보호 브랜치에 ruleset을 겁니다(`pnpm exec governance criteria`의 "적용 뒤 사람이 할 설정") |

`judge --create`로 연 PR에 등급이 붙어 있으면 끝입니다. 그 뒤로는 low는 셀프머지, medium은 리뷰어가 확인, high는 CODEOWNERS 오너가 승인합니다.
