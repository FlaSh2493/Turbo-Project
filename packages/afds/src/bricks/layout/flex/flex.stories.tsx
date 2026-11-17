import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Flex } from '@turbo-project/afds/bricks'
import { PRIMITIVE_SPACING_VALUES } from '../../../schemas/tokens.schema'

const SPACING_TOKEN_SUMMARY = PRIMITIVE_SPACING_VALUES.map(t => `'${t}'`).join(' | ')

const argTypes = {
  gap: {
    control: { type: 'select' as const },
    options: PRIMITIVE_SPACING_VALUES,
    description: '요소 간 간격 (AFDS spacing 토큰)',
    table: { type: { summary: SPACING_TOKEN_SUMMARY } },
  },
  direction: {
    control: { type: 'select' as const },
    options: ['row', 'column', 'row-reverse', 'column-reverse'],
    description: 'flex-direction',
    table: {
      type: { summary: "'row' | 'column' | 'row-reverse' | 'column-reverse'" },
      defaultValue: { summary: 'row' },
    },
  },
  justify: {
    control: { type: 'select' as const },
    options: ['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly'],
    description: 'justify-content',
    table: {
      type: {
        summary:
          "'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly'",
      },
      defaultValue: { summary: 'flex-start' },
    },
  },
  align: {
    control: { type: 'select' as const },
    options: ['flex-start', 'center', 'flex-end', 'stretch', 'baseline'],
    description: 'align-items',
    table: {
      type: { summary: "'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline'" },
      defaultValue: { summary: 'stretch' },
    },
  },
  wrap: {
    control: { type: 'select' as const },
    options: ['nowrap', 'wrap', 'wrap-reverse'],
    description: 'flex-wrap',
    table: {
      type: { summary: "'nowrap' | 'wrap' | 'wrap-reverse'" },
      defaultValue: { summary: 'nowrap' },
    },
  },
  alignContent: {
    control: { type: 'select' as const },
    options: ['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly'],
    description: 'align-content (줄 바꿈 시 교차축 정렬, wrap과 함께 사용)',
    table: {
      type: {
        summary:
          "'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly'",
      },
    },
  },
}

const meta = {
  title: 'AFDS / Bricks / Layout / Flex',
  component: Flex,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
CSS Flexbox를 props로 추상화한 레이아웃 컴포넌트입니다.

**Import:**
\`\`\`tsx
import { Flex } from '@turbo-project/afds/bricks'
\`\`\`

### 기본 사용법
\`\`\`tsx
<Flex direction="row" gap="spacing-4" align="center">
  <div>아이템 1</div>
  <div>아이템 2</div>
</Flex>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes,
} satisfies Meta<typeof Flex>

export default meta
type Story = StoryObj<typeof meta>

const Item = ({ children, subtle = false }: { children?: React.ReactNode; subtle?: boolean }) => (
  <div
    className={`px-4 py-2 rounded-afds-sm text-sm ${subtle ? 'bg-afds-gray-0 border border-afds-gray-200 text-afds-gray-500' : 'bg-afds-brand-700 text-afds-gray-0'}`}
  >
    {children ?? '아이템'}
  </div>
)

/** 기본 수평 배치입니다. Controls 패널에서 props를 직접 조작할 수 있습니다. */
export const Default: Story = {
  args: {
    direction: 'row',
    gap: 'spacing-4',
    align: 'stretch',
    justify: 'flex-start',
    wrap: 'nowrap',
  },
  render: args => (
    <Flex {...args}>
      <Item>1</Item>
      <Item>2</Item>
      <Item>3</Item>
    </Flex>
  ),
}

/** 수직 배치입니다. */
export const Column: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Flex direction="column" gap="spacing-4">
      <Item>1</Item>
      <Item>2</Item>
      <Item>3</Item>
    </Flex>
  ),
}

/** 모든 justify-content 값을 비교합니다. */
export const JustifyOptions: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-3 w-[400px]">
      {(
        [
          'flex-start',
          'center',
          'flex-end',
          'space-between',
          'space-around',
          'space-evenly',
        ] as const
      ).map(justify => (
        <div key={justify}>
          <div className="text-xs text-afds-gray-500 mb-1">{justify}</div>
          <Flex
            justify={justify}
            className="border border-dashed border-afds-gray-200 p-1 rounded-afds-sm"
          >
            <Item subtle>A</Item>
            <Item subtle>B</Item>
            <Item subtle>C</Item>
          </Flex>
        </div>
      ))}
    </div>
  ),
}

/** 양끝 정렬입니다. 헤더나 툴바에 자주 사용합니다. */
export const SpaceBetween: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Flex
      justify="space-between"
      align="center"
      className="w-[400px] px-4 py-3 border border-afds-gray-200 rounded-afds-md"
    >
      <strong className="text-afds-gray-700">섹션 제목</strong>
      <Item subtle>더 보기</Item>
    </Flex>
  ),
}

/** 줄 바꿈(wrap)이 적용된 Flex입니다. */
export const Wrapped: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Flex wrap="wrap" gap="spacing-8" className="w-[200px]">
      {Array.from({ length: 8 }, (_, i) => (
        <Item key={i} subtle>
          {i + 1}
        </Item>
      ))}
    </Flex>
  ),
}
