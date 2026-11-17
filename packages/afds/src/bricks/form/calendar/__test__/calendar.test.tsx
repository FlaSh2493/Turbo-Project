import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useState } from 'react'
import type { CalendarDate } from '@internationalized/date'
import { Calendar } from '../calendar'
import { RangeCalendar } from '../range-calendar'
import {
  useCalendar,
  getCalendarTitle,
  useCalendarMonth,
} from '../../../../headless/calendar/use-calendar'
import {
  useRangeCalendar,
  useRangeCalendarMonth,
} from '../../../../headless/calendar/use-range-calendar'
import type { UseCalendarOptions } from '../../../../headless/calendar/use-calendar'
import type { UseRangeCalendarOptions } from '../../../../headless/calendar/use-range-calendar'

// ─── Test helpers ────────────────────────────────────────────────────────────

function TestCalendar(props: UseCalendarOptions = {}) {
  const cal = useCalendar(props)
  const { weekDays, gridProps, weeks } = useCalendarMonth(cal.state, cal.locale)
  return (
    <Calendar cal={cal}>
      <Calendar.Header>
        <Calendar.PreviousButton data-slot="calendar-previous-button" />
        <Calendar.Heading title={getCalendarTitle(cal.state, cal.locale)} />
        <Calendar.NextButton data-slot="calendar-next-button" />
      </Calendar.Header>
      <Calendar.Month>
        <Calendar.Weekdays weekDays={weekDays} />
        <Calendar.Days
          gridProps={gridProps}
          weeks={weeks}
          render={(date: CalendarDate) => <Calendar.Day state={cal.state} date={date} />}
        />
      </Calendar.Month>
    </Calendar>
  )
}

function renderCalendar(props: UseCalendarOptions = {}) {
  return render(<TestCalendar {...props} />)
}

function TestRangeCalendar(props: UseRangeCalendarOptions = {}) {
  const cal = useRangeCalendar(props)
  const { weekDays, gridProps, weeks, startDate } = useRangeCalendarMonth(cal.state, cal.locale)
  return (
    <RangeCalendar cal={cal}>
      <RangeCalendar.Header>
        <RangeCalendar.PreviousButton />
        <RangeCalendar.Heading />
        <RangeCalendar.NextButton />
      </RangeCalendar.Header>
      <RangeCalendar.Month>
        <RangeCalendar.Weekdays weekDays={weekDays} />
        <RangeCalendar.Days
          gridProps={gridProps}
          weeks={weeks}
          startDate={startDate}
          render={(date: CalendarDate) => (
            <RangeCalendar.Day state={cal.state} date={date} currentMonthDate={startDate} />
          )}
        />
      </RangeCalendar.Month>
    </RangeCalendar>
  )
}

function renderRange(props: UseRangeCalendarOptions = {}) {
  return render(<TestRangeCalendar {...props} />)
}

