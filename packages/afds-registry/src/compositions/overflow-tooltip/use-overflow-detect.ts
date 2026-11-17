'use client'

import { useCallback, useLayoutEffect, useState } from 'react'
import { isTextClamped, isTextTruncated } from './is-text-clamped'

/** 한 줄 말줄임은 가로(`inline`)로, 여러 줄 클램프는 세로(`block`)로 넘친다. */
export type OverflowAxis = 'inline' | 'block'

/**
 * 노드를 ref 가 아니라 **상태**로 들고 있다. 소비자가 직접 툴팁을 조립해 잘림이 감지된 노드가 트리거
 * 안쪽으로 들어가면 React 가 노드를 교체하는데(`OverflowTooltip` 자체는 교체하지 않는다), 마운트 시점에 캡처한 ref 는 죽은 노드(크기 0)를 계속 봐서 판정이
 * 거짓으로 되돌아가고 툴팁이 영영 붙지 않았다(소비처 앱 APT-15446). 상태로 두면 노드가
 * 바뀔 때 이펙트가 다시 돌아 관찰 대상도 갱신된다.
 *
 * `setNode` 는 대상 요소의 `ref` 에 그대로 넘긴다.
 */
export function useOverflowDetect(axis: OverflowAxis, text?: string) {
  const [node, setNode] = useState<HTMLElement | null>(null)
  const [overflow, setOverflow] = useState(false)

  // 호출 시점의 레이아웃으로 다시 잰다. ResizeObserver 가 놓치는 경우(폰트 교체)와 호출자가
  // 열리는 순간 확정 판정이 필요한 경우를 위해 노출한다.
  const measure = useCallback(() => {
    if (!node) return false
    const next = axis === 'block' ? isTextClamped(node) : isTextTruncated(node)
    setOverflow(next)
    return next
  }, [node, axis])

  // `text` 는 읽지 않지만 내용이 바뀌면 다시 재야 하므로 의존성에 둔다.
  useLayoutEffect(() => {
    // 노드가 해제되면 이전 판정을 남기지 않는다 — 조건부로 렌더하는 소비자가 낡은 true 를 받는다.
    if (!node) {
      setOverflow(false)
      return
    }
    measure()

    // ResizeObserver 가 없는 환경(구형 브라우저·일부 테스트 런타임)에서도 렌더가 throw 하지 않아야 한다.
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    observer?.observe(node)

    // 폰트가 늦게 오면 첫 판정이 틀린다. 폴백 글꼴로는 들어가고 웹폰트로는 넘쳐도 잘린 요소의
    // 크기는 그대로라 관찰자가 깨지 않는다(바뀌는 건 scroll 크기뿐이다).
    let disposed = false
    document.fonts?.ready.then(() => {
      if (!disposed) measure()
    })

    return () => {
      disposed = true
      observer?.disconnect()
    }
  }, [node, measure, text])

  return { node, setNode, overflow, measure }
}
