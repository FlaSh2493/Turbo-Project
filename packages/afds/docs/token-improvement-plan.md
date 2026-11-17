# AFDS 토큰 개선 계획 (Token Improvement Plan)

이 문서는 AFDS 컴포넌트를 디자인 토큰으로 완전히 제어하기 위한 Primitive/Semantic 토큰 확장 계획을 정의합니다.
`figma-token-bridge`를 통해 JSON → CSS/TypeScript 자동 생성 파이프라인을 유지하면서 토큰 체계를 완성합니다.

---

## 1. 현황 분석 (Current State)

### 현재 토큰 구조

```
tokens/json/
├── primitive.tokens.json   ← 원시 팔레트·수치 (color, spacing, radius, shadow 등)
├── semantic.tokens.json    ← color 의미 alias (afds-bg-*, afds-text-*, afds-border-* 등)
├── custom.tokens.json      ← 커스텀 토큰
└── effects.tokens.json     ← 이펙트 토큰
```

> dark/motion은 `tokens/json/`이 아니라 `tokens/tokens.dark.css`·`tokens/tokens.motion.css`로 파이프라인 밖에서 수동 관리된다(§5 참고).

### 부족한 부분

| 카테고리       | Primitive | Semantic | 상태          |
| -------------- | --------- | -------- | ------------- |
| Color          | ✅        | ✅       | 완료          |
| Spacing        | ✅        | ❌       | Semantic 없음 |
| Radius         | ✅        | ❌       | Semantic 없음 |
| Shadow         | ✅        | ❌       | Semantic 없음 |
| **Typography** | ❌        | ❌       | 미정의        |
| **Opacity**    | ❌        | ❌       | 미정의        |
| **Animation**  | ❌        | ❌       | 미정의        |

현재 컴포넌트들은 `text-sm`, `rounded-md` 같은 Tailwind 유틸리티를 직접 사용하고 있어,
토큰 기반 제어가 불가능한 상태.

---

## 2. Primitive vs Semantic 역할 구분

토큰을 추가하기 전에, 두 레이어의 역할 차이를 명확히 이해해야 합니다.

```
Primitive  = "얼마짜리 값인가"     → spacing.4 = 16px
Semantic   = "어디에 쓰이는 값인가" → spacing.component-md = {spacing.4}
Component  = "어떤 컴포넌트가 쓰는가" → --cmp-button-px: var(--afds-spacing-component-md)
```

**Spacing을 예시로:**

```
spacing.4 (primitive)              → 16px 라는 raw 값
spacing.component-md (semantic)    → "컴포넌트 기본 패딩"이라는 의미 = {spacing.4}
--cmp-button-px (component)        → 버튼이 component-md를 쓴다
```

Spacing/Radius/Shadow도 Semantic 레이어가 필요한 이유:
컴포넌트가 `var(--spacing-4)` 직접 참조 시 → 특정 값에 종속됨
컴포넌트가 `var(--afds-spacing-component-md)` 참조 시 → 의미에 종속, 값 교체 자유

---

## 3. Primitive 토큰 확장

**파일**: `packages/afds/tokens/json/primitive.tokens.json`

### 3-1. Typography (신규)

폰트 크기, 굵기, 행간의 raw 스케일 정의.

```json
{
  "font": {
    "size": {
      "xs": { "$value": "12px", "$type": "fontSizes" },
      "sm": { "$value": "14px", "$type": "fontSizes" },
      "md": { "$value": "16px", "$type": "fontSizes" },
      "lg": { "$value": "18px", "$type": "fontSizes" },
      "xl": { "$value": "20px", "$type": "fontSizes" },
      "2xl": { "$value": "24px", "$type": "fontSizes" },
      "3xl": { "$value": "30px", "$type": "fontSizes" }
    },
    "weight": {
      "regular": { "$value": "400", "$type": "fontWeights" },
      "medium": { "$value": "500", "$type": "fontWeights" },
      "semibold": { "$value": "600", "$type": "fontWeights" },
      "bold": { "$value": "700", "$type": "fontWeights" }
    },
    "line-height": {
      "tight": { "$value": "1.25", "$type": "lineHeights" },
      "normal": { "$value": "1.5", "$type": "lineHeights" },
      "relaxed": { "$value": "1.75", "$type": "lineHeights" }
    }
  }
}
```

