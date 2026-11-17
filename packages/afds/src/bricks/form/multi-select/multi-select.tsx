'use client'

import * as React from 'react'
import { Menu } from '@base-ui/react'
import { cn } from '../../../lib/utils'
import {
  useResolvedPortalContainer,
  type PortalContainer,
} from '../../../hooks/use-resolved-portal-container'
import { composeEventHandlers } from '../../../lib/compose-event-handlers'
import { mergeRefs } from '../../../lib/slot'
import { useAutoFocusWithRef } from '../../../lib/use-auto-focus-with-ref'
import {
  MultiSelectContext,
  useMultiSelectContext,
  useMultiSelect,
  type SelectOption,
  type MultiSelectContextValue,
} from '../../../headless/multi-select'

import { triggerVariants, itemVariants, contentVariants } from './multi-select.style'
import { ScrollArea, type ScrollAreaProps } from '../../layout/scroll-area'
import { Input } from '../input'
import { CheckBox } from '../check-box'
import { CircleXIcon, ChevronDownIcon } from 'lucide-react'

// MultiSelect Components

export type MultiSelectSize = 'sm' | 'md'

export interface MultiSelectRootProps extends Pick<
  React.InputHTMLAttributes<HTMLInputElement>,
  'name' | 'required' | 'disabled'
> {
  /** Uncontrolled 기본값 */
  defaultValue?: string[]
  /** Controlled 확정 선택값 */
  value?: string[]
  /** 선택 가능한 옵션 목록 */
  options?: SelectOption[]
  /**
   * 선택값이 변경될 때 호출. 아이템 토글 즉시 발화된다.
   * Confirm/Cancel UX가 필요하면 소비자가 외부에서 pending state를 관리하고 Modal 등으로 감싼다.
   */
  onValueChange?: (value: string[]) => void
  /** Controlled 드롭다운 열림 상태 */
  open?: boolean
  /** 열림 상태 변경 콜백 */
  onOpenChange?: (open: boolean) => void
  /**
   * MultiSelect 크기. 모든 sub-component에 컨텍스트로 전파된다.
   * @default 'sm'
   */
  size?: MultiSelectSize
  /**
   * 로딩 상태. context로 노출될 뿐 가시성을 자동 제어하지 않는다.
   * `MultiSelect.Fallback`/`List`는 self-gating하지 않으므로, 소비자가 이 값으로 조건부 마운트한다.
   * @default false
   */
  loading?: boolean
  /** MultiSelect 컴파운드 자식 (Trigger, Content 등) */
  children: React.ReactNode
  /** 최상위 컨테이너 CSS 클래스 */
  className?: string
}

const MultiSelectRoot = React.forwardRef<HTMLDivElement, MultiSelectRootProps>(
  (
    {
      children,
      size = 'sm',
      className,
      defaultValue,
      value,
      options = [],
      onValueChange,
      open,
      onOpenChange,
      name,
      required,
      disabled,
      loading = false,
    },
    ref,
  ) => {
    const hookResult = useMultiSelect({
      value,
      defaultValue,
      options,
      onValueChange,
      open,
      onOpenChange,
    })

    const contextValue: MultiSelectContextValue = {
      size,
      loading,
      ...hookResult,
    }

    const rootRef = React.useRef<HTMLDivElement>(null)

    return (
      <MultiSelectContext.Provider value={contextValue}>
        <Menu.Root open={hookResult.open} onOpenChange={hookResult.onOpenChange}>
          <div ref={mergeRefs(ref, rootRef)} className={cn('relative', className)}>
            {children}
            {name && (
              <>
                <input
                  aria-hidden
                  tabIndex={-1}
                  name={name}
                  value={hookResult.value[0] ?? ''}
                  required={required}
                  disabled={disabled}
                  onChange={() => {}}
                  className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
                />
                {hookResult.value.slice(1).map((v, i) => (
                  <input
                    key={`${v}-${i}`}
                    aria-hidden
                    tabIndex={-1}
                    name={name}
                    value={v}
                    disabled={disabled}
                    onChange={() => {}}
                    className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
                  />
                ))}
              </>
            )}
          </div>
        </Menu.Root>
      </MultiSelectContext.Provider>
    )
  },
)

MultiSelectRoot.displayName = 'MultiSelectRoot'

/** Trigger 우측 indicator(열림 화살표) 렌더러. `open`에 따라 회전한다. */
const renderTriggerIndicator = (indicator: React.ReactNode, open: boolean, readOnly: boolean) => (
  <span
    data-slot="select-indicator"
    data-open={open}
    className={cn(
      'h-4 w-4 shrink-0 transition-transform data-[open=true]:rotate-180',
      readOnly ? 'text-afds-text-secondary' : 'text-afds-text-primary',
    )}
  >
    {indicator ?? <ChevronDownIcon size={16} className="h-full w-full" />}
  </span>
)

