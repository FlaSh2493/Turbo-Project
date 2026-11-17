import * as React from 'react'
import type { ArgTypes, Meta, StoryObj } from '@storybook/react'
import { RoundBadge, Spinner } from '@turbo-project/afds/bricks'

const DOT_COLORS = ['disabled', 'success', 'warning', 'error'] as const
type DotColor = (typeof DOT_COLORS)[number]

const argTypes: Partial<ArgTypes> = {
  color: {
    control: 'select',
    options: DOT_COLORS,
    description: 'RoundBadge.Dot 색상 (시맨틱 토큰 매핑)',
    table: { type: { summary: DOT_COLORS.map(c => `'${c}'`).join(' | ') } },
  },
}

/**
 *
 * 둥근 형태의 배지 컴포넌트입니다.
 * Compound 패턴(Root / Dot / Content)으로 구성됩니다.
 */
const meta = {
  title: 'AFDS / Bricks / Display / RoundBadge',
  component: RoundBadge.Root,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `둥근 형태의 배지 컴포넌트입니다. Compound 패턴(Root / Dot / Content)으로 구성됩니다.

**Import:**
\`\`\`tsx
import { RoundBadge } from '@turbo-project/afds/bricks'
\`\`\`

### 기본 사용법
\`\`\`tsx
<RoundBadge.Root>
  <RoundBadge.Dot color="success" />
  <RoundBadge.Content>활성</RoundBadge.Content>
</RoundBadge.Root>
\`\`\`

### 색상 지정 방법
- 시맨틱 prop: \`<RoundBadge.Dot color="success" />\`
- className 오버라이드: \`<RoundBadge.Dot className="bg-afds-extra-ui-blue" />\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes,
} satisfies Meta<typeof RoundBadge.Root>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { color: 'success' } as { color: DotColor },
  render: args => (
    <RoundBadge.Root>
      <RoundBadge.Dot color={args.color as DotColor} />
      <RoundBadge.Content>활성</RoundBadge.Content>
    </RoundBadge.Root>
  ),
}

export const WithDotAndText: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <RoundBadge.Root>
      <RoundBadge.Dot color="success" />
      <RoundBadge.Content>활성</RoundBadge.Content>
    </RoundBadge.Root>
  ),
}

export const TextOnly: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <RoundBadge.Root>
      <RoundBadge.Content>뱃지</RoundBadge.Content>
    </RoundBadge.Root>
  ),
}

export const DotOnly: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <RoundBadge.Root>
      <RoundBadge.Dot color="error" />
    </RoundBadge.Root>
  ),
}

export const AllColors: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-wrap items-center gap-afds-spacing-10">
      <RoundBadge.Root>
        <RoundBadge.Dot color="disabled" />
        <RoundBadge.Content>비활성</RoundBadge.Content>
      </RoundBadge.Root>
      <RoundBadge.Root>
        <RoundBadge.Dot color="success" />
        <RoundBadge.Content>활성</RoundBadge.Content>
      </RoundBadge.Root>
      <RoundBadge.Root>
        <RoundBadge.Dot color="warning" />
        <RoundBadge.Content>대기</RoundBadge.Content>
      </RoundBadge.Root>
      <RoundBadge.Root>
        <RoundBadge.Dot color="error" />
        <RoundBadge.Content>오류</RoundBadge.Content>
      </RoundBadge.Root>
    </div>
  ),
}

export const WithSpinner: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <RoundBadge.Root>
      <Spinner size="xs" fullscreen="static" className="size-fit" />
      <RoundBadge.Content>로딩중</RoundBadge.Content>
    </RoundBadge.Root>
  ),
}

export const CustomClassName: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <RoundBadge.Root>
      <RoundBadge.Dot className="bg-afds-extra-ui-blue" />
      <RoundBadge.Content>사용자 색상</RoundBadge.Content>
    </RoundBadge.Root>
  ),
}
