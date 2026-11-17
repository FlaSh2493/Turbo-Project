import { cva } from 'class-variance-authority'

export const spinnerVariants = cva(
  'flex h-full w-full items-center justify-center overflow-hidden whitespace-nowrap select-none',
  {
    variants: {
      fullscreen: {
        page: 'fixed left-1/2 top-1/2 z-[9999] -translate-x-1/2 -translate-y-1/2',
        container: 'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
        static: 'static',
      },
      dim: {
        white: 'bg-afds-alpha-white-030',
        black: 'bg-afds-alpha-black-030',
      },
    },
    defaultVariants: {
      fullscreen: 'container',
      dim: 'white',
    },
  },
)
