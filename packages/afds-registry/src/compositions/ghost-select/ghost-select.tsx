'use client'

import { forwardRef } from 'react'
import {
  Select,
  Spinner,
  type SelectContentProps,
  type SelectRootProps,
  type SelectSize,
  type SelectTriggerProps,
} from '@turbo-project/afds/bricks'
import { useSelectContext } from '@turbo-project/afds/headless'
import { cn } from '@turbo-project/afds/lib/utils'

import { BaseTooltip } from '../base-tooltip'
import { OverflowTooltip } from '../overflow-tooltip'

import { InfoIcon } from 'lucide-react'

interface GhostSelectOption {
  value: string
  label: string
  tooltip?: string
}

/**
 * loading/빈/목록 분기를 context로 흡수하는 내부 컴포넌트.
 * Select.List/Fallback은 self-gating하지 않으므로 여기서 조건부 마운트한다.
 */
function GhostResults({ options, emptyText }: { options: GhostSelectOption[]; emptyText: string }) {
  const { options: ctxOptions, loading } = useSelectContext()
  if (loading)
    return (
      <Select.Fallback>
        <Spinner size="sm" fullscreen="static" />
      </Select.Fallback>
    )
  if (ctxOptions.length === 0) return <Select.Fallback>{emptyText}</Select.Fallback>
  const optionByValue = new Map(options.map(o => [o.value, o]))
  return (
    <Select.List>
      {ctxOptions.map(opt => {
        const original = optionByValue.get(opt.value)
        return (
          <Select.Item key={opt.value} value={opt.value}>
            {original?.tooltip ? (
              <>
                <span className="min-w-0 flex-1 truncate">{opt.label}</span>
                <BaseTooltip
                  content={original.tooltip}
                  contentProps={{ style: { maxWidth: '320px' }, className: 'caption1' }}
                >
                  <InfoIcon
                    size={16}
                    className={cn(
                      'h-4 w-4 shrink-0',
                      opt.selected ? 'text-inherit' : 'text-afds-text-secondary',
                    )}
                  />
                </BaseTooltip>
              </>
            ) : (
              <OverflowTooltip
                content={opt.label}
                side="top"
                showArrow={false}
                className="min-w-0 flex-1"
              >
                {opt.label}
              </OverflowTooltip>
            )}
          </Select.Item>
        )
      })}
    </Select.List>
  )
}

interface GhostSelectProps extends Omit<
  SelectRootProps,
  'value' | 'options' | 'onValueChange' | 'children' | 'className' | 'size'
> {
  options: GhostSelectOption[]
  value: string
  onValueChange: (value: string) => void
  className?: string
  contentClassName?: string
  contentAlign?: SelectContentProps['align']
  size?: SelectSize
  /**
   * 옵션이 없을 때 표시할 텍스트.
   * @default 'No options'
   */
  emptyText?: string
  /**
   * 로딩 상태. true면 옵션 대신 content 중앙에 Spinner를 표시한다.
   * @default false
   */
  loading?: boolean
  /**
   * 선택값이 있을 때 trigger value 영역의 콘텐츠를 커스텀한다.
   * 빈 상태는 placeholder로 자동 렌더된다.
   */
  triggerRender?: SelectTriggerProps['render']
}

export const GhostSelect = forwardRef<HTMLButtonElement, GhostSelectProps>(
  (
    {
      options,
      value,
      onValueChange,
      className,
      contentClassName,
      contentAlign = 'start',
      size = 'sm',
      emptyText = 'No options',
      loading = false,
      triggerRender,
      ...rest
    },
    ref,
  ) => {
    return (
      <Select
        value={value}
        options={options}
        onValueChange={onValueChange}
        size={size}
        loading={loading}
        {...rest}
      >
        <Select.Trigger
          ref={ref}
          className={cn(
            'title4 w-[130px] gap-1 border-0 bg-transparent hover:bg-afds-bg-surface-sunken data-[state=open]:bg-afds-bg-surface-sunken',
            className,
          )}
          render={triggerRender}
        />
        <Select.Content
          className={cn('min-w-[var(--radix-select-trigger-width)]', contentClassName)}
          align={contentAlign}
        >
          <GhostResults options={options} emptyText={emptyText} />
        </Select.Content>
      </Select>
    )
  },
)

GhostSelect.displayName = 'GhostSelect'
