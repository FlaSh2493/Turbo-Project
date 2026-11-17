import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Modal } from '../modal'

/**
 * 이슈 #90 — Modal.Body 가 소비자 콘텐츠의 손자 요소에 flex/flex-col/flex-1 을 강제 주입해
 * 소비자가 `flex-row` 로 덮을 수 없었다.
 *
 * `[&>div>*]:flex-col` 의 특이도는 (0,1,1) 이고 소비자 `.flex-row` 는 (0,1,0) 이라
 * 항상 AFDS 규칙이 이긴다. cn()/twMerge 도 arbitrary variant 와 평범한 유틸리티를
 * 같은 그룹으로 보지 않아 병합으로 해결되지 않는다.
 *
 * jsdom 에는 CSS 엔진이 없어 getComputedStyle 로 flex-direction 을 확인할 수 없다.
 * 따라서 원인인 "임의 소비자 콘텐츠를 겨냥한 descendant 유틸리티가 주입되는가" 를 직접 검증한다.
 * (시각 회귀는 Chromatic 이 담당한다.)
 */
describe('Modal.Body 레이아웃 강제 주입 (#90)', () => {
  const renderBody = () => {
    render(
      <Modal.Root open>
        <Modal.Portal>
          <Modal.Content>
            <Modal.Body>
              <div className="flex flex-row justify-between">
                <span>A</span>
                <span>B</span>
              </div>
            </Modal.Body>
          </Modal.Content>
        </Modal.Portal>
      </Modal.Root>,
    )
    return document.querySelector('[data-slot="modal-body"]')!
  }

  it('소비자 콘텐츠를 겨냥한 descendant 유틸리티를 주입하지 않는다', () => {
    const body = renderBody()

    // 뷰포트를 포함한 Body 하위 전체에서 [&>div>*] 계열 유틸리티가 없어야 한다.
    const withDescendantUtils = Array.from(body.querySelectorAll('*'))
      .concat(body)
      .filter(el => /\[&>div>\*\]:/.test(el.className?.toString() ?? ''))

    expect(withDescendantUtils).toHaveLength(0)
  })

  it('소비자가 지정한 flex-row 클래스가 그대로 남는다', () => {
    renderBody()

    expect(screen.getByText('A').parentElement).toHaveClass('flex', 'flex-row')
  })

  it('Body 자신의 세로 스택 레이아웃은 유지된다', () => {
    const body = renderBody()
    const viewport = body.querySelector('.flex-col')

    expect(viewport).not.toBeNull()
  })
})
