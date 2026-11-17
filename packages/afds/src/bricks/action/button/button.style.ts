import { cva } from 'class-variance-authority'

export const buttonVariants = cva(
  'cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-afds-sm transition-all duration-150 flex-shrink-0 disabled:pointer-events-none [&_svg]:flex-shrink-0 [&:focus:not(:focus-visible)]:outline-none',
  {
    variants: {
      variant: {
        fill: 'bg-afds-bg-brand text-afds-text-inverse hover:bg-[color-mix(in_srgb,var(--afds-color-brand-700),black_3%)] disabled:bg-afds-bg-disabled',
        'primary-line':
          'border border-afds-border-brand-subtle bg-afds-bg-surface text-afds-text-brand-subtle hover:bg-afds-interaction-hover-overlay active:bg-afds-interaction-selected-overlay disabled:border-afds-border-strong disabled:text-afds-text-disabled',
        line: 'border border-afds-border-strong bg-afds-bg-surface text-afds-text-primary hover:bg-afds-interaction-hover-overlay active:border-afds-border-brand-subtle active:bg-afds-interaction-selected-overlay active:text-afds-text-brand-subtle disabled:border-afds-border-strong disabled:text-afds-text-disabled',
        ghost:
          'bg-transparent text-afds-text-primary hover:bg-afds-interaction-hover-overlay active:bg-afds-interaction-selected-overlay active:text-afds-text-brand-subtle disabled:text-afds-text-disabled',
        danger:
          'border border-afds-border-error bg-afds-bg-surface text-afds-text-error hover:bg-afds-interaction-hover-overlay active:bg-afds-bg-surface disabled:border-afds-border-strong disabled:text-afds-text-disabled',
      },
      size: {
        lg: 'h-afds-spacing-44 px-afds-spacing-20 gap-afds-spacing-8 title2 min-w-[84px]',
        md: 'h-afds-spacing-34 px-afds-spacing-14 gap-afds-spacing-8 title3 min-w-[64px]',
        sm: 'h-afds-spacing-24 px-afds-spacing-8 gap-afds-spacing-4 title4 min-w-afds-spacing-44',
        'icon-xs': 'w-[16px] h-[16px]',
        'icon-sm': 'w-afds-spacing-24 h-afds-spacing-24',
        'icon-lg': 'w-afds-spacing-44 h-afds-spacing-44',
      },
    },
    defaultVariants: {
      variant: 'fill',
      size: 'md',
    },
    compoundVariants: [],
  },
)
