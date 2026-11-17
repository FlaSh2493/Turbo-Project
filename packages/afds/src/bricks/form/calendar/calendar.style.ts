import { cva } from 'class-variance-authority'

export const calendarRootVariants = cva(['relative', 'inline-block', 'select-none', 'outline-none'])

export const calendarHeaderVariants = cva([
  'mb-afds-spacing-20 flex w-full items-center justify-between',
])

export const calendarHeadingVariants = cva(['text-afds-text-primary title3'])

export const calendarNavButtonVariants = cva([
  'flex h-afds-spacing-30 w-afds-spacing-30 items-center justify-center',
  'rounded-afds-sm border border-afds-border-default bg-afds-bg-surface',
  'outline-none transition-colors',
  'hover:bg-afds-interaction-hover-overlay',
  'focus-visible:ring-2 focus-visible:ring-afds-border-focus',
  'disabled:cursor-not-allowed disabled:bg-afds-bg-disabled disabled:opacity-50',
])

export const calendarGridVariants = cva(['w-full'])

export const calendarGridHeaderRowVariants = cva(['grid grid-cols-7'])

export const calendarGridBodyVariants = cva(['grid grid-cols-7'])

export const calendarGridHeaderCellVariants = cva([
  'pb-afds-spacing-8 text-center',
  'text-afds-text-secondary title4',
  'w-afds-spacing-34',
])

export const calendarCellVariants = cva(['w-afds-spacing-34 h-afds-spacing-34 p-0'])

export const calendarCellButtonVariants = cva(
  [
    'group relative flex h-afds-spacing-34 w-afds-spacing-34 items-center justify-center p-0',
    'outline-none cursor-pointer',
    'data-[disabled=true]:cursor-default',
    'data-[unavailable=true]:cursor-default',
  ],
  {
    variants: {
      outsideMonth: {
        true: 'invisible',
        false: '',
      },
    },
    defaultVariants: {
      outsideMonth: false,
    },
  },
)

export const calendarCellWrapperVariants = cva(
  ['flex h-afds-spacing-24 w-afds-spacing-34 items-center justify-center'],
  {
    variants: {
      rangePos: {
        none: '',
        start: '',
        end: '',
        middle: 'bg-afds-interaction-selected-overlay',
        single: '',
      },
      weekBoundary: {
        none: '',
        startWeek: '',
        endWeek: '',
        both: '',
      },
    },
    compoundVariants: [
      {
        rangePos: 'start',
        weekBoundary: 'none',
        className:
          'bg-[linear-gradient(to_left,var(--color-afds-interaction-selected-overlay)_50%,transparent_50%)]',
      },
      {
        rangePos: 'start',
        weekBoundary: 'startWeek',
        className:
          'bg-[linear-gradient(to_left,var(--color-afds-interaction-selected-overlay)_50%,transparent_50%)]',
      },
      {
        rangePos: 'end',
        weekBoundary: 'none',
        className:
          'bg-[linear-gradient(to_right,var(--color-afds-interaction-selected-overlay)_50%,transparent_50%)]',
      },
      {
        rangePos: 'end',
        weekBoundary: 'endWeek',
        className:
          'bg-[linear-gradient(to_right,var(--color-afds-interaction-selected-overlay)_50%,transparent_50%)]',
      },
      {
        rangePos: 'middle',
        weekBoundary: 'startWeek',
        className: 'rounded-l-afds-pill',
      },
      {
        rangePos: 'middle',
        weekBoundary: 'endWeek',
        className: 'rounded-r-afds-pill',
      },
      {
        rangePos: 'middle',
        weekBoundary: 'both',
        className: 'rounded-l-afds-pill rounded-r-afds-pill',
      },
    ],
    defaultVariants: {
      rangePos: 'none',
      weekBoundary: 'none',
    },
  },
)

export const calendarCellContentVariants = cva(
  [
    'relative flex flex-col h-afds-spacing-24 w-afds-spacing-24 items-center justify-center rounded-afds-pill',
    'title3 transition-colors',
  ],
  {
    variants: {
      selected: { true: 'bg-afds-bg-brand-subtle text-afds-text-inverse', false: '' },
      today: { true: '', false: '' },
      blocked: { true: '', false: '' },
      outsideMonth: { true: '', false: '' },
      rangeMiddle: { true: '', false: '' },
    },
    compoundVariants: [
      { selected: false, blocked: true, className: 'text-afds-text-disabled' },
      { selected: false, outsideMonth: true, className: 'text-afds-text-disabled' },
      {
        selected: false,
        today: true,
        blocked: true,
        className: 'ring-1 ring-afds-text-disabled',
      },
      {
        selected: false,
        blocked: false,
        outsideMonth: false,
        rangeMiddle: true,
        className: 'text-afds-text-brand-subtle',
      },
      {
        selected: false,
        blocked: false,
        outsideMonth: false,
        rangeMiddle: false,
        today: true,
        className: 'text-afds-text-brand-subtle',
      },
      {
        selected: false,
        blocked: false,
        outsideMonth: false,
        rangeMiddle: false,
        today: false,
        className: 'text-afds-text-secondary group-hover:bg-afds-interaction-hover-overlay',
      },
    ],
    defaultVariants: {
      selected: false,
      today: false,
      blocked: false,
      outsideMonth: false,
      rangeMiddle: false,
    },
  },
)

export const calendarTodayIndicatorVariants = cva([
  'absolute -bottom-[3px] h-1 w-1 rounded-afds-pill bg-afds-text-brand-subtle',
])
