'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { useModalStore } from '../../../headless/modal/use-modal-store'
import { defaultModalStore } from '../../../headless/modal/modal-store'
import { useAfdsPortalContainer } from '../../../hooks/use-afds-portal-container'
import { ModalExitContext } from './modal.context'

const subscribers = new Set<(active: boolean) => void>()

const sync = () => {
  const arr = Array.from(subscribers)
  const last = arr[arr.length - 1]
  arr.forEach(setActive => setActive(setActive === last))
}

export interface ModalContainerProps {
  /**
   * 명령형 모달이 포털될 컨테이너. 선언형 오버레이의 resolver 와 같은 opt-out 계약을 따른다:
   * - **미지정/`undefined`** → `<AfdsScope>` 컨텍스트(렌더 시점) → `document.body` 순.
   * - **`null`**(opt-out) → 스코프를 무시하고 `document.body`. (미지정 ≠ `null`)
   * - element → 그 element.
   *
   * `<AfdsScope>` 하위에 `<ModalContainer />` 를 렌더하면 명령형 모달도 스코프 안에서 렌더된다.
   * 단 전역 싱글톤이라, 스코프 지원은 `<ModalContainer />` 가 렌더된 그 하나의 `<AfdsScope>` 로 한정된다.
   *
   * (타입은 선언형 `PortalContainer` 보다 좁은 `Element | null` — 명령형 싱글톤은 `createPortal` 에 실제
   * element 가 필요하고 ref 가 무의미하므로 의도된 결정.)
   */
  container?: Element | null
}

export const ModalContainer = ({ container }: ModalContainerProps = {}) => {
  const modals = useModalStore()
  // AfdsScope 컨텍스트는 element(state) 를 제공하므로, 부착되면 리렌더되어 target 이 갱신된다.
  const scopeEl = useAfdsPortalContainer()
  const [isActive, setIsActive] = React.useState(false)

  React.useEffect(() => {
    subscribers.add(setIsActive)
    sync()
    return () => {
      subscribers.delete(setIsActive)
      sync()
    }
  }, [])

  if (!isActive) return null
  if (typeof document === 'undefined') return null

  // 우선순위(undefined 기준 — 선언형 resolver 와 동일 계약): 명시 container > AfdsScope element > body.
  // 명시 `null` 은 scope opt-out(→ body). 미지정(undefined)일 때만 AfdsScope 컨텍스트 사용.
  const target: Element =
    container !== undefined ? (container ?? document.body) : (scopeEl ?? document.body)

  return createPortal(
    <>
      {modals.map(({ id, isOpen, render }) => (
        <ModalExitContext.Provider key={id} value={() => defaultModalStore.destroy(id)}>
          {render({
            isOpen,
            close: () => defaultModalStore.close(id),
          })}
        </ModalExitContext.Provider>
      ))}
    </>,
    target,
  )
}
