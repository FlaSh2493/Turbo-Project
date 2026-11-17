---
paths:
  - 'packages/afds/src/bricks/**'
  - 'packages/afds/tokens/**'
  - 'packages/afds-registry/src/compositions/**'
---

# AFDS 디자인 토큰 사용 규칙

컴포넌트 스타일링 시 사용 가능한 토큰 값과 Tailwind 클래스 변환 기준을 정의한다.
토큰은 정기적으로 업데이트될 수 있으므로, 최신 목록은 아래 파일을 직접 읽어 확인한다.

- **Primitive 토큰**: `packages/afds/tokens/tokens.css`
- **Semantic 토큰**: `packages/afds/tokens/tokens.semantic.css`
- **토큰 소스(JSON)**: `packages/afds/tokens/json/`

---

> **컴포지션(`packages/afds-registry/src/compositions/`)에도 적용된다.** 토큰 이름과
> Tailwind 클래스 규칙은 같다. 다만 **컴포지션은 대개 CVA 를 쓰지 않는다** — 23개 중
> `.style.ts` 를 가진 것이 4개뿐이고 나머지는 `{name}.tsx` 의 `className` 문자열에 둔다.
> 아래 「CVA `variants` 에 매핑」은 그 4개에만 해당하고, 나머지는 **`className` 에 완성된
> 클래스를 직접 적는다**. 조건부 결합은 `cn()` 을 쓰되 컴포지션에서는
> `@turbo-project/afds/lib/utils` 에서 가져온다(afds 의 `src/lib` 경로가 아니다).
>
> **어느 쪽이든 금지 사항은 같다 — 문자열 조립으로 클래스를 만들지 마라.**

## 토큰 사용 방법: Tailwind 클래스 + CVA

AFDS는 토큰을 **Tailwind 클래스 문자열**로만 사용한다. 런타임에 클래스 문자열을 조립하는
헬퍼(`afdsColor()` 류)는 두지 않는다 — Tailwind JIT가 정적으로 스캔할 수 있어야 하기 때문이다.
정적 스타일은 CVA `variants`에, 값이 prop·상태에 따라 달라지는 동적 스타일은
`variants`/`compoundVariants`의 **완성된 클래스 문자열 매핑**으로 처리한다. 변환 규칙은 아래 섹션 참조.

### 방법 1. 정적 스타일 — CVA `variants`

```tsx
// .style.ts (CVA)
export const badgeVariants = cva('', {
  variants: {
    variant: {
      default: 'bg-afds-bg-surface text-afds-text-primary',
      brand: 'bg-afds-bg-brand text-afds-text-inverse',
    },
  },
})

// .tsx — 조건부 병합은 cn()으로. 완성된 클래스만 넘긴다(조각 조립 금지)
className={cn('text-afds-text-primary', isActive && 'bg-afds-bg-selected')}
```

### 방법 2. 동적 prop — CVA `variants` / `compoundVariants` 매핑

소비자가 `color`·`size` 같은 값을 prop으로 전달하면, 그 값을 **완성된 토큰 클래스로 매핑**한다.
값의 조합(예: `variant` × `color`)이 필요하면 `compoundVariants`를 쓴다.

```tsx
// square-badge.style.ts — 실제 패턴(색상 3종만 발췌. 실제 파일은 6종 전부 정의한다)
export const squareBadgeRootVariants = cva('inline-flex items-center rounded-afds-sm', {
  variants: {
    variant: { filled: 'body3', outlined: 'title4 bg-transparent outline outline-1' },
    color: { brand: '', neutral: '', success: '' }, // 색상 값은 아래 조합에서 결정
  },
  compoundVariants: [
    { variant: 'filled', color: 'brand', class: 'bg-afds-bg-brand-subtle text-afds-text-inverse' },
    { variant: 'filled', color: 'neutral', class: 'bg-afds-bg-disabled text-afds-text-secondary' },
    { variant: 'filled', color: 'success', class: 'bg-afds-extra-ui-green text-afds-text-inverse' },
    // outlined도 **모든 색상**에 대해 빠짐없이 정의한다 — 조합이 비면 그 prop은 조용히 무시된다
    {
      variant: 'outlined',
      color: 'brand',
      class: 'outline-afds-border-brand-subtle text-afds-border-brand-subtle',
    },
    {
      variant: 'outlined',
      color: 'neutral',
      class: 'outline-afds-border-default text-afds-text-secondary',
    },
    {
      variant: 'outlined',
      color: 'success',
      class: 'outline-afds-extra-ui-green text-afds-extra-ui-green',
    },
  ],
})
```

