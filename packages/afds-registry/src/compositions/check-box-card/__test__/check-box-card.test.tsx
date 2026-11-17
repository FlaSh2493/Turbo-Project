import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CheckBoxCard } from '../check-box-card'
import { CheckBoxGroup } from '@turbo-project/afds/bricks'

// 카드형은 네이티브 체크박스를 hidden 처리하므로 role 대신 data-slot="check-box"로 조회한다.
const getCheckbox = (root: ParentNode = document) =>
  root.querySelector('[data-slot="check-box"]') as HTMLElement | null
const getAllCheckboxes = (root: ParentNode = document) =>
  Array.from(root.querySelectorAll('[data-slot="check-box"]')) as HTMLElement[]

describe('CheckBoxCard', () => {
  describe('렌더링', () => {
    it('체크박스 요소를 렌더링한다', () => {
      render(<CheckBoxCard aria-label="카드" />)
      expect(getCheckbox()).toBeInTheDocument()
    })

    it('label prop이 제공되면 라벨 텍스트가 표시된다', () => {
      render(<CheckBoxCard label="선택 항목" />)
      expect(screen.getByText('선택 항목')).toBeInTheDocument()
    })

    it('카드 컨테이너에 border 클래스가 적용된다', () => {
      render(<CheckBoxCard label="카드" />)
      expect(document.querySelector('[data-slot="check-box-container"]')?.className).toMatch(
        /border/,
      )
    })

    it('renderLabel로 라벨 영역을 커스텀할 수 있다', () => {
      render(
        <CheckBoxCard label="원본 라벨" renderLabel={({ label }) => <span>커스텀 {label}</span>} />,
      )
      expect(screen.getByText('커스텀 원본 라벨')).toBeInTheDocument()
    })
  })

  describe('Props 변형', () => {
    it('checked=true일 때 aria-checked가 true이다', () => {
      render(<CheckBoxCard label="카드" checked onCheckedChange={() => {}} />)
      expect(getCheckbox()).toHaveAttribute('aria-checked', 'true')
    })

    it('defaultChecked=true일 때 초기에 체크된 상태이다', () => {
      render(<CheckBoxCard label="카드" defaultChecked />)
      expect(getCheckbox()).toHaveAttribute('aria-checked', 'true')
    })

    it('indeterminate일 때 aria-checked가 mixed이다', () => {
      render(<CheckBoxCard label="카드" indeterminate />)
      expect(getCheckbox()).toHaveAttribute('aria-checked', 'mixed')
    })

    it('disabled=true일 때 aria-disabled가 설정된다', () => {
      render(<CheckBoxCard label="카드" disabled />)
      expect(getCheckbox()).toHaveAttribute('aria-disabled', 'true')
    })
  })

  describe('그룹', () => {
    it('CheckBoxGroup 내부에서 value로 선택 상태를 추적한다', () => {
      render(
        <CheckBoxGroup.Root defaultValue={['apple']}>
          <CheckBoxCard value="apple" label="사과" />
          <CheckBoxCard value="banana" label="바나나" />
        </CheckBoxGroup.Root>,
      )
      const [apple, banana] = getAllCheckboxes()
      expect(apple).toHaveAttribute('aria-checked', 'true')
      expect(banana).toHaveAttribute('aria-checked', 'false')
    })
  })

  describe('접근성', () => {
    it('라벨이 체크박스와 연결된다', () => {
      render(<CheckBoxCard label="연결된 라벨" />)
      expect(getCheckbox()).toHaveAttribute('id')
      expect(screen.getByText('연결된 라벨')).toBeInTheDocument()
    })
  })
})
