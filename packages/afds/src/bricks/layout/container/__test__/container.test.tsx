import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Container, Section } from '../container'

describe('Container', () => {
  describe('렌더링', () => {
    it('data-slot="container" 속성을 가진다', () => {
      render(<Container>content</Container>)
      const el = screen.getByText('content').closest('[data-slot="container"]')
      expect(el).toBeInTheDocument()
    })

    it('children을 렌더링한다', () => {
      render(<Container>container content</Container>)
      expect(screen.getByText('container content')).toBeInTheDocument()
    })

    it('w-full 클래스를 기본으로 가진다', () => {
      render(<Container>content</Container>)
      const el = screen.getByText('content').closest('[data-slot="container"]')
      expect(el).toHaveClass('w-full')
    })
  })

  describe('Props 변형', () => {
    it('center=true(기본값)이면 mx-auto 클래스를 가진다', () => {
      render(<Container>content</Container>)
      const el = screen.getByText('content').closest('[data-slot="container"]')
      expect(el).toHaveClass('mx-auto')
    })

    it('center=false이면 mx-auto 클래스를 가지지 않는다', () => {
      render(<Container center={false}>content</Container>)
      const el = screen.getByText('content').closest('[data-slot="container"]')
      expect(el).not.toHaveClass('mx-auto')
    })

    it('size="sm"이면 max-w-screen-sm 클래스를 가진다', () => {
      render(<Container size="sm">content</Container>)
      const el = screen.getByText('content').closest('[data-slot="container"]')
      expect(el).toHaveClass('max-w-screen-sm')
    })

    it('size="full"이면 max-w-full 클래스를 가진다', () => {
      render(<Container size="full">content</Container>)
      const el = screen.getByText('content').closest('[data-slot="container"]')
      expect(el).toHaveClass('max-w-full')
    })

    it('className이 적용된다', () => {
      render(<Container className="custom-class">content</Container>)
      const el = screen.getByText('content').closest('[data-slot="container"]')
      expect(el).toHaveClass('custom-class')
    })
  })
})

describe('Section', () => {
  describe('렌더링', () => {
    it('section 요소로 렌더링된다', () => {
      render(<Section>section content</Section>)
      const el = screen.getByText('section content')
      expect(el.tagName).toBe('SECTION')
    })

    it('children을 렌더링한다', () => {
      render(<Section>section content</Section>)
      expect(screen.getByText('section content')).toBeInTheDocument()
    })

    it('className이 적용된다', () => {
      render(<Section className="custom-section">section content</Section>)
      expect(screen.getByText('section content')).toHaveClass('custom-section')
    })
  })
})
