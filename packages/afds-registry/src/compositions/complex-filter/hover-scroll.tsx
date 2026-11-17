'use client'

import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react'
import { ScrollArea } from '@turbo-project/afds/bricks'
import { cn } from '@turbo-project/afds/lib/utils'

/**
 * 길어지는 목록용 스크롤 영역 — 스크롤바는 마우스를 올렸을 때만 보인다(`ScrollArea` 의 hover-reveal 용법).
 * 높이는 부모(팝업)가 정한다: 팝업이 `flex-col` + 최대 높이일 때 이 영역이 남는 높이를 받아 스크롤한다
 */
export function HoverScroll({ children, className }: { children: ReactNode; className?: string }) {
  const [hovered, setHovered] = useState(false)
  return (
    <ScrollArea
      hideVertical={!hovered}
      hideHorizontal
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn('flex min-h-0 flex-1 flex-col', className)}
      viewportClassName="min-h-0 flex-1"
    >
      {children}
    </ScrollArea>
  )
}

/** 하이라이트가 이 행으로 바뀔 때만 스크롤 영역 안으로 끌어온다(렌더마다 다시 스크롤하지 않고, 페이지는 스크롤하지 않는다) */
export function ActiveRow({ active, ...props }: ComponentProps<'div'> & { active: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const row = ref.current
    if (!active || !row) return
    // WHY: scrollIntoView 는 페이지까지 스크롤할 수 있다. 가장 가까운 스크롤 영역의 scrollTop 만 조정한다
    const viewport = row.closest('[data-slot="scroll-area-viewport"]')
    if (!viewport) return
    const rowRect = row.getBoundingClientRect()
    const viewportRect = viewport.getBoundingClientRect()
    if (rowRect.top < viewportRect.top) viewport.scrollTop -= viewportRect.top - rowRect.top
    else if (rowRect.bottom > viewportRect.bottom)
      viewport.scrollTop += rowRect.bottom - viewportRect.bottom
  }, [active])
  return <div ref={ref} data-slot="complex-filter-row" {...props} />
}
