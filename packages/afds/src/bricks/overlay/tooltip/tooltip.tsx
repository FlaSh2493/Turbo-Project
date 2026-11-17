'use client'

import * as React from 'react'
import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip'
import type { VariantProps } from 'class-variance-authority'
import { cn } from '../../../lib/utils'
import { useResolvedPortalContainer } from '../../../hooks/use-resolved-portal-container'
import { contentVariants, arrowVariants, closeVariants } from './tooltip.style'
import {
  TooltipContext,
  useTooltip,
  useTooltipContext,
  type TooltipMode,
} from '../../../headless/tooltip'

export type { TooltipMode }

// Root (mode/context/state 포함)

/**
 * 툴팁 루트 props
 */
export interface TooltipRootProps {
  /**
   * 툴팁 동작 모드
   * - `hover`: base-ui 기본 hover/focus 동작 (열림 지연 기본 200ms)
   * - `click`: 트리거 클릭으로 수동 토글, 외부 클릭/ESC 무시
   * @default 'hover'
   */
  mode?: TooltipMode
  /** controlled 열림 상태 */
  open?: boolean
  /** uncontrolled 초기 열림 상태 */
  defaultOpen?: boolean
  /** 열림 상태 변경 콜백 */
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}

export const TooltipRoot = ({
  mode = 'hover',
  open,
  defaultOpen,
  onOpenChange,
  children,
}: TooltipRootProps) => {
  const {
    open: isOpen,
    setOpen,
    radixOpen,
    radixOnOpenChange,
  } = useTooltip({
    mode,
    open,
    defaultOpen,
    onOpenChange,
  })

  return (
    <TooltipContext.Provider value={{ mode, open: isOpen, setOpen }}>
      <TooltipPrimitive.Root
        open={radixOpen}
        onOpenChange={nextOpen => radixOnOpenChange(nextOpen)}
      >
        {children}
      </TooltipPrimitive.Root>
    </TooltipContext.Provider>
  )
}
TooltipRoot.displayName = 'TooltipRoot'

// Provider

/**
 * 툴팁 프로바이더 props
 */
export type TooltipProviderProps = TooltipPrimitive.Provider.Props

export const TooltipProvider = (props: TooltipProviderProps) => (
  <TooltipPrimitive.Provider {...props} />
)
TooltipProvider.displayName = 'TooltipProvider'

// Trigger (context에서 mode 읽어 click 토글 + delay 처리)

/**
 * 툴팁 트리거 props
 */
export interface TooltipTriggerProps extends TooltipPrimitive.Trigger.Props {
  /**
   * hover 모드일 때 열림 지연(ms). click 모드에서는 0으로 강제된다.
   * @default 200
   */
  delay?: number
}

export const TooltipTrigger = React.forwardRef<HTMLButtonElement, TooltipTriggerProps>(
  ({ delay, className, onClick, ...props }, ref) => {
    const { mode, open, setOpen } = useTooltipContext()

    const handleClick: NonNullable<TooltipPrimitive.Trigger.Props['onClick']> = e => {
      if (mode === 'click') {
        e.preventDefault()
        setOpen(!open)
      }
      onClick?.(e)
    }

    const triggerDelay = mode === 'hover' ? (delay ?? 200) : 0

    return (
      <TooltipPrimitive.Trigger
        ref={ref as unknown as React.Ref<HTMLButtonElement & HTMLElement>}
        data-slot="tooltip-trigger"
        className={cn(className)}
        delay={triggerDelay}
        onClick={handleClick}
        {...props}
      />
    )
  },
)
TooltipTrigger.displayName = 'TooltipTrigger'

// Portal

/**
 * 툴팁 포탈 props (base-ui `Tooltip.Portal.Props` 를 그대로 통과).
 *
 * `container`: 미지정 시 `<AfdsScope>` 컨텍스트 → `document.body` 순으로 해석된다.
 * 모달·드로어 안에서는 그 노드가 컨텍스트를 재공급하므로 **미지정이 정답**이다.
 * 명시 `null` 은 **포털을 렌더하지 않는다**(선언형 base-ui Portal 의 동작) — body opt-out 이
 * 아니다. body 로 보내려면 `document.body` 를 직접 넘겨라. (실측 확인)
 *
 * 필드를 재선언하지 않고 여기 적는다 — 이 타입은 base-ui props 를 그대로 통과시킨다.
 */
export type TooltipPortalProps = TooltipPrimitive.Portal.Props

export const TooltipPortal = ({ container, ...props }: TooltipPortalProps) => {
  const resolvedContainer = useResolvedPortalContainer(container)
  return <TooltipPrimitive.Portal {...props} container={resolvedContainer} />
}
TooltipPortal.displayName = 'TooltipPortal'

// Positioner

/**
 * 툴팁 포지셔너 props
 */
export type TooltipPositionerProps = TooltipPrimitive.Positioner.Props

export const TooltipPositioner = React.forwardRef<
  React.ComponentRef<typeof TooltipPrimitive.Positioner>,
  TooltipPositionerProps
>(({ className, sideOffset = 12, ...props }, ref) => (
  <TooltipPrimitive.Positioner
    ref={ref}
    data-slot="tooltip-positioner"
    className={cn(className)}
    sideOffset={sideOffset}
    {...props}
  />
))
TooltipPositioner.displayName = 'TooltipPositioner'

// Popup

/**
 * 툴팁 팝업 props
 */
export type TooltipPopupProps = TooltipPrimitive.Popup.Props & VariantProps<typeof contentVariants>

export const TooltipPopup = React.forwardRef<
  React.ComponentRef<typeof TooltipPrimitive.Popup>,
  TooltipPopupProps
>(({ className, size, ...props }, ref) => (
  <TooltipPrimitive.Popup
    ref={ref}
    data-slot="tooltip-popup"
    className={cn(contentVariants({ size }), className)}
    {...props}
  />
))
TooltipPopup.displayName = 'TooltipPopup'

// Arrow

/**
 * 툴팁 화살표 props
 */
export type TooltipArrowProps = TooltipPrimitive.Arrow.Props

export const TooltipArrow = React.forwardRef<
  React.ComponentRef<typeof TooltipPrimitive.Arrow>,
  TooltipArrowProps
>(({ className, ...props }, ref) => (
  <TooltipPrimitive.Arrow
    ref={ref}
    data-slot="tooltip-arrow"
    className={cn(arrowVariants(), className)}
    {...props}
  />
))
TooltipArrow.displayName = 'TooltipArrow'

// Close (context에서 setOpen 읽어 닫기)

/**
 * 툴팁 닫기 버튼 props
 */
export type TooltipCloseProps = React.ButtonHTMLAttributes<HTMLButtonElement>

export const TooltipClose = React.forwardRef<HTMLButtonElement, TooltipCloseProps>(
  (
    { className, type = 'button', 'aria-label': ariaLabel = 'Close tooltip', onClick, ...props },
    ref,
  ) => {
    const { setOpen } = useTooltipContext()

    return (
      <button
        ref={ref}
        type={type}
        data-slot="tooltip-close"
        aria-label={ariaLabel}
        className={cn(closeVariants(), className)}
        onClick={e => {
          setOpen(false)
          onClick?.(e)
        }}
        {...props}
      />
    )
  },
)
TooltipClose.displayName = 'TooltipClose'

export const Tooltip = {
  Root: TooltipRoot,
  Provider: TooltipProvider,
  Trigger: TooltipTrigger,
  Portal: TooltipPortal,
  Positioner: TooltipPositioner,
  Popup: TooltipPopup,
  Arrow: TooltipArrow,
  Close: TooltipClose,
}
