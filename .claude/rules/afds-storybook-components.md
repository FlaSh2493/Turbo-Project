---
paths:
  - 'packages/afds/src/bricks/**/*.stories.tsx'
---

# AFDS Storybook — Bricks 레이어

`src/bricks/` 하위의 스토리 파일에 적용되는 포맷 규칙이다.

---

## description 방식

meta 위 JSDoc `/** ... */` 블록을 사용한다.

description에는 아래 섹션이 반드시 포함되어야 한다:

1. **`**Import:**`** — import 경로 코드블록
2. **`### 기본 사용법`** — 최소 JSX 사용 예시

---

## 필수 구조 템플릿

````tsx
import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { ComponentName } from './component-name'

/**
 * # ComponentName
 *
 * 컴포넌트 한 줄 설명.
 *
 * ### 기본 사용법
 * ```tsx
 * <ComponentName prop="value" />
 * ```
 *
 * ### 베스트 프랙티스
 * - 사용 시 주의사항
 */
const meta = {
  title: 'AFDS / Bricks / {Category} / {ComponentName}',
  component: ComponentName,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ComponentName>

export default meta
type Story = StoryObj<typeof meta>

// 1. Default — 반드시 첫 번째
export const Default: Story = {
  args: {
    // 컴포넌트의 기본 props만
  },
}

// 2. AllVariants — variant가 2개 이상인 경우
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {/* 각 variant를 레이블과 함께 나열 */}
    </div>
  ),
}

// 3. AllSizes — size prop이 존재하는 경우
export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {/* sm / md / lg 순서로 나열 */}
    </div>
  ),
}

// 4. 상태 스토리 — 컴포넌트에 해당하는 것만 포함
export const Disabled: Story = {
  args: { disabled: true },
}

export const Loading: Story = {
  args: { loading: true },
}

export const WithError: Story = {
  render: () => (
    // error 상태 + 에러 메시지 텍스트 함께 표시
  ),
}

// 5. Uncontrolled — defaultValue를 지원하는 경우 필수
// Controls 패널에서 아무것도 건드리지 않아도 자체적으로 값이 바뀌는 것을 보여준다.
export const Uncontrolled: Story = {
  args: {
    defaultValue: '기본값',
  },
}

// 6. Controlled — 외부 state로 값을 제어하는 경우 필수
export const Controlled: Story = {
  render: function ControlledExample() {
    const [value, setValue] = useState('초기값')
    return <ComponentName value={value} onChange={setValue} />
  },
}
````

---

## Uncontrolled / Controlled 코드 패턴 요약

| 패턴             | 핵심                                                                   | 예시                                      |
| ---------------- | ---------------------------------------------------------------------- | ----------------------------------------- |
| **Uncontrolled** | `defaultValue` prop으로 초기값만 전달, 이후 내부 상태 자율 관리        | `args: { defaultValue: '...' }`           |
| **Controlled**   | `useState` + `value`/`onChange` 쌍으로 외부 state 제어, 기명 함수 필수 | `render: function NamedExample() { ... }` |

> `render` 안 훅은 기명 함수로 — [afds-storybook-patterns.md](afds-storybook-patterns.md) 의 `render` function 패턴 참조.

---

## title 네이밍 규칙

형식: `'AFDS / Bricks / {Category} / {ComponentName}'`

컴포넌트가 속한 디렉토리명(`src/bricks/{category}/`)을 Category로 사용한다.

| Category 예시 | 해당 컴포넌트                               |
| ------------- | ------------------------------------------- |
| `Form`        | Input, Select, Radio, Checkbox, NumberField |
| `Display`     | Badge, Typography, Avatar, Callout          |
| `Action`      | Button, IconButton                          |
| `Feedback`    | Toast, Spinner, Skeleton                    |
| `Layout`      | Divider, Stack                              |
| `Navigation`  | Tabs, Breadcrumb                            |
| `Overlay`     | Modal, Popover, Tooltip, Drawer             |
