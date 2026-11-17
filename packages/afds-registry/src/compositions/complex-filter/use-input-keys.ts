'use client'

import type { ClipboardEvent, Dispatch, KeyboardEvent } from 'react'
import { lastRemovable, removeChip } from './chips'
import { resolveKey } from './keyboard'
import type { MenuRow } from './menu-rows'
import type { ControllerAction, UiState } from './reducer'
import type { ComplexFilterConfig } from './types'
import type { useChipActions } from './use-chip-actions'

interface InputKeysInput extends Pick<
  ComplexFilterConfig,
  'chips' | 'onChange' | 'recentSearches'
> {
  ui: UiState
  draft: string
  blank: boolean
  subRow: MenuRow | undefined
  /** 현재 열린 목록의 행 수 */
  listCount: number
  actions: ReturnType<typeof useChipActions>
  dispatch: Dispatch<ControllerAction>
}

/** 입력칸의 keydown·paste. 키 해석은 순수 `resolveKey` 가 하고 여기서는 그 의도를 상태 전이·칩 변경으로 옮긴다 */
export function useInputKeys({
  chips,
  onChange,
  recentSearches,
  ui,
  draft,
  blank,
  subRow,
  listCount,
  actions,
  dispatch,
}: InputKeysInput) {
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // WHY: 한글 조합 중의 Enter·방향키는 조합을 확정·이동하는 키다. 이때 처리하면 입력창이
    // 비워지는 사이 조합 잔여 문자가 되살아나 다음 Enter 에 별개 값으로 들어간다
    if (event.nativeEvent.isComposing) return
    const resolved = resolveKey(event.key, {
      ui,
      blank,
      empty: draft === '',
      recentSub: subRow?.type === 'recent',
    })
    if (!resolved) return
    if (resolved.preventDefault) event.preventDefault()

    switch (resolved.action.type) {
      case 'activate':
        if (ui.type === 'suggest') actions.addKeyword(ui.index)
        else if (ui.type === 'menu') dispatch({ type: 'enterSub', menuIndex: ui.index })
        else if (ui.type === 'submenu') actions.pickSub(ui.subIndex)
        break
      case 'addFirstKeyword':
        actions.addKeyword(0)
        break
      case 'move':
        dispatch({
          type: 'move',
          delta: resolved.action.delta,
          count: listCount,
        })
        break
      case 'open':
        dispatch({ type: 'open' })
        break
      case 'enterSub':
        if (ui.type === 'menu') dispatch({ type: 'enterSub', menuIndex: ui.index })
        break
      case 'leaveSub':
        dispatch({ type: 'leaveSub' })
        break
      case 'close':
        dispatch({ type: 'close' })
        break
      case 'removeLastChip': {
        const chip = lastRemovable(chips)
        if (chip) onChange(removeChip(chips, chip.id))
        break
      }
      case 'removeRecent': {
        const item = ui.type === 'submenu' ? recentSearches?.items[ui.subIndex] : undefined
        if (item !== undefined) recentSearches?.onRemove(item)
        break
      }
    }
  }

  const onPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const text = event.clipboardData.getData('text')
    if (!/[\r\n\t]/.test(text)) return
    event.preventDefault()
    dispatch({
      type: 'draft',
      value: `${draft}${text.replace(/[\r\n\t]+/g, ',')}`,
    })
  }

  return { onKeyDown, onPaste }
}
