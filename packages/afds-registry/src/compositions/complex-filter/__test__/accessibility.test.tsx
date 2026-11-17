import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { ComplexFilter } from '..'
import { FIELDS, LABELS, kw, sel, setup, type } from './test-utils'

vi.mock('@turbo-project/afds/bricks', async importOriginal => ({
  ...(await importOriginal<typeof import('@turbo-project/afds/bricks')>()),
  Popover: (await import('./popover-mock')).MockPopover,
}))

describe('접근성·포커스', () => {
  it('입력은 combobox 로 expanded·controls·activedescendant 를 갖는다', () => {
    // Given
    const { input } = setup()
    expect(input).toHaveAttribute('aria-expanded', 'false')

    // When
    type(input, '값')

    // Then
    const listbox = screen.getByRole('listbox')
    expect(input).toHaveAttribute('aria-expanded', 'true')
    expect(input).toHaveAttribute('aria-controls', listbox.id)
    expect(listbox).toHaveAttribute('aria-label', '필터 목록')
  })

  it('Tab 은 닫으면서 포커스를 넘기고 되돌리지 않는다', async () => {
    // Given
    const user = userEvent.setup()
    const { input } = setup()
    await user.click(input)
    await user.type(input, '값')
    expect(screen.getByRole('listbox')).toBeVisible()

    // When
    await user.tab()

    // Then
    expect(screen.getByTestId('complex-filter-clear')).toHaveFocus()
    expect(input).not.toHaveFocus()
    expect(screen.queryByRole('listbox')).toBeNull()

    // When: 지우기 → 접기 버튼 → 바 밖
    await user.tab()
    expect(screen.getByTestId('complex-filter-toggle')).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: '다음 요소' })).toHaveFocus()
  })

  it('입력 영역은 팝업 버튼 의미(tab 정지·aria-haspopup)를 갖지 않는다', () => {
    // Given
    const { input } = setup()

    // Then
    const area = input.closest('[data-slot="complex-filter-input-anchor"]')!
    expect(area).not.toHaveAttribute('tabindex')
    expect(area).not.toHaveAttribute('role')
    expect(area).not.toHaveAttribute('aria-haspopup')
    expect(area).not.toHaveAttribute('aria-expanded')
  })

  it.each([[null], [undefined]])(
    'portalContainer=%s 여도 입력·칩 수정·매치모드 팝업이 모두 열린다(스코프 바깥 null 방어)',
    async container => {
      // Given
      const user = userEvent.setup()
      const matchMode = {
        value: 'all',
        options: [{ value: 'all', label: '모든 조건 만족' }],
        onChange: vi.fn(),
        ariaLabel: '결합 방식',
      }
      const { input } = setup({
        portalContainer: container,
        matchMode,
        initial: [kw('a', 'a')],
      })

      // When / Then
      type(input, '값')
      expect(screen.getAllByRole('option')).toHaveLength(2)
      await user.click(screen.getByTestId('complex-filter-chip-edit'))
      expect(screen.getByTestId('complex-filter-keyword-editor')).toBeVisible()
      await user.click(screen.getByTestId('complex-filter-match-mode'))
      expect(screen.getByTestId('complex-filter-match-all')).toBeVisible()
    },
  )
})

