import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { kw, sel, setup, chipTexts, type, press } from './test-utils'

vi.mock('@turbo-project/afds/bricks', async importOriginal => ({
  ...(await importOriginal<typeof import('@turbo-project/afds/bricks')>()),
  Popover: (await import('./popover-mock')).MockPopover,
}))

describe('칩 클릭 수정', () => {
  const KEYWORD = [kw('k', '마그')]
  const editButton = () => screen.getByTestId('complex-filter-chip-edit')
  const editorInput = () => screen.getByTestId('complex-filter-keyword-input')

  it('키워드 칩: 제목·값 입력·포함/제외 토글·취소/적용이 열린다', async () => {
    // Given
    const user = userEvent.setup()
    setup({ initial: KEYWORD })

    // When
    await user.click(editButton())

    // Then
    const editor = screen.getByTestId('complex-filter-keyword-editor')
    expect(within(editor).getByText('이름에')).toBeVisible()
    expect(editorInput()).toHaveValue('마그')
    expect(screen.getByTestId('complex-filter-condition-unlike')).toBeVisible()
    expect(screen.getByTestId('complex-filter-apply')).toBeEnabled()
  })

  it('값·연산자를 고쳐 적용하면 칩이 제자리에서 갱신되고 포커스는 입력으로 간다', async () => {
    // Given
    const user = userEvent.setup()
    const { input } = setup({ initial: [kw('a', 'a'), kw('z', 'z', {}, 'id')] })
    await user.click(screen.getAllByTestId('complex-filter-chip-edit')[0]!)

    // When
    await user.clear(editorInput())
    await user.type(editorInput(), 'b')
    await user.click(screen.getByTestId('complex-filter-condition-unlike'))
    await user.click(screen.getByTestId('complex-filter-apply'))

    // Then
    expect(chipTexts()).toEqual(['이름에b제외', 'ID에z포함'])
    expect(screen.queryByTestId('complex-filter-keyword-editor')).toBeNull()
    expect(input).toHaveFocus()
  })

  it('연산자가 하나뿐인 필드는 토글 없이 제목에 연산자를 대괄호 없이 붙인다', async () => {
    // Given
    const user = userEvent.setup()
    setup({ initial: [kw('i', '1', {}, 'id')] })

    // When
    await user.click(editButton())

    // Then
    expect(screen.queryByTestId('complex-filter-condition-like')).toBeNull()
    expect(
      within(screen.getByTestId('complex-filter-keyword-editor')).getByText('ID에 포함'),
    ).toBeVisible()
  })

  it('빈 값이면 적용이 비활성이고 검증 문구가 나온다', async () => {
    // Given
    const user = userEvent.setup()
    const { onChange } = setup({ initial: KEYWORD })
    await user.click(editButton())

    // When
    await user.clear(editorInput())
    await user.type(editorInput(), '   ')

    // Then
    expect(screen.getByTestId('complex-filter-apply')).toBeDisabled()
    expect(screen.getByTestId('complex-filter-keyword-error')).toHaveTextContent(
      '값을 입력해 주세요',
    )
    await user.click(screen.getByTestId('complex-filter-apply'))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('쉼표는 입력 즉시 지워지고, 입력에는 maxLength 가 걸린다', async () => {
    // Given
    const user = userEvent.setup()
    setup({ initial: KEYWORD, maxLength: 7 })
    await user.click(editButton())

    // When
    await user.clear(editorInput())
    await user.type(editorInput(), 'a,b,,c')

    // Then
    expect(editorInput()).toHaveValue('abc')
    expect(editorInput()).toHaveAttribute('maxlength', '7')
  })

  it('Enter 로 적용하고 한글 조합 중 Enter 는 무시한다', async () => {
    // Given
    const user = userEvent.setup()
    const { onChange } = setup({ initial: KEYWORD })
    await user.click(editButton())
    await user.clear(editorInput())
    await user.type(editorInput(), '새값')

    // When
    fireEvent.keyDown(editorInput(), { key: 'Enter', isComposing: true })
    expect(onChange).not.toHaveBeenCalled()
    await user.keyboard('{Enter}')

    // Then
    expect(chipTexts()).toEqual(['이름에새값포함'])
  })

  it('값·연산자가 그대로면 닫기만 하고, 취소는 변경을 버린다', async () => {
    // Given
    const user = userEvent.setup()
    const { onChange } = setup({ initial: KEYWORD })

    // When
    await user.click(editButton())
    await user.click(screen.getByTestId('complex-filter-apply'))
    await user.click(editButton())
    await user.type(editorInput(), '추가')
    await user.click(screen.getByTestId('complex-filter-cancel'))

    // Then
    expect(onChange).not.toHaveBeenCalled()
    expect(chipTexts()).toEqual(['이름에마그포함'])
    expect(screen.queryByTestId('complex-filter-keyword-editor')).toBeNull()
  })

  it('수정 결과가 다른 칩과 같아지면 중복 칩을 만들지 않는다', async () => {
    // Given
    const user = userEvent.setup()
    setup({ initial: [kw('a', 'a'), kw('b', 'b')] })
    await user.click(screen.getAllByTestId('complex-filter-chip-edit')[1]!)

    // When
    await user.clear(editorInput())
    await user.type(editorInput(), 'a')
    await user.click(screen.getByTestId('complex-filter-apply'))

    // Then
    expect(chipTexts()).toEqual(['이름에a포함'])
  })

  it('선택 칩: 필드 제목·옵션 목록으로 열리고 적용하면 갱신, 전부 해제 후 적용은 삭제, 취소는 폐기다', async () => {
    // Given
    const user = userEvent.setup()
    setup({ initial: [sel('s', 'media', ['KAKAO'])] })

    // When
    await user.click(editButton())

    // Then
    expect(
      within(screen.getByTestId('complex-filter-values-editor')).getByText('매체'),
    ).toBeVisible()
    expect(screen.getAllByRole('option').map(o => o.getAttribute('aria-selected'))).toEqual([
      'true',
      'false',
    ])

    // When
    await user.click(screen.getByTestId('complex-filter-option-media-FACEBOOK'))
    await user.click(screen.getByTestId('complex-filter-cancel'))
    expect(chipTexts()).toEqual(['매체Kakao'])
    await user.click(editButton())
    await user.click(screen.getByTestId('complex-filter-option-media-FACEBOOK'))
    await user.click(screen.getByTestId('complex-filter-apply'))
    expect(chipTexts()).toEqual(['매체Kakao, Meta'])
    await user.click(editButton())
    await user.click(screen.getByTestId('complex-filter-option-media-KAKAO'))
    await user.click(screen.getByTestId('complex-filter-option-media-FACEBOOK'))
    await user.click(screen.getByTestId('complex-filter-apply'))

    // Then
    expect(chipTexts()).toEqual([])
  })

  it('editable:false 칩은 눌러도 수정 팝오버가 열리지 않는다', async () => {
    // Given
    const user = userEvent.setup()
    setup({ initial: [kw('a', 'a', { editable: false })] })

    // When
    await user.click(screen.getByTestId('complex-filter-chip'))

    // Then
    expect(screen.queryByTestId('complex-filter-chip-edit')).toBeNull()
    expect(screen.queryByTestId('complex-filter-keyword-editor')).toBeNull()
  })

  it('disabled 이면 칩 수정·삭제·지우기·접기·입력이 모두 막힌다', () => {
    // Given
    setup({ initial: [kw('a', 'a')], disabled: true })

    // Then
    expect(screen.queryByTestId('complex-filter-chip-edit')).toBeNull()
    expect(screen.getByRole('button', { name: '이름에 a 포함 삭제' })).toBeDisabled()
    expect(screen.getByTestId('complex-filter-clear')).toBeDisabled()
    expect(screen.getByTestId('complex-filter-toggle')).toBeDisabled()
    expect(screen.getByRole('combobox')).toBeDisabled()
  })
})

describe('칩 삭제', () => {
  const FULL = [kw('a', 'a'), kw('b', 'b', {}, 'id'), sel('s', 'status', ['done'])]

  it('빈 입력의 Backspace 는 마지막 칩부터 하나씩 지운다', () => {
    // Given
    const { input } = setup({ initial: FULL })

    // When
    press(input, 'Backspace')
    press(input, 'Backspace')

    // Then
    expect(chipTexts()).toEqual(['이름에a포함'])
  })

  it('입력에 글자가 있거나 한글 조합 중이면 Backspace 가 칩을 지우지 않는다', () => {
    // Given
    const { input, onChange } = setup({ initial: FULL })
    press(input, 'Backspace', { isComposing: true })
    type(input, 'x')

    // When
    press(input, 'Backspace')

    // Then
    expect(onChange).not.toHaveBeenCalled()
  })

  it('칩 X 와 지우기 뒤에는 포커스가 입력으로 돌아간다', () => {
    // Given
    const { input } = setup({ initial: FULL })

    // When
    fireEvent.click(screen.getByRole('button', { name: '이름에 a 포함 삭제' }))
    expect(input).toHaveFocus()
    ;(document.activeElement as HTMLElement).blur()
    fireEvent.click(screen.getByTestId('complex-filter-clear'))

    // Then
    expect(input).toHaveFocus()
    expect(chipTexts()).toEqual([])
  })

  it('deletable:false 칩은 X·Backspace 삭제가 없고, 전부 고정이면 지우기는 자리를 유지한 채 disabled 다', () => {
    // Given
    const { input, onChange } = setup({
      initial: [kw('a', 'a', { deletable: false })],
    })

    // When
    press(input, 'Backspace')

    // Then
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: /삭제/ })).toBeNull()
    expect(screen.getByTestId('complex-filter-clear')).toBeDisabled()
  })

  it('칩이 없으면 지우기는 disabled 이고 입력하면 활성화된다', () => {
    // Given
    const { input } = setup()
    expect(screen.getByTestId('complex-filter-clear')).toBeDisabled()

    // When
    type(input, '남은 글자')

    // Then
    expect(screen.getByTestId('complex-filter-clear')).toBeEnabled()
  })

  it('공백만 있는 입력에서는 Backspace 가 칩을 지우지 않는다', () => {
    // Given
    const { input, onChange } = setup({ initial: [kw('a', 'a')] })
    type(input, '  ')

    // When
    press(input, 'Backspace')

    // Then
    expect(onChange).not.toHaveBeenCalled()
  })

  it('지우기는 입력 중이던 글자도 비운다', () => {
    // Given
    const { input, onClear } = setup({ initial: FULL })
    type(input, '남은 글자')

    // When
    fireEvent.click(screen.getByTestId('complex-filter-clear'))

    // Then
    expect(onClear).toHaveBeenCalledTimes(1)
    expect(input).toHaveValue('')
  })
})

describe('키워드 수정 입력의 수정키 Enter', () => {
  it.each([
    ['Shift+Enter', '{Shift>}{Enter}{/Shift}'],
    ['Alt+Enter', '{Alt>}{Enter}{/Alt}'],
  ])('%s 는 적용하지 않는다', async (_name, combo) => {
    // Given
    const user = userEvent.setup()
    const { onChange } = setup({ initial: [kw('k1', '원래')] })
    await user.click(screen.getByTestId('complex-filter-chip-edit'))
    const editor = screen.getByTestId('complex-filter-keyword-editor')
    const input = within(editor).getByRole('textbox')
    await user.clear(input)
    await user.type(input, '바뀜')

    // When
    await user.keyboard(combo)

    // Then
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByTestId('complex-filter-keyword-editor')).toBeVisible()
  })
})
