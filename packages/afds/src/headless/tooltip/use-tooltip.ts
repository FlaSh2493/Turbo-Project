'use client'

import * as React from 'react'

export type TooltipMode = 'hover' | 'click'

export interface TooltipContextValue {
  mode: TooltipMode
  open: boolean
  setOpen: (open: boolean) => void
}

export const TooltipContext = React.createContext<TooltipContextValue | null>(null)

export const useTooltipContext = () => {
  const context = React.useContext(TooltipContext)
  if (!context) {
    throw new Error('Tooltip components must be used within TooltipProvider')
  }
  return context
}

export interface UseTooltipProps {
  mode?: TooltipMode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

export interface UseTooltipReturn {
  mode: TooltipMode
  open: boolean
  setOpen: (open: boolean) => void
  radixOpen: boolean | undefined
  radixOnOpenChange: (nextOpen: boolean) => void
}

export const useTooltip = ({
  mode = 'hover',
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
}: UseTooltipProps): UseTooltipReturn => {
  const isControlled = controlledOpen !== undefined
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen)
  const open = isControlled ? controlledOpen : internalOpen
  const [dismissed, setDismissed] = React.useState(false)

  const setOpen = React.useCallback(
    (newOpen: boolean) => {
      if (!isControlled) {
        setInternalOpen(newOpen)
        if (!newOpen && mode === 'hover') {
          setDismissed(true)
        }
      }
      onOpenChange?.(newOpen)
    },
    [isControlled, mode, onOpenChange],
  )

  // hover+uncontrolled: internalOpen으로 항상 controlled 유지
  // (undefined↔false 전환 없이 안정적, base-ui hover 이벤트로 상태 동기화)
  const radixOpen = mode === 'click' ? open : isControlled ? open : internalOpen

  const radixOnOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (mode === 'click') {
        if (nextOpen) {
          setOpen(true)
        }
        // ignore false (outside click / escape)
      } else if (!isControlled) {
        if (nextOpen && dismissed) return // dismiss 후 hover 재진입 무시
        if (!nextOpen) setDismissed(false) // hover 이탈 시 dismissed 초기화
        setInternalOpen(nextOpen)
        onOpenChange?.(nextOpen)
      } else {
        onOpenChange?.(nextOpen)
      }
    },
    [mode, isControlled, onOpenChange, dismissed],
  )

  return {
    mode,
    open,
    setOpen,
    radixOpen,
    radixOnOpenChange,
  }
}
