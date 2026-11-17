import { describe, it, expect } from 'vitest'
import { render, screen, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { AfdsScope } from '../afds-scope'
import { useAfdsPortalContainer } from '../../hooks/use-afds-portal-container'
import { useResolvedPortalContainer } from '../../hooks/use-resolved-portal-container'

const wrap = ({ children }: { children: ReactNode }) => <AfdsScope>{children}</AfdsScope>

describe('AfdsScope', () => {
  it('.afds 루트와 [data-afds-portal] 타깃을 렌더한다', () => {
    render(
      <AfdsScope>
        <span>child</span>
      </AfdsScope>,
    )
    const root = screen.getByTestId('afds-scope')
    expect(root).toHaveClass('afds')
    expect(root.querySelector('[data-afds-portal]')).toBeInTheDocument()
    expect(screen.getByText('child')).toBeInTheDocument()
  })

  it('className 을 .afds 와 병합한다', () => {
    render(<AfdsScope className="custom">x</AfdsScope>)
    const root = screen.getByTestId('afds-scope')
    expect(root).toHaveClass('afds')
    expect(root).toHaveClass('custom')
  })

  it('useAfdsPortalContainer 는 부착된 포털 div element 를 반환한다', () => {
    const { result } = renderHook(() => useAfdsPortalContainer(), { wrapper: wrap })
    expect(result.current).not.toBeNull()
    expect(result.current).toHaveAttribute('data-afds-portal')
  })

  it('스코프 밖에서 useAfdsPortalContainer 는 null 을 반환한다', () => {
    const { result } = renderHook(() => useAfdsPortalContainer())
    expect(result.current).toBeNull()
  })
})

describe('useResolvedPortalContainer', () => {
  it('명시값이 컨텍스트보다 우선한다', () => {
    const el = document.createElement('div')
    const { result } = renderHook(() => useResolvedPortalContainer(el), { wrapper: wrap })
    expect(result.current).toBe(el)
  })

  it('명시값이 없으면 AfdsScope 컨텍스트 element 를 사용한다', () => {
    const { result } = renderHook(() => useResolvedPortalContainer(), { wrapper: wrap })
    expect(result.current).not.toBeUndefined()
    expect(result.current as HTMLElement).toHaveAttribute('data-afds-portal')
  })

  it('명시 null 은 컨텍스트를 무시하는 opt-out 이다(null 반환)', () => {
    const { result } = renderHook(() => useResolvedPortalContainer(null), { wrapper: wrap })
    expect(result.current).toBeNull()
  })

  it('스코프 밖 + 명시값 없음 → undefined (base-ui 기본 body)', () => {
    const { result } = renderHook(() => useResolvedPortalContainer())
    expect(result.current).toBeUndefined()
  })
})
