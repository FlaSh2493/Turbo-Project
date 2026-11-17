import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { ComplexFilter } from '..'
import * as context from '../complex-filter.context'
import { FIELDS, kw } from './test-utils'

vi.mock('../complex-filter.context', async importOriginal => {
  const actual = await importOriginal<typeof import('../complex-filter.context')>()
  return { ...actual, useComplexFilterContext: vi.fn(actual.useComplexFilterContext) }
})

const CHIPS = [kw('a', '여름')]
const onChange = vi.fn()
const onClear = vi.fn()

function Parent() {
  const [tick, setTick] = useState(0)
  return (
    <>
      <button type="button" onClick={() => setTick(tick + 1)}>
        무관한 상태 {tick}
      </button>
      <ComplexFilter.Root fields={FIELDS} chips={CHIPS} onChange={onChange} onClear={onClear} />
    </>
  )
}

describe('컨텍스트 재렌더', () => {
  it('Root 의 부모가 무관한 상태로 다시 그려져도 같은 props 면 파트는 다시 그려지지 않는다', () => {
    // Given
    render(<Parent />)
    const hook = vi.mocked(context.useComplexFilterContext)
    const mounted = hook.mock.calls.length
    expect(mounted).toBeGreaterThan(0)

    // When
    fireEvent.click(screen.getByRole('button', { name: /무관한 상태/ }))

    // Then
    expect(screen.getByRole('button', { name: '무관한 상태 1' })).toBeInTheDocument()
    expect(hook.mock.calls.length).toBe(mounted)
  })

  it('입력처럼 실제 상태가 바뀌면 파트가 다시 그려진다', () => {
    // Given
    render(<Parent />)
    const hook = vi.mocked(context.useComplexFilterContext)
    const mounted = hook.mock.calls.length

    // When
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'x' } })

    // Then
    expect(hook.mock.calls.length).toBeGreaterThan(mounted)
  })
})
