'use client'

import { useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type Table,
  type SortingState,
  type ColumnFiltersState,
  type ColumnPinningState,
  type RowSelectionState,
  type PaginationState,
} from '@tanstack/react-table'
import type { UseTableOptions } from '../types'

/**
 * useTable - TanStack Table wrapper hook
 * Manages table state (sorting, filters, pagination, row selection, column pinning)
 * Supports both uncontrolled (internal state) and controlled (external state) modes
 */
export function useTable<TData>({
  data,
  columns,
  enableSorting = false,
  manualSorting = false,
  enableRowSelection = false,
  enablePagination = false,
  enableColumnFilters = false,
  defaultPageSize = 10,
  initialColumnPinning,
  state: externalState,
  onSortingChange,
  onRowSelectionChange,
  onPaginationChange,
  onColumnFiltersChange,
  onColumnPinningChange,
  meta,
  getRowId,
}: UseTableOptions<TData>): Table<TData> {
  // Internal state (uncontrolled)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: defaultPageSize,
  })
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>(initialColumnPinning || {})

  // Build row models based on enabled features
  const rowModelOptions = [getCoreRowModel()]

  if (enableSorting) {
    rowModelOptions.push(getSortedRowModel())
  }
  if (enableColumnFilters) {
    rowModelOptions.push(getFilteredRowModel())
  }
  if (enablePagination) {
    rowModelOptions.push(getPaginationRowModel())
  }

  const table = useReactTable<TData>({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      rowSelection,
      pagination,
      columnPinning,
      ...externalState,
    },
    onSortingChange: onSortingChange || setSorting,
    onColumnFiltersChange: onColumnFiltersChange || setColumnFilters,
    onRowSelectionChange: onRowSelectionChange || setRowSelection,
    onPaginationChange: onPaginationChange || setPagination,
    onColumnPinningChange: onColumnPinningChange || setColumnPinning,
    meta,
    getRowId,
    enableSorting,
    manualSorting,
    enableRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting && !manualSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: enableColumnFilters ? getFilteredRowModel() : undefined,
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
  })

  return table
}
