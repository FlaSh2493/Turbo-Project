'use client'

import { forwardRef } from 'react'
import { Pagination, Typography } from '@turbo-project/afds/bricks'

interface PaginationBarProps {
  total: number
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  pageRange?: number
  className?: string
  totalFormatter?: (total: number) => string
}

const defaultTotalFormatter = (total: number) => `Total ${total.toLocaleString()}`

export const PaginationBar = forwardRef<HTMLDivElement, PaginationBarProps>(
  (
    {
      total,
      currentPage,
      totalPages,
      onPageChange,
      pageRange,
      className,
      totalFormatter = defaultTotalFormatter,
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        data-slot="pagination-bar"
        className={`relative flex items-center justify-center${className ? ` ${className}` : ''}`}
      >
        <Typography variant="title4" as="span" color="text-primary" className="absolute left-0">
          {totalFormatter(total)}
        </Typography>
        <Pagination.Root
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          pageRange={pageRange}
        >
          <Pagination.PrevTrigger />
          <Pagination.List>
            <Pagination.Items
              render={item =>
                item.type === 'page' ? (
                  <Pagination.Item key={item.value} value={item.value} />
                ) : (
                  <Pagination.Ellipsis key={`e-${item.index}`} />
                )
              }
            />
          </Pagination.List>
          <Pagination.NextTrigger />
        </Pagination.Root>
      </div>
    )
  },
)

PaginationBar.displayName = 'PaginationBar'