### 3-2. Opacity (신규)

Disabled, muted, overlay 등에 사용할 투명도 스케일.

```json
{
  "opacity": {
    "0": { "$value": "0", "$type": "opacity" },
    "25": { "$value": "0.25", "$type": "opacity" },
    "50": { "$value": "0.5", "$type": "opacity" },
    "75": { "$value": "0.75", "$type": "opacity" },
    "100": { "$value": "1", "$type": "opacity" }
  }
}
```

### 3-3. Animation (신규)

트랜지션/애니메이션의 timing 스케일.

```json
{
  "animation": {
    "duration": {
      "fast": { "$value": "100ms", "$type": "other" },
      "normal": { "$value": "150ms", "$type": "other" },
      "slow": { "$value": "300ms", "$type": "other" }
    },
    "easing": {
      "linear": { "$value": "linear", "$type": "other" },
      "ease-in": { "$value": "cubic-bezier(0.4, 0, 1, 1)", "$type": "other" },
      "ease-out": { "$value": "cubic-bezier(0, 0, 0.2, 1)", "$type": "other" },
      "ease-in-out": { "$value": "cubic-bezier(0.4, 0, 0.2, 1)", "$type": "other" }
    }
  }
}
```

---

## 4. Semantic 토큰 확장

**파일**: `packages/afds/tokens/json/semantic.tokens.json`

Semantic 토큰은 반드시 Primitive 토큰을 `{category.key}` 형식으로 참조합니다.
직접 값(예: `"16px"`)을 쓰지 않습니다.

### 4-1. Color Semantic (기존 유지)

현재 정의된 semantic color는 유지합니다.

```
surface, surface-subtle, surface-muted
fg, fg-muted, fg-inverse, fg-disabled
surface-disabled
brand, brand-hover, brand-subtle
error, error-hover, error-subtle
warning, warning-subtle
success, success-subtle
line, link
```

**추가 검토 항목:**

- `surface-brand` — brand 색 배경 (채워진 primary 버튼용)
- `focus-ring` — 포커스 아웃라인 색 (접근성 강화)

### 4-2. Spacing Semantic (신규)

> **우선순위 하향 (Astryx 근거)**: Astryx 비교 분석([astryx-analysis-insights.md](./astryx-analysis-insights.md))에서 Spacing 시맨틱 계층은 실측 격차·투자 대비 효과가 낮아 **우선순위를 낮춘다**. Typography 시맨틱(최대 격차)을 먼저 완성하고, Spacing 시맨틱 확장은 디자이너 협의 게이트 통과 후 착수한다.

"어떤 맥락에서 사용되는 간격인가"를 의미로 정의합니다.

```json
{
  "spacing": {
    "component-xs": {
      "$value": "{spacing.1}",
      "$description": "8px  - 좁은 컴포넌트 (Badge, Tag)"
    },
    "component-sm": {
      "$value": "{spacing.2}",
      "$description": "12px - 소형 컴포넌트 (Button-sm, Input-sm)"
    },
    "component-md": {
      "$value": "{spacing.4}",
      "$description": "16px - 기본 컴포넌트 (Button-md, Input-md)"
    },
    "component-lg": { "$value": "{spacing.6}", "$description": "24px - 대형 컴포넌트 (Card 패딩)" },
    "gap-xs": { "$value": "{spacing.0.5}", "$description": "4px  - 아이콘+텍스트 간격" },
    "gap-sm": { "$value": "{spacing.1}", "$description": "8px  - 요소 간 소형 갭" },
    "gap-md": { "$value": "{spacing.2}", "$description": "12px - 요소 간 기본 갭" },
    "layout-sm": { "$value": "{spacing.4}", "$description": "16px - 레이아웃 소형 간격" },
    "layout-md": { "$value": "{spacing.8}", "$description": "32px - 레이아웃 기본 간격" },
    "layout-lg": { "$value": "{spacing.12}", "$description": "48px - 레이아웃 대형 간격" }
  }
}
```

