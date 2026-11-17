import { useState } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { ComplexFilter } from '..'
import type { ComplexFilterChip, ComplexFilterField } from '../types'
import { FIELDS, LABELS, kw, sel, setup, chipTexts } from './test-utils'

vi.mock('@turbo-project/afds/bricks', async importOriginal => ({
  ...(await importOriginal<typeof import('@turbo-project/afds/bricks')>()),
  Popover: (await import('./popover-mock')).MockPopover,
}))

describe('필드 메뉴와 서브메뉴', () => {
  it('빈 입력 클릭은 필드 메뉴를 열고 첫 행이 기본 하이라이트다(최근 검색은 지정할 때만)', () => {
    // Given
    const { input } = setup()

    // When
    fireEvent.click(input)

    // Then
    expect(screen.getAllByRole('option').map(row => row.textContent)).toEqual(['매체', '상태'])
    expect(input).toHaveAttribute('aria-activedescendant', screen.getAllByRole('option')[0]!.id)
  })

  it('빈 여백 클릭은 입력에 포커스를 주고 필드 메뉴를 연다', async () => {
    // Given
    const user = userEvent.setup()
    const { input } = setup()
    const area = input.closest('[data-testid="complex-filter-bar"]')!.querySelector('.cursor-text')!

    // When
    await user.click(area)

    // Then
    expect(input).toHaveFocus()
    expect(screen.getByTestId('complex-filter-field-media')).toBeVisible()
  })

  it('칩 위 클릭은 필드 메뉴를 열지 않는다', async () => {
    // Given
    const user = userEvent.setup()
    setup({ initial: [sel('s', 'media', ['KAKAO'])] })

    // When
    await user.click(screen.getByTestId('complex-filter-chip-edit'))

    // Then
    expect(screen.queryByTestId('complex-filter-field-media')).toBeNull()
  })

  it('↑↓ 순환, →·Enter 로 서브메뉴, ← 로 복귀(하이라이트 유지), 입력 포커스는 유지된다', async () => {
    // Given
    const user = userEvent.setup()
    const { input } = setup()
    await user.click(input)

    // When: 위로 순환해 마지막(상태)을 연다
    await user.keyboard('{ArrowUp}{ArrowRight}')

    // Then
    expect(input).toHaveFocus()
    expect(screen.getByRole('listbox', { name: '상태' })).toBeVisible()
    expect(screen.getAllByRole('option').map(row => row.textContent)).toContain('실행 대기')

    // When
    await user.keyboard('{ArrowLeft}')

    // Then
    expect(screen.queryByRole('listbox', { name: '상태' })).toBeNull()
    expect(input).toHaveAttribute('aria-activedescendant', expect.stringMatching(/-1$/))
  })

  it('단일 선택 서브메뉴는 고르는 즉시 적용되고 닫히며 입력 포커스가 남는다', async () => {
    // Given
    const user = userEvent.setup()
    const { input } = setup()
    await user.click(input)
    await user.keyboard('{ArrowDown}{Enter}{ArrowDown}{Enter}')

    // Then
    expect(chipTexts()).toEqual(['상태실행 완료'])
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(input).toHaveFocus()
  })

  it('다중 선택 값 목록은 토글해도 적용 전에는 칩이 바뀌지 않고 적용하면 생긴다', async () => {
    // Given
    const user = userEvent.setup()
    const { input, onChange } = setup()
    await user.click(input)
    await user.click(screen.getByTestId('complex-filter-field-media'))

    // When
    await user.click(screen.getByTestId('complex-filter-option-media-FACEBOOK'))
    await user.click(screen.getByTestId('complex-filter-option-media-KAKAO'))

    // Then
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByTestId('complex-filter-option-media-KAKAO')).toHaveAttribute(
      'aria-selected',
      'true',
    )

    // When
    await user.click(screen.getByTestId('complex-filter-apply'))

    // Then: 정의 순서로 정렬
    expect(chipTexts()).toEqual(['매체Kakao, Meta'])
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(input).toHaveFocus()
  })

  it('취소는 변경을 버리고, 0개 적용은 기존 칩을 지운다', async () => {
    // Given
    const user = userEvent.setup()
    setup({ initial: [sel('s', 'media', ['KAKAO'])] })
    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByTestId('complex-filter-field-media'))
    await user.click(screen.getByTestId('complex-filter-option-media-KAKAO'))

    // When
    await user.click(screen.getByTestId('complex-filter-cancel'))

    // Then
    expect(chipTexts()).toEqual(['매체Kakao'])

    // When
    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByTestId('complex-filter-field-media'))
    await user.click(screen.getByTestId('complex-filter-option-media-KAKAO'))
    await user.click(screen.getByTestId('complex-filter-apply'))

    // Then
    expect(chipTexts()).toEqual([])
  })

  it('키보드: 목록에서 Space 토글, Tab 으로 취소→적용, Shift+Tab 복귀, Enter 로 적용', async () => {
    // Given
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('combobox'))
    await user.keyboard('{Enter}')
    const listbox = screen.getByRole('listbox', { name: '매체' })
    expect(listbox).toHaveFocus()

    // When
    await user.keyboard(' {ArrowDown} ')

    // Then
    expect(
      within(listbox)
        .getAllByRole('option')
        .map(o => o.getAttribute('aria-selected')),
    ).toEqual(['true', 'true'])

    // When
    await user.tab()
    expect(screen.getByTestId('complex-filter-cancel')).toHaveFocus()
    await user.tab()
    expect(screen.getByTestId('complex-filter-apply')).toHaveFocus()
    await user.tab({ shift: true })
    await user.tab({ shift: true })
    expect(listbox).toHaveFocus()
    await user.tab()
    await user.tab()
    await user.keyboard('{Enter}')

    // Then
    expect(chipTexts()).toEqual(['매체Kakao, Meta'])
  })

  it('다중 선택 목록의 aria: listbox 가 다중 선택이고 option 이 선택 상태를 가진다', async () => {
    // Given
    const user = userEvent.setup()
    setup({ initial: [sel('s', 'media', ['FACEBOOK'])] })
    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByTestId('complex-filter-field-media'))

    // Then
    const listbox = screen.getByRole('listbox', { name: '매체' })
    expect(listbox).toHaveAttribute('aria-multiselectable', 'true')
    expect(
      within(listbox)
        .getAllByRole('option')
        .map(o => o.getAttribute('aria-selected')),
    ).toEqual(['false', 'true'])
  })
})

