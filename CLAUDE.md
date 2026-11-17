# turbo-project — AI 에이전트 작업 지침

이 저장소의 주요 작업 영역은 `packages/afds` (Agent Friendly Design System)다.
`.claude/rules/*` 는 `paths:` 조건에 맞는 파일을 열면 자동 로드된다 — 직접 Read 할 필요 없다. 아래는 어떤 규칙이 있는지 찾는 인덱스다.

## AFDS 컴포넌트 작업

- [.claude/rules/afds-component-philosophy.md](.claude/rules/afds-component-philosophy.md) — 설계 철학 · 레이어(`headless / bricks / compositions`) 선택 기준
- [.claude/rules/afds-component-structure.md](.claude/rules/afds-component-structure.md) — 파일/폴더 구조 규칙
- [.claude/rules/afds-component-tokens.md](.claude/rules/afds-component-tokens.md) — 토큰 사용 규칙
- [.claude/rules/afds-component-patterns.md](.claude/rules/afds-component-patterns.md) — `render` · `Trigger` · `Indicator` 합성 패턴 규칙
- [.claude/rules/afds-composition-structure.md](.claude/rules/afds-composition-structure.md) — afds-registry 컴포지션 구조 규칙 (신규 등록은 `composition-new` 스킬)
- [packages/afds/docs/creating-components.md](packages/afds/docs/creating-components.md) — 신규 컴포넌트 생성 절차
- [packages/afds/docs/composition-patterns.md](packages/afds/docs/composition-patterns.md) / [composition-recipes.md](packages/afds/docs/composition-recipes.md) — 컴포지션 패턴
- [packages/afds/docs/prop-naming-conventions.md](packages/afds/docs/prop-naming-conventions.md) — prop 네이밍

## 코드 주석

- [.claude/rules/code-comments.md](.claude/rules/code-comments.md) — 주석은 코드가 말하지 못하는 것만 · 되풀이는 지우고 함정은 남긴다

## 버전·배포

- [.claude/rules/versioning.md](.claude/rules/versioning.md) — 패키지 버전은 코드 표면의 계약 · 별도 채널이 있으면 그것으로 나른다

## Storybook 작성

- [.claude/rules/afds-storybook-headless.md](.claude/rules/afds-storybook-headless.md)
- [.claude/rules/afds-storybook-components.md](.claude/rules/afds-storybook-components.md)
- [.claude/rules/afds-storybook-compositions.md](.claude/rules/afds-storybook-compositions.md)
- [.claude/rules/afds-storybook-patterns.md](.claude/rules/afds-storybook-patterns.md)
- [packages/afds/docs/storybook-guidelines.md](packages/afds/docs/storybook-guidelines.md)

## 디자인 원칙 · 네이밍 · 개선 계획

- [packages/afds/docs/overview.md](packages/afds/docs/overview.md)
- [packages/afds/docs/design-principles/](packages/afds/docs/design-principles/)
- [packages/afds/docs/naming-consistency.md](packages/afds/docs/naming-consistency.md)
- [packages/afds/docs/layout-improvements.md](packages/afds/docs/layout-improvements.md)
- [packages/afds/docs/token-improvement-plan.md](packages/afds/docs/token-improvement-plan.md)
- [packages/afds/docs/enhancement-plan.md](packages/afds/docs/enhancement-plan.md)

## 하네스 · CI

- [docs/info/harness.md](docs/info/harness.md) — 기계 검사 전체 목록(CI 구조 · 셸 스위트 · vitest · 생성물 정합 · oxlint+ESLint · 타입 게이트) · 유지보수 함정 · 새 검사 추가 절차

## 작업 규칙

- 요청한 것만 수정한다. 주변 코드를 임의로 함께 바꾸지 않는다.
- Storybook의 JSDoc/description 기존 섹션은 API 변경 시에도 삭제하지 않고 내용만 갱신한다.
- 훅이 막으면 원인을 고치고 다시 커밋·푸시한다. `--no-verify`·`HUSKY`·`LEFTHOOK`·`LEFTHOOK_EXCLUDE` 끄기·`lefthook uninstall`·`core.hooksPath` 변경 금지 (`composition-new` 의 개발자 넘김 경로만 예외).
- 계획·설계 문서를 쓴 작업은 구현 전에, 작성자와 분리된 리뷰어가 `/ponytail:ponytail-review` 로 과설계 리뷰를 한다. 플러그인이 없으면 같은 관점(지울 것·과설계)으로 독립 리뷰한다. 자기 계획을 스스로 승인하지 않는다.

## 자주 쓰는 스킬

- 커밋: "ㅋㅁ" / "커밋" → `commit-with-format`
- PR 메시지: "PR 메시지" / "풀리퀘" → `pr-message`
- 컴포넌트 문서/테스트 갱신: "스토리북 업데이트" → `update-component-docs`
- 신규 컴포넌트 스펙: "테크스펙" → `tech-spec`
- 컴포지션 등록: "컴포지션 등록" → `composition-new`
