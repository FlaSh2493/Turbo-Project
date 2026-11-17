'use client'

import { forwardRef, type ReactNode } from 'react'
import { RangeCalendar, type RangeCalendarRootProps } from '@turbo-project/afds/bricks'
import {
  getRangeCalendarTitle,
  type DateRange,
  type UseRangeCalendarOptions,
  useRangeCalendar,
  useRangeCalendarMonth,
} from '@turbo-project/afds/headless'

import type { CalendarDate } from '@internationalized/date'

export type { DateRange }

export interface RangeDatePickerProps
  extends
    Omit<RangeCalendarRootProps, 'cal' | 'children'>,
    Pick<
      UseRangeCalendarOptions,
      | 'value'
      | 'onValueChange'
      | 'isDateUnavailable'
      | 'defaultRange'
      | 'defaultFocusedDate'
      | 'locale'
      | 'visibleDuration'
    > {
  footer?: ReactNode
}

export const RangeDatePicker = forwardRef<HTMLDivElement, RangeDatePickerProps>(
  (
    {
      value,
      onValueChange,
      isDateUnavailable,
      defaultRange,
      defaultFocusedDate,
      locale,
      visibleDuration,
      footer,
      ...rest
    },
    ref,
  ) => {
    const cal = useRangeCalendar({
      value,
      onValueChange,
      isDateUnavailable,
      defaultRange,
      defaultFocusedDate,
      locale,
      visibleDuration,
    })
    const title = getRangeCalendarTitle(cal.state, cal.locale)
    const grid = useRangeCalendarMonth(cal.state, cal.locale)

    return (
      <div
        ref={ref}
        data-slot="range-date-picker"
        className="w-fit rounded-afds-md border border-afds-border-default bg-afds-bg-surface p-afds-spacing-20 shadow-afds-1"
      >
        <RangeCalendar cal={cal} {...rest}>
          <RangeCalendar.Header>
            <RangeCalendar.Heading title={title} />
            <div className="flex items-center gap-afds-spacing-10">
              <RangeCalendar.PreviousButton />
              <RangeCalendar.NextButton />
            </div>
          </RangeCalendar.Header>
          <RangeCalendar.Month>
            <RangeCalendar.Weekdays weekDays={grid.weekDays} />
            <RangeCalendar.Days {...grid}>
              {(date: CalendarDate) => (
                <RangeCalendar.Day
                  state={cal.state}
                  date={date}
                  currentMonthDate={grid.startDate}
                />
              )}
            </RangeCalendar.Days>
          </RangeCalendar.Month>
        </RangeCalendar>
        {footer}
      </div>
    )
  },
)

RangeDatePicker.displayName = 'RangeDatePicker'

export default RangeDatePicker
