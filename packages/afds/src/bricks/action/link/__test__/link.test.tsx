import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link } from '../link'

describe('Link', () => {
  describe('렌더링', () => {
    it('앵커 요소를 렌더링한다', () => {
      render(<Link href="https://example.com">링크</Link>)
      expect(screen.getByRole('link', { name: '링크' })).toBeInTheDocument()
    })

    it('data-slot="link" 속성을 가진다', () => {
      render(<Link href="https://example.com">링크</Link>)
      expect(screen.getByRole('link')).toHaveAttribute('data-slot', 'link')
    })

    it('children을 렌더링한다', () => {
      render(<Link href="https://example.com">링크 텍스트</Link>)
      expect(screen.getByText('링크 텍스트')).toBeInTheDocument()
    })

    it('복합 children을 렌더링한다', () => {
      render(
        <Link href="https://example.com">
          <span>아이콘</span>
          <span>텍스트</span>
        </Link>,
      )
      expect(screen.getByText('아이콘')).toBeInTheDocument()
      expect(screen.getByText('텍스트')).toBeInTheDocument()
    })
  })

  describe('상호작용', () => {
    it('키보드로 포커스 가능하다', async () => {
      const user = userEvent.setup()
      render(<Link href="https://example.com">링크</Link>)

      await user.tab()
      expect(screen.getByRole('link', { name: '링크' })).toHaveFocus()
    })
  })

  describe('Props 변형', () => {
    it('href가 앵커 요소에 전달된다', () => {
      render(<Link href="https://example.com">링크</Link>)
      expect(screen.getByRole('link')).toHaveAttribute('href', 'https://example.com')
    })

    it('target="_blank"가 설정된다', () => {
      render(
        <Link href="https://example.com" target="_blank">
          외부 링크
        </Link>,
      )
      expect(screen.getByRole('link')).toHaveAttribute('target', '_blank')
    })

    it('rel 속성이 전달된다', () => {
      render(
        <Link href="https://example.com" rel="noopener noreferrer">
          링크
        </Link>,
      )
      expect(screen.getByRole('link')).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('className이 적용된다', () => {
      render(
        <Link href="https://example.com" className="custom-link">
          링크
        </Link>,
      )
      expect(screen.getByRole('link')).toHaveClass('custom-link')
    })

    it('href가 없으면 앵커로 렌더링된다', () => {
      render(<Link>링크</Link>)
      expect(document.querySelector('a[data-slot="link"]')).toBeInTheDocument()
    })
  })

  describe('접근성', () => {
    it('role="link"을 가진다', () => {
      render(<Link href="https://example.com">링크</Link>)
      expect(screen.getByRole('link')).toBeInTheDocument()
    })

    it('children으로 접근 가능한 이름이 제공된다', () => {
      render(<Link href="https://example.com">접근 가능한 링크</Link>)
      expect(screen.getByRole('link', { name: '접근 가능한 링크' })).toBeInTheDocument()
    })

    it('aria-label이 전달된다', () => {
      render(
        <Link href="https://example.com" aria-label="홈으로 이동">
          홈
        </Link>,
      )
      expect(screen.getByRole('link', { name: '홈으로 이동' })).toBeInTheDocument()
    })
  })
})
