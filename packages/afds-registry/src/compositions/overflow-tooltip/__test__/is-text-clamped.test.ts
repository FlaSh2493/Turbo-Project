import { describe, expect, it } from 'vitest'
import { isTextClamped, isTextTruncated } from '../is-text-clamped'

describe('isTextClamped — 여러 줄 클램프(세로)', () => {
  it('scrollHeight 가 clientHeight 보다 크면 클램프된 것이다', () => {
    expect(isTextClamped({ scrollHeight: 48, clientHeight: 40 })).toBe(true)
  })
  it('같으면 클램프되지 않은 것이다', () => {
    expect(isTextClamped({ scrollHeight: 24, clientHeight: 24 })).toBe(false)
  })
})

describe('isTextTruncated — 한 줄 말줄임(가로)', () => {
  it('scrollWidth 가 clientWidth 보다 크면 잘린 것이다', () => {
    expect(isTextTruncated({ scrollWidth: 200, clientWidth: 100 })).toBe(true)
  })
  it('같으면 잘리지 않은 것이다', () => {
    expect(isTextTruncated({ scrollWidth: 100, clientWidth: 100 })).toBe(false)
  })
})
