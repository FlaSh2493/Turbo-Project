# AFDS Overview

> Agent Friendly Design System — 의도, 아키텍처, 운영 규칙

이 문서는 **AFDS를 처음 접하는 동료(개발자/디자이너/AI 에이전트)** 가 한 번 읽고 전체 그림을 잡기 위한 공유 설명문이다. 설치·사용법 매뉴얼은 [README.md](../README.md), 신규 컴포넌트 작성 절차는 [creating-components.md](./creating-components.md)를 참고한다.

---

## 1. AFDS는 무엇인가

**Agent Friendly Design System (AFDS)** 은 Base UI + Tailwind CSS v4 위에 구축된, **사람과 AI 에이전트 모두에게 명확한** 디자인 시스템이다.

- 패키지: [`@turbo-project/afds`](../package.json) (`packages/afds`)
- 소비처: 모노레포 내부 앱들 + [`apps/storybook`](../../../apps/storybook)
- 대체 대상: 앱별로 흩어져 있던 UI 코드, ad-hoc Tailwind 클래스, 일회성 컴포넌트

### "Agent Friendly"의 의미

AFDS는 LLM 에이전트가 컴포넌트를 **추측하지 않고** 사용할 수 있도록 다음을 1급 산출물로 제공한다.

| 산출물          | 위치                               | 용도                                                                                     |
| --------------- | ---------------------------------- | ---------------------------------------------------------------------------------------- |
| `manifest.json` | `dist/manifest.json`               | 컴포넌트별 summary·rules·examples·slots JSON 카탈로그                                    |
| `llms.txt`      | `dist/llms.txt`                    | LLM 읽기용 plain text 카탈로그                                                           |
| `*.spec.md`     | `src/bricks/<name>/<name>.spec.md` | variants 표, ARIA 속성, 사용 규칙                                                        |
| `data-*` 속성   | DOM 출력                           | `data-slot`(표준) · 일부 컴포넌트의 `data-variant`/`data-size` (`data-component` 미사용) |

---

## 2. 설계 의도 (Why)

1. **결정론 (Deterministic)** — 동일한 prop은 항상 동일한 마크업·스타일·접근성으로 렌더된다. variant/size는 명시적으로 열거하며 임의값(`text-[#abc123]` 등)을 허용하지 않는다.
2. **명세-코드 1:1** — 컴포넌트는 `.tsx` / `.style.ts` / `.spec.md` / `.stories.tsx` 4종 산출물을 갖는 것을 규칙으로 한다. **신규·마이그레이션 완료 컴포넌트에 적용**되며, 재정렬 중인 구 컴포넌트는 §6 참조. 에이전트가 읽는 문서가 곧 진실의 원천이다.
3. **점진적 탈출구 (Escape Hatches)** — 커스터마이징은 다음 순서로만 허용한다.
   1. `className` 추가
   2. `data-slot` 선택자 활용
   3. CSS 변수(`--afds-color-brand-500` 등 Primitive 원시 변수) override
   4. Headless 직접 사용 (스타일 없이 접근성만)
4. **접근성 우선** — Base UI를 기반으로 ARIA·키보드·포커스 관리가 기본값으로 제공된다.

---

## 3. 아키텍처

### 3.1 레이어 구조

```
src/
├─ headless/        ← Base UI 위 얇은 래퍼 / 시각 스타일 없이 동작·접근성·상태만
├─ bricks/          ← Headless + CVA + 토큰 = 기본 부품 (Button, Input, Modal ...)
├─ hooks/           ← 공용 훅
├─ lib/             ← 유틸 (cn = lib/utils, slot/mergeRefs = lib/slot)
├─ schemas/         ← 매니페스트 생성을 위한 Zod 스키마
└─ styles/          ← 디자인 토큰 (json, css, ts)
```

**의존 방향**: `headless ← bricks`. 역방향 import 금지. 같은 레이어 안에서도 횡단 의존을 최소화한다.

**Compositions는 이 패키지에 없다(upstream #143).** 도메인 패턴(base-input · base-select ·
date-picker 등)은 `packages/afds-registry/src/compositions/`에 있고, 패키지 entry가 아니라
표준 `shadcn add FlaSh2493/turbo-project/<name>#<ref>` 로 소비자 코드베이스에 복사-소유된다. 예전에는 이
패키지 안의 `src/compositions/`가 별도 npm entry(`@turbo-project/afds/compositions`)로 노출됐으나
그 entry는 제거됐다.

