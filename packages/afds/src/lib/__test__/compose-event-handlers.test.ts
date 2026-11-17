import { describe, expect, it, vi } from 'vitest'
import { composeEventHandlers } from '../compose-event-handlers'

/** React.SyntheticEvent 의 defaultPrevented 계약만 흉내낸 최소 스텁. */
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

describe('composeEventHandlers', () => {
  it('소비자 핸들러를 먼저 실행하고 이어서 내부 핸들러를 실행한다', () => {
    const order: string[] = []
    const consumer = (_e: React.SyntheticEvent) => order.push('consumer')
    const internal = (_e: React.SyntheticEvent) => order.push('internal')

    composeEventHandlers(consumer, internal)(makeEvent())

    expect(order).toEqual(['consumer', 'internal'])
  })

  it('소비자가 preventDefault 를 부르면 내부 핸들러를 생략한다', () => {
    const internal = vi.fn()
    const consumer = (e: React.SyntheticEvent) => e.preventDefault()

    composeEventHandlers(consumer, internal)(makeEvent())

    expect(internal).not.toHaveBeenCalled()
  })

  it('이미 defaultPrevented 로 도착한 이벤트도 내부 핸들러를 생략한다', () => {
    const internal = vi.fn()
    const event = makeEvent()
    event.preventDefault()

    composeEventHandlers(undefined, internal)(event)

    expect(internal).not.toHaveBeenCalled()
  })

  it('checkForDefaultPrevented: false 면 preventDefault 여부와 무관하게 내부 핸들러를 실행한다', () => {
    const internal = vi.fn()
    const consumer = (e: React.SyntheticEvent) => e.preventDefault()

    composeEventHandlers(consumer, internal, { checkForDefaultPrevented: false })(makeEvent())

    expect(internal).toHaveBeenCalledTimes(1)
  })

  it('소비자 핸들러가 없어도 내부 핸들러는 실행된다', () => {
    const internal = vi.fn()

    composeEventHandlers(undefined, internal)(makeEvent())

    expect(internal).toHaveBeenCalledTimes(1)
  })

  it('두 핸들러 모두 같은 이벤트 객체를 받는다', () => {
    const event = makeEvent()
    const consumer = vi.fn()
    const internal = vi.fn()

    composeEventHandlers(consumer, internal)(event)

    expect(consumer).toHaveBeenCalledWith(event)
    expect(internal).toHaveBeenCalledWith(event)
  })
})

describe('composeEventHandlers — 이벤트가 아닌 콜백', () => {
  it('payload 가 null 이어도 크래시하지 않는다 (onValueChange 계열)', () => {
    const internal = vi.fn()

    expect(() => composeEventHandlers(vi.fn(), internal)(null)).not.toThrow()
    expect(internal).toHaveBeenCalledWith(null)
  })

  it('payload 가 undefined 여도 크래시하지 않는다 (onOpenChange 계열)', () => {
    const internal = vi.fn()

    expect(() => composeEventHandlers(vi.fn(), internal)(undefined)).not.toThrow()
    expect(internal).toHaveBeenCalledTimes(1)
  })

  it('인자를 전부 전달한다 (첫 인자만 넘기고 나머지를 버리지 않는다)', () => {
    const internal = vi.fn()

    composeEventHandlers(vi.fn(), internal)(1, 2, 3)

    expect(internal).toHaveBeenCalledWith(1, 2, 3)
  })

  it('원시 payload 는 defaultPrevented 검사를 건너뛴다', () => {
    const internal = vi.fn()

    composeEventHandlers(vi.fn(), internal)('some-value')

    expect(internal).toHaveBeenCalledWith('some-value')
  })
})
