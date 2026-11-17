import { cva } from 'class-variance-authority'

export const viewportVariants = cva(
  'fixed left-1/2 z-100 flex -translate-x-1/2 flex-col items-center gap-2.5',
)

export const rootVariants = cva(
  [
    'flex items-center justify-between rounded-xl bg-afds-bg-black p-afds-spacing-20 body2 text-afds-text-inverse',
    'animate-in fade-in duration-500',
    'data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:duration-300 data-[state=closed]:fill-mode-forwards',
  ],
  {
    variants: {
      type: {
        default: '',
        success: '',
        warning: '',
        error: '',
      },
    },
    defaultVariants: {
      type: 'default',
    },
  },
)

// py-3 (12px): afds-spacing-12 토큰 미정의로 예외 하드코딩
export const contentVariants = cva('flex items-center gap-2.5 px-5 py-3')

export const iconVariants = cva('flex h-6 w-6 items-center justify-center', {
  variants: {
    type: {
      default: '',
      success: '',
      warning: '',
      error: '',
    },
  },
  defaultVariants: {
    type: 'default',
  },
})

export const closeVariants = cva(
  'ml-2.5 flex h-fit w-fit cursor-pointer items-center justify-center text-afds-text-secondary transition-colors duration-200 outline-none hover:text-afds-text-disabled focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-afds-border-focus',
)
