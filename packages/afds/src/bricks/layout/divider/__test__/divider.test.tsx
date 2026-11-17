import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Divider } from '../divider'

describe('Divider', () => {
  describe('렌더링', () => {
    it('separator 역할을 가진 요소로 렌더링된다', () => {
      render(<Divider />)
      expect(screen.getByRole('separator')).toBeInTheDocument()
    })

    it('기본적으로 horizontal 방향으로 렌더링된다', () => {
      render(<Divider />)
      const el = screen.getByRole('separator')
      expect(el).toHaveAttribute('data-orientation', 'horizontal')
    })
  })

  describe('Props 변형', () => {
    it('orientation="vertical"이 적용된다', () => {
      render(<Divider orientation="vertical" />)
      const el = screen.getByRole('separator')
      expect(el).toHaveAttribute('data-orientation', 'vertical')
    })

    it('className이 적용된다', () => {
      render(<Divider className="custom-divider" />)
      expect(screen.getByRole('separator')).toHaveClass('custom-divider')
    })
  })

  describe('접근성', () => {
    it('aria-orientation 속성이 설정된다', () => {
      render(<Divider orientation="vertical" />)
      const el = screen.getByRole('separator')
      expect(el).toHaveAttribute('aria-orientation', 'vertical')
    })
  })
})
