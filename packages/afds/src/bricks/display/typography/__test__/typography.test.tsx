import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Typography } from '../typography'

describe('Typography', () => {
  describe('렌더링', () => {
    it('기본적으로 span 엘리먼트로 렌더링된다', () => {
      const { container } = render(<Typography>텍스트</Typography>)
      expect(container.firstChild?.nodeName).toBe('SPAN')
    })

    it('data-slot="typography" 속성이 존재한다', () => {
      const { container } = render(<Typography>텍스트</Typography>)
      expect(container.querySelector('[data-slot="typography"]')).toBeInTheDocument()
    })

    it('children 텍스트를 렌더링한다', () => {
      render(<Typography>안녕하세요</Typography>)
      expect(screen.getByText('안녕하세요')).toBeInTheDocument()
    })
  })

  describe('Props 변형', () => {
    it('as="p"로 paragraph 엘리먼트를 렌더링한다', () => {
      const { container } = render(<Typography as="p">단락 텍스트</Typography>)
      expect(container.firstChild?.nodeName).toBe('P')
    })

    it('as="h1"로 h1 엘리먼트를 렌더링한다', () => {
      const { container } = render(<Typography as="h1">제목</Typography>)
      expect(container.firstChild?.nodeName).toBe('H1')
    })

    it('className prop이 엘리먼트에 적용된다', () => {
      const { container } = render(<Typography className="custom-typography">텍스트</Typography>)
      expect(container.firstChild).toHaveClass('custom-typography')
    })

    it('variant prop을 전달해도 에러 없이 렌더링된다', () => {
      render(<Typography variant="body1">텍스트</Typography>)
      expect(screen.getByText('텍스트')).toBeInTheDocument()
    })

    it('color prop을 전달해도 에러 없이 렌더링된다', () => {
      render(<Typography color="text-secondary">텍스트</Typography>)
      expect(screen.getByText('텍스트')).toBeInTheDocument()
    })

    it('variant와 color를 함께 전달해도 에러 없이 렌더링된다', () => {
      render(
        <Typography variant="body2" color="text-secondary">
          본문 텍스트
        </Typography>,
      )
      expect(screen.getByText('본문 텍스트')).toBeInTheDocument()
    })
  })

  describe('접근성', () => {
    it('as="p"로 렌더링 시 단락으로 접근 가능하다', () => {
      render(<Typography as="p">단락</Typography>)
      expect(screen.getByText('단락').tagName).toBe('P')
    })

    it('data-slot 속성으로 컴포넌트를 식별할 수 있다', () => {
      const { container } = render(<Typography>텍스트</Typography>)
      expect(container.querySelector('[data-slot="typography"]')).toBeInTheDocument()
    })
  })
})
