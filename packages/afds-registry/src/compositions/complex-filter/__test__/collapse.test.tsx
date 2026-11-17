import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { kw, setup } from './test-utils'

vi.mock('@turbo-project/afds/bricks', async importOriginal => ({
  ...(await importOriginal<typeof import('@turbo-project/afds/bricks')>()),
  Popover: (await import('./popover-mock')).MockPopover,
}))

describe('접기/펼치기', () => {
  it('버튼이 aria-expanded 를 갖고 접으면 높이가 44px 로 제한된다', async () => {
    // Given
    const user = userEvent.setup()
    setup({ initial: [kw('a', 'a')] })
    const toggle = screen.getByTestId('complex-filter-toggle')
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(toggle).toHaveAccessibleName('필터 접기')

    // When
    await user.click(toggle)

    // Then
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(toggle).toHaveAccessibleName('필터 펼치기')
    expect(screen.getByTestId('complex-filter-bar').className).toContain('max-h-afds-spacing-44')
  })

  it('접힌 상태에서 입력에 포커스하면 자동으로 펼쳐지고 onToggle 을 알린다', async () => {
    // Given
    const user = userEvent.setup()
    const onToggle = vi.fn()
    setup({ expanded: false, onToggle })

    // When
    await user.click(screen.getByRole('combobox'))

    // Then
    expect(onToggle).toHaveBeenCalledWith(true)
  })

  it('제어 모드에서는 expanded prop 이 상태를 결정한다', async () => {
    // Given
    const user = userEvent.setup()
    const onToggle = vi.fn()
    setup({ expanded: true, onToggle })

    // When
    await user.click(screen.getByTestId('complex-filter-toggle'))

    // Then
    expect(onToggle).toHaveBeenCalledWith(false)
    expect(screen.getByTestId('complex-filter-bar')).toHaveAttribute('data-expanded', 'true')
  })

  it('접힌 상태에서 칩이 가려질 때만 가로 말줄임 「…」 를 지우기 왼쪽에 보여 준다', () => {
    // Given
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(80)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(44)

    // When
    setup({ expanded: false, initial: [kw('a', 'a')] })

    // Then
    const hidden = screen.getByTestId('complex-filter-overflow')
    expect(hidden).toHaveTextContent('가려진 칩이 더 있음')
    expect(hidden.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    expect(hidden).not.toHaveTextContent('⋮')
    const order = [
      hidden,
      screen.getByTestId('complex-filter-clear'),
      screen.getByTestId('complex-filter-toggle'),
    ]
    const actions = screen.getByTestId('complex-filter-actions')
    expect([...actions.children]).toEqual(order)
    vi.restoreAllMocks()
  })

  it('「…」 는 세로 점(EllipsisVerticalIcon)이 아니라 가로 점(EllipsisIcon)이다', () => {
    // Given
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(80)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(44)

    // When
    setup({ expanded: false, initial: [kw('a', 'a')] })

    // Then
    const svg = screen.getByTestId('complex-filter-overflow').querySelector('svg')!
    expect(svg).toHaveClass('lucide-ellipsis')
    expect(svg).not.toHaveClass('lucide-ellipsis-vertical')
    vi.restoreAllMocks()
  })

  it('펼치면 「…」 가 사라진다', () => {
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(80)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(44)
    setup({ expanded: true, initial: [kw('a', 'a')] })
    expect(screen.queryByTestId('complex-filter-overflow')).toBeNull()
    vi.restoreAllMocks()
  })

  it('넘치지 않으면 「…」 가 없다', () => {
    setup({ expanded: false, initial: [kw('a', 'a')] })
    expect(screen.queryByTestId('complex-filter-overflow')).toBeNull()
  })
})

describe('우측 그룹은 첫 줄에 고정', () => {
  it('우측 그룹은 가운데 정렬이 아니라 위쪽 정렬이고 칩은 영역 폭을 넘지 않는다', () => {
    // Given
    setup({
      initial: [
        {
          id: 'k1',
          kind: 'keyword',
          fieldKey: 'name',
          condition: 'like',
          value: '값',
        },
      ],
    })

    // Then
    const actions = screen.getByTestId('complex-filter-actions')
    expect(actions.className).toContain('self-start')
    expect(actions.className).not.toContain('self-center')
    expect(screen.getByTestId('complex-filter-chip').className).toContain('max-w-[min(250px,100%)]')
  })
})

describe('좌·우 그룹은 모두 첫 줄에 고정', () => {
  it('바는 위쪽 정렬이고 구분선은 첫 줄(34px) 안에서 위아래 마진 8 로 18px 이 된다', () => {
    // Given
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

    // Then
    const bar = screen.getByTestId('complex-filter-bar')
    expect(bar.className).toContain('items-start')
    expect(bar.className).not.toContain('items-center')
    const divider = bar.querySelector('span[aria-hidden].w-px')!
    expect(divider.className).toContain('my-afds-spacing-8')
    expect(divider.className).toContain('self-stretch')
    expect(divider.className).not.toContain('self-center')
  })
})
