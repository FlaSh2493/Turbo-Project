# AFDS Prop 명명 규칙 (Prop Naming Conventions)

> 이 문서는 AFDS 컴포넌트 prop 인터페이스의 일관성을 위한 명명 규칙을 정의합니다.
> 신규 컴포넌트 개발 및 기존 컴포넌트 수정 시 이 규칙을 따릅니다.

## ⚠️ 에이전트 주의: Typography는 단일 컴포넌트

> 타이포그래피는 `Heading`·`Text`·`Textarea` 같은 개별 컴포넌트가 아니라 **단일 `Typography` 컴포넌트**로 제공된다. 크기는 숫자 suffix가 아니라 `variant`(디자인 토큰명)로 지정한다.

| 항목        | 실제 (코드 기준)                                                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 컴포넌트    | `Typography` (polymorphic — `as` prop, 기본 `span`)                                                                                  |
| 크기·스타일 | `variant`: `heading0\|heading1\|heading2\|title1~4\|body1~3\|caption1\|caption2` (기본 `body1`)                                      |
| 색상        | `color`: `text-primary\|text-secondary\|text-disabled\|text-brand\|text-brand-subtle\|text-inverse\|text-error\|text-ai\|text-lnb-*` |

```tsx
<Typography variant="heading0">제목</Typography>
<Typography variant="body2" as="p" color="text-secondary">본문</Typography>
```

---

## 1. `variant` — 시각적 외형 변형

**규칙**: 컴포넌트의 **시각적 외형(appearance)이 달라지는 모든 경우** `variant` prop을 사용합니다.

### 적용 기준

| 구분          | 값 예시                                                           | 설명                         |
| ------------- | ----------------------------------------------------------------- | ---------------------------- |
| 스타일 계열   | `default`, `outline`, `ghost`, `secondary`, `destructive`, `link` | 디자인 스타일 변형           |
| 시맨틱 상태   | `info`, `success`, `warning`, `error`                             | 의미를 가진 색상/스타일 변형 |
| 레이아웃 계열 | `line`, `pills`, `enclosed`                                       | Tabs 등 구조적 스타일 변형   |

### 규칙 요약

- `variant`는 "컴포넌트가 어떻게 생겼는가"를 나타냅니다.
- `state`, `type`, `kind`, `mode` 등 다른 키워드로 시각적 외형을 표현하지 않습니다.
- `variant` 값이 하나뿐이더라도 향후 확장 가능성이 있으면 `variant`로 정의합니다.

### 올바른 예 / 잘못된 예

```ts
// ✅ 올바른 예
variant: 'default' | 'error' | 'success'

// ❌ 잘못된 예 — state는 시각적 외형에 사용 불가
state: 'default' | 'error' | 'success'
```

### 현재 불일치 사례 없음

이 규칙과 어긋나는 실재 컴포넌트는 현재 없다. (과거 문서가 예로 든 `Textarea`는 코드에 존재하지 않는다 — 입력 status 계약 통일은 실재하는 Input·Select·MultiSelect 대상의 향후 과제다.)

---

## 2. `size` — 컴포넌트 크기

**기본 원칙**: `sm | md | lg` 3단계를 기준으로 합니다. 컴포넌트 특성상 더 세밀한 크기 제어가 필요한 경우에만 `xs`, `xl`을 추가합니다.

### 카테고리별 허용 스케일

아래는 **v0.7.2 실측**이다(정본: `src/schemas/*.schema.ts`).

| 카테고리              | 컴포넌트                   | 실제 허용 값                                      | 정본 파일                             |
| --------------------- | -------------------------- | ------------------------------------------------- | ------------------------------------- |
| **폼 인풋**           | Input, Select, MultiSelect | `sm \| md`                                        | `input/select/multi-select.schema.ts` |
| **인터랙티브 요소**   | Button, FloatingActionBar  | `sm \| md \| lg \| icon-xs \| icon-sm \| icon-lg` | `button.schema.ts`                    |
|                       | SegmentControl             | `sm \| default \| lg`                             | `segment-control.schema.ts`           |
|                       | Table                      | `sm \| md \| lg`                                  | `table.schema.ts`                     |
| **장식/시각 요소**    | Spinner                    | `xs \| sm \| md \| lg`                            | `spinner.schema.ts`                   |
| **레이아웃 오버레이** | Modal                      | `sm \| md \| lg \| xl`                            | `modal.schema.ts`                     |
|                       | Tooltip                    | `sm \| md`                                        | `tooltip.schema.ts`                   |
| **레이아웃 컨테이너** | Container                  | `sm \| md \| lg \| xl \| 2xl \| full`             | `container.schema.ts`                 |