describe('회귀: 팝업 전환·하이라이트·포털 클릭 (M-1~M-3)', () => {
  const isActive = (testId: string) => screen.getByTestId(testId).hasAttribute('data-active')
  const openStatusSubmenu = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole('combobox'))
    await user.keyboard('{ArrowDown}{ArrowRight}')
  }

  it('M-1: 단일 선택 서브메뉴가 열린 채 다른 필드 행을 누르면 그 필드의 서브메뉴로 전환되고 값이 적용되지 않는다', async () => {
    // Given: 상태(단일) 서브메뉴가 열려 있다
    const user = userEvent.setup()
    const { onChange } = setup()
    await openStatusSubmenu(user)
    expect(screen.getByTestId('complex-filter-option-status-pending')).toBeVisible()

    // When
    await user.click(screen.getByTestId('complex-filter-field-media'))

    // Then
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByRole('listbox', { name: '매체' })).toBeVisible()
    expect(screen.queryByTestId('complex-filter-option-status-pending')).toBeNull()
    expect(isActive('complex-filter-field-media')).toBe(true)
  })

  it('M-1: 다중 선택 서브메뉴가 열린 채 다른 필드 행을 눌러도 무반응이 아니라 전환된다', async () => {
    // Given: 매체(다중) 서브메뉴가 열려 있다
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByTestId('complex-filter-field-media'))
    expect(screen.getByRole('listbox', { name: '매체' })).toBeVisible()

    // When
    await user.click(screen.getByTestId('complex-filter-field-status'))

    // Then
    expect(screen.getByTestId('complex-filter-option-status-done')).toBeVisible()
    expect(isActive('complex-filter-field-status')).toBe(true)
  })

  it('M-2: 서브메뉴가 열려 있는 동안 부모 하이라이트는 서브메뉴를 연 행에 고정된다', async () => {
    // Given
    const user = userEvent.setup()
    setup()
    await openStatusSubmenu(user)
    expect(isActive('complex-filter-field-status')).toBe(true)

    // When: 서브메뉴 안에서 ↓ 로 이동
    await user.keyboard('{ArrowDown}')

    // Then
    expect(isActive('complex-filter-field-status')).toBe(true)
    expect(isActive('complex-filter-field-media')).toBe(false)
    expect(isActive('complex-filter-option-status-done')).toBe(true)
  })

  it('M-2: 부모 행 hover 는 서브메뉴 하이라이트를, 서브메뉴 hover 는 부모 하이라이트를 바꾸지 않는다', async () => {
    // Given
    const user = userEvent.setup()
    setup()
    await openStatusSubmenu(user)
    await user.keyboard('{ArrowDown}')

    // When
    fireEvent.mouseEnter(screen.getByTestId('complex-filter-field-media'))

    // Then
    expect(isActive('complex-filter-option-status-done')).toBe(true)

    // When
    fireEvent.mouseEnter(screen.getByTestId('complex-filter-option-status-pending'))

    // Then
    expect(isActive('complex-filter-field-status')).toBe(true)
    expect(isActive('complex-filter-field-media')).toBe(false)
    expect(isActive('complex-filter-option-status-pending')).toBe(true)
  })

  it('M-3: 키워드 칩 수정 팝오버의 제목을 눌러도 팝오버가 닫히지 않고 필드 메뉴가 열리지 않는다', async () => {
    // Given
    const user = userEvent.setup()
    setup({ initial: [kw('k', '마그')] })
    await user.click(screen.getByTestId('complex-filter-chip-edit'))
    const editor = screen.getByTestId('complex-filter-keyword-editor')

    // When
    await user.click(within(editor).getByText('이름에'))

    // Then
    expect(screen.getByTestId('complex-filter-keyword-editor')).toBeVisible()
    expect(screen.queryByTestId('complex-filter-field-media')).toBeNull()
  })

  it('M-3: 선택 칩 수정 팝오버의 제목을 눌러도 고른 값이 유지된다', async () => {
    // Given
    const user = userEvent.setup()
    setup({ initial: [sel('s', 'media', ['KAKAO'])] })
    await user.click(screen.getByTestId('complex-filter-chip-edit'))
    await user.click(screen.getByTestId('complex-filter-option-media-FACEBOOK'))

    // When
    await user.click(within(screen.getByTestId('complex-filter-values-editor')).getByText('매체'))

    // Then
    expect(screen.getByTestId('complex-filter-option-media-FACEBOOK')).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.queryByTestId('complex-filter-field-media')).toBeNull()
  })

  it('M-3: 다중 서브메뉴의 빈 패딩 영역을 눌러도 닫히지 않고 토글한 값이 남는다', async () => {
    // Given
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByTestId('complex-filter-field-media'))
    await user.click(screen.getByTestId('complex-filter-option-media-KAKAO'))

    // When
    await user.click(screen.getByTestId('complex-filter-values-editor').firstElementChild!)

    // Then
    expect(screen.getByTestId('complex-filter-option-media-KAKAO')).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  it('M-3: 필드 메뉴 목록의 빈 패딩을 눌러도 하이라이트가 처음으로 돌아가지 않는다', async () => {
    // Given
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('combobox'))
    await user.keyboard('{ArrowDown}')
    expect(isActive('complex-filter-field-status')).toBe(true)

    // When
    await user.click(screen.getByRole('listbox', { name: '필터 목록' }))

    // Then
    expect(isActive('complex-filter-field-status')).toBe(true)
  })
})

