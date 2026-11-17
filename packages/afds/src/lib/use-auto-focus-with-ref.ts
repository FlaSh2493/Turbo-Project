import * as React from 'react'

/**
 * 마운트 시 자동 포커스하면서, 전달받은 ref 도 해당 노드로 연결한다.
 *
 * 이 둘은 **서로 무관한 관심사**다. 하나의 effect 안에서 object/function ref 를 분기하다가
 * 한쪽 경로에서 early return 하면 자동 포커스가 통째로 사라진다 — 실제로 Select.Search 와
 * MultiSelect.Search 가 그랬다: ref 를 넘기지 않으면 포커스되고 `useRef` 로 만든 object ref 를
 * 넘기면 포커스가 안 됐다. 그래서 effect 를 분리하고, 두 컴포넌트가 같은 구현을 공유한다.
 *
 * @param forwardedRef 소비자가 넘긴 ref (object · function · 없음)
 * @returns 대상 엘리먼트에 붙일 내부 ref
 */
export function useAutoFocusWithRef<T extends HTMLElement>(forwardedRef: React.Ref<T> | undefined) {
  const innerRef = React.useRef<T>(null)

  React.useEffect(() => {
    innerRef.current?.focus({ preventScroll: true })
  }, [])

  React.useEffect(() => {
    if (!forwardedRef) return

    const node = innerRef.current

    if (typeof forwardedRef === 'function') {
      forwardedRef(node)
      return () => forwardedRef(null)
    }

    const objectRef = forwardedRef as React.MutableRefObject<T | null>
    objectRef.current = node
    return () => {
      objectRef.current = null
    }
  }, [forwardedRef])

  return innerRef
}
