'use client'

import type { CalendarDate } from '@internationalized/date'
import type { HTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'
import { forwardRef } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { mergeRefs } from '../../../lib/slot'
import { mergeProps } from '../../../lib/merge-props'
import {
  getCalendarTitle,
  useCalendarCell,
  type CalendarCellState,
  type UseCalendarResult,
  type UseCalendarMonthResult,
} from '../../../headless/calendar/use-calendar'
import type { CalendarState } from 'react-stately'
import {
  calendarRootVariants,
  calendarHeaderVariants,
  calendarHeadingVariants,
  calendarNavButtonVariants,
  calendarGridVariants,
  calendarGridBodyVariants,
  calendarGridHeaderRowVariants,
  calendarGridHeaderCellVariants,
  calendarCellButtonVariants,
  calendarCellWrapperVariants,
  calendarCellContentVariants,
  calendarTodayIndicatorVariants,
} from './calendar.style'
import { CalendarContext, useCalendarCtx } from '../../../headless/calendar/calendar.context'

/** react-aria 가 날짜 셀에 심는 동작·접근성 배선. 소비자가 덮으면 위젯이 망가진다. */
const ARIA_WIRING_KEYS = ['role', 'tabIndex', 'data-react-aria-pressable'] as const

/**
 * root 의 배선. `role="application"` 이 사라지면 캘린더 그룹 시맨틱이 사라진다.
 * `aria-label`·`id` 는 소비자가 덮는 것이 정당하므로 넣지 않는다.
 */
const ROOT_WIRING_KEYS = ['role'] as const

export type { CalendarCellState }

// ─── Root ──────────────────────────────────────────────────────────────────────

export interface CalendarRootProps
  extends
    HTMLAttributes<HTMLDivElement>,
    Pick<InputHTMLAttributes<HTMLInputElement>, 'name' | 'required' | 'disabled'> {
  cal: UseCalendarResult
}

const formatCalendarDate = (d: CalendarDate | null | undefined): string =>
  d ? `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}` : ''

const CalendarRoot = forwardRef<HTMLDivElement, CalendarRootProps>(
  ({ cal, name, required, disabled, className, children, ...props }, ref) => {
    return (
      <CalendarContext.Provider value={{ state: cal.state, locale: cal.locale }}>
        <div
          data-slot="calendar"
          data-value={formatCalendarDate(cal.state.value)}
          {...mergeProps(cal.rootProps, props, { internalWins: ROOT_WIRING_KEYS })}
          ref={mergeRefs(cal.ref, ref)}
          className={cn(calendarRootVariants(), className)}
        >
          {children}
          {name && (
            <input
              aria-hidden
              tabIndex={-1}
              name={name}
              value={formatCalendarDate(cal.state.value)}
              required={required}
              disabled={disabled}
              onChange={() => {}}
              className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
            />
          )}
        </div>
      </CalendarContext.Provider>
    )
  },
)

CalendarRoot.displayName = 'Calendar'

// ─── Header ────────────────────────────────────────────────────────────────────

const CalendarHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="calendar-header"
      className={cn(calendarHeaderVariants(), className)}
      {...props}
    >
      {children}
    </div>
  ),
)

CalendarHeader.displayName = 'Calendar.Header'

// ─── Heading ───────────────────────────────────────────────────────────────────

export interface CalendarHeadingProps extends Omit<HTMLAttributes<HTMLHeadingElement>, 'children'> {
  title?: string
  children?: ReactNode
}

const CalendarHeading = forwardRef<HTMLHeadingElement, CalendarHeadingProps>(
  ({ title: titleProp, className, children, ...props }, ref) => {
    const { state, locale } = useCalendarCtx()
    const title = titleProp ?? getCalendarTitle(state, locale)

    return (
      <h2
        ref={ref}
        data-slot="calendar-heading"
        className={cn(calendarHeadingVariants(), className)}
        {...props}
      >
        {children ?? title}
      </h2>
    )
  },
)

CalendarHeading.displayName = 'Calendar.Heading'

// ─── PreviousButton ────────────────────────────────────────────────────────────

const CalendarPreviousButton = forwardRef<
  HTMLButtonElement,
  HTMLAttributes<HTMLButtonElement> & { disabled?: boolean }
>(({ className, children, disabled: disabledProp, onClick: onClickProp, ...props }, ref) => {
  const { state } = useCalendarCtx()

  return (
    <button
      ref={ref}
      type="button"
      data-slot="calendar-previous-button"
      aria-label="Previous month"
      className={cn(calendarNavButtonVariants(), className)}
      disabled={disabledProp ?? state.isPreviousVisibleRangeInvalid()}
      onClick={onClickProp ?? (() => state.focusPreviousPage())}
      {...props}
    >
      {children ?? <ChevronLeftIcon width={16} height={16} />}
    </button>
  )
})

CalendarPreviousButton.displayName = 'Calendar.PreviousButton'

// ─── NextButton ────────────────────────────────────────────────────────────────

const CalendarNextButton = forwardRef<
  HTMLButtonElement,
  HTMLAttributes<HTMLButtonElement> & { disabled?: boolean }
>(({ className, children, disabled: disabledProp, onClick: onClickProp, ...props }, ref) => {
  const { state } = useCalendarCtx()

  return (
    <button
      ref={ref}
      type="button"
      data-slot="calendar-next-button"
      aria-label="Next month"
      className={cn(calendarNavButtonVariants(), className)}
      disabled={disabledProp ?? state.isNextVisibleRangeInvalid()}
      onClick={onClickProp ?? (() => state.focusNextPage())}
      {...props}
    >
      {children ?? <ChevronRightIcon width={16} height={16} />}
    </button>
  )
})

