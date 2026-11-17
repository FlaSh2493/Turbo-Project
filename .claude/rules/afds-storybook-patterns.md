---
paths:
  - 'packages/afds/src/bricks/**/*.stories.tsx'
  - 'packages/afds-registry/src/compositions/**/*.stories.tsx'
---

> **headless 는 이 파일의 대상이 아니다.** 헤드리스는 `.stories.tsx` 를 만들지 않고
> `.docs.mdx` 로만 작성한다(`afds-storybook-headless.md`). 이 파일의 규칙은 CSF3 `StoryObj`
> 형식 등 **스토리 작성** 규칙이라 MDX 문서에 적용될 성질이 아니다. 그래서 `paths` 에
> headless 를 넣지 않는다 — 넣으면 0건을 매칭해 규칙이 꺼진 것과 구분되지 않는다.

# AFDS Storybook 공통 규칙

레이어에 무관하게 모든 스토리에 적용되는 규칙이다.

---

## 스토리 작성 패턴

> 모든 스토리는 **CSF3 `StoryObj` 형식으로 작성**한다. 구식 `StoryFn` 사용은 금지한다.
>
> ```tsx
> import type { Meta, StoryObj } from '@storybook/react'
> // ...
> type Story = StoryObj<typeof meta>
> ```

### `args` 패턴 — 단순 prop 조합

props만 바꾸면 되는 스토리에 사용한다.

```tsx
export const Disabled: Story = {
  args: {
    disabled: true,
    children: '버튼',
  },
}
```

### `render` 패턴 — 레이아웃·비교가 필요한 스토리

여러 variant/size를 나란히 보여주거나 wrapper가 필요한 경우 사용한다.

```tsx
export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <ComponentName size="sm" />
      <ComponentName size="md" />
      <ComponentName size="lg" />
    </div>
  ),
}
```

### `render` function 패턴 — 상태(state)가 필요한 스토리

`useState` 등 훅이 필요한 경우, **반드시 기명 함수(named function)** 로 작성한다.

```tsx
export const Controlled: Story = {
  render: function ControlledExample() {
    const [value, setValue] = useState('')
    return <ComponentName value={value} onChange={setValue} />
  },
}
```

> `render: () =>` 안에서 훅 사용 금지 — React 훅 규칙 위반

---

## 필수 스토리 목록

Headless는 variant·size prop이 없는 골격 레이어이므로 `Default`만 필수다.
Components·Compositions는 아래 조건에 따라 추가 스토리를 포함한다.

| 스토리명       | 필수 여부 | 조건                                        | 적용 레이어              |
| -------------- | :-------: | ------------------------------------------- | ------------------------ |
| `Default`      |  ✅ 항상  | —                                           | 전체                     |
| `AllVariants`  |    ✅     | `variant` prop이 2개 이상                   | Components, Compositions |
| `AllSizes`     |    ✅     | `size` prop 존재                            | Components, Compositions |
| `Disabled`     |    ✅     | `disabled` prop 존재                        | Components, Compositions |
| `Loading`      |   권장    | `loading` prop 존재                         | Components, Compositions |
| `WithError`    |   권장    | error variant 또는 error 상태 존재          | Components, Compositions |
| `Uncontrolled` |  ✅ 필수  | `defaultValue` 등 uncontrolled prop 지원 시 | Components, Compositions |
| `Controlled`   |  ✅ 필수  | 상태(state)를 가진 컴포넌트                 | Components, Compositions |

### `Uncontrolled` / `Controlled` 적용 조건

| 컴포넌트 유형                                                                                                                    | Uncontrolled | Controlled |
| -------------------------------------------------------------------------------------------------------------------------------- | :----------: | :--------: |
| `value`/`defaultValue` 모두 지원 (Switch, CheckBox, Input, Select, RadioGroup, Calendar, Pagination, SegmentControl, Tooltip 등) |   ✅ 필수    |  ✅ 필수   |
| Controlled-only (Modal, Drawer, Toast, Accordion, BaseSelect, AlertModal 등)                                                     |      —       |  ✅ 필수   |
| 상태 없는 표시용 (Badge, Avatar, Typography, Button, Divider, Layout 류)                                                         |      —       |     —      |

---

## argTypes 규칙

