import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { setup } from './test-utils'

vi.mock('@turbo-project/afds/bricks', async importOriginal => ({
  ...(await importOriginal<typeof import('@turbo-project/afds/bricks')>()),
  Popover: (await import('./popover-mock')).MockPopover,
}))

describe('matchMode', () => {
  const matchMode = {
    value: 'all',
    options: [
      { value: 'all', label: '모든 조건 만족' },
      { value: 'any', label: '하나라도 만족' },
    ],
    onChange: vi.fn(),
    ariaLabel: '결합 방식',
  }

  it('넘기면 드롭다운을 그리고 고르면 onChange 를 호출한다', () => {
    // Given
    setup({ matchMode })
    expect(screen.getByTestId('complex-filter-match-mode')).toHaveTextContent('모든 조건 만족')

    // When
    fireEvent.click(screen.getByTestId('complex-filter-match-mode'))
    fireEvent.click(screen.getByTestId('complex-filter-match-any'))

    // Then
    expect(matchMode.onChange).toHaveBeenCalledWith('any')
  })

  it('없으면 그리지 않는다', () => {
    setup()
    expect(screen.queryByTestId('complex-filter-match-mode')).toBeNull()
  })
})

describe('결합 방식 항목 강조', () => {
  it('포커스 배경은 focus-visible 에만 걸려 호버 행과 동시에 두 행이 칠해지지 않는다', async () => {
    // Given
    const user = userEvent.setup()
    setup({
      matchMode: {
        value: 'all',
        options: [
          { value: 'all', label: '모두' },
          { value: 'or', label: '하나' },
        ],
        onChange: vi.fn(),
        ariaLabel: '결합',
      },
    })

    // When
    await user.click(screen.getByTestId('complex-filter-match-mode'))

    // Then
    const { className } = screen.getByTestId('complex-filter-match-or')
    expect(className).toContain('hover:bg-afds-bg-surface-sunken')
    expect(className).toContain('focus-visible:bg-afds-bg-surface-sunken')
    expect(className).not.toMatch(/(^|\s)focus:bg-/)
  })
})
