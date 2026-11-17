import { describe, expect, it, vi } from 'vitest'
import { mergeProps } from '../merge-props'

const makeEvent = () => {
  let prevented = false
  return {
    get defaultPrevented() {
      return prevented
    },
    preventDefault() {
      prevented = true
    },
  } as unknown as React.SyntheticEvent
}

describe('mergeProps', () => {
  it('같은 이벤트 핸들러는 덮어쓰지 않고 합성한다 (소비자 먼저)', () => {
    const order: string[] = []
    const merged = mergeProps(
      { onClick: (_e: React.SyntheticEvent) => order.push('internal') },
      { onClick: (_e: React.SyntheticEvent) => order.push('consumer') },
    )

    merged.onClick(makeEvent())

    expect(order).toEqual(['consumer', 'internal'])
  })

  it('소비자가 preventDefault 를 부르면 내부 핸들러를 생략한다', () => {
    const internal = vi.fn()
    const merged = mergeProps(
      { onKeyDown: internal },
      { onKeyDown: (e: React.SyntheticEvent) => e.preventDefault() },
    )

    merged.onKeyDown(makeEvent())

    expect(internal).not.toHaveBeenCalled()
  })

  it('한쪽에만 있는 핸들러는 그대로 유지된다', () => {
    const onFocus = vi.fn()
    const onBlur = vi.fn()
    const merged = mergeProps({ onFocus }, { onBlur })

    merged.onFocus(makeEvent())
    merged.onBlur(makeEvent())

    expect(onFocus).toHaveBeenCalledTimes(1)
    expect(onBlur).toHaveBeenCalledTimes(1)
  })

  it('이벤트가 아닌 값은 소비자가 이긴다', () => {
    const merged = mergeProps({ 'aria-label': '내부', tabIndex: -1 }, { 'aria-label': '소비자' })

    expect(merged['aria-label']).toBe('소비자')
    expect(merged.tabIndex).toBe(-1)
  })

  it('className 은 덮어쓰지 않고 합성한다', () => {
    const merged = mergeProps({ className: 'text-sm' }, { className: 'font-bold' })

    expect(merged.className).toContain('text-sm')
    expect(merged.className).toContain('font-bold')
  })

  it('style 은 얕게 병합하고 겹치면 소비자가 이긴다', () => {
    const merged = mergeProps({ style: { color: 'red', margin: 0 } }, { style: { color: 'blue' } })

    expect(merged.style).toEqual({ color: 'blue', margin: 0 })
  })

  it('소비자가 undefined 를 명시해도 내부 값을 지우지 않는다', () => {
    const merged = mergeProps({ 'aria-label': '내부' }, { 'aria-label': undefined })

    expect(merged['aria-label']).toBe('내부')
  })
})

describe('mergeProps — ref', () => {
  it('ref 는 병합하지 않는다 (mergeRefs 의 몫이라 문서화되어 있다)', () => {
    const internalRef = () => {}
    const consumerRef = () => {}

    const merged = mergeProps({ ref: internalRef }, { ref: consumerRef })

    expect(merged.ref).toBe(internalRef)
  })
})
