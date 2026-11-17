'use client'

import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react'
import { BaseTooltip as Tooltip, type BaseTooltipProps as TooltipProps } from '../base-tooltip'
import { composeEventHandlers } from '@turbo-project/afds/lib/compose-event-handlers'
import { cn } from '@turbo-project/afds/lib/utils'
import { useOverflowDetect, type OverflowAxis } from './use-overflow-detect'

type OverflowTooltipProps = Omit<TooltipProps, 'content'> & {
  content?: TooltipProps['content']
  className?: string
  /** 넘치는 방향. 한 줄 말줄임은 `inline`, 여러 줄 line-clamp 는 `block`. */
  axis?: OverflowAxis
}

export const OverflowTooltip = forwardRef<HTMLSpanElement, OverflowTooltipProps>(
  ({ children, content, className, axis = 'inline', ...props }, forwardedRef) => {
    const { setNode, measure } = useOverflowDetect(
      axis,
      typeof children === 'string' ? children : undefined,
    )
    // 소비자 ref 는 첫 커밋부터 요소를 봐야 한다. 훅의 node 는 상태라 첫 커밋 시점에는 아직 null 이므로,
    // 핸들은 ref 객체에서 읽고 상태 갱신(`setNode`)은 같은 콜백 ref 가 따로 한다.
    const innerRef = useRef<HTMLSpanElement | null>(null)
    useImperativeHandle(forwardedRef, () => innerRef.current as HTMLSpanElement, [])
    const attach = useCallback(
      (el: HTMLSpanElement | null) => {
        innerRef.current = el
        setNode(el)
      },
      [setNode],
    )
    const [open, setOpen] = useState(false)

    const handleOpenChange = (next: boolean) => {
      if (!next) {
        setOpen(false)
        return
      }
      // 열리는 순간의 레이아웃으로 확정한다 — 관찰자 상태는 한 박자 늦을 수 있다.
      if (measure()) setOpen(true)
    }

    return (
      <Tooltip
        content={content ?? children}
        {...props}
        // `open`·`onOpenChange` 는 소비자 props 와 **같은 키**라 스프레드 순서로 해결하지 않는다
        // (래핑 계약 5항). 예전에는 `{...props}` 가 뒤에 있어서 소비자가 둘 중 하나만 넘겨도
        // overflow 감지가 통째로 죽었다 — 이 컴포지션의 존재 이유가 사라지는 결함이었다.
        //
        // `open`: 소비자가 **명시적으로** 넘겼을 때만 소비자가 이긴다(제어 컴포넌트로 전환).
        //   넘기지 않으면 overflow 감지 결과를 쓴다. 둘 중 누구도 조용히 무시되지 않는다.
        // `onOpenChange`: 합성한다. 소비자 콜백이 먼저 돌고 내부 감지가 이어진다.
        open={props.open ?? open}
        // `composeEventHandlers` 는 **루트에서** 가져온다. 컴포지션은 `afds-registry` 로 소비처에
        // 복사되므로 import 가 소비처에서 해소돼야 한다:
        //   - `'@turbo-project/afds'` (루트) → 그대로 남고 소비처에서 해소된다. transform 불필요.
        //   - `'../../lib/compose-event-handlers'` (깊은 상대경로) → 치환 규칙이 없어
        //     레지스트리 생성기가 막는다.
        //
        // **현재 관례가 루트 import 라는 것이지 이것이 유일한 정답이라는 뜻은 아니다.**
        // 서브패스 방향(`@turbo-project/afds/lib/*`)에도 근거가 있다 — `cn` 이 이미
        // `@turbo-project/afds/lib/utils` 로 나가므로 배포 산출물 이디엄과는 그쪽이 일치한다.
        // 두 방향의 통일은 이슈에서 검토 중이다.
        // 인라인 사본도 쓰지 않는다 — 계약이 바뀌면 컴포지션마다 조용히 드리프트한다.
        //
        // boolean 인자라 `defaultPrevented` 개념이 없으므로 그 검사는 끈다.
        onOpenChange={composeEventHandlers(props.onOpenChange, handleOpenChange, {
          checkForDefaultPrevented: false,
        })}
      >
        {/* `block` 은 `truncate`(nowrap) 를 빼야 줄바꿈이 살아 line-clamp 가 동작한다. 클램프 클래스는 className 으로 준다. */}
        <span ref={attach} className={cn(axis === 'inline' && 'truncate', className)}>
          {children}
        </span>
      </Tooltip>
    )
  },
)

OverflowTooltip.displayName = 'OverflowTooltip'
