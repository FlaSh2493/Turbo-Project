# turbo-project

<!-- BEGIN:agent-rules -->
<!-- @turbo-project/agent-rules@0.0.0가 관리하는 블록이다. 블록 안은 고치지 않는다. agent-rules init이 다시 쓴다. -->

# 지침 우선순위

규칙이 부딪히면 위의 것을 따른다.

1. 이 파일의 `## 예외`
2. 레포 규칙: 이 블록 밖의 내용과 `.agents/rules/custom/`
3. 공통 규칙: 이 블록과 `.agents/rules/common/`

🔒가 붙은 공통 규칙은 예외로도 바꾸거나 끄지 않는다. 규칙 제목의 `[ID]`로 규칙을 가리킨다.

# 공통 규칙

## [BASE-REQ] 요구사항

- 변경은 Jira 이슈에서 시작한다. 이슈의 Problem·Requirements·Acceptance Criteria·Constraints·Out of Scope가 이번 변경의 범위다. 비어 있는 항목은 구현 전에 사용자에게 묻는다.
- 이슈가 없으면 사용자 요청을 출처로 삼는다. 위 항목을 플랜에 정리하고 구현 전에 사용자 확인을 받는다. 플랜이 없으면 대화로 확인받고 PR 본문에 옮긴다.
- 수락 기준과 검증 시나리오는 `## 이 레포`의 요구사항 출처에서 만든다. 출처에 없는 요구사항을 만들지 않는다.
- 스펙·플랜을 어디에 어떻게 쓰는지는 [common/docs.md](.agents/rules/common/docs.md)를 따른다.
- 화면 흐름이 바뀌는 작업이면 플랜에 `## QA 시나리오`도 쓴다. 플랜이 없으면 대화에서 정리해 확인받고 draft PR 본문에 옮긴다. 양식은 [common/qa-scenario.md](.agents/rules/common/qa-scenario.md).

## [BASE-WORK] 작업 순서

에이전트가 작업 중에 한다. 사람은 요청을 주고, 화면과 에이전트가 확인하지 못했다고 보고한 부분을 직접 확인한다.

1. 구현 전에 수락 기준을 정리한다. 출처는 `[BASE-REQ]`를 따른다. 관련 스펙을 읽고 영향받는 기능 스펙과 흐름 스펙을 찾는다.
2. 동작이 바뀌면 실패하는 테스트를 먼저 쓴다. 빈 값, 경계값, 실패 응답, 권한 없음, 중복·동시 요청을 검토하고 해당하는 것은 테스트로 남긴다.
3. `## 명령`의 검증 명령을 돌린다. 실패는 원인을 고친다(`[BASE-NO-BYPASS]`).
4. 동작을 확인하고 증거를 남긴다. 외부 연동과 API는 에이전트가 실행한 요청과 응답이다. 화면은 에이전트가 확인하지 않는다. 확인할 화면과 흐름, `## 명령`의 확인할 화면 폭을 사용자에게 알리고(`## QA 시나리오`가 있으면 그 섹션을 가리킨다), 사용자가 직접 본다. 확인하지 못한 부분은 확인 못 함으로 적는다.
5. 동작이 바뀌었으면 관련 스펙을 갱신한다(`[DOC-UPDATE]`).
6. PR은 draft로 연다.
7. PR 본문에 수락 기준과 테스트의 대응표, 증거, 영향 분석과 갱신한 스펙, 주의할 점, 되돌리는 방법을 쓴다. 화면 증거는 사용자 확인, 확인 안 함 중 하나로 적는다.
8. 위 검사와 확인, 본문 작성을 마친 뒤 ready로 바꾼다. CodeRabbit은 ready PR만 리뷰하고 리뷰 횟수에 한도가 있다. ready 상태에서 커밋을 쌓으면 한도를 쓴다.
9. CodeRabbit 지적은 코드로 확인해서 고친다. 같은 종류는 전부 고치고, 반영하지 않을 지적에는 이유를 답글로 남긴다.
10. 수동으로 재현한 문제는 테스트로 바꿔 다시 나오지 않게 한다.

## 🔒 [BASE-NO-BYPASS] 검사를 건너뛰거나 덮지 않는다

