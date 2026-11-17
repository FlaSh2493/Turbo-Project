import { cva } from 'class-variance-authority'

export const dividerVariants = cva('shrink-0 bg-afds-divider-default', {
  variants: {
    orientation: {
      horizontal: 'w-full h-px',
      vertical: 'h-full w-px',
    },
  },
  defaultVariants: {
    orientation: 'horizontal',
  },
})