> `variants.color` 값을 빈 문자열로 두는 방식은 **`variant` × `color` 전 조합을 `compoundVariants`에
> 채운다는 전제**에서만 성립한다. 조합 하나를 빠뜨리면 그 색상은 클래스 없이 렌더돼 prop이 무시된다.

spacing·radius·typography도 동일하게 CVA에 **완성된 클래스**(`p-afds-spacing-8`, `rounded-afds-md`,
`text-afds-s-16`)를 직접 적는다. 클래스 문자열을 토큰 조각에서 조립하지 않는다.

### 방법 3. `cn()` — 조건부 클래스 병합

`cva` 밖에서 조건에 따라 클래스를 붙일 때는 `src/lib`의 `cn()`만 사용한다
(`import { cn } from '../../../lib/utils'`). 이때도 **완성된 클래스 문자열**만 넘긴다.

```tsx
className={cn('text-afds-text-primary', isSelected && 'bg-afds-bg-selected')}
```

---

### 방법 선택 기준

| 상황                              | 사용 방법                                                                                       |
| --------------------------------- | ----------------------------------------------------------------------------------------------- |
| CVA variants/sizes 정적 정의      | Tailwind 클래스 직접 (`bg-afds-bg-surface`, `p-afds-spacing-8`, `rounded-afds-md`)              |
| 소비자가 색상 prop 전달           | CVA `variants`(색상 enum) — 값 조합이 필요하면 `compoundVariants`                               |
| 소비자가 spacing/radius prop 전달 | 해당 prop을 `variants`로 받아 완성된 클래스(`p-afds-spacing-*`, `rounded-afds-*`)에 매핑        |
| 소비자가 typography prop 전달     | `variants`에 완성된 타이포 클래스(`text-afds-s-16`, `leading-afds-h-24`, `font-afds-bold`) 매핑 |
| 조건부 병합                       | `cn('완성-클래스', cond && '완성-클래스')`                                                      |

> **규칙**: 동적 값(prop·상태)은 `variants`/`compoundVariants`의 클래스 매핑으로 해결한다.
> 템플릿 리터럴로 토큰 클래스를 조립(`` `text-afds-${color}` ``)하는 것은 **금지** — Tailwind JIT가 스캔하지 못해 스타일이 누락된다.

---

## 토큰 레이어 구조

| 레이어    | 파일                  | 역할                                       |
| --------- | --------------------- | ------------------------------------------ |
| Primitive | `tokens.css`          | 원시 색상/수치 — 팔레트 직접 값            |
| Semantic  | `tokens.semantic.css` | 의미 기반 참조 — Primitive를 역할별로 묶음 |

**컴포넌트에서는 Semantic 토큰을 우선 사용한다.**

---

## CSS 변수 → Tailwind 클래스 변환 규칙

CSS 파일의 `@theme` 블록이 Tailwind 유틸리티 클래스를 결정한다.

```
@theme {
  --color-{X}: var(--afds-color-{Y});
}
```

변환 공식: `--color-{X}` → Tailwind 접두사(`bg-` / `text-` / `border-` / `ring-` / `fill-` / `stroke-`) + `{X}`

### 예시

| `@theme` 변수                 | Tailwind 클래스              |
| ----------------------------- | ---------------------------- |
| `--color-afds-bg-selected`    | `bg-afds-bg-selected`        |
| `--color-afds-bg-surface`     | `bg-afds-bg-surface`         |
| `--color-afds-text-primary`   | `text-afds-text-primary`     |
| `--color-afds-text-inverse`   | `text-afds-text-inverse`     |
| `--color-afds-border-default` | `border-afds-border-default` |
| `--color-afds-border-focus`   | `ring-afds-border-focus`     |
| `--color-afds-extra-ui-red`   | `bg-afds-extra-ui-red`       |

