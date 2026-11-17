import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SectionErrorFallback } from '../section-error-fallback'

describe('SectionErrorFallback', () => {
  describe('렌더링', () => {
    it('기본 영어 문구를 렌더링한다', () => {
      render(<SectionErrorFallback />)
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      expect(screen.getByText('Please try again later.')).toBeInTheDocument()
    })

    it('title과 message를 주입하면 그대로 노출한다', () => {
      render(<SectionErrorFallback title="오류" message="잠시 후 다시" />)
      expect(screen.getByText('오류')).toBeInTheDocument()
      expect(screen.getByText('잠시 후 다시')).toBeInTheDocument()
    })

    it('reset이 없으면 재시도 버튼이 없다', () => {
      render(<SectionErrorFallback />)
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('reset이 있으면 재시도 버튼이 노출된다', () => {
      render(<SectionErrorFallback reset={() => {}} retryText="다시 시도" />)
      expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument()
    })

    it('data-slot이 적용된다', () => {
      const { container } = render(<SectionErrorFallback />)
      expect(container.querySelector('[data-slot="section-error-fallback"]')).toBeInTheDocument()
    })

    it('className은 기본 py-20과 머지된다', () => {
      const { container } = render(<SectionErrorFallback className="extra-cls" />)
      const root = container.querySelector('[data-slot="section-error-fallback"]') as HTMLElement
      expect(root.className).toContain('py-20')
      expect(root.className).toContain('extra-cls')
    })
  })

  describe('인터랙션', () => {
    it('재시도 버튼 클릭 시 reset이 호출된다', async () => {
      const user = userEvent.setup()
      const reset = vi.fn()
      render(<SectionErrorFallback reset={reset} retryText="Retry" />)
      await user.click(screen.getByRole('button', { name: 'Retry' }))
      expect(reset).toHaveBeenCalledTimes(1)
    })
  })
})
