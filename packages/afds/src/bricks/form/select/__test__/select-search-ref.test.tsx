import { describe, it, expect } from 'vitest'
import * as React from 'react'
import { render, screen } from '@testing-library/react'
import { Select } from '../select'
import { MultiSelect } from '../../multi-select/multi-select'

/**
 * ref 를 넘기는 것과 자동 포커스는 서로 무관한 관심사여야 한다.
 * 기존 구현은 object ref 경로에서 early return 하여 focus() 에 도달하지 못했고,
 * cleanup(ref.current = null) 도 없었다.
 */
const cases = [
  { name: 'Select.Search', Search: Select.Search },
  { name: 'MultiSelect.Search', Search: MultiSelect.Search },
] as const

describe.each(cases)('$name ref 계약', ({ Search }) => {
  it('object ref 를 넘겨도 자동 포커스된다', () => {
    const Harness = () => {
      const ref = React.useRef<HTMLInputElement>(null)
      return <Search ref={ref} value="" onChange={() => {}} placeholder="검색" />
    }
    render(<Harness />)

    expect(screen.getByPlaceholderText('검색')).toHaveFocus()
  })

  it('ref 를 넘기지 않아도 자동 포커스된다', () => {
    render(<Search value="" onChange={() => {}} placeholder="검색" />)

    expect(screen.getByPlaceholderText('검색')).toHaveFocus()
  })

  it('function ref 를 넘겨도 자동 포커스된다', () => {
    render(<Search ref={() => {}} value="" onChange={() => {}} placeholder="검색" />)

    expect(screen.getByPlaceholderText('검색')).toHaveFocus()
  })

  it('object ref 가 input 엘리먼트를 가리킨다', () => {
    const ref = React.createRef<HTMLInputElement>()
    render(<Search ref={ref} value="" onChange={() => {}} placeholder="검색" />)

    expect(ref.current).toBe(screen.getByPlaceholderText('검색'))
  })

  it('언마운트 시 object ref 가 null 로 정리된다', () => {
    const ref = React.createRef<HTMLInputElement>()
    const { unmount } = render(<Search ref={ref} value="" onChange={() => {}} placeholder="검색" />)

    unmount()

    expect(ref.current).toBeNull()
  })
})
