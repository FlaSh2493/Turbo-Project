import { cva } from 'class-variance-authority'

export const modalOverlayVariants = cva(
  'fixed inset-0 z-50 bg-afds-bg-scrim-black animate-in fade-in duration-200 transition-opacity [&:not([data-open])]:animate-out [&:not([data-open])]:fade-out',
)

export const modalContentVariants = cva(
  'fixed top-1/2 left-1/2 z-50 flex flex-col -translate-x-1/2 -translate-y-1/2 rounded-afds-md bg-afds-bg-surface shadow-afds-1 outline-none animate-in fade-in zoom-in-95 duration-200 -translate-x-1/2 -translate-y-1/2 transition-[transform,opacity] [&:not([data-open])]:animate-out [&:not([data-open])]:fade-out [&:not([data-open])]:zoom-out-95',
  {
    variants: {
      size: {
        sm: 'max-h-[800px] w-[360px]',
        md: 'max-h-[800px] w-[640px]',
        lg: 'max-h-[800px] w-[840px]',
        xl: 'max-h-[calc(100vh-120px)] w-[1280px]',
      },
    },
    defaultVariants: {
      size: 'sm',
    },
  },
)

export const modalBodyVariants = cva('flex flex-1 flex-col', {
  variants: {
    size: {
      sm: 'min-h-[95px]',
      md: 'min-h-[124px]',
      lg: 'min-h-[518px]',
      xl: 'min-h-[738px]',
    },
  },
  defaultVariants: {
    size: 'sm',
  },
})
