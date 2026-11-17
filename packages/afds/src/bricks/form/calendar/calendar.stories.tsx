import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import type { CalendarDate } from '@internationalized/date'
import { Calendar } from './calendar'
import { RangeCalendar } from './range-calendar'
import type { DateRange } from './range-calendar'
import {
  useCalendar,
  useCalendarMonth,
  type UseCalendarOptions,
  type UseCalendarResult,
} from '@turbo-project/afds/headless'
import {
  useRangeCalendar,
  useRangeCalendarMonth,
  type UseRangeCalendarResult,
} from '@turbo-project/afds/headless'
import { Tooltip } from '@turbo-project/afds/bricks'

/**
 * 스토리 스냅샷을 실행 날짜와 무관하게 만들기 위한 고정 기준일 (2026-01-15).
 *
 * **과거 달**로 잡는 것이 핵심이다. 시간은 앞으로만 가므로 `isToday` 가 다시 매칭될 일이 없고,
 * 따라서 today 인디케이터가 매일 다른 셀로 옮겨 다니며 만들던 시각 거짓 양성이 사라진다.
 * 미래 날짜로 잡으면 그 날이 왔을 때 다시 깨진다.
 *
 * 호출할 때마다 새 인스턴스를 반환한다 — 일부 스토리가 `setHours` 로 값을 변형한다.
 *
 * today 인디케이터 **자체의 시각 커버리지**는 `TodayIndicatorAppearance` 스토리가 담당하고,
 * 올바른 셀에 붙는지는 `calendar-today.test.tsx` 가 결정적으로 검증한다.
 */
const fixedToday = () => new Date(2026, 0, 15)

function CalendarDemo(props: UseCalendarOptions) {
  const cal = useCalendar(props)
  return (
    <Calendar cal={cal}>
      <CalendarLayout cal={cal} />
    </Calendar>
  )
}
CalendarDemo.displayName = 'Calendar / RangeCalendar'

