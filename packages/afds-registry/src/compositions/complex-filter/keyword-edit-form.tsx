'use client'

import { SegmentControl, Typography } from '@turbo-project/afds/bricks'
import { CircleXIcon } from 'lucide-react'
import { useState } from 'react'
import { hasModifierKey } from './keyboard'
import { EditorFooter } from './editor-footer'
import { saveShortcut } from './popup'
import type {
  ComplexFilterConfig,
  ComplexFilterCondition,
  ComplexFilterKeywordChip,
  ComplexFilterKeywordField,
} from './types'

interface KeywordEditFormProps {
  field: ComplexFilterKeywordField
  chip: ComplexFilterKeywordChip
  labels: ComplexFilterConfig['labels']
  maxLength: number
  onApply: (value: string, condition: ComplexFilterCondition) => void
  onCancel: () => void
}

export function KeywordEditForm({
  field,
  chip,
  labels,
  maxLength,
  onApply,
  onCancel,
}: KeywordEditFormProps) {
  const [draft, setDraft] = useState(chip.value)
  const [condition, setCondition] = useState(chip.condition)
  const trimmed = draft.trim()
  const invalid = trimmed === ''
  const single = field.conditions.length === 1
  const title = single
    ? `${labels.keywordTitle(field.label)} ${labels.conditions[condition]}`
    : labels.keywordTitle(field.label)

  const apply = () => {
    if (invalid) return
    if (trimmed === chip.value && condition === chip.condition) onCancel()
    else onApply(trimmed, condition)
  }

  return (
    <div data-testid="complex-filter-keyword-editor" {...saveShortcut(apply)}>
      <div className="flex flex-col gap-afds-spacing-10 p-afds-spacing-10">
        <Typography
          as="p"
          variant="title4"
          color="text-primary"
          className="truncate pt-afds-spacing-8"
        >
          {title}
        </Typography>
        <div className="flex h-afds-spacing-34 items-center gap-afds-spacing-10 rounded-afds-sm border border-afds-border-focus bg-afds-bg-surface px-afds-spacing-10">
          <input
            value={draft}
            // WHY: 쉼표는 키워드 구분자다. 입력 즉시 지워 값에 섞이지 않게 한다
            onChange={event => setDraft(event.target.value.replace(/,/g, ''))}
            onKeyDown={event => {
              if (event.nativeEvent.isComposing) return
              if (event.key === 'Enter' && !hasModifierKey(event)) {
                event.preventDefault()
                apply()
              }
            }}
            aria-label={title}
            aria-invalid={invalid}
            maxLength={maxLength}
            className="body3 min-w-0 flex-1 bg-transparent text-afds-text-primary outline-none"
            data-testid="complex-filter-keyword-input"
          />
          {draft !== '' && (
            <button
              type="button"
              aria-label={labels.editor.clearValue}
              className="flex shrink-0 cursor-pointer items-center justify-center"
              onClick={() => setDraft('')}
            >
              <CircleXIcon width={16} height={16} className="text-afds-icon-disabled" aria-hidden />
            </button>
          )}
        </div>
        {invalid && (
          <Typography
            as="p"
            variant="body3"
            color="text-error"
            role="alert"
            data-testid="complex-filter-keyword-error"
          >
            {labels.editor.emptyValue}
          </Typography>
        )}
        {!single && (
          <SegmentControl.Root
            size="sm"
            value={condition}
            onValueChange={next => setCondition(next as ComplexFilterCondition)}
            aria-label={field.label}
          >
            <SegmentControl.Indicator />
            {field.conditions.map(item => (
              <SegmentControl.Item
                key={item}
                value={item}
                data-testid={`complex-filter-condition-${item}`}
              >
                {labels.conditions[item]}
              </SegmentControl.Item>
            ))}
          </SegmentControl.Root>
        )}
      </div>
      <EditorFooter labels={labels} onCancel={onCancel} onApply={apply} applyDisabled={invalid} />
    </div>
  )
}
