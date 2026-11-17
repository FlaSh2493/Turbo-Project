'use client'

import { forwardRef, type ReactNode, useState } from 'react'
import clsx from 'clsx'
import { CalendarIcon } from 'lucide-react'
import { Popover, Typography } from '@turbo-project/afds/bricks'

import DatePicker from '../date-picker/date-picker'

import type { DatePickerProps } from '../date-picker/date-picker'

export interface DatePickerDropdownProps extends Omit<DatePickerProps, 'footer'> {
  placeholder?: string
  disabled?: boolean
  triggerLabel?: ReactNode
}

export const DatePickerDropdown = forwardRef<HTMLButtonElement, DatePickerDropdownProps>(
  (
    { value, onValueChange, placeholder = 'Select date', disabled = false, triggerLabel, ...rest },
    ref,
  ) => {
    const [open, setOpen] = useState(false)

    const handleValueChange = (date: Date | undefined) => {
      onValueChange?.(date)
      setOpen(false)
    }

    const formattedDate = value
      ? value.toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        })
      : null

    return (
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger
          ref={ref}
          render={
            <button
              disabled={disabled}
              data-slot="date-picker-dropdown-trigger"
              className={clsx(
                'rounded-afds-sm flex h-11 items-center gap-2 border px-3.5 transition-colors',
                {
                  'border-afds-border-default bg-afds-bg-surface-sunken text-afds-text-primary hover:bg-afds-bg-surface-sunken':
                    !open && !disabled,
                  'border-afds-border-focus bg-afds-bg-surface text-afds-text-primary':
                    open && !disabled,
                  'cursor-not-allowed border-afds-border-default bg-afds-bg-disabled text-afds-text-disabled':
                    disabled,
                },
              )}
            >
              <CalendarIcon width={16} height={16} />
              <Typography variant="body2" className="flex-1 text-left">
                {triggerLabel || formattedDate || placeholder}
              </Typography>
            </button>
          }
        />

        <Popover.Content align="start" className="p-0">
          <DatePicker
            value={value}
            onValueChange={handleValueChange}
            disabled={disabled}
            {...rest}
          />
        </Popover.Content>
      </Popover.Root>
    )
  },
)

DatePickerDropdown.displayName = 'DatePickerDropdown'

export default DatePickerDropdown
