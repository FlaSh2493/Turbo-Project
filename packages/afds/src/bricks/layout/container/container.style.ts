import { cva } from 'class-variance-authority'

export const containerVariants = cva('w-full', {
  variants: {
    size: {
      sm: 'max-w-screen-sm',
      md: 'max-w-screen-md',
      lg: 'max-w-screen-lg',
      xl: 'max-w-screen-xl',
      '2xl': 'max-w-screen-2xl',
      full: 'max-w-full',
    },
    center: {
      true: 'mx-auto',
      false: '',
    },
  },
  defaultVariants: {
    size: 'xl',
    center: true,
  },
})

export const sectionVariants = cva('py-8 md:py-12 lg:py-16')