- `--no-verify`로 훅을 건너뛰지 않는다.
- 실패를 `any`·`@ts-ignore`·`eslint-disable`·테스트 skip으로 덮지 않는다. 고칠 수 없는 경우의 예외는 [common/comments.md](.agents/rules/common/comments.md)의 `[COMMENT-DIRECTIVE]`를 따른다.

## [BASE-VERIFY] 검증 원칙

- 완료 기준은 `## 명령`의 검증 명령이다. CI와 같은 검사를 로컬에서 먼저 돌린다. `## 명령`의 PR에서만 도는 검사를 로컬에서 돌리지 않았으면 결과 보고에 적는다.
- `## 명령`에 CI에서 돌지 않는다고 적힌 검사(정적 분석 등)는 push 전에 로컬에서 돌린다. 고치지 않고 남기는 경고는 PR 본문에 `파일:라인 | 규칙 | 이유`로 남긴다.
- UI를 바꿨다면 검증 명령으로 끝나지 않는다. jsdom과 빌드는 레이아웃·스타일 cascade·인터랙션을 보지 못하고, HTTP 200은 증거가 아니다. 화면 확인은 `[BASE-WORK]` 4단계를 따른다.

## [BASE-COMMIT] 커밋과 PR

- 커밋 제목은 `type(scope): 한글 제목 (ABC-1234)`이다. type은 `build`·`chore`·`ci`·`docs`·`feat`·`fix`·`perf`·`refactor`·`revert`·`style`·`test`. scope는 `## 브랜치와 배포`의 기준을 따른다. 티켓 키는 브랜치 이름에서 가져오고 없으면 생략한다. 제목은 100자 이하, 마침표 없이 쓴다.
- 본문에는 무엇을 왜 바꿨는지 쓴다.
- 보호 브랜치에 바로 커밋하지 않는다. 보호 브랜치를 출처로 PR을 여는 것은 승격·백포트뿐이다. 보호 브랜치와 base는 `## 브랜치와 배포`를 따른다.
- PR 제목은 커밋 제목과 같은 형식이다. 본문은 PR 템플릿(`.github/pull_request_template.md`)이 있으면 그 섹션을 채운다. PR을 열기 전에 `git log origin/<base>..HEAD`로 무관한 커밋이 섞이지 않았는지 본다.
- PR 본문은 리뷰어가 읽는 글이다. 영어를 옮긴 듯한 말 대신 평소에 쓰는 말로 쓴다("URL을 해제한다" 대신 "메모리를 풀어 준다", "말줄임된다" 대신 "한 줄로 잘린다").
- 작업과 Git 조작은 지금 worktree 안에서 하고, 관련 없는 사용자 변경을 보존한다.

## [BASE-DEPLOY] 배포와 장애 대응

- 머지가 곧 배포다. 어느 브랜치가 어디에 배포되는지는 `## 브랜치와 배포`에 있다.
- 되돌리기는 revert PR이다.
- 장애가 나면 고치기 전에 먼저 되돌리고, 공유한 뒤 원인을 찾는다. 되돌리면 이미 저장된 데이터의 형식이나 다른 서비스와 맞춘 계약이 깨지는 변경이면, 되돌리기 전에 사람에게 묻는다.

## 🔒 [BASE-CONFIRM] 실행 전 확인이 필요한 작업

아래는 사용자 확인 없이 하지 않는다. 일반적인 코드 수정은 괜찮지만, 아래에 적힌 변경은 코드 변경이어도 확인이 필요하다. `## 이 레포`의 "확인받을 작업"에 적힌 작업도 같다.

- **PR 머지와 보호 브랜치 푸시.** 머지가 곧 배포다.
- 커밋과 PR 생성. 사용자가 요청했을 때만 한다.
- 외부 도구에 diff 보내기. 보내기 전에 보낼 내용 전체(바뀐 줄 주변의 맥락 포함)에서 secret을 찾고, 있으면 보내지 않는다. `.env*`는 보내지 않는다.

## 🔒 [BASE-GENERATED] 공통 규칙과 레포 규칙