### 3.2 토큰 시스템

`token-bridge.config.ts`가 JSON → CSS/Tailwind `@theme`를 생성한다. tier는 **primitive · semantic · custom · effects** 4종이다(motion은 현재 파이프라인 밖에서 수동 관리). 컴포넌트는 **semantic 토큰을 우선 참조**한다.

| 계층          | 예 (Tailwind 클래스)                                                         |
| ------------- | ---------------------------------------------------------------------------- |
| **Semantic**  | `bg-afds-bg-surface`, `text-afds-text-primary`, `border-afds-border-default` |
| **Primitive** | `bg-afds-gray-*`, `text-afds-brand-*` (semantic alias가 없을 때만)           |

- 동적 색상·spacing·radius는 CVA `variants`/`compoundVariants`에 **완성된 클래스**를 매핑한다 (런타임 조립 헬퍼 없음).
- **금지**: 임의 색상 하드코딩, Tailwind 기본 팔레트를 컴포넌트에서 직접 사용, `style={{ color: ... }}` 형태의 색상 주입, 템플릿 리터럴로 클래스 조합.
- 다크 모드는 지원하지 않는다 — 배포 CSS 에 `.dark` 배선이 없고 파이프라인에 `dark` tier 도 없다 (`README.md` §3.1).
- 상세: [.claude/rules/afds-component-tokens.md](../../../.claude/rules/afds-component-tokens.md), [tokens/README.md](../tokens/README.md)

### 3.3 컴포넌트 구조 (4종 세트)

모든 컴포넌트는 다음 파일을 **모두** 가진다.

```
src/bricks/<category>/<name>/
├─ <name>.tsx         ← 구현 (React + Headless/Primitive + cn())
├─ <name>.style.ts      ← CVA variants 정의
├─ <name>.spec.md     ← variants 표 / Sizes / ARIA Attributes / Rules
└─ <name>.stories.tsx ← Storybook (Default, AllVariants, AllSizes, Disabled 필수)
```

- 신규 컴포넌트 작성 절차: [creating-components.md](./creating-components.md) (CVA → 컴포넌트 → spec.md → Storybook → 테스트 → export)
- 구조 규칙 상세: [.claude/rules/afds-component-structure.md](../../../.claude/rules/afds-component-structure.md)

### 3.4 패키지 entry & 빌드

`package.json` 의 서브패스 export로 진입점을 분리한다.

- `@turbo-project/afds` — bricks + headless + hooks + lib + schemas
- `@turbo-project/afds/bricks` — Bricks 레이어
- `@turbo-project/afds/headless` — Headless 레이어 (스타일 없음)
- `@turbo-project/afds/hooks`, `@turbo-project/afds/lib/utils`, `@turbo-project/afds/lib/compose-event-handlers` — 보조 export
- Compositions 는 이 패키지의 entry가 아니다 — §3.1 참고(표준 `shadcn add` 로 배포)

빌드/검증 도구: tsup (ESM+CJS dual), vitest (jsdom), Storybook.

---

## 4. 운영 규칙 (Rules)

세부 규칙은 [.claude/rules/](../../../.claude/rules/) 에 있다. 핵심만 옮기면 다음과 같다.

### 4.1 Prop 명명

- `variant` — 시각적 외형 (`default | outline | destructive ...`)
- `size` — `sm | md | lg` 가 기본. `xs`/`xl` 등 예외는 spec.md에 이유를 명시
- 상태 prop은 boolean: `disabled`, `loading`, `readOnly`
- `className` 은 항상 허용 (`cn()` 으로 Tailwind 충돌 자동 해결)
- `color` prop은 **시맨틱 토큰만** 허용. 자유 색상은 className/CSS 변수로
- 상세: [prop-naming-conventions.md](./prop-naming-conventions.md), [naming-consistency.md](./naming-consistency.md)

### 4.2 Storybook

