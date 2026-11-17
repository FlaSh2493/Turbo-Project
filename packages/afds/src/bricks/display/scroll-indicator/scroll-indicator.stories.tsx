import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { expect, within } from '@storybook/test'
import { ScrollIndicator } from '@turbo-project/afds/bricks'

/**
 *
 * 가로 스크롤 컨테이너의 현재 뷰포트 위치를 플로팅 박스로 표시하는 컴포넌트입니다.
 * 파란 테두리 박스를 드래그하면 스크롤 컨테이너도 비율에 맞게 스크롤됩니다.
 *
 * ### 언제 사용하나요?
 * - 넓은 테이블이나 캔버스처럼 가로 스크롤이 긴 컨테이너
 * - 현재 보이는 영역을 미니맵 형태로 표시하고 싶을 때
 * - 드래그로 빠르게 가로 위치를 이동하고 싶을 때
 *
 * ### 기본 사용법
 * ```tsx
 * <div className="relative">
 *   <div ref={containerRef} className="overflow-x-auto">...컨텐츠</div>
 *   <ScrollIndicator
 *     scrollContainerRef={containerRef}
 *     className="bottom-10 right-10"
 *   />
 * </div>
 * ```
 *
 * ### 베스트 프랙티스
 * - `scrollContainerRef`는 실제 스크롤이 일어나는 요소를 가리켜야 합니다
 * - 컨테이너 콘텐츠가 뷰포트보다 넓을 때만 인디케이터가 표시됩니다
 * - 위치는 부모를 `relative`로 잡고 `className`으로 조정합니다 (크기는 100×52로 고정)
 */
const meta = {
  title: 'AFDS / Bricks / Display / ScrollIndicator',
  component: ScrollIndicator,
  parameters: {
    layout: 'centered',
    docs: {
      story: { height: '240px' },
    },
  },
  tags: ['autodocs'],
  args: {
    scrollContainerRef: { current: null } as React.RefObject<HTMLElement | null>,
  },
} satisfies Meta<typeof ScrollIndicator>

export default meta
type Story = StoryObj<typeof meta>

/** 가로 스크롤 컨테이너와 함께 사용하는 기본 예시입니다. */
export const Default: Story = {
  render: function DefaultScrollIndicator() {
    const containerRef = React.useRef<HTMLDivElement>(null)

    return (
      <div className="relative w-[400px] pb-[80px]">
        <div
          ref={containerRef}
          className="w-[400px] overflow-hidden overflow-x-auto border border-afds-border-default rounded-afds-md"
        >
          <div className="flex gap-afds-spacing-8 p-afds-spacing-14 w-[1200px]">
            {Array.from({ length: 20 }, (_, i) => (
              <div
                key={i}
                className="shrink-0 flex items-center justify-center text-xs font-semibold text-afds-text-primary rounded-md w-[56px] h-[56px] bg-afds-bg-surface-sunken"
              >
                {i + 1}
              </div>
            ))}
          </div>

          <ScrollIndicator
            scrollContainerRef={containerRef}
            className="bottom-[16px] right-0"
            aria-hidden="true"
          />
        </div>
      </div>
    )
  },
}

export const RenderTest: Story = {
  render: function RenderScrollIndicator() {
    const containerRef = React.useRef<HTMLDivElement>(null)
    return (
      <div className="relative w-[300px] pb-[80px]">
        <div
          ref={containerRef}
          data-testid="scroll-container"
          className="w-[300px] overflow-x-auto"
        >
          <div className="bg-afds-bg-canvas w-[900px] h-[40px]" />
          <ScrollIndicator
            scrollContainerRef={containerRef}
            className="bottom-[16px] right-0"
            aria-hidden="true"
          />
        </div>
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByTestId('scroll-container')).toBeInTheDocument()
  },
}
