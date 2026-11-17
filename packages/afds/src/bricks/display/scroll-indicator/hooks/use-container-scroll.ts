'use client'

import { useEffect, useState } from 'react'

export interface ScrollState {
  scrollLeft: number
  scrollWidth: number
  clientWidth: number
}

/**
 * 컨테이너의 스크롤 상태를 감지하는 훅
 */
export const useContainerScroll = (containerRef: React.RefObject<HTMLElement | null>) => {
  const [scrollState, setScrollState] = useState<ScrollState>({
    scrollLeft: 0,
    scrollWidth: 0,
    clientWidth: 0,
  })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const updateScroll = () => {
      setScrollState({
        scrollLeft: el.scrollLeft,
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
      })
    }

    updateScroll()
    el.addEventListener('scroll', updateScroll)

    const resizeObserver = new ResizeObserver(updateScroll)
    resizeObserver.observe(el)

    return () => {
      el.removeEventListener('scroll', updateScroll)
      resizeObserver.disconnect()
    }
  }, [containerRef])

  return scrollState
}
