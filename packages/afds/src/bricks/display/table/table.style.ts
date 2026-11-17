import { cva } from 'class-variance-authority'

export const tableRootVariants = cva('w-full border-collapse')

export const tableHeaderVariants = cva('')

export const tableBodyVariants = cva('')

export const tableFooterVariants = cva('')

export const tableRowVariants = cva(
  'hover:bg-afds-interaction-hover-overlay transition-colors duration-150',
)

export const tableHeadVariants = cva(
  'border-b border-afds-divider-default bg-afds-bg-surface-sunken px-3 text-afds-text-primary title3',
  {
    variants: {
      size: {
        sm: 'h-[40px]',
        md: 'h-[60px]',
        lg: 'h-[80px]',
      },
    },
    defaultVariants: { size: 'md' },
  },
)

export const tableCellVariants = cva(
  'border-b border-afds-divider-default px-3 text-afds-text-primary body2',
  {
    variants: {
      size: {
        sm: 'h-[40px]',
        md: 'h-[60px]',
        lg: 'h-[80px]',
      },
    },
    defaultVariants: { size: 'md' },
  },
)

export type TableSize = 'sm' | 'md' | 'lg'
