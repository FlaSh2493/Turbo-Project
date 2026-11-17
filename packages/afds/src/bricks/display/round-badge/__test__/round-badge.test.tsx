import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RoundBadge } from '../round-badge'

describe('RoundBadge', () => {
  describe('렌더링', () => {
    it('Root가 data-slot="badge-root"와 함께 렌더링된다', () => {
      const { container } = render(<RoundBadge.Root />)
      expect(container.querySelector('[data-slot="badge-root"]')).toBeInTheDocument()
    })

    it('Dot이 data-slot="badge-dot"와 함께 렌더링된다', () => {
      const { container } = render(<RoundBadge.Dot />)
      expect(container.querySelector('[data-slot="badge-dot"]')).toBeInTheDocument()
    })

    it('Content가 children을 렌더링한다', () => {
      render(<RoundBadge.Content>42</RoundBadge.Content>)
      expect(screen.getByText('42')).toBeInTheDocument()
    })

    it('Content가 data-slot="badge-content"와 함께 렌더링된다', () => {
      const { container } = render(<RoundBadge.Content>내용</RoundBadge.Content>)
      expect(container.querySelector('[data-slot="badge-content"]')).toBeInTheDocument()
    })

    it('전체 구조(Root + Dot + Content)가 함께 렌더링된다', () => {
      const { container } = render(
        <RoundBadge.Root>
          <RoundBadge.Dot />
          <RoundBadge.Content>알림</RoundBadge.Content>
        </RoundBadge.Root>,
      )
      expect(container.querySelector('[data-slot="badge-root"]')).toBeInTheDocument()
      expect(container.querySelector('[data-slot="badge-dot"]')).toBeInTheDocument()
      expect(container.querySelector('[data-slot="badge-content"]')).toBeInTheDocument()
      expect(screen.getByText('알림')).toBeInTheDocument()
    })
  })

  describe('Props 변형', () => {
    it('Root에 className이 적용된다', () => {
      const { container } = render(<RoundBadge.Root className="custom-root" />)
      expect(container.querySelector('[data-slot="badge-root"]')).toHaveClass('custom-root')
    })

    it('Content에 className이 적용된다', () => {
      const { container } = render(
        <RoundBadge.Content className="custom-content">내용</RoundBadge.Content>,
      )
      expect(container.querySelector('[data-slot="badge-content"]')).toHaveClass('custom-content')
    })

    it.each([
      ['disabled', 'bg-afds-icon-disabled'],
      ['success', 'bg-afds-extra-ui-green'],
      ['warning', 'bg-afds-extra-ui-yellow'],
      ['error', 'bg-afds-extra-ui-red'],
    ] as const)('Dot color="%s" 시 %s 클래스가 적용된다', (color, expectedClass) => {
      const { container } = render(<RoundBadge.Dot color={color} />)
      const dot = container.querySelector('[data-slot="badge-dot"]')
      expect(dot).toHaveClass(expectedClass)
      expect(dot).toHaveAttribute('data-color', color)
    })

    it('Dot에 className이 적용된다 (color prop 없이 토큰 직접 지정)', () => {
      const { container } = render(<RoundBadge.Dot className="bg-afds-extra-ui-blue" />)
      expect(container.querySelector('[data-slot="badge-dot"]')).toHaveClass(
        'bg-afds-extra-ui-blue',
      )
    })
  })

  describe('접근성', () => {
    it('Root가 div 엘리먼트로 렌더링된다', () => {
      const { container } = render(<RoundBadge.Root />)
      expect(container.querySelector('[data-slot="badge-root"]')?.nodeName).toBe('DIV')
    })
  })
})
