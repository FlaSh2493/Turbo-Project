import { describe, it, expect, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { usePagination } from '../use-pagination'
import type { PaginationItemDescriptor } from '../types'

const pages = (items: PaginationItemDescriptor[]) =>
  items
    .filter((it): it is Extract<PaginationItemDescriptor, { type: 'page' }> => it.type === 'page')
    .map(it => it.value)

const hasEllipsis = (items: PaginationItemDescriptor[]) => items.some(it => it.type === 'ellipsis')

describe('usePagination', () => {
  it('returns sequential pages when totalPages <= pageRange', () => {
    const { result } = renderHook(() =>
      usePagination({ currentPage: 1, totalPages: 5, onPageChange: () => {} }),
    )
    expect(pages(result.current.items)).toEqual([1, 2, 3, 4, 5])
    expect(hasEllipsis(result.current.items)).toBe(false)
  })

  it('shows trailing ellipsis when current page is near the start', () => {
    const { result } = renderHook(() =>
      usePagination({ currentPage: 1, totalPages: 20, onPageChange: () => {} }),
    )
    expect(pages(result.current.items)).toEqual([1, 2, 3, 4, 5, 20])
    expect(hasEllipsis(result.current.items)).toBe(true)
  })

  it('shows both ellipses when current page is in the middle', () => {
    const { result } = renderHook(() =>
      usePagination({ currentPage: 10, totalPages: 20, onPageChange: () => {} }),
    )
    expect(pages(result.current.items)).toEqual([1, 8, 9, 10, 11, 12, 20])
  })

  it('shows leading ellipsis when current page is near the end', () => {
    const { result } = renderHook(() =>
      usePagination({ currentPage: 20, totalPages: 20, onPageChange: () => {} }),
    )
    expect(pages(result.current.items)).toEqual([1, 16, 17, 18, 19, 20])
  })

  it('respects custom pageRange', () => {
    const { result } = renderHook(() =>
      usePagination({ currentPage: 5, totalPages: 20, onPageChange: () => {}, pageRange: 7 }),
    )
    const ps = pages(result.current.items)
    expect(ps).toContain(2)
    expect(ps).toContain(8)
  })

  it('marks selected page', () => {
    const { result } = renderHook(() =>
      usePagination({ currentPage: 3, totalPages: 5, onPageChange: () => {} }),
    )
    const selected = result.current.items.find(
      (it): it is Extract<PaginationItemDescriptor, { type: 'page' }> =>
        it.type === 'page' && it.selected,
    )
    expect(selected?.value).toBe(3)
  })

  it('exposes isFirst / isLast flags', () => {
    const first = renderHook(() =>
      usePagination({ currentPage: 1, totalPages: 10, onPageChange: () => {} }),
    )
    expect(first.result.current.isFirst).toBe(true)
    expect(first.result.current.isLast).toBe(false)

    const last = renderHook(() =>
      usePagination({ currentPage: 10, totalPages: 10, onPageChange: () => {} }),
    )
    expect(last.result.current.isLast).toBe(true)
  })

  it('goTo clamps to [1, totalPages] and calls onPageChange', () => {
    const onPageChange = vi.fn()
    const { result } = renderHook(() =>
      usePagination({ currentPage: 5, totalPages: 10, onPageChange }),
    )

    act(() => result.current.goTo(0))
    expect(onPageChange).toHaveBeenLastCalledWith(1)

    act(() => result.current.goTo(99))
    expect(onPageChange).toHaveBeenLastCalledWith(10)

    act(() => result.current.goTo(7))
    expect(onPageChange).toHaveBeenLastCalledWith(7)
  })

  it('goTo does not call onPageChange when target equals current', () => {
    const onPageChange = vi.fn()
    const { result } = renderHook(() =>
      usePagination({ currentPage: 5, totalPages: 10, onPageChange }),
    )
    act(() => result.current.goTo(5))
    expect(onPageChange).not.toHaveBeenCalled()
  })

  it('prev / next respect boundaries', () => {
    const onPageChange = vi.fn()
    const atStart = renderHook(() =>
      usePagination({ currentPage: 1, totalPages: 10, onPageChange }),
    )
    act(() => atStart.result.current.prev())
    expect(onPageChange).not.toHaveBeenCalled()

    act(() => atStart.result.current.next())
    expect(onPageChange).toHaveBeenLastCalledWith(2)

    const atEnd = renderHook(() => usePagination({ currentPage: 10, totalPages: 10, onPageChange }))
    onPageChange.mockClear()
    act(() => atEnd.result.current.next())
    expect(onPageChange).not.toHaveBeenCalled()

    act(() => atEnd.result.current.prev())
    expect(onPageChange).toHaveBeenLastCalledWith(9)
  })
})
