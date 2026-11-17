import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ColumnDef } from '@tanstack/react-table'
import { useTable } from '../hooks/use-table'
import { BaseTable } from '../table'

interface TestData {
  id: string
  name: string
}

const TestTable = ({ data }: { data: TestData[] }) => {
  const columns: ColumnDef<TestData>[] = [
    { id: 'id', accessorKey: 'id', header: 'ID' },
    { id: 'name', accessorKey: 'name', header: 'Name' },
  ]

  const table = useTable({
    data,
    columns,
    enableSorting: true,
    enableRowSelection: true,
  })

  return (
    <BaseTable.Root table={table}>
      <BaseTable.Header />
      <BaseTable.Body />
    </BaseTable.Root>
  )
}

describe('BaseTable Component', () => {
  const testData: TestData[] = [
    { id: '1', name: 'John' },
    { id: '2', name: 'Jane' },
  ]

  it('renders grid with column headers', () => {
    const { container } = render(<TestTable data={testData} />)
    const grid = container.querySelector('[role="grid"]')
    expect(grid).toBeTruthy()

    const headers = container.querySelectorAll('[role="columnheader"]')
    expect(headers).toHaveLength(2)
  })

  it('renders rows and gridcells in the body', () => {
    const { container } = render(<TestTable data={testData} />)

    const body = container.querySelector('[data-slot="base-table-body"]')
    expect(body).toBeTruthy()

    const rows = body!.querySelectorAll('[role="row"]')
    expect(rows).toHaveLength(2)

    const cells = body!.querySelectorAll('[role="gridcell"]')
    expect(cells.length).toBeGreaterThanOrEqual(4)
  })

  it('renders row data correctly', () => {
    render(<TestTable data={testData} />)

    expect(screen.getByText('John')).toBeTruthy()
    expect(screen.getByText('Jane')).toBeTruthy()
  })

  it('renders empty table with no data', () => {
    const { container } = render(<TestTable data={[]} />)

    const body = container.querySelector('[data-slot="base-table-body"]')
    const rows = body?.querySelectorAll('[role="row"]') ?? []
    expect(rows).toHaveLength(0)
  })

  it('applies correct data-slot attributes', () => {
    const { container } = render(<TestTable data={testData} />)

    const root = container.querySelector('[data-slot="base-table"]')
    const header = container.querySelector('[data-slot="base-table-header"]')
    const body = container.querySelector('[data-slot="base-table-body"]')

    expect(root).toBeTruthy()
    expect(header).toBeTruthy()
    expect(body).toBeTruthy()
  })
})
