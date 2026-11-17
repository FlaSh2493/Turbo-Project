import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { RangeDatePicker, type DateRange } from './range-date-picker'

/**
 *
 * `RangeCalendar`와 헤드리스 훅(`useRangeCalendar`)을 결합한 날짜 범위 선택 컴포지션입니다.
 * 카드 형태의 외곽을 가지고 있어 단독 패널 또는 Dropdown 내부 콘텐츠로 활용합니다.
 *
 * **Import:**
 * ```tsx
 * import { RangeDatePicker, type DateRange } from './range-date-picker'
 * ```
 *
 * ### 기본 사용법
 * ```tsx
 * <RangeDatePicker
 *   value={range}
 *   onValueChange={setRange}
 *   locale="ko-KR"
 * />
 * ```
 *
 * ### 베스트 프랙티스
 * - 외부에서 값을 제어할 필요가 없다면 `defaultRange`만 전달해 uncontrolled 모드로 사용합니다.
 * - 비활성 날짜는 `isDateUnavailable`로 제외합니다.
 */

/** 스토리 스냅샷을 실행 날짜와 무관하게 만들기 위한 고정 기준일 (2026-01-15). 과거 달이라 영구 안정이다. */
const fixedToday = () => new Date(2026, 0, 15)

const meta = {
  title: 'Compositions / Common / Form / RangeDatePicker',
  component: RangeDatePicker,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    locale: 'ko-KR',
  },
} satisfies Meta<typeof RangeDatePicker>

export default meta
type Story = StoryObj<typeof meta>

const formatDate = (d: Date) => d.toLocaleDateString('ko-KR')

// args-only 스토리도 표시 월을 고정해야 한다. 고정하지 않으면 meta.args 만 적용되어
// 실행 시점의 현재 달이 렌더되고, 달이 바뀔 때마다 스냅샷이 달라진다.
export const Default: Story = { args: { defaultFocusedDate: fixedToday() } }

/** `defaultRange`만 전달하는 uncontrolled 모드입니다. 내부에서 범위 상태를 관리합니다. */
export const Uncontrolled: Story = {
  args: {
    defaultRange: {
      start: new Date(2026, 4, 1),
      end: new Date(2026, 4, 10),
    },
  },
}

/** 외부 state로 범위를 제어하는 controlled 모드입니다. */
export const Controlled: Story = {
  parameters: { controls: { disable: true } },
  render: function ControlledRangeDatePicker() {
    const [range, setRange] = useState<DateRange | undefined>()
    return (
      <div className="flex flex-col items-center gap-afds-spacing-10">
        <RangeDatePicker
          defaultFocusedDate={fixedToday()}
          value={range}
          onValueChange={setRange}
          locale="ko-KR"
        />
        <span className="text-afds-text-secondary body3">
          {range?.start ? `시작: ${formatDate(range.start)}` : '시작일 선택'}
          {range?.end ? ` ~ 종료: ${formatDate(range.end)}` : ''}
        </span>
      </div>
    )
  },
}

/** 주말을 선택 불가능하게 처리한 예시입니다. */
export const WithUnavailableDates: Story = {
  parameters: { controls: { disable: true } },
  render: function UnavailableRangeDatePicker() {
    const [range, setRange] = useState<DateRange | undefined>()
    return (
      <RangeDatePicker
        defaultFocusedDate={fixedToday()}
        value={range}
        onValueChange={setRange}
        locale="ko-KR"
        isDateUnavailable={date => {
          const day = date.getDay()
          return day === 0 || day === 6
        }}
      />
    )
  },
}

/** 두 달을 좌우로 함께 표시한 예시입니다. */
export const TwoMonths: Story = {
  parameters: { controls: { disable: true } },
  render: function TwoMonthsRangeDatePicker() {
    const [range, setRange] = useState<DateRange | undefined>()
    return (
      <RangeDatePicker
        defaultFocusedDate={fixedToday()}
        value={range}
        onValueChange={setRange}
        locale="ko-KR"
        visibleDuration={{ months: 2 }}
      />
    )
  },
}

/**
 * `startName` / `endName` 두 prop으로 네이티브 폼 제출에 참여합니다.
 * 각각 독립된 hidden input에 `YYYY-MM-DD` 형식으로 동기화됩니다.
 */
export const FormSubmission: Story = {
  parameters: { controls: { disable: true } },
  render: function FormRangeDatePicker() {
    const [submitted, setSubmitted] = useState<Record<string, FormDataEntryValue> | null>(null)
    return (
      <form
        className="flex flex-col items-start gap-afds-spacing-12"
        onSubmit={e => {
          e.preventDefault()
          setSubmitted(Object.fromEntries(new FormData(e.currentTarget)))
        }}
      >
        <RangeDatePicker
          defaultFocusedDate={fixedToday()}
          startName="checkIn"
          endName="checkOut"
          locale="ko-KR"
        />
        <button
          type="submit"
          className="px-afds-10 py-afds-4 rounded-afds-sm border border-afds-border-default text-afds-12 bg-afds-bg-surface"
        >
          제출
        </button>
        {submitted && (
          <pre className="bg-afds-bg-surface-sunken rounded-afds-sm p-afds-spacing-8 text-afds-13">
            {JSON.stringify(submitted, null, 2)}
          </pre>
        )}
      </form>
    )
  },
}

/** 푸터 영역에 추가 UI를 배치한 예시입니다. */
export const WithFooter: Story = {
  parameters: { controls: { disable: true } },
  render: function FooterRangeDatePicker() {
    const [range, setRange] = useState<DateRange | undefined>()
    const setThisMonth = () => {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      setRange({ start, end })
    }
    return (
      <RangeDatePicker
        defaultFocusedDate={fixedToday()}
        value={range}
        onValueChange={setRange}
        locale="ko-KR"
        footer={
          <div className="mt-afds-spacing-12 flex justify-end gap-afds-spacing-8">
            <button
              type="button"
              onClick={setThisMonth}
              className="px-afds-10 py-afds-4 rounded-afds-sm border border-afds-border-default text-afds-12 bg-afds-bg-surface"
            >
              이번 달
            </button>
            <button
              type="button"
              onClick={() => setRange(undefined)}
              className="px-afds-10 py-afds-4 rounded-afds-sm border border-afds-border-default text-afds-12 bg-afds-bg-surface"
            >
              초기화
            </button>
          </div>
        }
      />
    )
  },
}