- Title 패턴: `'AFDS / Bricks / {Category} / {ComponentName}'`
- 필수 스토리: `Default`, `AllVariants`, `AllSizes`, `Disabled`
- 상태가 있는 예제는 **기명 함수**로 작성 (`render: function NamedExample() { ... }`)
- 스토리는 **렌더 시점에 `new Date()`·`Math.random()` 을 쓰지 않는다** — Chromatic 이 매일 거짓
  "변경" 을 내면 사람이 맹목 수락을 학습해 시각 회귀 검사의 신호가 0이 된다.
  가드와 우회 한계: [story-determinism.md](./story-determinism.md)
- 상세: [.claude/rules/afds-storybook.md](../../../.claude/rules/afds-storybook.md), [storybook-guidelines.md](./storybook-guidelines.md)

- 모달·드로어 **안에서 연 오버레이**는 그 모달/드로어 DOM 안에 머문다 — `container` 를 넘기지 않는다.
  `<AfdsScope>` 만으로는 부족하다(스코프 포털 타깃은 모달의 **형제**다).
  이것이 없어서 소비처가 모달 안에서 `Select` 을 포기한 적이 있다:
  [nested-overlay-portal.md](./nested-overlay-portal.md)

### 4.3 컴포지션

- Destructive 액션은 반드시 Dialog 확인을 거친다.
- Headless를 **앱 코드에서 직접 노출하지 않는다.** (컴포넌트/컴포지션을 통해 노출)
- 패턴 카탈로그: [composition-patterns.md](./composition-patterns.md), [composition-recipes.md](./composition-recipes.md)

### 4.4 토큰

- Semantic alias 우선, primitive 토큰은 alias가 없을 때만
- 동적 값은 CVA `variants`/`compoundVariants`에 완성된 클래스로 매핑, `style` 로 색상 주입 금지

---

## 5. 진입점 (Who reads what)

| 역할                  | 출발점                                                                                                                                                         |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **소비자(앱 개발자)** | [README.md](../README.md) → 필요 시 [composition-patterns.md](./composition-patterns.md)                                                                       |
| **컨트리뷰터**        | 이 문서 → [creating-components.md](./creating-components.md) → [.claude/rules/afds-component-structure.md](../../../.claude/rules/afds-component-structure.md) |
| **AI 에이전트**       | `dist/llms.txt` → `dist/manifest.json` → 해당 컴포넌트의 `spec.md` → 동일 폴더 `.tsx` (Props/JSDoc)                                                            |
| **디자이너/UX**       | [design-principles/](./design-principles/) → [tokens/README.md](../tokens/README.md)                                                                           |

---

## 6. 현재 상태 및 한계

- 버전: `0.7.1` — 실소비자(소비처 앱) 존재, 1.0을 향한 신뢰 복구 진행 중
- Registry 기능은 `packages/afds-registry` 로 이전됐고, 소비는 표준 `npx shadcn@4.19.1 add FlaSh2493/turbo-project/<component>#<ref>` 로 한다(자체 CLI 는 제거됨)
- 일부 구 컴포넌트는 점진적으로 신규 구조(4종 세트)로 재정렬 중이다. v0.7.2 기준 `.tsx` 보유 61개 중 **22개가 `.style.ts` 미보유**(compositions 18 + bricks 4 — `layout/box`, `animation/fade-in`·`fade-swap`·`smooth-list`). 신규 작업은 무조건 새 규칙을 따른다.

---

## 참고 문서

- 철학: [.claude/rules/afds-component-philosophy.md](../../../.claude/rules/afds-component-philosophy.md)
- 구조: [.claude/rules/afds-component-structure.md](../../../.claude/rules/afds-component-structure.md)
- 토큰: [.claude/rules/afds-component-tokens.md](../../../.claude/rules/afds-component-tokens.md)
- Storybook: [.claude/rules/afds-storybook.md](../../../.claude/rules/afds-storybook.md)
- 작성 가이드: [creating-components.md](./creating-components.md)
- 컴포지션: [composition-patterns.md](./composition-patterns.md) · [composition-recipes.md](./composition-recipes.md)
- 명명: [prop-naming-conventions.md](./prop-naming-conventions.md) · [naming-consistency.md](./naming-consistency.md)
- 공존(다른 디자인시스템과 `.afds` 스코프 격리): [scoped-coexistence.md](./scoped-coexistence.md)
