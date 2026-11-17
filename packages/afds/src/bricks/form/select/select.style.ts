import { cva } from 'class-variance-authority'

export const triggerVariants = cva(
  [
    'flex w-full items-center justify-between rounded-[5px] border transition-[color,background-color,border-color] duration-150 [&:focus:not(:focus-visible)]:outline-none',
    'border-afds-border-default bg-afds-bg-surface-sunken text-afds-text-primary',
    '[&[data-open=true]:not([data-error=true]):not([data-disabled=true]):not([data-readonly=true])]:bg-afds-bg-surface [&[data-open=true]:not([data-error=true]):not([data-disabled=true]):not([data-readonly=true])]:border-afds-border-focus',
    '[&[data-error=true]:not([data-disabled=true])]:bg-afds-bg-surface [&[data-error=true]:not([data-disabled=true])]:border-afds-border-error [&[data-error=true]:not([data-disabled=true])]:text-afds-text-error',
    '[&[data-readonly=true]:not([data-disabled=true])]:bg-afds-bg-surface [&[data-readonly=true]:not([data-disabled=true])]:cursor-default',
    'data-[disabled=true]:cursor-not-allowed data-[disabled=true]:bg-afds-bg-disabled data-[disabled=true]:text-afds-text-disabled',
    '[&_[data-placeholder=true]]:text-afds-text-disabled',
    '[&[data-error=true]_[data-placeholder=true]]:text-afds-text-error',
    '[&[data-disabled=true]_[data-placeholder=true]]:text-afds-text-disabled',
  ],
  {
    variants: {
      size: {
        md: 'h-11 px-3.5 body2',
        sm: 'h-[34px] px-2.5 body3',
      },
    },
    defaultVariants: {
      size: 'sm',
    },
  },
)

export const contentVariants = cva(
  'z-50 min-w-[8rem] overflow-x-hidden overflow-y-auto rounded-[5px] bg-afds-bg-surface p-2.5 text-afds-text-primary shadow-afds-1 animate-in fade-in-0 zoom-in-95 duration-100',
)

export const itemVariants = cva(
  [
    'relative flex flex-shrink-0 cursor-pointer items-center rounded-[5px] transition-[background-color,color] duration-150 outline-none select-none',
    'text-afds-text-primary',
    'data-[selected=true]:text-afds-text-brand-subtle',
    'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
    'data-[highlighted]:bg-afds-bg-surface-sunken',
  ],
  {
    variants: {
      size: {
        md: 'h-11 px-2.5 body2',
        sm: 'h-[34px] px-2.5 body3',
      },
    },
    defaultVariants: {
      size: 'sm',
    },
  },
)
