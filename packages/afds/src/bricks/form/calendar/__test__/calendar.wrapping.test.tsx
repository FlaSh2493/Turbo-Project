import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { CalendarDate } from '@internationalized/date'
import { Calendar } from '../calendar'
import { RangeCalendar } from '../range-calendar'
import { useCalendar, useCalendarMonth } from '../../../../headless/calendar/use-calendar'
import {
  useRangeCalendar,
  useRangeCalendarMonth,
} from '../../../../headless/calendar/use-range-calendar'

function TestCalendar({
  dayProps = {},
  rootProps = {},
}: {
  dayProps?: Record<string, unknown>
  rootProps?: Record<string, unknown>
}) {
  const cal = useCalendar({})
  const { weekDays, gridProps, weeks } = useCalendarMonth(cal.state, cal.locale)
  return (
    <Calendar cal={cal} {...rootProps}>
      <Calendar.Month>
        <Calendar.Weekdays weekDays={weekDays} />
        <Calendar.Days
          gridProps={gridProps}
          weeks={weeks}
          render={(date: CalendarDate) => (
            <Calendar.Day state={cal.state} date={date} {...dayProps} />
          )}
        />
      </Calendar.Month>
    </Calendar>
  )
}

function TestRangeCalendar({ dayProps = {} }: { dayProps?: Record<string, unknown> }) {
  const cal = useRangeCalendar({})
  const { weekDays, gridProps, weeks, startDate } = useRangeCalendarMonth(cal.state, cal.locale)
  return (
    <RangeCalendar cal={cal}>
      <RangeCalendar.Month>
        <RangeCalendar.Weekdays weekDays={weekDays} />
        <RangeCalendar.Days
          gridProps={gridProps}
          weeks={weeks}
          startDate={startDate}
          render={(date: CalendarDate) => (
            <RangeCalendar.Day state={cal.state} date={date} {...dayProps} />
          )}
        />
      </RangeCalendar.Month>
    </RangeCalendar>
  )
}

const firstDay = () => screen.getAllByRole('button')[0]

describe('Calendar 래핑 계약', () => {
  describe('Calendar.Day — react-aria buttonProps 가 소비자 props 를 지우면 안 된다', () => {
    it('소비자 onFocus 가 호출된다', () => {
      const onFocus = vi.fn()
      render(<TestCalendar dayProps={{ onFocus }} />)

      fireEvent.focus(firstDay())

      expect(onFocus).toHaveBeenCalled()
    })

    it('소비자 onKeyDown 이 호출된다', () => {
      const onKeyDown = vi.fn()
      render(<TestCalendar dayProps={{ onKeyDown }} />)

      fireEvent.keyDown(firstDay(), { key: 'ArrowRight' })

      expect(onKeyDown).toHaveBeenCalled()
    })

    it('소비자 aria-label 이 react-aria 값을 이긴다', () => {
      render(<TestCalendar dayProps={{ 'aria-label': '소비자 라벨' }} />)

      expect(firstDay()).toHaveAttribute('aria-label', '소비자 라벨')
    })

    it('소비자가 aria-label 을 주지 않으면 react-aria 라벨이 유지된다', () => {
      render(<TestCalendar />)

      expect(firstDay().getAttribute('aria-label')).toBeTruthy()
    })
  })

  // cal.rootProps 는 이벤트 핸들러가 없고 id/role/aria-* 6개만 담는다
  // (실측: ["id","aria-label","aria-labelledby","role","aria-details","aria-describedby"]).
  // 따라서 Root 의 결함은 핸들러 유실이 아니라 이 값들의 조용한 유실이다.
  describe('Calendar.Root — cal.rootProps 가 소비자 props 를 지우면 안 된다', () => {
    it('소비자 id 가 react-aria 가 생성한 id 를 이긴다', () => {
      const { container } = render(<TestCalendar rootProps={{ id: 'my-calendar' }} />)

      expect(container.querySelector('[data-slot="calendar"]')).toHaveAttribute('id', 'my-calendar')
    })

    it('소비자 aria-label 이 react-aria 값을 이긴다', () => {
      const { container } = render(<TestCalendar rootProps={{ 'aria-label': '내 캘린더' }} />)

      expect(container.querySelector('[data-slot="calendar"]')).toHaveAttribute(
        'aria-label',
        '내 캘린더',
      )
    })
  })

  describe('data-slot 재라벨링과 react-aria 배선', () => {
    it('소비자 data-slot 재라벨링이 다른 브릭과 동일하게 동작한다', () => {
      render(<TestCalendar dayProps={{ 'data-slot': 'my-day' }} />)

      expect(document.querySelector('[data-slot="my-day"]')).not.toBeNull()
    })

    it('react-aria 배선(role·tabIndex·data-react-aria-*)은 소비자가 덮을 수 없다', () => {
      render(
        <TestCalendar
          dayProps={{ role: 'presentation', tabIndex: -99, 'data-react-aria-pressable': 'nope' }}
        />,
      )

      // role 이 날아가면 날짜 셀이 버튼이 아니게 되고 roving focus 도 깨진다.
      expect(screen.getAllByRole('button').length).toBeGreaterThan(0)
      expect(firstDay()).toHaveAttribute('data-react-aria-pressable', 'true')
    })

    it('react-aria 가 tabIndex 를 안 단 셀에도 소비자 tabIndex 가 새어들지 않는다', () => {
      render(<TestCalendar dayProps={{ tabIndex: -99 }} />)

      // react-aria 는 roving focus 때문에 **일부 셀에만** tabIndex 를 단다.
      // 내부 값이 없을 때 보호가 꺼지면 그 셀들만 -99 가 되어 포커스에서 빠진다.
      const tabIndexes = new Set(
        Array.from(document.querySelectorAll('[data-slot="calendar-day"]')).map(el =>
          el.getAttribute('tabindex'),
        ),
      )

      expect(tabIndexes.has('-99')).toBe(false)
    })

    it('Calendar.Root 도 재라벨링되고 role 은 보호된다', () => {
      const { container } = render(
        <TestCalendar rootProps={{ 'data-slot': 'my-cal', role: 'presentation' }} />,
      )

      expect(container.querySelector('[data-slot="my-cal"]')).not.toBeNull()
      expect(container.querySelector('[data-slot="my-cal"]')).toHaveAttribute('role', 'application')
    })
  })
})

describe('RangeCalendar 래핑 계약', () => {
  it('RangeCalendar.Day 의 소비자 onFocus 가 호출된다', () => {
    const onFocus = vi.fn()
    render(<TestRangeCalendar dayProps={{ onFocus }} />)

    fireEvent.focus(firstDay())

    expect(onFocus).toHaveBeenCalled()
  })

  it('RangeCalendar.Day 의 소비자 aria-label 이 react-aria 값을 이긴다', () => {
    render(<TestRangeCalendar dayProps={{ 'aria-label': '소비자 라벨' }} />)

    expect(firstDay()).toHaveAttribute('aria-label', '소비자 라벨')
  })
})
