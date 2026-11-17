import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'

import { FadeSwap } from '@turbo-project/afds/bricks'

const meta = {
  title: 'AFDS / Bricks / Animation / FadeSwap',
  component: FadeSwap,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
자식의 key가 변경될 때 fade-out → fade-in 트랜지션을 적용하는 컴포넌트입니다.

**Import:**
\`\`\`tsx
import { FadeSwap } from '@turbo-project/afds/bricks'
\`\`\`

### 기본 사용법
\`\`\`tsx
<FadeSwap duration={200}>
  <div key={currentStep}>{stepContent[currentStep]}</div>
</FadeSwap>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  args: {
    children: React.createElement('div', { key: 'default' }, '콘텐츠'),
  },
} satisfies Meta<typeof FadeSwap>

export default meta
type Story = StoryObj<typeof meta>

const steps = ['첫 번째 스텝', '두 번째 스텝', '세 번째 스텝']
const stepColorClass = ['bg-blue-100', 'bg-green-100', 'bg-yellow-100']

/** 버튼을 클릭해 콘텐츠를 전환해보세요. */
export const Default: Story = {
  render: function AnimatedTabs() {
    const [step, setStep] = React.useState(0)
    return (
      <div className="flex w-80 flex-col gap-4">
        <div className="flex gap-2">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`rounded-md border px-3 py-1.5 text-sm cursor-pointer ${
                step === i
                  ? 'bg-indigo-500 text-white border-indigo-500'
                  : 'bg-white text-afds-gray-700 border-afds-gray-300'
              }`}
            >
              Step {i + 1}
            </button>
          ))}
        </div>
        <FadeSwap duration={200}>
          <div key={step} className={`rounded-lg p-6 text-center text-sm ${stepColorClass[step]}`}>
            {steps[step]}
          </div>
        </FadeSwap>
      </div>
    )
  },
}

/** 빠른 트랜지션 예시입니다. */
export const Fast: Story = {
  render: function FastTransition() {
    const [idx, setIdx] = React.useState(0)
    const items = ['사과', '바나나', '체리']
    return (
      <div className="flex flex-col items-center gap-3">
        <FadeSwap duration={100}>
          <div key={idx} className="rounded-lg bg-afds-gray-100 px-6 py-3 text-base">
            {items[idx]}
          </div>
        </FadeSwap>
        <button
          onClick={() => setIdx(p => (p + 1) % items.length)}
          className="rounded-md border border-afds-gray-300 px-3 py-1.5 text-sm text-afds-gray-700 cursor-pointer"
        >
          다음 →
        </button>
      </div>
    )
  },
}
