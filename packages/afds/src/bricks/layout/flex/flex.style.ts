import { cva } from 'class-variance-authority'

export const flexVariants = cva('flex', {
  variants: {
    direction: {
      row: 'flex-row',
      column: 'flex-col',
      'row-reverse': 'flex-row-reverse',
      'column-reverse': 'flex-col-reverse',
    },
    justify: {
      'flex-start': 'justify-start',
      center: 'justify-center',
      'flex-end': 'justify-end',
      'space-between': 'justify-between',
      'space-around': 'justify-around',
      'space-evenly': 'justify-evenly',
    },
    align: {
      'flex-start': 'items-start',
      center: 'items-center',
      'flex-end': 'items-end',
      stretch: 'items-stretch',
      baseline: 'items-baseline',
    },
    wrap: {
      nowrap: 'flex-nowrap',
      wrap: 'flex-wrap',
      'wrap-reverse': 'flex-wrap-reverse',
    },
    alignContent: {
      'flex-start': 'content-start',
      center: 'content-center',
      'flex-end': 'content-end',
      'space-between': 'content-between',
      'space-around': 'content-around',
      'space-evenly': 'content-evenly',
    },
    gap: {
      'spacing-4': 'gap-afds-spacing-4',
      'spacing-8': 'gap-afds-spacing-8',
      'spacing-10': 'gap-afds-spacing-10',
      'spacing-14': 'gap-afds-spacing-14',
      'spacing-20': 'gap-afds-spacing-20',
      'spacing-24': 'gap-afds-spacing-24',
      'spacing-30': 'gap-afds-spacing-30',
      'spacing-34': 'gap-afds-spacing-34',
      'spacing-40': 'gap-afds-spacing-40',
      'spacing-44': 'gap-afds-spacing-44',
      'spacing-50': 'gap-afds-spacing-50',
      'spacing-60': 'gap-afds-spacing-60',
    },
  },
  defaultVariants: {
    direction: 'row',
    justify: 'flex-start',
    align: 'stretch',
    wrap: 'nowrap',
  },
})
