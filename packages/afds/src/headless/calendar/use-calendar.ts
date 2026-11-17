'use client'

import {
  createCalendar,
  getWeeksInMonth,
  today,
  getLocalTimeZone,
  CalendarDate,
  type DateValue,
} from '@internationalized/date'
import { useRef, type RefObject } from 'react'
import { useCalendarState, type CalendarState } from 'react-stately'
import {
  useCalendar as useAriaCalendar,
  useCalendarGrid as useAriaCalendarGrid,
  useCalendarCell as useAriaCalendarCell,
  type AriaCalendarProps,
} from 'react-aria'

const toCalendarDate = (d: Date) => new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate())
const fromCalendarDate = (cd: CalendarDate): Date => new Date(cd.year, cd.month - 1, cd.day)

export interface UseCalendarOptions {
  value?: Date
  onValueChange?: (date: Date | undefined) => void
  isDateUnavailable?: (date: Date) => boolean
  defaultDate?: Date
  /**
   * 선택하지 않고 **표시할 달만** 고정한다 (react-aria `defaultFocusedValue`).
   *
   * `defaultDate` 는 값을 *선택*하므로 "기본 상태" 를 보여주려는 곳에서는 쓸 수 없다.
   * 스토리 스냅샷을 실행 날짜와 무관하게 만들 때처럼, 선택 상태는 그대로 두고
   * 보이는 달만 결정적으로 만들어야 할 때 쓴다.
   *
   * **우선순위**: `value`/`defaultDate` 와 함께 주면 **표시 월은 이 값이 이긴다**(실측: 둘 다
   * 준 상태에서 heading 이 `defaultFocusedDate` 의 달로 렌더). 선택 값 자체는 바뀌지 않지만,
   * 가리키는 달이 서로 다르면 선택된 날짜가 첫 렌더에서 화면에 보이지 않는다.
   */
  defaultFocusedDate?: Date
  locale?: string
}

/** @deprecated use UseCalendarOptions */
export type CalendarProps = UseCalendarOptions

export interface CalendarCellState {
  isSelected: boolean
  isToday: boolean
  isDisabled: boolean
  isUnavailable: boolean
  isFocused: boolean
  isOutsideMonth: boolean
  isWeekend: boolean
  formattedDate: string
  date: CalendarDate
}

export interface UseCalendarResult {
  state: CalendarState
  rootProps: ReturnType<typeof useAriaCalendar>['calendarProps']
  ref: RefObject<HTMLDivElement>
  locale: string
  ariaProps: AriaCalendarProps<DateValue>
}

export function useCalendar(options: UseCalendarOptions): UseCalendarResult {
  const {
    value,
    onValueChange,
    isDateUnavailable,
    defaultDate,
    defaultFocusedDate,
    locale = 'en-US',
  } = options

  const ariaProps: AriaCalendarProps<DateValue> = {
    value: value ? toCalendarDate(value) : undefined,
    defaultValue: defaultDate ? toCalendarDate(defaultDate) : undefined,
    defaultFocusedValue: defaultFocusedDate ? toCalendarDate(defaultFocusedDate) : undefined,
    isDateUnavailable: isDateUnavailable
      ? (d: DateValue) => isDateUnavailable(fromCalendarDate(d as CalendarDate))
      : undefined,
    onChange: (d: DateValue | null) => {
      onValueChange?.(d ? fromCalendarDate(d as CalendarDate) : undefined)
    },
  }

  const state = useCalendarState({ ...ariaProps, locale, createCalendar })
  const ref = useRef<HTMLDivElement>(null)
  const { calendarProps: rootProps } = useAriaCalendar(ariaProps, state)

  return { state, rootProps, ref, locale, ariaProps }
}

// ─── Slot hooks ──────────────────────────────────────────────────────────────

export function getCalendarTitle(state: CalendarState, locale: string): string {
  const start = state.visibleRange.start
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long' }).format(
    new Date(start.year, start.month - 1, start.day),
  )
}

export interface UseCalendarMonthResult {
  gridProps: ReturnType<typeof useAriaCalendarGrid>['gridProps']
  weekDays: string[]
  weeks: Array<Array<CalendarDate | null>>
}

export function useCalendarMonth(state: CalendarState, locale: string): UseCalendarMonthResult {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { gridProps, weekDays } = useAriaCalendarGrid({ weekdayStyle: 'short' }, state as any)
  const weeksInMonth = getWeeksInMonth(state.visibleRange.start, locale)
  const weeks = Array.from(
    { length: weeksInMonth },
    (_, weekIndex) => state.getDatesInWeek(weekIndex) as Array<CalendarDate | null>,
  )
  return { gridProps, weekDays, weeks }
}

export interface UseCalendarCellResult {
  buttonProps: ReturnType<typeof useAriaCalendarCell>['buttonProps']
  ref: RefObject<HTMLButtonElement>
  cellState: CalendarCellState
  dataAttrs: Record<string, string | boolean>
}

export function useCalendarCell(state: CalendarState, date: CalendarDate): UseCalendarCellResult {
  const ref = useRef<HTMLButtonElement>(null)

  const {
    buttonProps,
    isSelected,
    isDisabled,
    isUnavailable,
    isFocused,
    isOutsideVisibleRange,
    formattedDate,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useAriaCalendarCell({ date }, state as any, ref)

  const tz = getLocalTimeZone()
  const isToday = date.compare(today(tz)) === 0
  const dayOfWeek = date.toDate(tz).getDay()
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

  const cellState: CalendarCellState = {
    isSelected,
    isToday,
    isDisabled,
    isUnavailable,
    isFocused,
    isOutsideMonth: isOutsideVisibleRange,
    isWeekend,
    formattedDate,
    date,
  }

  const dataAttrs: Record<string, string | boolean> = {
    'data-selected': isSelected,
    'data-today': isToday,
    'data-disabled': isDisabled,
    'data-unavailable': isUnavailable,
    'data-focused': isFocused,
    'data-outside-month': isOutsideVisibleRange,
    'data-weekend': isWeekend,
    'data-range-selection': false,
  }

  return { buttonProps, ref, cellState, dataAttrs }
}
