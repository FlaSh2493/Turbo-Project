'use client'

import { Button } from '@turbo-project/afds/bricks'
import { SAVE_SHORTCUT_ARIA } from './popup'
import type { ComplexFilterConfig } from './types'

interface EditorFooterProps {
  labels: ComplexFilterConfig['labels']
  onCancel: () => void
  onApply: () => void
  applyDisabled?: boolean
}

/** 값 목록·키워드 수정 팝업이 함께 쓰는 취소/적용 푸터 */
export function EditorFooter({
  labels,
  onCancel,
  onApply,
  applyDisabled = false,
}: EditorFooterProps) {
  return (
    <div className="flex h-afds-spacing-44 shrink-0 items-center justify-end gap-afds-spacing-4 border-t border-afds-border-default p-afds-spacing-10">
      <Button variant="line" size="sm" onClick={onCancel} data-testid="complex-filter-cancel">
        {labels.editor.cancel}
      </Button>
      <Button
        variant="line"
        size="sm"
        disabled={applyDisabled}
        onClick={onApply}
        aria-keyshortcuts={SAVE_SHORTCUT_ARIA}
        data-testid="complex-filter-apply"
      >
        {labels.editor.apply}
      </Button>
    </div>
  )
}
