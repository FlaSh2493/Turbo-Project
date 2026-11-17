import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Box } from '../box'

describe('Box', () => {
  describe('렌더링', () => {
    it('div 요소로 렌더링된다', () => {
      render(<Box>content</Box>)
      const el = screen.getByText('content')
      expect(el.tagName).toBe('DIV')
    })

    it('data-slot="box" 속성을 가진다', () => {
      render(<Box>content</Box>)
      const el = screen.getByText('content')
      expect(el).toHaveAttribute('data-slot', 'box')
    })

    it('children을 렌더링한다', () => {
      render(<Box>hello box</Box>)
      expect(screen.getByText('hello box')).toBeInTheDocument()
    })
  })

  describe('Props 변형', () => {
    it('className이 적용된다', () => {
      render(<Box className="custom-class">content</Box>)
      expect(screen.getByText('content')).toHaveClass('custom-class')
    })
  })

  describe('접근성', () => {
    it('HTML 속성이 전달된다', () => {
      render(<Box aria-label="box region">content</Box>)
      expect(screen.getByText('content')).toHaveAttribute('aria-label', 'box region')
    })
  })
})
