import * as React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Tooltip } from '../tooltip'

const renderTooltip = (
  options: {
    size?: 'sm' | 'md'
    showArrow?: boolean
    showClose?: boolean
    side?: 'top' | 'bottom' | 'left' | 'right'
  } = {},
) => {
  const { size = 'md', showArrow = true, showClose = false, side = 'top' } = options
  return render(
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger render={<button>트리거</button>} />
        <Tooltip.Portal>
          <Tooltip.Positioner side={side} sideOffset={8}>
            <Tooltip.Popup size={size}>
              <span>툴팁 콘텐츠</span>
              {showClose && <Tooltip.Close>×</Tooltip.Close>}
              {showArrow && <Tooltip.Arrow />}
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>,
  )
}

const getVisiblePopupText = () => {
  const matches = screen.queryAllByText('툴팁 콘텐츠')
  // base-ui는 가시 popup + a11y용 ghost span을 동시에 둘 수 있다.
  return matches.find(el => el.closest('[data-slot="tooltip-popup"]')) ?? matches[0] ?? null
}

describe('Tooltip', () => {
  describe('렌더링', () => {
    it('Trigger를 렌더링한다', () => {
      renderTooltip()
      expect(screen.getByRole('button', { name: '트리거' })).toBeInTheDocument()
    })

    it('초기에는 Popup이 보이지 않는다', () => {
      renderTooltip()
      expect(document.querySelector('[data-slot="tooltip-popup"]')).not.toBeInTheDocument()
    })
  })

  describe('상호작용', () => {
    it('Trigger 호버 시 Popup이 열린다', async () => {
      const user = userEvent.setup()
      renderTooltip()
      const trigger = screen.getByRole('button', { name: '트리거' })

      await user.hover(trigger)

      await waitFor(() => {
        expect(getVisiblePopupText()).toBeInTheDocument()
      })
    })
  })

  describe('Props 변형', () => {
    it('Popup의 size="sm" 시 sm cva 클래스가 적용된다', async () => {
      const user = userEvent.setup()
      renderTooltip({ size: 'sm' })
      await user.hover(screen.getByRole('button', { name: '트리거' }))

      await waitFor(() => {
        const popup = document.querySelector('[data-slot="tooltip-popup"]')
        expect(popup).toBeInTheDocument()
        expect(popup?.className).toMatch(/text-\[10px\]|font-bold/)
      })
    })

    it('showArrow=true 시 Arrow가 렌더링된다', async () => {
      const user = userEvent.setup()
      renderTooltip({ showArrow: true })
      await user.hover(screen.getByRole('button', { name: '트리거' }))

      await waitFor(() => {
        expect(document.querySelector('[data-slot="tooltip-arrow"]')).toBeInTheDocument()
      })
    })

    it('showArrow=false 시 Arrow가 렌더링되지 않는다', async () => {
      const user = userEvent.setup()
      renderTooltip({ showArrow: false })
      await user.hover(screen.getByRole('button', { name: '트리거' }))

      await waitFor(() => {
        expect(getVisiblePopupText()).toBeInTheDocument()
      })
      expect(document.querySelector('[data-slot="tooltip-arrow"]')).not.toBeInTheDocument()
    })

    it('Close part가 button 요소를 렌더링한다', async () => {
      const user = userEvent.setup()
      renderTooltip({ showClose: true })
      await user.hover(screen.getByRole('button', { name: '트리거' }))

      await waitFor(() => {
        const closeBtn = document.querySelector('[data-slot="tooltip-close"]')
        expect(closeBtn).toBeInTheDocument()
        expect(closeBtn?.tagName).toBe('BUTTON')
      })
    })
  })

  describe('접근성', () => {
    it('Close 버튼은 기본 aria-label="Close tooltip"을 가진다', async () => {
      const user = userEvent.setup()
      renderTooltip({ showClose: true })
      await user.hover(screen.getByRole('button', { name: '트리거' }))

      await waitFor(() => {
        const closeBtn = document.querySelector('[data-slot="tooltip-close"]')
        expect(closeBtn).toHaveAttribute('aria-label', 'Close tooltip')
      })
    })

    it('Popup이 열리면 data-slot="tooltip-popup" 요소가 DOM에 존재한다', async () => {
      const user = userEvent.setup()
      renderTooltip()
      await user.hover(screen.getByRole('button', { name: '트리거' }))

      await waitFor(() => {
        expect(document.querySelector('[data-slot="tooltip-popup"]')).toBeInTheDocument()
      })
    })
  })
})
