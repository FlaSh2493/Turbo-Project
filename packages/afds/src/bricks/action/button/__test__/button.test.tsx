import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '../button'

describe('Button', () => {
  describe('렌더링', () => {
    it('버튼 요소를 렌더링한다', () => {
      render(<Button>클릭</Button>)
      expect(screen.getByRole('button', { name: '클릭' })).toBeInTheDocument()
    })

    it('data-slot="button" 속성을 가진다', () => {
      render(<Button>클릭</Button>)
      expect(screen.getByRole('button')).toHaveAttribute('data-slot', 'button')
    })

    it('children을 렌더링한다', () => {
      render(<Button>텍스트 내용</Button>)
      expect(screen.getByText('텍스트 내용')).toBeInTheDocument()
    })
  })

  describe('상호작용', () => {
    it('onClick이 호출된다', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()
      render(<Button onClick={handleClick}>클릭</Button>)

      await user.click(screen.getByRole('button'))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('disabled 상태에서는 클릭이 동작하지 않는다', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()
      render(
        <Button disabled onClick={handleClick}>
          클릭
        </Button>,
      )

      await user.click(screen.getByRole('button'))
      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('Props 변형', () => {
    it('variant prop이 data-variant 속성으로 설정된다', () => {
      render(<Button variant="danger">클릭</Button>)
      expect(screen.getByRole('button')).toHaveAttribute('data-variant', 'danger')
    })

    it('variant="fill"이 기본값이다', () => {
      render(<Button>클릭</Button>)
      expect(screen.getByRole('button')).toHaveAttribute('data-variant', 'fill')
    })

    it('variant="primary-line"이 설정된다', () => {
      render(<Button variant="primary-line">클릭</Button>)
      expect(screen.getByRole('button')).toHaveAttribute('data-variant', 'primary-line')
    })

    it('variant="line"이 설정된다', () => {
      render(<Button variant="line">클릭</Button>)
      expect(screen.getByRole('button')).toHaveAttribute('data-variant', 'line')
    })

    it('variant="ghost"이 설정된다', () => {
      render(<Button variant="ghost">클릭</Button>)
      expect(screen.getByRole('button')).toHaveAttribute('data-variant', 'ghost')
    })

    it('size prop이 data-size 속성으로 설정된다', () => {
      render(<Button size="sm">클릭</Button>)
      expect(screen.getByRole('button')).toHaveAttribute('data-size', 'sm')
    })

    it('size="md"이 기본값이다', () => {
      render(<Button>클릭</Button>)
      expect(screen.getByRole('button')).toHaveAttribute('data-size', 'md')
    })

    it('size="lg"가 설정된다', () => {
      render(<Button size="lg">클릭</Button>)
      expect(screen.getByRole('button')).toHaveAttribute('data-size', 'lg')
    })

    it('className이 적용된다', () => {
      render(<Button className="custom-class">클릭</Button>)
      expect(screen.getByRole('button')).toHaveClass('custom-class')
    })

    it('disabled 속성이 설정된다', () => {
      render(<Button disabled>클릭</Button>)
      expect(screen.getByRole('button')).toBeDisabled()
    })
  })

  describe('접근성', () => {
    it('role="button"을 가진다', () => {
      render(<Button>클릭</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('disabled 상태가 접근성 트리에 반영된다', () => {
      render(<Button disabled>클릭</Button>)
      expect(screen.getByRole('button')).toHaveAttribute('disabled')
    })

    it('type 속성을 전달할 수 있다', () => {
      render(<Button type="submit">제출</Button>)
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
    })
  })
})
