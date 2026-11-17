import type * as React from 'react'
import { cn } from './utils'
import { composeEventHandlers } from './compose-event-handlers'

type AnyProps = Record<string, unknown>

const isEventHandlerName = (key: string) => /^on[A-Z]/.test(key)

/**
 * 브릭 내부 props(hook/aria props)와 소비자 props 를 AFDS 래핑 계약대로 병합한다.
 *
 * 스프레드 순서로는 반드시 한쪽이 사라진다 — 이 함수는 키 종류별로 규칙을 다르게 적용한다.
 *
 * - `on[A-Z]` 이벤트 핸들러 → {@link composeEventHandlers} 로 합성 (소비자 먼저,
 *   `preventDefault()` 시 내부 생략)
 * - `className` → `cn()` 으로 합성
 * - `style` → 얕게 병합, 겹치는 키는 소비자가 이김
 * - 그 외 → 소비자가 이김. 단 소비자 값이 `undefined` 면 내부 값을 유지한다
 *
 * `ref` 는 이 함수가 다루지 않는다 — `mergeRefs` 를 쓸 것.
 *
 * @param internalProps 브릭이 만들어낸 props (예: react-aria `buttonProps`, `rootProps`)
 * @param consumerProps 소비자가 넘긴 props
 */
export interface MergePropsOptions {
  /**
   * 소비자가 덮을 수 없는 키. 내부 배선용 값에 쓴다.
   *
   * 예: react-aria 의 `role` · `tabIndex` · `data-react-aria-pressable` 은 동작과
   * 접근성을 지탱한다. 소비자가 `role="presentation"` 을 넘기면 날짜 셀이 버튼이 아니게 되고
   * roving focus 도 깨진다 — prop 하나로 위젯이 조용히 망가지는 것은 이 계약이 막으려는 바로 그 실패다.
   */
  internalWins?: readonly string[]
}

export function mergeProps<T extends object, U extends object>(
  internalProps: T,
  consumerProps: U,
  { internalWins }: MergePropsOptions = {},
): T & U {
  const merged: AnyProps = { ...(internalProps as AnyProps) }

  for (const key of Object.keys(consumerProps)) {
    const internalValue = merged[key]
    const consumerValue = (consumerProps as AnyProps)[key]

    // 내부가 그 키를 주지 않았더라도 소비자가 채워 넣지 못한다. `internalValue !== undefined`
    // 로 조건을 걸면, 내부가 일부 경우에만 값을 주는 키(예: react-aria 는 일부 셀에만
    // tabIndex 를 단다)에서 보호가 조용히 꺼진다.
    if (internalWins?.includes(key)) continue

    // ref 는 mergeRefs 의 몫이다. 일반 키로 취급하면 소비자 ref 가 내부 ref 를 조용히 덮는다
    // (React 19 에서는 ref 가 일반 prop 이라 ...props 에 실려 온다).
    if (key === 'ref') continue

    if (isEventHandlerName(key)) {
      merged[key] = composeEventHandlers(
        consumerValue as ((...args: unknown[]) => void) | undefined,
        internalValue as ((...args: unknown[]) => void) | undefined,
      )
      continue
    }

    if (key === 'className') {
      merged[key] = cn(internalValue as string, consumerValue as string)
      continue
    }

    if (key === 'style') {
      merged[key] = {
        ...(internalValue as React.CSSProperties),
        ...(consumerValue as React.CSSProperties),
      }
      continue
    }

    // 소비자가 값을 주지 않은 키로 내부 값을 지우지 않는다.
    if (consumerValue === undefined) continue

    merged[key] = consumerValue
  }

  return merged as T & U
}
