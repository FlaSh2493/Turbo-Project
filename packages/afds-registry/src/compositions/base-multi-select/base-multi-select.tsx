'use client'

import { forwardRef, useMemo, useState } from 'react'
import {
  Button,
  MultiSelect,
  type MultiSelectContentProps,
  type MultiSelectRootProps,
  type MultiSelectSize,
  type MultiSelectTriggerProps,
} from '@turbo-project/afds/bricks'
import { useMultiSelectDraft } from '@turbo-project/afds/headless'
import { cn } from '@turbo-project/afds/lib/utils'

import { OverflowTooltip } from '../overflow-tooltip'

/**
 * 빈/목록 분기를 context로 흡수하는 내부 컴포넌트.
 * MultiSelect.List/Fallback은 self-gating하지 않으므로 여기서 조건부 마운트한다.
 */
function MultiSelectResults({
  items,
  emptyText,
}: {
  items: BaseMultiSelectOption[]
  emptyText: string
}) {
  if (items.length === 0) return <MultiSelect.Fallback>{emptyText}</MultiSelect.Fallback>
  return (
    <MultiSelect.List>
      {items.map(opt => (
        <MultiSelect.Item key={opt.value} value={opt.value}>
          <OverflowTooltip
            content={opt.label}
            side="top"
            showArrow={false}
            className="min-w-0 flex-1"
          >
            {opt.label}
          </OverflowTooltip>
        </MultiSelect.Item>
      ))}
    </MultiSelect.List>
  )
}

interface BaseMultiSelectOption {
  value: string
  label: string
}

interface BaseMultiSelectProps extends Omit<
  MultiSelectRootProps,
  'value' | 'options' | 'onValueChange' | 'children' | 'className' | 'size'
> {
  /** 선택 가능한 옵션 목록 */
  options: BaseMultiSelectOption[]
  /** 확정된 선택값 */
  value: string[]
  /**
   * 확정 선택값 변경 콜백.
   * - `hasFooter=true` (기본): Footer Confirm 버튼을 눌렀을 때만 호출된다.
   *   메뉴를 닫는 다른 경로(Cancel, 외부 클릭, Escape)에서는 변경이 commit 되지 않는다.
   * - `hasFooter=false`: Item 토글 즉시 호출된다.
   */
  onValueChange: (value: string[]) => void
  /** 트리거 CSS 클래스 */
  className?: string
  /** 루트 컨테이너 CSS 클래스 */
  rootClassName?: string
  /** 드롭다운 너비 (생략 시 트리거 너비를 따른다) */
  contentWidth?: string
  /**
   * 드롭다운 정렬 기준
   * @default 'start'
   */
  align?: MultiSelectContentProps['align']
  /**
   * 검색 입력 표시 여부
   * @default false
   */
  hasSearch?: boolean
  /** 검색 입력 플레이스홀더 */
  searchPlaceholder?: string
  /** 트리거 플레이스홀더 */
  placeholder?: string
  /**
   * 읽기 전용 여부
   * @default false
   */
  readOnly?: boolean
  /**
   * 에러 상태 여부
   * @default false
   */
  error?: boolean
  /**
   * 크기
   * @default 'sm'
   */
  size?: MultiSelectSize
  /**
   * Footer(확인·취소·초기화) 표시 여부
   * @default true
   */
  hasFooter?: boolean
  /** 확인 버튼 클릭 콜백. 값 commit 로직은 소비자가 직접 처리한다. */
  onConfirm?: () => void
  /**
   * 확인 버튼 텍스트
   * @default 'Confirm'
   */
  confirmText?: string
  /**
   * 취소 버튼 텍스트
   * @default 'Cancel'
   */
  cancelText?: string
  /**
   * 초기화 버튼 텍스트
   * @default 'Reset'
   */
  resetText?: string
  /**
   * 옵션이 없을 때 표시할 텍스트
   * @default 'No results' (hasSearch) | 'No options'
   */
  emptyText?: string
  /**
   * 선택값이 있을 때 trigger value 영역의 콘텐츠를 커스텀한다.
   * 빈 상태는 placeholder로 자동 렌더된다.
   */
  triggerRender?: MultiSelectTriggerProps['render']
}

export const BaseMultiSelect = forwardRef<HTMLButtonElement, BaseMultiSelectProps>(
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
      hasFooter = true,
      onConfirm,
      confirmText,
      cancelText,
      resetText,
      emptyText,
      triggerRender,
      onOpenChange: onOpenChangeProp,
      ...rest
    },
    ref,
  ) => {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')
    // 표시용 목록만 검색으로 필터한다. 라벨 해석은 root에 전체 options를 넘겨 보장한다.
    const filtered = useMemo(
      () =>
        hasSearch
          ? options.filter(o => o.label.toLowerCase().includes(search.trim().toLowerCase()))
          : options,
      [options, search, hasSearch],
    )

    const handleOpenChange = (next: boolean) => {
      setOpen(next)
      if (!next) setSearch('')
      onOpenChangeProp?.(next)
    }

    const draft = useMultiSelectDraft({
      committed: value,
      setCommitted: onValueChange,
      isOpen: open,
      setOpen,
    })

    const currentValue = hasFooter ? draft.value : value
    const handleValueChange = hasFooter ? draft.setValue : onValueChange

    const handleConfirm = () => {
      if (hasFooter) {
        draft.confirm()
      }
      onConfirm?.()
    }

    return (
      <MultiSelect
        open={open}
        onOpenChange={handleOpenChange}
        value={currentValue}
        options={options}
        onValueChange={handleValueChange}
        className={cn('min-w-0 overflow-hidden', rootClassName)}
        size={size}
        disabled={disabled}
        {...rest}
      >
        <MultiSelect.Trigger
          ref={ref}
          className={cn('w-[130px]', className)}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          error={error}
          render={triggerRender}
        />
        <MultiSelect.Content
          // eslint-disable-next-line no-restricted-syntax -- 내부 콘텐츠(특히 Footer) 너비에 맞춰 늘어나도록 width:max-content, 최소는 트리거 너비
          style={{
            width: contentWidth ?? 'max-content',
            minWidth: 'var(--anchor-width)',
          }}
          align={align}
        >
          {hasSearch && (
            <MultiSelect.Search
              value={search}
              onChange={setSearch}
              placeholder={searchPlaceholder}
            />
          )}
          <MultiSelectResults
            items={filtered}
            emptyText={emptyText ?? (hasSearch ? 'No results' : 'No options')}
          />
          {hasFooter && (
            <MultiSelect.Footer>
              <Button variant="ghost" size="sm" onClick={draft.reset}>
                {resetText ?? 'Reset'}
              </Button>
              <div className="ml-auto flex items-center gap-1">
                <Button variant="line" size="sm" onClick={draft.cancel}>
                  {cancelText ?? 'Cancel'}
                </Button>
                <Button variant="line" size="sm" onClick={handleConfirm} disabled={!draft.isDirty}>
                  {confirmText ?? 'Confirm'}
                </Button>
              </div>
            </MultiSelect.Footer>
          )}
        </MultiSelect.Content>
      </MultiSelect>
    )
  },
)

BaseMultiSelect.displayName = 'BaseMultiSelect'