### 4-3. Radius Semantic (신규)

"어떤 유형의 UI 요소인가"를 의미로 정의합니다.

```json
{
  "radius": {
    "control": {
      "$value": "{radius.md}",
      "$description": "6px    - 인터랙티브 컨트롤 (Button, Input, Select)"
    },
    "container": {
      "$value": "{radius.lg}",
      "$description": "8px    - 컨테이너 요소 (Card, Panel)"
    },
    "overlay": {
      "$value": "{radius.xl}",
      "$description": "12px   - 오버레이 요소 (Dialog, Popover, Tooltip)"
    },
    "badge": { "$value": "{radius.full}", "$description": "9999px - Pill 형태 (Badge, Tag)" },
    "none": { "$value": "{radius.none}", "$description": "0px    - 직각 요소" }
  }
}
```

### 4-4. Shadow Semantic (신규)

"어떤 elevation depth인가"를 의미로 정의합니다.

```json
{
  "shadow": {
    "surface": { "$value": "{shadow.sm}", "$description": "낮은 elevation - Card, inline 요소" },
    "floating": { "$value": "{shadow.md}", "$description": "중간 elevation - Dropdown, Popover" },
    "overlay": { "$value": "{shadow.lg}", "$description": "높은 elevation - Dialog, Modal, Drawer" }
  }
}
```

### 4-5. Typography Semantic (신규)

"어떤 역할의 텍스트인가"를 의미로 정의합니다.

```json
{
  "typography": {
    "size": {
      "label-sm": {
        "$value": "{font.size.xs}",
        "$description": "12px - 소형 레이블 (Badge 텍스트)"
      },
      "label-md": {
        "$value": "{font.size.sm}",
        "$description": "14px - 기본 레이블 (Button 텍스트)"
      },
      "body-sm": { "$value": "{font.size.sm}", "$description": "14px - 소형 본문" },
      "body-md": { "$value": "{font.size.md}", "$description": "16px - 기본 본문" },
      "heading-sm": { "$value": "{font.size.lg}", "$description": "18px - 소형 제목" },
      "heading-md": { "$value": "{font.size.xl}", "$description": "20px - 기본 제목" },
      "heading-lg": { "$value": "{font.size.2xl}", "$description": "24px - 대형 제목" }
    },
    "weight": {
      "body": { "$value": "{font.weight.regular}", "$description": "일반 본문 텍스트" },
      "emphasis": { "$value": "{font.weight.medium}", "$description": "강조 텍스트" },
      "heading": { "$value": "{font.weight.semibold}", "$description": "제목 텍스트" },
      "strong": { "$value": "{font.weight.bold}", "$description": "강한 강조 텍스트" }
    },
    "line-height": {
      "control": { "$value": "{font.line-height.tight}", "$description": "컴포넌트 내 텍스트" },
      "body": { "$value": "{font.line-height.normal}", "$description": "본문 텍스트" },
      "document": { "$value": "{font.line-height.relaxed}", "$description": "긴 문서 텍스트" }
    }
  }
}
```

### 4-6. Opacity Semantic (신규)

```json
{
  "opacity": {
    "disabled": { "$value": "{opacity.50}", "$description": "disabled 상태 불투명도" },
    "muted": { "$value": "{opacity.75}", "$description": "muted/subtle 상태 불투명도" },
    "overlay": { "$value": "{opacity.50}", "$description": "모달 스크림 배경 불투명도" }
  }
}
```

