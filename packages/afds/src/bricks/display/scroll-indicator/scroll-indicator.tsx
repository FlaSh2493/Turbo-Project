'use client'

import { forwardRef, useCallback, useRef } from 'react'
import { useContainerScroll } from './hooks'
import { cn } from '../../../lib/utils'
import {
  scrollIndicatorRootBase,
  scrollIndicatorTrackBase,
  scrollIndicatorHeaderBase,
  scrollIndicatorBodyBase,
  scrollIndicatorViewportBase,
  SCROLL_INDICATOR_WIDTH,
  SCROLL_INDICATOR_TRACK_PADDING,
  SCROLL_INDICATOR_VIEWPORT_WIDTH,
} from './scroll-indicator.style'

export interface ScrollIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * 스크롤할 컨테이너의 ref
   */
  scrollContainerRef: React.RefObject<HTMLElement | null>
  /**
   * 추가 className
   */
  className?: string
}

export const ScrollIndicator = forwardRef<HTMLDivElement, ScrollIndicatorProps>(
  ({ scrollContainerRef, className, ...rest }, ref) => {
    const scrollState = useContainerScroll(scrollContainerRef)
    const isDraggingRef = useRef(false)
    const dragStartXRef = useRef(0)
    const dragStartScrollLeftRef = useRef(0)

    const { scrollLeft, scrollWidth, clientWidth } = scrollState

    // 스크롤 가능 여부 (컨텐츠가 컨테이너보다 넓을 때만 표시)
    const isScrollable = scrollWidth > clientWidth

    const trackWidth = SCROLL_INDICATOR_WIDTH - SCROLL_INDICATOR_TRACK_PADDING * 2

    const maxScrollLeft = scrollWidth - clientWidth
    const trackRange = Math.max(0, trackWidth - SCROLL_INDICATOR_VIEWPORT_WIDTH)
    const viewportBoxLeft = maxScrollLeft > 0 ? (scrollLeft / maxScrollLeft) * trackRange : 0

    const handleMouseDown = useCallback(
      (e: React.MouseEvent) => {
        const el = scrollContainerRef.current
        if (!el) return

        e.preventDefault()
        isDraggingRef.current = true
        dragStartXRef.current = e.clientX
        dragStartScrollLeftRef.current = el.scrollLeft

        const handleMouseMove = (moveEvent: MouseEvent) => {
          if (!isDraggingRef.current) return
          const deltaX = moveEvent.clientX - dragStartXRef.current
          // el에서 실시간 값을 읽어 stale closure 방지
          const currentMaxScrollLeft = el.scrollWidth - el.clientWidth
          const scrollRatio =
            currentMaxScrollLeft > 0
              ? currentMaxScrollLeft / (trackWidth - SCROLL_INDICATOR_VIEWPORT_WIDTH)
              : 1
          el.scrollLeft = dragStartScrollLeftRef.current + deltaX * scrollRatio
        }

        const handleMouseUp = () => {
          isDraggingRef.current = false
          window.removeEventListener('mousemove', handleMouseMove)
          window.removeEventListener('mouseup', handleMouseUp)
        }

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)
      },
      [scrollContainerRef, trackWidth],
    )

    if (!isScrollable) return null

    return (
      <div
        ref={ref}
        data-slot="scroll-indicator"
        {...rest}
        className={cn(scrollIndicatorRootBase, className)}
      >
        <div className={scrollIndicatorTrackBase}>
          <div className={scrollIndicatorHeaderBase} />
          <div className={scrollIndicatorBodyBase} />
          <div
            className={scrollIndicatorViewportBase}
            // eslint-disable-next-line no-restricted-syntax -- 뷰포트 박스 위치는 스크롤 상태 기반 동적 값
            style={{ left: viewportBoxLeft, width: SCROLL_INDICATOR_VIEWPORT_WIDTH }}
            onMouseDown={handleMouseDown}
          />
        </div>
      </div>
    )
  },
)
ScrollIndicator.displayName = 'ScrollIndicator'
