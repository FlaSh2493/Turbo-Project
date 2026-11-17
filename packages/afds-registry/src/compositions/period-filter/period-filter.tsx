'use client'

import { forwardRef, useState, useMemo } from 'react'
import {
  Button,
  Calendar,
  RangeCalendar,
  Typography,
  type DateRange,
} from '@turbo-project/afds/bricks'
import {
  getCalendarTitle,
  getRangeCalendarTitle,
  useCalendar,
  useCalendarMonth,
  useRangeCalendar,
  useRangeCalendarMonth,
} from '@turbo-project/afds/headless'

import type { CalendarDate } from '@internationalized/date'

import { Accordion as AccordionPrimitive } from '@base-ui/react/accordion'
import { accordionPanel, optionItemVariants } from './period-filter.style'

// ─── 타입 ─────────────────────────────────────────────────────────────────────

export type PeriodMode = 'before' | 'after' | 'range'

export interface PeriodFilterValue {
  mode: string
  date?: string
  from?: string
  to?: string
}

export interface PeriodFilterExtraOption {
  value: string
  label: string
}

interface PeriodFilterProps {
  value: PeriodFilterValue | null
  onChange: (value: PeriodFilterValue | null) => void
  onClose: () => void
  extraOptions?: PeriodFilterExtraOption[]
  afterLabel?: string
  beforeLabel?: string
  rangeLabel?: string
  resetText?: string
  cancelText?: string
  applyText?: string
  /**
   * 이 날짜보다 이후는 선택 불가 처리한다.
   * 미지정 시 비활성화 규칙이 적용되지 않는다.
   * SSR 환경에서 hydration 안전성을 보장하기 위해 호출자가 명시적으로 전달한다.
   */
  disabledAfter?: Date
}

// ─── 유틸 ─────────────────────────────────────────────────────────────────────

const pad = (n: number) => String(n).padStart(2, '0')

const formatLocalDate = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

const parseLocalDate = (str: string): Date | undefined => {
  if (!str) return undefined
  const parts = str.split('-')
  if (parts.length !== 3) return undefined
  const y = Number(parts[0])
  const m = Number(parts[1])
  const d = Number(parts[2])
  if (isNaN(y) || isNaN(m) || isNaN(d)) return undefined
  return new Date(y, m - 1, d)
}

// ─── 인라인 캘린더 헬퍼 ───────────────────────────────────────────────────────

interface InlineCalendarProps {
  value?: Date
  onValueChange?: (date: Date | undefined) => void
  isDateUnavailable?: (date: Date) => boolean
}

function InlineCalendar({ value, onValueChange, isDateUnavailable }: InlineCalendarProps) {
  const cal = useCalendar({ value, onValueChange, isDateUnavailable })
  const title = getCalendarTitle(cal.state, cal.locale)
  const grid = useCalendarMonth(cal.state, cal.locale)
  return (
    <Calendar cal={cal}>
      <Calendar.Header>
        <Calendar.PreviousButton />
        <Calendar.Heading title={title} />
        <Calendar.NextButton />
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
  )
}

interface InlineRangeCalendarProps {
  value?: DateRange
  onValueChange?: (range: DateRange | undefined) => void
  isDateUnavailable?: (date: Date) => boolean
}

function InlineRangeCalendar({
  value,
  onValueChange,
  isDateUnavailable,
}: InlineRangeCalendarProps) {
  const cal = useRangeCalendar({ value, onValueChange, isDateUnavailable })
  const title = getRangeCalendarTitle(cal.state, cal.locale)
  const grid = useRangeCalendarMonth(cal.state, cal.locale)
  return (
    <RangeCalendar cal={cal}>
      <RangeCalendar.Header>
        <RangeCalendar.PreviousButton />
        <RangeCalendar.Heading title={title} />
        <RangeCalendar.NextButton />
      </RangeCalendar.Header>
      <RangeCalendar.Month>
        <RangeCalendar.Weekdays weekDays={grid.weekDays} />
        <RangeCalendar.Days
          gridProps={grid.gridProps}
          weeks={grid.weeks}
          startDate={grid.startDate}
          render={(date: CalendarDate) => (
            <RangeCalendar.Day state={cal.state} date={date} currentMonthDate={grid.startDate} />
          )}
        />
      </RangeCalendar.Month>
    </RangeCalendar>
  )
}

// ─── 컴포넌트 ─────────────────────────────────────────────────────────────────

