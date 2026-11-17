import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FadeIn } from '../fade-in'

describe('FadeIn', () => {
  describe('렌더링', () => {
    it('children을 렌더링한다', () => {
      render(<FadeIn>페이드 인 콘텐츠</FadeIn>)
      expect(screen.getByText('페이드 인 콘텐츠')).toBeInTheDocument()
    })

    it('data-slot="fade-in" 속성이 존재한다', () => {
      const { container } = render(<FadeIn>콘텐츠</FadeIn>)
      expect(container.querySelector('[data-slot="fade-in"]')).toBeInTheDocument()
    })

    it('기본적으로 div 엘리먼트로 렌더링된다', () => {
      const { container } = render(<FadeIn>콘텐츠</FadeIn>)
      expect(container.firstChild?.nodeName).toBe('DIV')
    })
  })

  describe('Props 변형', () => {
    it('as prop으로 다른 HTML 엘리먼트를 렌더링한다', () => {
      const { container } = render(<FadeIn as="section">콘텐츠</FadeIn>)
      expect(container.firstChild?.nodeName).toBe('SECTION')
    })

    it('as="span"으로 span 엘리먼트를 렌더링한다', () => {
      const { container } = render(<FadeIn as="span">콘텐츠</FadeIn>)
      expect(container.firstChild?.nodeName).toBe('SPAN')
    })

    it('duration prop이 CSS 변수로 적용된다', () => {
      const { container } = render(<FadeIn duration={500}>콘텐츠</FadeIn>)
      const el = container.firstChild as HTMLElement
      expect(el.style.getPropertyValue('--fi-duration')).toBe('500ms')
    })

    it('기본 duration(300ms)이 CSS 변수로 적용된다', () => {
      const { container } = render(<FadeIn>콘텐츠</FadeIn>)
      const el = container.firstChild as HTMLElement
      expect(el.style.getPropertyValue('--fi-duration')).toBe('300ms')
    })

    it('delay prop이 CSS 변수로 적용된다', () => {
      const { container } = render(<FadeIn delay={100}>콘텐츠</FadeIn>)
      const el = container.firstChild as HTMLElement
      expect(el.style.getPropertyValue('--fi-delay')).toBe('100ms')
    })

    it('delay가 0이면 CSS 변수를 설정하지 않는다', () => {
      const { container } = render(<FadeIn delay={0}>콘텐츠</FadeIn>)
      const el = container.firstChild as HTMLElement
      expect(el.style.getPropertyValue('--fi-delay')).toBe('')
    })

    it('className prop이 엘리먼트에 적용된다', () => {
      const { container } = render(<FadeIn className="custom-class">콘텐츠</FadeIn>)
      expect(container.firstChild).toHaveClass('custom-class')
    })
  })

  describe('접근성', () => {
    it('data-slot 속성으로 식별 가능하다', () => {
      const { container } = render(<FadeIn>콘텐츠</FadeIn>)
      expect(container.querySelector('[data-slot="fade-in"]')).toBeInTheDocument()
    })
  })
})
