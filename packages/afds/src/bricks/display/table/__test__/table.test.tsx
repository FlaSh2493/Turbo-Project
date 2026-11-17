import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Table, TableRoot, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../table'

describe('Table', () => {
  it('Compound 패턴으로 올바른 HTML 구조를 렌더링한다', () => {
    const { container } = render(
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head>헤더</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Table.Row>
            <Table.Cell>셀</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table.Root>,
    )

    expect(container.querySelector('table')).toBeTruthy()
    expect(container.querySelector('thead')).toBeTruthy()
    expect(container.querySelector('tbody')).toBeTruthy()
    expect(container.querySelector('tr')).toBeTruthy()
    expect(container.querySelector('th')).toBeTruthy()
    expect(container.querySelector('td')).toBeTruthy()
  })

  it('data-slot 속성이 올바르게 설정된다', () => {
    const { container } = render(
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head>헤더</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Table.Row>
            <Table.Cell>셀</Table.Cell>
          </Table.Row>
        </Table.Body>
        <Table.Footer>
          <Table.Row>
            <Table.Cell>푸터</Table.Cell>
          </Table.Row>
        </Table.Footer>
      </Table.Root>,
    )

    expect(container.querySelector('[data-slot="table"]')).toBeTruthy()
    expect(container.querySelector('[data-slot="table-header"]')).toBeTruthy()
    expect(container.querySelector('[data-slot="table-body"]')).toBeTruthy()
    expect(container.querySelector('[data-slot="table-footer"]')).toBeTruthy()
    expect(container.querySelectorAll('[data-slot="table-row"]').length).toBe(3)
    expect(container.querySelector('[data-slot="table-head"]')).toBeTruthy()
    expect(container.querySelectorAll('[data-slot="table-cell"]').length).toBe(2)
  })

  it('className이 올바르게 전달된다', () => {
    const { container } = render(
      <TableRoot className="custom-table">
        <TableBody>
          <TableRow className="custom-row">
            <TableCell className="custom-cell">셀</TableCell>
          </TableRow>
        </TableBody>
      </TableRoot>,
    )

    expect(container.querySelector('table')?.className).toContain('custom-table')
    expect(container.querySelector('tr')?.className).toContain('custom-row')
    expect(container.querySelector('td')?.className).toContain('custom-cell')
  })

  it('개별 컴포넌트로도 동일하게 렌더링된다', () => {
    const { container } = render(
      <TableRoot>
        <TableHeader>
          <TableRow>
            <TableHead>헤더</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>셀</TableCell>
          </TableRow>
        </TableBody>
      </TableRoot>,
    )

    expect(container.querySelector('[data-slot="table"]')).toBeTruthy()
    expect(container.querySelector('[data-slot="table-header"]')).toBeTruthy()
    expect(container.querySelector('[data-slot="table-body"]')).toBeTruthy()
  })
})