export interface MultiSelectTriggerRenderState {
  /**
   * 현재 확정된 선택값. render 콜백은 값이 있을 때만 호출되므로 최소 1개 보장.
   */
  value: [string, ...string[]]
  /**
   * 현재 선택값을 allOptions에서 resolve한 결과. render 콜백은 값이 있을 때만
   * 호출되므로 최소 1개 보장.
   */
  selectedOptions: [SelectOption, ...SelectOption[]]
  /** dropdown 열림 여부 */
  open: boolean
}

export interface MultiSelectTriggerProps extends Omit<
  Menu.Trigger.Props,
  'children' | 'className' | 'render'
> {
  /** 트리거 CSS 클래스 */
  className?: string
  /**
   * placeholder 텍스트
   * @default 'Select'
   */
  placeholder?: string
  /**
   * 에러 상태 여부
   * @default false
   */
  error?: boolean
  /**
   * 읽기 전용 여부
   * @default false
   */
  readOnly?: boolean
  /**
   * 선택값이 있을 때 trigger value 영역의 콘텐츠를 커스텀한다.
   * 빈 상태(선택값 없음)는 AFDS가 `placeholder`로 자동 렌더하므로 빈 분기를 작성할 필요 없다.
   * render는 value 영역만 책임진다(우측 indicator는 `indicator` prop으로 별도 커스텀).
   *
   * @example
   * ```tsx
   * <MultiSelect.Trigger
   *   placeholder="선택"
   *   render={({ selectedOptions: [first, ...rest] }) =>
   *     rest.length > 0 ? `${first.label} 외 ${rest.length}개` : first.label
   *   }
   * />
   * ```
   */
  render?: (state: MultiSelectTriggerRenderState) => React.ReactNode
  /** 우측 indicator 아이콘. 미지정 시 기본 chevron(▾, 열림 시 회전)이 렌더된다. */
  indicator?: React.ReactNode
}

export const MultiSelectTrigger = React.forwardRef<HTMLButtonElement, MultiSelectTriggerProps>(
  (
    {
      className,
      placeholder = 'Select',
      error = false,
      disabled,
      readOnly = false,
      render,
      indicator,
      ...props
    },
    ref,
  ) => {
    const { value, open, size: appliedSize, allOptions } = useMultiSelectContext()

    const selectedOptions = React.useMemo<SelectOption[]>(() => {
      return value
        .map(v => allOptions.find(opt => opt.value === v))
        .filter((opt): opt is SelectOption => opt !== undefined)
    }, [value, allOptions])

    const hasRenderableSelection = selectedOptions.length > 0
    const defaultDisplayValue =
      selectedOptions.length > 1
        ? `${selectedOptions[0].label} +${selectedOptions.length - 1} more`
        : (selectedOptions[0]?.label ?? placeholder)

    const handlePointerDown = React.useCallback(
      (e: React.PointerEvent) => {
        if (readOnly) {
          e.preventDefault()
        }
      },
      [readOnly],
    )

    return (
      <Menu.Trigger
        ref={ref}
        disabled={disabled}
        data-slot="select-trigger"
        data-open={open}
        data-error={error}
        data-disabled={disabled}
        data-readonly={readOnly}
        data-completed={hasRenderableSelection}
        className={cn(triggerVariants({ size: appliedSize }), className)}
        {...props}
        onPointerDown={composeEventHandlers(props.onPointerDown, handlePointerDown)}
      >
        {hasRenderableSelection ? (
          <>
            {render ? (
              render({
                value: selectedOptions.map(o => o.value) as [string, ...string[]],
                selectedOptions: selectedOptions as [SelectOption, ...SelectOption[]],
                open,
              })
            ) : (
              <span data-slot="select-value" className="min-w-0 truncate">
                {defaultDisplayValue}
              </span>
            )}
            {renderTriggerIndicator(indicator, open, readOnly)}
          </>
        ) : (
          <>
            <span data-slot="select-value" data-placeholder="true" className="min-w-0 truncate">
              {placeholder}
            </span>
            {renderTriggerIndicator(indicator, open, readOnly)}
          </>
        )}
      </Menu.Trigger>
    )
  },
)
MultiSelectTrigger.displayName = 'MultiSelectTrigger'

