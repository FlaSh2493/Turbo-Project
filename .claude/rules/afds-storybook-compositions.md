---
paths:
  - 'packages/afds-registry/src/compositions/**/*.stories.tsx'
---

# AFDS Storybook — Compositions 레이어

`src/compositions/` 하위의 스토리 파일에 적용되는 포맷 규칙이다.

---

## description 방식

meta 위 JSDoc `/** ... */` 블록을 사용한다. (Bricks 레이어와 동일)

description에는 아래 섹션이 반드시 포함되어야 한다:

1. **`**Import:**`** — import 경로 코드블록
2. **`### 기본 사용법`** — 최소 JSX 사용 예시

---

## 필수 구조 템플릿

````tsx
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
  title: 'Compositions / {Domain} / {Category} / {ComponentName}',
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
````

---

## title 네이밍 규칙

형식: `'Compositions / {Domain} / {Category} / {ComponentName}'` — `Compositions` 는 최상위 구역이다(`AFDS` 아래가 아니다).

도메인·카테고리는 정본 spec frontmatter(`domain`·`category`)가 정하고 `composition-story-titles.test.ts` 가 `registry.json` 과 대조한다 — title 만 고치지 마라.
