'use client'

import * as React from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { usePagination } from '../../../headless/pagination'
import type { PaginationItemDescriptor, UsePaginationReturn } from '../../../headless/pagination'
import {
  paginationRootBase,
  paginationListBase,
  paginationItemBase,
  paginationEllipsisBase,
  paginationNavBase,
} from './pagination.style'

// Context

const PaginationContext = React.createContext<UsePaginationReturn | null>(null)

const usePaginationContext = (part: string) => {
  const ctx = React.useContext(PaginationContext)
  if (!ctx) {
    throw new Error(`<Pagination.${part}> must be rendered inside <Pagination.Root>`)
  }
  return ctx
}

// Root

export interface PaginationRootProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * 전체 페이지 수
   */
  totalPages: number
  /**
   * 한 번에 표시할 페이지 범위
   */
  pageRange?: number
  /**
   * 초기 페이지 번호
   */
  defaultPage?: number
  /**
   * 현재 페이지 번호 (제어 모드)
   */
  currentPage?: number
  /**
   * 페이지 변경 시 호출되는 콜백 함수
   */
  onPageChange?: (page: number) => void
}

/**
 * Pagination Root - 페이지네이션 루트 컨테이너
 */
export const PaginationRoot = React.forwardRef<HTMLElement, PaginationRootProps>(
  (
    {
      totalPages,
      pageRange,
      defaultPage,
      currentPage,
      onPageChange,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const ctx = usePagination({ totalPages, pageRange, defaultPage, currentPage, onPageChange })

    return (
      <PaginationContext.Provider value={ctx}>
        <nav
          ref={ref}
          data-slot="pagination-root"
          role="navigation"
          aria-label="Pagination"
          className={cn(paginationRootBase, className)}
          {...props}
        >
          {children}
        </nav>
      </PaginationContext.Provider>
    )
  },
)
PaginationRoot.displayName = 'PaginationRoot'

// List

export type PaginationListProps = React.HTMLAttributes<HTMLDivElement>

/**
 * Pagination List - 페이지 아이템을 감싸는 컨테이너
 */
export const PaginationList = React.forwardRef<HTMLDivElement, PaginationListProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="pagination-list"
      className={cn(paginationListBase, className)}
      {...props}
    />
  ),
)
PaginationList.displayName = 'PaginationList'

// Items

export interface PaginationItemsProps {
  /**
   * 페이지네이션 아이템을 렌더링하는 함수
   */
  render: (item: PaginationItemDescriptor) => React.ReactNode
}

export const PaginationItems = ({ render }: PaginationItemsProps) => {
  const { items } = usePaginationContext('Items')
  return (
    <>
      {items.map(item => (
        <React.Fragment
          key={item.type === 'page' ? `page-${item.value}` : `ellipsis-${item.index}`}
        >
          {render(item)}
        </React.Fragment>
      ))}
    </>
  )
}
PaginationItems.displayName = 'PaginationItems'

// Auto

/**
 * Pagination Auto - 기본 페이지네이션 렌더링 (page 버튼 + ellipsis 자동 분기)
 */
export const PaginationAuto = () => {
  const { items } = usePaginationContext('Auto')
  return (
    <>
      {items.map(item =>
        item.type === 'page' ? (
          <PaginationItem key={`page-${item.value}`} value={item.value} />
        ) : (
          <PaginationEllipsis key={`ellipsis-${item.index}`} />
        ),
      )}
    </>
  )
}
PaginationAuto.displayName = 'Pagination.Auto'

// Item

export interface PaginationItemProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'value' | 'onClick'
> {
  /**
   * 페이지 번호
   */
  value: number
  /**
   * 클릭 시 호출되는 핸들러
   */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
}

/**
 * Pagination Item - 개별 페이지 번호 버튼
 */
export const PaginationItem = React.forwardRef<HTMLButtonElement, PaginationItemProps>(
  ({ value, className, onClick, children, ...props }, ref) => {
    const { currentPage, goTo } = usePaginationContext('Item')
    const isActive = currentPage === value
    return (
      <button
        ref={ref}
        type="button"
        data-slot="pagination-item"
        data-active={isActive}
        aria-label={`Page ${value}`}
        aria-current={isActive ? 'page' : undefined}
        className={cn(paginationItemBase, className)}
        onClick={event => {
          onClick?.(event)
          if (!event.defaultPrevented) goTo(value)
        }}
        {...props}
      >
        {children ?? value}
      </button>
    )
  },
)
PaginationItem.displayName = 'PaginationItem'

// Ellipsis

export type PaginationEllipsisProps = React.HTMLAttributes<HTMLSpanElement>

/**
 * Pagination Ellipsis - 생략 표시 (...)
 */
export const PaginationEllipsis = React.forwardRef<HTMLSpanElement, PaginationEllipsisProps>(
  ({ className, children, ...props }, ref) => (
    <span
      ref={ref}
      data-slot="pagination-ellipsis"
      aria-hidden="true"
      className={cn(paginationEllipsisBase, className)}
      {...props}
    >
      {children ?? '···'}
    </span>
  ),
)
PaginationEllipsis.displayName = 'PaginationEllipsis'

// PrevTrigger

export interface PaginationPrevTriggerProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'onClick'
> {
  /**
   * 클릭 시 호출되는 핸들러
   */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
}

/**
 * Pagination PrevTrigger - 이전 페이지 이동 버튼
 */
export const PaginationPrevTrigger = React.forwardRef<
  HTMLButtonElement,
  PaginationPrevTriggerProps
>(({ className, onClick, disabled, children, 'aria-label': ariaLabel, ...props }, ref) => {
  const { prev, isFirst } = usePaginationContext('PrevTrigger')
  return (
    <button
      ref={ref}
      type="button"
      data-slot="pagination-prev"
      aria-label={ariaLabel ?? 'Previous page'}
      disabled={disabled ?? isFirst}
      className={cn(paginationNavBase, className)}
      onClick={event => {
        onClick?.(event)
        if (!event.defaultPrevented) prev()
      }}
      {...props}
    >
      {children ?? <ChevronLeftIcon size={16} />}
    </button>
  )
})
PaginationPrevTrigger.displayName = 'PaginationPrevTrigger'

// NextTrigger

export interface PaginationNextTriggerProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'onClick'
> {
  /**
   * 클릭 시 호출되는 핸들러
   */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
}

/**
 * Pagination NextTrigger - 다음 페이지 이동 버튼
 */
export const PaginationNextTrigger = React.forwardRef<
  HTMLButtonElement,
  PaginationNextTriggerProps
>(({ className, onClick, disabled, children, 'aria-label': ariaLabel, ...props }, ref) => {
  const { next, isLast } = usePaginationContext('NextTrigger')
  return (
    <button
      ref={ref}
      type="button"
      data-slot="pagination-next"
      aria-label={ariaLabel ?? 'Next page'}
      disabled={disabled ?? isLast}
      className={cn(paginationNavBase, className)}
      onClick={event => {
        onClick?.(event)
        if (!event.defaultPrevented) next()
      }}
      {...props}
    >
      {children ?? <ChevronRightIcon size={16} />}
    </button>
  )
})
PaginationNextTrigger.displayName = 'PaginationNextTrigger'

export const Pagination = {
  Root: PaginationRoot,
  List: PaginationList,
  Items: PaginationItems,
  Item: PaginationItem,
  Ellipsis: PaginationEllipsis,
  PrevTrigger: PaginationPrevTrigger,
  NextTrigger: PaginationNextTrigger,
}
