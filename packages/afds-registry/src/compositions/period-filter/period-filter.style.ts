import { cva } from 'class-variance-authority'

export const optionItemVariants = cva(
  'flex w-full items-center rounded-[5px] h-[34px] px-2.5 body3 cursor-pointer transition-colors hover:bg-afds-interaction-hover-overlay select-none',
  {
    variants: {
      selected: {
        true: 'bg-afds-brand-100 text-afds-text-brand-subtle',
        false: 'text-afds-text-primary',
      },
    },
    defaultVariants: {
      selected: false,
    },
  },
)

export const accordionPanel =
  'box-border h-[var(--accordion-panel-height)] overflow-hidden transition-[height] duration-150 ease-out data-[starting-style]:h-0 data-[ending-style]:h-0'