### 4-7. Animation Semantic (신규)

```json
{
  "animation": {
    "interactive": {
      "duration": {
        "$value": "{animation.duration.fast}",
        "$description": "Hover, Focus 트랜지션"
      },
      "easing": { "$value": "{animation.easing.ease-out}", "$description": "기본 UI 인터랙션 이징" }
    },
    "transition": {
      "duration": { "$value": "{animation.duration.normal}", "$description": "컴포넌트 상태 전환" },
      "easing": { "$value": "{animation.easing.ease-in-out}", "$description": "상태 전환 이징" }
    },
    "motion": {
      "duration": {
        "$value": "{animation.duration.slow}",
        "$description": "패널 열기/닫기 등 큰 움직임"
      },
      "easing": { "$value": "{animation.easing.ease-in-out}", "$description": "큰 모션 이징" }
    }
  }
}
```

---

## 5. token-bridge.config.ts

현재 설정(코드 실측 기준)은 **primitive · semantic · custom · effects** 4개 tier이며, 모두 `tailwind: true`로 `@theme` 변수를 생성합니다. Zod 스키마는 `src/schemas/tokens.schema.ts`로 출력됩니다.

```typescript
// packages/afds/token-bridge.config.ts (실재)
export default defineConfig({
  namespace: 'afds',
  tiers: {
    primitive: {
      source: 'tokens/json/primitive.tokens.json',
      output: 'tokens/tokens.css',
      tailwind: true,
    },
    semantic: {
      source: 'tokens/json/semantic.tokens.json',
      output: 'tokens/tokens.semantic.css',
      tailwind: true,
    },
    custom: {
      source: 'tokens/json/custom.tokens.json',
      output: 'tokens/tokens.custom.css',
      tailwind: true,
    },
    effects: {
      source: 'tokens/json/effects.tokens.json',
      output: 'tokens/tokens.effects.css',
      tailwind: true,
    },
  },
  typescript: {
    zodOutput: 'src/schemas/tokens.schema.ts',
  },
})
```

> **주의**: `dark`/`motion` 토큰(`tokens.dark.css`·`tokens.motion.css`)은 **이 config의 tier가 아닙니다** — 현재 파이프라인 밖에서 수동 관리됩니다(로드맵 P4·F1의 편입 대상). 과거 문서가 기술한 `dark` tier 스니펫은 실제 config와 다르므로 위 실측 기준을 따릅니다.

---

## 6. 생성 결과물

`pnpm run generate:tokens` 실행 후 생성되는 파일:

### tokens.css (Tailwind @theme)

```css
@theme {
  /* 기존 */
  --color-afds-primary-500: #556af9;
  --spacing-afds-4: 16px;

  /* 신규 */
  --font-size-afds-sm: 14px;
  --font-weight-afds-medium: 500;
  --font-line-height-afds-normal: 1.5;
  --opacity-afds-50: 0.5;
  --animation-duration-afds-fast: 100ms;
  --animation-easing-afds-ease-out: cubic-bezier(0, 0, 0.2, 1);
}
```

### tokens.semantic.css (:root)

```css
:root {
  /* 기존 color */
  --afds-color-surface: var(--color-afds-white);
  --afds-color-brand: var(--color-afds-primary-500);

  /* 신규 spacing */
  --afds-spacing-component-md: var(--spacing-afds-4);
  --afds-spacing-gap-sm: var(--spacing-afds-1);

  /* 신규 radius */
  --afds-radius-control: var(--radius-afds-md);
  --afds-radius-container: var(--radius-afds-lg);
  --afds-radius-overlay: var(--radius-afds-xl);

  /* 신규 shadow */
  --afds-shadow-surface: var(--shadow-afds-sm);
  --afds-shadow-overlay: var(--shadow-afds-lg);

  /* 신규 typography */
  --afds-typography-size-label-md: var(--font-size-afds-sm);
  --afds-typography-weight-heading: var(--font-weight-afds-semibold);

  /* 신규 opacity */
  --afds-opacity-disabled: var(--opacity-afds-50);

  /* 신규 animation */
  --afds-animation-interactive-duration: var(--animation-duration-afds-fast);
  --afds-animation-interactive-easing: var(--animation-easing-afds-ease-out);
}
```

