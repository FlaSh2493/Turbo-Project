import { cva } from 'class-variance-authority'

export const roundBadgeRootBase =
  'body3 inline-flex items-center justify-center gap-1.5 rounded-full bg-afds-bg-surface-sunken px-2 py-afds-spacing-4'

export const roundBadgeDotVariants = cva('h-2.5 w-2.5 rounded-full', {
  variants: {
    color: {
      disabled: 'bg-afds-icon-disabled',
      success: 'bg-afds-extra-ui-green',
      warning: 'bg-afds-extra-ui-yellow',
      error: 'bg-afds-extra-ui-red',
    },
  },
})