describe('Calendar', () => {
  describe('렌더링', () => {
    it('data-slot="calendar" 컨테이너를 렌더링한다', () => {
      renderCalendar()
      expect(document.querySelector('[data-slot="calendar"]')).toBeInTheDocument()
    })

    it('요일 헤더를 렌더링한다', () => {
      renderCalendar()
      const headers = screen.getAllByRole('columnheader')
      expect(headers.length).toBeGreaterThan(0)
    })

    it('날짜 셀 버튼을 렌더링한다', () => {
      renderCalendar()
      const cells = document.querySelectorAll('[data-slot="calendar-day"]')
      expect(cells.length).toBeGreaterThan(0)
    })

    it('role="grid" 그리드를 렌더링한다', () => {
      renderCalendar()
      const grids = screen.getAllByRole('grid')
      expect(grids.length).toBeGreaterThanOrEqual(1)
    })

    it('Heading이 현재 월/년을 표시한다', () => {
      renderCalendar()
      const heading = document.querySelector('[data-slot="calendar-heading"]')
      expect(heading).toBeInTheDocument()
      expect(heading?.textContent).not.toBe('')
    })
  })

  describe('날짜 선택', () => {
    it('날짜 클릭 시 onValueChange가 Date를 전달하며 호출된다', () => {
      const handleChange = vi.fn()
      renderCalendar({ onValueChange: handleChange })

      const cells = document.querySelectorAll(
        '[data-slot="calendar-day"]:not([data-outside-month="true"])',
      )
      expect(cells.length).toBeGreaterThan(0)
      fireEvent.click(cells[0] as Element)
      expect(handleChange).toHaveBeenCalledWith(expect.any(Date))
    })
  })

  describe('네비게이션', () => {
    it('이전/다음 버튼이 렌더링된다', () => {
      renderCalendar()
      expect(document.querySelector('[data-slot="calendar-previous-button"]')).toBeInTheDocument()
      expect(document.querySelector('[data-slot="calendar-next-button"]')).toBeInTheDocument()
    })

    it('다음 버튼 클릭 시 월이 변경된다', () => {
      renderCalendar()
      const heading = document.querySelector('[data-slot="calendar-heading"]')
      const initialTitle = heading?.textContent

      const nextBtn = document.querySelector('[data-slot="calendar-next-button"]') as HTMLElement
      fireEvent.click(nextBtn)

      expect(heading?.textContent).not.toBe(initialTitle)
    })
  })

  describe('isDateUnavailable', () => {
    it('조건에 해당하는 날짜가 data-unavailable=true를 가진다', () => {
      const today = new Date()
      renderCalendar({ isDateUnavailable: (d: Date) => d > today })

      const unavailableCells = document.querySelectorAll('[data-unavailable="true"]')
      expect(unavailableCells.length).toBeGreaterThan(0)
    })
  })

  describe('접근성', () => {
    it('이전 버튼에 aria-label이 있다', () => {
      renderCalendar()
      const prev = document.querySelector('[data-slot="calendar-previous-button"]')
      expect(prev?.getAttribute('aria-label')).toBeTruthy()
    })

    it('다음 버튼에 aria-label이 있다', () => {
      renderCalendar()
      const next = document.querySelector('[data-slot="calendar-next-button"]')
      expect(next?.getAttribute('aria-label')).toBeTruthy()
    })
  })

  describe('외부 훅 주입 (cal prop)', () => {
    it('useCalendar로 만든 cal을 주입하면 정상 렌더링된다', () => {
      function ExternalStateCalendar() {
        const [date, setDate] = useState<Date | undefined>()
        const cal = useCalendar({ value: date, onValueChange: setDate })
        const { weekDays, gridProps, weeks } = useCalendarMonth(cal.state, cal.locale)
        return (
          <Calendar cal={cal}>
            <Calendar.Header>
              <Calendar.PreviousButton />
              <Calendar.Heading title={getCalendarTitle(cal.state, cal.locale)} />
              <Calendar.NextButton />
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
        )
      }
      render(<ExternalStateCalendar />)
      expect(document.querySelector('[data-slot="calendar"]')).toBeInTheDocument()
    })
  })
})

describe('RangeCalendar', () => {
  it('data-slot="range-calendar" 컨테이너를 렌더링한다', () => {
    renderRange()
    expect(document.querySelector('[data-slot="range-calendar"]')).toBeInTheDocument()
  })

  it('날짜 셀 버튼을 렌더링한다', () => {
    renderRange()
    const cells = document.querySelectorAll('[data-slot="range-calendar-day"]')
    expect(cells.length).toBeGreaterThan(0)
  })

  it('범위 선택 시 onValueChange가 DateRange를 전달하며 호출된다', () => {
    const handleChange = vi.fn()
    renderRange({ onValueChange: handleChange })

    const cells = document.querySelectorAll(
      '[data-slot="range-calendar-day"]:not([data-outside-month="true"])',
    )
    expect(cells.length).toBeGreaterThan(4)
    fireEvent.click(cells[0] as Element)
    fireEvent.click(cells[4] as Element)
    expect(handleChange).toHaveBeenCalled()
    const arg = handleChange.mock.calls[handleChange.mock.calls.length - 1][0]
    expect(arg).toHaveProperty('start')
    expect(arg).toHaveProperty('end')
  })
})
