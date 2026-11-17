# @turbo-project/mutation

뮤테이션 테스트입니다. 테스트가 버그를 실제로 잡는지 로컬에서 봅니다. `init`을 돌리면 아래 파일을 고칩니다.

## 만드는 파일

없습니다. 실행 결과는 `reports/mutation/`에 생기고 커밋하지 않습니다.

## 다른 파일에 더하거나 고치는 것

| 파일 | 하는 일 |
| --- | --- |
| `package.json` | `test:mutation` 스크립트를 `mutation run`으로 맞춥니다 |
| `.gitignore` | `.stryker-tmp*`, `reports/mutation` 줄을 더합니다 |
| `AGENTS.md` | `<!-- BEGIN:mutation -->` 블록(`## 뮤테이션`)을 넣습니다. 다시 돌리면 블록 안만 새로 씁니다 |

## 사람이 돌릴 명령어

| 언제 | 명령어 |
| --- | --- |
| 처음 | `pnpm add -D -E @turbo-project/mutation` → `pnpm exec mutation init` |
| `lib/` 함수를 바꿨을 때 | `pnpm test:mutation --mutate '<바꾼 파일>'` |
| 버전을 올릴 때 | `package.json`의 `@turbo-project/mutation` 버전을 바꾸고 `pnpm i`. 블록이 바뀐 버전이면 `pnpm exec mutation init`도 |

## init 뒤에 채울 것

사람이 직접 하거나 에이전트에게 시킵니다.

| 파일 | 채울 것 |
| --- | --- |
| `stryker.config.mjs` | 순수 함수가 `src/**/lib/` 밖에 있을 때만 만들고 대상(`mutate`)을 씁니다. `@turbo-project/mutation/base`를 펼치고 다른 값만 씁니다 |
| 소음 파일 맨 위 | 외부 연동 래퍼나 정적 데이터처럼 변이가 소음인 파일에 `// Stryker disable all: 이유`를 답니다 |

`pnpm exec mutation check`가 통과하고 대상 파일 하나로 `pnpm test:mutation --mutate '<파일>'`이 돌면 끝입니다. 그 뒤로는 살아남은 변이를 테스트로 잡고, 잡을 수 없는 것만 PR 본문에 남깁니다.
