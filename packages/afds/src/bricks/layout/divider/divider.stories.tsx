import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Divider } from '@turbo-project/afds/bricks'

const argTypes = {
  orientation: {
    control: { type: 'select' as const },
    options: ['horizontal', 'vertical'],
    description: '구분선 방향',
    table: {
      type: { summary: "'horizontal' | 'vertical'" },
      defaultValue: { summary: 'horizontal' },
    },
  },
}

const meta = {
  title: 'AFDS / Bricks / Layout / Divider',
  component: Divider,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
콘텐츠를 시각적으로 구분하는 구분선 컴포넌트입니다. 수평/수직 방향을 지원합니다.

**Import:**
\`\`\`tsx
import { Divider } from '@turbo-project/afds/bricks'
\`\`\`

### 기본 사용법
\`\`\`tsx
<Divider orientation="horizontal" />
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes,
  args: {
    orientation: 'horizontal',
  },
} satisfies Meta<typeof Divider>

export default meta
type Story = StoryObj<typeof meta>

/** Controls에서 orientation을 바꿔 수평/수직을 확인하세요. */
export const Default: Story = {
  render: args =>
    args.orientation === 'vertical' ? (
      <div className="flex items-center gap-3 h-10">
        <span>좌측</span>
        <Divider {...args} />
        <span>우측</span>
      </div>
    ) : (
      <div className="w-60">
        <div className="py-2">상단 콘텐츠</div>
        <Divider {...args} />
        <div className="py-2">하단 콘텐츠</div>
      </div>
    ),
}

export const Horizontal: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="w-60">
      <div className="py-2">상단 콘텐츠</div>
      <Divider orientation="horizontal" />
      <div className="py-2">하단 콘텐츠</div>
    </div>
  ),
}

export const Vertical: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex items-center gap-3 h-10">
      <span>좌측</span>
      <Divider orientation="vertical" />
      <span>우측</span>
    </div>
  ),
}

export const InList: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="w-48">
      {['항목 1', '항목 2', '항목 3'].map((item, i) => (
        <React.Fragment key={item}>
          {i > 0 && <Divider orientation="horizontal" />}
          <div className="py-2.5">{item}</div>
        </React.Fragment>
      ))}
    </div>
  ),
}
