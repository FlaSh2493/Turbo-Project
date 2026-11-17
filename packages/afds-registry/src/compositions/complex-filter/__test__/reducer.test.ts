import { describe, expect, it } from 'vitest'
import { controllerReducer, initialState, liveUi } from '../reducer'
import type { ComplexFilterChip } from '../types'
import type { ControllerAction, ControllerState } from '../reducer'

const CHIP: ComplexFilterChip = {
  id: 'c1',
  kind: 'select',
  fieldKey: 'f',
  values: ['a'],
}
const run = (actions: ControllerAction[], from: ControllerState = initialState) =>
  actions.reduce(controllerReducer, from)

describe('controllerReducer', () => {
  it('입력이 비었을 때 open 은 필드 메뉴를, 값이 있으면 추천 목록을 연다', () => {
    expect(run([{ type: 'open' }]).ui).toEqual({ type: 'menu', index: 0 })
    expect(run([{ type: 'draft', value: 'a' }, { type: 'close' }, { type: 'open' }]).ui).toEqual({
      type: 'suggest',
      index: 0,
    })
  })

  it('글자를 치면 추천 목록이 열리고, 같은 목록에서 더 쳐도 하이라이트는 유지된다', () => {
    // When
    const state = run([
      { type: 'draft', value: 'a' },
      { type: 'move', delta: 1, count: 3 },
      { type: 'draft', value: 'ab' },
    ])

    // Then
    expect(state.ui).toEqual({ type: 'suggest', index: 1 })
  })

  it('추천 목록에서 입력을 지우면 필드 메뉴로 바뀌며 하이라이트가 처음으로 돌아간다', () => {
    // When
    const state = run([
      { type: 'draft', value: 'a' },
      { type: 'move', delta: 1, count: 3 },
      { type: 'draft', value: '  ' },
    ])

    // Then
    expect(state.ui).toEqual({ type: 'menu', index: 0 })
  })

  it('필드 메뉴에서 글자를 치면 추천 목록으로 바뀌며 하이라이트가 처음이다', () => {
    const state = run([
      { type: 'open' },
      { type: 'move', delta: 1, count: 3 },
      { type: 'draft', value: 'a' },
    ])
    expect(state.ui).toEqual({ type: 'suggest', index: 0 })
  })

  it('빈 입력에서 글자를 지워도 닫힌 상태는 닫힌 채다', () => {
    expect(run([{ type: 'draft', value: '' }]).ui).toEqual({ type: 'closed' })
  })

  it.each([
    [1, 0, 3, 1],
    [1, 2, 3, 0],
    [-1, 0, 3, 2],
    [-1, 1, 3, 0],
  ] as const)(
    'move %s 는 index %s 에서 count %s 로 순환해 %s 이 된다',
    (delta, from, count, expected) => {
      // Given
      const state: ControllerState = {
        draft: '',
        ui: { type: 'menu', index: from },
      }

      // When
      const next = controllerReducer(state, { type: 'move', delta, count })

      // Then
      expect(next.ui).toEqual({ type: 'menu', index: expected })
    },
  )

  it('열린 목록이 없으면 move·hover 는 상태를 바꾸지 않는다', () => {
    expect(controllerReducer(initialState, { type: 'move', delta: 1, count: 3 })).toBe(initialState)
    expect(
      controllerReducer(initialState, {
        type: 'hover',
        list: 'menu',
        index: 2,
        count: 3,
      }),
    ).toBe(initialState)
  })

  it('서브메뉴에 들어가면 index 0 이고, 나오면 부모 메뉴 하이라이트가 유지된다', () => {
    // When
    const inSub = run([{ type: 'open' }, { type: 'enterSub', menuIndex: 2 }])
    const back = controllerReducer(inSub, { type: 'leaveSub' })

    // Then
    expect(inSub.ui).toEqual({ type: 'submenu', menuIndex: 2, subIndex: 0 })
    expect(back.ui).toEqual({ type: 'menu', index: 2 })
  })

  it('서브메뉴 밖에서 leaveSub 는 무시한다', () => {
    expect(controllerReducer(initialState, { type: 'leaveSub' })).toBe(initialState)
  })

  it('칩 수정은 다른 팝업을 대체하고 close 로 닫힌다(팝업은 늘 하나)', () => {
    // When
    const editing = run([{ type: 'open' }, { type: 'edit', chipId: 'c1', chip: CHIP }])

    // Then
    expect(editing.ui).toEqual({ type: 'edit', chipId: 'c1', chip: CHIP })
    expect(controllerReducer(editing, { type: 'close' }).ui).toEqual({
      type: 'closed',
    })
  })

  it('fill 은 입력을 채우고 추천 모드로, afterKeyword 는 입력을 비우고 필드 메뉴로 간다', () => {
    expect(run([{ type: 'fill', value: '최근' }])).toEqual({
      draft: '최근',
      ui: { type: 'suggest', index: 0 },
    })
    expect(run([{ type: 'draft', value: 'abc' }, { type: 'afterKeyword' }])).toEqual({
      draft: '',
      ui: { type: 'menu', index: 0 },
    })
  })

  it('close 는 입력 내용을 유지한다', () => {
    expect(run([{ type: 'draft', value: 'abc' }, { type: 'close' }]).draft).toBe('abc')
  })
})

