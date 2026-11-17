import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FloatingActionBar } from '../floating-action-bar'

describe('FloatingActionBar', () => {
  describe('렌더링', () => {
    it('show=true이면 렌더링된다', () => {
      render(
        <FloatingActionBar show>
          <FloatingActionBar.Card>
            <span>content</span>
          </FloatingActionBar.Card>
        </FloatingActionBar>,
      )

      expect(document.querySelector('[data-slot="floating-action-bar"]')).toBeInTheDocument()
    })

    it('show=false이면 null을 반환한다', () => {
      render(
        <FloatingActionBar show={false}>
          <FloatingActionBar.Card>
            <span>content</span>
          </FloatingActionBar.Card>
        </FloatingActionBar>,
      )

      expect(document.querySelector('[data-slot="floating-action-bar"]')).not.toBeInTheDocument()
    })

    it('Dim이 렌더링된다', () => {
      render(
        <FloatingActionBar show>
          <FloatingActionBar.Dim />
          <FloatingActionBar.Card>
            <span>content</span>
          </FloatingActionBar.Card>
        </FloatingActionBar>,
      )

      expect(document.querySelector('[data-slot="floating-action-bar-dim"]')).toBeInTheDocument()
    })

    it('Card가 렌더링된다', () => {
      render(
        <FloatingActionBar show>
          <FloatingActionBar.Card>
            <button>액션</button>
          </FloatingActionBar.Card>
        </FloatingActionBar>,
      )

      expect(document.querySelector('[data-slot="floating-action-bar-card"]')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '액션' })).toBeInTheDocument()
    })

    it('Dim 생략 시 Dim 슬롯이 렌더링되지 않는다', () => {
      render(
        <FloatingActionBar show>
          <FloatingActionBar.Card>
            <span>content</span>
          </FloatingActionBar.Card>
        </FloatingActionBar>,
      )

      expect(
        document.querySelector('[data-slot="floating-action-bar-dim"]'),
      ).not.toBeInTheDocument()
    })
  })

  describe('상호작용', () => {
    it('ClearButton 클릭 시 Root onClose가 호출된다', async () => {
      const handleClose = vi.fn()
      const user = userEvent.setup()
      render(
        <FloatingActionBar show onClose={handleClose}>
          <FloatingActionBar.Card>
            <FloatingActionBar.ClearButton />
          </FloatingActionBar.Card>
        </FloatingActionBar>,
      )

      await user.click(screen.getByRole('button'))
      expect(handleClose).toHaveBeenCalledTimes(1)
    })

    it('ClearButton onClick 오버라이드 시 해당 함수가 호출된다', async () => {
      const rootClose = vi.fn()
      const override = vi.fn()
      const user = userEvent.setup()
      render(
        <FloatingActionBar show onClose={rootClose}>
          <FloatingActionBar.Card>
            <FloatingActionBar.ClearButton onClick={override} />
          </FloatingActionBar.Card>
        </FloatingActionBar>,
      )

      await user.click(screen.getByRole('button'))
      expect(override).toHaveBeenCalledTimes(1)
      expect(rootClose).not.toHaveBeenCalled()
    })
  })

  describe('Props 변형', () => {
    it('className이 Root에 적용된다', () => {
      render(
        <FloatingActionBar show className="custom-bar" data-testid="fab-root">
          <FloatingActionBar.Card>
            <span>content</span>
          </FloatingActionBar.Card>
        </FloatingActionBar>,
      )

      expect(screen.getByTestId('fab-root')).toHaveClass('custom-bar')
    })

    it('className이 Dim에 적용된다', () => {
      render(
        <FloatingActionBar show>
          <FloatingActionBar.Dim className="custom-dim" data-testid="fab-dim" />
          <FloatingActionBar.Card>
            <span>content</span>
          </FloatingActionBar.Card>
        </FloatingActionBar>,
      )

      expect(screen.getByTestId('fab-dim')).toHaveClass('custom-dim')
    })

    it('className이 Card에 적용된다', () => {
      render(
        <FloatingActionBar show>
          <FloatingActionBar.Card className="custom-card" data-testid="fab-card">
            <span>content</span>
          </FloatingActionBar.Card>
        </FloatingActionBar>,
      )

      expect(screen.getByTestId('fab-card')).toHaveClass('custom-card')
    })
  })
})
