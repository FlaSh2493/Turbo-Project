import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { kw, sel, setup, chipTexts } from './test-utils'

vi.mock('@turbo-project/afds/bricks', async importOriginal => ({
  ...(await importOriginal<typeof import('@turbo-project/afds/bricks')>()),
  Popover: (await import('./popover-mock')).MockPopover,
}))

describe('저장 단축키 Cmd/Ctrl+Enter', () => {
  const SAVE_KEYS = [
    ['Cmd+Enter', '{Meta>}{Enter}{/Meta}'],
    ['Ctrl+Enter', '{Control>}{Enter}{/Control}'],
  ] as const

  describe.each(SAVE_KEYS)('%s', (_name, combo) => {
    it('다중 선택 서브메뉴: 「적용」과 같이 칩을 만들고 포커스가 입력으로 돌아간다(Enter 는 토글)', async () => {
      // Given
      const user = userEvent.setup()
      const { input } = setup()
      await user.click(input)
      await user.click(screen.getByTestId('complex-filter-field-media'))
      await user.keyboard('{Enter}')
      expect(screen.getByTestId('complex-filter-option-media-KAKAO')).toHaveAttribute(
        'aria-selected',
        'true',
      )
      expect(chipTexts()).toEqual([])

      // When
      await user.keyboard(combo)

      // Then
      expect(chipTexts()).toEqual(['매체Kakao'])
      expect(screen.queryByRole('listbox')).toBeNull()
      expect(input).toHaveFocus()
    })

    it('다중 선택 서브메뉴: 포커스가 「취소」 버튼에 있어도 저장되고 취소가 눌리지 않는다', async () => {
      // Given
      const user = userEvent.setup()
      setup()
      await user.click(screen.getByRole('combobox'))
      await user.click(screen.getByTestId('complex-filter-field-media'))
      await user.keyboard(' ')
      await user.tab()
      expect(screen.getByTestId('complex-filter-cancel')).toHaveFocus()

      // When
      await user.keyboard(combo)

      // Then
      expect(chipTexts()).toEqual(['매체Kakao'])
    })

    it('선택 칩 수정: 적용과 같이 갱신하고, 전부 해제하고 누르면 칩이 삭제된다', async () => {
      // Given
      const user = userEvent.setup()
      setup({ initial: [sel('s', 'media', ['KAKAO'])] })
      await user.click(screen.getByTestId('complex-filter-chip-edit'))
      await user.click(screen.getByTestId('complex-filter-option-media-FACEBOOK'))

      // When
      await user.keyboard(combo)

      // Then
      expect(chipTexts()).toEqual(['매체Kakao, Meta'])

      // When
      await user.click(screen.getByTestId('complex-filter-chip-edit'))
      await user.click(screen.getByTestId('complex-filter-option-media-KAKAO'))
      await user.click(screen.getByTestId('complex-filter-option-media-FACEBOOK'))
      await user.keyboard(combo)

      // Then
      expect(chipTexts()).toEqual([])
    })

    it('키워드 칩 수정: 새 값을 적용하고 포커스가 입력으로 돌아간다', async () => {
      // Given
      const user = userEvent.setup()
      const { input } = setup({ initial: [kw('k', '마그')] })
      await user.click(screen.getByTestId('complex-filter-chip-edit'))
      await user.clear(screen.getByTestId('complex-filter-keyword-input'))
      await user.type(screen.getByTestId('complex-filter-keyword-input'), '새값')

      // When
      await user.keyboard(combo)

      // Then
      expect(chipTexts()).toEqual(['이름에새값포함'])
      expect(input).toHaveFocus()
    })

    it('키워드 칩 수정: 값이 비어 있으면 무시하고 검증 문구를 유지한다', async () => {
      // Given
      const user = userEvent.setup()
      const { onChange } = setup({ initial: [kw('k', '마그')] })
      await user.click(screen.getByTestId('complex-filter-chip-edit'))
      await user.clear(screen.getByTestId('complex-filter-keyword-input'))

      // When
      await user.keyboard(combo)

      // Then
      expect(onChange).not.toHaveBeenCalled()
      expect(screen.getByTestId('complex-filter-keyword-editor')).toBeVisible()
      expect(screen.getByTestId('complex-filter-keyword-error')).toBeVisible()
    })

    it('키워드 칩 수정: 값이 그대로면 닫기만 한다', async () => {
      // Given
      const user = userEvent.setup()
      const { onChange } = setup({ initial: [kw('k', '마그')] })
      await user.click(screen.getByTestId('complex-filter-chip-edit'))

      // When
      await user.keyboard(combo)

      // Then
      expect(onChange).not.toHaveBeenCalled()
      expect(screen.queryByTestId('complex-filter-keyword-editor')).toBeNull()
    })
  })

  it.each([
    ['Shift+Cmd+Enter', { metaKey: true, shiftKey: true }],
    ['Alt+Ctrl+Enter', { ctrlKey: true, altKey: true }],
    ['한글 조합 중 Cmd+Enter', { metaKey: true, isComposing: true }],
  ])('%s 는 무시한다(다중 서브메뉴·키워드 수정 모두)', async (_name, init) => {
    // Given: 다중 서브메뉴에서 하나 토글해 둔다
    const user = userEvent.setup()
    const { onChange } = setup({ initial: [kw('k', '마그')] })
    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByTestId('complex-filter-field-media'))
    await user.keyboard(' ')

    // When
    fireEvent.keyDown(screen.getByRole('listbox', { name: '매체' }), {
      key: 'Enter',
      ...init,
    })

    // Then
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByRole('listbox', { name: '매체' })).toBeVisible()

    // When: 키워드 수정에서도 같다
    await user.keyboard('{Escape}')
    await user.click(screen.getByTestId('complex-filter-chip-edit'))
    await user.clear(screen.getByTestId('complex-filter-keyword-input'))
    await user.type(screen.getByTestId('complex-filter-keyword-input'), '다른값')
    fireEvent.keyDown(screen.getByTestId('complex-filter-keyword-input'), {
      key: 'Enter',
      ...init,
    })

    // Then
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByTestId('complex-filter-keyword-editor')).toBeVisible()
  })

  it('일반 Enter 는 그대로다 — 목록에서는 토글, 키워드 수정에서는 적용', async () => {
    // Given
    const user = userEvent.setup()
    setup({ initial: [kw('k', '마그')] })
    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByTestId('complex-filter-field-media'))

    // When
    await user.keyboard('{Enter}')

    // Then: 토글만 되고 저장되지 않는다
    expect(screen.getByTestId('complex-filter-option-media-KAKAO')).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(chipTexts()).toEqual(['이름에마그포함'])

    // When: 키워드 수정의 일반 Enter 는 적용
    await user.keyboard('{Escape}')
    await user.click(screen.getByTestId('complex-filter-chip-edit'))
    await user.clear(screen.getByTestId('complex-filter-keyword-input'))
    await user.type(screen.getByTestId('complex-filter-keyword-input'), '엔터{Enter}')

    // Then
    expect(chipTexts()).toEqual(['이름에엔터포함'])
  })

  it('「적용」 버튼은 단축키를 aria-keyshortcuts 로 알린다(세 곳)', async () => {
    // Given
    const user = userEvent.setup()
    setup({ initial: [kw('k', '마그'), sel('s', 'status', ['done'])] })

    // When / Then: 키워드 수정
    await user.click(screen.getAllByTestId('complex-filter-chip-edit')[0]!)
    expect(screen.getByTestId('complex-filter-apply')).toHaveAttribute(
      'aria-keyshortcuts',
      'Meta+Enter Control+Enter',
    )
    await user.keyboard('{Escape}')

    // 선택 칩 수정
    await user.click(screen.getAllByTestId('complex-filter-chip-edit')[1]!)
    expect(screen.getByTestId('complex-filter-apply')).toHaveAttribute(
      'aria-keyshortcuts',
      'Meta+Enter Control+Enter',
    )
    await user.keyboard('{Escape}')

    // 다중 서브메뉴
    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByTestId('complex-filter-field-media'))
    expect(screen.getByTestId('complex-filter-apply')).toHaveAttribute(
      'aria-keyshortcuts',
      'Meta+Enter Control+Enter',
    )
  })
})

describe('수정키 Enter 는 선택 목록을 토글하지 않는다', () => {
  it.each([
    ['Shift+Enter', '{Shift>}{Enter}{/Shift}'],
    ['Alt+Enter', '{Alt>}{Enter}{/Alt}'],
  ])('%s', async (_name, combo) => {
    // Given
    const user = userEvent.setup()
    const { input } = setup()
    await user.click(input)
    await user.click(screen.getByTestId('complex-filter-field-media'))
    const option = screen.getByTestId('complex-filter-option-media-KAKAO')
    expect(option).toHaveAttribute('aria-selected', 'false')

    // When
    await user.keyboard(combo)

    // Then
    expect(option).toHaveAttribute('aria-selected', 'false')
  })
})
