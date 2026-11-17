import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { setup, type, press } from './test-utils'

vi.mock('@turbo-project/afds/bricks', async importOriginal => ({
  ...(await importOriginal<typeof import('@turbo-project/afds/bricks')>()),
  Popover: (await import('./popover-mock')).MockPopover,
}))

describe('최근 검색', () => {
  const recent = (items: string[]) => ({
    items,
    onRemove: vi.fn(),
    onAdd: vi.fn(),
    onSelect: vi.fn(),
  })

  it('지정하지 않으면 항목이 없고, 지정하면 필드 메뉴 첫 행에 나온다', () => {
    // Given
    const { input } = setup()
    fireEvent.click(input)
    expect(screen.queryByTestId('complex-filter-recent')).toBeNull()
  })

  it('항목을 고르면 입력에 채워 추천 모드가 되고(바로 칩이 되지 않음) onSelect 를 알린다', async () => {
    // Given
    const user = userEvent.setup()
    const recentSearches = recent(['마그', '나이키'])
    const { input, onChange } = setup({ recentSearches })
    await user.click(input)
    expect(screen.getAllByRole('option')[0]).toHaveTextContent('최근 검색')

    // When
    await user.keyboard('{Enter}{ArrowDown}{Enter}')

    // Then
    expect(input).toHaveValue('나이키')
    expect(onChange).not.toHaveBeenCalled()
    expect(recentSearches.onSelect).toHaveBeenCalledWith('나이키')
    expect(screen.getByTestId('complex-filter-suggestion-name')).toBeVisible()
  })

  it('행 삭제 버튼과 Delete 키가 onRemove 를 부른다', async () => {
    // Given
    const user = userEvent.setup()
    const recentSearches = recent(['마그', '나이키'])
    setup({ recentSearches })
    await user.click(screen.getByRole('combobox'))
    await user.keyboard('{Enter}')

    // When
    await user.keyboard('{Delete}')
    await user.click(screen.getAllByTestId('complex-filter-recent-remove')[1]!)

    // Then
    expect(recentSearches.onRemove).toHaveBeenNthCalledWith(1, '마그')
    expect(recentSearches.onRemove).toHaveBeenNthCalledWith(2, '나이키')
  })

  it('비었으면 「검색 기록 없음」을 보여 준다', async () => {
    // Given
    const user = userEvent.setup()
    setup({ recentSearches: recent([]) })

    // When
    await user.click(screen.getByRole('combobox'))
    await user.keyboard('{Enter}')

    // Then
    expect(screen.getByTestId('complex-filter-recent-empty')).toHaveTextContent('검색 기록 없음')
  })

  it('키워드 칩이 만들어질 때 값마다 onAdd 를 부른다', () => {
    // Given
    const recentSearches = recent([])
    const { input } = setup({ recentSearches })
    type(input, 'a,b')

    // When
    press(input, 'Enter')

    // Then
    expect(recentSearches.onAdd.mock.calls).toEqual([['a'], ['b']])
  })
})
