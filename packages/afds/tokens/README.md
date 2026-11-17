# AFDS Tokens

이 디렉토리의 토큰 파일들은 **소스 파일**(JSON)과 **자동 생성 파일**(CSS/TS)로 나뉩니다.

## 파일 구조

```
tokens/
├── index.css               — 마스터 임포트 (Tailwind + 토큰 순서대로) [수동]
├── fonts.css               — Pretendard CDN (선택 레이어) [수동]
├── tokens.css              — Primitive 토큰 (:root + @theme) [자동 생성]
├── tokens.semantic.css     — Semantic 토큰 (Primitive 참조) [자동 생성]
├── tokens.custom.css       — 그림자·Duration 변수 + Typography 유틸 [자동 생성]
├── tokens.effects.css      — AI 그라디언트 유틸 [자동 생성]
├── tokens.motion.css       — 키프레임 애니메이션 [수동]
└── json/
    ├── primitive.tokens.json   — Primitive 토큰 소스
    ├── semantic.tokens.json    — Semantic 토큰 소스
    ├── custom.tokens.json      — Custom 토큰 소스
    └── effects.tokens.json     — Effects 토큰 소스
```

> 자동 생성 여부는 각 파일 첫 줄 헤더로 확인합니다. `tokens.motion.css`만 자동 생성 대상이
> 아니며(직접 편집), `index.css`·`fonts.css`는 조립용 수동 파일입니다.
> tier 정의는 `token-bridge.config.ts` 에 있습니다 — primitive · semantic · custom · effects.
> TypeScript 타입은 `tokens/` 가 아니라 `src/schemas/tokens.schema.ts` 로 생성됩니다(아래 참조).

---

## 토큰 레이어 구조 (2-tier)

```
json/*.tokens.json
    ↓  pnpm --filter afds generate:tokens
tokens.css
  :root  { --afds-color-brand-500: #556af9; }   ← Primitive 원시값
  @theme { --color-afds-bg-brand: var(--afds-color-brand-500); }  ← Tailwind 유틸리티 생성
         ↓
tokens.semantic.css
  :root  { --afds-color-bg-brand: var(--afds-color-brand-500); }
  @theme { --color-afds-bg-brand: var(--afds-color-bg-brand); }
         ↓
컴포넌트: className="bg-afds-bg-brand text-afds-text-primary"
```

### Tier 1 — Primitive (`tokens.css`)

| 카테고리   | CSS 변수 예시                      | Tailwind 클래스 예시                     |
| ---------- | ---------------------------------- | ---------------------------------------- |
| Color      | `--afds-color-brand-500`           | `bg-afds-brand-500`                      |
| Spacing    | `--afds-spacing-spacing-8`         | `p-afds-spacing-8`, `gap-afds-spacing-8` |
| Radius     | `--afds-radius-md`                 | `rounded-afds-md`                        |
| Typography | `--afds-typography-font-size-s-16` | `text-afds-s-16`                         |

### Tier 2 — Semantic (`tokens.semantic.css`)

| 카테고리    | CSS 변수 예시                            | Tailwind 클래스 예시                |
| ----------- | ---------------------------------------- | ----------------------------------- |
| Background  | `--afds-color-bg-surface`                | `bg-afds-bg-surface`                |
| Background  | `--afds-color-bg-brand`                  | `bg-afds-bg-brand`                  |
| Text        | `--afds-color-text-primary`              | `text-afds-text-primary`            |
| Text        | `--afds-color-text-secondary`            | `text-afds-text-secondary`          |
| Border      | `--afds-color-border-default`            | `border-afds-border-default`        |
| Border      | `--afds-color-border-focus`              | `ring-afds-border-focus`            |
| Icon        | `--afds-color-icon-brand`                | `text-afds-icon-brand`              |
| Divider     | `--afds-color-divider-default`           | `border-afds-divider-default`       |
| Interaction | `--afds-color-interaction-hover-overlay` | `bg-afds-interaction-hover-overlay` |