**기본은 명시하지 않는다** — Storybook이 TypeScript 타입에서 자동 추론하므로 `tags: ['autodocs']`만 켜두면 충분하다.

### 명시 **하는** 경우

1. prop에 한국어 description을 붙여 autodocs 표를 보강할 때
2. Compound component의 sub-props를 `category`로 그루핑할 때
3. Storybook이 자동 추론한 control 타입을 강제로 바꿔야 할 때 (`radio` → `select` 등)

### 명시 **하지 않는** 경우

- 단순 boolean·string union prop — TypeScript 타입 추론에 위임

> ⚠️ argTypes를 작성하면 컴포넌트 타입 변경 시 함께 업데이트해야 한다. 동기화 비용을 감수할 가치가 있는 경우에만 작성한다.

```tsx
// ❌ 단순 union — 굳이 명시하지 않는다
argTypes: {
  variant: { control: 'select', options: ['default', 'error'] },
}

// ✅ autodocs + 타입 추론에 위임
tags: ['autodocs'],

// ✅ 한국어 description / category 그루핑이 필요한 경우만 명시
argTypes: {
  size: {
    description: '버튼 크기',
    table: { category: 'Root' },
  },
}
```

---

## 레이아웃 규칙

- 단독으로 보여주는 컴포넌트: `parameters: { layout: 'centered' }`
- 너비가 중요한 컴포넌트(Input, Select 등): `decorators`로 너비 wrapper 적용

```tsx
decorators: [
  Story => (
    <div className="w-[300px]">
      <Story />
    </div>
  ),
],
```

- 목록/테이블 형태 컴포넌트: `parameters: { layout: 'padded' }`

---

## Default 스토리 빈 화면 방지

`Default: Story = {}`는 meta의 `args`를 그대로 상속한다. 아래 케이스는 반드시 `render` 함수를 작성해야 한다.

### Overlay 계열 (Modal, Drawer, Tooltip, Popover, BottomSheet 등)

`open: false`가 기본값이므로 `Default: Story = {}`는 항상 빈 화면이다. 반드시 `useState`로 열기 버튼과 함께 구성한다.

```tsx
// ❌ 항상 빈 화면
export const Default: Story = {}

// ✅ 버튼으로 트리거
export const Default: Story = {
  render: function DefaultStory() {
    const [open, setOpen] = React.useState(false)
    return (
      <div className="p-6">
        <Button onClick={() => setOpen(true)}>열기</Button>
        <ComponentRoot open={open} onOpenChange={setOpen}>
          {/* 내부 구조 */}
        </ComponentRoot>
      </div>
    )
  },
}
```

### Compound component (children 필수)

`ScrollArea`, `Accordion` 등 children 없이는 아무것도 렌더링되지 않는 컴포넌트는 meta `args`에 `children: null`을 두지 말고, Default에서 `render`로 실제 내용을 제공한다.

```tsx
// ❌ meta args에 children: null → 빈 화면
args: {
  children: null
}
export const Default: Story = {}

// ✅ render에서 실제 내용 제공
export const Default: Story = {
  render: () => (
    <ScrollArea className="h-[200px] w-[280px]">
      <div>{/* 스크롤 가능한 콘텐츠 */}</div>
    </ScrollArea>
  ),
}
```

### 체크 방법

Default 스토리를 작성한 뒤 스스로 질문한다:

> **"이 스토리를 Storybook에서 열었을 때 화면에 무언가 보이는가?"**

No라면 `render` 함수를 추가하거나 `args`에 올바른 기본값을 넣어야 한다.

---

## 금지 사항

- `Default` 스토리 누락 금지
- **`StoryFn` 사용 금지** — 반드시 CSF3 `StoryObj` 형식으로 작성
- **Overlay/Compound 컴포넌트에서 `Default: Story = {}` 단독 사용 금지** — 빈 화면 유발
- `render` 안 훅 사용 금지 → 위 `render` function 패턴(기명 함수) 참조
- 스토리 안에서 인라인 `style` prop 사용 금지 — Tailwind 클래스로 대체
- 하드코딩 색상값 금지 — 토큰 클래스 사용 (`afds-component-tokens.md` 참조)
- 존재하지 않는 variant/size를 스토리에서 사용 금지