> ⚠️ **주의**: CSS 변수명(`--afds-color-bg-selected`)과 Tailwind 클래스(`bg-afds-bg-selected`)는 다르다.
> `@theme`의 `--color-` prefix를 제거한 값이 Tailwind suffix다.

---

## SVG — `fill` / `stroke`

`--color-*` 네임스페이스는 `fill-*`·`stroke-*` 유틸도 생성한다. **SVG 도형에 hex 를 직접 쓰지 않는다.**

```tsx
// ✅ 1순위 — Tailwind 유틸 (bg-/text- 와 같은 토큰 이름)
<text className="fill-afds-text-secondary" />
<path className="stroke-afds-border-default" />

// ✅ 2순위 — CSS 변수 직접 참조 (SVG presentation attribute)
//    Tailwind 없이 변수만으로 동작한다.
<circle fill="var(--afds-color-icon-brand)" />

// ❌ hex 직접
<circle fill="#888888" />

// ❌ 색을 인라인 style 로 — 금지 패턴 3 위반 (attribute 로 같은 결과를 얻는다)
<circle style={{ fill: 'var(--afds-color-icon-brand)' }} />
```

사용 중인 실례: `src/bricks/feedback/spinner/spinner.tsx` — `stroke-afds-gray-200` · `stroke-afds-gray-500`.

> "SVG fill 은 클래스가 안 되므로 hex 를 쓴다"는 것은 사실이 아니다. 두 방법 모두 실측 확인됐다
> (Tailwind v4.1.18 컴파일 산출물 · Chrome 131 computed style).
> 다만 유틸 클래스는 클래스명이 소스에 **리터럴로** 있어야 생성된다(§금지 패턴 4).
> 클래스명을 정적으로 만들 수 없으면 2순위(CSS 변수)를 쓴다.
>
> 2순위는 **presentation attribute** 이지 `style` prop 이 아니다 — 이 문서의 금지 패턴 3
> (`style` prop 으로 토큰 우회)에 걸리지 않는다. 색을 인라인 `style` 로 넣는 형태는
> attribute 로 같은 결과를 얻으므로 이 문서에서는 권하지 않는다.
> (참고: `fill` 은 `eslint.config.js` 의 `no-restricted-syntax` 속성 목록에 없어
> 린트로는 걸리지 않는다 — 이 지점은 문서가 유일한 계약이다.)

---

## Semantic 토큰 카테고리

> 최신 목록은 `tokens.semantic.css`의 `@theme` 블록을 직접 읽어 확인한다.

| 카테고리    | Tailwind 접두사 예시     | 주요 용도                                                     |
| ----------- | ------------------------ | ------------------------------------------------------------- |
| Background  | `bg-afds-bg-*`           | 배경: surface, canvas, selected, disabled, brand, warning     |
| Text        | `text-afds-text-*`       | 텍스트: primary, secondary, disabled, brand, inverse, warning |
| Border      | `border-afds-border-*`   | 테두리: default, strong, focus, warning, brand-subtle         |
| Focus Ring  | `ring-afds-border-focus` | 포커스 인디케이터                                             |
| Icon        | `text-afds-icon-*`       | 아이콘 색상                                                   |
| Divider     | `border-afds-divider-*`  | 구분선                                                        |
| Interaction | `bg-afds-interaction-*`  | 오버레이: hover, pressed, selected                            |

---

## 토큰 사용 우선순위

```
1순위  Semantic   (afds-bg-*, afds-text-*, afds-border-*, afds-icon-*)
2순위  Primitive Extra  (afds-extra-ui-*, afds-extra-graph-*)
3순위  Primitive Palette  (afds-brand-*, afds-gray-*, afds-alpha-*)
```

컴포넌트에서 `afds-gray-700` 같은 raw palette 직접 참조는 지양한다.

---

## 토큰에 없는 값이 필요할 때

토큰으로 정의되지 않은 색상/수치가 필요한 경우 **반드시 AskUserQuestion으로 확인** 후 처리한다.

```
선택지:
1. 가장 가까운 기존 토큰으로 대체
2. 새 토큰 추가 요청
   → tokens/json/ 수정 후 pnpm --filter afds generate:tokens 재실행
3. 예외적 하드코딩 (이유 주석 필수)
```