const meta = {
  title: 'AFDS / Bricks / Form / Calendar · RangeCalendar',
  component: CalendarDemo,
  parameters: {
    layout: 'centered',
    docs: {
      title: 'Calendar / RangeCalendar',
      description: {
        component: `
Headless 훅 + Compound 컴포넌트 패턴. \`useCalendar\`로 상태를 만들고
\`cal\` prop으로 컴포넌트에 주입한다. 컴포넌트 자체는 스타일만 담당한다.

**Import:**
\`\`\`tsx
import { Calendar, RangeCalendar } from '@turbo-project/afds/bricks'
import { useCalendar, useRangeCalendar } from '@turbo-project/afds/headless'
\`\`\`

### 기본 사용법
\`\`\`tsx
function MyCalendar() {
  const [date, setDate] = React.useState<Date>()
  const cal = useCalendar({ value: date, onValueChange: setDate, locale: 'ko-KR' })
  return (
    <Calendar cal={cal}>
      <Calendar.Header>
        <Calendar.Heading />
        <div className="flex items-center gap-afds-spacing-10">
          <Calendar.PreviousButton />
          <Calendar.NextButton />
        </div>
      </Calendar.Header>
      <Calendar.Month>
        <Calendar.Weekdays />
        <Calendar.Days />
      </Calendar.Month>
    </Calendar>
  )
}
\`\`\`

### react-hook-form 연동
\`\`\`tsx
<Controller
  name="date"
  control={control}
  render={({ field }) => {
    const cal = useCalendar({ value: field.value, onValueChange: field.onChange })
    return (
      <Calendar cal={cal}>
        <Calendar.Header>...</Calendar.Header>
        <Calendar.Month>...</Calendar.Month>
      </Calendar>
    )
  }}
/>
\`\`\`

### 멀티월 범위 선택 (offset 수동 제어)
\`\`\`tsx
const cal = useRangeCalendar({ visibleDuration: { months: 2 }, ... })
const month1 = useRangeCalendarMonth(cal.state, cal.locale)
const month2 = useRangeCalendarMonth(cal.state, cal.locale, { offset: { months: 1 } })
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CalendarDemo>

export default meta
type Story = StoryObj<typeof meta>

// ─── 재사용 Layout 헬퍼 ──────────────────────────────────────────────────────

function CalendarLayout({ cal, children }: { cal: UseCalendarResult; children?: React.ReactNode }) {
  const { weekDays, gridProps, weeks } = useCalendarMonth(cal.state, cal.locale)
  return (
    <>
      <Calendar.Header>
        <Calendar.Heading />
        <div className="flex items-center gap-afds-spacing-10">
          <Calendar.PreviousButton />
          <Calendar.NextButton />
        </div>
      </Calendar.Header>
      <Calendar.Month>
        <Calendar.Weekdays weekDays={weekDays} />
        <Calendar.Days gridProps={gridProps} weeks={weeks} />
      </Calendar.Month>
      {children}
    </>
  )
}

function RangeCalendarLayout({
  cal,
  children,
}: {
  cal: UseRangeCalendarResult
  children?: React.ReactNode
}) {
  const { weekDays, gridProps, weeks, startDate } = useRangeCalendarMonth(cal.state, cal.locale)
  return (
    <>
      <RangeCalendar.Header>
        <RangeCalendar.Heading />
        <div className="flex items-center gap-afds-spacing-10">
          <RangeCalendar.PreviousButton />
          <RangeCalendar.NextButton />
        </div>
      </RangeCalendar.Header>
      <RangeCalendar.Month>
        <RangeCalendar.Weekdays weekDays={weekDays} />
        <RangeCalendar.Days gridProps={gridProps} weeks={weeks} startDate={startDate} />
      </RangeCalendar.Month>
      {children}
    </>
  )
}

// ─── Stories ─────────────────────────────────────────────────────────────────

export const Default: Story = {
  render: function DefaultStory() {
    const cal = useCalendar({ defaultFocusedDate: fixedToday() })
    return (
      <Calendar cal={cal}>
        <CalendarLayout cal={cal} />
      </Calendar>
    )
  },
}

/** 초기값만 전달하고 이후 내부 상태 자율 관리 */
export const Uncontrolled: Story = {
  render: function UncontrolledStory() {
    const cal = useCalendar({ defaultDate: fixedToday(), locale: 'ko-KR' })
    return (
      <Calendar cal={cal}>
        <CalendarLayout cal={cal} />
      </Calendar>
    )
  },
}

/** 외부 state로 선택 날짜를 제어 */
export const Controlled: Story = {
  render: function ControlledStory() {
    const [date, setDate] = React.useState<Date | undefined>()
    const cal = useCalendar({
      defaultFocusedDate: fixedToday(),
      value: date,
      onValueChange: setDate,
      locale: 'ko-KR',
    })
    return (
      <div className="flex flex-col items-center gap-afds-spacing-10">
        <Calendar cal={cal}>
          <CalendarLayout cal={cal} />
        </Calendar>
        <span className="text-afds-text-secondary body3">
          선택: {date?.toLocaleDateString('ko-KR') ?? '없음'}
        </span>
      </div>
    )
  },
}

/** 단일 날짜 선택 (controlled) */
export const Single: Story = {
  render: function SingleStory() {
    const [date, setDate] = React.useState<Date | undefined>(fixedToday())
    const cal = useCalendar({
      defaultFocusedDate: fixedToday(),
      value: date,
      onValueChange: setDate,
      locale: 'ko-KR',
    })
    return (
      <div className="flex flex-col items-center gap-afds-spacing-10">
        <Calendar cal={cal}>
          <CalendarLayout cal={cal} />
        </Calendar>
        <span className="text-afds-text-secondary body3">
          선택: {date?.toLocaleDateString('ko-KR') ?? '없음'}
        </span>
      </div>
    )
  },
}

/** 범위 선택 */
export const Range: Story = {
  render: function RangeStory() {
    const [range, setRange] = React.useState<DateRange | undefined>()
    const cal = useRangeCalendar({
      defaultFocusedDate: fixedToday(),
      value: range,
      onValueChange: setRange,
      locale: 'ko-KR',
    })
    return (
      <div className="flex flex-col items-center gap-afds-spacing-10">
        <RangeCalendar cal={cal}>
          <RangeCalendarLayout cal={cal} />
        </RangeCalendar>
        <span className="text-afds-text-secondary body3">
          {range?.start ? `시작: ${range.start.toLocaleDateString('ko-KR')}` : '시작일 선택'}
          {range?.end ? ` ~ 종료: ${range.end.toLocaleDateString('ko-KR')}` : ''}
        </span>
      </div>
    )
  },
}

/** 여러 달을 좌우로 나란히 배치한 범위 선택 */
export const RangeMultiMonth: Story = {
  render: function RangeMultiMonthStory() {
    const [range, setRange] = React.useState<DateRange | undefined>()
    const cal = useRangeCalendar({
      defaultFocusedDate: fixedToday(),
      value: range,
      onValueChange: setRange,
      locale: 'ko-KR',
      visibleDuration: { months: 2 },
    })
    const month1 = useRangeCalendarMonth(cal.state, cal.locale)
    const month2 = useRangeCalendarMonth(cal.state, cal.locale, { offset: { months: 1 } })
    return (
      <div className="flex flex-col items-center gap-afds-spacing-10">
        <RangeCalendar cal={cal}>
          <div className="flex gap-afds-spacing-24">
            <div className="flex flex-col">
              <RangeCalendar.Header>
                <RangeCalendar.PreviousButton />
                <RangeCalendar.Heading />
                <span className="w-6" />
              </RangeCalendar.Header>
              <RangeCalendar.Month>
                <RangeCalendar.Weekdays weekDays={month1.weekDays} />
                <RangeCalendar.Days
                  gridProps={month1.gridProps}
                  weeks={month1.weeks}
                  startDate={month1.startDate}
                  render={(date: CalendarDate) => <RangeCalendar.Day date={date} />}
                />
              </RangeCalendar.Month>
            </div>
            <div className="flex flex-col">
              <RangeCalendar.Header>
                <span className="w-6" />
                <RangeCalendar.Heading offset={{ months: 1 }} />
                <RangeCalendar.NextButton />
              </RangeCalendar.Header>
              <RangeCalendar.Month>
                <RangeCalendar.Weekdays weekDays={month2.weekDays} />
                <RangeCalendar.Days
                  gridProps={month2.gridProps}
                  weeks={month2.weeks}
                  startDate={month2.startDate}
                  render={(date: CalendarDate) => <RangeCalendar.Day date={date} />}
                />
              </RangeCalendar.Month>
            </div>
          </div>
        </RangeCalendar>
        <span className="text-afds-text-secondary body3">
          {range?.start ? `시작: ${range.start.toLocaleDateString('ko-KR')}` : '시작일 선택'}
          {range?.end ? ` ~ 종료: ${range.end.toLocaleDateString('ko-KR')}` : ''}
        </span>
      </div>
    )
  },
}

/** 미래 날짜를 비활성화한 캘린더 */
export const Disabled: Story = {
  render: function DisabledStory() {
    const todayDate = fixedToday()
    todayDate.setHours(0, 0, 0, 0)
    const [date, setDate] = React.useState<Date | undefined>()
    const cal = useCalendar({
      defaultFocusedDate: fixedToday(),
      value: date,
      onValueChange: setDate,
      isDateUnavailable: d => d > todayDate,
    })
    return (
      <Calendar cal={cal}>
        <CalendarLayout cal={cal} />
      </Calendar>
    )
  },
}

/** isDateUnavailable로 선택 가능한 날짜 범위를 제한 */
export const MinMax: Story = {
  render: function MinMaxStory() {
    const today = fixedToday()
    const minDate = new Date(today.getFullYear(), today.getMonth(), 1)
    const maxDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    const [date, setDate] = React.useState<Date | undefined>()
    const cal = useCalendar({
      defaultFocusedDate: fixedToday(),
      value: date,
      onValueChange: setDate,
      isDateUnavailable: d => d < minDate || d > maxDate,
    })
    return (
      <Calendar cal={cal}>
        <CalendarLayout cal={cal} />
      </Calendar>
    )
  },
}

/** 이벤트 있는 날 셀에 도트 표시, 호버 시 이벤트 목록 툴팁 */
export const TooltipOnCell: Story = {
  render: function TooltipOnCellStory() {
    const [date, setDate] = React.useState<Date | undefined>()
    const cal = useCalendar({
      defaultFocusedDate: fixedToday(),
      value: date,
      onValueChange: setDate,
    })
    const { weekDays, gridProps, weeks } = useCalendarMonth(cal.state, cal.locale)
    const today = fixedToday()
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
    const events: Record<string, string[]> = {
      [fmt(today)]: ['주간 회의', '디자인 리뷰'],
      [fmt(addDays(today, 3))]: ['배포'],
      [fmt(addDays(today, 7))]: ['스프린트 종료', '회고', '플래닝'],
    }

    return (
      <Tooltip.Provider delay={200}>
        <Calendar cal={cal}>
          <Calendar.Header>
            <Calendar.Heading />
            <div className="flex items-center gap-afds-spacing-10">
              <Calendar.PreviousButton />
              <Calendar.NextButton />
            </div>
          </Calendar.Header>
          <Calendar.Month>
            <Calendar.Weekdays weekDays={weekDays} />
            <Calendar.Days
              gridProps={gridProps}
              weeks={weeks}
              render={(d: CalendarDate) => {
                const key = `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`
                const list = events[key]
                if (!list) return <Calendar.Day date={d} />
                return (
                  <div className="relative">
                    <Calendar.Day date={d} />
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute bottom-[3px] left-1/2 h-1 w-1 -translate-x-1/2 rounded-afds-pill bg-afds-bg-brand"
                    />
                    <Tooltip.Root>
                      <Tooltip.Trigger render={<span className="absolute inset-0" />} />
                      <Tooltip.Portal>
                        <Tooltip.Positioner sideOffset={6}>
                          <Tooltip.Popup>
                            <ul className="flex flex-col gap-afds-spacing-4">
                              {list.map((e, i) => (
                                <li key={i}>{e}</li>
                              ))}
                            </ul>
                            <Tooltip.Arrow />
                          </Tooltip.Popup>
                        </Tooltip.Positioner>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  </div>
                )
              }}
            />
          </Calendar.Month>
        </Calendar>
      </Tooltip.Provider>
    )
  },
}

/** Disabled 셀 호버 시 사유를 툴팁으로 표시 */
export const DisabledReasonTooltip: Story = {
  render: function DisabledReasonTooltipStory() {
    const [date, setDate] = React.useState<Date | undefined>()
    const cal = useCalendar({
      defaultFocusedDate: fixedToday(),
      value: date,
      onValueChange: setDate,
      isDateUnavailable: d => d.getDay() === 0 || d.getDay() === 6,
    })
    const { weekDays, gridProps, weeks } = useCalendarMonth(cal.state, cal.locale)
    const isWeekend = (d: CalendarDate) => {
      const day = new Date(d.year, d.month - 1, d.day).getDay()
      return day === 0 || day === 6
    }
    return (
      <Tooltip.Provider delay={150}>
        <Calendar cal={cal}>
          <Calendar.Header>
            <Calendar.Heading />
            <div className="flex items-center gap-afds-spacing-10">
              <Calendar.PreviousButton />
              <Calendar.NextButton />
            </div>
          </Calendar.Header>
          <Calendar.Month>
            <Calendar.Weekdays weekDays={weekDays} />
            <Calendar.Days
              gridProps={gridProps}
              weeks={weeks}
              render={(d: CalendarDate) => {
                if (!isWeekend(d)) return <Calendar.Day date={d} />
                return (
                  <Tooltip.Root>
                    <Tooltip.Trigger render={<Calendar.Day date={d} />} />
                    <Tooltip.Portal>
                      <Tooltip.Positioner sideOffset={6}>
                        <Tooltip.Popup>
                          주말은 선택 불가
                          <Tooltip.Arrow />
                        </Tooltip.Popup>
                      </Tooltip.Positioner>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                )
              }}
            />
          </Calendar.Month>
        </Calendar>
      </Tooltip.Provider>
    )
  },
}

/** Cell을 카드 레이아웃으로 완전 교체 */
export const CardCell: Story = {
  render: function CardCellStory() {
    const [date, setDate] = React.useState<Date | undefined>()
    const cal = useCalendar({
      defaultFocusedDate: fixedToday(),
      value: date,
      onValueChange: setDate,
    })
    const { weekDays, gridProps, weeks } = useCalendarMonth(cal.state, cal.locale)
    const today = fixedToday()
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
    const counts: Record<string, number> = {
      [fmt(today)]: 3,
      [fmt(addDays(today, 2))]: 1,
      [fmt(addDays(today, 5))]: 5,
    }

    return (
      <Calendar cal={cal}>
        <Calendar.Header>
          <Calendar.Heading />
          <div className="flex items-center gap-afds-spacing-10">
            <Calendar.PreviousButton />
            <Calendar.NextButton />
          </div>
        </Calendar.Header>
        <Calendar.Month>
          <Calendar.Weekdays weekDays={weekDays} />
          <Calendar.Days
            gridProps={gridProps}
            weeks={weeks}
            render={(d: CalendarDate) => {
              const key = `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`
              const count = counts[key]
              return (
                <Calendar.Day
                  date={d}
                  className="!h-auto"
                  render={state => (
                    <div
                      className={[
                        'flex min-h-[52px] w-full flex-col gap-afds-spacing-2 rounded-afds-sm border p-afds-4 text-left transition-colors',
                        state.isSelected
                          ? 'border-afds-border-focus bg-afds-bg-brand-subtle'
                          : state.isToday
                            ? 'border-afds-border-focus'
                            : 'border-afds-border-default',
                        (state.isDisabled || state.isUnavailable) && 'opacity-40',
                        state.isOutsideMonth && 'opacity-20',
                      ].join(' ')}
                    >
                      <span className="title3 text-afds-text-primary">{state.formattedDate}</span>
                      {count && !state.isDisabled && !state.isUnavailable && (
                        <span className="body3 text-afds-text-brand">{count}건</span>
                      )}
                    </div>
                  )}
                />
              )
            }}
          />
        </Calendar.Month>
      </Calendar>
    )
  },
}

/** 헤드리스 훅 직접 사용 — 외부 state 공유가 필요한 경우 */
export const HeadlessMode: Story = {
  render: function HeadlessModeStory() {
    const [date, setDate] = React.useState<Date | undefined>(fixedToday())
    const cal = useCalendar({
      defaultFocusedDate: fixedToday(),
      value: date,
      onValueChange: setDate,
      locale: 'ko-KR',
    })
    const { weekDays, gridProps, weeks } = useCalendarMonth(cal.state, cal.locale)

    return (
      <div className="flex flex-col items-center gap-afds-spacing-10">
        <Calendar cal={cal}>
          <Calendar.Header>
            <Calendar.Heading />
            <div className="flex items-center gap-afds-spacing-10">
              <Calendar.PreviousButton />
              <Calendar.NextButton />
            </div>
          </Calendar.Header>
          <Calendar.Month>
            <Calendar.Weekdays weekDays={weekDays} />
            <Calendar.Days
              gridProps={gridProps}
              weeks={weeks}
              render={(d: CalendarDate) => <Calendar.Day state={cal.state} date={d} />}
            />
          </Calendar.Month>
        </Calendar>
        <span className="text-afds-text-secondary body3">
          선택: {date?.toLocaleDateString('ko-KR') ?? '없음'}
        </span>
      </div>
    )
  },
}

/**
 * 단일 캘린더의 폼 제출 예제.
 * `name` prop 지정 시 선택값이 `YYYY-MM-DD` 형식으로 hidden input에 동기화된다.
 */
export const FormSubmissionSingle: Story = {
  parameters: { controls: { disable: true } },
  render: function FormSingleStory() {
    const [submitted, setSubmitted] = React.useState<Record<string, FormDataEntryValue> | null>(
      null,
    )
    const cal = useCalendar({ defaultFocusedDate: fixedToday(), locale: 'ko-KR' })
    return (
      <form
        className="flex flex-col items-start gap-afds-spacing-12"
        onSubmit={e => {
          e.preventDefault()
          setSubmitted(Object.fromEntries(new FormData(e.currentTarget)))
        }}
      >
        <Calendar cal={cal} name="date">
          <CalendarLayout cal={cal} />
        </Calendar>
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

/**
 * 범위 캘린더의 폼 제출 예제.
 * `startName` / `endName` 두 prop으로 시작일·종료일 필드명을 각각 지정한다.
 */
export const FormSubmissionRange: Story = {
  parameters: { controls: { disable: true } },
  render: function FormRangeStory() {
    const [submitted, setSubmitted] = React.useState<Record<string, FormDataEntryValue> | null>(
      null,
    )
    const cal = useRangeCalendar({ defaultFocusedDate: fixedToday(), locale: 'ko-KR' })
    return (
      <form
        className="flex flex-col items-start gap-afds-spacing-12"
        onSubmit={e => {
          e.preventDefault()
          setSubmitted(Object.fromEntries(new FormData(e.currentTarget)))
        }}
      >
        <RangeCalendar cal={cal} startName="checkIn" endName="checkOut">
          <RangeCalendarLayout cal={cal} />
        </RangeCalendar>
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

/** 헤드리스 훅 직접 사용 — 범위 멀티월 (offset 수동 제어) */
export const HeadlessRangeMultiMonth: Story = {
  render: function HeadlessRangeMultiMonthStory() {
    const [range, setRange] = React.useState<DateRange | undefined>()
    const cal = useRangeCalendar({
      defaultFocusedDate: fixedToday(),
      value: range,
      onValueChange: setRange,
      locale: 'ko-KR',
      visibleDuration: { months: 2 },
    })
    const currentMonth = useRangeCalendarMonth(cal.state, cal.locale)
    const nextMonth = useRangeCalendarMonth(cal.state, cal.locale, { offset: { months: 1 } })
    return (
      <div className="flex flex-col items-center gap-afds-spacing-10">
        <RangeCalendar cal={cal}>
          <div className="flex gap-afds-spacing-24">
            <div className="flex flex-col">
              <RangeCalendar.Header>
                <RangeCalendar.PreviousButton />
                <RangeCalendar.Heading />
                <span className="w-6" />
              </RangeCalendar.Header>
              <RangeCalendar.Month>
                <RangeCalendar.Weekdays weekDays={currentMonth.weekDays} />
                <RangeCalendar.Days
                  gridProps={currentMonth.gridProps}
                  weeks={currentMonth.weeks}
                  startDate={currentMonth.startDate}
                  render={(date: CalendarDate) => (
                    <RangeCalendar.Day
                      state={cal.state}
                      date={date}
                      currentMonthDate={currentMonth.startDate}
                    />
                  )}
                />
              </RangeCalendar.Month>
            </div>
            <div className="flex flex-col">
              <RangeCalendar.Header>
                <span className="w-6" />
                <RangeCalendar.Heading offset={{ months: 1 }} />
                <RangeCalendar.NextButton />
              </RangeCalendar.Header>
              <RangeCalendar.Month>
                <RangeCalendar.Weekdays weekDays={nextMonth.weekDays} />
                <RangeCalendar.Days
                  gridProps={nextMonth.gridProps}
                  weeks={nextMonth.weeks}
                  startDate={nextMonth.startDate}
                  render={(date: CalendarDate) => (
                    <RangeCalendar.Day
                      state={cal.state}
                      date={date}
                      currentMonthDate={nextMonth.startDate}
                    />
                  )}
                />
              </RangeCalendar.Month>
            </div>
          </div>
        </RangeCalendar>
        <span className="text-afds-text-secondary body3">
          {range?.start ? `시작: ${range.start.toLocaleDateString('ko-KR')}` : '시작일 선택'}
          {range?.end ? ` ~ 종료: ${range.end.toLocaleDateString('ko-KR')}` : ''}
        </span>
      </div>
    )
  },
}

/**
 * today 인디케이터의 **모양**만 따로 보여준다.
 *
 * 다른 스토리는 스냅샷 결정성을 위해 과거 달로 고정되어 있어 `isToday` 가 매칭되지 않는다.
 * 그 결과 인디케이터가 어떤 스토리에도 렌더되지 않아 시각 회귀 커버리지가 0이 되므로,
 * 여기서 요소를 직접 렌더해 그 구멍을 메운다.
 *
 * 올바른 셀에 붙는지(배치)는 `calendar-today.test.tsx` 가 결정적으로 검증한다 —
 * 그건 실행 날짜에 의존하므로 시각 회귀로 다룰 수 없다.
 */
export const TodayIndicatorAppearance: Story = {
  parameters: { controls: { disable: true } },
  render: function TodayIndicatorAppearanceStory() {
    return (
      <div className="flex items-center gap-afds-spacing-10">
        <span className="text-afds-text-secondary body3">Calendar.TodayIndicator</span>
        <span className="relative inline-flex h-afds-spacing-34 w-afds-spacing-34 items-center justify-center">
          15
          <Calendar.TodayIndicator />
        </span>
      </div>
    )
  },
}
