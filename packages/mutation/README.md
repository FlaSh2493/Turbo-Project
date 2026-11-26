# @turbo-project/mutation

뮤테이션 테스트입니다. 테스트가 바뀐 코드를 실제로 확인하는지 봅니다. 로컬에서 돌리고, 머지 게이트에서 다시 돕니다. `init`을 돌리면 아래 파일을 고칩니다.

## 만드는 파일

없습니다. 실행 결과는 `reports/mutation/`에 생기고 커밋하지 않습니다.

| 파일 | 내용 |
| --- | --- |
| `reports/mutation/mutation.json` | Stryker 리포트. 바뀐 대상이 없으면 빈 리포트를 씁니다 |
| `reports/mutation/head.json` | `--changed`로 돌린 커밋과 base. `governance judge`가 리포트가 지금 커밋 것인지 볼 때 씁니다 |

## 다른 파일에 더하거나 고치는 것

| 파일 | 하는 일 |
| --- | --- |
| `package.json` | `test:mutation` 스크립트를 `mutation run`으로 맞춥니다 |
| `.gitignore` | `.stryker-tmp*`, `reports/mutation` 줄을 더합니다 |
| `AGENTS.md` | `<!-- BEGIN:mutation -->` 블록(`## 뮤테이션`)을 넣습니다. 다시 돌리면 블록 안만 새로 씁니다 |

## 명령어

| 언제 | 명령어 |
| --- | --- |
| 처음 | `pnpm add -D -E @turbo-project/mutation` → `pnpm exec mutation init` |
| `.ts` 코드를 바꿨을 때, push 전 | `pnpm test:mutation --changed`. base는 `origin/develop`, 없으면 `origin/main`입니다. 다르면 `--base <ref>` |
| 살아남은 변이를 볼 때 | `pnpm exec mutation survivors`. 있으면 실패로 끝납니다. `--json`은 `governance`가 읽는 형식입니다 |
| 파일 하나를 통째로 볼 때 | `pnpm test:mutation --mutate '<파일>'` |
| 버전을 올릴 때 | `package.json`의 `@turbo-project/mutation` 버전을 바꾸고 `pnpm i` → `pnpm exec mutation init` |


## 대상

- base는 `src/**/*.ts` 전체입니다. 테스트, 타입 선언, `index.ts`, `generated/`, `msw/`, `e2e/`, `.stories.ts`는 뺍니다. 화면 컴포넌트(`.tsx`)는 렌더 테스트가 맡아서 대상이 아닙니다.
- 문자열 변이(`StringLiteral`)는 만들지 않습니다. 로그·에러 문구처럼 잡을 필요가 없는 변이가 대부분이라서입니다.
- `--changed`는 base에서 바뀐 줄만 `파일:시작-끝`으로 넘깁니다. 변이마다 그 줄을 지나는 테스트만 돌아서 보통 몇 분 안에 끝납니다.

## 살아남은 변이를 다루는 순서

1. 테스트를 더해 잡습니다.
2. 못 잡으면 코드를 줄여 변이가 생길 자리를 없앱니다. 동등 변이는 필요 없는 검사인 경우가 많습니다.
3. 그래도 남은 변이는 `pnpm exec governance judge`가 작업한 에이전트와 다른 Claude 세션으로 동등 변이인지 판정합니다. 동등 변이로 판정된 것만 PR 본문 `## 검증`에 남고 집계에서 빠집니다.

`// Stryker disable` 주석은 쓰지 않습니다. 외부 연동 래퍼나 정적 데이터처럼 파일 전체가 소음이면 `stryker.config.mjs`의 `mutate`에서 뺍니다.

## init 뒤에 채울 것

| 파일 | 채울 것 |
| --- | --- |
| `stryker.config.mjs` | 대상이 base와 다를 때만 만듭니다. `@turbo-project/mutation/base`를 펼치고 다른 값만 씁니다 |

`pnpm exec mutation check`가 통과하고 `pnpm test:mutation --changed`가 돌면 끝입니다.
