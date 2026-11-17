import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FadeSwap } from '../fade-swap'

/** `data-slot="fade-swap"` 루트. 애니메이션 style 이 단계(phase)의 유일한 관측 지점이다. */
const slotOf = (c: HTMLElement) => c.querySelector('[data-slot="fade-swap"]') as HTMLElement

describe('FadeSwap', () => {
  describe('렌더링', () => {
    it('초기 children을 렌더링한다', () => {
      render(
        <FadeSwap>
          <div key="a">첫 번째 콘텐츠</div>
        </FadeSwap>,
      )
      expect(screen.getByText('첫 번째 콘텐츠')).toBeInTheDocument()
    })

    it('data-slot="fade-swap" 속성이 존재한다', () => {
      const { container } = render(
        <FadeSwap>
          <div key="a">콘텐츠</div>
        </FadeSwap>,
      )
      expect(container.querySelector('[data-slot="fade-swap"]')).toBeInTheDocument()
    })

    it('div 엘리먼트로 렌더링된다', () => {
      const { container } = render(
        <FadeSwap>
          <div key="a">콘텐츠</div>
        </FadeSwap>,
      )
      expect(container.firstChild?.nodeName).toBe('DIV')
    })
  })

  describe('Props 변형', () => {
    it('duration prop을 받아도 에러 없이 렌더링된다', () => {
      render(
        <FadeSwap duration={400}>
          <div key="a">콘텐츠</div>
        </FadeSwap>,
      )
      expect(screen.getByText('콘텐츠')).toBeInTheDocument()
    })

    it('className prop이 엘리먼트에 적용된다', () => {
      const { container } = render(
        <FadeSwap className="custom-class">
          <div key="a">콘텐츠</div>
        </FadeSwap>,
      )
      expect(container.firstChild).toHaveClass('custom-class')
    })

    it('key가 바뀌면 exiting 단계를 시작한다', () => {
      const { container, rerender } = render(
        <FadeSwap duration={200}>
          <div key="a">콘텐츠 A</div>
        </FadeSwap>,
      )

      rerender(
        <FadeSwap duration={200}>
          <div key="b">콘텐츠 B</div>
        </FadeSwap>,
      )

      // exiting 단계에서 fade-out 애니메이션 style이 적용되어야 한다
      const wrapper = container.querySelector('[data-slot="fade-swap"]') as HTMLElement
      expect(wrapper).toBeInTheDocument()
      // 이전 콘텐츠(A)가 아직 표시되며 exit 애니메이션 중이어야 한다
      expect(wrapper.style.animation).toMatch(/exit/)
    })

    // 아래 셋은 `pendingRef` 를 읽고 쓰는 경로다 — 이 컴포넌트의 상태 기계 핵심인데
    // 그동안 검사되지 않았다. **현재 동작을 관측해 그대로 고정한다**(옳다고 생각하는
    // 동작이 아니라). 이 컴포넌트는 시각 확인 수단이 없어 여기가 유일한 안전망이다.

    it('★ exiting 중 원래 key 로 돌아오면 즉시 visible 로 취소된다', () => {
      const { container, rerender } = render(
        <FadeSwap duration={200}>
          <div key="a">A</div>
        </FadeSwap>,
      )
      rerender(
        <FadeSwap duration={200}>
          <div key="b">B</div>
        </FadeSwap>,
      )
      expect(slotOf(container).style.animation).toMatch(/exit/)

      rerender(
        <FadeSwap duration={200}>
          <div key="a">A</div>
        </FadeSwap>,
      )
      // 애니메이션이 걷히고(= visible) 표시 콘텐츠는 A 그대로다.
      expect(slotOf(container).style.animation).toBe('')
      expect(container.textContent).toBe('A')
    })

    it('★ exit 이 끝나면 대기 중이던 children 을 표시하고 enter 로 넘어간다', () => {
      const { container, rerender } = render(
        <FadeSwap duration={200}>
          <div key="a">A</div>
        </FadeSwap>,
      )
      rerender(
        <FadeSwap duration={200}>
          <div key="b">B</div>
        </FadeSwap>,
      )
      expect(container.textContent).toBe('A')

      fireEvent.animationEnd(slotOf(container))
      expect(container.textContent).toBe('B')
      expect(slotOf(container).style.animation).toMatch(/enter/)

      // enter 가 끝나면 애니메이션이 걷힌다.
      fireEvent.animationEnd(slotOf(container))
      expect(slotOf(container).style.animation).toBe('')
      expect(container.textContent).toBe('B')
    })

    it('★ 자식에서 올라온 animationEnd 는 단계를 진행시키지 않는다', () => {
      // 내부 콘텐츠가 자체 애니메이션을 가지면 그 종료 이벤트가 버블링된다.
      // `e.target !== e.currentTarget` 가드가 없으면 exit 이 끝나지도 않았는데 교체된다.
      const { container, rerender } = render(
        <FadeSwap duration={200}>
          <div key="a">A</div>
        </FadeSwap>,
      )
      rerender(
        <FadeSwap duration={200}>
          <div key="b">B</div>
        </FadeSwap>,
      )
      const child = slotOf(container).firstElementChild as HTMLElement
      fireEvent.animationEnd(child)

      expect(container.textContent).toBe('A')
      expect(slotOf(container).style.animation).toMatch(/exit/)
    })

    it('★ 자식에서 올라온 animationEnd 는 소비자 onAnimationEnd 도 부르지 않는다', () => {
      // 가드는 단계 진행만 막는 것이 아니라 **자식 이벤트를 소비자 콜백에서도 삼킨다.**
      // 네이티브 `<div onAnimationEnd>` 는 버블링된 자식 이벤트로도 발화하므로 다른 계약이다.
      // 이 단정이 없으면 `onAnimationEnd?.(e)` 를 가드 앞으로 옮겨도 아무것도 실패하지 않는다.
      const onAnimationEnd = vi.fn()
      const { container, rerender } = render(
        <FadeSwap duration={200} onAnimationEnd={onAnimationEnd}>
          <div key="a">A</div>
        </FadeSwap>,
      )
      rerender(
        <FadeSwap duration={200} onAnimationEnd={onAnimationEnd}>
          <div key="b">B</div>
        </FadeSwap>,
      )

      fireEvent.animationEnd(slotOf(container).firstElementChild as HTMLElement)
      expect(onAnimationEnd).not.toHaveBeenCalled()

      // 대조군 — 루트에서 온 이벤트는 부른다. 그래야 위 0 이 "콜백이 아예 안 붙었다" 가 아니다.
      fireEvent.animationEnd(slotOf(container))
      expect(onAnimationEnd).toHaveBeenCalledTimes(1)
    })
  })

  describe('접근성', () => {
    it('data-slot 속성으로 식별 가능하다', () => {
      const { container } = render(
        <FadeSwap>
          <div key="a">콘텐츠</div>
        </FadeSwap>,
      )
      expect(container.querySelector('[data-slot="fade-swap"]')).toBeInTheDocument()
    })
  })
})
