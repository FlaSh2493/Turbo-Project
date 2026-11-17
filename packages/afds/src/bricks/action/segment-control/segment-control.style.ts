import { cva } from 'class-variance-authority'

export const segmentControlVariants = cva(
  'relative inline-flex items-center rounded-afds-sm bg-afds-alpha-black-003 transition-all duration-200',
  {
    variants: {
      size: {
        sm: 'h-6 p-0.5',
        default: 'h-[34px] p-[3px]',
        lg: 'h-11 p-1',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  },
)

export const segmentControlIndicatorVariants = cva(
  'absolute rounded-[4px] bg-afds-bg-surface shadow-afds-1 transition-all duration-200',
  {
    variants: {
      size: {
        sm: 'top-0.5 bottom-0.5',
        default: 'top-[3px] bottom-[3px]',
        lg: 'top-1 bottom-1',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  },
)

export const segmentControlItemVariants = cva(
  'relative flex flex-1 items-center justify-center font-bold transition-colors duration-200 z-1 enabled:cursor-pointer disabled:cursor-not-allowed',
  {
    variants: {
      size: {
        sm: 'px-2.5 title4',
        default: 'px-2.5 title4',
        lg: 'px-2.5 title4',
      },
      selected: {
        true: 'text-afds-text-primary',
        false: 'text-afds-text-secondary hover:text-afds-text-primary',
      },
    },
    defaultVariants: {
      size: 'default',
      selected: false,
    },
  },
)
