'use client'

import type { RefObject } from 'react'
import { useAfdsPortalContainer } from './use-afds-portal-container'

/**
 * 오버레이 Portal `container` 로 넘길 수 있는 값. base-ui Portal 의 container prop 과 동일한 형태라
 * 호출부 prop(= base-ui container)을 그대로 받고, 그대로 넘길 수 있다.
 */
export type PortalContainer =
  | HTMLElement
  | ShadowRoot
  | null
  | RefObject<HTMLElement | ShadowRoot | null>

/**
 * 오버레이 포털 컨테이너를 우선순위로 해석한다:
 * 명시값(element/ref/null) > `<AfdsScope>` 컨텍스트(element) > `undefined`(= base-ui 기본 `document.body`).
 *
 * 훅(`useAfdsPortalContainer`)은 rules-of-hooks 를 지키기 위해 **항상 무조건 호출**된다.
 * 판정은 `!== undefined` — 즉 **`undefined`(미지정)만** AfdsScope 컨텍스트로 폴백하고, 명시값은 그대로 전달된다.
 *
 * 주의: 명시 `null` 의 동작은 하위 포털 구현을 따른다 — 선언형 base-ui Portal 은 `null` 을
 * "포털 노드 없음(미렌더)"으로 처리한다("body opt-out" 아님). 명령형 `ModalContainer` 만 `null` 을
 * `document.body` 로 매핑한다.
 */
export const useResolvedPortalContainer = (
  explicit?: PortalContainer,
): PortalContainer | undefined => {
  const ctx = useAfdsPortalContainer()
  return explicit !== undefined ? explicit : (ctx ?? undefined)
}