CalendarNextButton.displayName = 'Calendar.NextButton'

// ─── Month ─────────────────────────────────────────────────────────────────────

const CalendarMonth = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="calendar-month"
      role="grid"
      className={cn(calendarGridVariants(), className)}
      {...props}
    >
      {children}
    </div>
  ),
)

CalendarMonth.displayName = 'Calendar.Month'

export interface CalendarWeekdaysProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  weekDays: string[]
}

const CalendarWeekdays = forwardRef<HTMLDivElement, CalendarWeekdaysProps>(
  ({ weekDays, className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="calendar-weekdays"
      role="row"
      className={cn(calendarGridHeaderRowVariants(), className)}
      {...props}
    >
      {weekDays.map((day, i) => (
        <div
          key={i}
          role="columnheader"
          className={calendarGridHeaderCellVariants()}
          aria-label={day}
        >
          {day}
        </div>
      ))}
    </div>
  ),
)

CalendarWeekdays.displayName = 'Calendar.Weekdays'

// ─── Days ──────────────────────────────────────────────────────────────────────

export interface CalendarDaysProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  gridProps: UseCalendarMonthResult['gridProps']
  weeks: UseCalendarMonthResult['weeks']
  /** 날짜 셀 렌더 함수. 생략하면 `<Calendar.Day>`를 기본으로 렌더링한다. */
  render?: (date: CalendarDate) => ReactNode
  /** 오늘 날짜 인디케이터. 생략하면 `<Calendar.TodayIndicator>`를 기본으로 렌더링한다. */
  todayIndicator?: ReactNode
}

const CalendarDays = forwardRef<HTMLDivElement, CalendarDaysProps>(
  ({ gridProps, weeks, className, render, todayIndicator, ...props }, ref) => {
    const renderFn = render
    return (
      <div
        ref={ref}
        data-slot="calendar-days"
        {...gridProps}
        className={cn(calendarGridBodyVariants(), className)}
        {...props}
      >
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} role="row" className="contents">
            {week.map((date, i) =>
              date ? (
                <div key={i} role="gridcell">
                  {renderFn ? (
                    renderFn(date)
                  ) : (
                    <CalendarDay date={date} todayIndicator={todayIndicator} />
                  )}
                </div>
              ) : (
                <div key={i} role="gridcell" />
              ),
            )}
          </div>
        ))}
      </div>
    )
  },
)

CalendarDays.displayName = 'Calendar.Days'

// ─── TodayIndicator ────────────────────────────────────────────────────────────

const CalendarTodayIndicator = forwardRef<HTMLSpanElement, HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      aria-hidden="true"
      data-slot="calendar-today-indicator"
      className={cn(calendarTodayIndicatorVariants(), className)}
      {...props}
    />
  ),
)

CalendarTodayIndicator.displayName = 'Calendar.TodayIndicator'

// ─── Day ───────────────────────────────────────────────────────────────────────

export interface CalendarDayProps extends Omit<HTMLAttributes<HTMLButtonElement>, 'children'> {
  state?: CalendarState
  date: CalendarDate
  children?: ReactNode
  /** 셀 상태를 받아 커스텀 콘텐츠를 렌더링하는 함수 */
  render?: (state: CalendarCellState) => ReactNode
  /** 오늘 날짜 인디케이터. 생략하면 `<Calendar.TodayIndicator>`를 기본으로 렌더링한다. */
  todayIndicator?: ReactNode
}

const CalendarDay = forwardRef<HTMLButtonElement, CalendarDayProps>(
  (
    { state: stateProp, date, className, children, render, todayIndicator, ...props },
    forwardedRef,
  ) => {
    const ctx = useCalendarCtx()
    const state = stateProp ?? ctx.state
    const { buttonProps, ref, cellState, dataAttrs } = useCalendarCell(state, date)
    const { isSelected, isToday, isDisabled, isUnavailable, isOutsideMonth, formattedDate } =
      cellState
    const blocked = isDisabled || isUnavailable

    return (
      <button
        ref={mergeRefs(ref, forwardedRef)}
        type="button"
        data-slot="calendar-day"
        {...dataAttrs}
        {...mergeProps(buttonProps, props, { internalWins: ARIA_WIRING_KEYS })}
        className={cn(calendarCellButtonVariants({ outsideMonth: isOutsideMonth }), className)}
      >
        {render ? (
          render(cellState)
        ) : (
          <span
            data-slot="calendar-day-wrapper"
            className={calendarCellWrapperVariants({ rangePos: 'none' })}
          >
            <span
              data-slot="calendar-day-content"
              className={calendarCellContentVariants({
                selected: isSelected,
                today: isToday,
                blocked,
                outsideMonth: isOutsideMonth,
                rangeMiddle: false,
              })}
            >
              {children ?? formattedDate}
              {isToday && !isSelected && !blocked && (todayIndicator ?? <CalendarTodayIndicator />)}
            </span>
          </span>
        )}
      </button>
    )
  },
)

CalendarDay.displayName = 'Calendar.Day'

export const Calendar = Object.assign(CalendarRoot, {
  Header: CalendarHeader,
  Heading: CalendarHeading,
  PreviousButton: CalendarPreviousButton,
  NextButton: CalendarNextButton,
  Month: CalendarMonth,
  Weekdays: CalendarWeekdays,
  Days: CalendarDays,
  Day: CalendarDay,
  TodayIndicator: CalendarTodayIndicator,
})

export default Calendar
