'use client'

import * as React from 'react'
import { ScrollArea as ScrollAreaPrimitive } from '@base-ui/react/scroll-area'
import type { VariantProps } from 'class-variance-authority'
import { cn } from '../../../lib/utils'
import { scrollBarVariants } from './scroll-area.style'

export interface ScrollAreaProps extends ScrollAreaPrimitive.Root.Props {
  viewportClassName?: string
  viewportRef?: React.Ref<HTMLDivElement>
  contentClassName?: string
  /**
   * 세로 스크롤바 폭(거터)을 콘텐츠 오른쪽에 예약할지 정한다.
   * - `reserve`: 세로 오버플로가 생기면 트랙 폭만큼 예약한다 — 글자·조작 요소가 바에 가리지 않는다
   * - `overlay`: 예약하지 않는다 — 바가 콘텐츠 위에 뜨고, 테이블 헤더 배경·행 구분선 같은
   *   전체폭 요소가 컨테이너 끝까지 이어진다. 본문이 바 아래로 들어가므로 장식 위주 콘텐츠에 쓴다
   * @default 'reserve'
   */
  gutter?: 'reserve' | 'overlay'
  offsetYStart?: number
  offsetYEnd?: number
  offsetXStart?: number
  offsetXEnd?: number
  hideHorizontal?: boolean
  hideVertical?: boolean
  scrollBarVerticalStyle?: React.CSSProperties
  scrollBarHorizontalStyle?: React.CSSProperties
}

export const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  (
    {
      className,
      children,
      viewportClassName,
      viewportRef,
      contentClassName,
      gutter = 'reserve',
      offsetYStart = 10,
      offsetYEnd = 10,
      offsetXStart = 10,
      offsetXEnd = 10,
      hideHorizontal = false,
      hideVertical = false,
      scrollBarVerticalStyle,
      scrollBarHorizontalStyle,
      ...props
    },
    ref,
  ) => {
    // `scrollBarVerticalStyle` 로 트랙 폭 재정의를 받으면 Scrollbar 자신에 다시 정의하지
    // 않고 여기서 뽑아 Root 의 단일 정의로 끌어올린다(upstream #136). Scrollbar 는
    // Viewport 의 형제라 자기 style 에 정의하면 Content 가 그 값을 볼 수 없다 — #132 가
    // 고친 것과 같은 이유로, 재정의도 같은 경로를 타야 거터와 트랙이 같은 값을 본다.
    const { '--scrollbar-track-size': verticalTrackSizeOverride, ...scrollBarVerticalStyleRest } =
      (scrollBarVerticalStyle ?? {}) as Record<string, string | number | undefined>

    return (
      <ScrollAreaPrimitive.Root
        ref={ref}
        data-slot="scroll-area"
        className={cn('relative overflow-hidden', className)}
        {...props}
        style={
          {
            // **정의는 여기 한 곳이다.** CSS 변수는 아래로만 상속되는데 Scrollbar 는 Viewport 의
            // **형제**라, 예전처럼 Scrollbar 에 정의하면 Content 가 닿지 못했다. Root 로 올려야
            // 스크롤바 폭과 콘텐츠 거터가 **같은 값 하나**를 본다.
            // 이 17px 은 플랫폼 값이 아니라 우리 커스텀 바의 디자인 값이다. `scrollBarVerticalStyle`
            // 로 재정의된 값이 있으면 기본값 대신 그 값이 이 한 곳의 정의가 된다.
            '--scrollbar-track-size': verticalTrackSizeOverride ?? '17px',
            // 소비자 style 은 보존한다. `{...props}` **뒤**에 두어야 스프레드가 이 변수를
            // 덮지 않는다 — 앞에 뒀다가 실제로 덮여서 Root 에 변수가 안 붙었다(래핑 계약 5항).
            ...props.style,
          } as unknown as React.CSSProperties
        }
      >
        <ScrollAreaPrimitive.Viewport
          ref={viewportRef}
          data-slot="scroll-area-viewport"
          className={cn(
            'h-full w-full',
            // **네이티브 스크롤바를 억제한다.** base-ui 는 Viewport 에 `overflow: scroll` 을 주지만
            // CSS 를 배포하지 않아(패키지 내 .css 0개) 네이티브 바가 그대로 뜬다. 클래식 스크롤바
            // 플랫폼(Windows·Linux·macOS "항상 표시")에서는 **네이티브 + 커스텀 17px 이 둘 다** 보이고,
            // 네이티브가 폭을 예약하므로 올바른 거터 폭이 플랫폼마다 달라진다.
            // 억제하면 공간을 먹는 스크롤바가 정확히 하나가 되어 거터 계산이 성립한다.
            '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
            viewportClassName,
          )}
        >
          <ScrollAreaPrimitive.Content
            data-slot="scroll-area-content"
            className={cn(
              // **거터를 스크롤바 가시성이 아니라 오버플로 존재에 건다.** hover-reveal 사용처
              // (`hideVertical={!isHovered}`)에서 가시성에 걸면 hover 마다 17px 이 생겼다 사라져
              // 콘텐츠가 리플로우한다. `data-has-overflow-y` 는 base-ui 가 Content 에 붙인다.
              //
              // **패딩이 아니라 투명 border 로 예약한다**(upstream #244). `box-sizing: border-box`
              // 라 예약 동작은 패딩과 같은데, **다른 속성이라 소비처 `contentClassName` 의 `p-*` 와
              // 경쟁하지 않는다.** 패딩으로 주면 소비처 값을 이긴다 — 변형이 있으면 특이도로, 없어도
              // Tailwind 가 `pr` 을 `p` 뒤에 놓아서. `tailwind-merge` 도 구제하지 못한다(토큰 스케일
              // `p-afds-spacing-10` 을 패딩으로 인식하지 못해 둘 다 남긴다).
              //
              // 내부 래퍼로 자식만 미는 방법은 **버렸다** — Content 에 준 `h-full`·`flex`·`grid` 가
              // 자식에게 닿지 못한다(실측: `base-table` 의 `contentClassName="h-full w-full"` +
              // 자식 `grid h-full` 에서 그리드 높이 398 → 24). Viewport 에 두는 방법도 버렸다 —
              // `viewportClassName` 의 좌우 패딩과 충돌한다(`modal.tsx:204` 의 `px-7.5`).
              //
              // `0px` 기본값은 **상속 차단**이다 — 두 모드 모두에 둬야 중첩된 ScrollArea 의 안쪽이
              // 바깥 값을 물려받아 오버플로가 없는데도 거터를 갖는 일이 없다.
              '[--scroll-area-gutter:0px] [border-right:var(--scroll-area-gutter)_solid_transparent]',
              gutter === 'reserve' &&
                'data-[has-overflow-y]:[--scroll-area-gutter:var(--scrollbar-track-size)]',
              contentClassName,
            )}
            style={{ minWidth: 0 }}
          >
            {children}
          </ScrollAreaPrimitive.Content>
        </ScrollAreaPrimitive.Viewport>
        <ScrollBar
          orientation="vertical"
          offsetStart={offsetYStart}
          offsetEnd={offsetYEnd}
          data-hide-vertical={hideVertical}
          className="data-[hide-vertical=true]:invisible"
          // `--scrollbar-track-size` 는 위에서 Root 로 끌어올렸다 — 여기서는 나머지만 전달한다.
          // 여기 다시 정의하면 두 번째 정의가 되어 #132 가 막은 결함(upstream #136)이 되돌아온다.
          style={scrollBarVerticalStyleRest as unknown as React.CSSProperties}
        />
        <ScrollBar
          orientation="horizontal"
          offsetStart={offsetXStart}
          offsetEnd={offsetXEnd}
          data-hide-horizontal={hideHorizontal}
          className="data-[hide-horizontal=true]:invisible"
          style={scrollBarHorizontalStyle}
        />
        <ScrollAreaPrimitive.Corner data-slot="scroll-area-corner" />
      </ScrollAreaPrimitive.Root>
    )
  },
)
ScrollArea.displayName = 'ScrollArea'