> **`size` prop이 없는 컴포넌트**: Avatar · Drawer · Progress · Pagination · CheckBox · Switch · RadioGroup.
> 크기 조절이 필요하면 `className`으로 처리한다.
>
> `Combobox`·`Radio`·`Slider`·`Textarea`·`ButtonGroup`·`Label`·`IconButton`은 **코드에 존재하지 않는다**
> (체크박스의 실제 이름은 `CheckBox`, 라디오는 `RadioGroup`).

### `xs` / `xl` 추가 기준

3단계(`sm/md/lg`)로 표현할 수 없는 시각적 크기 범위가 명확히 필요한 경우에만 예외를 허용합니다.
예외 추가 시 스키마 파일에 주석으로 이유를 명시합니다.

```ts
// ✅ 올바른 예 — Spinner는 xs가 디자인 스펙에 명시됨 (spinner.schema.ts)
size: z.enum(['lg', 'md', 'sm', 'xs']).optional()

// ❌ 잘못된 예 — 이유 없이 xs/xl 추가
size: z.enum(['xs', 'sm', 'md', 'lg', 'xl']).default('md') // 단순히 다른 컴포넌트와 통일하려고 추가
```

---

## 3. Typography — `variant`로 지정하는 디자인 토큰

Typography는 **단일 컴포넌트**이며(`Heading`/`Text`로 분리돼 있지 않다), 디자이너-개발자 공유 디자인 토큰과 1:1 매핑된다. 크기·스타일은 `sm/md/lg`가 아니라 `variant`(아래 토큰명)로 지정한다.

### 디자인 토큰 스펙

| 카테고리    | 토큰명   | size(px) | weight | line-height |
| ----------- | -------- | -------- | ------ | ----------- |
| **Heading** | Heading0 | 36       | Bold   | 52          |
|             | Heading1 | 24       | Bold   | 36          |
|             | Heading2 | 20       | Bold   | 28          |
| **Title**   | Title1   | 18       | Bold   | 26          |
|             | Title2   | 16       | Bold   | 26          |
|             | Title3   | 14       | Bold   | 24          |
|             | Title4   | 12       | Bold   | 16          |
| **Body**    | Body1    | 16       | Medium | 26          |
|             | Body2    | 14       | Medium | 24          |
|             | Body3    | 12       | Medium | 16          |
| **Caption** | Caption1 | 12       | Medium | 16          |
|             | Caption2 | 10       | Bold   | 16          |

### prop 정의 방식 (실재)

```tsx
// 단일 Typography 컴포넌트 — variant로 토큰 선택 (기본 body1)
<Typography variant="heading0">제목</Typography>
<Typography variant="title2" as="h2">소제목</Typography>
<Typography variant="body2" as="p">본문</Typography>
```

> HTML 시맨틱 태그는 `as` prop으로 지정한다 — 시각 스타일(`variant`)과 HTML 구조 레벨(`as`)을 분리한다.

### 개별 Heading/Text 컴포넌트 없음

`Heading`·`Text` 개별 컴포넌트는 존재하지 않는다 — 타이포그래피는 `Typography` 단일 컴포넌트로 통일돼 있다.

---

## 4. `color` — 색상 시맨틱

**규칙**: `color` prop은 **디자인 시스템에서 정의한 시맨틱 토큰만** 허용합니다.

### 허용 값

`color`의 허용 값은 컴포넌트마다 다르다. 아래는 **v0.7.2 실측**이다.

| 컴포넌트        | 실제 허용 값                                                                                                                                                  | 정본 파일               |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| **Typography**  | `text-primary` `text-secondary` `text-disabled` `text-brand` `text-brand-subtle` `text-inverse` `text-error` `text-ai` `text-lnb-default` `text-lnb-disabled` | `typography.style.ts`   |
| **SquareBadge** | `brand` `neutral` `success` `warning` `error` `gradient-ai`                                                                                                   | `square-badge.style.ts` |
| **RoundBadge**  | `disabled` `success` `warning` `error`                                                                                                                        | `round-badge.style.ts`  |