임의로 하드코딩하지 않는다.

---

## 금지 패턴 — 절대 하지 말 것

아래 패턴은 ESLint(`no-restricted-syntax`)와 코드 리뷰에서 모두 차단한다.

> **ESLint 셀렉터와 아래 1번 래칫의 경계 — 패키지마다 다르다**:
>
> - **afds-registry**: 공유 설정(`packages/config/eslint-config/eslint.config.js`)의
>   `no-restricted-syntax` 가 리터럴 **전체**가 hex 일 때만(`'#ff0000'`) `warn` 으로 잡고,
>   `packages/afds-registry/package.json` 의 `lint` 스크립트가 `--max-warnings 0` 이라 이 경고는
>   하드 게이트다. 혼합 문자열(`text-[#FF5733] w-[137px]`)과 Tailwind `-[...]` 임의 값은 그
>   hex 셀렉터를 지나쳐도 `packages/afds-registry/src/__tests__/arbitrary-token-ratchet.test.ts` 가
>   앵커 없이 색·길이 건수를 세어 **래칫**으로 막는다 — 늘면 실패, 줄었는데 기준 파일을 안
>   낮추면 실패.
> - **금지 패턴 1·2 의 Tailwind 기본 척도는 막지 않고 경고한다**(bricks·컴포지션 둘 다) —
>   `packages/afds-registry/src/__tests__/default-scale-warnings.test.ts` 가 기본 팔레트
>   (`text-red-500`·`bg-gray-100/50`), 기본 spacing(`p-4`·`-mt-2`·`gap-2.5`·`hover:p-4`),
>   기본 radius(`rounded-lg`·맨 `rounded`)를 찾는다. `::warning` 주석은 건수가
>   `default-scale-warnings.baseline.json` 보다 늘어난 파일에만 찍고(새 파일은 기준 0), 나머지는
>   합계 한 줄이다. **실패시키지 않으므로 CI 는 초록이다** — 경고가 뜬 줄은 AFDS 토큰으로 바꾼다. 판정은
>   `packages/afds-registry/src/lib/tailwind-arbitrary-values.ts` 의 `findDefaultScaleClasses` 가 정본이다.
>   **세지 않는 것**: 값 `0`(`m-0`·`inset-0` — 리셋), 분수 위치(`left-1/2`),
>   `rounded-full`·`rounded-none`, AFDS 토큰 클래스(`p-afds-spacing-20`·`rounded-afds-md`),
>   `//`·`/*`·`*` 로 시작하는 주석 줄.
>   **경고도 안 하는 것(사각지대)**: 뒤쪽 important `p-4!` · 임의 opacity `bg-gray-100/[.5]` ·
>   `gap-px`·`p-px` · `text-white`·`bg-black` · `w-*`·`h-*`·`size-*` · 브래킷 밖 순수 hex 리터럴(아래 bricks 항목).
> - **afds bricks**(`src/bricks/**`): `packages/afds/eslint.config.js` 가 이 트리에서
>   `no-restricted-syntax` 를 통째로 재정의해 공유 설정의 hex 셀렉터를 대체한다 — 남는 것은
>   템플릿 리터럴 토큰 조합·style prop 셀렉터뿐이다. `packages/afds` 의 `lint` 스크립트는 oxlint·ESLint 경고를
>   `lint-ratchet.baseline.json` 기준선과 대조한다 — 새 경고가 늘면 실패하지만 기존 warn 은 통과한다. 위 래칫은 여전히 `src/bricks` 를
>   훑지만 Tailwind `-[...]` 브래킷만 본다 — 브래킷 밖의 순수 hex 리터럴(`'#ff0000'`)은 지금
>   **eslint·래칫 어느 쪽도 잡지 않는다**(별도로 추적할 문제이며 이 문서에서 고치지 않는다).

### ❌ 1. 임의 색상 하드코딩

```tsx
// ❌ Tailwind 기본 팔레트 직접 사용
className = 'text-red-500 bg-gray-100'

// ❌ Arbitrary value
className = 'text-[#FF5733] bg-[rgba(0,0,0,0.5)]'

// ✅ 올바른 대체
className = 'text-afds-text-error bg-afds-bg-surface'
```

