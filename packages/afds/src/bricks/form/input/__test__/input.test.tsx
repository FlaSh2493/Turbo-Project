import * as React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from '../input'

describe('Input', () => {
  describe('렌더링', () => {
    it('Root + Field가 렌더링된다', () => {
      render(
        <Input.Root>
          <Input.Field placeholder="입력" />
        </Input.Root>,
      )
      expect(document.querySelector('[data-slot="input"]')).toBeInTheDocument()
      expect(document.querySelector('[data-slot="input-field"]')).toBeInTheDocument()
    })

    it('Icon이 렌더링된다', () => {
      render(
        <Input.Root>
          <Input.Icon>
            <span>I</span>
          </Input.Icon>
          <Input.Field />
        </Input.Root>,
      )
      expect(document.querySelector('[data-slot="input-icon"]')).toBeInTheDocument()
    })

    it('ClearButton이 button 요소를 렌더링한다', () => {
      render(
        <Input.Root>
          <Input.Field />
          <Input.ClearButton>×</Input.ClearButton>
        </Input.Root>,
      )
      const btn = document.querySelector('[data-slot="input-clear-button"]')
      expect(btn).toBeInTheDocument()
      expect(btn?.tagName).toBe('BUTTON')
    })
  })

  describe('상호작용', () => {
    it('Field에 타이핑하면 value가 갱신된다 (controlled)', async () => {
      const user = userEvent.setup()
      const Wrapper = () => {
        const [value, setValue] = React.useState('')
        return (
          <Input.Root>
            <Input.Field
              value={value}
              onChange={e => setValue(e.target.value)}
              data-testid="field"
            />
          </Input.Root>
        )
      }
      render(<Wrapper />)

      const input = screen.getByTestId('field') as HTMLInputElement
      await user.type(input, '가나다')
      expect(input.value).toBe('가나다')
    })

    it('ClearButton 클릭 시 onClick 핸들러가 호출된다', async () => {
      const user = userEvent.setup()
      const onClick = vi.fn()
      render(
        <Input.Root>
          <Input.Field />
          <Input.ClearButton onClick={onClick}>×</Input.ClearButton>
        </Input.Root>,
      )
      await user.click(document.querySelector('[data-slot="input-clear-button"]')!)
      expect(onClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('Props 변형', () => {
    it('Root size prop에 따라 cva 클래스가 변경된다', () => {
      const { rerender } = render(
        <Input.Root size="sm" data-testid="root">
          <Input.Field />
        </Input.Root>,
      )
      const smClass = screen.getByTestId('root').className
      rerender(
        <Input.Root size="md" data-testid="root">
          <Input.Field />
        </Input.Root>,
      )
      const mdClass = screen.getByTestId('root').className
      expect(smClass).not.toBe(mdClass)
    })

    it('Root error prop이면 data-error 속성이 설정된다 (에러 스타일은 CSS data-attr 구동)', () => {
      render(
        <Input.Root error data-testid="root">
          <Input.Field />
        </Input.Root>,
      )
      expect(screen.getByTestId('root')).toHaveAttribute('data-error')
    })

    it('error 미지정 시 data-error 속성이 없다', () => {
      render(
        <Input.Root data-testid="root">
          <Input.Field />
        </Input.Root>,
      )
      expect(screen.getByTestId('root')).not.toHaveAttribute('data-error')
    })

    it('Field error prop이면 data-error 속성이 설정된다', () => {
      render(
        <Input.Root>
          <Input.Field error data-testid="field" />
        </Input.Root>,
      )
      expect(screen.getByTestId('field')).toHaveAttribute('data-error')
    })

    it('Field에 placeholder가 적용된다', () => {
      render(
        <Input.Root>
          <Input.Field placeholder="검색" />
        </Input.Root>,
      )
      expect(screen.getByPlaceholderText('검색')).toBeInTheDocument()
    })
  })

  describe('접근성', () => {
    it('ClearButton은 기본 aria-label="Clear input"을 가진다', () => {
      render(
        <Input.Root>
          <Input.Field />
          <Input.ClearButton>×</Input.ClearButton>
        </Input.Root>,
      )
      expect(document.querySelector('[data-slot="input-clear-button"]')).toHaveAttribute(
        'aria-label',
        'Clear input',
      )
    })

    it('Field는 textbox role을 가진다', () => {
      render(
        <Input.Root>
          <Input.Field />
        </Input.Root>,
      )
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })
  })
})
