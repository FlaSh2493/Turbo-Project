'use client'

import {
  createCalendar,
  endOfMonth,
  getWeeksInMonth,
  today,
  getLocalTimeZone,
  CalendarDate,
  type DateValue,
  type DateDuration,
} from '@internationalized/date'
import { useRef, type RefObject } from 'react'
import { useRangeCalendarState, type RangeCalendarState } from 'react-stately'
import {
  useRangeCalendar as useAriaRangeCalendar,
  useCalendarGrid as useAriaCalendarGrid,
  useCalendarCell as useAriaCalendarCell,
  type AriaRangeCalendarProps,
  type RangeValue,
} from 'react-aria'
const toCalendarDate = (d: Date) => new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate())
const fromCalendarDate = (cd: CalendarDate): Date => new Date(cd.year, cd.month - 1, cd.day)
const isFirstDayOfMonth = (date: CalendarDate) => date.day === 1
const isLastDayOfMonth = (date: CalendarDate) => date.day === endOfMonth(date).day

export interface DateRange {
  start?: Date
  end?: Date
}

export interface UseRangeCalendarOptions {
  value?: DateRange
  onValueChange?: (range: DateRange | undefined) => void
  isDateUnavailable?: (date: Date) => boolean
  defaultRange?: DateRange
  /**
   * 선택하지 않고 **표시할 달만** 고정한다 (react-aria `defaultFocusedValue`).
   *
   * `defaultRange` 는 범위를 *선택*하므로 "기본 상태" 를 보여주려는 곳에서는 쓸 수 없다.
   *
   * **우선순위**: `value`/`defaultRange` 와 함께 주면 **표시 월은 이 값이 이긴다**(실측: 둘 다
   * 준 상태에서 heading 이 `defaultFocusedDate` 의 달로 렌더). 선택 값 자체는 바뀌지 않지만,
   * 가리키는 달이 서로 다르면 선택된 날짜가 첫 렌더에서 화면에 보이지 않는다.
   */
  defaultFocusedDate?: Date
  locale?: string
  visibleDuration?: DateDuration
}

/** @deprecated use UseRangeCalendarOptions */
export type RangeCalendarProps = UseRangeCalendarOptions

export interface RangeCalendarCellState {
  isSelected: boolean
  isRangeStart: boolean
  isRangeEnd: boolean
  isRangeMiddle: boolean
  isToday: boolean
  isDisabled: boolean
  isUnavailable: boolean
  isFocused: boolean
  isOutsideMonth: boolean
  isWeekend: boolean
  formattedDate: string
  date: CalendarDate
}

export type RangePos = 'none' | 'start' | 'end' | 'middle' | 'single'
export type WeekBoundary = 'none' | 'startWeek' | 'endWeek' | 'both'

export interface UseRangeCalendarResult {
  state: RangeCalendarState
  rootProps: ReturnType<typeof useAriaRangeCalendar>['calendarProps']
  ref: RefObject<HTMLDivElement>
  locale: string
  ariaProps: AriaRangeCalendarProps<DateValue>
}

export function useRangeCalendar(options: UseRangeCalendarOptions): UseRangeCalendarResult {
  const {
    value,
    onValueChange,
    isDateUnavailable,
    defaultRange,
    defaultFocusedDate,
    locale = 'en-US',
    visibleDuration,
  } = options

  const toRangeValue = (r: DateRange | undefined): RangeValue<DateValue> | undefined => {
    if (!r?.start && !r?.end) return undefined
    const start = r?.start ? toCalendarDate(r.start) : null
    const end = r?.end ? toCalendarDate(r.end) : null
    if (!start || !end) return undefined
    return { start, end }
  }

  const ariaProps: AriaRangeCalendarProps<DateValue> = {
    value: toRangeValue(value),
    defaultValue: toRangeValue(defaultRange),
    defaultFocusedValue: defaultFocusedDate ? toCalendarDate(defaultFocusedDate) : undefined,
    isDateUnavailable: isDateUnavailable
      ? (d: DateValue) => isDateUnavailable(fromCalendarDate(d as CalendarDate))
      : undefined,
    onChange: (range: RangeValue<DateValue> | null) => {
      if (!range) {
        onValueChange?.(undefined)
        return
      }
      onValueChange?.({
        start: range.start ? fromCalendarDate(range.start as CalendarDate) : undefined,
        end: range.end ? fromCalendarDate(range.end as CalendarDate) : undefined,
      })
    },
  }

  const state = useRangeCalendarState({ ...ariaProps, locale, createCalendar, visibleDuration })
  const ref = useRef<HTMLDivElement>(null)
  const { calendarProps: rootProps } = useAriaRangeCalendar(ariaProps, state, ref)

  return { state, rootProps, ref, locale, ariaProps }
}

