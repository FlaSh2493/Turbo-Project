'use client'

import { Popover, Typography } from '@turbo-project/afds/bricks'
import { ChevronDownIcon } from 'lucide-react'
import { forwardRef, useState } from 'react'
import { cn } from '@turbo-project/afds/lib/utils'
import { useComplexFilterContext } from './complex-filter.context'
import type { ComplexFilterMatchMode, ComplexFilterMatchModeProps } from './types'

export const MatchMode = forwardRef<HTMLDivElement, ComplexFilterMatchModeProps>(
  ({ className }, ref) => {
    const { config } = useComplexFilterContext()
    const { matchMode } = config
    if (!matchMode) return null
    return (
      <div
        ref={ref}
        data-slot="complex-filter-match-mode"
        className={cn(
          'flex h-afds-spacing-34 shrink-0 items-center gap-afds-spacing-14',
          className,
        )}
      >
        <MatchModeSelect
          matchMode={matchMode}
          portalContainer={config.portalContainer}
          disabled={config.disabled}
        />
        {/* 구분선 18 = 첫 줄 34 − 위아래 마진 8×2 */}
        <span
          aria-hidden
          className="my-afds-spacing-8 w-px shrink-0 self-stretch bg-afds-border-strong"
        />
      </div>
    )
  },
)
MatchMode.displayName = 'ComplexFilter.MatchMode'

interface MatchModeSelectProps {
  matchMode: ComplexFilterMatchMode
  portalContainer?: HTMLElement | null
  disabled?: boolean
}

function MatchModeSelect({ matchMode, portalContainer, disabled = false }: MatchModeSelectProps) {
  const [open, setOpen] = useState(false)
  const current = matchMode.options.find(option => option.value === matchMode.value)

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        aria-label={matchMode.ariaLabel}
        disabled={disabled}
        // WHY: 운영센터처럼 트리거 박스에 좌측 패딩을 두고(라벨은 박스 왼쪽 +14), 박스를 바 패딩만큼 당겨 라벨이 시안 위치(바 +14)에 남게 한다.
        // 박스 좌측 = 카드 좌측이다. 시안의 카드 안 항목 라벨은 카드 +20(패딩 10 + 행 px 10)이라 트리거 라벨(+14)과 6px 어긋난다
        className="-ml-afds-spacing-14 flex shrink-0 cursor-pointer items-center gap-[6px] pl-afds-spacing-14 disabled:cursor-default"
        data-testid="complex-filter-match-mode"
      >
        <Typography as="span" variant="body2" color="text-primary">
          {current?.label ?? matchMode.value}
        </Typography>
        <ChevronDownIcon width={16} height={16} className="text-afds-icon-primary" aria-hidden />
      </Popover.Trigger>
      <Popover.Content
        align="start"
        aria-label={matchMode.ariaLabel}
        className="w-[130px] overflow-hidden p-afds-spacing-10! rounded-afds-sm! shadow-afds-1!"
        container={portalContainer ?? undefined}
        side="bottom"
        sideOffset={5}
      >
        <ul className="flex flex-col gap-afds-spacing-4">
          {matchMode.options.map(option => {
            const selected = option.value === matchMode.value
            return (
              <li key={option.value}>
                <button
                  type="button"
                  aria-pressed={selected}
                  className={`flex h-afds-spacing-34 w-full cursor-pointer items-center rounded-afds-sm px-afds-spacing-10 text-left outline-none ${
                    selected
                      ? 'bg-afds-interaction-selected-overlay focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-afds-border-focus'
                      : 'hover:bg-afds-bg-surface-sunken focus-visible:bg-afds-bg-surface-sunken'
                  }`}
                  onClick={() => {
                    matchMode.onChange(option.value)
                    setOpen(false)
                  }}
                  data-testid={`complex-filter-match-${option.value}`}
                >
                  <Typography
                    as="span"
                    variant="body3"
                    color={selected ? 'text-brand-subtle' : 'text-primary'}
                    className="block min-w-0 truncate"
                    title={option.label}
                  >
                    {option.label}
                  </Typography>
                </button>
              </li>
            )
          })}
        </ul>
      </Popover.Content>
    </Popover.Root>
  )
}
