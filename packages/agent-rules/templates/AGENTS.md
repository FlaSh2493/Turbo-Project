<!--
이 파일은 레포 AGENTS.md 견본이다. 채우는 법은 @turbo-project/agent-rules README의 "처음 적용하는 워크플로"에 있다.
- 제목 바로 아래에 `agent-rules init`이 agent-rules 블록을 넣는다. 블록 안은 고치지 않는다.
- 블록 밖은 이 레포가 관리한다. `## 이 레포`, `## 명령`, `## 브랜치와 배포`, `## 예외` 섹션 이름은 바꾸지 않는다. 공통 규칙이 이 이름으로 가리킨다.
- [예: ...] 는 빈칸이다. 레포를 읽고 이 레포의 값으로 바꾼다. 근거가 없으면 지어내지 말고 사람에게 묻는다.
- [사람 · 예: ...] 는 사람에게 물어서 채운다.
- [선택] 주석이 달린 줄과 섹션은 해당될 때만 남기고, 아니면 지운다.
- 다 채우면 이 안내 주석을 포함해 모든 주석을 지운다.
-->

# [예: ad-dashboard]

# 레포 규칙

[예: 광고주가 캠페인 성과를 보는 웹 앱이다. package.json name은 web이다.]

코드만 봐서는 알 수 없는 것만 적는다. 기계가 막는 규칙은 lint 에러 메시지가 고칠 방법까지 알려준다.

## 이 레포

- 스택: [예: Next.js App Router, TypeScript, TanStack Query, zustand, afds, Vitest]
- 패키지 매니저와 Node: [예: pnpm(package.json의 packageManager), Node는 .nvmrc]
- 설치: [예: `pnpm bootstrap`. 사설 패키지 401이면 `gh auth refresh -h github.com -s read:packages`]
- env: [예: `.env.local`을 쓴다. 값은 팀 비밀 저장소의 web-dev 항목에서 받고, 여기에는 쓰지 않는다]
- 로컬 실행에 필요한 외부 의존: [예: 개발 API 서버. VPN이 필요하다] <!-- [선택] 있을 때만 -->
- 요구사항 출처와 우선순위: [예: Jira 이슈(ABC-NNNN) > PRD > 현재 코드 > 프로토타입]
- 출처가 다른 레포에 있으면 읽는 법: [예: `gh api repos/acme/web-prd/contents/prd.md -H "Accept: application/vnd.github.raw"`] <!-- [선택] 있을 때만 -->
- 큰 변경으로 보는 영역: [사람 · 예: 인증·세션, 결제, 배포·CI, 외부 쓰기, 공개 API 발행]
- 확인받을 작업: [사람 · 예: 패키지 추가. 먼저 묻고 승인받는다] <!-- [선택] [BASE-CONFIRM] 말고 이 레포에만 있는 것 -->

<!-- 린트가 막는 규칙은 "린트가 막는다"고만 적고 되풀이하지 않는다. -->

| 위치                   | 두는 것                                                                 |
| ---------------------- | ----------------------------------------------------------------------- |
| [예: `src/app`]        | [예: 라우트와 전역 Provider. 비즈니스 로직은 두지 않는다]               |
| [예: `src/features/*`] | [예: 기능 하나의 UI, API 훅, 상태. 슬라이스끼리 import는 린트가 막는다] |
| [예: `src/shared`]     | [예: 어떤 도메인에도 묶이지 않는 재사용 코드]                           |

## 규칙 파일

공통 규칙 파일은 위 블록에 있다. 여기에는 레포 규칙 파일(`.agents/rules/custom/`)을 언제 읽는지와 함께 적는다.

- [예: 결제 화면을 다룰 때는 [payment.md](.agents/rules/custom/payment.md)] <!-- [선택] 레포 규칙 파일이 있으면 -->

## 명령

검증 명령. CI와 같은 순서다.

```bash
[예: pnpm lint && pnpm check-types && pnpm test && pnpm build]
```

- 반복 확인: [예: `pnpm exec vitest run --changed`]
- 파일 단위 테스트: [예: `pnpm exec vitest run src/features/order`]
- 린트가 도는 곳: [예: CI와 pre-commit(lint-staged). 실패하면 `pnpm exec eslint --fix <파일>`로 그 파일만 고친다]
- 대상 판별과 사전 빌드: [예: `apps/web`을 바꾸면 `pnpm --filter web test`. `packages/ui`를 바꿨으면 먼저 `pnpm --filter ui build`] <!-- [선택] 모노레포만 -->
- react-doctor: [예: 검증 명령 끝의 `pnpm run doctor --scope changed --base origin/develop --blocking warning`. `--base`가 최신이도록 먼저 `git fetch origin develop`을 한다] <!-- [선택] react-doctor를 쓰는 레포만 -->
- PR에서만 도는 검사: [예: 의존성 취약점 검사(`dependency-audit.yml`)] <!-- [선택] 있을 때만 -->
- 앱 띄우기: [예: `pnpm dev`, 포트 3000]
- 확인할 화면 폭: [예: 1280px. 모바일은 지원하지 않는다]
- 분기 화면을 바꿔 보는 법: [예: MSW 핸들러의 응답을 바꾼다] <!-- [선택] 있을 때만 -->

## 브랜치와 배포

- 보호 브랜치: [예: `main`, `develop`]. 새 브랜치 이름: [예: `feature/ABC-1234-order-list`]. PR base 기본값: [예: `develop`]
- `main`으로는 [사람 · 예: `develop`, `hotfix/*`, `release/*`]에서만 PR을 연다.
- 커밋 scope 기준: [예: FSD 슬라이스 이름(`order`, `user`). 루트 설정과 문서는 scope를 생략한다]
- 커밋 메시지 훅: [예: commitlint가 제목 형식을 검사한다]
- 배포: [예: `develop` 푸시는 dev, `main` 푸시는 prod에 배포된다. `deploy.yml`이 이미지를 만들고 GitOps 차트의 태그를 올린다]
- 함께 깨지는 곳: [예: 이 레포의 `/api/report` 응답을 admin 레포가 쓴다] <!-- [선택] 있을 때만 -->

## 예외

<!-- 공통 규칙을 바꾸거나 끄는 것만 둔다. 바꾸기: "- [ID] 이 레포에서는 …. 이유: …", 끄기: "- [ID] 끈다. 이유: …". 🔒 규칙은 쓸 수 없다. 없으면 "없다."로 둔다. -->

없다.
