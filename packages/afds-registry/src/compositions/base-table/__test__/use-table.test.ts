import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import type { ColumnDef } from '@tanstack/react-table'
import { useTable } from '../hooks/use-table'

interface TestData {
  id: string
  name: string
  email: string
}

describe('useTable', () => {
  let testData: TestData[]
  let columns: ColumnDef<TestData>[]

  beforeEach(() => {
    testData = [
      { id: '1', name: 'John', email: 'john@example.com' },
      { id: '2', name: 'Jane', email: 'jane@example.com' },
    ]

    columns = [
      { id: 'id', accessorKey: 'id', header: 'ID' },
      { id: 'name', accessorKey: 'name', header: 'Name' },
      { id: 'email', accessorKey: 'email', header: 'Email' },
    ]
  })

  it('creates a table instance with data and columns', () => {
    const { result } = renderHook(() =>
      useTable({
        data: testData,
        columns,
      }),
    )

    expect(result.current).toBeDefined()
    expect(result.current.getRowModel().rows).toHaveLength(2)
  })

  it('returns correct row count', () => {
    const { result } = renderHook(() =>
      useTable({
        data: testData,
        columns,
      }),
    )

    const rows = result.current.getRowModel().rows
    expect(rows).toHaveLength(2)
    expect(rows[0].original.name).toBe('John')
    expect(rows[1].original.name).toBe('Jane')
  })

  it('enables sorting when enableSorting is true', () => {
    const { result } = renderHook(() =>
      useTable({
        data: testData,
        columns,
        enableSorting: true,
      }),
    )

    const nameColumn = result.current.getColumn('name')
    expect(nameColumn?.getCanSort()).toBe(true)
  })

  it('enables pagination when enablePagination is true', () => {
    const { result } = renderHook(() =>
      useTable({
        data: testData,
        columns,
        enablePagination: true,
        defaultPageSize: 1,
      }),
    )

    expect(result.current.getState().pagination.pageSize).toBe(1)
    const rows = result.current.getRowModel().rows
    expect(rows).toHaveLength(1)
  })

  it('enables row selection when enableRowSelection is true', () => {
    const { result } = renderHook(() =>
      useTable({
        data: testData,
        columns,
        enableRowSelection: true,
      }),
    )

    const firstRow = result.current.getRowModel().rows[0]
    expect(firstRow.getCanSelect()).toBe(true)
  })

  it('applies initial column pinning state', () => {
    const { result } = renderHook(() =>
      useTable({
        data: testData,
        columns,
        enableColumnPinning: true,
        initialColumnPinning: { left: ['id'] },
      }),
    )

    expect(result.current.getState().columnPinning).toEqual({ left: ['id'] })
  })

  it('returns default pagination state', () => {
    const { result } = renderHook(() =>
      useTable({
        data: testData,
        columns,
        enablePagination: true,
      }),
    )

    const state = result.current.getState().pagination
    expect(state.pageIndex).toBe(0)
    expect(state.pageSize).toBe(10)
  })

  it('uses custom default page size', () => {
    const { result } = renderHook(() =>
      useTable({
        data: testData,
        columns,
        enablePagination: true,
        defaultPageSize: 5,
      }),
    )

    expect(result.current.getState().pagination.pageSize).toBe(5)
  })
})
