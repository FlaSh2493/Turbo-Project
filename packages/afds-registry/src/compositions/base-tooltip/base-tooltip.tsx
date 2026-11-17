'use client'

import * as React from 'react'
import { XIcon } from 'lucide-react'
import {
  Tooltip,
  type TooltipArrowProps,
  type TooltipMode,
  type TooltipPopupProps,
  type TooltipPositionerProps,
} from '@turbo-project/afds/bricks'
import { cn } from '@turbo-project/afds/lib/utils'

// BaseTooltip Component (closed thick API)

export interface BaseTooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  contentProps?: Omit<TooltipPopupProps, 'children' | 'size'>
  size?: TooltipPopupProps['size']
  showArrow?: boolean
  arrowProps?: TooltipArrowProps
  showClose?: boolean
  mode?: TooltipMode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  delay?: number
  side?: TooltipPositionerProps['side']
  align?: TooltipPositionerProps['align']
  sideOffset?: number
}

export const BaseTooltip = React.forwardRef<HTMLElement, BaseTooltipProps>(
  (
    {
      children,
      content,
      contentProps,
      showArrow = true,
      arrowProps,
      showClose = false,
      mode = 'hover',
      open: controlledOpen,
      defaultOpen,
      onOpenChange,
      size = 'md',
      delay,
      side,
      align,
      sideOffset = 12,
    },
    ref,
  ): React.ReactElement => {
    return (
      <Tooltip.Root
        mode={mode}
        open={controlledOpen}
        defaultOpen={defaultOpen}
        onOpenChange={onOpenChange}
      >
        <Tooltip.Trigger
          ref={ref as React.Ref<HTMLButtonElement>}
          delay={delay}
          render={children as React.ReactElement}
        />
        <Tooltip.Portal>
          <Tooltip.Positioner side={side} align={align} sideOffset={sideOffset}>
            <Tooltip.Popup size={size} {...contentProps} className={cn(contentProps?.className)}>
              <div data-slot="tooltip-inner-content" className="flex items-start gap-1">
                <span data-slot="tooltip-text" className="flex-1">
                  {content}
                </span>
                {showClose && (
                  <Tooltip.Close>
                    <XIcon size={16} className="h-3 w-3" />
                  </Tooltip.Close>
                )}
              </div>
              {showArrow && <Tooltip.Arrow {...arrowProps} className={cn(arrowProps?.className)} />}
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    )
  },
)
BaseTooltip.displayName = 'BaseTooltip'
