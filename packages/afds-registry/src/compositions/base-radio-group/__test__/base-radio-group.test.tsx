import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { BaseRadioGroup as RadioGroup } from '../base-radio-group'
import { BaseRadio as Radio } from '../base-radio'

describe('RadioGroup', () => {
  describe('렌더링', () => {
    it('RadioGroup과 Radio를 렌더링한다', () => {
      render(
        <RadioGroup defaultValue="option1">
          <Radio value="option1" label="Option 1" />
          <Radio value="option2" label="Option 2" />
        </RadioGroup>,
      )

      expect(screen.getByRole('radiogroup')).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: 'Option 1' })).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: 'Option 2' })).toBeInTheDocument()
    })

    it('defaultValue에 해당하는 아이템이 선택된다', () => {
      render(
        <RadioGroup defaultValue="option2">
          <Radio value="option1" label="Option 1" />
          <Radio value="option2" label="Option 2" />
        </RadioGroup>,
      )

      expect(screen.getByRole('radio', { name: 'Option 1' })).not.toBeChecked()
      expect(screen.getByRole('radio', { name: 'Option 2' })).toBeChecked()
    })

    it('label 없이 Radio를 렌더링할 수 있다', () => {
      render(
        <RadioGroup defaultValue="option1">
          <Radio value="option1" />
          <Radio value="option2" />
        </RadioGroup>,
      )

      expect(screen.getAllByRole('radio')).toHaveLength(2)
    })
  })

  describe('상호작용', () => {
    it('아이템을 클릭하면 선택된다', () => {
      render(
        <RadioGroup defaultValue="option1">
          <Radio value="option1" label="Option 1" />
          <Radio value="option2" label="Option 2" />
        </RadioGroup>,
      )

      // base-ui Radio는 hidden input[type=radio]을 통해 선택된다 (jsdom)
      const option2 = screen.getByRole('radio', { name: 'Option 2' })
      const hiddenInputs = document.querySelectorAll('input[type="radio"]')
      act(() => {
        fireEvent.click(option2)
        if (hiddenInputs[1]) fireEvent.click(hiddenInputs[1] as HTMLInputElement)
      })

      expect(screen.getByRole('radio', { name: 'Option 1' })).not.toBeChecked()
      expect(option2).toBeChecked()
    })

    it('그룹의 onValueChange 콜백을 선택된 value로 호출한다', () => {
      const handleChange = vi.fn()
      render(
        <RadioGroup defaultValue="option1" onValueChange={handleChange}>
          <Radio value="option1" label="Option 1" />
          <Radio value="option2" label="Option 2" />
        </RadioGroup>,
      )

      const radioB = screen.getByRole('radio', { name: 'Option 2' })
      const hiddenInputs = document.querySelectorAll('input[type="radio"]')
      act(() => {
        fireEvent.click(radioB)
        if (hiddenInputs[1]) fireEvent.click(hiddenInputs[1] as HTMLInputElement)
      })
      expect(handleChange).toHaveBeenCalled()
      expect(handleChange.mock.calls[0][0]).toBe('option2')
    })

    it('이미 선택된 Radio를 클릭해도 onValueChange는 호출되지 않는다', () => {
      const handleChange = vi.fn()
      render(
        <RadioGroup defaultValue="option1" onValueChange={handleChange}>
          <Radio value="option1" label="Option 1" />
          <Radio value="option2" label="Option 2" />
        </RadioGroup>,
      )

      fireEvent.click(screen.getByRole('radio', { name: 'Option 1' }))
      expect(screen.getByRole('radio', { name: 'Option 1' })).toBeChecked()
      expect(handleChange).not.toHaveBeenCalled()
    })

    it('Radio의 onClick 콜백이 호출된다', () => {
      const handleClick = vi.fn()
      render(
        <RadioGroup defaultValue="option1">
          <Radio value="option1" label="Option 1" />
          <Radio value="option2" label="Option 2" onClick={handleClick} />
        </RadioGroup>,
      )

      fireEvent.click(screen.getByRole('radio', { name: 'Option 2' }))
      expect(handleClick).toHaveBeenCalled()
    })
  })

  describe('제어 모드', () => {
    it('value prop으로 선택 상태를 제어할 수 있다', () => {
      const { rerender } = render(
        <RadioGroup value="option1">
          <Radio value="option1" label="Option 1" />
          <Radio value="option2" label="Option 2" />
        </RadioGroup>,
      )

      expect(screen.getByRole('radio', { name: 'Option 1' })).toBeChecked()

      rerender(
        <RadioGroup value="option2">
          <Radio value="option1" label="Option 1" />
          <Radio value="option2" label="Option 2" />
        </RadioGroup>,
      )

      expect(screen.getByRole('radio', { name: 'Option 2' })).toBeChecked()
    })

    it('그룹의 value가 Radio의 checked 상태를 결정한다', () => {
      render(
        <RadioGroup value="option2">
          <Radio value="option1" label="Option 1" />
          <Radio value="option2" label="Option 2" />
        </RadioGroup>,
      )

      expect(screen.getByRole('radio', { name: 'Option 1' })).not.toBeChecked()
      expect(screen.getByRole('radio', { name: 'Option 2' })).toBeChecked()
    })
  })

  describe('Disabled 상태', () => {
    it('RadioGroup 전체를 비활성화할 수 있다', () => {
      render(
        <RadioGroup disabled>
          <Radio value="option1" label="Option 1" />
          <Radio value="option2" label="Option 2" />
        </RadioGroup>,
      )

      expect(screen.getByRole('radio', { name: 'Option 1' })).toHaveAttribute(
        'aria-disabled',
        'true',
      )
      expect(screen.getByRole('radio', { name: 'Option 2' })).toHaveAttribute(
        'aria-disabled',
        'true',
      )
    })

    it('개별 Radio를 비활성화할 수 있다', () => {
      render(
        <RadioGroup defaultValue="option1">
          <Radio value="option1" label="Option 1" />
          <Radio value="option2" disabled label="Option 2" />
        </RadioGroup>,
      )

      expect(screen.getByRole('radio', { name: 'Option 1' })).not.toHaveAttribute(
        'aria-disabled',
        'true',
      )
      expect(screen.getByRole('radio', { name: 'Option 2' })).toHaveAttribute(
        'aria-disabled',
        'true',
      )
    })

    it('비활성화된 아이템은 클릭해도 선택되지 않는다', () => {
      const handleChange = vi.fn()
      render(
        <RadioGroup defaultValue="option1" onValueChange={handleChange}>
          <Radio value="option1" label="Option 1" />
          <Radio value="option2" disabled label="Option 2" />
        </RadioGroup>,
      )

      fireEvent.click(screen.getByRole('radio', { name: 'Option 2' }))
      expect(screen.getByRole('radio', { name: 'Option 1' })).toBeChecked()
      expect(handleChange).not.toHaveBeenCalled()
    })
  })

  describe('custom id', () => {
    it('Radio에 custom id를 설정할 수 있다', () => {
      render(
        <RadioGroup defaultValue="option1">
          <Radio value="option1" id="custom-radio-1" label="Option 1" />
          <Radio value="option2" id="custom-radio-2" label="Option 2" />
        </RadioGroup>,
      )

      expect(document.getElementById('custom-radio-1')).toBeInTheDocument()
      expect(document.getElementById('custom-radio-2')).toBeInTheDocument()
    })
  })

  describe('접근성 및 키보드 네비게이션', () => {
    // 키보드 네비게이션은 base-ui 내부에서 처리되며, jsdom 환경에서는 정상 동작하지 않을 수 있음
    it.skip('화살표 키로 네비게이션 할 수 있다', () => {
      render(
        <RadioGroup defaultValue="option1">
          <Radio value="option1" label="Option 1" />
          <Radio value="option2" label="Option 2" />
        </RadioGroup>,
      )

      const option1 = screen.getByRole('radio', { name: 'Option 1' })
      option1.focus()
      fireEvent.keyDown(option1, { key: 'ArrowDown' })
      expect(screen.getByRole('radio', { name: 'Option 2' })).toBeChecked()
    })
  })
})
