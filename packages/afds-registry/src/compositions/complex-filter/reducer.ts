import type { ComplexFilterChip } from './types'

/** 열려 있는 팝업은 늘 하나다. 상호작용 상태를 한 유니온으로 둬 어긋난 조합이 생기지 않게 한다 */
export type UiState =
  | { type: 'closed' }
  | { type: 'menu'; index: number }
  /** 부모 하이라이트(menuIndex)와 서브메뉴 하이라이트(subIndex)는 서로 다른 목록의 위치라 따로 둔다 */
  | { type: 'submenu'; menuIndex: number; subIndex: number }
  | { type: 'suggest'; index: number }
  | { type: 'edit'; chipId: string; chip: ComplexFilterChip }

export interface ControllerState {
  ui: UiState
  draft: string
}

export type HoverList = 'menu' | 'sub' | 'suggest'

export type ControllerAction =
  | { type: 'draft'; value: string }
  /** 입력 클릭·↓ — 입력이 비었으면 필드 메뉴, 있으면 추천 목록 */
  | { type: 'open' }
  | { type: 'close' }
  /** ↑↓ — 열린 목록 중 포커스를 가진 쪽(서브메뉴가 있으면 서브메뉴)을 순환한다 */
  | { type: 'move'; delta: 1 | -1; count: number }
  | { type: 'hover'; list: HoverList; index: number; count: number }
  /** 필드 메뉴 행 선택 — 서브메뉴가 이미 열려 있어도 그 행의 서브메뉴로 전환한다 */
  | { type: 'enterSub'; menuIndex: number }
  | { type: 'leaveSub' }
  | { type: 'edit'; chipId: string; chip: ComplexFilterChip }
  /** 입력을 이 값으로 채우고 추천 모드로(최근 검색 선택) */
  | { type: 'fill'; value: string }
  /** 키워드 칩을 만든 뒤: 입력을 비우고 필드 메뉴를 다시 연다 */
  | { type: 'afterKeyword' }

export const initialState: ControllerState = {
  ui: { type: 'closed' },
  draft: '',
}

const isBlank = (draft: string) => draft.trim() === ''

const cycle = (index: number, delta: 1 | -1, count: number) =>
  count === 0 ? 0 : (index + delta + count) % count

const clamp = (index: number, count: number) => Math.max(0, Math.min(index, count - 1))

export function controllerReducer(
  state: ControllerState,
  action: ControllerAction,
): ControllerState {
  const { ui, draft } = state
  switch (action.type) {
    case 'draft': {
      if (isBlank(action.value)) {
        // 목록 종류가 바뀔 때(추천 → 메뉴)만 하이라이트를 처음으로 돌린다
        return {
          draft: action.value,
          ui: ui.type === 'suggest' ? { type: 'menu', index: 0 } : ui,
        }
      }
      return {
        draft: action.value,
        ui: ui.type === 'suggest' ? ui : { type: 'suggest', index: 0 },
      }
    }
    case 'open':
      return {
        draft,
        ui: isBlank(draft) ? { type: 'menu', index: 0 } : { type: 'suggest', index: 0 },
      }
    case 'close':
      return { draft, ui: { type: 'closed' } }
    case 'move':
      if (ui.type === 'menu' || ui.type === 'suggest') {
        return {
          draft,
          ui: { ...ui, index: cycle(ui.index, action.delta, action.count) },
        }
      }
      if (ui.type === 'submenu') {
        return {
          draft,
          ui: {
            ...ui,
            subIndex: cycle(ui.subIndex, action.delta, action.count),
          },
        }
      }
      return state
    case 'hover': {
      const index = clamp(action.index, action.count)
      if (action.list === 'suggest' && ui.type === 'suggest') {
        return { draft, ui: { ...ui, index } }
      }
      if (action.list === 'menu') {
        if (ui.type === 'menu') return { draft, ui: { ...ui, index } }
        // 서브메뉴가 열려 있는 동안 부모 하이라이트는 서브메뉴를 연 행에 고정한다
        return state
      }
      if (action.list === 'sub' && ui.type === 'submenu') {
        return { draft, ui: { ...ui, subIndex: index } }
      }
      return state
    }
    case 'enterSub':
      return {
        draft,
        ui: { type: 'submenu', menuIndex: action.menuIndex, subIndex: 0 },
      }
    case 'leaveSub':
      return ui.type === 'submenu' ? { draft, ui: { type: 'menu', index: ui.menuIndex } } : state
    case 'edit':
      return {
        draft,
        ui: { type: 'edit', chipId: action.chipId, chip: action.chip },
      }
    case 'fill':
      return { draft: action.value, ui: { type: 'suggest', index: 0 } }
    case 'afterKeyword':
      return { draft: '', ui: { type: 'menu', index: 0 } }
  }
}

const CLOSED: UiState = { type: 'closed' }

/**
 * 수정 상태는 그 칩 **객체**가 아직 목록에 있을 때만 유효하다. 칩이 사라지면(삭제·교체·지우기·외부 변경) 닫힌 것으로
 * 풀이하고, 같은 id 로 새 칩이 생겨도(다른 객체) 되살아나지 않는다 — 상태를 따로 정리하는 effect 가 필요 없다
 */
export const liveUi = (ui: UiState, chips: ComplexFilterChip[]): UiState =>
  ui.type === 'edit' && chips.find(chip => chip.id === ui.chipId) !== ui.chip ? CLOSED : ui
