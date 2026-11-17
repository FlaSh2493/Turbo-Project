'use client'

import { useId, useLayoutEffect, useMemo, useReducer, useRef, useState } from 'react'
import { isKeywordField } from './chips'
import { buildMenuRows } from './menu-rows'
import { isInsidePopup } from './popup'
import { controllerReducer, initialState, liveUi } from './reducer'
import type { ComplexFilterConfig } from './types'
import { useChipActions } from './use-chip-actions'
import { useInputKeys } from './use-input-keys'

type ControllerInput = Pick<
  ComplexFilterConfig,
  'fields' | 'chips' | 'onChange' | 'recentSearches' | 'maxChips' | 'maxLength'
>

/** `ui` 를 닫힘으로 풀 때 매번 새 객체를 만들지 않도록 하나를 공유한다 */
const CLOSED_UI = { type: 'closed' } as const

function useRawController({
  fields,
  chips,
  onChange,
  recentSearches,
  maxChips,
  maxLength = 100,
}: ControllerInput) {
  const listId = useId()
  const subListId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [state, dispatch] = useReducer(controllerReducer, initialState)
  const { draft } = state
  const liveState = liveUi(state.ui, chips)

  const hasRecent = !!recentSearches
  const keywordFields = useMemo(
    () => fields.filter(isKeywordField).filter(field => field.suggest !== false),
    [fields],
  )
  const menuRows = useMemo(() => buildMenuRows(fields, hasRecent), [fields, hasRecent])
  const subRowOf = (target: typeof liveState) =>
    target.type === 'submenu' ? menuRows[target.menuIndex] : undefined
  const subCountOf = (row: ReturnType<typeof subRowOf>) =>
    row?.type === 'recent'
      ? Math.max(1, recentSearches?.items.length ?? 0)
      : (row?.field.options.length ?? 0)
  const subCount = subCountOf(subRowOf(liveState))
  const counts = useMemo(
    () => ({ menu: menuRows.length, suggest: keywordFields.length, sub: subCount }),
    [menuRows.length, keywordFields.length, subCount],
  )
  // WHY: 행이 하나도 없는 목록(선택 필드·키워드 필드가 없는 구성)은 열린 상태로 두지 않는다. 렌더만 막으면 Enter·→ 가
  // aria-expanded·activedescendant 를 열린 채 남기고 Esc 를 가로채므로, 키 해석·렌더·ARIA 가 모두 읽는 ui 자체를 닫힘으로 푼다
  const ui =
    (liveState.type === 'menu' && counts.menu === 0) ||
    (liveState.type === 'suggest' && counts.suggest === 0) ||
    (liveState.type === 'submenu' && counts.sub === 0)
      ? CLOSED_UI
      : liveState
  const subRow = subRowOf(ui)
  const listCount =
    ui.type === 'suggest'
      ? counts.suggest
      : ui.type === 'menu'
        ? counts.menu
        : ui.type === 'submenu'
          ? counts.sub
          : 0
  const blank = draft.trim() === ''
  const focusInput = () => inputRef.current?.focus()

  const actions = useChipActions({
    chips,
    onChange,
    recentSearches,
    maxChips,
    maxLength,
    draft,
    keywordFields,
    subRow,
    dispatch,
    focusInput,
  })
  const keys = useInputKeys({
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
  })

  return {
    ui,
    draft,
    blank,
    listId,
    subListId,
    inputRef,
    menuRows,
    keywordFields,
    subRow,
    counts,
    dispatch,
    focusInput,
    ...actions,
    ...keys,
    /** 포커스가 입력·팝업 밖으로 나가면 열린 목록을 닫는다(수정 팝오버는 자체 닫힘 규칙을 따른다) */
    leaveIfOutside: (next: EventTarget | null) => {
      if (isInsidePopup(next) || inputRef.current === next) return
      if (ui.type === 'menu' || ui.type === 'suggest' || ui.type === 'submenu') {
        dispatch({ type: 'close' })
      }
    },
    /**
     * 필드 메뉴 행 선택. 다중 선택 서브메뉴의 목록이 포커스를 쥐고 있다가 다른 행으로 전환되면 그 목록이 언마운트되며
     * 포커스가 body 로 떨어져 이후 ↓ 가 먹지 않는다(Esc 는 base-ui 의 document 리스너가 처리해 정상 닫힌다)(Chrome 154: 매체(다중) → 상태 행 클릭 → activeElement=BODY).
     * 그래서 전환 전에 입력으로 되돌린다. (메뉴가 닫히는 현상은 재현되지 않았다)
     */
    enterSub: (menuIndex: number) => {
      focusInput()
      dispatch({ type: 'enterSub', menuIndex })
    },
    leaveSub: () => {
      focusInput()
      dispatch({ type: 'leaveSub' })
    },
    /** 서브메뉴가 열려 있어도 필드 메뉴까지 전체를 닫는다(Esc·진짜 바깥 클릭) */
    closeAll: () => {
      focusInput()
      dispatch({ type: 'close' })
    },
    openMenu: () => {
      dispatch({ type: 'open' })
      focusInput()
    },
    clearAll: () => {
      dispatch({ type: 'draft', value: '' })
      dispatch({ type: 'close' })
    },
  }
}

/** 렌더마다 새로 만들어지는 함수 — 안정된 껍데기가 호출 시점의 최신 구현으로 넘긴다 */
const FUNCTION_KEYS = [
  'focusInput',
  'addKeyword',
  'applySelect',
  'fillFromRecent',
  'pickSub',
  'removeById',
  'editKeyword',
  'onKeyDown',
  'onPaste',
  'leaveIfOutside',
  'enterSub',
  'leaveSub',
  'closeAll',
  'openMenu',
  'clearAll',
] as const

type RawController = ReturnType<typeof useRawController>
type StableFunctions = Pick<RawController, (typeof FUNCTION_KEYS)[number]>

/**
 * 컨텍스트로 내려보내도 값이 바뀌지 않는 한 같은 객체를 돌려준다. 함수는 `useCallback` 의존성을 일일이 맞추는 대신
 * 「항상 마지막 렌더의 구현을 부르는」 고정 껍데기를 쓴다 — 이벤트 핸들러가 늘 최신 chips·draft 를 보는 기존 동작과 같다
 */
export function useFilterController(input: ControllerInput) {
  const raw = useRawController(input)
  const latest = useRef(raw)
  // WHY: 렌더 중에 ref 를 쓰지 않는다. 핸들러는 커밋 뒤에만 불리므로 레이아웃 effect 에서 최신 구현으로 바꿔 둬도 늦지 않다
  useLayoutEffect(() => {
    latest.current = raw
  })
  const [stable] = useState(
    () =>
      Object.fromEntries(
        FUNCTION_KEYS.map(key => [
          key,
          (...args: unknown[]) => (latest.current[key] as (...a: unknown[]) => unknown)(...args),
        ]),
      ) as unknown as StableFunctions,
  )
  const {
    ui,
    draft,
    blank,
    listId,
    subListId,
    inputRef,
    menuRows,
    keywordFields,
    subRow,
    counts,
    dispatch,
  } = raw
  return useMemo(
    () => ({
      ui,
      draft,
      blank,
      listId,
      subListId,
      inputRef,
      menuRows,
      keywordFields,
      subRow,
      counts,
      dispatch,
      ...stable,
    }),
    [
      ui,
      draft,
      blank,
      listId,
      subListId,
      inputRef,
      menuRows,
      keywordFields,
      subRow,
      counts,
      dispatch,
      stable,
    ],
  )
}

export type FilterController = ReturnType<typeof useFilterController>
