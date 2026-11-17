import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Spinner } from '../spinner'

describe('Spinner', () => {
  describe('렌더링', () => {
    it('data-slot="spinner" 속성을 가진 요소를 렌더링한다', () => {
      render(<Spinner />)
      expect(document.querySelector('[data-slot="spinner"]')).toBeInTheDocument()
    })

    it('role="status"를 가진 요소를 렌더링한다', () => {
      render(<Spinner />)
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('SVG 요소를 렌더링한다', () => {
      render(<Spinner />)
      expect(document.querySelector('svg')).toBeInTheDocument()
    })
  })

  describe('Props 변형', () => {
    it('size="xs" prop이 허용된다', () => {
      render(<Spinner size="xs" />)
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('size="sm" prop이 허용된다(기본값)', () => {
      render(<Spinner size="sm" />)
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('size="md" prop이 허용된다', () => {
      render(<Spinner size="md" />)
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('size="lg" prop이 허용된다', () => {
      render(<Spinner size="lg" />)
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('fullscreen prop이 허용된다', () => {
      render(<Spinner fullscreen="page" />)
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('dim prop이 허용된다', () => {
      render(<Spinner dim="black" />)
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('className이 적용된다', () => {
      render(<Spinner className="custom-class" />)
      expect(screen.getByRole('status')).toHaveClass('custom-class')
    })
  })

  describe('접근성', () => {
    it('aria-label="loading"이 설정된다', () => {
      render(<Spinner />)
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'loading')
    })

    it('스크린 리더에서 status 역할로 인식된다', () => {
      render(<Spinner />)
      expect(screen.getByRole('status')).toBeInTheDocument()
    })
  })
})
