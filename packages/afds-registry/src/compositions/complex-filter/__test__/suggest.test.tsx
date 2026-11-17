import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { kw, setup, FIELDS, chipTexts, type, press, lastCall } from './test-utils'

vi.mock('@turbo-project/afds/bricks', async importOriginal => ({
  ...(await importOriginal<typeof import('@turbo-project/afds/bricks')>()),
  Popover: (await import('./popover-mock')).MockPopover,
}))

describe('키워드 추천', () => {
  it('입력하면 키워드 필드 전부를 「필드에 값 연산자」 행으로 보여 준다(거르지 않음)', () => {
    // Given
    const { input } = setup()

    // When
    type(input, '마그')

    // Then
    expect(screen.getAllByRole('option').map(row => row.textContent)).toEqual([
      '이름에마그포함',
      'ID에마그포함',
    ])
    type(input, 'zzz-없는값')
    expect(screen.getAllByRole('option')).toHaveLength(2)
  })

  it('suggest: false 필드는 추천 행에서 빠지고 그 필드의 칩은 그려진다', () => {
    // Given
    const fields = FIELDS.map(field => (field.key === 'id' ? { ...field, suggest: false } : field))
    const { input } = setup({ fields, initial: [kw('c1', 'A-1', {}, 'id')] })

    // When
    type(input, '마그')

    // Then
    expect(screen.getAllByRole('option').map(row => row.textContent)).toEqual(['이름에마그포함'])
    expect(screen.queryByTestId('complex-filter-suggestion-id')).toBeNull()
    expect(chipTexts()).toEqual(['ID에A-1포함'])
  })

  it('행 클릭은 그 필드의 첫 연산자로 칩을 만들고 입력을 비우며 필드 메뉴를 다시 연다', () => {
    // Given
    const { input, onChange } = setup()
    type(input, '마그네슘')

    // When
    fireEvent.click(screen.getByTestId('complex-filter-suggestion-id'))

    // Then
    expect(lastCall(onChange)).toMatchObject([
      { kind: 'keyword', fieldKey: 'id', condition: 'like', value: '마그네슘' },
    ])
    expect(chipTexts()).toEqual(['ID에마그네슘포함'])
    expect(input).toHaveValue('')
    expect(screen.getByTestId('complex-filter-field-media')).toBeVisible()
  })

  it('↑↓ 가 순환하고 Enter 가 하이라이트 행을 확정한다', () => {
    // Given
    const { input, onChange } = setup()
    type(input, '값')

    // When
    press(input, 'ArrowUp')
    press(input, 'Enter')

    // Then
    expect(lastCall(onChange)).toMatchObject([{ fieldKey: 'id', value: '값' }])
  })

  it('Enter 는 쉼표로 나눠 trim·빈 값·중복을 걸러 칩을 만들고 이미 있는 칩은 무시한다', () => {
    // Given
    const { input } = setup({ initial: [kw('x', 'a')] })
    type(input, ' a , b,, b ,c ')

    // When
    press(input, 'Enter')

    // Then
    expect(chipTexts()).toEqual(['이름에a포함', '이름에b포함', '이름에c포함'])
  })

  it('같은 값이라도 연산자가 다르면 별개 칩이다', () => {
    // Given
    const { input } = setup({ initial: [kw('x', 'a', {}, 'name', 'unlike')] })
    type(input, 'a')

    // When
    press(input, 'Enter')

    // Then
    expect(chipTexts()).toEqual(['이름에a제외', '이름에a포함'])
  })

  it('maxChips 를 넘는 키워드는 만들지 않는다', () => {
    // Given
    const { input } = setup({ maxChips: 2, initial: [kw('x', 'a')] })
    type(input, 'b,c')

    // When
    press(input, 'Enter')

    // Then
    expect(chipTexts()).toEqual(['이름에a포함', '이름에b포함'])
  })

  it('입력칸에 maxLength 가 걸려 있다', () => {
    setup({ maxLength: 5 })
    expect(screen.getByRole('combobox')).toHaveAttribute('maxlength', '5')
  })

  it('한글 조합 중에는 Enter·방향키를 무시한다', () => {
    // Given
    const { input, onChange } = setup()
    type(input, '이벤')

    // When
    press(input, 'Enter', { isComposing: true })
    press(input, 'ArrowDown', { isComposing: true })

    // Then
    expect(onChange).not.toHaveBeenCalled()
    expect(input).toHaveAttribute('aria-activedescendant', screen.getAllByRole('option')[0]!.id)
  })

  it('줄바꿈·탭이 든 붙여넣기는 쉼표로 바꿔 입력에 채운다', () => {
    // Given
    const { input } = setup()

    // When
    fireEvent.paste(input, { clipboardData: { getData: () => 'a\nb\tc' } })

    // Then
    expect(input).toHaveValue('a,b,c')
  })

  it('글자를 더 쳐도 하이라이트는 유지되고, 필드 메뉴에서 추천으로 바뀔 때만 처음으로 돌아간다', () => {
    // Given: 필드 메뉴에서 한 칸 내려간 뒤
    const { input } = setup()
    press(input, 'ArrowDown')
    press(input, 'ArrowDown')

    // When
    type(input, '값')

    // Then: 추천 목록의 첫 행
    expect(input).toHaveAttribute('aria-activedescendant', screen.getAllByRole('option')[0]!.id)

    // When: 추천 안에서 내려가 더 치면 유지된다
    press(input, 'ArrowDown')
    type(input, '값값')
    expect(input).toHaveAttribute('aria-activedescendant', screen.getAllByRole('option')[1]!.id)
  })

  it('Esc 로 닫고 포커스만으로는 열리지 않는다', () => {
    // Given
    const { input } = setup()
    fireEvent.focus(input)
    expect(screen.queryByRole('listbox')).toBeNull()
    type(input, '값')

    // When
    press(input, 'Escape')

    // Then
    expect(screen.queryByRole('listbox')).toBeNull()
  })
})

