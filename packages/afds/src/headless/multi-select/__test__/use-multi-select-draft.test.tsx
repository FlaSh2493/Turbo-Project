import { describe, it, expect, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useMultiSelectDraft } from '../use-multi-select-draft'

describe('useMultiSelectDraft', () => {
  it('초기 펜딩 값은 committed와 동일하다', () => {
    const { result } = renderHook(() =>
      useMultiSelectDraft({
        committed: ['a', 'b'],
        setCommitted: () => {},
        isOpen: false,
        setOpen: () => {},
      }),
    )

    expect(result.current.value).toEqual(['a', 'b'])
    expect(result.current.isDirty).toBe(false)
  })

  it('setValue는 펜딩만 갱신하고 setCommitted를 호출하지 않는다', () => {
    const setCommitted = vi.fn()
    const { result } = renderHook(() =>
      useMultiSelectDraft({
        committed: ['a'],
        setCommitted,
        isOpen: true,
        setOpen: () => {},
      }),
    )

    act(() => result.current.setValue(['a', 'b']))

    expect(result.current.value).toEqual(['a', 'b'])
    expect(result.current.isDirty).toBe(true)
    expect(setCommitted).not.toHaveBeenCalled()
  })

  it('isOpen false → true 시 펜딩이 committed로 sync된다', () => {
    let isOpen = false
    const { result, rerender } = renderHook(
      ({ open }: { open: boolean }) =>
        useMultiSelectDraft({
          committed: ['x', 'y'],
          setCommitted: () => {},
          isOpen: open,
          setOpen: () => {},
        }),
      { initialProps: { open: isOpen } },
    )

    // open 상태에서 펜딩 변경
    isOpen = true
    rerender({ open: isOpen })
    act(() => result.current.setValue(['x', 'y', 'z']))
    expect(result.current.value).toEqual(['x', 'y', 'z'])

    // 닫고 다시 열면 펜딩이 committed(['x', 'y'])로 sync되어야 한다
    isOpen = false
    rerender({ open: isOpen })
    expect(result.current.value).toEqual(['x', 'y'])

    isOpen = true
    rerender({ open: isOpen })
    expect(result.current.value).toEqual(['x', 'y'])
  })

  it('confirm()은 setCommitted(pending)을 호출하고 setOpen(false)를 부른다', () => {
    const setCommitted = vi.fn()
    const setOpen = vi.fn()

    const { result } = renderHook(() =>
      useMultiSelectDraft({
        committed: ['a'],
        setCommitted,
        isOpen: true,
        setOpen,
      }),
    )

    act(() => result.current.setValue(['a', 'b']))
    act(() => result.current.confirm())

    expect(setCommitted).toHaveBeenCalledWith(['a', 'b'])
    expect(setOpen).toHaveBeenCalledWith(false)
  })

  it('cancel()은 setOpen(false)만 호출하고, 다음 isOpen 변화에 펜딩이 committed로 revert된다', () => {
    const setCommitted = vi.fn()
    const setOpen = vi.fn()
    let isOpen = true
    const committed = ['a']

    const { result, rerender } = renderHook(
      ({ open }: { open: boolean }) =>
        useMultiSelectDraft({
          committed,
          setCommitted,
          isOpen: open,
          setOpen,
        }),
      { initialProps: { open: isOpen } },
    )

    act(() => result.current.setValue(['a', 'b', 'c']))
    expect(result.current.value).toEqual(['a', 'b', 'c'])

    act(() => result.current.cancel())
    expect(setCommitted).not.toHaveBeenCalled()
    expect(setOpen).toHaveBeenCalledWith(false)

    // 부모가 setOpen(false)를 받아 isOpen=false로 반영하면 effect가 펜딩을 committed로 되돌린다
    isOpen = false
    rerender({ open: isOpen })
    expect(result.current.value).toEqual(['a'])
  })

  it('reset()은 펜딩을 빈 배열로 설정한다 (setOpen 호출 안 함)', () => {
    const setOpen = vi.fn()
    const { result } = renderHook(() =>
      useMultiSelectDraft({
        committed: ['a', 'b'],
        setCommitted: () => {},
        isOpen: true,
        setOpen,
      }),
    )

    act(() => result.current.reset())

    expect(result.current.value).toEqual([])
    expect(result.current.isDirty).toBe(true)
    expect(setOpen).not.toHaveBeenCalled()
  })

  it('isDirty는 순서·중복과 무관하게 집합 동등성으로 판단한다', () => {
    const { result } = renderHook(() =>
      useMultiSelectDraft({
        committed: ['a', 'b'],
        setCommitted: () => {},
        isOpen: true,
        setOpen: () => {},
      }),
    )

    // 순서만 다르면 dirty=false
    act(() => result.current.setValue(['b', 'a']))
    expect(result.current.isDirty).toBe(false)

    // 길이 다르면 dirty=true
    act(() => result.current.setValue(['a']))
    expect(result.current.isDirty).toBe(true)

    // 다른 원소면 dirty=true
    act(() => result.current.setValue(['a', 'c']))
    expect(result.current.isDirty).toBe(true)
  })
})
