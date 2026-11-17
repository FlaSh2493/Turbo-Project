import type { Meta, StoryObj } from '@storybook/react'
import { Button } from '@turbo-project/afds/bricks'
import { BaseTooltip, type BaseTooltipProps } from './base-tooltip'

/**
 *
 * 트리거 요소에 호버(또는 클릭) 시 설명 팝업을 표시하는 컴포지션 컴포넌트입니다.
 *
 * **Import:**
 * ```tsx
 * import { BaseTooltip } from '.'
 * ```
 *
 * ### 기본 사용법
 * ```tsx
 * <BaseTooltip content="설명 텍스트">
 *   <Button>호버하세요</Button>
 * </BaseTooltip>
 * ```
 *
 * ### 베스트 프랙티스
 * - `mode="click"`은 모바일 환경에 사용하세요
 * - dot-notation 합성이 필요하면 `components/overlay/tooltip`의 `Tooltip`을 사용하세요
 */

type BaseTooltipStoryArgs = BaseTooltipProps

const meta = {
  title: 'Compositions / Common / Overlay / BaseTooltip',
  component: BaseTooltip,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof BaseTooltip>

export default meta
type Story = StoryObj<BaseTooltipStoryArgs>

export const Default: Story = {
  args: {
    content: '이것은 기본 BaseTooltip입니다.',
    children: <Button variant="primary-line">Hover me</Button>,
  },
}

export const ClickTrigger: Story = {
  args: {
    mode: 'click',
    content: '클릭으로 트리거되는 BaseTooltip입니다. 닫기 버튼으로 닫습니다.',
    showClose: true,
    children: <Button variant="primary-line">Click me</Button>,
  },
}

export const Small: Story = {
  args: {
    size: 'sm',
    content: '소형 사이즈의 BaseTooltip입니다.',
    children: <Button variant="primary-line">Small</Button>,
  },
}

export const Medium: Story = {
  args: {
    size: 'md',
    content: '중형 사이즈의 BaseTooltip입니다.',
    children: <Button variant="primary-line">Medium</Button>,
  },
}

export const WithoutArrow: Story = {
  args: {
    showArrow: false,
    content: '화살표 없이 표시되는 BaseTooltip입니다.',
    children: <Button variant="primary-line">No Arrow</Button>,
  },
}

export const AllPositions: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const sides = ['top', 'bottom', 'left', 'right'] as const
    const aligns = ['start', 'center', 'end'] as const

    return (
      <div className="grid grid-cols-3 gap-10 p-15">
        {sides.map(side =>
          aligns.map(align => (
            <BaseTooltip
              key={`${side}-${align}`}
              content={`${side} ${align} 위치`}
              size="md"
              side={side}
              align={align}
            >
              <Button variant="primary-line" className="w-full">
                {side} {align}
              </Button>
            </BaseTooltip>
          )),
        )}
      </div>
    )
  },
}