**컴포넌트에서는 Semantic 토큰을 우선 사용합니다.**

---

## 토큰 수정 방법

### 기존 Primitive 값 변경

`json/primitive.tokens.json`을 수정한 뒤 재생성합니다.

```bash
pnpm --filter afds generate:tokens
```

재생성 결과:

- `tokens.css` — Primitive CSS 변수
- `tokens.semantic.css` — Semantic CSS 변수
- `tokens.custom.css` — Custom 변수 + Typography 유틸리티
- `tokens.effects.css` — Effects 유틸리티
- `src/schemas/tokens.schema.ts` — Zod 스키마 + TypeScript 타입

### 새 Semantic 토큰 추가

`json/semantic.tokens.json`에 항목을 추가하고 재생성합니다.

```json
{
  "color": {
    "bg": {
      "accent": { "$value": "{color.brand.300}", "$type": "color" }
    }
  }
}
```

재생성 후 `tokens.semantic.css`에 `--color-afds-bg-accent`가 생성되어
`bg-afds-bg-accent` 클래스로 사용 가능합니다.

### Primitive 팔레트 직접 수정 (임시)

재생성 없이 빠르게 확인할 때는 `tokens.css`를 직접 수정합니다.

```css
/* tokens.css */
:root {
  --afds-color-brand-500: #7c3aed;
}
```

> 이 변경은 `generate:tokens` 실행 시 덮어씌워집니다. JSON 소스를 함께 수정하세요.

### 외부 프로젝트에서 override

```css
/* 외부 프로젝트의 global.css */
@import '@turbo-project/afds/tokens.css';
@import '@turbo-project/afds/tokens.semantic.css';

:root {
  /* Primitive 재정의 → 모든 Semantic 토큰에 자동 반영 */
  --afds-color-brand-500: #7c3aed;
}
```

---

## 다크 모드 — 지원하지 않습니다

`<html class="dark">` 를 붙여도 아무 일도 일어나지 않습니다. 이 디렉터리의 어떤 CSS 에도
`.dark` 셀렉터나 `@custom-variant dark` 배선이 없고, `token-bridge.config.ts` 에 `dark` tier 가
없으며 `figma-export.json` 의 `$themes` 는 빈 배열입니다. 지원 계획도 없습니다(2026-08-27 확인).

`tokens.dark.css` 와 `@turbo-project/afds/tokens.dark.css` export 는 파이프라인이 만들지 않는
고아 파일이어서 제거됐습니다(v0.7.2). 상세는 `../README.md` §3.1.

---

## Custom 토큰 (`tokens.custom.css`)

### 그림자

| 클래스          | 설명        |
| --------------- | ----------- |
| `shadow-afds-1` | 기본 그림자 |
| `shadow-afds-2` | 강한 그림자 |

### Duration (애니메이션 시간)

| `--animation-*` 변수 | 값     |
| -------------------- | ------ |
| `--animation-100`    | 100ms  |
| `--animation-200`    | 200ms  |
| `--animation-300`    | 300ms  |
| `--animation-500`    | 500ms  |
| `--animation-700`    | 700ms  |
| `--animation-1000`   | 1000ms |
| `--animation-3000`   | 3000ms |
| `--animation-5000`   | 5000ms |

> Tailwind 유틸리티는 생성되지 않습니다(`--animation-*` 은 Tailwind 네임스페이스가 아님).
> `transition-duration: var(--animation-200)` 처럼 `var()` 로 참조합니다.

### Typography 유틸리티

| 유틸 클래스 | 크기 | 용도      |
| ----------- | ---- | --------- |
| `heading0`  | 36px | 최대 제목 |
| `heading1`  | 24px | 대제목    |
| `heading2`  | 20px | 중제목    |
| `title1`    | 18px |           |
| `title2`    | 16px |           |
| `title3`    | 14px |           |
| `title4`    | 12px |           |
| `body1`     | 16px | 본문      |
| `body2`     | 14px | 본문 보조 |
| `body3`     | 12px | 본문 소형 |
| `caption1`  | 12px | 캡션      |
| `caption2`  | 10px | 최소 캡션 |