describe('controllerReducer — 부모/서브메뉴 하이라이트 분리 (M-2)', () => {
  const inSub = () => run([{ type: 'open' }, { type: 'enterSub', menuIndex: 2 }])

  it('서브메뉴 안의 ↑↓ 는 subIndex 만 바꾸고 부모 menuIndex 는 그대로다', () => {
    // When
    const moved = controllerReducer(inSub(), {
      type: 'move',
      delta: 1,
      count: 4,
    })

    // Then
    expect(moved.ui).toEqual({ type: 'submenu', menuIndex: 2, subIndex: 1 })
  })

  it('서브메뉴 hover 는 subIndex 만, 부모 행 hover 는 서브메뉴가 열려 있는 동안 무시한다', () => {
    // When
    const subHover = controllerReducer(inSub(), {
      type: 'hover',
      list: 'sub',
      index: 3,
      count: 4,
    })
    const menuHover = controllerReducer(subHover, {
      type: 'hover',
      list: 'menu',
      index: 0,
      count: 3,
    })

    // Then
    expect(subHover.ui).toEqual({ type: 'submenu', menuIndex: 2, subIndex: 3 })
    expect(menuHover).toBe(subHover)
  })

  it('부모 메뉴만 열려 있을 때 menu hover 는 menu index 를 바꾼다', () => {
    const state = controllerReducer(run([{ type: 'open' }]), {
      type: 'hover',
      list: 'menu',
      index: 1,
      count: 3,
    })
    expect(state.ui).toEqual({ type: 'menu', index: 1 })
  })

  it('서브메뉴가 열린 채 다른 행을 고르면 그 행의 서브메뉴로 전환되며 subIndex 는 0 이다', () => {
    // Given
    const moved = controllerReducer(inSub(), {
      type: 'move',
      delta: 1,
      count: 4,
    })

    // When
    const switched = controllerReducer(moved, {
      type: 'enterSub',
      menuIndex: 0,
    })

    // Then
    expect(switched.ui).toEqual({ type: 'submenu', menuIndex: 0, subIndex: 0 })
  })
})

describe('controllerReducer — hover 범위', () => {
  it.each([
    [-3, 0],
    [9, 2],
    [1, 1],
  ])('hover index %s 는 목록 범위 안(%s)으로 클램프된다', (index, expected) => {
    // Given
    const state = run([{ type: 'draft', value: 'a' }])

    // When
    const next = controllerReducer(state, {
      type: 'hover',
      list: 'suggest',
      index,
      count: 3,
    })

    // Then
    expect(next.ui).toEqual({ type: 'suggest', index: expected })
  })
})

describe('liveUi — 수정 상태는 그 칩 객체가 목록에 있을 때만 유효하다', () => {
  const editing = controllerReducer(initialState, {
    type: 'edit',
    chipId: 'c1',
    chip: CHIP,
  }).ui

  it('칩이 그대로 있으면 수정 상태를 유지한다', () => {
    expect(liveUi(editing, [CHIP])).toBe(editing)
  })

  it('칩이 사라지면 닫힌 것으로 풀이한다', () => {
    expect(liveUi(editing, [])).toEqual({ type: 'closed' })
  })

  it('같은 id 의 새 칩(다른 객체)이 생겨도 되살아나지 않는다', () => {
    expect(liveUi(editing, [{ ...CHIP }])).toEqual({ type: 'closed' })
  })

  it('수정 상태가 아니면 그대로 돌려준다', () => {
    const menu = { type: 'menu', index: 1 } as const
    expect(liveUi(menu, [])).toBe(menu)
  })
})
