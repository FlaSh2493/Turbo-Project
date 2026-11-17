import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Progress } from '@turbo-project/afds/bricks'

/**
 *
 * 진행 상태를 나타내는 합성 컴포넌트입니다. Root · Track · Indicator · Value · Label을 조합해 사용합니다.
 *
 * ### 기본 사용법
 * ```tsx
 * // 기본
 * <Progress value={60}>
 *   <Progress.Track>
 *     <Progress.Indicator />
 *   </Progress.Track>
 * </Progress>
 *
 * // 진행률 텍스트 표시
 * <Progress value={75}>
 *   <Progress.Track>
 *     <Progress.Indicator />
 *     <Progress.Value />
 *   </Progress.Track>
 * </Progress>
 *
 * // 레이블 포함
 * <Progress value={60}>
 *   <Progress.Label>업로드 진행률</Progress.Label>
 *   <Progress.Track>
 *     <Progress.Indicator />
 *   </Progress.Track>
 * </Progress>
 * ```
 *
 * ### 언제 사용하나요?
 * - 파일 업로드·다운로드 진행 상태
 * - 단계별 진행률 (온보딩, 설문 등)
 * - 목표 달성도 표시
 */

const meta = {
  title: 'AFDS / Bricks / Feedback / Progress',
  component: Progress,
  decorators: [
    (Story: React.ComponentType) => (
      <div className="w-[300px]">
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    value: 60,
    max: 100,
  },
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: '현재 진행도 값',
    },
    max: {
      control: { type: 'number', min: 1 },
      description: '최대 진행도 값',
    },
  },
} satisfies Meta<typeof Progress>

export default meta
type Story = StoryObj<typeof meta>

// Basic Stories

export const Default: Story = {
  render: args => (
    <Progress {...args}>
      <Progress.Track>
        <Progress.Indicator />
      </Progress.Track>
    </Progress>
  ),
}

/** `Progress.Value`를 추가하면 진행률이 바 위에 오버레이로 표시됩니다. */
export const WithValue: Story = {
  args: { value: 75 },
  render: args => (
    <Progress {...args}>
      <Progress.Track>
        <Progress.Indicator />
        <Progress.Value />
      </Progress.Track>
    </Progress>
  ),
}

/** `Progress.Label`로 진행 바에 설명 텍스트를 추가합니다. */
export const WithLabel: Story = {
  render: args => (
    <Progress {...args}>
      <Progress.Label>파일 업로드 중</Progress.Label>
      <Progress.Track>
        <Progress.Indicator />
        <Progress.Value />
      </Progress.Track>
    </Progress>
  ),
}

// Value Stories

/** 0% ~ 100% 다양한 값에서의 표시를 확인합니다. */
export const VariousValues: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-afds-spacing-10">
      {[0, 25, 50, 75, 100].map(v => (
        <Progress key={v} value={v}>
          <Progress.Track>
            <Progress.Indicator />
            <Progress.Value />
          </Progress.Track>
        </Progress>
      ))}
    </div>
  ),
}

// Customization Stories

/** `Progress.Track`의 `className`으로 높이를 커스텀합니다. */
export const CustomHeight: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-afds-spacing-14">
      <Progress value={60}>
        <Progress.Track className="h-2">
          <Progress.Indicator />
        </Progress.Track>
      </Progress>
      <Progress value={60}>
        <Progress.Track>
          <Progress.Indicator />
        </Progress.Track>
      </Progress>
      <Progress value={60}>
        <Progress.Track className="h-8">
          <Progress.Indicator />
        </Progress.Track>
      </Progress>
    </div>
  ),
}

// Interactive Stories

/** 값이 자동으로 변하는 애니메이션 데모입니다. */
export const Animated: Story = {
  parameters: { controls: { disable: true } },
  render: function AnimatedExample() {
    const [value, setValue] = React.useState(0)
    React.useEffect(() => {
      const id = setInterval(() => {
        setValue(v => (v >= 100 ? 0 : v + 10))
      }, 600)
      return () => clearInterval(id)
    }, [])
    return (
      <Progress value={value}>
        <Progress.Track>
          <Progress.Indicator />
          <Progress.Value />
        </Progress.Track>
      </Progress>
    )
  },
}