- `AGENTS.md`의 agent-rules 블록과 `.agents/rules/common/`은 `@turbo-project/agent-rules`가 쓴다. 직접 고치지 않는다. 버전을 올리면 `pnpm exec agent-rules init`으로 다시 쓰고 `pnpm agents:check`로 확인한다.
- 블록 밖의 `AGENTS.md`와 `.agents/rules/custom/`은 레포가 관리한다. 다른 패키지가 쓰는 블록(`<!-- BEGIN:<이름> -->`~`<!-- END:<이름> -->`)도 직접 고치지 않는다.
- 공통 규칙을 이 레포만 다르게 하거나 끄려면 `AGENTS.md`의 `## 예외`에 쓴다(`[RULEFILE-EXCEPTION]`). 🔒 규칙은 바꾸거나 끄지 않는다.
- 모든 레포에 맞는 규칙을 바꾸거나 더하려면 turbo-project의 `packages/agent-rules`를 고친다. 레포는 새 버전을 설치하면 반영된다.

공통 규칙 파일:

- [code-conventions](.agents/rules/common/code-conventions.md)
- [comments](.agents/rules/common/comments.md)
- [docs](.agents/rules/common/docs.md)
- [qa-scenario](.agents/rules/common/qa-scenario.md)
- [rule-format](.agents/rules/common/rule-format.md)
- [testing](.agents/rules/common/testing.md)
- [fsd](.agents/rules/common/fsd.md)
- [afds](.agents/rules/common/afds.md)

<!-- END:agent-rules -->

# 레포 규칙

Agent Friendly Design System(afds)과 그 컴포지션 레지스트리, Storybook, Figma 토큰 도구를 담은 pnpm·turbo 모노레포다. 주요 작업 영역은 `packages/afds`다.

코드만 봐서는 알 수 없는 것만 적는다. 기계가 막는 규칙은 lint 에러 메시지가 고칠 방법까지 알려준다.

## 이 레포

- 스택: React(peer 18·19), TypeScript, Tailwind CSS v4, Base UI, Vitest, Storybook, changesets. 빌드·검사 스크립트는 `tsx`로 돈다
- 패키지 매니저와 Node: pnpm(`package.json`의 `packageManager`), Node는 `.nvmrc`(`engines.node >=22`, `engine-strict`)
- 설치: `pnpm install`. `prepare`가 lefthook 훅을 깐다. husky가 남긴 `core.hooksPath`가 있으면 lefthook이 설치를 거절한다. 절차는 [docs/info/harness.md](docs/info/harness.md) 「훅 설치」
- env: 로컬 실행에는 필요 없다. CI 토큰은 GitHub secrets에 있다
- 요구사항 출처와 우선순위: 사용자 요청 > 스펙(`docs/specs/`, `tech-spec` 스킬이 만든다) > 현재 코드 > Figma
- 큰 변경으로 보는 영역: afds 공개 표면(`packages/afds/package.json`의 `exports`, 컴포넌트 props, 토큰 이름), `registry.json` 계약, 배포·CI(`.github/`, `.changeset/`, `lefthook.yml`)
- 확인받을 작업: changeset `major` 등급, 패키지 추가. 먼저 묻고 승인받는다

| 위치                                                                | 두는 것                                                                                                        |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `packages/afds`                                                     | 디자인 시스템 본체. npm에 배포되는 유일한 패키지다. 레이어는 `src/headless` → `src/bricks`                     |
| `packages/afds-registry`                                            | 컴포지션(shadcn registry). `private`이고 루트 `registry.json`으로 배포된다. 생성물이라 직접 고치지 않는다      |
| `apps/storybook`                                                    | afds·컴포지션 문서와 시각 확인                                                                                 |
| `packages/figma-token-bridge`, `packages/figma-variables-exporter`  | Figma 변수 → 토큰 생성 CLI, Figma 플러그인                                                                     |
| `packages/config/*`                                                 | eslint·prettier·tsconfig 공유 설정                                                                             |
| `packages/agent-rules`, `packages/governance`, `packages/mutation`  | 여러 레포가 설치해 쓰는 공통 패키지(에이전트 규칙, PR 위험 등급 판정, 뮤테이션 테스트). 이 레포도 `workspace:*`로 설치해 쓴다. 원본 형식을 유지하므로 prettier 대상이 아니다 |
| `.github/scripts`                                                   | CI 판정 스크립트와 그 셸 스위트(`__tests__/`)                                                                  |

## 규칙 파일

레포 규칙 파일은 `.claude/rules/`에 있다(`## 예외`의 `[RULEFILE-SPLIT]`). Claude Code는 `paths:`에 맞는 파일을 열면 자동으로 읽는다. 다른 에이전트는 아래 때에 읽는다.

