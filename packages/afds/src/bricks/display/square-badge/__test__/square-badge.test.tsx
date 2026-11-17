import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SquareBadge } from '../square-badge'

describe('SquareBadge', () => {
  describe('렌더링', () => {
    it('Root가 data-slot="badge-root"와 함께 렌더링된다', () => {
      const { container } = render(<SquareBadge.Root />)
      expect(container.querySelector('[data-slot="badge-root"]')).toBeInTheDocument()
    })

    it('Content가 children을 렌더링한다', () => {
      render(<SquareBadge.Content>신규</SquareBadge.Content>)
      expect(screen.getByText('신규')).toBeInTheDocument()
    })

    it('Content가 data-slot="badge-content"와 함께 렌더링된다', () => {
      const { container } = render(<SquareBadge.Content>내용</SquareBadge.Content>)
      expect(container.querySelector('[data-slot="badge-content"]')).toBeInTheDocument()
    })

    it('전체 구조(Root + Content)가 함께 렌더링된다', () => {
      const { container } = render(
        <SquareBadge.Root>
          <SquareBadge.Content>NEW</SquareBadge.Content>
        </SquareBadge.Root>,
      )
      expect(container.querySelector('[data-slot="badge-root"]')).toBeInTheDocument()
      expect(container.querySelector('[data-slot="badge-content"]')).toBeInTheDocument()
      expect(screen.getByText('NEW')).toBeInTheDocument()
    })
  })

  describe('Props 변형', () => {
    it('Root에 className이 적용된다', () => {
      const { container } = render(<SquareBadge.Root className="custom-root" />)
      expect(container.querySelector('[data-slot="badge-root"]')).toHaveClass('custom-root')
    })

    it('Content에 className이 적용된다', () => {
      const { container } = render(
        <SquareBadge.Content className="custom-content">내용</SquareBadge.Content>,
      )
      expect(container.querySelector('[data-slot="badge-content"]')).toHaveClass('custom-content')
    })
  })

  describe('variant', () => {
    it('variant prop이 data-variant 속성에 반영된다', () => {
      const { container } = render(<SquareBadge.Root variant="outlined" />)
      expect(container.querySelector('[data-slot="badge-root"]')).toHaveAttribute(
        'data-variant',
        'outlined',
      )
    })

    it('filled variant에 배경 클래스가 적용된다', () => {
      const { container } = render(<SquareBadge.Root variant="filled" color="brand" />)
      expect(container.querySelector('[data-slot="badge-root"]')).toHaveClass(
        'bg-afds-bg-brand-subtle',
      )
    })

    it('outlined variant에 outline-1 클래스가 적용된다', () => {
      const { container } = render(<SquareBadge.Root variant="outlined" color="brand" />)
      const el = container.querySelector('[data-slot="badge-root"]')
      expect(el).toHaveClass('outline-1')
    })
  })

  describe('color', () => {
    it('color prop이 data-color 속성에 반영된다', () => {
      const { container } = render(<SquareBadge.Root color="success" />)
      expect(container.querySelector('[data-slot="badge-root"]')).toHaveAttribute(
        'data-color',
        'success',
      )
    })

    it.each([
      ['brand', 'bg-afds-bg-brand-subtle'],
      ['neutral', 'bg-afds-bg-disabled'],
      ['success', 'bg-afds-extra-ui-green'],
      ['warning', 'bg-afds-extra-ui-yellow'],
      ['error', 'bg-afds-extra-ui-red'],
      ['gradient-ai', 'bg-gradient-ai'],
    ] as const)('filled + %s → %s 클래스 적용', (color, expectedClass) => {
      const { container } = render(<SquareBadge.Root variant="filled" color={color} />)
      expect(container.querySelector('[data-slot="badge-root"]')).toHaveClass(expectedClass)
    })

    it.each([
      ['brand', 'outline-afds-border-brand-subtle'],
      ['neutral', 'outline-afds-border-default'],
      ['success', 'outline-afds-extra-ui-green'],
      ['warning', 'outline-afds-extra-ui-yellow'],
      ['error', 'outline-afds-border-error'],
      ['gradient-ai', 'border-gradient-ai'],
    ] as const)('outlined + %s → %s 클래스 적용', (color, expectedClass) => {
      const { container } = render(<SquareBadge.Root variant="outlined" color={color} />)
      expect(container.querySelector('[data-slot="badge-root"]')).toHaveClass(expectedClass)
    })
  })

  describe('접근성', () => {
    it('Root가 div 엘리먼트로 렌더링된다', () => {
      const { container } = render(<SquareBadge.Root />)
      expect(container.querySelector('[data-slot="badge-root"]')?.nodeName).toBe('DIV')
    })

    it('Content가 div 엘리먼트로 렌더링된다', () => {
      const { container } = render(<SquareBadge.Content>내용</SquareBadge.Content>)
      expect(container.querySelector('[data-slot="badge-content"]')?.nodeName).toBe('DIV')
    })
  })
})
