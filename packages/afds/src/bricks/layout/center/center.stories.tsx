import type { Meta, StoryObj } from '@storybook/react'
import { Center } from '@turbo-project/afds/bricks'
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
    description: 'flex-direction (FlexProps 상속)',
    table: {
      type: { summary: "'row' | 'column' | 'row-reverse' | 'column-reverse'" },
      defaultValue: { summary: 'row' },
    },
  },
}

const meta = {
  title: 'AFDS / Bricks / Layout / Center',
  component: Center,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
자식 요소를 수평/수직 중앙 정렬하는 레이아웃 컴포넌트입니다.

**Import:**
\`\`\`tsx
import { Center } from '@turbo-project/afds/bricks'
\`\`\`

### 기본 사용법
\`\`\`tsx
<Center className="h-screen">
  <Spinner />
</Center>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes,
  args: {
    inline: false,
  },
} satisfies Meta<typeof Center>

export default meta
type Story = StoryObj<typeof meta>

/** 기본 Center입니다. Controls 패널에서 props를 직접 조작할 수 있습니다. */
export const Default: Story = {
  render: args => (
    <Center
      {...args}
      className="w-[200px] h-[100px] border border-dashed border-afds-gray-200 rounded-afds-sm"
    >
      <span className="text-afds-gray-500">Centered</span>
    </Center>
  ),
}

/** `inline` prop을 사용하면 텍스트 흐름 안에서 인라인으로 중앙 정렬됩니다. */
export const Inline: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="text-afds-gray-700">
      텍스트
      <Center inline className="border border-dashed border-afds-gray-200 px-2 py-1 mx-1">
        <span>Inline</span>
      </Center>
      텍스트
    </div>
  ),
}

/** 복합 콘텐츠를 중앙 정렬하는 예시입니다. */
export const WithContent: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Center
      direction="column"
      gap="spacing-8"
      className="w-[300px] h-[150px] border border-dashed border-afds-gray-200 rounded-afds-sm"
    >
      <span className="font-bold text-afds-gray-700">제목</span>
      <span className="text-afds-gray-500 text-sm">설명 텍스트</span>
    </Center>
  ),
}

/** 로딩 스피너처럼 전체 화면 중앙에 콘텐츠를 배치하는 패턴입니다. */
export const FullArea: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Center className="w-full h-[200px] bg-afds-gray-0 rounded-afds-md">
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 rounded-full border-2 border-afds-brand-500 border-t-transparent animate-spin" />
        <span className="text-afds-gray-500 text-sm">로딩 중...</span>
      </div>
    </Center>
  ),
}
