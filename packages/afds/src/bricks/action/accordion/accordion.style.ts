export const accordionRootBase = 'flex flex-col gap-afds-spacing-8'

export const accordionItemBase =
  'rounded-afds-sm border border-afds-border-strong overflow-hidden bg-afds-bg-surface data-[disabled]:border-afds-border-default'

export const accordionTriggerBase =
  'flex w-full items-center justify-between p-afds-spacing-20 cursor-pointer select-none transition-colors text-afds-text-primary data-[disabled]:text-afds-text-disabled data-[disabled]:pointer-events-none'

export const accordionContentBase =
  'box-border h-[var(--accordion-panel-height)] overflow-hidden transition-[height] duration-150 ease-out data-[starting-style]:h-0 data-[ending-style]:h-0'

export const accordionBodyBase = 'px-afds-spacing-20 pb-afds-spacing-20'

export const accordionIndicatorBase =
  'shrink-0 transition-transform duration-200 group-data-[panel-open]:rotate-180'