- afds 컴포넌트를 만들거나 고칠 때: [afds-component-philosophy.md](.claude/rules/afds-component-philosophy.md)(레이어 선택), [afds-component-structure.md](.claude/rules/afds-component-structure.md)(파일 구조), [afds-component-tokens.md](.claude/rules/afds-component-tokens.md)(토큰), [afds-component-patterns.md](.claude/rules/afds-component-patterns.md)(`render`·`Trigger`·`Indicator` 합성). 절차는 [creating-components.md](packages/afds/docs/creating-components.md), prop 이름은 [prop-naming-conventions.md](packages/afds/docs/prop-naming-conventions.md)
- 컴포지션을 다룰 때: [afds-composition-structure.md](.claude/rules/afds-composition-structure.md). 신규 등록은 `composition-new` 스킬. 패턴은 [composition-patterns.md](packages/afds/docs/composition-patterns.md), [composition-recipes.md](packages/afds/docs/composition-recipes.md)
- 스토리를 쓸 때: [afds-storybook-headless.md](.claude/rules/afds-storybook-headless.md), [afds-storybook-components.md](.claude/rules/afds-storybook-components.md), [afds-storybook-compositions.md](.claude/rules/afds-storybook-compositions.md), [afds-storybook-patterns.md](.claude/rules/afds-storybook-patterns.md), [storybook-guidelines.md](packages/afds/docs/storybook-guidelines.md)
- 주석을 쓸 때: [code-comments.md](.claude/rules/code-comments.md)
- changeset을 쓸 때: [versioning.md](.claude/rules/versioning.md)
- 디자인 원칙·네이밍을 판단할 때: [overview.md](packages/afds/docs/overview.md), [design-principles/](packages/afds/docs/design-principles/), [naming-consistency.md](packages/afds/docs/naming-consistency.md)
- 검사를 더하거나 CI·훅을 고칠 때: [docs/info/harness.md](docs/info/harness.md)

## 명령

검증 명령. CI(`ci.yml` → `afds-test.yml`·`afds-registry-test.yml`·`format`)와 같은 순서다.

```bash
pnpm build && pnpm check-types \
  && pnpm --filter @turbo-project/afds lint && pnpm --filter @turbo-project/afds test:run \
  && pnpm --filter figma-token-bridge test:run && pnpm --filter @turbo-project/afds verify:docs \
  && pnpm --filter @turbo-project/afds-registry validate:registry && pnpm --filter @turbo-project/afds-registry lint \
  && pnpm --filter @turbo-project/afds-registry test \
  && bash .github/scripts/__tests__/run-all.sh && node .github/scripts/check-package-boundaries.mjs && pnpm knip
```

- 반복 확인: `pnpm --filter @turbo-project/afds test:watch`
- 파일 단위 테스트: `pnpm --filter @turbo-project/afds exec vitest run src/bricks/<그룹>/<컴포넌트>`
- 린트가 도는 곳: pre-commit(lefthook, 패키지별 oxlint → ESLint `--fix` → prettier), pre-push(afds lint 래칫), CI. afds lint는 기준선 래칫이라 새 경고도 실패다
- 대상 판별과 사전 빌드: `packages/afds`를 바꾸면 afds와 afds-registry 둘 다 검사한다. afds-registry와 Storybook은 afds `dist`를 읽으므로 먼저 `pnpm --filter @turbo-project/afds build`
- react-doctor: `pnpm doctor`(`doctor.config.ts`). CI는 `react-doctor.yml`
- PR에서만 도는 검사: 비밀 스캔(`secret-scan`), changeset 필수(`changeset-check.yml`)
- 공통 도구 패키지(`packages/agent-rules`·`governance`·`mutation`)를 고쳤으면 그 패키지에서 `pnpm test`. CI에서는 돌지 않는다
- 앱 띄우기: `pnpm storybook`(포트 6007, afds 소스를 바로 읽는다). 빌드본으로 보려면 `pnpm storybook-built`
- 확인할 화면 폭: 1280px

## 브랜치와 배포

