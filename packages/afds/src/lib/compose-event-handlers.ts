export interface ComposeEventHandlersOptions {
  /**
   * 소비자 핸들러가 `event.preventDefault()` 를 호출하면 내부 핸들러를 생략할지 여부.
   *
   * @default true
   */
  checkForDefaultPrevented?: boolean
}

/**
 * 소비자 핸들러와 브릭 내부 핸들러를 하나로 합성한다.
 *
 * 래핑 계약: **소비자 먼저 실행하고, 소비자가 `preventDefault()` 를 호출했으면 내부를 생략한다.**
 * Radix UI 의 `composeEventHandlers` 와 동일한 규약이며, 소비자에게 내부 동작을 막을 수 있는
 * 명시적 escape hatch 를 주면서도 아무것도 하지 않으면 내부 동작이 보존되게 한다.
 *
 * `{...props}` 의 스프레드 순서로 이 문제를 해결하려 하지 마라 — 순서로는 한쪽이 반드시 사라진다.
 *
 * @example
 * ```tsx
 * <Menu.Item onClick={composeEventHandlers(props.onClick, handleSelect)} {...props} />
 * // ⚠️ 합성한 핸들러는 반드시 {...props} 뒤에 두거나, 해당 prop 을 구조분해로 빼내야 한다.
 * ```
 */
export function composeEventHandlers<Args extends unknown[]>(
  consumerHandler: ((...args: Args) => void) | undefined,
  internalHandler: ((...args: Args) => void) | undefined,
  { checkForDefaultPrevented = true }: ComposeEventHandlersOptions = {},
): (...args: Args) => void {
  return function composedEventHandler(...args: Args) {
    consumerHandler?.(...args)

    if (checkForDefaultPrevented && isDefaultPrevented(args[0])) return

    internalHandler?.(...args)
  }
}

/**
 * 첫 인자가 **이벤트처럼 생겼을 때만** defaultPrevented 를 본다.
 *
 * `on[A-Z]` 이름 규칙은 DOM 이벤트뿐 아니라 `onValueChange(string)` ·
 * `onOpenChange(boolean)` 같은 디자인 시스템 콜백도 잡는다. 그런 콜백에 대고
 * `event.defaultPrevented` 를 읽으면 payload 가 null/undefined 일 때 그대로 크래시한다.
 */
function isDefaultPrevented(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    'defaultPrevented' in value &&
    (value as { defaultPrevented: unknown }).defaultPrevented === true
  )
}
