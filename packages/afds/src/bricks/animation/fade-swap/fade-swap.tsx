'use client'

import { forwardRef, type CSSProperties, type ReactElement, useRef, useState } from 'react'
import { cn } from '../../../lib/utils'

export interface FadeSwapProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactElement
  duration?: number
  /**
   * 최초 mount 시에도 enter 애니메이션을 실행한다.
   * 기본값은 `false` — 첫 렌더는 즉시 표시되고, 이후 children.key 변경 시에만 swap 애니메이션이 돈다.
   * @default false
   */
  animateOnMount?: boolean
}

type Phase = 'visible' | 'exiting' | 'entering'

const ANIMATION: Record<Exclude<Phase, 'visible'>, (duration: number) => CSSProperties> = {
  exiting: duration =>
    ({ animation: `exit ${duration}ms ease-in both`, '--tw-exit-opacity': '0' }) as CSSProperties,
  entering: duration =>
    ({
      animation: `enter ${duration}ms ease-out both`,
      '--tw-enter-opacity': '0',
    }) as CSSProperties,
}

export const FadeSwap = forwardRef<HTMLDivElement, FadeSwapProps>(
  (
    { children, className, duration = 200, animateOnMount = false, onAnimationEnd, ...props },
    ref,
  ) => {
    const childKey = children.key ?? ''

    const [phase, setPhase] = useState<Phase>(animateOnMount ? 'entering' : 'visible')
    const [displayed, setDisplayed] = useState<ReactElement>(children)
    const pendingRef = useRef<ReactElement | null>(null)

    // 아래 두 `pendingRef.current = …` 는 **렌더 중 ref 쓰기**다(react-doctor
    // `no-ref-current-in-render`). React 가 이 렌더를 버리면 `setPhase` 는 되돌아가지만
    // ref 쓰기는 남아 커밋된 단계와 어긋날 수 있다.
    //
    // **알고 있고 지금 고치지 않는다.** 버려지는 렌더를 재현하지 못했고(우리 소스에
    // StrictMode·`startTransition`·`Suspense` 가 없다) 이 컴포넌트는 시각 확인 수단이 없다.
    //
    // `useSegmentControl` 처럼 「ref 동기화를 effect 로」 옮겨도 **동기 렌더에서는 동일하다**
    // — 리뷰가 실제로 적용해 테스트 10/10 과 시퀀스 흔적이 그대로임을 확인했다.
    // **갈리는 것은 버려지는 렌더에서다**, 그리고 그 경로를 우리가 재현하지 못한다.
    // 아래 세 경로(취소·완료·자식 이벤트 무시)는 `__test__/` 가 고정한다.

    // key가 바뀌면 exit 시작, 새 children은 대기
    if (childKey !== (displayed.key ?? '')) {
      pendingRef.current = children
      if (phase !== 'exiting') {
        setPhase('exiting')
      }
    } else {
      // key가 같은 경우
      if (phase === 'exiting') {
        // exiting 도중 원래 컨텐츠로 돌아옴 → 즉시 취소하고 visible로
        pendingRef.current = null
        setPhase('visible')
      } else if (phase === 'visible' && children !== displayed) {
        // props 변경 반영
        setDisplayed(children)
      }
    }

    const handleAnimationEnd = (e: React.AnimationEvent<HTMLDivElement>) => {
      // 자식에서 버블링된 이벤트는 여기서 끝난다 — 단계도 진행하지 않고
      // **소비자 `onAnimationEnd` 도 부르지 않는다.** 네이티브 `<div onAnimationEnd>` 는
      // 자식 이벤트로도 발화하므로 그와 다른 계약이다. `__test__` 가 그 동작을 고정한다.
      if (e.target !== e.currentTarget) return

      if (phase === 'exiting') {
        const next = pendingRef.current
        if (next) {
          pendingRef.current = null
          setDisplayed(next)
          setPhase('entering')
        }
      } else if (phase === 'entering') {
        setPhase('visible')
      }

      onAnimationEnd?.(e)
    }

    return (
      <div
        ref={ref}
        data-slot="fade-swap"
        className={cn(className)}
        // eslint-disable-next-line no-restricted-syntax -- phase/duration에 따라 동적으로 계산되는 애니메이션 스타일
        style={phase !== 'visible' ? ANIMATION[phase](duration) : {}}
        onAnimationEnd={handleAnimationEnd}
        {...props}
      >
        {displayed}
      </div>
    )
  },
)
FadeSwap.displayName = 'FadeSwap'
