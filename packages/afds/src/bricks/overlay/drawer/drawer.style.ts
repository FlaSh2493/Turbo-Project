import { cva } from 'class-variance-authority'

export const drawerOverlayBase =
  'fixed inset-0 bg-afds-bg-scrim-black transition-opacity duration-300 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0'

export const drawerViewportVariants = cva('fixed inset-0 z-50 flex overflow-hidden', {
  variants: {
    direction: {
      down: 'items-end',
      up: 'items-start',
      left: 'justify-start',
      right: 'justify-end',
    },
  },
  defaultVariants: { direction: 'down' },
})

export const drawerPanelVariants = cva(
  'relative flex flex-col bg-afds-bg-surface shadow-afds-1 transition-transform duration-300 ease-in-out outline-none',
  {
    variants: {
      direction: {
        down: 'w-full h-[calc(100dvh-100px)] min-h-0 data-[starting-style]:translate-y-full data-[ending-style]:translate-y-full',
        up: 'w-full h-[calc(100dvh-100px)] min-h-0 data-[starting-style]:-translate-y-full data-[ending-style]:-translate-y-full',
        left: 'h-full data-[starting-style]:-translate-x-full data-[ending-style]:-translate-x-full',
        right: 'h-full data-[starting-style]:translate-x-full data-[ending-style]:translate-x-full',
      },
    },
    defaultVariants: { direction: 'down' },
  },
)

export const drawerTitleVariants = cva('flex shrink-0 items-center p-afds-spacing-20', {
  variants: {
    direction: {
      down: '',
      up: '',
      left: 'border-b border-afds-divider-default',
      right: 'border-b border-afds-divider-default',
    },
  },
  defaultVariants: { direction: 'down' },
})
