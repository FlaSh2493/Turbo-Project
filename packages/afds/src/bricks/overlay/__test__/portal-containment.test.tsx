import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { AfdsScope } from '../../../scope/afds-scope'
import { Drawer } from '../drawer/drawer'
import { Modal } from '../modal/modal'
import { ModalContainer } from '../modal/modal-container'
import { Popover } from '../popover/popover'
import { Tooltip } from '../tooltip/tooltip'
import { defaultModalStore } from '../../../headless/modal/modal-store'

const portalTarget = () =>
  screen.getByTestId('afds-scope').querySelector('[data-afds-portal]') as HTMLElement

// 명령형 모달 store 는 전역 싱글톤이라 테스트 간 누수 방지를 위해 매 테스트 후 비운다.
afterEach(() => {
  act(() => {
    for (const m of [...defaultModalStore.getModals()]) defaultModalStore.destroy(m.id)
  })
})

describe('오버레이 포털 컨테이너 — <AfdsScope> 안에서 .afds 하위로 포털', () => {
  it('Drawer 콘텐츠가 [data-afds-portal] 하위에 렌더된다', () => {
    render(
      <AfdsScope>
        <Drawer.Root open onOpenChange={() => {}}>
          <Drawer.Viewport>
            <Drawer.Panel>
              <Drawer.Title>title</Drawer.Title>
              <Drawer.Content>
                <span>drawer-body</span>
              </Drawer.Content>
            </Drawer.Panel>
          </Drawer.Viewport>
        </Drawer.Root>
      </AfdsScope>,
    )
    expect(portalTarget()).toContainElement(screen.getByText('drawer-body'))
  })

  it('Modal(선언형) 콘텐츠가 [data-afds-portal] 하위에 렌더된다', () => {
    render(
      <AfdsScope>
        <Modal.Root open>
          <Modal.Portal>
            <Modal.Content>
              <span>modal-body</span>
            </Modal.Content>
          </Modal.Portal>
        </Modal.Root>
      </AfdsScope>,
    )
    expect(portalTarget()).toContainElement(screen.getByText('modal-body'))
  })

  it('Popover 콘텐츠가 [data-afds-portal] 하위에 렌더된다 (내부 Portal forward)', () => {
    render(
      <AfdsScope>
        <Popover.Root open>
          <Popover.Trigger>open</Popover.Trigger>
          <Popover.Content>
            <span>popover-body</span>
          </Popover.Content>
        </Popover.Root>
      </AfdsScope>,
    )
    expect(portalTarget()).toContainElement(screen.getByText('popover-body'))
  })

  it('Tooltip 콘텐츠가 [data-afds-portal] 하위에 렌더된다', () => {
    render(
      <AfdsScope>
        <Tooltip.Provider>
          <Tooltip.Root open mode="click">
            <Tooltip.Trigger>trigger</Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup>
                  <span>tooltip-body</span>
                </Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      </AfdsScope>,
    )
    expect(portalTarget()).toContainElement(screen.getByText('tooltip-body'))
  })

  it('Modal(명령형 ModalContainer) 콘텐츠가 [data-afds-portal] 하위에 렌더된다', () => {
    render(
      <AfdsScope>
        <ModalContainer />
      </AfdsScope>,
    )
    act(() => {
      defaultModalStore.open(() => <span>imperative-body</span>)
    })
    expect(portalTarget()).toContainElement(screen.getByText('imperative-body'))
  })
})

describe('container={null} opt-out 계약 (scope 무시 → body)', () => {
  it('ModalContainer container={null} 은 AfdsScope 안에서도 scope 밖(body)으로 포털한다', () => {
    render(
      <AfdsScope>
        <ModalContainer container={null} />
      </AfdsScope>,
    )
    act(() => {
      defaultModalStore.open(() => <span>imperative-optout</span>)
    })
    const node = screen.getByText('imperative-optout')
    expect(portalTarget()).not.toContainElement(node)
    expect(node.closest('[data-testid="afds-scope"]')).toBeNull() // .afds 밖에 렌더
  })

  // 선언형 오버레이(base-ui)의 container={null} 은 "body opt-out" 이 아니라 "포털 노드 없음(미렌더)" 이다.
  // (base-ui FloatingPortal: containerProp===null → 포털 노드 미생성). 따라서 null=body 라는 계약은
  // 명령형 ModalContainer 에만 적용되고, 선언형은 container 를 생략해 AfdsScope 자동 해석을 쓴다.
  it('Modal.Portal container={null}(선언형) 은 base-ui 규칙상 렌더되지 않는다', () => {
    render(
      <AfdsScope>
        <Modal.Root open>
          <Modal.Portal container={null}>
            <Modal.Content>
              <span>modal-null-norender</span>
            </Modal.Content>
          </Modal.Portal>
        </Modal.Root>
      </AfdsScope>,
    )
    expect(screen.queryByText('modal-null-norender')).toBeNull()
  })
})

describe('스코프 미사용 시 기존 동작(document.body 포털) 유지', () => {
  it('AfdsScope 없으면 Modal(선언형)은 .afds 밖(body)으로 포털된다', () => {
    render(
      <Modal.Root open>
        <Modal.Portal>
          <Modal.Content>
            <span>plain-modal-body</span>
          </Modal.Content>
        </Modal.Portal>
      </Modal.Root>,
    )
    const body = screen.getByText('plain-modal-body')
    expect(document.querySelector('[data-afds-portal]')).toBeNull()
    expect(body).toBeInTheDocument()
  })
})
