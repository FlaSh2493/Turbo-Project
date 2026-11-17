import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { VStack, HStack } from '@turbo-project/afds/bricks'
import { PRIMITIVE_SPACING_VALUES } from '../../../schemas/tokens.schema'

const SPACING_TOKEN_SUMMARY = PRIMITIVE_SPACING_VALUES.map(t => `'${t}'`).join(' | ')

/**
 * # Stack (VStack / HStack)
 *
 * 방향이 고정된 Flex 레이아웃 컴포넌트입니다.
 * - `VStack`: 수직 방향 (column), width: 100%
 * - `HStack`: 수평 방향 (row), align: center
 *
 *
 * ### 기본 사용법
 * ```tsx
 * <VStack gap="spacing-10">
 *   <div>항목 1</div>
 *   <div>항목 2</div>
 * </VStack>
 *
 * <HStack gap="spacing-8" justify="space-between">
 *   <div>좌측</div>
 *   <div>우측</div>
 * </HStack>
 * ```
 *
 * ### 언제 사용하나요?
 * - 수직 목록 레이아웃 → VStack
 * - 수평 정렬 레이아웃 → HStack
 *
 * ### 베스트 프랙티스
 * - 방향만 고정하고 나머지 정렬은 props로 조합하세요
 * - 더 세밀한 제어가 필요하면 Flex를 직접 사용하세요
 */

const argTypes = {
  gap: {
    control: { type: 'select' as const },
    options: PRIMITIVE_SPACING_VALUES,
    description: '요소 간 간격 (AFDS spacing 토큰)',
    table: { type: { summary: SPACING_TOKEN_SUMMARY } },
  },
  align: {
    control: { type: 'select' as const },
    options: ['flex-start', 'center', 'flex-end', 'stretch', 'baseline'],
    description: '교차축 정렬 (align-items)',
    table: {
      type: { summary: "'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline'" },
      defaultValue: { summary: 'stretch (VStack) | center (HStack)' },
    },
  },
  justify: {
    control: { type: 'select' as const },
    options: ['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly'],
    description: '주축 정렬 (justify-content)',
    table: {
      type: {
        summary:
          "'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly'",
      },
      defaultValue: { summary: 'flex-start' },
    },
  },
  wrap: {
    control: { type: 'select' as const },
    options: ['nowrap', 'wrap', 'wrap-reverse'],
    description: '줄 바꿈 허용 (flex-wrap)',
    table: {
      type: { summary: "'nowrap' | 'wrap' | 'wrap-reverse'" },
      defaultValue: { summary: 'nowrap' },
    },
  },
}

const meta = {
  title: 'AFDS / Bricks / Layout / Stack',
  component: VStack,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `방향이 고정된 Flex 레이아웃 컴포넌트입니다. VStack(수직)과 HStack(수평) 두 가지 변형을 제공합니다.

**Import:**
\`\`\`tsx
import { VStack, HStack } from '@turbo-project/afds/bricks'
\`\`\`

### 기본 사용법
\`\`\`tsx
<VStack gap="spacing-10">
  <div>항목 1</div>
  <div>항목 2</div>
</VStack>
<HStack gap="spacing-8" justify="space-between">
  <div>좌측</div>
  <div>우측</div>
</HStack>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes,
  args: {
    gap: 'spacing-8',
  },
} satisfies Meta<typeof VStack>

export default meta
type Story = StoryObj<typeof meta>

const Item = ({ children }: { children: React.ReactNode }) => (
  <div className="p-[8px_12px] bg-[#f5f5f5] rounded text-afds-14">{children}</div>
)

// Basic Stories

/** Controls 패널에서 gap, align 등을 조작해 보세요. */
export const Default: Story = {
  render: args => (
    <VStack {...args} className="w-[200px]">
      <Item>Item 1</Item>
      <Item>Item 2</Item>
      <Item>Item 3</Item>
    </VStack>
  ),
}

// Variants

/** VStack과 HStack의 기본 형태를 비교합니다. */
export const Vertical: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <VStack gap="spacing-8" className="w-[200px]">
      <Item>Item 1</Item>
      <Item>Item 2</Item>
      <Item>Item 3</Item>
    </VStack>
  ),
}

/** HStack은 수평으로 아이템을 나열하며 기본 align이 center입니다. */
export const Horizontal: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <HStack gap="spacing-8">
      <Item>Item 1</Item>
      <Item>Item 2</Item>
      <Item>Item 3</Item>
    </HStack>
  ),
}

/** `align="center"`로 교차축 중앙 정렬한 VStack입니다. */
export const VStackAligned: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <VStack
      gap="spacing-10"
      align="center"
      className="w-[240px] p-afds-spacing-14 border border-dashed border-[#ccc] rounded-lg"
    >
      <Item>짧음</Item>
      <Item>조금 더 긴 항목</Item>
      <Item>가장 긴 항목입니다</Item>
    </VStack>
  ),
}

/** `justify="space-between"`으로 양끝 정렬한 HStack입니다. */
export const HStackSpaceBetween: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <HStack
      justify="space-between"
      className="w-[300px] p-[8px_16px] border border-dashed border-[#ccc] rounded-lg"
    >
      <Item>좌측</Item>
      <Item>우측</Item>
    </HStack>
  ),
}
