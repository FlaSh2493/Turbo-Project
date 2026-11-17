import { describe, expect, it, vi } from 'vitest'
import { createRef, useEffect, useLayoutEffect, useRef } from 'react'
import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OverflowTooltip } from '../overflow-tooltip'

/**
 * 이 컴포지션의 존재 이유는 **글자가 잘렸을 때만** 툴팁을 보여주는 것이다.
 *
 * 예전에는 `open`/`onOpenChange` 가 `{...props}` **앞**에 있어서, 소비자가 둘 중 하나만 넘겨도
 * overflow 감지가 통째로 죽고 평범한 툴팁이 됐다 — 조용히, 아무 경고 없이.
 * 여기서 지키는 것은 "가드가 조용해졌다" 가 아니라 **그 동작이 실제로 살아 있다** 는 것이다.
 */

/** jsdom 은 레이아웃을 계산하지 않는다 — 잘림 여부를 직접 만들어 준다. */
const setOverflow = (el: HTMLElement, truncated: boolean) => {
  Object.defineProperty(el, 'scrollWidth', { configurable: true, value: truncated ? 200 : 50 })
  Object.defineProperty(el, 'clientWidth', { configurable: true, value: 100 })
}

const getTextSpan = () => document.querySelector('span.truncate') as HTMLElement
/** Base UI 팝업에는 `role="tooltip"` 이 없다 — 실제 DOM 을 확인하고 슬롯으로 찾는다. */
const queryTooltip = () => document.querySelector('[data-slot="tooltip-popup"]')
const findTooltip = async () => {
  await waitFor(() => expect(queryTooltip()).not.toBeNull())
  return queryTooltip()
}

describe('OverflowTooltip — 소비자 props 와 내부 동작의 합성', () => {
  it('소비자 onOpenChange 를 넘겨도 overflow 감지가 죽지 않는다', async () => {
    const user = userEvent.setup()
    const consumerOnOpenChange = vi.fn()

    render(
      <OverflowTooltip delay={0} onOpenChange={consumerOnOpenChange}>
        아주 긴 텍스트
      </OverflowTooltip>,
    )
    setOverflow(getTextSpan(), true)

    await user.hover(getTextSpan())

    // 소비자 콜백이 불렸고,
    expect(consumerOnOpenChange).toHaveBeenCalled()
    // **내부 감지도 살아남아** 툴팁이 열렸다. 예전에는 여기서 영원히 닫힌 채였다.
    expect(await findTooltip()).toBeInTheDocument()
  })

  it('잘리지 않은 텍스트는 소비자 onOpenChange 가 있어도 툴팁을 열지 않는다', async () => {
    const user = userEvent.setup()
    const consumerOnOpenChange = vi.fn()

    render(
      <OverflowTooltip delay={0} onOpenChange={consumerOnOpenChange}>
        짧다
      </OverflowTooltip>,
    )
    setOverflow(getTextSpan(), false)

    await user.hover(getTextSpan())

    expect(consumerOnOpenChange).toHaveBeenCalled()
    expect(queryTooltip()).toBeNull()
  })

  it('소비자가 open 을 명시하면 제어 컴포넌트로 전환된다 (잘리지 않아도 열린다)', async () => {
    render(
      <OverflowTooltip delay={0} open onOpenChange={() => {}}>
        짧다
      </OverflowTooltip>,
    )
    setOverflow(getTextSpan(), false)

    expect(await findTooltip()).toBeInTheDocument()
  })

  // **`??` 의 의미론을 고정한다.** `||` 로 바꿔도 나머지 4건이 전부 통과한다(실측) —
  // 그러면 `open={false}` 로 강제로 닫아 둔 소비자가 잘린 텍스트에 hover 할 때 툴팁이 열린다.
  // 현재 코드는 옳지만 그 옳음이 고정돼 있지 않았다.
  it('open={false} 를 명시하면 잘려도 열리지 않는다 (?? 를 || 로 바꾸면 깨진다)', async () => {
    const user = userEvent.setup()
    render(
      <OverflowTooltip delay={0} open={false} onOpenChange={() => {}}>
        아주 긴 텍스트
      </OverflowTooltip>,
    )
    setOverflow(getTextSpan(), true)

    await user.hover(getTextSpan())
    await new Promise(r => setTimeout(r, 60))

    expect(queryTooltip()).toBeNull()
  })

  it('open 을 넘기지 않으면 내부 감지 결과를 쓴다', async () => {
    const user = userEvent.setup()
    render(<OverflowTooltip delay={0}>아주 긴 텍스트</OverflowTooltip>)
    setOverflow(getTextSpan(), true)

    expect(queryTooltip()).toBeNull()
    await user.hover(getTextSpan())
    expect(await findTooltip()).toBeInTheDocument()
  })
})

describe('OverflowTooltip — axis · ref', () => {
  it('axis="block" 은 truncate 를 붙이지 않고 세로로 잘릴 때 툴팁을 연다', async () => {
    const user = userEvent.setup()
    render(
      <OverflowTooltip delay={0} axis="block" className="line-clamp-2">
        여러 줄 텍스트
      </OverflowTooltip>,
    )
    const span = document.querySelector('span.line-clamp-2') as HTMLElement
    expect(span).not.toHaveClass('truncate')
    Object.defineProperty(span, 'scrollHeight', { configurable: true, value: 80 })
    Object.defineProperty(span, 'clientHeight', { configurable: true, value: 40 })

    await user.hover(span)
    expect(await findTooltip()).toBeInTheDocument()
  })

  it('axis="block" 에서 가로 크기만 넘치면 열지 않는다', async () => {
    const user = userEvent.setup()
    render(
      <OverflowTooltip delay={0} axis="block" className="line-clamp-2">
        여러 줄 텍스트
      </OverflowTooltip>,
    )
    setOverflow(document.querySelector('span.line-clamp-2') as HTMLElement, true)

    await user.hover(document.querySelector('span.line-clamp-2') as HTMLElement)
    await new Promise(r => setTimeout(r, 60))
    expect(queryTooltip()).toBeNull()
  })

  it('forwardRef 는 텍스트 span 을 가리킨다', () => {
    const ref = createRef<HTMLSpanElement>()
    render(<OverflowTooltip ref={ref}>텍스트</OverflowTooltip>)
    expect(ref.current).toBe(getTextSpan())
  })

  // 기존 forwardRef 테스트는 render() 가 리렌더까지 flush 한 뒤 단정해서 이 회귀를 못 잡는다.
  it('부모의 첫 마운트 effect 에서 ref 가 이미 요소를 가리킨다', () => {
    const seen: { layout?: HTMLElement | null; effect?: HTMLElement | null } = {}
    const calls: (HTMLElement | null)[] = []

    function Parent() {
      const ref = useRef<HTMLSpanElement>(null)
      useLayoutEffect(() => {
        seen.layout = ref.current
      }, [])
      useEffect(() => {
        seen.effect = ref.current
      }, [])
      return <OverflowTooltip ref={ref}>텍스트</OverflowTooltip>
    }
    render(<Parent />)
    expect(seen.layout).toBe(getTextSpan())
    expect(seen.effect).toBe(getTextSpan())

    render(<OverflowTooltip ref={el => calls.push(el)}>텍스트</OverflowTooltip>)
    // 콜백 ref 도 null 이 아니라 요소로 처음 불린다.
    expect(calls[0]).toBeInstanceOf(HTMLSpanElement)
  })
})
