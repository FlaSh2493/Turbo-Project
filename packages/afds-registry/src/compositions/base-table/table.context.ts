'use client'

import { createContext, useContext } from 'react'
import type { Table } from '@tanstack/react-table'

/**
 * TableContext - Provides table instance to all Table sub-components
 */
export const TableContext = createContext<Table<unknown> | null>(null)

/**
 * useTableContext - Hook to access table instance from context
 * Must be called within Table.Root provider
 */
export function useTableContext<TData = unknown>() {
  const ctx = useContext(TableContext as React.Context<Table<TData> | null>)
  if (!ctx) {
    throw new Error('useTableContext must be used within Table.Root')
  }
  return ctx
}
