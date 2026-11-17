'use client'

import { createContext, useContext } from 'react'

/**
 * `<AfdsScope>` 가 제공하는 포털 타깃 **element**. 오버레이가 이 컨테이너 안으로 포털된다.
 *
 * RefObject 가 아니라 element(state) 로 제공한다: base-ui Portal 은 container 를 layout effect 에서
 * deps=[container] 로 1회 해석하므로, 식별자가 고정된 ref 는 effect 가 재실행되지 않아 최초 null 이면
 * `document.body` 에 갇힌다. element 를 state 로 노출하면 `null → element` 변경 시 effect 가 재실행되어
 * 포털이 스코프 안으로 이동한다(reactive).
 */
export type AfdsPortalContainer = HTMLElement | null

export const AfdsPortalContext = createContext<AfdsPortalContainer>(null)

/**
 * 가장 가까운 `<AfdsScope>` 의 포털 타깃 element 를 반환한다.
 * 스코프 밖에서 호출하면 `null` 을 반환한다(throw 하지 않음 — opt-in 이라 어디서든 안전 호출).
 */
export const useAfdsPortalContainer = (): AfdsPortalContainer => useContext(AfdsPortalContext)