---

## 7. 컴포넌트 적용 패턴

Semantic 토큰이 추가되면, 컴포넌트 CVA에서 다음 방식으로 참조합니다.

### 기존 (Tailwind 직접 사용)

```typescript
// button.style.ts — 토큰 없이 Tailwind 직접 참조
const buttonVariants = cva([
  'text-sm font-medium', // ← 하드코딩된 값
  'rounded-md', // ← 컴포넌트 의도 불명확
  'transition-colors duration-150', // ← raw timing
])
```

### 개선 후 (Semantic 토큰 참조)

```typescript
// button.style.ts — Semantic 토큰을 통해 의미로 참조
const buttonVariants = cva([
  'text-[length:var(--afds-typography-size-label-md)]',
  'font-[var(--afds-typography-weight-emphasis)]',
  'rounded-[var(--cmp-button-radius)]',
  'transition-[background-color,color,border-color]',
  'duration-[var(--afds-animation-interactive-duration)]',
  '[transition-timing-function:var(--afds-animation-interactive-easing)]',
])
```

Component Token(`--cmp-*`)은 CVA variant에서 Semantic 토큰을 가리킵니다:

```typescript
// tokens.components.css (수동 관리)
:root {
  --cmp-button-radius: var(--afds-radius-control);    /* control = md */
  --cmp-card-radius:   var(--afds-radius-container);  /* container = lg */
  --cmp-dialog-shadow: var(--afds-shadow-overlay);    /* overlay = lg */
}
```

---

## 8. 작업 순서

### Step 1: Primitive 확장

```bash
# packages/afds/tokens/json/primitive.tokens.json 수정
# typography, opacity, animation 섹션 추가
```

### Step 2: Semantic 확장

```bash
# packages/afds/tokens/json/semantic.tokens.json 수정
# spacing, radius, shadow, typography, opacity, animation 섹션 추가
```

### Step 3: 토큰 재생성

```bash
cd packages/afds
pnpm run generate:tokens
```

### Step 4: 생성 결과 확인

```bash
# Tailwind @theme 확인
grep -A5 "@theme" tokens/tokens.css

# Semantic :root 확인
grep -E "radius|spacing|shadow|typography|animation" tokens/tokens.semantic.css

# TypeScript 타입 확인
grep -E "SemanticRadius|SemanticSpacing|SemanticTypography" src/schemas/tokens.schema.ts
```

### Step 5: 컴포넌트 적용 검증 (선택)

Button, Input, Card 등 대표 컴포넌트에서 새 semantic 토큰으로 점진적 교체.

---

## 9. 수정 파일 요약

| 파일                                | 작업                                                         | 비고                                              |
| ----------------------------------- | ------------------------------------------------------------ | ------------------------------------------------- |
| `tokens/json/primitive.tokens.json` | typography, opacity, animation 추가                          | 직접 편집                                         |
| `tokens/json/semantic.tokens.json`  | spacing, radius, shadow, typography, opacity, animation 추가 | 직접 편집                                         |
| `token-bridge.config.ts`            | 변경 없음                                                    | 현 4-tier 유지(primitive·semantic·custom·effects) |
| `tokens/tokens.dark.css`            | 변경 없음                                                    | 파이프라인 밖 수동 관리(color)                    |
| `tokens/tokens.css`                 | 자동 재생성                                                  | 편집 금지                                         |
| `tokens/tokens.semantic.css`        | 자동 재생성                                                  | 편집 금지                                         |
| `src/schemas/tokens.schema.ts`      | 자동 재생성(zodOutput)                                       | 편집 금지                                         |
