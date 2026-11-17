import { cva } from 'class-variance-authority'

export const squareBadgeRootVariants = cva(
  'inline-flex items-center justify-center gap-1.5 rounded-afds-sm p-afds-spacing-4',
  {
    variants: {
      variant: {
        filled: 'body3',
        outlined: 'title4 bg-transparent outline outline-1',
      },
      color: {
        brand: '',
        neutral: '',
        success: '',
        warning: '',
        error: '',
        'gradient-ai': '',
      },
    },
    compoundVariants: [
      // filled
      {
        variant: 'filled',
        color: 'brand',
        class: 'bg-afds-bg-brand-subtle text-afds-text-inverse',
      },
      {
        variant: 'filled',
        color: 'neutral',
        class: 'bg-afds-bg-disabled text-afds-text-secondary',
      },
      {
        variant: 'filled',
        color: 'success',
        class: 'bg-afds-extra-ui-green text-afds-text-inverse',
      },
      {
        variant: 'filled',
        color: 'warning',
        class: 'bg-afds-extra-ui-yellow text-afds-text-inverse',
      },
      { variant: 'filled', color: 'error', class: 'bg-afds-extra-ui-red text-afds-text-inverse' },
      {
        variant: 'filled',
        color: 'gradient-ai',
        class: 'bg-gradient-ai text-afds-text-inverse',
      },
      // outlined
      {
        variant: 'outlined',
        color: 'brand',
        class: 'outline-afds-border-brand-subtle text-afds-border-brand-subtle',
      },
      {
        variant: 'outlined',
        color: 'neutral',
        class: 'outline-afds-border-default text-afds-text-secondary',
      },
      {
        variant: 'outlined',
        color: 'success',
        class: 'outline-afds-extra-ui-green text-afds-extra-ui-green',
      },
      {
        variant: 'outlined',
        color: 'warning',
        class: 'outline-afds-extra-ui-yellow text-afds-extra-ui-yellow',
      },
      {
        variant: 'outlined',
        color: 'error',
        class: 'outline-afds-border-error text-afds-border-error',
      },
      {
        variant: 'outlined',
        color: 'gradient-ai',
        class: 'outline-none border-gradient-ai text-gradient-ai',
      },
    ],
    defaultVariants: { variant: 'filled', color: 'neutral' },
  },
)
