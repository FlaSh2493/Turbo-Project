import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import type { CalendarDate } from '@internationalized/date'
import { Calendar } from '../calendar'
import { useCalendar, useCalendarMonth } from '../../../../headless/calendar/use-calendar'

/**
 * today 인디케이터의 **동작** 커버리지.
 *
 * 스토리는 스냅샷 결정성을 위해 과거 달로 고정되어 있어 `isToday` 가 매칭되지 않는다.
 * 즉 "오늘 셀에 인디케이터가 붙는가" 는 시각 회귀로는 확인되지 않으므로 여기서 결정적으로 검증한다.
 * (인디케이터 자체의 **모양**은 `TodayIndicatorAppearance` 스토리가 Chromatic 으로 덮는다.)
 */
const FIXED_NOW = new Date(2026, 5, 17, 12, 0, 0) // 2026-06-17

const Harness = () => {
  const cal = useCalendar({ defaultFocusedDate: FIXED_NOW, locale: 'ko-KR' })
  const { weekDays, gridProps, weeks } = useCalendarMonth(cal.state, cal.locale)
  return (
    <Calendar cal={cal}>
      <Calendar.Month>
        <Calendar.Weekdays weekDays={weekDays} />
        <Calendar.Days
          gridProps={gridProps}
          weeks={weeks}
          render={(d: CalendarDate) => <Calendar.Day state={cal.state} date={d} />}
        />
      </Calendar.Month>
    </Calendar>
  )
}

describe('today 인디케이터', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(FIXED_NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('오늘에 해당하는 셀에만 today 표시가 붙는다', () => {
    render(<Harness />)

    const marked = Array.from(
      document.querySelectorAll('[data-slot="calendar-today-indicator"]'),
    ).map(el => el.closest('[data-slot="calendar-day"]'))

    expect(marked).toHaveLength(1)
    expect(marked[0]?.getAttribute('aria-label')).toContain('17')
  })

  it('시스템 날짜가 바뀌면 표시도 그 날짜로 옮겨간다', () => {
    vi.setSystemTime(new Date(2026, 5, 18, 12, 0, 0))
    render(<Harness />)

    const marked = Array.from(
      document.querySelectorAll('[data-slot="calendar-today-indicator"]'),
    ).map(el => el.closest('[data-slot="calendar-day"]'))

    expect(marked).toHaveLength(1)
    expect(marked[0]?.getAttribute('aria-label')).toContain('18')
  })

  it('보이는 달에 오늘이 없으면 아무 셀에도 붙지 않는다 (스토리 고정의 근거)', () => {
    vi.setSystemTime(new Date(2027, 0, 5, 12, 0, 0))
    render(<Harness />)

    const marked = Array.from(
      document.querySelectorAll('[data-slot="calendar-today-indicator"]'),
    ).map(el => el.closest('[data-slot="calendar-day"]'))

    expect(marked).toHaveLength(0)
  })
})
