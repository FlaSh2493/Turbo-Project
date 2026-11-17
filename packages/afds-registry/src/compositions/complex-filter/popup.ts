import type { KeyboardEvent, MouseEvent } from 'react'
import { isSaveShortcut } from './keyboard'

// WHY: AFDS Popover 의 기본 카드(p-5·rounded-md·shadow-2)를 시안 값으로 덮는다. `!` 가 없으면 twMerge 가 사용자 정의 토큰 클래스를 못 가려 기본값이 남는다
export const CARD_CLASS = 'overflow-hidden p-0! rounded-afds-sm! shadow-afds-1!'

// WHY: 앵커로만 Trigger 를 빌린다. 버튼 의미(tab 정지·aria-haspopup·aria-expanded)가 남으면
// 스크린리더가 열리지 않는 팝업 버튼으로 읽고 Tab 이 여기서 한 번 멈춘다 — 콤보박스 의미는 input 이 가진다
const TRIGGER_SEMANTICS = new Set([
  'role',
  'tabIndex',
  'aria-haspopup',
  'aria-expanded',
  'aria-controls',
])

export const stripTriggerSemantics = (props: object) =>
  Object.fromEntries(Object.entries(props).filter(([key]) => !TRIGGER_SEMANTICS.has(key)))

/** 팝업 안으로 포커스가 옮겨 간 것은 입력의 이탈이 아니다 */
export const POPUP_ATTR = 'data-complex-filter-popup'
export const isInsidePopup = (node: EventTarget | null) =>
  node instanceof Element && node.closest(`[${POPUP_ATTR}]`) !== null

/**
 * 팝업 안의 제목·패딩처럼 포커스를 받지 않는 곳을 누르면 브라우저가 포커스를 body 로 보내 입력이나 목록이 blur 된다.
 * 그러면 포커스 이탈 판정이 팝업을 닫아 버린다 — 입력·버튼·목록(tabindex)이 아닌 곳의 mousedown 은 포커스 이동을 막는다
 */
export function keepFocusOnPopupPress(event: MouseEvent<HTMLElement>) {
  // 중첩 포털 팝업(서브메뉴)의 mousedown 도 React 트리로는 이 핸들러까지 전파된다 — DOM 으로 안쪽인 누름만 다룬다
  if (!event.currentTarget.contains(event.target as Node)) return
  const interactive = (event.target as HTMLElement).closest('input, textarea, button, [tabindex]')
  if (
    interactive &&
    interactive !== event.currentTarget &&
    event.currentTarget.contains(interactive)
  ) {
    return
  }
  event.preventDefault()
}

/** 「적용」 버튼에 알리는 단축키(`aria-keyshortcuts`). 화면 힌트는 두지 않는다 */
export const SAVE_SHORTCUT_ARIA = 'Meta+Enter Control+Enter'

/**
 * 팝업 루트에 펼쳐 쓴다 — 팝업 안 어디에 포커스가 있어도 Cmd/Ctrl+Enter 가 「적용」과 같은 핸들러를 부른다.
 * 팝업 안 모든 위치(목록·입력·버튼)에서 같은 진입점으로 받으려고 루트에 한 번만 건다. 개별 Enter 핸들러는 수정키가 있으면 스스로 물러선다(`hasModifierKey`)
 */
export const saveShortcut = (apply: () => void) => ({
  onKeyDownCapture: (event: KeyboardEvent<HTMLElement>) => {
    if (!isSaveShortcut(event.nativeEvent)) return
    event.preventDefault()
    event.stopPropagation()
    apply()
  },
})
