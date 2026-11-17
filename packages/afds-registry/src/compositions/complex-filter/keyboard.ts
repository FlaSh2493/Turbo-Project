import type { UiState } from './reducer'

type KeyAction =
  | { type: 'activate' }
  | { type: 'addFirstKeyword' }
  | { type: 'move'; delta: 1 | -1 }
  | { type: 'open' }
  | { type: 'enterSub' }
  | { type: 'leaveSub' }
  | { type: 'close' }
  | { type: 'removeLastChip' }
  | { type: 'removeRecent' }

export interface KeyContext {
  ui: UiState
  /** trim 한 입력이 비었는지 — 메뉴/추천 모드 판정 */
  blank: boolean
  /** 입력이 정확히 빈 문자열인지 — 공백만 있을 때 Backspace 가 칩을 지우지 않게 한다 */
  empty: boolean
  /** 서브메뉴가 최근 검색인지 */
  recentSub: boolean
}

interface KeyResolution {
  action: KeyAction
  /** 기본 동작(커서 이동·제출 등)을 막아야 하는지 */
  preventDefault: boolean
}

/** 수정키(Cmd·Ctrl·Alt·Shift)가 눌려 있는지 — 수정키 조합 Enter 가 일반 Enter 동작(적용·토글)을 흉내 내지 않게 한다 */
export const hasModifierKey = (
  event: Pick<KeyboardEvent, 'metaKey' | 'ctrlKey' | 'shiftKey' | 'altKey'>,
): boolean => event.metaKey || event.ctrlKey || event.shiftKey || event.altKey

/** 저장 단축키 판정에 필요한 키 이벤트 필드 */
type SaveKeyEvent = Pick<
  KeyboardEvent,
  'key' | 'metaKey' | 'ctrlKey' | 'shiftKey' | 'altKey' | 'isComposing'
>

/**
 * Cmd+Enter(맥)·Ctrl+Enter(윈도우·리눅스). 플랫폼을 가르지 않고 metaKey||ctrlKey 로 단순하게 본다.
 * Shift·Alt 조합과 한글 조합 중(`isComposing`)은 제외한다
 */
export const isSaveShortcut = (event: SaveKeyEvent): boolean =>
  event.key === 'Enter' &&
  (event.metaKey || event.ctrlKey) &&
  !event.shiftKey &&
  !event.altKey &&
  !event.isComposing

const LIST_OPEN = new Set(['menu', 'suggest', 'submenu'])

/** 키 → 의도. 상태·이벤트만 보고 정하는 순수 함수라 React 없이 테스트한다. 한글 조합 중은 호출 전에 걸러 낸다 */
export function resolveKey(
  key: string,
  { ui, blank, empty, recentSub }: KeyContext,
): KeyResolution | undefined {
  const listOpen = LIST_OPEN.has(ui.type)
  switch (key) {
    case 'Enter':
      if (listOpen) return { action: { type: 'activate' }, preventDefault: true }
      return blank ? undefined : { action: { type: 'addFirstKeyword' }, preventDefault: true }
    case 'ArrowDown':
    case 'ArrowUp':
      return listOpen
        ? {
            action: { type: 'move', delta: key === 'ArrowDown' ? 1 : -1 },
            preventDefault: true,
          }
        : { action: { type: 'open' }, preventDefault: true }
    case 'ArrowRight':
      return ui.type === 'menu' ? { action: { type: 'enterSub' }, preventDefault: true } : undefined
    case 'ArrowLeft':
      return ui.type === 'submenu'
        ? { action: { type: 'leaveSub' }, preventDefault: true }
        : undefined
    case 'Delete':
      return ui.type === 'submenu' && recentSub
        ? { action: { type: 'removeRecent' }, preventDefault: true }
        : undefined
    case 'Escape':
      return listOpen ? { action: { type: 'close' }, preventDefault: true } : undefined
    case 'Backspace':
      return empty ? { action: { type: 'removeLastChip' }, preventDefault: false } : undefined
    default:
      return undefined
  }
}
