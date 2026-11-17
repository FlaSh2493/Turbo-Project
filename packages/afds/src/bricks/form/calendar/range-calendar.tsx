'use client'

import type { CalendarDate, DateDuration } from '@internationalized/date'
import type { HTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'
import { forwardRef } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { mergeRefs } from '../../../lib/slot'
import { mergeProps } from '../../../lib/merge-props'
import {
  getRangeCalendarTitle,
  useRangeCalendarCell,
  type DateRange,
  type RangeCalendarCellState,
  type UseRangeCalendarResult,
  type UseRangeCalendarMonthResult,
} from '../../../headless/calendar/use-range-calendar'
import type { RangeCalendarState } from 'react-stately'
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
import {
  RangeCalendarContext,
  useRangeCalendarCtx,
  GridBodyContext,
  useGridBodyContext,
} from '../../../headless/calendar/calendar.context'

/** react-aria 가 날짜 셀에 심는 동작·접근성 배선. 소비자가 덮으면 위젯이 망가진다. */
const ARIA_WIRING_KEYS = ['role', 'tabIndex', 'data-react-aria-pressable'] as const

/**
 * root 의 배선. `role="application"` 이 사라지면 캘린더 그룹 시맨틱이 사라진다.
 * `aria-label`·`id` 는 소비자가 덮는 것이 정당하므로 넣지 않는다.
 */
const ROOT_WIRING_KEYS = ['role'] as const

export type { DateRange, RangeCalendarCellState }

// ─── Root ──────────────────────────────────────────────────────────────────────

export interface RangeCalendarRootProps
  extends
    HTMLAttributes<HTMLDivElement>,
    Pick<InputHTMLAttributes<HTMLInputElement>, 'required' | 'disabled'> {
  cal: UseRangeCalendarResult
  /**
   * 시작일 필드명. 지정 시 시작일이 `YYYY-MM-DD` 형식으로 시각적으로 숨겨진 input에 동기화된다.
   * 종료일도 함께 제출하려면 `endName`을 같이 지정한다.
   */
  startName?: string
  /**
   * 종료일 필드명. 지정 시 종료일이 `YYYY-MM-DD` 형식으로 시각적으로 숨겨진 input에 동기화된다.
   * 시작일도 함께 제출하려면 `startName`을 같이 지정한다.
   */
  endName?: string
}

const formatCalendarDate = (d: CalendarDate | null | undefined): string =>
  d ? `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}` : ''

const RangeCalendarRoot = forwardRef<HTMLDivElement, RangeCalendarRootProps>(
  ({ cal, startName, endName, required, disabled, className, children, ...props }, ref) => {
    const range = cal.state.value as { start: CalendarDate; end: CalendarDate } | null | undefined

    return (
      <RangeCalendarContext.Provider value={{ state: cal.state, locale: cal.locale }}>
        <div
          data-slot="range-calendar"
          data-value-start={formatCalendarDate(range?.start)}
          data-value-end={formatCalendarDate(range?.end)}
          {...mergeProps(cal.rootProps, props, { internalWins: ROOT_WIRING_KEYS })}
          ref={mergeRefs(cal.ref, ref)}
          className={cn(calendarRootVariants(), className)}
        >
          {children}
          {startName && (
            <input
              aria-hidden
              tabIndex={-1}
              name={startName}
              value={formatCalendarDate(range?.start)}
              required={required}
              disabled={disabled}
              onChange={() => {}}
              className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
            />
          )}
          {endName && (
            <input
              aria-hidden
              tabIndex={-1}
              name={endName}
              value={formatCalendarDate(range?.end)}
              required={required}
              disabled={disabled}
              onChange={() => {}}
              className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
            />
          )}
        </div>
      </RangeCalendarContext.Provider>
    )
  },
)

RangeCalendarRoot.displayName = 'RangeCalendar'

// ─── Header ────────────────────────────────────────────────────────────────────

const RangeCalendarHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="range-calendar-header"
      className={cn(calendarHeaderVariants(), className)}
      {...props}
    >
      {children}
    </div>
  ),
)

