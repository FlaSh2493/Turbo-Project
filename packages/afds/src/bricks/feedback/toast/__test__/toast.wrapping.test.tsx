import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Toast } from '../toast'

describe('Toast 래핑 계약', () => {
  it('소비자가 onAnimationEnd 를 넘겨도 닫힌 토스트의 onRemove 가 호출된다', () => {
    const track = vi.fn()
    const onRemove = vi.fn()
    render(
      <Toast.Root open={false} onRemove={onRemove} onAnimationEnd={track}>
        <Toast.Content>알림</Toast.Content>
      </Toast.Root>,
    )

    fireEvent.animationEnd(screen.getByRole('alert'))

    expect(track).toHaveBeenCalledTimes(1)
    expect(onRemove).toHaveBeenCalledTimes(1)
  })

  it('소비자가 onAnimationEnd 를 넘겨도 onAnimationComplete 가 호출된다', () => {
    const track = vi.fn()
    const onAnimationComplete = vi.fn()
    render(
      <Toast.Root onAnimationComplete={onAnimationComplete} onAnimationEnd={track}>
        <Toast.Content>알림</Toast.Content>
      </Toast.Root>,
    )

    fireEvent.animationEnd(screen.getByRole('alert'))

    expect(track).toHaveBeenCalledTimes(1)
    expect(onAnimationComplete).toHaveBeenCalledTimes(1)
  })
})

describe('Toast — animationend 는 취소 불가 이벤트다', () => {
  it('소비자가 preventDefault 를 호출해도 onRemove 가 호출된다', () => {
    const onRemove = vi.fn()
    render(
      <Toast.Root open={false} onRemove={onRemove} onAnimationEnd={e => e.preventDefault()}>
        <Toast.Content>알림</Toast.Content>
      </Toast.Root>,
    )

    fireEvent.animationEnd(screen.getByRole('alert'))

    // animationend 에는 기본 동작이 없으므로 preventDefault 가 내부 정리를 막으면 안 된다.
    // 막히면 토스트가 영구히 제거되지 않는다 (이 PR 이 고친 결함 #6 의 재발).
    expect(onRemove).toHaveBeenCalledTimes(1)
  })
})
