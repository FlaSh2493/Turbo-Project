'use client'

import { createContext, useContext } from 'react'
import type { CalendarDate } from '@internationalized/date'
import type { CalendarState, RangeCalendarState } from 'react-stately'

// ─── Calendar Context ─────────────────────────────────────────────────────────

interface CalendarContextValue {
  state: CalendarState
  locale: string
}

const CalendarContext = createContext<CalendarContextValue | null>(null)

export function useCalendarCtx(): CalendarContextValue {
  const ctx = useContext(CalendarContext)
  if (!ctx) throw new Error('Calendar sub-components must be used inside <Calendar>')
  return ctx
}

export { CalendarContext }

// ─── RangeCalendar Context ────────────────────────────────────────────────────

interface RangeCalendarContextValue {
  state: RangeCalendarState
  locale: string
}

const RangeCalendarContext = createContext<RangeCalendarContextValue | null>(null)

export function useRangeCalendarCtx(): RangeCalendarContextValue {
  const ctx = useContext(RangeCalendarContext)
  if (!ctx) throw new Error('RangeCalendar sub-components must be used inside <RangeCalendar>')
  return ctx
}

export { RangeCalendarContext }

// ─── GridBody Context (for currentMonthDate in multi-month range calendar) ────

export interface GridBodyContextValue {
  currentMonthDate: CalendarDate | null
}

const GridBodyContext = createContext<GridBodyContextValue>({ currentMonthDate: null })

export function useGridBodyContext(): GridBodyContextValue {
  return useContext(GridBodyContext)
}

export { GridBodyContext }
