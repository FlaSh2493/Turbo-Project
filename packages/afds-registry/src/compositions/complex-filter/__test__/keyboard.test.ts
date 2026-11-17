import { describe, expect, it } from 'vitest'
import { isSaveShortcut, resolveKey, type KeyContext } from '../keyboard'

const ctx = (overrides: Partial<KeyContext> = {}): KeyContext => ({
  ui: { type: 'closed' },
  blank: true,
  empty: true,
  recentSub: false,
  ...overrides,
})
const CHIP = { id: 'c', kind: 'select' as const, fieldKey: 'f', values: [] }
const menu: KeyContext['ui'] = { type: 'menu', index: 0 }
const sub: KeyContext['ui'] = { type: 'submenu', menuIndex: 0, subIndex: 0 }
const suggest: KeyContext['ui'] = { type: 'suggest', index: 0 }

describe('resolveKey', () => {
  it('Enter: 목록이 열려 있으면 활성화, 닫혀 있고 입력이 있으면 첫 키워드, 비었으면 무시', () => {
    expect(resolveKey('Enter', ctx({ ui: menu }))).toEqual({
      action: { type: 'activate' },
      preventDefault: true,
    })
    expect(resolveKey('Enter', ctx({ blank: false, empty: false }))).toEqual({
      action: { type: 'addFirstKeyword' },
      preventDefault: true,
    })
    expect(resolveKey('Enter', ctx())).toBeUndefined()
  })

  it.each([
    ['ArrowDown', 1],
    ['ArrowUp', -1],
  ] as const)('%s: 열린 목록이면 이동(%s), 닫혀 있으면 연다', (key, delta) => {
    expect(resolveKey(key, ctx({ ui: suggest }))?.action).toEqual({
      type: 'move',
      delta,
    })
    expect(resolveKey(key, ctx({ ui: sub }))?.action).toEqual({
      type: 'move',
      delta,
    })
    expect(resolveKey(key, ctx())?.action).toEqual({ type: 'open' })
  })

  it('→ 는 필드 메뉴에서만 서브메뉴로, ← 는 서브메뉴에서만 복귀한다', () => {
    expect(resolveKey('ArrowRight', ctx({ ui: menu }))?.action).toEqual({
      type: 'enterSub',
    })
    expect(resolveKey('ArrowRight', ctx({ ui: suggest }))).toBeUndefined()
    expect(resolveKey('ArrowLeft', ctx({ ui: sub }))?.action).toEqual({
      type: 'leaveSub',
    })
    expect(resolveKey('ArrowLeft', ctx({ ui: menu }))).toBeUndefined()
  })

  it('Esc 는 목록이 열려 있을 때만 닫는다(칩 수정 팝오버는 팝오버가 처리한다)', () => {
    expect(resolveKey('Escape', ctx({ ui: menu }))?.action).toEqual({
      type: 'close',
    })
    expect(
      resolveKey('Escape', ctx({ ui: { type: 'edit', chipId: 'c', chip: CHIP } })),
    ).toBeUndefined()
    expect(resolveKey('Escape', ctx())).toBeUndefined()
  })

  it('Delete 는 최근 검색 서브메뉴에서만 항목을 지운다', () => {
    expect(resolveKey('Delete', ctx({ ui: sub, recentSub: true }))?.action).toEqual({
      type: 'removeRecent',
    })
    expect(resolveKey('Delete', ctx({ ui: sub }))).toBeUndefined()
  })

  it('Backspace 는 입력이 정확히 비었을 때만 마지막 칩을 지우고 기본 동작은 막지 않는다', () => {
    expect(resolveKey('Backspace', ctx())).toEqual({
      action: { type: 'removeLastChip' },
      preventDefault: false,
    })
    expect(resolveKey('Backspace', ctx({ empty: false }))).toBeUndefined()
  })

  it('공백만 있는 입력(trim 하면 빈)에서 Backspace 는 칩을 지우지 않는다', () => {
    expect(resolveKey('Backspace', ctx({ blank: true, empty: false }))).toBeUndefined()
  })

  it('관련 없는 키는 무시한다', () => {
    expect(resolveKey('a', ctx({ ui: menu }))).toBeUndefined()
    expect(resolveKey('Tab', ctx({ ui: menu }))).toBeUndefined()
  })
})

describe('isSaveShortcut', () => {
  const key = (init: Partial<KeyboardEventInit> = {}) => ({
    key: 'Enter',
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    isComposing: false,
    ...init,
  })

  it.each([
    ['Cmd+Enter', { metaKey: true }],
    ['Ctrl+Enter', { ctrlKey: true }],
    ['Cmd+Ctrl+Enter', { metaKey: true, ctrlKey: true }],
  ])('%s 는 저장 단축키다', (_name, init) => {
    expect(isSaveShortcut(key(init))).toBe(true)
  })

  it.each([
    ['수정키 없는 Enter', {}],
    ['Shift+Cmd+Enter', { metaKey: true, shiftKey: true }],
    ['Alt+Ctrl+Enter', { ctrlKey: true, altKey: true }],
    ['한글 조합 중 Cmd+Enter', { metaKey: true, isComposing: true }],
    ['다른 키 Cmd+S', { metaKey: true, key: 's' }],
  ])('%s 는 저장 단축키가 아니다', (_name, init) => {
    expect(isSaveShortcut(key(init))).toBe(false)
  })
})