export interface MultiSelectContentProps extends Omit<Menu.Popup.Props, 'children'> {
  /**
   * 포털 컨테이너. 미지정 시 `<AfdsScope>` 컨텍스트 → `document.body` 순으로 해석된다.
   * 명시 `null` 은 **포털을 렌더하지 않는다**(선언형 base-ui Portal 의 동작) — body opt-out 이
   * 아니다. body 로 보내려면 `document.body` 를 직접 넘겨라. (실측 확인)
   *
   * 모달 안에서 쓰면 `<Modal.Content>` 가 자기 노드로 컨텍스트를 재공급하므로 **미지정이 정답**이다 —
   * 드롭다운이 모달 DOM 안에 머문다. 이것이 없던 시절 소비처는 모달 안에서 이 컴포넌트를 포기하고
   * `relative`+`absolute` 목록을 손으로 만들었다(upstream #675).
   */
  container?: PortalContainer
  sideOffset?: number
  align?: 'start' | 'center' | 'end'
  side?: 'top' | 'right' | 'bottom' | 'left'
  children: React.ReactNode
}

export const MultiSelectContent = React.forwardRef<HTMLDivElement, MultiSelectContentProps>(
  (
    {
      className,
      children,
      style,
      container,
      sideOffset = 4,
      align = 'start',
      side = 'bottom',
      ...props
    },
    ref,
  ) => {
    const resolvedContainer = useResolvedPortalContainer(container)
    return (
      <Menu.Portal container={resolvedContainer}>
        <Menu.Positioner side={side} sideOffset={sideOffset} align={align}>
          <Menu.Popup
            ref={ref}
            data-slot="select-content"
            className={cn(contentVariants(), className)}
            style={{ width: 'var(--anchor-width)', ...style }}
            {...props}
          >
            {children}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    )
  },
)
MultiSelectContent.displayName = 'MultiSelectContent'

export const MultiSelectSearch = React.forwardRef<
  HTMLInputElement,
  {
    className?: string
    placeholder?: string
    /** 검색어 (controlled). 검색 상태는 소비자가 외부에서 소유한다. */
    value: string
    /** 검색어 변경 콜백 (controlled). */
    onChange: (value: string) => void
  }
>(({ className, placeholder = 'placeholder', value, onChange }, ref) => {
  const inputRef = useAutoFocusWithRef<HTMLInputElement>(ref)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) {
      return
    }

    // ArrowDown/Up은 막지 않고 그대로 흘려보낸다 — 같은 Popup의 base-ui keydown
    // 핸들러로 버블링되어 옵션 네비게이션이 동작한다. (아래 stopPropagation은 화살표가
    // 아닌 키만 막으므로 여기서 early-return 해야 화살표가 base-ui까지 도달한다.)
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      return
    }
    e.stopPropagation()
  }

  return (
    <Input.Root size="sm" data-slot="select-search" className={cn('mb-2', className)}>
      <Input.Field
        ref={inputRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onKeyDown={handleKeyDown}
      />
      {value && (
        <Input.ClearButton onClick={() => onChange('')}>
          <CircleXIcon size={16} className="h-4 w-4" />
        </Input.ClearButton>
      )}
    </Input.Root>
  )
})

MultiSelectSearch.displayName = 'MultiSelectSearch'

export interface MultiSelectFooterProps {
  /** 자식 — 보통 Reset/Cancel/Confirm 버튼들. */
  children?: React.ReactNode
  /** 푸터 CSS 클래스 */
  className?: string
}

/**
 * MultiSelect 드롭다운 하단의 표준 button-group 레이아웃 컨테이너.
 *
 * **layout-only** — Confirm/Cancel/Reset 등의 동작 책임은 갖지 않는다.
 * 펜딩(draft) UX가 필요하면 외부에서 `useMultiSelectDraft` hook을 호출해
 * 그 결과를 children 버튼에 wire한다.
 *
 * @example
 * ```tsx
 * const draft = useMultiSelectDraft({ committed, setCommitted, isOpen: open, setOpen })
 *
 * <MultiSelect.Footer>
 *   <Button variant="ghost" size="sm" onClick={draft.reset}>초기화</Button>
 *   <div className="ml-auto flex gap-1">
 *     <Button variant="line" size="sm" onClick={draft.cancel}>취소</Button>
 *     <Button variant="line" size="sm" onClick={draft.confirm} disabled={!draft.isDirty}>확인</Button>
 *   </div>
 * </MultiSelect.Footer>
 * ```
 */
export const MultiSelectFooter = React.forwardRef<HTMLDivElement, MultiSelectFooterProps>(
  ({ children, className }, ref) => (
    <div
      ref={ref}
      data-slot="select-footer"
      className={cn('mt-2 flex items-center gap-1', className)}
    >
      {children}
    </div>
  ),
)

