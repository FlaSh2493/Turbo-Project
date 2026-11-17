import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { expect, within } from '@storybook/test'
import { OverflowTooltip } from '.'

/**
 *
 * 텍스트가 잘릴 때만 자동으로 툴팁을 표시하는 컴포넌트입니다.
 * 내부적으로 `scrollWidth > clientWidth`를 감지하여 오버플로 발생 시에만 Tooltip을 활성화합니다.
 * 여러 줄 line-clamp 는 `axis="block"` 과 `className="line-clamp-N"` 을 함께 주면 `scrollHeight > clientHeight` 로 감지합니다.
 *
 * ### 기본 사용법
 * ```tsx
 * import { OverflowTooltip } from '.'
 *
 * <div style={{ width: 150 }}>
 *   <OverflowTooltip className="block">
 *     잘릴 수 있는 긴 텍스트 내용입니다
 *   </OverflowTooltip>
 * </div>
 * ```
 *
 * ### 언제 사용하나요?
 * - 테이블 셀처럼 너비가 고정된 곳에서 긴 텍스트를 표시할 때
 * - 텍스트가 잘릴 때만 툴팁으로 전체 내용을 보여주고 싶을 때
 * - 항상 툴팁을 보여주는 것이 아닌, 오버플로 여부에 따라 조건부로 표시할 때
 *
 * ### OverflowTooltip vs Tooltip
 * | 항목 | OverflowTooltip | Tooltip |
 * |------|----------------|---------|
 * | 툴팁 표시 조건 | 텍스트가 잘릴 때만 | 항상 |
 * | 사용 목적 | 고정 너비 컨테이너의 텍스트 | 일반 툴팁 |
 *
 * ### 베스트 프랙티스
 * - 컨테이너에 명시적인 `width`나 `max-width`를 지정해야 오버플로 감지가 정확합니다
 * - 내부 트리거는 inline `<span>`이므로 부모 너비 제약을 받으려면 `className="block"`을 함께 지정합니다 (또는 부모를 flex 컨테이너로 구성)
 * - `content`를 생략하면 `children`이 툴팁 내용으로 자동 사용됩니다
 */
const meta = {
  title: 'Compositions / Common / Overlay / OverflowTooltip',
  component: OverflowTooltip,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
텍스트가 잘릴 때만 자동으로 툴팁을 표시하는 컴포넌트입니다.

**Import:**
\`\`\`tsx
import { OverflowTooltip } from '.'
\`\`\`

### 기본 사용법
\`\`\`tsx
<div style={{ width: 150 }}>
  <OverflowTooltip className="block">
    잘릴 수 있는 긴 텍스트 내용입니다
  </OverflowTooltip>
</div>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  args: {
    children: '텍스트 내용',
  },
} satisfies Meta<typeof OverflowTooltip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** 텍스트가 잘릴 만큼 좁은 컨테이너 — 툴팁이 활성화됩니다. */
export const Overflow: Story = {
  args: { children: '이 텍스트는 너무 길어서 컨테이너를 넘어갑니다', className: 'block' },
  decorators: [
    (Story: React.ComponentType) => (
      <div className="w-[150px]">
        <Story />
      </div>
    ),
  ],
}

/** 텍스트가 충분히 짧아 잘리지 않는 경우 — 툴팁이 표시되지 않습니다. */
export const NoOverflow: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="w-[300px]">
      <OverflowTooltip className="block">짧은 텍스트</OverflowTooltip>
    </div>
  ),
}

/** `content`를 명시적으로 지정한 예시입니다. */
export const CustomContent: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="w-[120px]">
      <OverflowTooltip
        className="block"
        content="전체 파일 경로: /Users/example/projects/my-app/src/components/Button.tsx"
      >
        /Users/example/projects/my-app/src/components/Button.tsx
      </OverflowTooltip>
    </div>
  ),
}

/** `axis="block"` 과 `line-clamp-N` 으로 여러 줄이 잘릴 때만 툴팁을 표시합니다. */
export const LineClamp: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="w-[200px]">
      <OverflowTooltip axis="block" className="line-clamp-2">
        이 설명은 두 줄을 넘겨서 이어지므로 세 번째 줄부터는 잘리고, 호버하면 전체 내용이 툴팁으로
        표시됩니다.
      </OverflowTooltip>
    </div>
  ),
}

/** 테이블 셀에서 사용하는 예시입니다. */
export const InTable: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <table className="border-collapse w-[400px]">
      <thead>
        <tr>
          <th className="py-2 px-3 text-left border-b border-gray-200 text-[13px]">이름</th>
          <th className="py-2 px-3 text-left border-b border-gray-200 text-[13px]">설명</th>
        </tr>
      </thead>
      <tbody>
        {[
          { name: '캠페인 A', desc: '짧은 설명' },
          {
            name: '캠페인 B',
            desc: '이 설명은 매우 길어서 테이블 셀에서 잘릴 수 있습니다. 전체 내용을 보려면 호버하세요.',
          },
          {
            name: '캠페인 C',
            desc: '또 다른 긴 설명입니다. 오버플로 툴팁으로 전체 텍스트를 확인할 수 있습니다.',
          },
        ].map(row => (
          <tr key={row.name}>
            <td className="py-2 px-3 border-b border-gray-100 text-[13px] w-[100px]">{row.name}</td>
            <td className="py-2 px-3 border-b border-gray-100 text-[13px] w-[200px] max-w-[200px]">
              <OverflowTooltip className="block">{row.desc}</OverflowTooltip>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
}

// Interaction Test Stories

export const RenderTest: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="w-[100px]">
      <OverflowTooltip className="block">
        <span data-testid="overflow-text">매우 긴 텍스트가 이 컨테이너를 넘어갑니다</span>
      </OverflowTooltip>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByTestId('overflow-text')).toBeInTheDocument()
  },
}
