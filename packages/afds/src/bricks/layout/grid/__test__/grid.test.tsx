import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Grid } from '../grid'

describe('Grid', () => {
  describe('렌더링', () => {
    it('data-slot="grid" 속성을 가진다', () => {
      render(<Grid>content</Grid>)
      const el = screen.getByText('content').closest('[data-slot="grid"]')
      expect(el).toBeInTheDocument()
    })

    it('children을 렌더링한다', () => {
      render(<Grid>grid content</Grid>)
      expect(screen.getByText('grid content')).toBeInTheDocument()
    })

    it('grid 클래스를 기본으로 가진다', () => {
      render(<Grid>content</Grid>)
      const el = screen.getByText('content').closest('[data-slot="grid"]')
      expect(el).toHaveClass('grid')
    })
  })

  describe('Props 변형', () => {
    it('columns(숫자)가 gridTemplateColumns 스타일로 적용된다', () => {
      render(<Grid columns={3}>content</Grid>)
      const el = screen.getByText('content').closest('[data-slot="grid"]')
      expect(el).toHaveStyle({ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' })
    })

    it('columns(문자열)가 gridTemplateColumns 스타일로 적용된다', () => {
      render(<Grid columns="1fr 2fr">content</Grid>)
      const el = screen.getByText('content').closest('[data-slot="grid"]')
      expect(el).toHaveStyle({ gridTemplateColumns: '1fr 2fr' })
    })

    it('gap이 클래스로 적용된다', () => {
      render(<Grid gap="spacing-20">content</Grid>)
      const el = screen.getByText('content').closest('[data-slot="grid"]')
      expect(el).toHaveClass('gap-afds-spacing-20')
    })

    it('flow="col"이면 grid-flow-col 클래스를 가진다', () => {
      render(<Grid flow="col">content</Grid>)
      const el = screen.getByText('content').closest('[data-slot="grid"]')
      expect(el).toHaveClass('grid-flow-col')
    })

    it('align="center"이면 items-center 클래스를 가진다', () => {
      render(<Grid align="center">content</Grid>)
      const el = screen.getByText('content').closest('[data-slot="grid"]')
      expect(el).toHaveClass('items-center')
    })

    it('className이 적용된다', () => {
      render(<Grid className="custom-grid">content</Grid>)
      const el = screen.getByText('content').closest('[data-slot="grid"]')
      expect(el).toHaveClass('custom-grid')
    })
  })

  describe('접근성', () => {
    it('HTML 속성이 전달된다', () => {
      render(<Grid aria-label="grid layout">content</Grid>)
      const el = screen.getByText('content').closest('[data-slot="grid"]')
      expect(el).toHaveAttribute('aria-label', 'grid layout')
    })
  })
})
