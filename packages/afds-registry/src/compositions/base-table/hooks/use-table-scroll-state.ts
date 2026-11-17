'use client'

import React from 'react'

export interface TableScrollContextValue {
  isScrolledLeft: boolean
  isScrolledRight: boolean
}

export const useTableScrollState = (viewportRef: React.Ref<HTMLDivElement> | undefined) => {
  const [scrollState, setScrollState] = React.useState<TableScrollContextValue>({
    isScrolledLeft: false,
    isScrolledRight: false,
  })

  const updateScrollState = React.useCallback((element: Element | null) => {
    if (!element) return
    const isScrolledLeft = element.scrollLeft > 0
    const isScrolledRight = element.scrollLeft < element.scrollWidth - element.clientWidth - 1

    setScrollState(prev => {
      if (prev.isScrolledLeft === isScrolledLeft && prev.isScrolledRight === isScrolledRight) {
        return prev
      }
      return { isScrolledLeft, isScrolledRight }
    })
  }, [])

  React.useEffect(() => {
    const element = (viewportRef as React.RefObject<HTMLDivElement>)?.current
    if (!element) return

    // ResizeObserver: 초기 레이아웃 완료 후 + 리사이즈 시 상태 계산
    const observer = new ResizeObserver(() => updateScrollState(element))
    observer.observe(element)

    return () => observer.disconnect()
  }, [viewportRef, updateScrollState])

  return { scrollState, updateScrollState }
}
