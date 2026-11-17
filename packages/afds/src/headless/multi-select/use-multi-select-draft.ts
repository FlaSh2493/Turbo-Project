'use client'

import * as React from 'react'

export interface UseMultiSelectDraftOptions {
  /** 부모가 보유한 committed 값 */
  committed: string[]
  /** 펜딩 → committed commit 시 호출 */
  setCommitted: (next: string[]) => void
  /** 드롭다운 열림 상태 */
  isOpen: boolean
  /** 드롭다운 열림 상태 변경 — confirm/cancel 후 close 호출용 */
  setOpen: (open: boolean) => void
}

export interface MultiSelectDraftState {
  /** 현재 펜딩 값 */
  value: string[]
  /** 펜딩 값 갱신 (MultiSelect의 onValueChange에 연결) */
  setValue: (next: string[]) => void
  /** 펜딩 → committed commit + 드롭다운 닫기 */
  confirm: () => void
  /** 펜딩 revert + 드롭다운 닫기 */
  cancel: () => void
  /** 펜딩 = [] (드롭다운 유지) */
  reset: () => void
  /** 펜딩과 committed가 다른가 */
  isDirty: boolean
}

const sameValues = (a: string[], b: string[]): boolean => {
  if (a.length !== b.length) return false
  if (a === b) return true
  const aSet = new Set(a)
  for (const v of b) if (!aSet.has(v)) return false
  return true
}

/**
 * MultiSelect의 펜딩(draft) UX를 외부에서 조립하는 훅.
 *
 * `useCalendar`처럼 external-first 패턴 — consumer가 호출해서 결과를
 * MultiSelect의 controlled props(`value`/`onValueChange`/`open`/`onOpenChange`)에
 * wire한다. MultiSelect 본체는 펜딩 개념을 모르며 그저 주입된 value를 표시한다.
 *
 * 라이프사이클:
 * - `isOpen` false → true: 펜딩 = committed 스냅샷
 * - `isOpen` true → false: 펜딩 = committed (close revert — Confirm 케이스는 이미 commit돼 동등 효과)
 * - `confirm()`: setCommitted(pending) + setOpen(false)
 * - `cancel()`: setOpen(false) — 다음 isOpen 변화에 펜딩이 committed로 revert
 * - `reset()`: 펜딩 = [] (드롭다운 유지)
 *
 * @example
 * ```tsx
 * const [committed, setCommitted] = useState<string[]>([])
 * const [open, setOpen] = useState(false)
 * const draft = useMultiSelectDraft({ committed, setCommitted, isOpen: open, setOpen })
 *
 * <MultiSelect
 *   open={open} onOpenChange={setOpen}
 *   value={draft.value} onValueChange={draft.setValue}
 *   options={opts}
 * >
 *   ...
 *   <MultiSelect.Footer>
 *     <Button onClick={draft.reset}>초기화</Button>
 *     <Button onClick={draft.cancel}>취소</Button>
 *     <Button onClick={draft.confirm} disabled={!draft.isDirty}>확인</Button>
 *   </MultiSelect.Footer>
 * </MultiSelect>
 * ```
 */
export const useMultiSelectDraft = (options: UseMultiSelectDraftOptions): MultiSelectDraftState => {
  const { committed, setCommitted, isOpen, setOpen } = options

  const [pending, setPending] = React.useState<string[]>(committed)

  // isOpen 변화에 따라 펜딩 sync/revert
  React.useEffect(() => {
    setPending(committed)
    // isOpen이 변할 때마다 committed 스냅샷으로 정렬한다.
    // open=true → 새 편집 세션 시작
    // open=false → revert (Confirm 케이스는 committed가 이미 갱신된 상태)
    // committed는 일부러 deps에서 제외 — open 토글 시점에만 스냅샷한다.
  }, [isOpen])

  const confirm = React.useCallback(() => {
    setCommitted(pending)
    setOpen(false)
  }, [pending, setCommitted, setOpen])

  const cancel = React.useCallback(() => {
    setOpen(false)
  }, [setOpen])

  const reset = React.useCallback(() => {
    setPending([])
  }, [])

  const isDirty = !sameValues(pending, committed)

  return {
    value: pending,
    setValue: setPending,
    confirm,
    cancel,
    reset,
    isDirty,
  }
}