// ─── Slot hooks ──────────────────────────────────────────────────────────────

export interface UseRangeCalendarMonthOptions {
  offset?: DateDuration
}

export interface UseRangeCalendarMonthResult {
  gridProps: ReturnType<typeof useAriaCalendarGrid>['gridProps']
  weekDays: string[]
  weeks: Array<Array<CalendarDate | null>>
  startDate: CalendarDate
}

export function getRangeCalendarTitle(
  state: RangeCalendarState,
  locale: string,
  opts: UseRangeCalendarMonthOptions = {},
): string {
  const baseStart = state.visibleRange.start
  const start = opts.offset ? baseStart.add(opts.offset) : baseStart
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long' }).format(
    new Date(start.year, start.month - 1, start.day),
  )
}

export function useRangeCalendarMonth(
  state: RangeCalendarState,
  locale: string,
  opts: UseRangeCalendarMonthOptions = {},
): UseRangeCalendarMonthResult {
  const baseStart = state.visibleRange.start
  const startDate = (opts.offset ? baseStart.add(opts.offset) : baseStart) as CalendarDate
  const endDate = endOfMonth(startDate)

  const { gridProps, weekDays } = useAriaCalendarGrid(
    { weekdayStyle: 'short', startDate, endDate },
    state as any,
  )

  const weeksInMonth = getWeeksInMonth(startDate, locale)
  const weeks = Array.from(
    { length: weeksInMonth },
    (_, weekIndex) => state.getDatesInWeek(weekIndex, startDate) as Array<CalendarDate | null>,
  )

  return { gridProps, weekDays, weeks, startDate }
}

export interface UseRangeCalendarCellResult {
  buttonProps: ReturnType<typeof useAriaCalendarCell>['buttonProps']
  ref: RefObject<HTMLButtonElement>
  cellState: RangeCalendarCellState
  dataAttrs: Record<string, string | boolean>
  rangePos: RangePos
  weekBoundary: WeekBoundary
}

export function useRangeCalendarCell(
  state: RangeCalendarState,
  date: CalendarDate,
  currentMonthDate?: CalendarDate | null,
): UseRangeCalendarCellResult {
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
  const nativeDate = date.toDate(tz)
  const dayOfWeek = nativeDate.getDay()
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
  const isStartWeekDay = dayOfWeek === 0 || isFirstDayOfMonth(date)
  const isEndWeekDay = dayOfWeek === 6 || isLastDayOfMonth(date)

  const highlightedRange = state.highlightedRange
  const isRangeStart = !!(
    isSelected &&
    highlightedRange &&
    date.compare(highlightedRange.start) === 0
  )
  const isRangeEnd = !!(isSelected && highlightedRange && date.compare(highlightedRange.end) === 0)
  const isRangeMiddle = isSelected && !isRangeStart && !isRangeEnd

  let rangePos: RangePos = 'none'
  if (isRangeStart && isRangeEnd) rangePos = 'single'
  else if (isRangeStart) rangePos = 'start'
  else if (isRangeEnd) rangePos = 'end'
  else if (isRangeMiddle) rangePos = 'middle'

  let weekBoundary: WeekBoundary = 'none'
  if (isStartWeekDay && isEndWeekDay) weekBoundary = 'both'
  else if (isStartWeekDay) weekBoundary = 'startWeek'
  else if (isEndWeekDay) weekBoundary = 'endWeek'

  const isOutsideMonth = currentMonthDate
    ? date.month !== currentMonthDate.month || date.year !== currentMonthDate.year
    : isOutsideVisibleRange

  const cellState: RangeCalendarCellState = {
    isSelected,
    isRangeStart,
    isRangeEnd,
    isRangeMiddle,
    isToday,
    isDisabled,
    isUnavailable,
    isFocused,
    isOutsideMonth,
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
    'data-outside-month': isOutsideMonth,
    'data-weekend': isWeekend,
    'data-range-selection': true,
    'data-range-start': isRangeStart,
    'data-range-end': isRangeEnd,
    'data-range-middle': isRangeMiddle,
  }

  return { buttonProps, ref, cellState, dataAttrs, rangePos, weekBoundary }
}
