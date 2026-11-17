import { cva } from 'class-variance-authority'

export const scrollBarVariants = cva('flex touch-none select-none transition-all duration-200', {
  variants: {
    orientation: {
      vertical:
        'h-full w-[var(--scrollbar-track-size)] px-[5px] pt-[var(--scrollbar-offset-start)] pb-[var(--scrollbar-offset-end)]',
      horizontal:
        'flex-col h-[var(--scrollbar-track-size)] py-[5px] pl-[var(--scrollbar-offset-start)] pr-[var(--scrollbar-offset-end)]',
    },
  },
  defaultVariants: {
    orientation: 'vertical',
  },
})