export interface ScrollBarProps
  extends
    Omit<ScrollAreaPrimitive.Scrollbar.Props, 'orientation'>,
    VariantProps<typeof scrollBarVariants> {
  offsetStart?: number
  offsetEnd?: number
  thumbClassName?: string
}

export const ScrollBar = React.forwardRef<HTMLDivElement, ScrollBarProps>(
  (
    {
      className,
      orientation = 'vertical',
      offsetStart = 10,
      offsetEnd = 10,
      style,
      thumbClassName,
      ...props
    },
    ref,
  ) => (
    <ScrollAreaPrimitive.Scrollbar
      ref={ref}
      data-slot="scroll-area-scrollbar"
      orientation={orientation as 'vertical' | 'horizontal'}
      className={cn(scrollBarVariants({ orientation, className }))}
      style={
        {
          '--scrollbar-offset-start': `${offsetStart}px`,
          '--scrollbar-offset-end': `${offsetEnd}px`,
          // `--scrollbar-track-size` 는 여기서 정의하지 않는다 — Root 가 정의하고 상속된다.
          // 여기 두면 Content(형제 밖)가 닿지 못한다. 소비는 `scroll-area.style.ts` 가 한다.
          ...style,
        } as unknown as React.CSSProperties
      }
      {...props}
    >
      <ScrollAreaPrimitive.Thumb
        data-slot="scroll-thumb"
        className={cn(
          'relative flex-1 rounded-full bg-afds-gray-400 transition-colors duration-200',
          thumbClassName,
        )}
      />
    </ScrollAreaPrimitive.Scrollbar>
  ),
)
ScrollBar.displayName = 'ScrollBar'