```tsx
<h1 className="heading1">제목</h1>
<p className="body2">본문</p>
<span className="caption1">캡션</span>
```

---

## Effects 토큰 (`tokens.effects.css`)

> `generate:tokens`로 재생성됩니다 — 소스는 `json/effects.tokens.json` 입니다.
> 파일을 직접 고치면 재생성 시 덮어씌워집니다.

| 유틸 클래스          | 설명                        |
| -------------------- | --------------------------- |
| `text-gradient-ai`   | AI 브랜드 텍스트 그라디언트 |
| `bg-gradient-ai`     | AI 브랜드 배경 그라디언트   |
| `border-gradient-ai` | AI 브랜드 테두리 그라디언트 |

---

## Motion 토큰 (`tokens.motion.css`)

> 수동 관리 파일입니다. `generate:tokens`로 재생성되지 않습니다.

| 키프레임           | 용도                         |
| ------------------ | ---------------------------- |
| `shimmer`          | 스켈레톤 로딩 shimmer 효과   |
| `progress-shimmer` | Progress bar shimmer 효과    |
| `spinner-dash`     | SVG 스피너 stroke 애니메이션 |
| `breathing`        | 펄스·호흡 opacity/scale 효과 |

---

## TypeScript 타입 · Zod 스키마

`generate:tokens` 는 토큰 JSON 에서 `src/schemas/tokens.schema.ts` 를 생성합니다
(경로는 `token-bridge.config.ts` 의 `typescript.zodOutput`). `@turbo-project/afds/schemas` 로 노출됩니다.

```ts
import {
  type PrimitiveColor, // 'brand-100' | 'brand-300' | 'gray-0' | ...
  type PrimitiveRadius, // 'pill' | 'lg' | 'md' | 'sm'
  type PrimitiveSpacing,
  type PrimitiveTypography,
  type SemanticColor, // 'bg-surface' | 'text-primary' | 'border-default' | ...
  type CustomShadow, // '1' | '2'
  type CustomDuration, // '100' | '200' | ... | '5000'
  type CustomText, // 'heading0' | 'heading1' | ... | 'caption2'
  SemanticColorSchema, // z.enum — 런타임 검증용
  SEMANTIC_COLOR_VALUES, // readonly string[] — 목록 순회용
} from '@turbo-project/afds/schemas'
```

각 타입에는 같은 이름의 `*Schema`(Zod enum)와 `*_VALUES`(const 배열)가 함께 생성됩니다.

> **`@turbo-project/afds/tokens` 는 CSS 엔트리입니다** — TypeScript 모듈이 아닙니다.
> 토큰 원본 CSS 를 조립해 가져올 때 쓰고(§파일 구조의 `index.css`), 타입은 위 `schemas` 를 씁니다.

> 컴포넌트에서 토큰을 쓰는 규칙은 `.claude/rules/afds-component-tokens.md`
> (모노레포 체크아웃 전용 — npm tarball 에는 없습니다)를 참조하세요.

---

## 토큰 재생성

```bash
pnpm --filter afds generate:tokens
```

JSON 소스 수정 후 반드시 실행합니다. 재생성된 파일은 커밋에 포함합니다.

토큰 수정 시 대응하는 스토리 파일도 함께 업데이트합니다:

| 수정한 파일                                    | 업데이트할 스토리                      |
| ---------------------------------------------- | -------------------------------------- |
| `tokens.css` / `primitive.tokens.json`         | `stories/primitive-tokens.stories.tsx` |
| `tokens.semantic.css` / `semantic.tokens.json` | `stories/design-tokens.stories.tsx`    |
| `tokens.custom.css` / `custom.tokens.json`     | `stories/custom-tokens.stories.tsx`    |
| `tokens.effects.css`                           | `stories/effects-tokens.stories.tsx`   |
| `tokens.motion.css`                            | `stories/motion-tokens.stories.tsx`    |