describe('회귀: 접근성·시각 구분 (m-1·m-2)', () => {
  it('m-1: 다중 서브메뉴 입력의 aria-controls 가 실제 존재하는 목록 id 를 가리킨다', async () => {
    // Given
    const user = userEvent.setup()
    const { input } = setup()
    await user.click(input)

    // When
    await user.click(screen.getByTestId('complex-filter-field-media'))

    // Then
    const controls = input.getAttribute('aria-controls')!
    expect(document.getElementById(controls)).toBe(screen.getByRole('listbox', { name: '매체' }))
  })

  it('m-1: 단일 서브메뉴·최근 검색 서브메뉴도 aria-controls 가 존재하는 id 다', async () => {
    // Given
    const user = userEvent.setup()
    const { input } = setup({
      recentSearches: { items: ['a'], onAdd: vi.fn(), onRemove: vi.fn() },
    })
    await user.click(input)

    // When: 최근 검색 → 상태
    await user.keyboard('{Enter}')
    expect(document.getElementById(input.getAttribute('aria-controls')!)).not.toBeNull()
    await user.keyboard('{ArrowLeft}{ArrowDown}{ArrowDown}{ArrowRight}')

    // Then
    expect(document.getElementById(input.getAttribute('aria-controls')!)).toBe(
      screen.getByRole('listbox', { name: '상태' }),
    )
  })

  it('m-2: option 의 aria-selected 는 선택값만 뜻하고 키보드 위치는 aria-activedescendant 가 가리킨다', async () => {
    // Given
    const user = userEvent.setup()
    const { input } = setup({ initial: [sel('s', 'status', ['done'])] })
    await user.click(input)
    await user.keyboard('{ArrowDown}{ArrowRight}')

    // Then: 상태 서브메뉴(단일) — 선택값(done)만 aria-selected, 하이라이트(pending)는 activedescendant
    const done = screen.getByTestId('complex-filter-option-status-done')
    const pending = screen.getByTestId('complex-filter-option-status-pending')
    expect(done).toHaveAttribute('aria-selected', 'true')
    expect(pending).toHaveAttribute('aria-selected', 'false')
    expect(input).toHaveAttribute('aria-activedescendant', pending.id)
  })

  it('m-2: 필드 메뉴 행은 하이라이트돼도 aria-selected 가 아니다', async () => {
    // Given
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('combobox'))

    // Then
    expect(screen.getByTestId('complex-filter-field-media')).toHaveAttribute(
      'aria-selected',
      'false',
    )
    expect(screen.getByTestId('complex-filter-field-media')).toHaveAttribute('data-active', 'true')
  })

  it('칩 수정이 열려 있는 동안 그 칩이 사라지면 수정 팝오버가 남지 않는다', async () => {
    // Given
    const user = userEvent.setup()
    const { onChange } = setup({ initial: [kw('a', 'a'), kw('b', 'b')] })
    await user.click(screen.getAllByTestId('complex-filter-chip-edit')[0]!)
    expect(screen.getByTestId('complex-filter-keyword-editor')).toBeVisible()

    // When: 편집 중인 칩을 지운다(바깥 변경과 같다)
    await user.click(screen.getByRole('button', { name: '이름에 a 포함 삭제' }))

    // Then
    expect(onChange).toHaveBeenCalled()
    expect(screen.queryByTestId('complex-filter-keyword-editor')).toBeNull()
  })
})

