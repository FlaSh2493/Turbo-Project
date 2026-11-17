import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ComplexFilter } from '..'
import { resolveLabels } from '../labels'
import { FIELDS, kw } from './test-utils'

vi.mock('@turbo-project/afds/bricks', async importOriginal => ({
  ...(await importOriginal<typeof import('@turbo-project/afds/bricks')>()),
  Popover: (await import('./popover-mock')).MockPopover,
}))

const matchMode = {
  value: 'all',
  options: [
    { value: 'all', label: 'All' },
    { value: 'or', label: 'Any' },
  ],
  onChange: vi.fn(),
  ariaLabel: 'Match mode',
}

const rootProps = {
  fields: FIELDS,
  chips: [kw('a', '여름')],
  onChange: vi.fn(),
  onClear: vi.fn(),
  matchMode,
}

describe('ComplexFilter 합성', () => {
  it('Root 밖에서 파트를 쓰면 던진다', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<ComplexFilter.Input />)).toThrow(
      'ComplexFilter parts must be used within ComplexFilter.Root',
    )
    spy.mockRestore()
  })

  it('children 이 없을 때의 기본 배치는 명시 조립과 DOM 이 같다', () => {
    const a = render(<ComplexFilter.Root {...rootProps} />)
    const implicit = a.container.innerHTML
    a.unmount()
    const b = render(
      <ComplexFilter.Root {...rootProps}>
        <ComplexFilter.MatchMode />
        <ComplexFilter.Input />
        <ComplexFilter.Actions>
          <ComplexFilter.CollapseToggle />
        </ComplexFilter.Actions>
      </ComplexFilter.Root>,
    )
    const normalize = (html: string) =>
      html.replace(/(id|for|aria-controls|aria-activedescendant)="[^"]*"/g, '')
    expect(normalize(b.container.innerHTML)).toBe(normalize(implicit))
  })

  it('Actions 의 children 이 undefined 면 접기 버튼을 기본으로 그리고, 주면 대체한다', () => {
    const { unmount } = render(
      <ComplexFilter.Root {...rootProps}>
        <ComplexFilter.Actions />
      </ComplexFilter.Root>,
    )
    expect(screen.getByTestId('complex-filter-toggle')).toBeInTheDocument()
    unmount()
    render(
      <ComplexFilter.Root {...rootProps}>
        <ComplexFilter.Actions>{null}</ComplexFilter.Actions>
      </ComplexFilter.Root>,
    )
    expect(screen.queryByTestId('complex-filter-toggle')).toBeNull()
  })

  it('Input 의 children 이 undefined 일 때만 기본 칩을 그린다(null 은 칩 없음)', () => {
    const { unmount } = render(
      <ComplexFilter.Root {...rootProps}>
        <ComplexFilter.Input />
      </ComplexFilter.Root>,
    )
    expect(screen.getAllByTestId('complex-filter-chip')).toHaveLength(1)
    unmount()
    render(
      <ComplexFilter.Root {...rootProps}>
        <ComplexFilter.Input>{null}</ComplexFilter.Input>
      </ComplexFilter.Root>,
    )
    expect(screen.queryAllByTestId('complex-filter-chip')).toHaveLength(0)
  })

  it('matchMode 가 없으면 MatchMode 는 아무것도 그리지 않는다', () => {
    render(
      <ComplexFilter.Root {...rootProps} matchMode={undefined}>
        <ComplexFilter.MatchMode />
      </ComplexFilter.Root>,
    )
    expect(screen.queryByTestId('complex-filter-match-mode')).toBeNull()
  })

  it('정의에 없는 필드의 칩은 그리지 않는다', () => {
    render(
      <ComplexFilter.Root {...rootProps}>
        <ComplexFilter.Input>
          <ComplexFilter.Chip chip={kw('x', 'v', {}, 'unknown')} />
        </ComplexFilter.Input>
      </ComplexFilter.Root>,
    )
    expect(screen.queryByTestId('complex-filter-chip')).toBeNull()
  })

  it('외부 ref 와 className 이 Root 에 합쳐진다', () => {
    const ref = { current: null as HTMLDivElement | null }
    render(<ComplexFilter.Root {...rootProps} ref={ref} className="extra" />)
    expect(ref.current).toBe(screen.getByTestId('complex-filter-bar'))
    expect(ref.current).toHaveClass('extra')
    expect(ref.current).toHaveAttribute('data-slot', 'complex-filter')
  })

  it('labels 를 주지 않으면 영문 기본 문구를 쓴다', () => {
    render(<ComplexFilter.Root {...rootProps} />)
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-label', 'Search')
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument()
  })
})

describe('resolveLabels', () => {
  it('객체형 문구는 한 단계 부분 병합, 함수형·문자열은 교체한다', () => {
    const labels = resolveLabels({
      clear: '지우기',
      editor: { apply: '적용' },
      removeChip: t => `${t} 삭제`,
    })
    expect(labels.clear).toBe('지우기')
    expect(labels.editor).toEqual({ ...resolveLabels().editor, apply: '적용' })
    expect(labels.removeChip('a')).toBe('a 삭제')
    expect(labels.search).toBe('Search')
  })
})

describe('새 칩 id', () => {
  it('이미 있는 id(chip-1) 와 겹치지 않는다', async () => {
    // Given — 저장소에서 되살린 칩이 chip-1 을 갖고 있다
    const user = userEvent.setup()
    const onChangeSpy = vi.fn()
    render(
      <ComplexFilter.Root
        fields={FIELDS}
        chips={[kw('chip-1', '기존')]}
        onChange={onChangeSpy}
        onClear={vi.fn()}
      />,
    )

    // When
    await user.type(screen.getByRole('combobox'), '새값{Enter}')

    // Then
    const next = onChangeSpy.mock.calls[0]![0] as { id: string }[]
    expect(next.map(chip => chip.id)).toEqual(['chip-1', 'chip-2'])
  })
})

describe('접힘 측정', () => {
  it('칩 수가 같아도 칩 내용이 바뀌면 가려짐을 다시 잰다', () => {
    // Given — 접힌 바, 처음에는 넘치지 않는다
    const scroll = vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(44)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(44)
    const props = { ...rootProps, expanded: false, matchMode: undefined }
    const { rerender } = render(<ComplexFilter.Root {...props} chips={[kw('a', '짧음')]} />)
    expect(screen.queryByTestId('complex-filter-overflow')).toBeNull()

    // When — 같은 개수, 더 긴 칩(줄이 늘어 scrollHeight 가 커진다)
    scroll.mockReturnValue(80)
    rerender(<ComplexFilter.Root {...props} chips={[kw('a', '아주 긴 값으로 바뀜')]} />)

    // Then
    expect(screen.getByTestId('complex-filter-overflow')).toBeInTheDocument()
    vi.restoreAllMocks()
  })
})