describe('운영센터 동작: Esc 전체 닫힘·부모 카드 클릭', () => {
  const openMediaSub = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByTestId('complex-filter-field-media'))
  }

  it('Esc: 다중 선택 서브메뉴(포커스가 목록에 있음)에서도 필드 메뉴까지 전체가 닫히고 포커스는 입력으로 간다', async () => {
    // Given
    const user = userEvent.setup()
    const { input } = setup()
    await openMediaSub(user)
    expect(screen.getByRole('listbox', { name: '매체' })).toHaveFocus()

    // When
    await user.keyboard('{Escape}')

    // Then
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(screen.queryByTestId('complex-filter-field-media')).toBeNull()
    expect(input).toHaveFocus()
  })

  it('Esc: 단일 선택 서브메뉴에서도 전체가 닫힌다', async () => {
    // Given
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('combobox'))
    await user.keyboard('{ArrowDown}{ArrowRight}')
    expect(screen.getByTestId('complex-filter-option-status-done')).toBeVisible()

    // When
    await user.keyboard('{Escape}')

    // Then
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('← 는 Esc 와 달리 필드 메뉴로만 복귀하고 포커스는 입력으로 돌아온다', async () => {
    // Given
    const user = userEvent.setup()
    const { input } = setup()
    await openMediaSub(user)

    // When
    await user.keyboard('{ArrowLeft}')

    // Then: 포커스가 body 로 떨어지면 이후 ↓·Esc 가 무반응이다
    expect(input).toHaveFocus()
    expect(screen.getByTestId('complex-filter-field-media')).toBeVisible()
    await user.keyboard('{ArrowDown}')
    expect(screen.getByTestId('complex-filter-field-status')).toHaveAttribute('data-active', 'true')
  })

  it('부모 필드 메뉴 카드의 빈 곳을 눌러도 서브메뉴가 열린 채 유지되고 토글해 둔 값도 남는다', async () => {
    // Given
    const user = userEvent.setup()
    setup()
    await openMediaSub(user)
    await user.click(screen.getByTestId('complex-filter-option-media-KAKAO'))

    // When: 부모 카드 안쪽(listbox 패딩·카드 바닥)을 누른다
    await user.click(screen.getByRole('listbox', { name: '필터 목록' }))
    await user.click(
      screen.getByTestId('complex-filter-field-media').closest('[data-slot="popover-content"]')!,
    )

    // Then
    expect(screen.getByRole('listbox', { name: '매체' })).toBeVisible()
    expect(screen.getByTestId('complex-filter-option-media-KAKAO')).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  it('다중 선택 서브메뉴에서 다른 행으로 전환하면 포커스가 입력으로 돌아와 ↓ 가 새 서브메뉴를 움직인다', async () => {
    // Given: 매체(다중) 목록이 포커스를 쥐고 있다
    const user = userEvent.setup()
    const { input } = setup()
    await openMediaSub(user)
    expect(screen.getByRole('listbox', { name: '매체' })).toHaveFocus()

    // When: 상태(단일) 행으로 전환 — 매체 목록이 언마운트된다
    await user.click(screen.getByTestId('complex-filter-field-status'))

    // Then: 포커스가 body 로 떨어지면 ↓ 가 무반응이다
    expect(input).toHaveFocus()
    await user.keyboard('{ArrowDown}')
    expect(screen.getByTestId('complex-filter-option-status-done')).toHaveAttribute(
      'data-active',
      'true',
    )
  })

  it('진짜 바깥(페이지)을 누르면 서브메뉴와 필드 메뉴가 모두 닫힌다', async () => {
    // Given
    const user = userEvent.setup()
    setup()
    await openMediaSub(user)

    // When
    await user.click(screen.getByRole('button', { name: '다음 요소' }))

    // Then
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('Tab 으로 「취소」에 간 뒤 서브메뉴 옵션을 누르면 포커스가 목록으로 돌아와 ↓ 가 목록을 움직인다', async () => {
    // Given
    const user = userEvent.setup()
    setup()
    await openMediaSub(user)
    await user.tab()
    expect(screen.getByTestId('complex-filter-cancel')).toHaveFocus()

    // When
    await user.click(screen.getByTestId('complex-filter-option-media-FACEBOOK'))

    // Then
    const listbox = screen.getByRole('listbox', { name: '매체' })
    expect(listbox).toHaveFocus()
    // 클릭한 옵션(FACEBOOK, 2번째)에서 ↓ 하면 순환해 첫 옵션으로 간다 — 포커스가 목록에 있어야 움직인다
    await user.keyboard('{ArrowDown}')
    expect(screen.getByTestId('complex-filter-option-media-KAKAO')).toHaveAttribute(
      'data-active',
      'true',
    )
  })
})

describe('정렬 props 전달', () => {
  const popupAttrs = (inner: HTMLElement) => {
    const popup = inner.closest<HTMLElement>('[data-slot="popover-content"]')!
    return {
      align: popup.getAttribute('data-align'),
      alignOffset: popup.getAttribute('data-align-offset'),
      side: popup.getAttribute('data-side'),
      sideOffset: popup.getAttribute('data-side-offset'),
    }
  }

  it('칩 수정: align=start, side=bottom (칩 좌측 끝에 맞춘다)', async () => {
    const user = userEvent.setup()
    setup({ initial: [kw('a', 'a')] })
    await user.click(screen.getByTestId('complex-filter-chip-edit'))
    expect(popupAttrs(screen.getByTestId('complex-filter-keyword-editor'))).toMatchObject({
      align: 'start',
      side: 'bottom',
    })
  })

  it('필드 메뉴: align=start·alignOffset=-10·sideOffset=5, 서브메뉴: side=right·align=start·sideOffset=8', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('combobox'))
    expect(popupAttrs(screen.getByTestId('complex-filter-field-media'))).toMatchObject({
      align: 'start',
      alignOffset: '-10',
      side: 'bottom',
      sideOffset: '5',
    })
    await user.click(screen.getByTestId('complex-filter-field-media'))
    expect(popupAttrs(screen.getByTestId('complex-filter-apply'))).toMatchObject({
      align: 'start',
      side: 'right',
      sideOffset: '8',
    })
  })

  it('모든 조건 만족: align=start·sideOffset=5', async () => {
    const user = userEvent.setup()
    setup({
      matchMode: {
        value: 'all',
        options: [{ value: 'all', label: '모든 조건 만족' }],
        onChange: vi.fn(),
        ariaLabel: '결합 방식',
      },
    })
    await user.click(screen.getByTestId('complex-filter-match-mode'))
    expect(popupAttrs(screen.getByTestId('complex-filter-match-all'))).toMatchObject({
      align: 'start',
      side: 'bottom',
      sideOffset: '5',
    })
  })
})

describe('빈 목록은 열지 않는다', () => {
  const setupWith = (fields: ComplexFilterField[]) => {
    function Harness() {
      const [chips, setChips] = useState<ComplexFilterChip[]>([])
      return (
        <ComplexFilter.Root
          fields={fields}
          chips={chips}
          onChange={setChips}
          onClear={() => setChips([])}
          labels={LABELS}
        />
      )
    }
    render(<Harness />)
    return screen.getByRole('combobox')
  }

  it('선택 필드가 없으면 빈 입력을 눌러도 필드 메뉴(빈 카드)가 열리지 않는다', async () => {
    // Given
    const user = userEvent.setup()
    const input = setupWith([FIELDS[0]!, FIELDS[1]!])

    // When
    await user.click(input)

    // Then
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(input).toHaveAttribute('aria-expanded', 'false')
  })

  it('키워드 필드가 없으면 글자를 입력해도 추천 목록(빈 카드)이 열리지 않는다', async () => {
    // Given
    const user = userEvent.setup()
    const input = setupWith([FIELDS[2]!, FIELDS[3]!])

    // When
    await user.type(input, '값')

    // Then
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(input).toHaveAttribute('aria-expanded', 'false')
  })

  it.each([
    ['Enter', '{Enter}'],
    ['→', '{ArrowRight}'],
  ])(
    '선택 필드가 없는 구성에서 %s 로도 빈 카드가 다시 열리지 않고 ARIA 가 열린 채 남지 않는다',
    async (_name, keys) => {
      // Given
      const user = userEvent.setup()
      const input = setupWith([FIELDS[0]!, FIELDS[1]!])
      await user.click(input)

      // When
      await user.keyboard(keys)

      // Then
      expect(screen.queryByRole('listbox')).toBeNull()
      expect(input).toHaveAttribute('aria-expanded', 'false')
      expect(input).not.toHaveAttribute('aria-activedescendant')
    },
  )

  it.each([
    ['Enter', '{Enter}'],
    ['→', '{ArrowRight}'],
  ])('키워드 필드가 없는 구성에서 글자를 입력한 뒤 %s 를 눌러도 같다', async (_name, keys) => {
    // Given
    const user = userEvent.setup()
    const input = setupWith([FIELDS[2]!, FIELDS[3]!])
    await user.type(input, '값')

    // When
    await user.keyboard(keys)

    // Then
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(input).toHaveAttribute('aria-expanded', 'false')
    expect(input).not.toHaveAttribute('aria-activedescendant')
  })

  it('열린 팝업이 없으면 Esc 를 가로채지 않는다(preventDefault 안 함)', () => {
    // Given
    const input = setupWith([FIELDS[0]!, FIELDS[1]!])
    fireEvent.click(input)

    // When
    const notPrevented = fireEvent.keyDown(input, { key: 'Escape' })

    // Then
    expect(notPrevented).toBe(true)
  })
})

describe('선택 서브메뉴 vs 칩 수정 팝오버', () => {
  const popupOf = (element: HTMLElement) =>
    element.closest('[data-complex-filter-popup]') as HTMLElement

  it('다중 선택 서브메뉴는 제목 없이 폭 180 이고 listbox 이름은 필드 라벨로 남는다', async () => {
    // Given
    const user = userEvent.setup()
    const { input } = setup()

    // When
    await user.click(input)
    await user.click(screen.getByTestId('complex-filter-field-media'))

    // Then
    const list = screen.getByRole('listbox', { name: '매체' })
    const card = popupOf(list)
    expect(card.className).toContain('w-[180px]')
    expect(within(card).queryByText('매체')).toBeNull()
  })

  it('단일 선택·최근 검색 서브메뉴도 폭 180 이다', async () => {
    // Given
    const user = userEvent.setup()
    const { input } = setup({
      recentSearches: { items: ['a'], onAdd: vi.fn(), onRemove: vi.fn() },
    })
    await user.click(input)

    // When
    await user.click(screen.getByTestId('complex-filter-field-status'))

    // Then
    expect(popupOf(screen.getByTestId('complex-filter-option-status-pending')).className).toContain(
      'w-[180px]',
    )
    await user.click(screen.getByTestId('complex-filter-recent'))
    expect(popupOf(screen.getByTestId('complex-filter-recent-item')).className).toContain(
      'w-[180px]',
    )
  })

  it('선택 칩 수정 팝오버는 제목이 있고 폭 200 이다', async () => {
    // Given
    const user = userEvent.setup()
    setup({
      initial: [{ id: 's1', kind: 'select', fieldKey: 'media', values: ['KAKAO'] }],
    })

    // When
    await user.click(screen.getByTestId('complex-filter-chip-edit'))

    // Then
    const apply = screen.getByTestId('complex-filter-apply')
    const card = popupOf(apply)
    expect(card.className).toContain('w-[200px]')
    expect(within(card).getByText('매체')).toBeInTheDocument()
  })
})

describe('팝업의 접근성 이름', () => {
  it('서브메뉴 팝업은 필드 라벨을, 칩 수정 팝업도 필드 라벨을 aria-label 로 갖는다', async () => {
    // Given
    const user = userEvent.setup()
    const { input } = setup({ initial: [kw('k1', '원래')] })

    // When
    await user.click(input)
    await user.click(screen.getByTestId('complex-filter-field-media'))

    // Then
    const sub = screen.getByTestId('complex-filter-apply').closest('[data-complex-filter-popup]')
    expect(sub).toHaveAttribute('aria-label', '매체')

    await user.keyboard('{Escape}')
    await user.click(screen.getByTestId('complex-filter-chip-edit'))
    const edit = screen
      .getByTestId('complex-filter-keyword-editor')
      .closest('[data-complex-filter-popup]')
    expect(edit).toHaveAttribute('aria-label', '이름')
  })
})

describe('긴 목록의 스크롤', () => {
  it('팝업은 가용 높이로 제한되고 값 목록은 ScrollArea 안에 있다(다중 서브메뉴·단일 서브메뉴·칩 수정)', async () => {
    // Given
    const user = userEvent.setup()
    const { input } = setup({ initial: [sel('s1', 'media', ['KAKAO'])] })

    // When — 다중 서브메뉴
    await user.click(input)
    await user.click(screen.getByTestId('complex-filter-field-media'))

    // Then
    const multi = screen.getByTestId('complex-filter-values-editor')
    expect(multi.querySelector('[data-slot="scroll-area"] [role="listbox"]')).not.toBeNull()
    expect(multi.closest('[data-slot="popover-content"]')!.className).toContain(
      'max-h-[min(var(--available-height),430px)]',
    )

    // When — 단일 서브메뉴
    await user.click(screen.getByTestId('complex-filter-field-status'))
    const single = screen
      .getAllByRole('listbox')
      .find(el => el.getAttribute('aria-label') === '상태')!
    expect(single.closest('[data-slot="scroll-area"]')).not.toBeNull()
  })
  it('칩 수정 팝업도 가용 높이로 제한되고 값 목록이 ScrollArea 안에 있으며 감싸는 요소가 높이 제약을 전달한다', async () => {
    // Given
    const user = userEvent.setup()
    setup({ initial: [sel('s1', 'media', ['KAKAO'])] })

    // When
    await user.click(screen.getByTestId('complex-filter-chip-edit'))

    // Then
    const editor = screen.getByTestId('complex-filter-values-editor')
    const popup = editor.closest('[data-slot="popover-content"]') as HTMLElement
    expect(popup.className).toContain('max-h-[min(var(--available-height),430px)]')
    expect(editor.querySelector('[data-slot="scroll-area"] [role="listbox"]')).not.toBeNull()
    // 팝업 → (감싸는 div) → 편집기: 모두 flex 열이어야 안쪽 ScrollArea 가 높이를 받는다
    const wrapper = editor.parentElement as HTMLElement
    expect(wrapper.className).toContain('flex-col')
    expect(wrapper.className).toContain('min-h-0')
    expect(editor.className).toContain('min-h-0')
  })

  it('최근 검색 서브메뉴 목록도 ScrollArea 안에 있다', async () => {
    // Given
    const user = userEvent.setup()
    const { input } = setup({
      recentSearches: { items: ['a', 'b'], onAdd: vi.fn(), onRemove: vi.fn() },
    })

    // When
    await user.click(input)
    await user.click(screen.getByTestId('complex-filter-recent'))

    // Then
    const list = screen
      .getAllByRole('listbox')
      .find(el => el.getAttribute('aria-label') === '최근 검색')!
    expect(list.closest('[data-slot="scroll-area"]')).not.toBeNull()
  })

  it('하이라이트가 바뀔 때만 해당 행을 스크롤 영역 안으로 끌어오고 페이지는 스크롤하지 않는다', async () => {
    // Given — jsdom 은 배치를 계산하지 않으므로 뷰포트 0~100, 둘째 행 120~154 로 준다
    const user = userEvent.setup()
    const pageScroll = vi.spyOn(Element.prototype, 'scrollIntoView')
    const rects = vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: Element,
    ) {
      const rect = (top: number, bottom: number) => ({ top, bottom }) as DOMRect
      if (this.getAttribute('data-slot') === 'scroll-area-viewport') return rect(0, 100)
      if (this.getAttribute('data-testid') === 'complex-filter-option-media-FACEBOOK') {
        return rect(120, 154)
      }
      return rect(0, 34)
    })
    const { input } = setup()
    await user.click(input)
    await user.click(screen.getByTestId('complex-filter-field-media'))
    const viewport = screen
      .getByTestId('complex-filter-values-editor')
      .querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement
    viewport.scrollTop = 0

    // When
    await user.keyboard('{ArrowDown}')

    // Then
    expect(viewport.scrollTop).toBe(54)
    expect(pageScroll).not.toHaveBeenCalled()
    rects.mockRestore()
    pageScroll.mockRestore()
  })
})
