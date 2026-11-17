'use client'

import * as React from 'react'
import { cn } from '../../../lib/utils'
import {
  tableRootVariants,
  tableHeaderVariants,
  tableBodyVariants,
  tableFooterVariants,
  tableRowVariants,
  tableHeadVariants,
  tableCellVariants,
  type TableSize,
} from './table.style'

const TableSizeContext = React.createContext<TableSize>('md')

export interface TableRootProps extends React.HTMLAttributes<HTMLTableElement> {
  /**
   * 테이블의 크기
   * @default 'md'
   */
  size?: TableSize
  /**
   * 추가 className
   */
  className?: string
}
/**
 * 테이블 Header 컴포넌트의 Props
 */
export interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  /**
   * 추가 className
   */
  className?: string
}

/**
 * 테이블 Body 컴포넌트의 Props
 */
export interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  /**
   * 추가 className
   */
  className?: string
}

/**
 * 테이블 Footer 컴포넌트의 Props
 */
export interface TableFooterProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  /**
   * 추가 className
   */
  className?: string
}

/**
 * 테이블 Row 컴포넌트의 Props
 */
export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  /**
   * 추가 className
   */
  className?: string
}
export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  /**
   * 테이블 헤더 셀의 크기
   */
  size?: TableSize
  /**
   * 추가 className
   */
  className?: string
}

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  /**
   * 테이블 데이터 셀의 크기
   */
  size?: TableSize
  /**
   * 추가 className
   */
  className?: string
}

export const TableRoot = React.forwardRef<HTMLTableElement, TableRootProps>(
  ({ className, size = 'md', ...props }, ref) => (
    <TableSizeContext.Provider value={size}>
      <table
        ref={ref}
        className={cn(tableRootVariants(), className)}
        data-slot="table"
        {...props}
      />
    </TableSizeContext.Provider>
  ),
)
TableRoot.displayName = 'TableRoot'

export const TableHeader = React.forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ className, ...props }, ref) => (
    <thead
      ref={ref}
      className={cn(tableHeaderVariants(), className)}
      data-slot="table-header"
      {...props}
    />
  ),
)
TableHeader.displayName = 'TableHeader'

export const TableBody = React.forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ className, ...props }, ref) => (
    <tbody
      ref={ref}
      className={cn(tableBodyVariants(), className)}
      data-slot="table-body"
      {...props}
    />
  ),
)
TableBody.displayName = 'TableBody'

export const TableFooter = React.forwardRef<HTMLTableSectionElement, TableFooterProps>(
  ({ className, ...props }, ref) => (
    <tfoot
      ref={ref}
      className={cn(tableFooterVariants(), className)}
      data-slot="table-footer"
      {...props}
    />
  ),
)
TableFooter.displayName = 'TableFooter'

export const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, ...props }, ref) => (
    <tr ref={ref} className={cn(tableRowVariants(), className)} data-slot="table-row" {...props} />
  ),
)
TableRow.displayName = 'TableRow'

export const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, size, ...props }, ref) => {
    const ctxSize = React.useContext(TableSizeContext)
    return (
      <th
        ref={ref}
        className={cn(tableHeadVariants({ size: size ?? ctxSize }), className)}
        data-slot="table-head"
        {...props}
      />
    )
  },
)
TableHead.displayName = 'TableHead'

export const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, size, ...props }, ref) => {
    const ctxSize = React.useContext(TableSizeContext)
    return (
      <td
        ref={ref}
        className={cn(tableCellVariants({ size: size ?? ctxSize }), className)}
        data-slot="table-cell"
        {...props}
      />
    )
  },
)
TableCell.displayName = 'TableCell'

export const Table = {
  Root: TableRoot,
  Header: TableHeader,
  Body: TableBody,
  Footer: TableFooter,
  Row: TableRow,
  Head: TableHead,
  Cell: TableCell,
}