RangeCalendarHeader.displayName = 'RangeCalendar.Header'

// ─── Heading ───────────────────────────────────────────────────────────────────

export interface RangeCalendarHeadingProps extends Omit<
  HTMLAttributes<HTMLHeadingElement>,
  'children'
> {
  title?: string
  offset?: DateDuration
  children?: ReactNode
}

const RangeCalendarHeading = forwardRef<HTMLHeadingElement, RangeCalendarHeadingProps>(
  ({ title: titleProp, offset, className, children, ...props }, ref) => {
    const { state, locale } = useRangeCalendarCtx()
    const title = titleProp ?? getRangeCalendarTitle(state, locale, { offset })

    return (
      <h2
        ref={ref}
        data-slot="range-calendar-heading"
        className={cn(calendarHeadingVariants(), className)}
        {...props}
      >
        {children ?? title}
      </h2>
    )
  },
)

RangeCalendarHeading.displayName = 'RangeCalendar.Heading'

// ─── PreviousButton ────────────────────────────────────────────────────────────

const RangeCalendarPreviousButton = forwardRef<
  HTMLButtonElement,
  HTMLAttributes<HTMLButtonElement> & { disabled?: boolean }
>(({ className, children, disabled: disabledProp, onClick: onClickProp, ...props }, ref) => {
  const { state } = useRangeCalendarCtx()

  return (
    <button
      ref={ref}
      type="button"
      data-slot="range-calendar-previous-button"
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

RangeCalendarPreviousButton.displayName = 'RangeCalendar.PreviousButton'

// ─── NextButton ────────────────────────────────────────────────────────────────

const RangeCalendarNextButton = forwardRef<
  HTMLButtonElement,
  HTMLAttributes<HTMLButtonElement> & { disabled?: boolean }
>(({ className, children, disabled: disabledProp, onClick: onClickProp, ...props }, ref) => {
  const { state } = useRangeCalendarCtx()

  return (
    <button
      ref={ref}
      type="button"
      data-slot="range-calendar-next-button"
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

RangeCalendarNextButton.displayName = 'RangeCalendar.NextButton'

// ─── Month ─────────────────────────────────────────────────────────────────────

const RangeCalendarMonth = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="range-calendar-month"
      role="grid"
      className={cn(calendarGridVariants(), className)}
      {...props}
    >
      {children}
    </div>
  ),
)

RangeCalendarMonth.displayName = 'RangeCalendar.Month'

// ─── Weekdays ──────────────────────────────────────────────────────────────────

export interface RangeCalendarWeekdaysProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children'
> {
  weekDays: string[]
}

const RangeCalendarWeekdays = forwardRef<HTMLDivElement, RangeCalendarWeekdaysProps>(
  ({ weekDays, className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="range-calendar-weekdays"
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

RangeCalendarWeekdays.displayName = 'RangeCalendar.Weekdays'

// ─── Days ──────────────────────────────────────────────────────────────────────

export interface RangeCalendarDaysProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  gridProps: UseRangeCalendarMonthResult['gridProps']
  weeks: UseRangeCalendarMonthResult['weeks']
  startDate: UseRangeCalendarMonthResult['startDate']
  /** 날짜 셀 렌더 함수. 생략하면 `<RangeCalendar.Day>`를 기본으로 렌더링한다. */
  render?: (date: CalendarDate) => ReactNode
  /** 오늘 날짜 인디케이터. 생략하면 `<RangeCalendar.TodayIndicator>`를 기본으로 렌더링한다. */
  todayIndicator?: ReactNode
}

const RangeCalendarDays = forwardRef<HTMLDivElement, RangeCalendarDaysProps>(
  ({ gridProps, weeks, startDate, className, render, todayIndicator, ...props }, ref) => {
    const renderFn = render
    return (
      <GridBodyContext.Provider value={{ currentMonthDate: startDate }}>
        <div
          ref={ref}
          data-slot="range-calendar-days"
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
                      <RangeCalendarDay date={date} todayIndicator={todayIndicator} />
                    )}
                  </div>
                ) : (
                  <div key={i} role="gridcell" />
                ),
              )}
            </div>
          ))}
        </div>
      </GridBodyContext.Provider>
    )
  },
)

