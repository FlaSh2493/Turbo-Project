'use client'

import { forwardRef } from 'react'
import { Typography } from '@turbo-project/afds/bricks'
import { cn } from '@turbo-project/afds/lib/utils'
import { ChevronDownIcon, ChevronUpIcon, EllipsisIcon } from 'lucide-react'
import { useComplexFilterContext } from './complex-filter.context'
import type { ComplexFilterActionsProps, ComplexFilterCollapseToggleProps } from './types'

export const CollapseToggle = forwardRef<HTMLButtonElement, ComplexFilterCollapseToggleProps>(
  ({ className }, ref) => {
    const { config, expanded, setExpanded } = useComplexFilterContext()
    const { labels, disabled } = config
    const Icon = expanded ? ChevronUpIcon : ChevronDownIcon
    return (
      <button
        ref={ref}
        type="button"
        data-slot="complex-filter-collapse-toggle"
        aria-expanded={expanded}
        aria-label={expanded ? labels.toggle.collapse : labels.toggle.expand}
        disabled={disabled}
        className={cn(
          'flex cursor-pointer items-center justify-center disabled:cursor-default',
          className,
        )}
        onClick={() => setExpanded(!expanded)}
        data-testid="complex-filter-toggle"
      >
        <Icon width={16} height={16} className="text-afds-icon-disabled" aria-hidden />
      </button>
    )
  },
)
CollapseToggle.displayName = 'ComplexFilter.CollapseToggle'

/** 바 우측 그룹: … 지우기 ⌃. 칩이 여러 줄이어도 첫 줄(높이 34)에 고정한다 */
export const Actions = forwardRef<HTMLDivElement, ComplexFilterActionsProps>(
  ({ children, className }, ref) => {
    const { config, expanded, overflowing, canClear, clear } = useComplexFilterContext()
    const { labels, disabled } = config
    return (
      <div
        ref={ref}
        data-slot="complex-filter-actions"
        className={cn(
          'flex h-afds-spacing-34 shrink-0 items-center gap-afds-spacing-10 self-start',
          className,
        )}
        data-testid="complex-filter-actions"
      >
        {!expanded && overflowing && (
          <span className="flex items-center justify-center" data-testid="complex-filter-overflow">
            <EllipsisIcon width={16} height={16} className="text-afds-icon-disabled" aria-hidden />
            <span className="sr-only">{labels.hiddenChips}</span>
          </span>
        )}
        <button
          type="button"
          disabled={disabled || !canClear}
          className="cursor-pointer disabled:cursor-default disabled:opacity-40"
          onClick={clear}
          data-testid="complex-filter-clear"
        >
          <Typography as="span" variant="body3" color="text-primary">
            {labels.clear}
          </Typography>
        </button>
        {children === undefined ? <CollapseToggle /> : children}
      </div>
    )
  },
)
Actions.displayName = 'ComplexFilter.Actions'
