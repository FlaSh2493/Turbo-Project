import { cva } from 'class-variance-authority'

export const tabListVariants = cva('relative flex gap-5 border-b border-afds-divider-default')

export const tabTriggerVariants = cva(
  [
    'relative cursor-pointer pt-2.5 pb-2 title2 transition-colors',
    'border-b-2 border-transparent',
    'hover:border-afds-divider-default',
    'aria-selected:text-afds-text-brand-subtle aria-selected:border-afds-border-brand-subtle',
    'not-aria-selected:text-afds-text-disabled',
  ].join(' '),
)
