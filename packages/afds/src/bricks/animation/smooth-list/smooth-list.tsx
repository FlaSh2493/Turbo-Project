'use client'

import React, { type PropsWithChildren, useLayoutEffect, useRef } from 'react'

const FLIP_ID = 'smooth-list-flip'

export interface SmoothListProps<T extends React.ElementType> extends PropsWithChildren {
  className?: string
  as?: T
  duration?: number
}

export const SmoothList = <T extends React.ElementType = 'ul'>({
  children,
  duration = 300,
  as,
  ...props
}: SmoothListProps<T>) => {
  const containerRef = useRef<Element | null>(null)
  const prevRects = useRef(new Map<string, DOMRect>())

  useLayoutEffect(() => {
    const container = containerRef.current
    /* istanbul ignore if -- @preserve defensive check for null ref */
    if (!container) return

    const currentChildren = Array.from(container.children) as HTMLElement[]
    const newRects = new Map<string, DOMRect>()

    currentChildren.forEach(child => {
      const key = child.dataset.layoutId
      if (!key) return

      const newRect = child.getBoundingClientRect()
      newRects.set(key, newRect)

      const oldRect = prevRects.current.get(key)

      if (oldRect) {
        const deltaX = oldRect.left - newRect.left
        const deltaY = oldRect.top - newRect.top

        if (deltaX !== 0 || deltaY !== 0) {
          // getBoundingClientRect()가 스타일 재계산을 강제하면서 CSS 애니메이션(예: fade-out)이
          // getAnimations()에 포함될 수 있다. ID 필터 없이 finish()하면 CSS 애니메이션까지 즉시
          // 종료되어 fade-out이 무시되는 버그가 발생한다.
          //
          // 수정 전:
          //   child.getAnimations().forEach((a) => a.finish())
          //   child.animate(
          //     [
          //       { transform: `translate(${deltaX}px, ${deltaY}px)` },
          //       { transform: 'translate(0, 0)' },
          //     ],
          //     { duration, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', fill: 'both' },
          //   )
          child
            .getAnimations()
            .filter(a => a.id === FLIP_ID)
            .forEach(a => a.finish())
          child.animate(
            [
              { transform: `translate(${deltaX}px, ${deltaY}px)` },
              { transform: 'translate(0, 0)' },
            ],
            {
              id: FLIP_ID,
              duration,
              easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
              fill: 'both',
            },
          )
        }
      }
    })

    prevRects.current = newRects
  })

  const Component = as || 'ul'
  return (
    <Component data-slot="smooth-list" ref={containerRef as React.Ref<never>} {...props}>
      {children}
    </Component>
  )
}
