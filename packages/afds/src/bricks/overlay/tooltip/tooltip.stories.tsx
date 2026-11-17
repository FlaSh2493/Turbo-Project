import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { XIcon } from 'lucide-react'
import { Tooltip } from '@turbo-project/afds/bricks'
import { Button } from '@turbo-project/afds/bricks'

/**
 *
 * base-ui Tooltip 합성 컴포넌트를 그대로 노출하는 dot-notation API입니다.
 * Root/Provider/Trigger/Portal/Positioner/Popup/Arrow/Close 파트를 자유롭게 조합합니다.
 *
 * **Import:**
 * ```tsx
 * import { Tooltip, Button } from '@turbo-project/afds/bricks'
 * ```
 *
 * ### 기본 사용법
 * ```tsx
 * <Tooltip.Root>
 *   <Tooltip.Trigger render={<Button>호버</Button>} />
 *   <Tooltip.Portal>
 *     <Tooltip.Positioner side="top">
 *       <Tooltip.Popup size="md">
 *         툴팁 텍스트
 *         <Tooltip.Arrow />
 *       </Tooltip.Popup>
 *     </Tooltip.Positioner>
 *   </Tooltip.Portal>
 * </Tooltip.Root>
 * ```
 *
 * ### 베스트 프랙티스
 * - 트리거에 `render={<button>}` 패턴으로 자체 버튼 컴포넌트 전달
 * - `Provider`로 같은 페이지의 여러 Tooltip을 묶으면 hover 지연 공유 가능
 * - click 모드는 `mode="click"`으로 Root에 전달
 */

const meta = {
  title: 'AFDS / Bricks / Overlay / Tooltip',
  component: Tooltip.Root,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Tooltip.Root>

export default meta
type Story = StoryObj<typeof meta>

const renderTooltip = (
  options: {
    size?: 'sm' | 'md'
    side?: 'top' | 'right' | 'bottom' | 'left'
    align?: 'start' | 'center' | 'end'
    showArrow?: boolean
    triggerLabel?: string
    content?: React.ReactNode
  } = {},
) => {
  const {
    size = 'md',
    side = 'top',
    align = 'center',
    showArrow = true,
    triggerLabel = '호버하세요',
    content = '툴팁 내용입니다.',
  } = options
  return (
    <Tooltip.Root>
      <Tooltip.Trigger render={<Button variant="primary-line">{triggerLabel}</Button>} />
      <Tooltip.Portal>
        <Tooltip.Positioner side={side} align={align}>
          <Tooltip.Popup size={size}>
            <span>{content}</span>
            {showArrow && <Tooltip.Arrow />}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}

/** 기본 Tooltip — hover하면 표시됩니다. */
export const Default: Story = {
  render: () => renderTooltip(),
}

/** size variant — sm/md */
export const AllSizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-row items-center gap-10">
      {renderTooltip({ size: 'sm', triggerLabel: 'Small', content: 'sm 사이즈' })}
      {renderTooltip({ size: 'md', triggerLabel: 'Medium', content: 'md 사이즈 (기본)' })}
    </div>
  ),
}

/** 화살표 없음 */
export const WithoutArrow: Story = {
  render: () => renderTooltip({ showArrow: false, triggerLabel: 'No arrow' }),
}

/** 닫기 버튼 포함 — hover로 열고 X 클릭으로 닫기 */
export const WithCloseButton: Story = {
  render: () => (
    <Tooltip.Root mode="hover">
      <Tooltip.Trigger render={<Button variant="primary-line">호버하세요</Button>} />
      <Tooltip.Portal>
        <Tooltip.Positioner side="top">
          <Tooltip.Popup size="md">
            <div className="flex items-start gap-1">
              <span className="flex-1">닫기 버튼이 있는 툴팁</span>
              <Tooltip.Close>
                <XIcon size={16} className="h-3 w-3" />
              </Tooltip.Close>
            </div>
            <Tooltip.Arrow />
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  ),
}

/** 클릭으로 열고 닫기 버튼으로 닫기 */
export const ClickTrigger: Story = {
  render: () => (
    <Tooltip.Root mode="click">
      <Tooltip.Trigger render={<Button variant="primary-line">클릭하세요</Button>} />
      <Tooltip.Portal>
        <Tooltip.Positioner side="top">
          <Tooltip.Popup size="md">
            <div className="flex items-start gap-1">
              <span className="flex-1">
                클릭으로 트리거되는 툴팁입니다. 닫기 버튼으로 닫습니다.
              </span>
              <Tooltip.Close>
                <XIcon size={16} className="h-3 w-3" />
              </Tooltip.Close>
            </div>
            <Tooltip.Arrow />
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  ),
}

/** 모든 방향·정렬 조합 */
export const AllPositions: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const sides = ['top', 'bottom', 'left', 'right'] as const
    const aligns = ['start', 'center', 'end'] as const
    return (
      <div className="grid grid-cols-3 gap-10 p-15">
        {sides.map(side =>
          aligns.map(align => (
            <div key={`${side}-${align}`}>
              {renderTooltip({
                side,
                align,
                triggerLabel: `${side} ${align}`,
                content: `${side} ${align}`,
              })}
            </div>
          )),
        )}
      </div>
    )
  },
}
