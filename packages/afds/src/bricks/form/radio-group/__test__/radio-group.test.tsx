import * as React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { RadioGroup } from '../radio-group'

const RadioItem = ({
  value,
  label,
  disabled = false,
}: {
  value: string
  label: string
  disabled?: boolean
}) => {
  const id = React.useId()
  return (
    <RadioGroup.Container htmlFor={id}>
      <RadioGroup.Item id={id} value={value} disabled={disabled}>
        <RadioGroup.Indicator />
      </RadioGroup.Item>
      <RadioGroup.Label>{label}</RadioGroup.Label>
    </RadioGroup.Container>
  )
}

describe('RadioGroup', () => {
  describe('렌더링', () => {
    it('Root는 radiogroup role을 가진다', () => {
      render(
        <RadioGroup.Root defaultValue="a">
          <RadioItem value="a" label="A" />
        </RadioGroup.Root>,
      )
      expect(screen.getByRole('radiogroup')).toBeInTheDocument()
    })

    it('Item이 radio role을 가진다', () => {
      render(
        <RadioGroup.Root defaultValue="a">
          <RadioItem value="a" label="A" />
          <RadioItem value="b" label="B" />
        </RadioGroup.Root>,
      )
      expect(screen.getAllByRole('radio')).toHaveLength(2)
    })

    it('각 part가 알맞은 data-slot을 가진다', () => {
      render(
        <RadioGroup.Root defaultValue="a">
          <RadioItem value="a" label="A" />
        </RadioGroup.Root>,
      )
      expect(document.querySelector('[data-slot="radio-group-root"]')).toBeInTheDocument()
      expect(document.querySelector('[data-slot="radio-container"]')).toBeInTheDocument()
      expect(document.querySelector('[data-slot="radio-input"]')).toBeInTheDocument()
      expect(document.querySelector('[data-slot="radio-dot"]')).toBeInTheDocument()
      expect(document.querySelector('[data-slot="radio-label"]')).toBeInTheDocument()
    })
  })

  describe('상호작용 / 자동 상태 추적', () => {
    it('Uncontrolled: Item 클릭 시 base-ui가 data-checked로 전환', () => {
      render(
        <RadioGroup.Root defaultValue="a">
          <RadioItem value="a" label="A" />
          <RadioItem value="b" label="B" />
        </RadioGroup.Root>,
      )
      const radios = screen.getAllByRole('radio')
      expect(radios[0]).toHaveAttribute('data-checked')
      expect(radios[1]).toHaveAttribute('data-unchecked')

      // base-ui Radio는 hidden input을 통해 토글된다.
      const hiddenInputs = document.querySelectorAll('input[type="radio"]')
      const hiddenInputB = hiddenInputs[1] as HTMLInputElement | undefined
      act(() => {
        fireEvent.click(radios[1])
        if (hiddenInputB) fireEvent.click(hiddenInputB)
      })
      expect(radios[1]).toHaveAttribute('data-checked')
      expect(radios[0]).toHaveAttribute('data-unchecked')
    })

    it('Item 클릭 시 onValueChange가 호출된다', () => {
      const onValueChange = vi.fn()
      render(
        <RadioGroup.Root defaultValue="a" onValueChange={onValueChange}>
          <RadioItem value="a" label="A" />
          <RadioItem value="b" label="B" />
        </RadioGroup.Root>,
      )
      const radioB = screen.getAllByRole('radio')[1]
      const hiddenInputs = document.querySelectorAll('input[type="radio"]')
      act(() => {
        fireEvent.click(radioB)
        if (hiddenInputs[1]) fireEvent.click(hiddenInputs[1] as HTMLInputElement)
      })
      expect(onValueChange).toHaveBeenCalled()
      expect(onValueChange.mock.calls[0][0]).toBe('b')
    })

    it('controlled value 변경 시 aria-checked가 갱신된다', () => {
      const { rerender } = render(
        <RadioGroup.Root value="a">
          <RadioItem value="a" label="A" />
          <RadioItem value="b" label="B" />
        </RadioGroup.Root>,
      )
      let radios = screen.getAllByRole('radio')
      expect(radios[0]).toHaveAttribute('aria-checked', 'true')
      expect(radios[1]).toHaveAttribute('aria-checked', 'false')

      rerender(
        <RadioGroup.Root value="b">
          <RadioItem value="a" label="A" />
          <RadioItem value="b" label="B" />
        </RadioGroup.Root>,
      )
      radios = screen.getAllByRole('radio')
      expect(radios[0]).toHaveAttribute('aria-checked', 'false')
      expect(radios[1]).toHaveAttribute('aria-checked', 'true')
    })
  })

  describe('Props 변형', () => {
    it('Item은 data-* selector 클래스를 갖는다', () => {
      render(
        <RadioGroup.Root defaultValue="a">
          <RadioGroup.Container>
            <RadioGroup.Item value="a" data-testid="item" />
          </RadioGroup.Container>
        </RadioGroup.Root>,
      )
      expect(screen.getByTestId('item').className).toMatch(/data-\[checked\]/)
    })

    it('Dot은 group-data-[disabled]/r selector를 사용', () => {
      render(
        <RadioGroup.Root defaultValue="a">
          <RadioGroup.Container>
            <RadioGroup.Item value="a" disabled>
              <RadioGroup.Indicator />
            </RadioGroup.Item>
          </RadioGroup.Container>
        </RadioGroup.Root>,
      )
      const dot = document.querySelector('[data-slot="radio-dot"]') as HTMLElement
      expect(dot.className).toMatch(/group-data-\[disabled\]\/r/)
    })

    it('defaultValue가 초기 선택을 설정', () => {
      render(
        <RadioGroup.Root defaultValue="b">
          <RadioItem value="a" label="A" />
          <RadioItem value="b" label="B" />
        </RadioGroup.Root>,
      )
      const radios = screen.getAllByRole('radio')
      expect(radios[1]).toHaveAttribute('aria-checked', 'true')
    })
  })

  describe('접근성', () => {
    it('Root는 role="radiogroup"', () => {
      render(
        <RadioGroup.Root defaultValue="a">
          <RadioItem value="a" label="A" />
        </RadioGroup.Root>,
      )
      expect(screen.getByRole('radiogroup')).toBeInTheDocument()
    })

    it('disabled Item은 data-disabled 속성', () => {
      render(
        <RadioGroup.Root defaultValue="a">
          <RadioGroup.Container>
            <RadioGroup.Item value="a" disabled />
          </RadioGroup.Container>
        </RadioGroup.Root>,
      )
      expect(screen.getByRole('radio')).toHaveAttribute('data-disabled')
    })
  })
})