> `default` · `muted` 는 **어떤 컴포넌트에도 존재하지 않는다**(과거 문서의 허구값).

### 커스텀 색상 — escape hatch

임의의 CSS 색상(`#fff`, `rgb()`, CSS 변수 등)은 `color` prop으로 받지 않습니다.
커스텀 색상이 필요한 경우 `style` 또는 `className`으로 처리합니다.

```tsx
// ✅ 시맨틱 색상: color prop 사용 (Text 컴포넌트는 없다 — Typography 단일 컴포넌트)
<Typography color="text-brand">텍스트</Typography>
<Typography color="text-error">오류 메시지</Typography>

// ✅ 커스텀 색상: style / className으로 escape
<Typography style={{ color: '#FF5733' }}>텍스트</Typography>
<Typography className="text-[#FF5733]">텍스트</Typography>
<Typography style={{ color: 'var(--my-custom-color)' }}>텍스트</Typography>

// ❌ 잘못된 예 — color prop에 임의 CSS 값 사용
<Typography color="#FF5733">텍스트</Typography>
```

> **소비자(앱) 기준 규칙이다.** AFDS 내부(`src/bricks/**`)에서는 ESLint 가드레일이 `style` prop의
> 색상·간격·타이포그래피 값 지정을 금지한다 — 내부 구현은 반드시 CVA 토큰 클래스를 쓴다.
> (`packages/afds/eslint.config.js` · `.claude/rules/afds-component-tokens.md`)

---

## 5. 기타 공통 Prop 명명 기준

**Boolean props**: `is`·`has` 접두사를 붙이지 않고 명사/형용사로 간결하게 쓴다 —
`disabled`, `open`, `checked`, `loading` (아래 표).
예외: `Calendar`의 `isDateUnavailable`(날짜별 비활성 판정 **함수** prop — 반환 타입만 `boolean`)은
동사구 서술이 명사형보다 의도를 분명히 해 유지한다 (`src/headless/calendar/use-calendar.ts`,
`use-range-calendar.ts`).

| Prop          | 타입            | 설명                                          | 예시                                           |
| ------------- | --------------- | --------------------------------------------- | ---------------------------------------------- |
| `as`          | `ElementType`   | 폴리모픽 HTML 태그 지정                       | `'h1' \| 'h2' \| 'div' \| 'span'`              |
| `disabled`    | `boolean`       | 비활성화 상태                                 | `true \| false`                                |
| `loading`     | `boolean`       | 로딩 중 상태                                  | `true \| false`                                |
| `orientation` | `string`        | 방향성                                        | `'horizontal' \| 'vertical'`                   |
| `weight`      | `string`        | 폰트 굵기                                     | `'normal' \| 'medium' \| 'semibold' \| 'bold'` |
| `className`   | `string`        | 외부 스타일 주입 — **항상 선택적으로 허용**   | —                                              |
| `style`       | `CSSProperties` | 인라인 스타일 주입 — **항상 선택적으로 허용** | —                                              |
| `children`    | `ReactNode`     | 자식 요소                                     | —                                              |

> **Note**: 모든 컴포넌트는 `className`과 `style` prop을 허용해야 합니다.
> 이는 디자인 시스템이 제공하지 않는 커스텀 스타일을 적용하기 위한 공식 escape hatch입니다.

---

## 6. 요약 — 빠른 참조

```
시각적 외형이 달라지는가?          → variant
컴포넌트 크기 조절인가?             → size (sm/md/lg 기본, xs/xl은 예외)
Typography 크기인가?                → variant (디자인 토큰명: heading0 / title2 / body1 ...)
HTML 태그를 바꾸고 싶은가?          → as
색상을 바꾸고 싶은가? (시맨틱)      → color (컴포넌트별 열거값 — §4 표 참조)
색상을 바꾸고 싶은가? (커스텀)      → style={{ color: '...' }} 또는 className
활성화/비활성화인가?                → disabled (boolean)
로딩 중인가?                       → loading (boolean)
```

---

## 변경 이력

| 날짜       | 내용                                                       |
| ---------- | ---------------------------------------------------------- |
| 2026-02-20 | 최초 작성 — variant/size/typography 명명 규칙 정의         |
| 2026-02-20 | color prop 규칙 및 escape hatch(className/style) 섹션 추가 |