RangeCalendarDays.displayName = 'RangeCalendar.Days'

// ─── TodayIndicator ────────────────────────────────────────────────────────────

const RangeCalendarTodayIndicator = forwardRef<HTMLSpanElement, HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      aria-hidden="true"
      data-slot="range-calendar-today-indicator"
      className={cn(calendarTodayIndicatorVariants(), className)}
      {...props}
    />
  ),
)

RangeCalendarTodayIndicator.displayName = 'RangeCalendar.TodayIndicator'

// ─── Day ───────────────────────────────────────────────────────────────────────

export interface RangeCalendarDayProps extends Omit<HTMLAttributes<HTMLButtonElement>, 'children'> {
  state?: RangeCalendarState
  date: CalendarDate
  currentMonthDate?: CalendarDate | null
  children?: ReactNode
  /** 셀 상태를 받아 커스텀 콘텐츠를 렌더링하는 함수 */
  render?: (state: RangeCalendarCellState) => ReactNode
  /** 오늘 날짜 인디케이터. 생략하면 `<RangeCalendar.TodayIndicator>`를 기본으로 렌더링한다. */
  todayIndicator?: ReactNode
}

const RangeCalendarDay = forwardRef<HTMLButtonElement, RangeCalendarDayProps>(
  (
    {
      state: stateProp,
      date,
      currentMonthDate: currentMonthDateProp,
      className,
      children,
      render,
      todayIndicator,
      ...props
    },
    forwardedRef,
  ) => {
    const ctx = useRangeCalendarCtx()
    const gridBodyCtx = useGridBodyContext()
    const state = stateProp ?? ctx.state
    const currentMonthDate =
      currentMonthDateProp !== undefined ? currentMonthDateProp : gridBodyCtx.currentMonthDate

    const { buttonProps, ref, cellState, dataAttrs, rangePos, weekBoundary } = useRangeCalendarCell(
      state,
      date,
      currentMonthDate,
    )
    const {
      isSelected,
      isRangeStart,
      isRangeEnd,
      isRangeMiddle,
      isToday,
      isDisabled,
      isUnavailable,
      isOutsideMonth,
      formattedDate,
    } = cellState
    const blocked = isDisabled || isUnavailable
    const isSelectedEndpoint = isRangeStart || isRangeEnd

    return (
      <button
        ref={mergeRefs(ref, forwardedRef)}
        type="button"
        data-slot="range-calendar-day"
        {...dataAttrs}
        {...mergeProps(buttonProps, props, { internalWins: ARIA_WIRING_KEYS })}
        className={cn(calendarCellButtonVariants({ outsideMonth: isOutsideMonth }), className)}
      >
        {render ? (
          render(cellState)
        ) : (
          <span
            data-slot="range-calendar-day-wrapper"
            className={calendarCellWrapperVariants({ rangePos, weekBoundary })}
          >
            <span
              data-slot="range-calendar-day-content"
              className={calendarCellContentVariants({
                selected: isSelectedEndpoint,
                today: isToday,
                blocked,
                outsideMonth: isOutsideMonth,
                rangeMiddle: isRangeMiddle,
              })}
            >
              {children ?? formattedDate}
              {isToday &&
                !isSelected &&
                !blocked &&
                (todayIndicator ?? <RangeCalendarTodayIndicator />)}
            </span>
          </span>
        )}
      </button>
    )
  },
)

RangeCalendarDay.displayName = 'RangeCalendar.Day'

export const RangeCalendar = Object.assign(RangeCalendarRoot, {
  Header: RangeCalendarHeader,
  Heading: RangeCalendarHeading,
  PreviousButton: RangeCalendarPreviousButton,
  NextButton: RangeCalendarNextButton,
  Month: RangeCalendarMonth,
  Weekdays: RangeCalendarWeekdays,
  Days: RangeCalendarDays,
  Day: RangeCalendarDay,
  TodayIndicator: RangeCalendarTodayIndicator,
})

export default RangeCalendar