export const PeriodFilter = forwardRef<HTMLDivElement, PeriodFilterProps>(
  (
    {
      value,
      onChange,
      onClose,
      extraOptions = [],
      afterLabel = 'After',
      beforeLabel = 'Before',
      rangeLabel = 'Range',
      resetText = 'Reset',
      cancelText = 'Cancel',
      applyText = 'Apply',
      disabledAfter,
    },
    ref,
  ) => {
    const builtinOptions = useMemo(
      () => [
        { value: 'after', label: afterLabel },
        { value: 'before', label: beforeLabel },
        { value: 'range', label: rangeLabel },
      ],
      [afterLabel, beforeLabel, rangeLabel],
    )

    const initialMode = value?.mode ?? null
    const [selectedMode, setSelectedMode] = useState<string | null>(initialMode)
    const [accordionOpen, setAccordionOpen] = useState<string>(
      initialMode === 'before' || initialMode === 'after' || initialMode === 'range'
        ? initialMode
        : '',
    )

    const [afterDate, setAfterDate] = useState<Date | undefined>(
      value?.mode === 'after' ? parseLocalDate(value.date ?? '') : undefined,
    )
    const [beforeDate, setBeforeDate] = useState<Date | undefined>(
      value?.mode === 'before' ? parseLocalDate(value.date ?? '') : undefined,
    )
    const [rangeDate, setRangeDate] = useState<DateRange | undefined>(
      value?.mode === 'range'
        ? {
            start: parseLocalDate(value.from ?? ''),
            end: parseLocalDate(value.to ?? ''),
          }
        : undefined,
    )

    const handleExtraOptionClick = (optValue: string) => {
      setSelectedMode(optValue)
      setAccordionOpen('')
    }

    const handleAccordionChange = (v: string[]) => {
      const next = v[0] ?? ''
      setAccordionOpen(next)
      if (next) setSelectedMode(next)
    }

    const handleReset = () => {
      setSelectedMode(null)
      setAccordionOpen('')
      setAfterDate(undefined)
      setBeforeDate(undefined)
      setRangeDate(undefined)
    }

    const handleConfirm = () => {
      if (!selectedMode) {
        onChange(null)
      } else if (selectedMode === 'after') {
        if (afterDate) {
          onChange({ mode: 'after', date: formatLocalDate(afterDate) })
        }
      } else if (selectedMode === 'before') {
        if (beforeDate) {
          onChange({ mode: 'before', date: formatLocalDate(beforeDate) })
        }
      } else if (selectedMode === 'range') {
        if (rangeDate?.start && rangeDate?.end) {
          onChange({
            mode: 'range',
            from: formatLocalDate(rangeDate.start),
            to: formatLocalDate(rangeDate.end),
          })
        }
      } else {
        onChange({ mode: selectedMode })
      }
      onClose()
    }

    const unavailableFuture = disabledAfter ? (date: Date) => date > disabledAfter : undefined

    return (
      <div
        ref={ref}
        data-slot="period-filter"
        className="flex w-[280px] flex-col gap-4 rounded-[5px] border border-afds-border-default bg-afds-bg-surface p-2.5"
      >
        <div className="flex flex-col gap-0.5">
          {extraOptions.map(opt => (
            <button
              key={opt.value}
              type="button"
              className={optionItemVariants({ selected: selectedMode === opt.value })}
              onClick={() => handleExtraOptionClick(opt.value)}
            >
              <Typography variant="body3">{opt.label}</Typography>
            </button>
          ))}

          <AccordionPrimitive.Root
            multiple={false}
            value={[accordionOpen]}
            onValueChange={handleAccordionChange}
            className="flex flex-col gap-0.5"
          >
            {builtinOptions.map(opt => (
              <AccordionPrimitive.Item key={opt.value} value={opt.value}>
                <AccordionPrimitive.Header className="flex">
                  <AccordionPrimitive.Trigger
                    className={optionItemVariants({ selected: selectedMode === opt.value })}
                  >
                    <Typography variant="body3">{opt.label}</Typography>
                  </AccordionPrimitive.Trigger>
                </AccordionPrimitive.Header>
                <AccordionPrimitive.Panel className={accordionPanel}>
                  <div className="p-2.5">
                    {opt.value === 'range' ? (
                      <InlineRangeCalendar
                        value={rangeDate}
                        onValueChange={setRangeDate}
                        isDateUnavailable={unavailableFuture}
                      />
                    ) : (
                      <InlineCalendar
                        value={opt.value === 'after' ? afterDate : beforeDate}
                        onValueChange={date => {
                          if (opt.value === 'after') setAfterDate(date)
                          else setBeforeDate(date)
                        }}
                        isDateUnavailable={unavailableFuture}
                      />
                    )}
                  </div>
                </AccordionPrimitive.Panel>
              </AccordionPrimitive.Item>
            ))}
          </AccordionPrimitive.Root>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-afds-divider-default pt-2">
          <Button variant="ghost" onClick={handleReset} size="sm">
            {resetText}
          </Button>
          <div className="flex gap-2">
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

PeriodFilter.displayName = 'PeriodFilter'
