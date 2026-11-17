import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { expect, within } from '@storybook/test'
import { PeriodFilter } from '.'
import type { PeriodFilterValue } from '.'

/**
 *
 * "이후 / 이전 / 기간" 세 가지 날짜 조건을 선택하는 복합 필터 컴포넌트입니다.
 * 아코디언 안에 Calendar가 내장되어 날짜를 직접 선택할 수 있으며,
 * 추가 커스텀 옵션(`extraOptions`)도 지원합니다.
 *
 * ### 기본 사용법
 * ```tsx
 * import { PeriodFilter } from '.'
 * import type { PeriodFilterValue } from '.'
 *
 * <PeriodFilter value={value} onChange={setValue} onClose={handleClose} />
 * ```
 *
 * ### 언제 사용하나요?
 * - 테이블 날짜 컬럼의 고급 필터
 * - "이후 / 이전 / 기간" 중 하나를 선택하는 드롭다운 필터 패널
 *
 * ### PeriodFilterValue 구조
 * ```ts
 * // 이후 모드
 * { mode: 'after', date: '2024-01-01' }
 *
 * // 이전 모드
 * { mode: 'before', date: '2024-12-31' }
 *
 * // 기간 모드
 * { mode: 'range', from: '2024-01-01', to: '2024-03-31' }
 *
 * // 커스텀 옵션
 * { mode: 'this-month' }
 * ```
 *
 * ### 베스트 프랙티스
 * - `value={null}`로 초기화된 상태를 표현합니다
 * - `extraOptions`으로 "이번 달", "올해" 같은 단순 선택 옵션을 추가할 수 있습니다
 * - `onClose`는 취소 버튼 클릭 및 적용 후 호출됩니다
 * - 미래 날짜를 비활성화하려면 `disabledAfter={new Date()}`를 명시적으로 전달합니다.
 *   컴포넌트 내부에서 `new Date()`를 호출하지 않으므로 SSR 환경에서 hydration mismatch가 발생하지 않습니다.
 */

/** 스토리 스냅샷을 실행 날짜와 무관하게 만들기 위한 고정 기준일 (2026-01-15). 과거 달이라 영구 안정이다. */
const fixedToday = () => new Date(2026, 0, 15)

const meta = {
  title: 'Compositions / Common / Form / PeriodFilter',
  component: PeriodFilter,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
이후/이전/기간 날짜 조건을 선택하는 아코디언+캘린더 복합 필터 컴포넌트입니다.

**Import:**
\`\`\`tsx
import { PeriodFilter } from '.'
import type { PeriodFilterValue } from '.'
\`\`\`

### 기본 사용법
\`\`\`tsx
<PeriodFilter value={value} onChange={setValue} onClose={handleClose} />
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  args: {
    value: null,
    onChange: () => {},
    onClose: () => {},
  },
} satisfies Meta<typeof PeriodFilter>

export default meta
type Story = StoryObj<typeof meta>

/** 초기값이 없는 기본 필터 패널입니다. */
export const Default: Story = {
  render: function DefaultPeriodFilter() {
    const [value, setValue] = React.useState<PeriodFilterValue | null>(null)
    const [applied, setApplied] = React.useState<PeriodFilterValue | null>(null)
    return (
      <div className="flex flex-col gap-afds-spacing-8 items-start">
        <PeriodFilter
          value={value}
          onChange={v => {
            setValue(v)
            setApplied(v)
          }}
          onClose={() => {}}
        />
        {applied && (
          <span className="text-xs text-afds-text-secondary">
            적용됨: {JSON.stringify(applied)}
          </span>
        )}
      </div>
    )
  },
}

/** 추가 단순 선택 옵션이 포함된 필터 패널입니다. */
export const WithExtraOptions: Story = {
  render: function ExtraPeriodFilter() {
    const [value, setValue] = React.useState<PeriodFilterValue | null>(null)
    return (
      <PeriodFilter
        value={value}
        onChange={setValue}
        onClose={() => {}}
        extraOptions={[
          { value: 'this-month', label: '이번 달' },
          { value: 'last-month', label: '지난 달' },
          { value: 'this-year', label: '올해' },
        ]}
      />
    )
  },
}

/** 기간 모드로 사전 설정된 필터입니다. */
export const PresetRange: Story = {
  render: function PresetRangeFilter() {
    const [value, setValue] = React.useState<PeriodFilterValue | null>({
      mode: 'range',
      from: '2025-01-01',
      to: '2025-03-31',
    })
    return <PeriodFilter value={value} onChange={setValue} onClose={() => {}} />
  },
}

/** 이후 모드로 사전 설정된 필터입니다. */
export const PresetAfter: Story = {
  render: function PresetAfterFilter() {
    const [value, setValue] = React.useState<PeriodFilterValue | null>({
      mode: 'after',
      date: '2025-03-01',
    })
    return <PeriodFilter value={value} onChange={setValue} onClose={() => {}} />
  },
}

/**
 * `disabledAfter`로 오늘 이후 날짜를 비활성화한 필터입니다.
 *
 * SSR hydration 안전성을 위해 컴포넌트 내부에서 `new Date()`를 호출하지 않습니다.
 * 호출자가 명시적으로 `disabledAfter={new Date()}`를 전달해야 미래 날짜가 disabled 처리됩니다.
 */
export const DisabledFuture: Story = {
  render: function DisabledFuturePeriodFilter() {
    const [value, setValue] = React.useState<PeriodFilterValue | null>(null)
    return (
      <PeriodFilter
        value={value}
        onChange={setValue}
        onClose={() => {}}
        disabledAfter={fixedToday()}
      />
    )
  },
}

// Interaction Test Stories

export const RenderTest: Story = {
  render: function RenderPeriodFilter() {
    const [value, setValue] = React.useState<PeriodFilterValue | null>(null)
    return (
      <div data-testid="period-filter-wrapper">
        <PeriodFilter value={value} onChange={setValue} onClose={() => {}} />
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByTestId('period-filter-wrapper')).toBeInTheDocument()
    const buttons = canvas.getAllByRole('button')
    await expect(buttons.length).toBeGreaterThan(0)
  },
}
