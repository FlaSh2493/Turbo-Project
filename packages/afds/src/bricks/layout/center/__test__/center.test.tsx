import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Center } from '../center'

describe('Center', () => {
  describe('렌더링', () => {
    it('data-slot="center" 속성을 가진다', () => {
      render(<Center>content</Center>)
      const el = screen.getByText('content').closest('[data-slot="center"]')
      expect(el).toBeInTheDocument()
    })

    it('children을 렌더링한다', () => {
      render(<Center>centered content</Center>)
      expect(screen.getByText('centered content')).toBeInTheDocument()
    })

    it('기본적으로 flex 클래스를 가진다', () => {
      render(<Center>content</Center>)
      const el = screen.getByText('content').closest('[data-slot="center"]')
      expect(el).toHaveClass('flex')
    })
  })

  describe('Props 변형', () => {
    it('className이 적용된다', () => {
      render(<Center className="custom-class">content</Center>)
      const el = screen.getByText('content').closest('[data-slot="center"]')
      expect(el).toHaveClass('custom-class')
    })

    it('inline=true이면 data-inline 속성을 가진다', () => {
      render(<Center inline>content</Center>)
      const el = screen.getByText('content').closest('[data-slot="center"]')
      expect(el).toHaveAttribute('data-inline', 'true')
    })
  })

  describe('접근성', () => {
    it('HTML 속성이 전달된다', () => {
      render(<Center role="region">content</Center>)
      expect(screen.getByRole('region')).toBeInTheDocument()
    })
  })
})