- 보호 브랜치: `main`. 새 브랜치 이름: `feat/<주제>`, `fix/<주제>`, `chore/<주제>`. PR base 기본값: `main`
- `main`으로는 모든 작업 브랜치에서 PR을 연다.
- 커밋 scope 기준: 패키지나 영역 이름(`afds`, `afds-registry`, `storybook`, `harness`). 루트 설정과 문서는 scope를 생략한다. 형식은 `commit-with-format` 스킬
- 커밋 메시지 훅: 없다
- 배포: `main` 푸시마다 `release.yml`이 changeset으로 버전을 올리고 `@turbo-project/afds`를 npm에 배포한다. 같은 푸시에서 afds·afds-registry·Storybook이 바뀌었으면 `deploy-storybook.yml`이 Storybook을 GitHub Pages에 배포한다. Chromatic은 수동 실행이다
- 함께 깨지는 곳: afds-registry 컴포지션과 Storybook은 afds `dist`의 export를 쓴다. afds export를 바꾸면 둘 다 확인한다

## 작업 규칙

- 요청한 것만 수정한다. 주변 코드를 임의로 함께 바꾸지 않는다.
- Storybook의 JSDoc/description 기존 섹션은 API 변경 시에도 삭제하지 않고 내용만 갱신한다.
- 훅이 막으면 원인을 고치고 다시 커밋·푸시한다. `HUSKY`·`LEFTHOOK`·`LEFTHOOK_EXCLUDE` 끄기, `lefthook uninstall`, `core.hooksPath` 변경도 하지 않는다(`composition-new`의 개발자 넘김 경로만 예외).
- 계획·설계 문서를 쓴 작업은 구현 전에, 작성자와 분리된 리뷰어가 `/ponytail:ponytail-review`로 과설계 리뷰를 한다. 플러그인이 없으면 같은 관점(지울 것·과설계)으로 독립 리뷰한다. 자기 계획을 스스로 승인하지 않는다.

자주 쓰는 스킬: 커밋 `commit-with-format`, PR 메시지 `pr-message`, 컴포넌트 문서·테스트 갱신 `update-component-docs`, 신규 컴포넌트 스펙 `tech-spec`, 컴포지션 등록 `composition-new`.

## 예외

- [RULEFILE-SPLIT] 이 레포에서는 레포 규칙 파일을 `.claude/rules/`에 둔다. 이유: Claude Code가 `paths:` 조건으로 자동으로 읽는다. `.agents/rules/custom/`으로 옮기면 그 자동 로드가 사라진다
- [COMMENT-APPROVAL] 이 레포에서는 [code-comments.md](.claude/rules/code-comments.md)의 기준(왜·함정·출처)에 맞으면 승인 없이 쓴다. 이유: 하네스·래칫 코드는 바꾸면 조용히 깨지는 제약을 그 코드 옆에 남기는 것을 기준으로 삼는다
- [FSD-LAYER-DIR] 이 레포에서는 afds 레이어(`headless` → `bricks` → afds-registry 컴포지션) 방향을 따른다. 이유: FSD 레이어가 아니라 [afds-component-philosophy.md](.claude/rules/afds-component-philosophy.md)의 레이어를 쓴다
- [FSD-BARREL] 끈다. 이유: 파일·export 구조는 [afds-component-structure.md](.claude/rules/afds-component-structure.md)와 afds `exports`가 정한다
- [FSD-NO-CROSS] 끈다. 이유: bricks는 다른 brick을 조합해 만든다(예: `Select`가 `ScrollArea`를, `Stack`이 `Flex`를 쓴다)
- [AFDS-IMPORT] 이 레포에서는 `packages/afds` 안에서는 상대경로로 가져온다. 서브패스 import는 afds-registry·Storybook에만 적용한다. 이유: afds 자신의 소스다

<!-- BEGIN:governance -->
## PR

- PR은 `pnpm exec governance judge --create <gh pr create 인자>`로 연다. 등급 라벨, 리뷰어, 본문 등급 블록이 함께 붙는다. base를 바꾸면 `pnpm exec governance judge`를 다시 돌린다.
<!-- END:governance -->

<!-- BEGIN:mutation -->
## 뮤테이션

- `lib/`의 순수 함수를 바꿨으면 push 전에 `pnpm test:mutation --mutate '<파일>'`을 돌린다. CI에서는 돌지 않는다. 살아남은 변이는 테스트로 잡고, 잡을 수 없는 동등 변이만 PR 본문에 `파일:라인 | 변이 | 이유`로 남긴다.
<!-- END:mutation -->
