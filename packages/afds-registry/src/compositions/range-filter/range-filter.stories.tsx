import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { expect, userEvent, within } from '@storybook/test'
import { RangeFilter } from '.'
import type { RangeFilterValue } from '.'

/**
 *
 * 최솟값과 최댓값을 입력하는 범위 필터 컴포넌트입니다.
 * 적용/초기화/취소 버튼과 유효성 검사를 내장하고 있습니다.
 *
 * ### 기본 사용법
 * ```tsx
 * import { RangeFilter } from '.'
 * import type { RangeFilterValue } from '.'
 *
 * <RangeFilter value={value} onChange={setValue} onClose={handleClose} />
 * ```
 *
 * ### 언제 사용하나요?
 * - 테이블 컬럼 필터 (금액, 수량, 연령 등 숫자 범위)
 * - 팝오버 또는 드로어 내부의 범위 조건 입력
 *
 * ### 베스트 프랙티스
 * - `showMax={false}`로 최솟값만 입력받는 단일 입력 모드를 사용할 수 있습니다
 * - `minValue`/`maxValue`로 허용 범위를 제한하면 자동으로 유효성 검사가 적용됩니다
 * - `onClose`는 취소 버튼 및 유효한 값 적용 후 호출됩니다
 */
const meta = {
  title: 'Compositions / Common / Form / RangeFilter',
  component: RangeFilter,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
최솟값·최댓값 범위를 입력하는 필터 컴포넌트입니다. 유효성 검사와 초기화 기능을 내장합니다.

**Import:**
\`\`\`tsx
import { RangeFilter } from '.'
\`\`\`

### 기본 사용법
\`\`\`tsx
<RangeFilter value={value} onChange={setValue} onClose={handleClose} />
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  args: {
    value: { min: '', max: '' },
    onChange: () => {},
    onClose: () => {},
  },
} satisfies Meta<typeof RangeFilter>

export default meta
type Story = StoryObj<typeof meta>

/** 기본 범위 필터입니다. */
export const Default: Story = {
  render: function DefaultRangeFilter() {
    const [value, setValue] = React.useState<RangeFilterValue>({ min: '', max: '' })
    const [closed, setClosed] = React.useState(false)
    return (
      <div className="flex flex-col gap-afds-spacing-8">
        <RangeFilter
          value={value}
          onChange={v => {
            setValue(v)
            setClosed(false)
          }}
          onClose={() => setClosed(true)}
        />
        {closed && value.min && (
          <span className="text-xs text-afds-text-secondary">
            적용됨: {value.min} ~ {value.max}
          </span>
        )}
      </div>
    )
  },
}

/** 최솟값만 입력받는 단일 입력 모드입니다. */
export const MinOnly: Story = {
  render: function MinOnlyFilter() {
    const [value, setValue] = React.useState<RangeFilterValue>({ min: '' })
    return (
      <RangeFilter
        value={value}
        onChange={setValue}
        onClose={() => {}}
        showMax={false}
        minLabel="최솟값"
      />
    )
  },
}

/** 허용 범위가 제한된 필터입니다 (0 ~ 100). */
export const WithBounds: Story = {
  render: function BoundedFilter() {
    const [value, setValue] = React.useState<RangeFilterValue>({ min: '10', max: '90' })
    return (
      <RangeFilter
        value={value}
        onChange={setValue}
        onClose={() => {}}
        minValue={0}
        maxValue={100}
        minLabel="최소 (0 이상)"
        maxLabel="최대 (100 이하)"
      />
    )
  },
}

/** 커스텀 레이블을 적용한 필터입니다. */
export const CustomLabels: Story = {
  render: function CustomLabelFilter() {
    const [value, setValue] = React.useState<RangeFilterValue>({ min: '', max: '' })
    return (
      <RangeFilter
        value={value}
        onChange={setValue}
        onClose={() => {}}
        minLabel="최저 금액 (원)"
        maxLabel="최대 금액 (원)"
      />
    )
  },
}

// Interaction Test Stories

export const ConfirmInteraction: Story = {
  render: function ConfirmRangeFilter() {
    const [value, setValue] = React.useState<RangeFilterValue>({ min: '', max: '' })
    const [result, setResult] = React.useState('')
    return (
      <div>
        <RangeFilter
          value={value}
          onChange={v => {
            setValue(v)
            setResult(`${v.min}~${v.max}`)
          }}
          onClose={() => {}}
        />
        {result && (
          <div data-testid="result" className="mt-afds-spacing-8 text-xs">
            {result}
          </div>
        )}
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const inputs = canvas.getAllByRole('spinbutton')
    await expect(inputs.length).toBeGreaterThanOrEqual(1)
    await userEvent.type(inputs[0], '10')
    if (inputs[1]) await userEvent.type(inputs[1], '50')
    const applyBtn = canvas
      .getAllByRole('button')
      .find(b => b.textContent?.includes('적용') || b.textContent?.includes('apply'))
    if (applyBtn) await userEvent.click(applyBtn)
  },
}
