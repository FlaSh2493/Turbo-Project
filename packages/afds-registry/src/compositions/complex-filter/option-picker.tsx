'use client'

import { Typography } from '@turbo-project/afds/bricks'
import { CheckIcon } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { EditorFooter } from './editor-footer'
import { ActiveRow, HoverScroll } from './hover-scroll'
import { hasModifierKey } from './keyboard'
import { saveShortcut } from './popup'
import type { ComplexFilterConfig, ComplexFilterSelectField } from './types'

interface OptionRowProps {
  id: string
  testId: string
  label: string
  checked: boolean
  active: boolean
  onHover: () => void
  onToggle: () => void
}

/** 값 목록의 한 행. 선택은 오버레이+체크, 키보드 하이라이트는 sunken 배경이고 둘이 겹칠 때만 링을 더한다 */
export function OptionRow({
  id,
  testId,
  label,
  checked,
  active,
  onHover,
  onToggle,
}: OptionRowProps) {
  return (
    <ActiveRow
      active={active}
      id={id}
      role="option"
      aria-selected={checked}
      className={`flex h-afds-spacing-34 cursor-pointer items-center justify-between gap-afds-spacing-4 rounded-afds-sm px-afds-spacing-10 ${
        checked ? 'bg-afds-interaction-selected-overlay' : active ? 'bg-afds-bg-surface-sunken' : ''
      } ${checked && active ? 'ring-1 ring-inset ring-afds-border-focus' : ''}`}
      onMouseEnter={onHover}
      onClick={onToggle}
      data-testid={testId}
      data-active={active || undefined}
    >
      <Typography
        as="span"
        variant="body3"
        color="text-primary"
        className="min-w-0 flex-1 truncate"
        title={label}
      >
        {label}
      </Typography>
      {checked && (
        <CheckIcon width={16} height={16} className="text-afds-icon-brand-subtle" aria-hidden />
      )}
    </ActiveRow>
  )
}

interface OptionPickerProps {
  /** 목록 id. 입력의 aria-controls 가 가리키도록 부모가 정한다. 없으면 자체 id */
  listId?: string
  field: ComplexFilterSelectField
  selected: string[]
  labels: ComplexFilterConfig['labels']
  onApply: (values: string[]) => void
  onCancel: () => void
  /** ← 로 필드 메뉴에 돌아간다. 없으면 ← 는 무시한다 */
  onBack?: () => void
  /** 마운트 시 목록에 포커스를 둔다 */
  autoFocus?: boolean
  /** 하나만 고른다(고르면 이전 선택을 대체) */
  single?: boolean
  /** 필드 이름 제목을 그린다. 서브메뉴는 끈다(운영센터와 같음) — 이름은 listbox 의 aria-label 이 계속 전한다 */
  showTitle?: boolean
}

/** 다중 선택 값 목록 + 취소/적용 푸터. 목록이 포커스를 가져 Tab 으로 푸터에 닿는다 */
export function OptionPicker({
  listId: listIdProp,
  field,
  selected,
  labels,
  onApply,
  onCancel,
  onBack,
  autoFocus = false,
  single = false,
  showTitle = true,
}: OptionPickerProps) {
  const ownId = useId()
  const listId = listIdProp ?? ownId
  const listRef = useRef<HTMLDivElement>(null)
  const [pending, setPending] = useState(selected)
  const [index, setIndex] = useState(0)
  const pendingSet = new Set(pending)

  useEffect(() => {
    if (autoFocus) listRef.current?.focus()
  }, [autoFocus])

  const toggle = (at: number) => {
    const option = field.options[at]
    if (!option) return
    setPending(prev => {
      if (single) return [option.value]
      return prev.includes(option.value)
        ? prev.filter(item => item !== option.value)
        : [...prev, option.value]
    })
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const count = field.options.length
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp':
        event.preventDefault()
        setIndex((index + (event.key === 'ArrowDown' ? 1 : count - 1)) % count)
        break
      case 'Enter':
      case ' ':
        // 수정키 조합 Enter(저장 단축키 등)는 토글하지 않는다
        if (event.key === 'Enter' && hasModifierKey(event)) break
        event.preventDefault()
        toggle(index)
        break
      case 'ArrowLeft':
        if (onBack) {
          event.preventDefault()
          onBack()
        }
        break
    }
  }

  return (
    <div
      className="flex min-h-0 flex-col"
      data-testid="complex-filter-values-editor"
      {...saveShortcut(() => onApply(pending))}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-afds-spacing-4 p-afds-spacing-10">
        {showTitle && (
          <Typography
            as="p"
            variant="title4"
            color="text-primary"
            className="shrink-0 truncate px-afds-spacing-10 pt-afds-spacing-8"
          >
            {field.label}
          </Typography>
        )}
        <HoverScroll>
          <div
            ref={listRef}
            id={listId}
            role="listbox"
            tabIndex={0}
            aria-label={field.label}
            aria-multiselectable
            aria-activedescendant={`${listId}-${index}`}
            onKeyDown={onKeyDown}
            className="flex flex-col gap-afds-spacing-4 rounded-afds-sm outline-none"
          >
            {field.options.map((option, at) => (
              <OptionRow
                key={option.value}
                id={`${listId}-${at}`}
                testId={`complex-filter-option-${field.key}-${option.value}`}
                label={option.label}
                checked={pendingSet.has(option.value)}
                active={at === index}
                onHover={() => setIndex(at)}
                onToggle={() => toggle(at)}
              />
            ))}
          </div>
        </HoverScroll>
      </div>
      <EditorFooter labels={labels} onCancel={onCancel} onApply={() => onApply(pending)} />
    </div>
  )
}