describe('시각·상태·ARIA 보강', () => {
  it('선택+하이라이트가 겹친 행에만 대비 3:1 이상 토큰의 링이 붙고, 하이라이트만인 행에는 붙지 않는다', async () => {
    // Given
    const user = userEvent.setup()
    setup({ initial: [sel('s', 'status', ['done'])] })
    await user.click(screen.getByRole('combobox'))
    await user.keyboard('{ArrowDown}{ArrowRight}{ArrowDown}')

    // Then: done = 선택+하이라이트, pending = 선택도 하이라이트도 아님
    const done = screen.getByTestId('complex-filter-option-status-done')
    expect(done).toHaveAttribute('data-active', 'true')
    expect(done.className).toContain('ring-afds-border-focus')
    expect(screen.getByTestId('complex-filter-option-status-pending').className).not.toContain(
      'ring-',
    )

    // When: 선택 안 된 행으로 이동(하이라이트만)
    await user.keyboard('{ArrowUp}')

    // Then
    const pending = screen.getByTestId('complex-filter-option-status-pending')
    expect(pending.className).not.toContain('ring-')
    expect(done.className).not.toContain('ring-')
  })

  it('목록이 닫힌 동안 입력은 존재하지 않는 id 를 aria-controls 로 가리키지 않는다', async () => {
    // Given
    const user = userEvent.setup()
    const { input } = setup()
    expect(input).not.toHaveAttribute('aria-controls')

    // When
    await user.click(input)

    // Then
    expect(document.getElementById(input.getAttribute('aria-controls')!)).not.toBeNull()

    // When
    await user.keyboard('{Escape}')

    // Then
    expect(input).not.toHaveAttribute('aria-controls')
  })

  it('같은 id 의 칩이 다시 생겨도 이전에 열려 있던 수정 팝오버는 되살아나지 않는다', async () => {
    // Given: 칩 a 의 수정 팝오버를 연다
    const user = userEvent.setup()
    const onChange = vi.fn()
    const labels = LABELS
    const chipA = kw('a', '마그')
    const { rerender } = render(
      <ComplexFilter.Root
        fields={FIELDS}
        chips={[chipA]}
        onChange={onChange}
        onClear={vi.fn()}
        labels={labels}
      />,
    )
    await user.click(screen.getByTestId('complex-filter-chip-edit'))
    expect(screen.getByTestId('complex-filter-keyword-editor')).toBeVisible()

    // When: 칩이 사라졌다가 같은 id 로 다시 생긴다(새 객체)
    rerender(
      <ComplexFilter.Root
        fields={FIELDS}
        chips={[]}
        onChange={onChange}
        onClear={vi.fn()}
        labels={labels}
      />,
    )
    rerender(
      <ComplexFilter.Root
        fields={FIELDS}
        chips={[kw('a', '마그')]}
        onChange={onChange}
        onClear={vi.fn()}
        labels={labels}
      />,
    )

    // Then
    expect(screen.queryByTestId('complex-filter-keyword-editor')).toBeNull()
  })

  it('칩 수정이 열려 있는 동안 다른 칩이 바뀌어도(같은 객체) 수정 팝오버는 유지된다', async () => {
    // Given
    const user = userEvent.setup()
    const a = kw('a', '마그')
    const onChange = vi.fn()
    const { rerender } = render(
      <ComplexFilter.Root
        fields={FIELDS}
        chips={[a]}
        onChange={onChange}
        onClear={vi.fn()}
        labels={LABELS}
      />,
    )
    await user.click(screen.getByTestId('complex-filter-chip-edit'))

    // When
    rerender(
      <ComplexFilter.Root
        fields={FIELDS}
        chips={[a, kw('b', 'x')]}
        onChange={onChange}
        onClear={vi.fn()}
        labels={LABELS}
      />,
    )

    // Then
    expect(screen.getByTestId('complex-filter-keyword-editor')).toBeVisible()
  })
})

describe('다중 목록의 선택+하이라이트 링', () => {
  it('다중 서브메뉴: 선택되고 하이라이트된 행에만 ring-afds-border-focus 가 붙는다', async () => {
    // Given: 매체 KAKAO 가 선택돼 있고 목록의 첫 행(KAKAO)이 하이라이트다
    const user = userEvent.setup()
    setup({ initial: [sel('s', 'media', ['KAKAO'])] })
    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByTestId('complex-filter-field-media'))

    // Then
    const kakao = screen.getByTestId('complex-filter-option-media-KAKAO')
    const meta = screen.getByTestId('complex-filter-option-media-FACEBOOK')
    expect(kakao).toHaveAttribute('data-active', 'true')
    expect(kakao.className).toContain('ring-afds-border-focus')
    expect(meta.className).not.toContain('ring-')

    // When: 하이라이트를 선택 안 된 행으로 옮기면 링은 어디에도 없다
    await user.keyboard('{ArrowDown}')

    // Then
    expect(meta).toHaveAttribute('data-active', 'true')
    expect(meta.className).not.toContain('ring-')
    expect(kakao.className).not.toContain('ring-')
  })

  it('선택 칩 수정 팝오버: 같은 규칙으로 링이 붙는다', async () => {
    // Given
    const user = userEvent.setup()
    setup({ initial: [sel('s', 'media', ['KAKAO'])] })

    // When
    await user.click(screen.getByTestId('complex-filter-chip-edit'))

    // Then
    expect(screen.getByTestId('complex-filter-option-media-KAKAO').className).toContain(
      'ring-afds-border-focus',
    )
    expect(screen.getByTestId('complex-filter-option-media-FACEBOOK').className).not.toContain(
      'ring-',
    )
  })
})
