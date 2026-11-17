'use client'

import { createContext, forwardRef, useContext, type ReactNode } from 'react'
import { cn } from '../../../lib/utils'
import { XIcon } from 'lucide-react'
import { useMountAnimation } from '../../../hooks/use-mount-animation'
import { Button } from '../../action/button'
import {
  floatingActionBarOverlayBase,
  floatingActionBarBarBase,
  floatingActionBarDimBase,
} from './floating-action-bar.style'

interface FloatingActionBarContextType {
  show: boolean
  onClose?: () => void
}

const FloatingActionBarContext = createContext<FloatingActionBarContextType | undefined>(undefined)

const useFloatingActionBarContext = () => {
  const context = useContext(FloatingActionBarContext)
  if (!context) {
    throw new Error(
      'FloatingActionBar compound components must be used within FloatingActionBar.Root',
    )
  }
  return context
}

export interface FloatingActionBarRootProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * 플로팅 액션 바 표시 여부
   */
  show: boolean
  /**
   * 닫기 버튼 클릭 시 호출되는 콜백
   */
  onClose?: () => void
  /**
   * 자식 요소
   */
  children?: ReactNode
  /**
   * 추가 className
   */
  className?: string
}

const Root = forwardRef<HTMLDivElement, FloatingActionBarRootProps>(
  ({ show, onClose, children, className, ...props }, ref) => {
    const { visible } = useMountAnimation(show, 300)

    if (!visible) return null

    return (
      <FloatingActionBarContext.Provider value={{ show, onClose }}>
        <div
          ref={ref}
          data-slot="floating-action-bar"
          data-show={show}
          className={cn(
            floatingActionBarOverlayBase,
            'opacity-0 data-[show=true]:opacity-100',
            className,
          )}
          {...props}
        >
          {children}
        </div>
      </FloatingActionBarContext.Provider>
    )
  },
)
Root.displayName = 'FloatingActionBar.Root'

export type FloatingActionBarDimProps = React.HTMLAttributes<HTMLDivElement> & {
  /**
   * 추가 className
   */
  className?: string
}

const Dim = forwardRef<HTMLDivElement, FloatingActionBarDimProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="floating-action-bar-dim"
      className={cn(floatingActionBarDimBase, className)}
      {...props}
    />
  ),
)
Dim.displayName = 'FloatingActionBar.Dim'

export interface FloatingActionBarCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * 자식 요소
   */
  children?: ReactNode
  /**
   * 추가 className
   */
  className?: string
}

const Card = forwardRef<HTMLDivElement, FloatingActionBarCardProps>(
  ({ children, className, ...props }, ref) => {
    const { show } = useFloatingActionBarContext()
    return (
      <div
        ref={ref}
        data-slot="floating-action-bar-card"
        data-show={show}
        className={cn(
          floatingActionBarBarBase,
          'translate-y-full data-[show=true]:translate-y-0',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    )
  },
)
Card.displayName = 'FloatingActionBar.Card'

export interface FloatingActionBarClearButtonProps extends Omit<
  React.ComponentProps<typeof Button>,
  'children'
> {
  /**
   * 클릭 시 호출되는 콜백
   */
  onClick?: () => void
}

const ClearButton = forwardRef<HTMLButtonElement, FloatingActionBarClearButtonProps>(
  ({ onClick, 'aria-label': ariaLabel = '닫기', ...props }, ref) => {
    const { onClose } = useFloatingActionBarContext()
    return (
      <Button
        ref={ref}
        data-slot="floating-action-bar-clear"
        variant="ghost"
        size="icon-sm"
        aria-label={ariaLabel}
        onClick={onClick ?? onClose}
        {...props}
      >
        <XIcon size={16} className="text-afds-icon-primary" />
      </Button>
    )
  },
)
ClearButton.displayName = 'FloatingActionBar.ClearButton'

export const FloatingActionBar = Object.assign(Root, {
  Dim,
  Card,
  ClearButton,
})
