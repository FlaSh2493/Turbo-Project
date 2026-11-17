import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { Switch } from '../switch'

// base-ui Switch renders role="switch" with aria-checked.
const getSwitch = () => screen.getByRole('switch')

const clickSwitch = () => {
  const switchEl = getSwitch()
  act(() => {
    fireEvent.click(switchEl)
    const hiddenInput = document.querySelector(
      'input[type="checkbox"][aria-hidden="true"]',
    ) as HTMLInputElement | null
    if (hiddenInput) {
      fireEvent.click(hiddenInput)
    }
  })
}

const renderSwitch = (props: React.ComponentPropsWithoutRef<typeof Switch.Root> = {}) =>
  render(
    <Switch.Root {...props}>
      <Switch.Thumb />
    </Switch.Root>,
  )

describe('Switch', () => {
  describe('렌더링', () => {
    it('Root는 data-slot="switch" 엘리먼트를 렌더한다', () => {
      renderSwitch()
      expect(document.querySelector('[data-slot="switch"]')).toBeInTheDocument()
    })

    it('Thumb는 data-slot="switch-thumb" 엘리먼트를 렌더한다', () => {
      renderSwitch()
      expect(document.querySelector('[data-slot="switch-thumb"]')).toBeInTheDocument()
    })

    it('기본적으로 체크되지 않은 상태로 렌더링된다', () => {
      renderSwitch()
      expect(getSwitch()).toHaveAttribute('aria-checked', 'false')
    })
  })

  describe('상호작용', () => {
    it('클릭하면 비제어 스위치가 토글된다', () => {
      renderSwitch()
      const switchEl = getSwitch()
      expect(switchEl).toHaveAttribute('aria-checked', 'false')

      clickSwitch()
      expect(switchEl).toHaveAttribute('aria-checked', 'true')
    })

    it('다시 클릭하면 비제어 스위치가 원래 상태로 돌아온다', () => {
      renderSwitch()
      const switchEl = getSwitch()
      clickSwitch()
      expect(switchEl).toHaveAttribute('aria-checked', 'true')

      clickSwitch()
      expect(switchEl).toHaveAttribute('aria-checked', 'false')
    })

    it('onCheckedChange가 새로운 값으로 호출된다', () => {
      const handleChange = vi.fn()
      renderSwitch({ onCheckedChange: handleChange })
      clickSwitch()
      expect(handleChange).toHaveBeenCalledWith(true, expect.anything())
    })

    it('체크된 상태에서 클릭하면 onCheckedChange(false)가 호출된다', () => {
      const handleChange = vi.fn()
      renderSwitch({ defaultChecked: true, onCheckedChange: handleChange })
      clickSwitch()
      expect(handleChange).toHaveBeenCalledWith(false, expect.anything())
    })
  })

  describe('Props 변형', () => {
    it('checked=true이면 체크된 상태를 표시한다', () => {
      renderSwitch({ checked: true, onCheckedChange: () => {} })
      expect(getSwitch()).toHaveAttribute('aria-checked', 'true')
    })

    it('checked=false이면 체크되지 않은 상태를 표시한다', () => {
      renderSwitch({ checked: false, onCheckedChange: () => {} })
      expect(getSwitch()).toHaveAttribute('aria-checked', 'false')
    })

    it('제어 모드에서 checked prop이 변경되면 UI가 업데이트된다', () => {
      const { rerender } = render(
        <Switch.Root checked={false} onCheckedChange={() => {}}>
          <Switch.Thumb />
        </Switch.Root>,
      )
      expect(getSwitch()).toHaveAttribute('aria-checked', 'false')

      rerender(
        <Switch.Root checked={true} onCheckedChange={() => {}}>
          <Switch.Thumb />
        </Switch.Root>,
      )
      expect(getSwitch()).toHaveAttribute('aria-checked', 'true')
    })

    it('disabled 상태에서는 클릭해도 상태가 변경되지 않는다', () => {
      const handleChange = vi.fn()
      renderSwitch({ disabled: true, onCheckedChange: handleChange })

      fireEvent.click(getSwitch())
      expect(handleChange).not.toHaveBeenCalled()
    })

    it('disabled 스위치는 data-disabled 속성을 가진다', () => {
      renderSwitch({ disabled: true })
      expect(getSwitch()).toHaveAttribute('data-disabled')
    })

    it('defaultChecked=true이면 초기에 체크된 상태로 시작한다', () => {
      renderSwitch({ defaultChecked: true })
      expect(getSwitch()).toHaveAttribute('aria-checked', 'true')
    })

    it('Root에 전달된 className이 적용된다', () => {
      renderSwitch({ className: 'custom-switch', 'data-testid': 'switch' } as never)
      expect(screen.getByTestId('switch')).toHaveClass('custom-switch')
    })
  })

  describe('접근성', () => {
    it('role="switch"를 가진다', () => {
      renderSwitch()
      expect(getSwitch()).toBeInTheDocument()
    })

    it('aria-checked가 checked prop을 반영한다', () => {
      renderSwitch({ checked: true, onCheckedChange: () => {} })
      expect(getSwitch()).toHaveAttribute('aria-checked', 'true')
    })
  })
})
