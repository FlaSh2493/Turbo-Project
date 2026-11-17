import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render } from '@testing-library/react'
import { useOverflowDetect, type OverflowAxis } from '../use-overflow-detect'

/** jsdom 은 레이아웃을 계산하지 않는다 — 크기를 직접 만들어 준다. */
const size = (
  el: Element,
  v: Partial<Record<'scrollWidth' | 'clientWidth' | 'scrollHeight' | 'clientHeight', number>>,
) =>
  Object.entries(v).forEach(([k, value]) =>
    Object.defineProperty(el, k, { configurable: true, value }),
  )

const observers: { cb: () => void; target?: Element; disconnect: ReturnType<typeof vi.fn> }[] = []
let fontsResolve: () => void
const original = {
  RO: global.ResizeObserver,
  fonts: Object.getOwnPropertyDescriptor(document, 'fonts'),
}

beforeEach(() => {
  observers.length = 0
  global.ResizeObserver = class {
    entry = { cb: () => {}, target: undefined as Element | undefined, disconnect: vi.fn() }
    constructor(cb: () => void) {
      this.entry.cb = cb
      observers.push(this.entry)
    }
    observe(t: Element) {
      this.entry.target = t
    }
    unobserve() {}
    disconnect() {
      this.entry.disconnect()
    }
  } as unknown as typeof ResizeObserver
  Object.defineProperty(document, 'fonts', {
    configurable: true,
    value: { ready: new Promise<void>(r => (fontsResolve = r)) },
  })
})

afterEach(() => {
  vi.restoreAllMocks()
  global.ResizeObserver = original.RO
  if (original.fonts) Object.defineProperty(document, 'fonts', original.fonts)
  else delete (document as { fonts?: unknown }).fonts
})

function Probe({
  axis = 'inline',
  swap = false,
  text = 'text',
  hidden = false,
}: {
  axis?: OverflowAxis
  swap?: boolean
  text?: string
  hidden?: boolean
}) {
  const { setNode, overflow } = useOverflowDetect(axis, text)
  // key 가 바뀌면 React 가 노드를 교체한다 — 툴팁 트리거 안으로 들어갈 때와 같은 상황이다.
  return (
    <div>
      {!hidden && <span key={swap ? 'b' : 'a'} ref={setNode} data-testid="node" />}
      <output data-testid="out">{String(overflow)}</output>
    </div>
  )
}
const out = (c: HTMLElement) => c.querySelector('[data-testid="out"]')!.textContent

describe('useOverflowDetect', () => {
  it('마운트 직후 한 번 재서 잘림을 반영한다 (inline)', () => {
    const proto = HTMLElement.prototype
    vi.spyOn(proto, 'scrollWidth', 'get').mockReturnValue(200)
    vi.spyOn(proto, 'clientWidth', 'get').mockReturnValue(100)
    const { container } = render(<Probe />)
    expect(out(container)).toBe('true')
  })

  it('block 축은 세로 크기를 본다', () => {
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(80)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(40)
    const { container } = render(<Probe axis="block" />)
    expect(out(container)).toBe('true')
  })

  it('ResizeObserver 콜백이 오면 다시 잰다', () => {
    const { container, getByTestId } = render(<Probe />)
    expect(out(container)).toBe('false')
    size(getByTestId('node'), { scrollWidth: 200, clientWidth: 100 })
    act(() => observers[0].cb())
    expect(out(container)).toBe('true')
  })

  it('폰트 로딩이 끝나면 크기 변화 없이도 다시 잰다', async () => {
    const { container, getByTestId } = render(<Probe />)
    size(getByTestId('node'), { scrollWidth: 200, clientWidth: 100 })
    expect(out(container)).toBe('false')
    await act(async () => {
      fontsResolve()
      await Promise.resolve()
    })
    expect(out(container)).toBe('true')
  })

  it('언마운트 뒤에 폰트가 끝나도 다시 재지 않고 관찰자를 해제한다', async () => {
    const reads = vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(0)
    const { unmount } = render(<Probe />)
    unmount()
    expect(observers[0].disconnect).toHaveBeenCalled()
    const before = reads.mock.calls.length
    await act(async () => {
      fontsResolve()
      await Promise.resolve()
    })
    expect(reads.mock.calls.length).toBe(before)
  })

  it('text 가 바뀌면 다시 잰다', () => {
    const reads = vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(0)
    const { rerender } = render(<Probe text="a" />)
    const before = reads.mock.calls.length
    rerender(<Probe text="b" />)
    expect(reads.mock.calls.length).toBeGreaterThan(before)
  })

  it('text 가 그대로면 리렌더만으로는 다시 재지 않는다', () => {
    const reads = vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(0)
    const { rerender } = render(<Probe text="a" />)
    const before = reads.mock.calls.length
    rerender(<Probe text="a" />)
    expect(reads.mock.calls.length).toBe(before)
  })

  it('ResizeObserver 가 없는 환경에서도 렌더가 throw 하지 않고 마운트 판정은 한다', () => {
    // @ts-expect-error 전역을 지워 미지원 환경을 만든다 — afterEach 가 복원한다
    delete global.ResizeObserver
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(200)
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(100)
    let container!: HTMLElement
    expect(() => ({ container } = render(<Probe />))).not.toThrow()
    expect(out(container)).toBe('true')
  })

  it('노드가 교체돼도 새 노드를 관찰하고 판정을 이어 간다 (APT-15446)', () => {
    const { container, rerender } = render(<Probe />)
    const first = observers[0].target
    rerender(<Probe swap />)
    const second = observers.at(-1)!.target
    expect(second).toBeDefined()
    expect(second).not.toBe(first)
    expect(first!.isConnected).toBe(false)
    expect(second!.isConnected).toBe(true)
    expect(observers[0].disconnect).toHaveBeenCalled()

    size(second!, { scrollWidth: 200, clientWidth: 100 })
    act(() => observers.at(-1)!.cb())
    expect(out(container)).toBe('true')
  })

  it('노드가 해제되면 이전의 true 를 남기지 않는다', () => {
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(200)
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(100)
    const { container, rerender } = render(<Probe />)
    expect(out(container)).toBe('true')
    rerender(<Probe hidden />)
    expect(out(container)).toBe('false')
  })
})
