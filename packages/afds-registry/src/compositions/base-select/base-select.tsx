'use client'

import { forwardRef, useMemo, useState } from 'react'
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

import { OverflowTooltip } from '../overflow-tooltip'

interface BaseSelectOption {
  value: string
  label: string
}

/**
 * loading/빈/목록 분기를 context로 흡수하는 내부 컴포넌트.
 * Select.List/Fallback은 self-gating하지 않으므로 여기서 조건부 마운트한다.
 */
function SelectResults({ items, emptyText }: { items: BaseSelectOption[]; emptyText: string }) {
  const { loading } = useSelectContext()
  if (loading)
    return (
      <Select.Fallback>
        <Spinner size="sm" fullscreen="static" />
      </Select.Fallback>
    )
  if (items.length === 0) return <Select.Fallback>{emptyText}</Select.Fallback>
  return (
    <Select.List>
      {items.map(opt => (
        <Select.Item key={opt.value} value={opt.value}>
          <OverflowTooltip
            content={opt.label}
            side="top"
            showArrow={false}
            className="min-w-0 flex-1"
          >
            {opt.label}
          </OverflowTooltip>
        </Select.Item>
      ))}
    </Select.List>
  )
}

interface BaseSelectProps extends Omit<
  SelectRootProps,
  'value' | 'options' | 'onValueChange' | 'children' | 'className' | 'size'
> {
  options: BaseSelectOption[]
  value: string
  onValueChange: (value: string) => void
  className?: string
  rootClassName?: string
  contentWidth?: string
  /**
   * 드롭다운 정렬 기준
   * @default 'start'
   */
  align?: SelectContentProps['align']
  hasSearch?: boolean
  searchPlaceholder?: string
  placeholder?: string
  readOnly?: boolean
  error?: boolean
  size?: SelectSize
  /**
   * 옵션이 없을 때(검색 결과 0건 포함) 표시할 텍스트.
   * @default hasSearch ? 'No results' : 'No options'
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

export const BaseSelect = forwardRef<HTMLButtonElement, BaseSelectProps>(
  (
    {
      options,
      value,
      onValueChange,
      className,
      rootClassName,
      contentWidth,
      align = 'start',
      hasSearch = false,
      searchPlaceholder,
      placeholder,
      disabled = false,
      readOnly = false,
      error = false,
      size = 'sm',
      emptyText,
      loading = false,
      triggerRender,
      ...rest
    },
    ref,
  ) => {
    const [search, setSearch] = useState('')
    // 표시용 목록만 검색으로 필터한다. 라벨 해석은 root에 전체 options를 넘겨 보장한다.
    const filtered = useMemo(
      () =>
        hasSearch
          ? options.filter(o => o.label.toLowerCase().includes(search.trim().toLowerCase()))
          : options,
      [options, search, hasSearch],
    )
    return (
      <Select
        value={value}
        options={options}
        onValueChange={onValueChange}
        className={cn('min-w-0 overflow-hidden', rootClassName)}
        size={size}
        disabled={disabled}
        loading={loading}
        {...rest}
      >
        <Select.Trigger
          ref={ref}
          className={cn('w-[130px]', className)}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          error={error}
          render={triggerRender}
        />
        <Select.Content
          // eslint-disable-next-line no-restricted-syntax -- prop으로 받은 contentWidth를 적용
          style={contentWidth ? { width: contentWidth } : undefined}
          align={align}
        >
          {hasSearch && (
            <Select.Search value={search} onChange={setSearch} placeholder={searchPlaceholder} />
          )}
          <SelectResults
            items={filtered}
            emptyText={emptyText ?? (hasSearch ? 'No results' : 'No options')}
          />
        </Select.Content>
      </Select>
    )
  },
)

BaseSelect.displayName = 'BaseSelect'