describe('추천 행: 값은 말줄임, 라벨·연산자는 고정', () => {
  const LONG = 'ㅂ,ㅈ,ㄷ,ㄱ,ㅅ,ㅛ,1,2,5,2,3,5,1,매우 긴 값이 이어진다'

  const rowParts = (fieldKey: string, value: string) => {
    const row = screen.getByTestId(`complex-filter-suggestion-${fieldKey}`)
    const spans = within(row).getAllByText(/.+/, { selector: 'span span' })
    return {
      row,
      before: spans[0]!,
      value: within(row).getByTitle(value),
      after: spans[spans.length - 1]!,
    }
  }

  it('라벨·연산자는 줄어들거나 줄바꿈되지 않고 값만 말줄임으로 줄어든다', () => {
    // Given
    const { input } = setup()

    // When
    type(input, LONG)

    // Then
    const { row, before, value, after } = rowParts('name', LONG)
    expect(before).toHaveTextContent('이름에')
    expect(before.className).toContain('shrink-0')
    expect(before.className).toContain('whitespace-nowrap')
    expect(after).toHaveTextContent('포함')
    expect(after.className).toContain('shrink-0')
    expect(after.className).toContain('whitespace-nowrap')
    expect(value.className).toContain('min-w-0')
    expect(value.className).toContain('flex-1')
    expect(value.className).toContain('truncate')
    expect(value).toHaveAttribute('title', LONG)
    expect(row.className).toContain('h-afds-spacing-34')
  })

  it('라벨에는 상한이 있어 긴 필드명이 값을 밀어내지 못한다', () => {
    // Given
    const { input } = setup()

    // When
    type(input, '값')

    // Then
    const { before } = rowParts('name', '값')
    expect(before.className).toContain('max-w-')
    expect(before.className).toContain('truncate')
  })

  it('필드 메뉴·서브메뉴 목록의 긴 문자열 라벨도 한 줄로 말줄임된다', async () => {
    // Given
    const user = userEvent.setup()
    setup()

    // When
    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByTestId('complex-filter-field-media'))

    // Then
    expect(screen.getByText('Kakao').className).toContain('truncate')
    expect(
      within(screen.getByTestId('complex-filter-field-media')).getByText('매체').className,
    ).toContain('truncate')
  })
})

describe('쉼표가 든 입력의 추천 행', () => {
  it('쉼표를 포함한 긴 입력도 칩을 만들지 않고 추천 행 두 개가 한 줄로 뜬다', async () => {
    // Given
    const user = userEvent.setup()
    const { input, onChange } = setup()

    // When
    await user.type(input, 'ㅂ,ㅈ,ㄷ,ㄱ,ㅅ,ㅛ,1,2,5,2,3,5,1')

    // Then
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getAllByTestId(/^complex-filter-suggestion-/)).toHaveLength(2)
    const row = screen.getByTestId('complex-filter-suggestion-name')
    expect(row.className).toContain('h-afds-spacing-34')
  })
})
