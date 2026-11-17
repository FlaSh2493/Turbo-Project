import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FadeIn } from '@turbo-project/afds/bricks'

const meta = {
  title: 'AFDS / Bricks / Animation / FadeIn',
  component: FadeIn,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
자식 요소에 페이드인 애니메이션을 적용하는 래퍼 컴포넌트입니다.

**Import:**
\`\`\`tsx
import { FadeIn } from '@turbo-project/afds/bricks'
\`\`\`

### 기본 사용법
\`\`\`tsx
<FadeIn duration={300}>
  <div>페이드인으로 나타납니다</div>
</FadeIn>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  args: { duration: 300, delay: 0, children: React.createElement('div', null, '콘텐츠') },
} satisfies Meta<typeof FadeIn>

export default meta
type Story = StoryObj<typeof meta>

const Content = ({ label = '페이드인 콘텐츠' }: { label?: string }) => (
  <div className="rounded-lg bg-blue-100 px-6 py-4 text-sm">{label}</div>
)

const ReplayButton = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="rounded-md border border-afds-gray-300 px-3 py-1.5 text-sm text-afds-gray-700 cursor-pointer"
  >
    ▶ 다시 재생
  </button>
)

/** 버튼을 눌러 애니메이션을 다시 재생할 수 있습니다. */
export const Default: Story = {
  render: function Playground(args) {
    const [key, setKey] = React.useState(0)
    return (
      <div className="flex flex-col items-center gap-4">
        <ReplayButton onClick={() => setKey(k => k + 1)} />
        <FadeIn key={key} {...args}>
          <Content />
        </FadeIn>
      </div>
    )
  },
}

/** duration={1000} — 느린 페이드인입니다. */
export const Slow: Story = {
  render: function SlowStory() {
    const [key, setKey] = React.useState(0)
    return (
      <div className="flex flex-col items-center gap-4">
        <ReplayButton onClick={() => setKey(k => k + 1)} />
        <FadeIn key={key} duration={1000}>
          <Content />
        </FadeIn>
      </div>
    )
  },
}

/** delay={300} — 딜레이 후 등장합니다. */
export const WithDelay: Story = {
  render: function WithDelayStory() {
    const [key, setKey] = React.useState(0)
    return (
      <div className="flex flex-col items-center gap-4">
        <ReplayButton onClick={() => setKey(k => k + 1)} />
        <FadeIn key={key} duration={500} delay={300}>
          <Content />
        </FadeIn>
      </div>
    )
  },
}

/** 각 항목이 순서대로 등장합니다. */
export const Sequential: Story = {
  render: function SequentialStory() {
    const [key, setKey] = React.useState(0)
    return (
      <div className="flex flex-col items-center gap-4">
        <ReplayButton onClick={() => setKey(k => k + 1)} />
        <div key={key} className="flex flex-col gap-2">
          {['첫 번째', '두 번째', '세 번째', '네 번째'].map((text, i) => (
            <FadeIn key={text} delay={i * 150} duration={300}>
              <div className="rounded-md bg-blue-100 px-4 py-2 text-sm">{text} 항목</div>
            </FadeIn>
          ))}
        </div>
      </div>
    )
  },
}
