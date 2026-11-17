'use client'

import { forwardRef, type ReactNode } from 'react'
import { Typography } from '@turbo-project/afds/bricks'
import { cn } from '@turbo-project/afds/lib/utils'
import type { PrimitiveSpacing } from '@turbo-project/afds/schemas'

const COL_SPAN: Record<number, string> = {
  1: 'col-span-1',
  2: 'col-span-2',
  3: 'col-span-3',
  4: 'col-span-4',
  5: 'col-span-5',
  6: 'col-span-6',
  7: 'col-span-7',
  8: 'col-span-8',
  9: 'col-span-9',
  10: 'col-span-10',
  11: 'col-span-11',
  12: 'col-span-12',
}

const ROW_SPAN: Record<number, string> = {
  1: 'row-span-1',
  2: 'row-span-2',
  3: 'row-span-3',
  4: 'row-span-4',
  5: 'row-span-5',
  6: 'row-span-6',
}

const GRID_COLS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  7: 'grid-cols-7',
  8: 'grid-cols-8',
  9: 'grid-cols-9',
  10: 'grid-cols-10',
  11: 'grid-cols-11',
  12: 'grid-cols-12',
}

const GRID_ROWS: Record<number, string> = {
  1: 'grid-rows-1',
  2: 'grid-rows-2',
  3: 'grid-rows-3',
  4: 'grid-rows-4',
  5: 'grid-rows-5',
  6: 'grid-rows-6',
}

const GAP: Record<PrimitiveSpacing, string> = {
  'spacing-4': 'gap-afds-spacing-4',
  'spacing-8': 'gap-afds-spacing-8',
  'spacing-10': 'gap-afds-spacing-10',
  'spacing-14': 'gap-afds-spacing-14',
  'spacing-20': 'gap-afds-spacing-20',
  'spacing-24': 'gap-afds-spacing-24',
  'spacing-30': 'gap-afds-spacing-30',
  'spacing-34': 'gap-afds-spacing-34',
  'spacing-40': 'gap-afds-spacing-40',
  'spacing-44': 'gap-afds-spacing-44',
  'spacing-50': 'gap-afds-spacing-50',
  'spacing-60': 'gap-afds-spacing-60',
}

/*
 * 콘텐츠 폭 유형 — XDS Figma "Layout"(node 23216:21)의 Case 1·2·3.
 * 폭 값은 Contents 의 좌우 패딩(px-5 = 20px × 2)을 포함한 border-box 기준이라
 * 콘텐츠 영역 폭에서 40px 를 더한 값이다: 1340+40 = 345 · 660+40 = 175.
 */
export type PageLayoutContentsWidth = 'fluid' | 'bounded' | 'narrow'

const CONTENTS_WIDTH: Record<PageLayoutContentsWidth, string | undefined> = {
  fluid: undefined,
  bounded: 'mx-auto w-full max-w-345',
  narrow: 'mx-auto w-175',
}

// PageLayout

interface PageLayoutProps {
  children: ReactNode
  className?: string
}

interface HeaderProps {
  children: ReactNode
  className?: string
}

interface HeaderTitleProps {
  children: ReactNode
  className?: string
}

interface HeaderActionsProps {
  children: ReactNode
  className?: string
}

interface ContentsProps {
  children: ReactNode
  cols: number
  rows?: number
  gap?: PrimitiveSpacing
  /** 콘텐츠 영역 폭 규칙. fluid: 최대폭 없음 · bounded: 최대 1340px 중앙 · narrow: 660px 고정 중앙 */
  width?: PageLayoutContentsWidth
  className?: string
}

interface SectionProps {
  children: ReactNode
  colSpan?: number
  rowSpan?: number
  className?: string
}

// Component Functions

const PageLayoutRoot = forwardRef<HTMLDivElement, PageLayoutProps>(
  ({ children, className }, ref) => {
    return (
      // 241 = 964px = 콘텐츠 최소 924px + 좌우 패딩 40px. LNB(60px)를 더하면 최소 브라우저 폭 1024px 이다.
      // 1320px 로 두면 1024px 에서 헤더 액션이 LNB 옆 영역 밖으로 밀려난다.
      <div ref={ref} data-slot="page-layout" className={cn('min-w-241', className)}>
        {children}
      </div>
    )
  },
)
PageLayoutRoot.displayName = 'PageLayout'

const Header = forwardRef<HTMLElement, HeaderProps>(({ children, className }, ref) => {
  return (
    <header
      ref={ref}
      data-slot="page-layout-header"
      className={cn(
        'heading1 bg-afds-bg-surface flex items-center justify-between border-b border-afds-divider-default px-5 pt-[40px] pb-[30px] text-afds-text-primary',
        className,
      )}
    >
      {children}
    </header>
  )
})
Header.displayName = 'PageLayout.Header'

const HeaderTitle = forwardRef<HTMLElement, HeaderTitleProps>(({ children, className }, ref) => {
  return (
    <Typography
      ref={ref}
      as="h1"
      variant="heading1"
      data-slot="page-layout-header-title"
      className={className}
    >
      {children}
    </Typography>
  )
})
HeaderTitle.displayName = 'PageLayout.Header.Title'

const HeaderActions = forwardRef<HTMLDivElement, HeaderActionsProps>(
  ({ children, className }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="page-layout-header-actions"
        className={cn('flex items-center gap-2', className)}
      >
        {children}
      </div>
    )
  },
)
HeaderActions.displayName = 'PageLayout.Header.Actions'

const Contents = forwardRef<HTMLDivElement, ContentsProps>(
  ({ children, cols, rows, gap = 'spacing-14', width = 'fluid', className }, ref) => {
    const colsClass = GRID_COLS[cols] || 'grid-cols-1'
    const rowsClass = rows ? GRID_ROWS[rows] : undefined
    const gapClass = GAP[gap] || 'gap-afds-spacing-14'

    return (
      <div
        ref={ref}
        data-slot="page-layout-contents"
        className={cn(
          'grid flex-1 px-5 py-6',
          colsClass,
          rowsClass,
          gapClass,
          CONTENTS_WIDTH[width],
          className,
        )}
      >
        {children}
      </div>
    )
  },
)
Contents.displayName = 'PageLayout.Contents'

const Section = forwardRef<HTMLDivElement, SectionProps>(
  ({ children, colSpan = 1, rowSpan = 1, className }, ref) => {
    const colSpanClass = COL_SPAN[colSpan] || 'col-span-1'
    const rowSpanClass = ROW_SPAN[rowSpan] || 'row-span-1'

    return (
      <div
        ref={ref}
        data-slot="page-layout-section"
        className={cn(colSpanClass, rowSpanClass, className)}
      >
        {children}
      </div>
    )
  },
)
Section.displayName = 'PageLayout.Contents.Section'

// Compound Component Assembly

export const PageLayout = Object.assign(PageLayoutRoot, {
  Header: Object.assign(Header, {
    Title: HeaderTitle,
    Actions: HeaderActions,
  }),
  Contents: Object.assign(Contents, {
    Section,
  }),
})
