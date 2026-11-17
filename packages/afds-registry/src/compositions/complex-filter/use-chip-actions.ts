'use client'

import type { Dispatch } from 'react'
import { useRef } from 'react'
import { addKeywords, removeChip, replaceKeyword, upsertSelect } from './chips'
import type { ControllerAction } from './reducer'
import type {
  ComplexFilterConfig,
  ComplexFilterCondition,
  ComplexFilterKeywordField,
  ComplexFilterSelectField,
} from './types'
import type { MenuRow } from './menu-rows'

interface ChipActionsInput extends Pick<
  ComplexFilterConfig,
  'chips' | 'onChange' | 'recentSearches' | 'maxChips' | 'maxLength'
> {
  draft: string
  keywordFields: ComplexFilterKeywordField[]
  /** 서브메뉴가 열린 필드 메뉴 행 */
  subRow: MenuRow | undefined
  dispatch: Dispatch<ControllerAction>
  focusInput: () => void
}

/** 칩을 바꾸는 동작들. 상태 전이(reducer)와 `onChange` 호출을 한 곳에서 짝지어 둔다 */
export function useChipActions({
  chips,
  onChange,
  recentSearches,
  maxChips,
  maxLength = 100,
  draft,
  keywordFields,
  subRow,
  dispatch,
  focusInput,
}: ChipActionsInput) {
  const idSeq = useRef(0)
  // WHY: chips 는 URL·저장소에서 되살린 값일 수 있다. 새 Root 의 카운터가 이미 있는 id 와 겹치면 삭제·교체가 엉뚱한 칩에 닿으므로 비어 있는 id 가 나올 때까지 올린다
  const makeId = () => {
    const taken = new Set(chips.map(chip => chip.id))
    let id: string
    do id = `chip-${++idSeq.current}`
    while (taken.has(id))
    return id
  }

  const addKeyword = (fieldIndex: number) => {
    const field = keywordFields[fieldIndex]
    if (!field) return
    const result = addKeywords(chips, field, draft, {
      maxChips,
      maxLength,
      makeId,
    })
    if (result.added.length > 0) {
      onChange(result.chips)
      result.added.forEach(item => recentSearches?.onAdd(item))
    }
    dispatch({ type: 'afterKeyword' })
  }

  const applySelect = (field: ComplexFilterSelectField, values: string[]) => {
    onChange(upsertSelect(chips, field, values, makeId))
    dispatch({ type: 'close' })
    focusInput()
  }

  const fillFromRecent = (item: string) => {
    dispatch({ type: 'fill', value: item })
    recentSearches?.onSelect?.(item)
    focusInput()
  }

  /** 서브메뉴 안의 행 선택. 부모 메뉴 행 선택(enterSub)과 섞이지 않게 따로 둔다 */
  const pickSub = (at: number) => {
    if (!subRow) return
    if (subRow.type === 'recent') {
      const item = recentSearches?.items[at]
      if (item !== undefined) fillFromRecent(item)
      return
    }
    const option = subRow.field.options[at]
    if (option && subRow.field.multiple === false) {
      applySelect(subRow.field, [option.value])
    }
  }

  return {
    addKeyword,
    applySelect,
    fillFromRecent,
    pickSub,
    removeById: (chipId: string) => {
      onChange(removeChip(chips, chipId))
      focusInput()
    },
    editKeyword: (chipId: string, value: string, condition: ComplexFilterCondition) => {
      onChange(replaceKeyword(chips, chipId, value, condition))
      dispatch({ type: 'close' })
      focusInput()
    },
  }
}