### ❌ 2. AFDS 토큰 없는 spacing / radius

```tsx
// ❌ Tailwind 기본 spacing 직접 사용
className = 'p-4 mt-2 rounded-lg'

// ❌ Arbitrary spacing
className = 'p-[12px] rounded-[8px]'

// ✅ 올바른 대체
className = 'p-afds-spacing-20 rounded-afds-md'
// 동적이면 CVA variants에 완성된 클래스를 매핑 (문자열 조립 금지)
```

### ❌ 3. style prop으로 토큰 우회

```tsx
// ❌ 색상/간격/radius를 인라인 style로 처리
<div style={{ color: '#333', padding: '12px', borderRadius: '8px' }} />

// ✅ 올바른 대체 — 항상 Tailwind 클래스로
<div className="text-afds-text-primary p-afds-spacing-8 rounded-afds-sm" />
```

> **예외**: `width`, `height`, `maxHeight` 등 JS 계산이 필요한 레이아웃 값은 `style` prop 허용.

### ❌ 4. 동적 토큰에 템플릿 리터럴 직접 조합

```tsx
// ❌ 타입 안전성 없음, 잘못된 토큰이 런타임까지 통과됨
className={`text-afds-${color}`}
className={`p-afds-${spacing}`}

// ✅ CVA variants/compoundVariants에 완성된 클래스를 매핑 — JIT가 스캔 가능
// .style.ts: variants: { color: { brand: 'text-afds-text-brand', ... } }
className={cn(rootVariants({ color }))}
```

### ❌ 5. Primitive 토큰(팔레트) 직접 참조

```tsx
// ❌ raw 팔레트 직접 사용
className = 'bg-afds-gray-700 text-afds-brand-500'

// ✅ Semantic 토큰 우선
className = 'bg-afds-bg-surface text-afds-text-primary'
```

---

## 토큰 재생성 방법

토큰 JSON 수정 후 CSS/TS 파일 재생성:

```bash
pnpm --filter afds generate:tokens
```

생성 결과:

- `tokens/tokens.css` — Primitive CSS 변수
- `tokens/tokens.semantic.css` — Semantic CSS 변수
- `tokens/tokens.custom.css` — Custom 변수 + Typography 유틸
- `tokens/tokens.effects.css` — Effects 유틸
- `src/schemas/tokens.schema.ts` — Zod 스키마 + TypeScript 타입 (`@turbo-project/afds/schemas`)

> `tokens/tokens.ts` 는 존재하지 않는다. 타입은 위 `src/schemas/tokens.schema.ts` 다.

---

## 토큰 변경 시 스토리 동기화

토큰 파일(CSS 또는 JSON)을 수정했다면 대응하는 스토리 파일도 함께 업데이트한다.

| 수정한 토큰 파일                                    | 업데이트할 스토리 파일                        |
| --------------------------------------------------- | --------------------------------------------- |
| `tokens.css` / `json/primitive.tokens.json`         | `tokens/stories/primitive-tokens.stories.tsx` |
| `tokens.semantic.css` / `json/semantic.tokens.json` | `tokens/stories/design-tokens.stories.tsx`    |
| `tokens.custom.css` / `json/custom.tokens.json`     | `tokens/stories/custom-tokens.stories.tsx`    |
| `tokens.effects.css` / `json/effects.tokens.json`   | `tokens/stories/effects-tokens.stories.tsx`   |
| `tokens.motion.css`                                 | `tokens/stories/motion-tokens.stories.tsx`    |

**규칙:**

- 토큰 추가 → 스토리에 해당 항목 추가
- 토큰 삭제 → 스토리에서 해당 항목 제거
- 토큰 이름 변경 → 스토리의 변수명·레이블 동기화
- `pnpm --filter afds generate:tokens` 실행 후 영향받은 스토리 확인
- 신규 토큰 카테고리 추가 시 `tokens/stories/design-tokens.shared.tsx`의 공유 컴포넌트(`TokenRow`, `ColorCard` 등) 재사용 여부를 먼저 확인한다
