'use client'

import { BaseInput as Input } from '../base-input'
import { Button, Typography } from '@turbo-project/afds/bricks'

import { forwardRef, useState } from 'react'
import { validateRange } from './validate-range'

export interface RangeFilterValue {
  min: string
  max?: string
}

interface RangeFilterProps {
  value: RangeFilterValue
  onChange: (value: RangeFilterValue) => void
  onClose: () => void
  showMax?: boolean
  minLabel?: string
  maxLabel?: string
  resetText?: string
  cancelText?: string
  applyText?: string
  minValue?: number
  maxValue?: number
}

export const RangeFilter = forwardRef<HTMLDivElement, RangeFilterProps>(
  (
    {
      value,
      onChange,
      onClose,
      showMax = true,
      minLabel = 'Min',
      maxLabel = 'Max',
      resetText = 'Reset',
      cancelText = 'Cancel',
      applyText = 'Apply',
      minValue,
      maxValue,
    },
    ref,
  ) => {
    const [min, setMin] = useState(value.min)
    const [max, setMax] = useState(value.max ?? '')
    const [submitted, setSubmitted] = useState(false)

    const { minInvalid, maxInvalid } = validateRange({ min, max, minValue, maxValue })
    const isMinError = submitted && minInvalid
    const isMaxError = submitted && maxInvalid

    const handleConfirm = () => {
      setSubmitted(true)
      if (minInvalid || maxInvalid) return
      onChange({ min: min.trim(), max: max.trim() })
      onClose()
    }

    const handleReset = () => {
      setMin('')
      setMax('')
      setSubmitted(false)
    }

    return (
      <div
        ref={ref}
        data-slot="range-filter"
        className="flex w-fit flex-col gap-4 rounded-[5px] border border-afds-border-default bg-afds-bg-surface p-4"
      >
        <div className="flex items-center gap-2">
          <Input
            size="sm"
            icon={false}
            placeholder={minLabel}
            value={min}
            onChange={setMin}
            className="w-[83px]"
            type="number"
            clearable={false}
            error={isMinError}
          />
          {showMax && (
            <>
              <Typography variant="body3" color="text-primary">
                -
              </Typography>
              <Input
                size="sm"
                icon={false}
                placeholder={maxLabel}
                value={max}
                onChange={setMax}
                className="w-[83px]"
                type="number"
                clearable={false}
                error={isMaxError}
              />
            </>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-afds-divider-default pt-2">
          <Button variant="ghost" onClick={handleReset} size="sm">
            {resetText}
          </Button>
          <div className="flex gap-1">
            <Button variant="line" onClick={onClose} size="sm">
              {cancelText}
            </Button>
            <Button variant="line" onClick={handleConfirm} size="sm">
              {applyText}
            </Button>
          </div>
        </div>
      </div>
    )
  },
)

RangeFilter.displayName = 'RangeFilter'
