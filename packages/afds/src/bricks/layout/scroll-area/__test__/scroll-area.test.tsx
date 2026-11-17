import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ScrollArea } from '../scroll-area'

describe('ScrollArea', () => {
  describe('렌더링', () => {
    it('data-slot="scroll-area" 속성을 가진 요소가 존재한다', () => {
      const { container } = render(<ScrollArea>content</ScrollArea>)
      expect(container.querySelector('[data-slot="scroll-area"]')).toBeInTheDocument()
    })

    it('children을 렌더링한다', () => {
      render(<ScrollArea>scrollable content</ScrollArea>)
      expect(screen.getByText('scrollable content')).toBeInTheDocument()
    })
  })

  describe('Props 변형', () => {
    it('className이 scroll-area 루트에 적용된다', () => {
      const { container } = render(<ScrollArea className="custom-scroll">content</ScrollArea>)
      const el = container.querySelector('[data-slot="scroll-area"]')
      expect(el).toHaveClass('custom-scroll')
    })

    it('hideVertical=true이면 렌더링 오류 없이 동작한다', () => {
      const { container } = render(<ScrollArea hideVertical>content</ScrollArea>)
      expect(container.querySelector('[data-slot="scroll-area"]')).toBeInTheDocument()
    })

    it('hideHorizontal=true이면 렌더링 오류 없이 동작한다', () => {
      const { container } = render(<ScrollArea hideHorizontal>content</ScrollArea>)
      expect(container.querySelector('[data-slot="scroll-area"]')).toBeInTheDocument()
    })
  })
})