MultiSelectFooter.displayName = 'MultiSelectFooter'

export interface MultiSelectItemProps extends Omit<Menu.Item.Props, 'children' | 'className'> {
  /** 아이템 값 */
  value: string
  /** 아이템 표시 콘텐츠 */
  children?: React.ReactNode
  /** 아이템 CSS 클래스 */
  className?: string
}

export const MultiSelectItem = React.forwardRef<HTMLDivElement, MultiSelectItemProps>(
  ({ className, children, value, ...props }, ref) => {
    const { onItemSelect, value: selectedValues, size } = useMultiSelectContext()
    const isSelected = selectedValues.includes(value)

    // 글자로만 된 이름만 한 줄로 자른다. 요소 children 은 항목의 flex 배치에 기대므로
    // (afds-registry base-multi-select 의 `min-w-0 flex-1` 툴팁 래퍼 등) 감싸면 그 배치가 깨진다.
    const parts = React.Children.toArray(children)
    const label =
      parts.length > 0 && parts.every(p => typeof p === 'string' || typeof p === 'number')
        ? parts.join('')
        : null

    return (
      <Menu.Item
        ref={ref}
        data-slot="select-item"
        data-value={value}
        data-selected={isSelected}
        closeOnClick={false}
        className={cn(
          itemVariants({ size }),
          size === 'md' ? 'gap-[14px]' : 'gap-[10px]',
          className,
        )}
        {...props}
        onClick={composeEventHandlers(props.onClick, () => onItemSelect(value))}
      >
        <div className="group/cbx flex-shrink-0" onClick={e => e.stopPropagation()}>
          <CheckBox.Root
            checked={isSelected}
            disabled={props.disabled}
            tabIndex={-1}
            onCheckedChange={() => onItemSelect(value)}
          >
            <CheckBox.Indicator />
          </CheckBox.Root>
        </div>
        {label === null ? (
          children
        ) : (
          <span
            data-slot="select-item-label"
            className="min-w-0 truncate"
            title={props.title === undefined ? label : undefined}
          >
            {children}
          </span>
        )}
      </Menu.Item>
    )
  },
)
MultiSelectItem.displayName = 'MultiSelectItem'

export interface MultiSelectListProps extends Omit<ScrollAreaProps, 'className'> {
  className?: string
  type?: 'always' | 'auto' | 'hover' | 'scroll'
  /** 옵션 아이템들 (`MultiSelect.Item`). 소비자가 직접 구성한다. */
  children: React.ReactNode
}

/**
 * 옵션 목록(스크롤 영역) presentational 컨테이너.
 * **가시성은 스스로 결정하지 않는다** — loading/빈 상태 분기는 소비자가 조건부 마운트로 처리한다.
 */
export const MultiSelectList = React.forwardRef<HTMLDivElement, MultiSelectListProps>(
  ({ className, type: _type = 'always', viewportClassName, children, ...props }, ref) => {
    const { size } = useMultiSelectContext()

    return (
      <ScrollArea
        ref={ref}
        data-slot="select-list"
        hideHorizontal
        viewportClassName={cn('h-full max-h-[300px]', viewportClassName)}
        {...props}
      >
        <div className={cn('flex flex-col', size === 'md' ? 'gap-2' : 'gap-1', className)}>
          {children}
        </div>
      </ScrollArea>
    )
  },
)

MultiSelectList.displayName = 'MultiSelectList'

export interface MultiSelectFallbackProps {
  /** 빈/로딩 등 fallback 상태에 표시할 콘텐츠 (텍스트, Spinner 등) */
  children: React.ReactNode
  /** 추가 className */
  className?: string
}

/**
 * 빈/로딩 등 fallback 콘텐츠를 표시하는 presentational 컨테이너.
 * **가시성을 스스로 결정하지 않는다** — 소비자가 loading/빈 상태일 때 조건부로 마운트한다.
 */
export const MultiSelectFallback = ({ children, className }: MultiSelectFallbackProps) => {
  return (
    <div
      data-slot="select-fallback"
      className={cn(
        'title4 flex items-center justify-center py-4 text-afds-text-disabled',
        className,
      )}
    >
      {children}
    </div>
  )
}

MultiSelectFallback.displayName = 'MultiSelectFallback'

export const MultiSelect = Object.assign(MultiSelectRoot, {
  Trigger: MultiSelectTrigger,
  Content: MultiSelectContent,
  Search: MultiSelectSearch,
  Footer: MultiSelectFooter,
  Item: MultiSelectItem,
  List: MultiSelectList,
  Fallback: MultiSelectFallback,
})
