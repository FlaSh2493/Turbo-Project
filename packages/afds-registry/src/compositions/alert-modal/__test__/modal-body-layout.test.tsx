import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { AlertModal } from '../alert-modal'
import { NegativeModal } from '../../negative-modal/negative-modal'

/**
 * `Modal.Body` 는 더 이상 자식 콘텐츠에 `flex`/`flex-col`/`flex-1` 을 주입하지 않는다(#90).
 * 계약 6번(wrapper 가 임의 소비자 자식의 layout 을 강제하지 않는다)의 귀결로,
 * 필요한 레이아웃은 **콘텐츠가 스스로 선언**해야 한다.
 *
 * 이 회귀는 Chromatic 이 잡지 못한다 — 모달 스토리는 스냅샷 시점에 닫혀 있다.
 * 그래서 주입되던 셀렉터에 매칭되던 자손을 직접 열거해 단정한다.
 */
const bodyGrandchildren = () =>
  Array.from(
    document.querySelectorAll<HTMLElement>(
      '[data-slot="modal-body"] [data-slot="scroll-area-viewport"] > div > *',
    ),
  )

const cases = [
  {
    name: 'AlertModal',
    render: () =>
      render(<AlertModal open onOpenChange={() => {}} title="알림" message={'첫 줄\n둘째 줄'} />),
  },
  {
    name: 'NegativeModal',
    render: () =>
      render(
        <NegativeModal
          open
          onOpenChange={() => {}}
          onConfirm={() => {}}
          title="삭제"
          message={'첫 줄\n둘째 줄'}
        />,
      ),
  },
] as const

describe.each(cases)('$name — Modal.Body 콘텐츠 레이아웃 자립 (#90)', ({ render: renderCase }) => {
  it('본문 콘텐츠가 존재한다 (셀렉터가 빈 배열이라 공허하게 통과하지 않도록)', () => {
    renderCase()

    expect(bodyGrandchildren().length).toBeGreaterThan(0)
  })

  it('flex 컨테이너인 자손은 방향을 스스로 선언한다 (상속된 flex-col 에 의존하지 않는다)', () => {
    renderCase()

    const relyingOnInheritedDirection = bodyGrandchildren().filter(el => {
      const cls = el.className
      if (!/\bflex\b/.test(cls)) return false
      return !/\bflex-(col|row)\b/.test(cls)
    })

    // 여기 걸리면 Modal.Body 가 주입해 주던 flex-col 에 기대고 있다는 뜻이다.
    // 주입이 사라졌으므로 flex-direction 이 row 로 뒤집혀 justify-* 의 축이 바뀐다.
    expect(
      relyingOnInheritedDirection.map(el => el.className),
      '상속된 flex 방향에 의존하는 자손이 있다',
    ).toEqual([])
  })
})
