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
  SelectContext,
  useSelectContext,
  useSelect,
  type SelectOption,
  type SelectContextValue,
} from '../../../headless/select'

import { triggerVariants, itemVariants, contentVariants } from './select.style'
import { ScrollArea, type ScrollAreaProps } from '../../layout/scroll-area'
import { Input } from '../input'
import { CircleXIcon, ChevronDownIcon } from 'lucide-react'

// Select Components

export type SelectSize = 'sm' | 'md'

export interface SelectRootProps extends Pick<
  React.InputHTMLAttributes<HTMLInputElement>,
  'name' | 'required' | 'disabled'
> {
  /** Uncontrolled 기본값 */
  defaultValue?: string
  /** Controlled 선택값 */
  value?: string
  /** 선택 가능한 옵션 목록 */
  options?: SelectOption[]
  /** 값이 변경될 때 호출 */
  onValueChange?: (value: string) => void
  /** Controlled 드롭다운 열림 상태 */
  open?: boolean
  /** 열림 상태 변경 콜백 */
  onOpenChange?: (open: boolean) => void
  /**
   * Select 크기. 모든 sub-component에 컨텍스트로 전파된다.
   * @default 'sm'
   */
  size?: SelectSize
  /**
   * 로딩 상태. context로 노출될 뿐 가시성을 자동 제어하지 않는다.
   * `Select.Fallback`/`List`는 self-gating하지 않으므로, 소비자가 이 값으로 조건부 마운트한다.
   * @default false
   */
  loading?: boolean
  /** Select 컴파운드 자식 (Trigger, Content 등) */
  children: React.ReactNode
  /** 최상위 컨테이너 CSS 클래스 */
  className?: string
}

const SelectRoot = React.forwardRef<HTMLDivElement, SelectRootProps>(
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
    const hookResult = useSelect({
      value,
      defaultValue,
      options,
      onValueChange,
      open,
      onOpenChange,
    })

    const contextValue: SelectContextValue = {
      size,
      loading,
      ...hookResult,
    }

    const rootRef = React.useRef<HTMLDivElement>(null)

    return (
      <SelectContext.Provider value={contextValue}>
        <Menu.Root open={hookResult.open} onOpenChange={hookResult.onOpenChange}>
          <div ref={mergeRefs(ref, rootRef)} className={cn('relative', className)}>
            {children}
            {name && (
              <input
                aria-hidden
                tabIndex={-1}
                name={name}
                value={hookResult.value ?? ''}
                required={required}
                disabled={disabled}
                onChange={() => {}}
                className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
              />
            )}
          </div>
        </Menu.Root>
      </SelectContext.Provider>
    )
  },
)

SelectRoot.displayName = 'SelectRoot'

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

export interface SelectTriggerRenderState {
  /** 현재 선택값. render 콜백은 값이 있을 때만 호출되므로 빈 문자열이 아님. */
  value: string
  /**
   * 현재 선택값을 allOptions에서 resolve한 SelectOption. render 콜백은 값이 있을 때만
   * 호출되므로 항상 존재한다.
   */
  selectedOption: SelectOption
  /** dropdown 열림 여부 */
  open: boolean
}

export interface SelectTriggerProps extends Omit<
  Menu.Trigger.Props,
  'children' | 'className' | 'render'
> {
  /** 트리거 CSS 클래스 */
  className?: string
  /**
   * placeholder 텍스트. render prop이 없을 때 선택값이 없으면 표시된다.
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
   * <Select.Trigger
   *   placeholder="선택"
   *   render={({ selectedOption }) => `선택: ${selectedOption.label}`}
   * />
   * ```
   */
  render?: (state: SelectTriggerRenderState) => React.ReactNode
  /** 우측 indicator 아이콘. 미지정 시 기본 chevron(▾, 열림 시 회전)이 렌더된다. */
  indicator?: React.ReactNode
}

export const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
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
    const { value, open, size: appliedSize, allOptions } = useSelectContext()
    const getLabel = (v: string) => {
      const option = allOptions.find(opt => opt.value === v)
      return option?.label ?? null
    }

    const hasValue = !!value
    const defaultDisplayValue = getLabel(value) ?? value

    const selectedOption = React.useMemo<SelectOption | null>(() => {
      if (!value) return null
      return allOptions.find(opt => opt.value === value) ?? null
    }, [value, allOptions])

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
        data-completed={hasValue}
        className={cn(triggerVariants({ size: appliedSize }), className)}
        {...props}
        onPointerDown={composeEventHandlers(props.onPointerDown, handlePointerDown)}
      >
        {hasValue ? (
          <>
            {render && selectedOption ? (
              render({ value, selectedOption, open })
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
SelectTrigger.displayName = 'SelectTrigger'

export interface SelectContentProps extends Omit<Menu.Popup.Props, 'children'> {
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

export const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
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
SelectContent.displayName = 'SelectContent'

export const SelectSearch = React.forwardRef<
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

SelectSearch.displayName = 'SelectSearch'

export interface SelectItemProps extends Omit<Menu.Item.Props, 'children' | 'className'> {
  /** 아이템 값 */
  value: string
  /** 아이템 표시 콘텐츠 */
  children?: React.ReactNode
  /** 아이템 CSS 클래스 */
  className?: string
}

export const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ className, children, value, ...props }, ref) => {
    const { size, value: contextValue, onItemSelect } = useSelectContext()
    const isSelected = value === contextValue

    const handleClick = React.useCallback(() => {
      onItemSelect(value)
    }, [onItemSelect, value])

    // 글자로만 된 이름만 한 줄로 자른다. 요소 children 은 항목의 flex 배치에 기대므로
    // (afds-registry base-select 의 `min-w-0 flex-1` 툴팁 래퍼 등) 감싸면 그 배치가 깨진다.
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
        className={cn(itemVariants({ size }), className)}
        closeOnClick
        {...props}
        onClick={composeEventHandlers(props.onClick, handleClick)}
      >
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
SelectItem.displayName = 'SelectItem'

export interface SelectListProps extends Omit<ScrollAreaProps, 'className'> {
  className?: string
  type?: 'always' | 'auto' | 'hover' | 'scroll'
  /** 옵션 아이템들 (`Select.Item`). 소비자가 직접 구성한다. */
  children: React.ReactNode
}

/**
 * 옵션 목록(스크롤 영역) presentational 컨테이너.
 * **가시성은 스스로 결정하지 않는다** — loading/빈 상태 분기는 소비자가 조건부 마운트로 처리한다.
 */
export const SelectList = React.forwardRef<HTMLDivElement, SelectListProps>(
  ({ className, type: _type = 'always', viewportClassName, children, ...props }, ref) => {
    const { size } = useSelectContext()

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

SelectList.displayName = 'SelectList'

export interface SelectFallbackProps {
  /** 빈/로딩 등 fallback 상태에 표시할 콘텐츠 (텍스트, Spinner 등) */
  children: React.ReactNode
  /** 추가 className */
  className?: string
}

/**
 * 빈/로딩 등 fallback 콘텐츠를 표시하는 presentational 컨테이너.
 * **가시성을 스스로 결정하지 않는다** — 소비자가 loading/빈 상태일 때 조건부로 마운트한다.
 */
export const SelectFallback = ({ children, className }: SelectFallbackProps) => {
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

SelectFallback.displayName = 'SelectFallback'

export const Select = Object.assign(SelectRoot, {
  Trigger: SelectTrigger,
  Content: SelectContent,
  Search: SelectSearch,
  Item: SelectItem,
  List: SelectList,
  Fallback: SelectFallback,
})
