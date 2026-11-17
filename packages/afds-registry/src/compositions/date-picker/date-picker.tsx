'use client'

import { forwardRef, type ReactNode } from 'react'
import { Calendar, type CalendarRootProps } from '@turbo-project/afds/bricks'
import {
  getCalendarTitle,
  type UseCalendarOptions,
  useCalendar,
  useCalendarMonth,
} from '@turbo-project/afds/headless'

import type { CalendarDate } from '@internationalized/date'

export interface DatePickerProps
  extends
    Omit<CalendarRootProps, 'cal' | 'children'>,
    Pick<
      UseCalendarOptions,
      | 'value'
      | 'onValueChange'
      | 'isDateUnavailable'
      | 'defaultDate'
      | 'defaultFocusedDate'
      | 'locale'
    > {
  footer?: ReactNode
}

export const DatePicker = forwardRef<HTMLDivElement, DatePickerProps>(
  (
    {
      value,
      onValueChange,
      isDateUnavailable,
      defaultDate,
      defaultFocusedDate,
      locale,
      footer,
      ...rest
    },
    ref,
  ) => {
    const cal = useCalendar({
      value,
      onValueChange,
      isDateUnavailable,
      defaultDate,
      defaultFocusedDate,
      locale,
    })
    const title = getCalendarTitle(cal.state, cal.locale)
    const grid = useCalendarMonth(cal.state, cal.locale)

    return (
      <div
        ref={ref}
        data-slot="date-picker"
        className="w-fit rounded-afds-md border border-afds-border-default bg-afds-bg-surface p-5 shadow-afds-1"
      >
        <Calendar cal={cal} {...rest}>
          <Calendar.Header>
            <Calendar.Heading title={title} />
            <div className="flex items-center gap-afds-spacing-10">
              <Calendar.PreviousButton />
              <Calendar.NextButton />
            </div>
          </Calendar.Header>
          <Calendar.Month>
            <Calendar.Weekdays weekDays={grid.weekDays} />
            <Calendar.Days
              gridProps={grid.gridProps}
              weeks={grid.weeks}
              render={(date: CalendarDate) => <Calendar.Day state={cal.state} date={date} />}
            />
          </Calendar.Month>
        </Calendar>
        {footer}
      </div>
    )
  },
)

DatePicker.displayName = 'DatePicker'

export default DatePicker
