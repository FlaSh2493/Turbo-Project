'use client'

import { useCallback, useMemo, useState } from 'react'
import type { PaginationItemDescriptor, UsePaginationProps, UsePaginationReturn } from './types'

// usePagination 내부 전용 헬퍼 (public export 아님)
function calculatePaginationItems(
  currentPage: number,
  totalPages: number,
  pageRange: number,
): PaginationItemDescriptor[] {
  const result: PaginationItemDescriptor[] = []
  const halfRange = Math.floor(pageRange / 2)

  let startPage = Math.max(1, currentPage - halfRange)
  let endPage = Math.min(totalPages, currentPage + halfRange)

  if (startPage === 1) {
    endPage = Math.min(totalPages, startPage + pageRange - 1)
  }
  if (endPage === totalPages) {
    startPage = Math.max(1, endPage - pageRange + 1)
  }

  let index = 0
  const pushPage = (value: number) => {
    result.push({ type: 'page', value, selected: value === currentPage, index: index++ })
  }
  const pushEllipsis = () => {
    result.push({ type: 'ellipsis', index: index++ })
  }

  if (startPage > 1) {
    pushPage(1)
    if (startPage > 2) pushEllipsis()
  }

  for (let i = startPage; i <= endPage; i++) {
    pushPage(i)
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) pushEllipsis()
    pushPage(totalPages)
  }

  return result
}

export function usePagination({
  totalPages,
  onPageChange,
  pageRange = 5,
  defaultPage,
  currentPage: controlledPage,
}: UsePaginationProps): UsePaginationReturn {
  const [uncontrolledPage, setUncontrolledPage] = useState(defaultPage ?? 1)
  const currentPage = controlledPage ?? uncontrolledPage

  const goTo = useCallback(
    (page: number) => {
      if (totalPages < 1) return
      const clamped = Math.min(Math.max(1, page), totalPages)
      if (clamped !== currentPage) {
        if (controlledPage === undefined) setUncontrolledPage(clamped)
        onPageChange?.(clamped)
      }
    },
    [currentPage, totalPages, controlledPage, onPageChange],
  )

  const prev = useCallback(() => goTo(currentPage - 1), [currentPage, goTo])
  const next = useCallback(() => goTo(currentPage + 1), [currentPage, goTo])

  const items = useMemo<PaginationItemDescriptor[]>(
    () => calculatePaginationItems(currentPage, totalPages, pageRange),
    [currentPage, totalPages, pageRange],
  )

  return {
    items,
    currentPage,
    totalPages,
    isFirst: totalPages < 1 || currentPage === 1,
    isLast: totalPages < 1 || currentPage === totalPages,
    goTo,
    prev,
    next,
  }
}
