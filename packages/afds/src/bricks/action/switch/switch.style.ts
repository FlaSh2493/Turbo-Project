import { cva } from 'class-variance-authority'

export const switchRootBase = cva([
  'inline-flex h-5 w-[34px] flex-shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200',
  'group',
  'bg-afds-bg-disabled data-[checked]:bg-afds-bg-selected',
  'data-[disabled]:cursor-not-allowed data-[disabled]:bg-afds-bg-disabled',
])

export const switchThumbBase = cva([
  'pointer-events-none block h-4 w-4 rounded-full bg-afds-bg-surface transition-transform duration-200',
  'translate-x-0.5 group-data-[checked]:translate-x-4',
  'group-data-[disabled]:bg-afds-gray-400',
])
