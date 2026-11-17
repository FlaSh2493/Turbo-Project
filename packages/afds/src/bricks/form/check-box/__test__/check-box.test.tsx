import * as React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CheckBox } from '../check-box'

describe('CheckBox', () => {
  describe('렌더링', () => {
    it('Container + Root가 렌더링된다', () => {
      render(
        <CheckBox.Container>
          <CheckBox.Root>
            <CheckBox.Indicator />
          </CheckBox.Root>
        </CheckBox.Container>,
      )
      expect(document.querySelector('[data-slot="check-box-container"]')).toBeInTheDocument()
      expect(document.querySelector('[data-slot="check-box"]')).toBeInTheDocument()
    })

    it('Indicator + IndeterminateMark가 렌더링된다', () => {
      render(
        <CheckBox.Container>
          <CheckBox.Root indeterminate>
            <CheckBox.Indicator keepMounted />
          </CheckBox.Root>
        </CheckBox.Container>,
      )
      expect(document.querySelector('[data-slot="check-box-indicator"]')).toBeInTheDocument()
      expect(
        document.querySelector('[data-slot="check-box-indeterminate-mark"]'),
      ).toBeInTheDocument()
    })

    it('Label이 렌더링된다', () => {
      render(
        <CheckBox.Container>
          <CheckBox.Root defaultChecked />
          <CheckBox.Label>옵션</CheckBox.Label>
        </CheckBox.Container>,
      )
      expect(document.querySelector('[data-slot="check-box-label"]')).toBeInTheDocument()
    })
  })

  describe('상호작용 / 자동 상태 추적', () => {
    it('Uncontrolled: 클릭 시 base-ui가 data-checked로 전환', () => {
      render(
        <CheckBox.Container>
          <CheckBox.Root defaultChecked={false} />
        </CheckBox.Container>,
      )
      const root = screen.getByRole('checkbox')
      expect(root).toHaveAttribute('data-unchecked')
      // base-ui Checkbox는 hidden input click으로 토글됨
      const hiddenInput = document.querySelector(
        'input[type="checkbox"]',
      ) as HTMLInputElement | null
      if (hiddenInput) fireEvent.click(hiddenInput)
      expect(root).toHaveAttribute('data-checked')
    })

    it('Controlled: checked prop을 따라 data-checked 부여', () => {
      const { rerender } = render(
        <CheckBox.Container>
          <CheckBox.Root checked={false} onCheckedChange={() => {}} />
        </CheckBox.Container>,
      )
      expect(screen.getByRole('checkbox')).toHaveAttribute('data-unchecked')

      rerender(
        <CheckBox.Container>
          <CheckBox.Root checked={true} onCheckedChange={() => {}} />
        </CheckBox.Container>,
      )
      expect(screen.getByRole('checkbox')).toHaveAttribute('data-checked')
    })
  })

  describe('Props 변형', () => {
    it('Root는 cva base 클래스를 갖는다 (data-* selector가 런타임에 작동)', () => {
      render(
        <CheckBox.Container>
          <CheckBox.Root data-testid="root" />
        </CheckBox.Container>,
      )
      // base classes + data-[checked]: 가 className 문자열에 포함됨
      expect(screen.getByTestId('root').className).toMatch(/data-\[checked\]/)
    })

    it('IndeterminateMark는 group-has-[]를 통해 disabled 색상 추적', () => {
      render(
        <CheckBox.Container>
          <CheckBox.Root disabled indeterminate>
            <CheckBox.Indicator keepMounted />
          </CheckBox.Root>
        </CheckBox.Container>,
      )
      // base + group-has 클래스가 className에 포함됨
      const mark = document.querySelector(
        '[data-slot="check-box-indeterminate-mark"]',
      ) as HTMLElement
      expect(mark.className).toMatch(/group-has-\[\[data-disabled\]\]/)
    })

    it('Label은 peer-data-[disabled]/cbx selector를 사용', () => {
      render(
        <CheckBox.Container>
          <CheckBox.Root defaultChecked />
          <CheckBox.Label data-testid="label">라벨</CheckBox.Label>
        </CheckBox.Container>,
      )
      expect(screen.getByTestId('label').className).toMatch(/peer-data-\[disabled\]\/cbx/)
    })
  })

  describe('접근성', () => {
    it('Root는 role="checkbox"를 가진다', () => {
      render(
        <CheckBox.Container>
          <CheckBox.Root />
        </CheckBox.Container>,
      )
      expect(screen.getByRole('checkbox')).toBeInTheDocument()
    })

    it('checked 상태에서 aria-checked="true"', () => {
      render(
        <CheckBox.Container>
          <CheckBox.Root checked onCheckedChange={() => {}} />
        </CheckBox.Container>,
      )
      expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'true')
    })

    it('indeterminate 상태에서 aria-checked="mixed"', () => {
      render(
        <CheckBox.Container>
          <CheckBox.Root indeterminate />
        </CheckBox.Container>,
      )
      expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'mixed')
    })

    it('disabled 상태에서 data-disabled 속성', () => {
      render(
        <CheckBox.Container>
          <CheckBox.Root disabled />
        </CheckBox.Container>,
      )
      expect(screen.getByRole('checkbox')).toHaveAttribute('data-disabled')
    })
  })
})
