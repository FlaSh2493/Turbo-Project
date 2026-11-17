import * as React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RadioGroup } from '@turbo-project/afds/bricks'

import { RadioCard } from '../radio-card'

const renderInGroup = (ui: React.ReactNode, props?: React.ComponentProps<typeof RadioGroup.Root>) =>
  render(<RadioGroup.Root {...props}>{ui}</RadioGroup.Root>)

describe('RadioCard', () => {
  describe('렌더링', () => {
    it('라디오 요소를 렌더링한다', () => {
      renderInGroup(<RadioCard value="a" aria-label="카드" />)
      expect(screen.getByRole('radio')).toBeInTheDocument()
    })

    it('label prop이 제공되면 라벨 텍스트가 표시된다', () => {
      renderInGroup(<RadioCard value="a" label="선택 항목" />)
      expect(screen.getByText('선택 항목')).toBeInTheDocument()
    })

    it('카드 컨테이너에 border 클래스가 적용된다', () => {
      renderInGroup(<RadioCard value="a" label="카드" />)
      expect(document.querySelector('[data-slot="radio-container"]')?.className).toMatch(/border/)
    })
  })

  describe('그룹 선택', () => {
    it('defaultValue와 일치하는 카드가 선택된다', () => {
      renderInGroup(
        <>
          <RadioCard value="apple" label="사과" />
          <RadioCard value="banana" label="바나나" />
        </>,
        { defaultValue: 'apple' },
      )
      const [apple, banana] = screen.getAllByRole('radio')
      expect(apple).toHaveAttribute('aria-checked', 'true')
      expect(banana).toHaveAttribute('aria-checked', 'false')
    })

    it('controlled value 변경 시 선택 상태가 갱신된다', () => {
      const { rerender } = render(
        <RadioGroup.Root value="apple">
          <RadioCard value="apple" label="사과" />
          <RadioCard value="banana" label="바나나" />
        </RadioGroup.Root>,
      )
      expect(screen.getAllByRole('radio')[0]).toHaveAttribute('aria-checked', 'true')

      rerender(
        <RadioGroup.Root value="banana">
          <RadioCard value="apple" label="사과" />
          <RadioCard value="banana" label="바나나" />
        </RadioGroup.Root>,
      )
      const radios = screen.getAllByRole('radio')
      expect(radios[0]).toHaveAttribute('aria-checked', 'false')
      expect(radios[1]).toHaveAttribute('aria-checked', 'true')
    })
  })

  describe('비활성', () => {
    it('disabled=true일 때 data-disabled가 설정된다', () => {
      renderInGroup(<RadioCard value="a" label="카드" disabled />, { defaultValue: 'b' })
      expect(screen.getByRole('radio')).toHaveAttribute('data-disabled')
    })
  })

  describe('접근성', () => {
    it('라벨이 라디오와 연결된다', () => {
      renderInGroup(<RadioCard value="a" label="연결된 라벨" />)
      expect(screen.getByRole('radio')).toHaveAttribute('id')
      expect(screen.getByText('연결된 라벨')).toBeInTheDocument()
    })
  })
})
