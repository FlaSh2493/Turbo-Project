'use client'

import * as React from 'react'
import { Popover as PopoverPrimitive } from '@base-ui/react/popover'
import { cn } from '../../../lib/utils'
import {
  useResolvedPortalContainer,
  type PortalContainer,
} from '../../../hooks/use-resolved-portal-container'
import { popoverContentBase, popoverArrowBase, popoverCloseBase } from './popover.style'

type PopoverPrimitiveRootProps = PopoverPrimitive.Root.Props
type PopoverPrimitiveTriggerProps = PopoverPrimitive.Trigger.Props
type PopoverPrimitivePopupProps = PopoverPrimitive.Popup.Props
type PopoverPrimitiveArrowProps = PopoverPrimitive.Arrow.Props

// Root

export interface PopoverRootProps extends Omit<PopoverPrimitiveRootProps, 'children'> {
  /**
   * 팝오버 콘텐츠
   */
  children: React.ReactNode
}

export const PopoverRoot = ({ children, ...props }: PopoverRootProps) => {
  return <PopoverPrimitive.Root {...props}>{children}</PopoverPrimitive.Root>
}

PopoverRoot.displayName = 'PopoverRoot'

// Trigger

export interface PopoverTriggerProps extends PopoverPrimitiveTriggerProps {
  /**
   * 팝오버 트리거 콘텐츠
   */
  children?: React.ReactNode
}

export const PopoverTrigger = React.forwardRef<HTMLButtonElement, PopoverTriggerProps>(
  ({ className, ...props }, ref) => {
    return (
      <PopoverPrimitive.Trigger
        ref={ref}
        data-slot="popover-trigger"
        className={className}
        {...props}
      />
    )
  },
)

PopoverTrigger.displayName = 'PopoverTrigger'

// Anchor (Custom Implementation)

export interface PopoverAnchorProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * 팝오버 앵커 콘텐츠
   */
  children?: React.ReactNode
}

export const PopoverAnchor = React.forwardRef<HTMLDivElement, PopoverAnchorProps>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} data-slot="popover-anchor" className={className} {...props}>
      {children}
    </div>
  ),
)

PopoverAnchor.displayName = 'PopoverAnchor'

// Content

export interface PopoverContentProps extends Omit<PopoverPrimitivePopupProps, 'children'> {
  /**
   * 팝오버 콘텐츠
   */
  children: React.ReactNode
  /**
   * 팝오버 배치 위치
   * @default 'bottom'
   */
  side?: 'top' | 'right' | 'bottom' | 'left'
  /**
   * 트리거를 기준으로 정렬 위치
   * @default 'center'
   */
  align?: 'start' | 'center' | 'end'
  /**
   * side 방향 오프셋 (px)
   * @default 12
   */
  sideOffset?: number
  /**
   * align 방향 오프셋 (px)
   */
  alignOffset?: number
  /**
   * 화살표 패딩 (px)
   */
  arrowPadding?: number
  /**
   * 뷰포트 충돌 회피 (Base UI와의 호환성용, 현재 미사용)
   */
  avoidCollisions?: boolean
  /**
   * 포털 컨테이너. 미지정 시 `<AfdsScope>` 컨텍스트 → `document.body` 순으로 해석된다.
   * 명시 `null` 은 **포털을 렌더하지 않는다**(선언형 base-ui Portal 의 동작) — body opt-out 이
   * 아니다. body 로 보내려면 `document.body` 를 직접 넘겨라. (실측 확인)
   */
  container?: PortalContainer
}

export const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  (
    {
      className,
      children,
      side = 'bottom',
      align = 'center',
      sideOffset = 12,
      alignOffset,
      arrowPadding,
      avoidCollisions: _avoidCollisions, // unused in Base UI, kept for API compat
      container,
      ...props
    },
    ref,
  ) => {
    const resolvedContainer = useResolvedPortalContainer(container)
    return (
      <PopoverPrimitive.Portal container={resolvedContainer}>
        <PopoverPrimitive.Positioner
          side={side}
          align={align}
          sideOffset={sideOffset}
          alignOffset={alignOffset}
          arrowPadding={arrowPadding}
        >
          <PopoverPrimitive.Popup
            ref={ref}
            data-slot="popover-content"
            className={cn(popoverContentBase, className)}
            {...props}
          >
            {children}
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    )
  },
)

PopoverContent.displayName = 'PopoverContent'

// Arrow

/**
 * 팝오버 화살표 props
 */
export type PopoverArrowProps = PopoverPrimitiveArrowProps

export const PopoverArrow = React.forwardRef<HTMLDivElement, PopoverArrowProps>(
  ({ className, ...props }, ref) => (
    <PopoverPrimitive.Arrow
      ref={ref}
      data-slot="popover-arrow"
      className={cn(popoverArrowBase, className)}
      {...props}
    />
  ),
)

PopoverArrow.displayName = 'PopoverArrow'

// Close

export interface PopoverCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * 닫기 버튼 콘텐츠
   */
  children?: React.ReactNode
}

export const PopoverClose = React.forwardRef<HTMLButtonElement, PopoverCloseProps>(
  ({ children, className, ...props }, ref) => (
    <PopoverPrimitive.Close
      ref={ref}
      data-slot="popover-close"
      className={cn(popoverCloseBase, className)}
      {...props}
    >
      {children}
    </PopoverPrimitive.Close>
  ),
)

PopoverClose.displayName = 'PopoverClose'

export const Popover = {
  Root: PopoverRoot,
  Trigger: PopoverTrigger,
  Content: PopoverContent,
  Arrow: PopoverArrow,
  Close: PopoverClose,
  Anchor: PopoverAnchor,
}
