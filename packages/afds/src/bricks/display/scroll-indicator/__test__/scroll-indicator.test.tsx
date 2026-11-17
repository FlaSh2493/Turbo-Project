import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import { useRef } from 'react'
import { ScrollIndicator } from '../scroll-indicator'

vi.mock('../hooks', () => ({
  useContainerScroll: vi.fn(),
}))

import { useContainerScroll } from '../hooks'

const mockUseContainerScroll = vi.mocked(useContainerScroll)

const ResizeObserverMock = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverMock)
})

afterEach(() => {
  vi.restoreAllMocks()
})

function TestWrapper({
  scrollLeft = 0,
  scrollWidth = 100,
  clientWidth = 100,
  className,
}: {
  scrollLeft?: number
  scrollWidth?: number
  clientWidth?: number
  className?: string
}) {
  mockUseContainerScroll.mockReturnValue({ scrollLeft, scrollWidth, clientWidth })

  const ref = useRef<HTMLDivElement>(null)
  return <ScrollIndicator scrollContainerRef={ref} className={className} />
}

describe('ScrollIndicator', () => {
  describe('렌더링', () => {
    it('scrollWidth === clientWidth이면 null을 반환한다 (스크롤 불가)', () => {
      const { container } = render(<TestWrapper scrollWidth={500} clientWidth={500} />)
      expect(container.firstChild).toBeNull()
    })

    it('scrollWidth < clientWidth이면 null을 반환한다', () => {
      const { container } = render(<TestWrapper scrollWidth={300} clientWidth={500} />)
      expect(container.firstChild).toBeNull()
    })

    it('scrollWidth > clientWidth이면 인디케이터를 렌더링한다', () => {
      const { container } = render(<TestWrapper scrollWidth={800} clientWidth={500} />)
      expect(container.querySelector('[data-slot="scroll-indicator"]')).toBeInTheDocument()
    })

    it('data-slot="scroll-indicator" 속성이 존재한다', () => {
      const { container } = render(<TestWrapper scrollWidth={800} clientWidth={500} />)
      expect(container.querySelector('[data-slot="scroll-indicator"]')).toBeInTheDocument()
    })
  })

  describe('Props', () => {
    it('className이 루트 요소에 병합된다', () => {
      const { container } = render(
        <TestWrapper scrollWidth={800} clientWidth={500} className="bottom-[16px] right-0" />,
      )
      const el = container.querySelector('[data-slot="scroll-indicator"]') as HTMLElement
      expect(el.className).toContain('bottom-[16px]')
      expect(el.className).toContain('right-0')
    })
  })
})
