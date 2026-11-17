'use client'

import { forwardRef, useEffect, useState, useId } from 'react'
import { createPortal } from 'react-dom'
import { XIcon } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { composeEventHandlers } from '../../../lib/compose-event-handlers'
import { closeVariants, rootVariants } from './toast.style'
import { defaultStore as store, useToast } from '../../../headless/toast'
import { SmoothList } from '../../animation/smooth-list'
// Viewport (Portal Container)

export interface ToastViewportProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Y축 오프셋 (픽셀 단위)
   */
  offsetY?: number
  /**
   * 추가 className
   */
  className?: string
}

const ToastViewport = forwardRef<HTMLDivElement, ToastViewportProps>(
  ({ className, offsetY, style, ...props }, ref) => {
    const bottomOffset = offsetY ? `${offsetY / 16}rem` : '2.5rem'

    return (
      <div
        ref={ref}
        data-slot="toast-viewport"
        className={cn(
          'fixed left-1/2 z-100 flex -translate-x-1/2 flex-col items-center gap-2.5',
          className,
        )}
        style={{
          bottom: bottomOffset,
          ...style,
        }}
        {...props}
      />
    )
  },
)
ToastViewport.displayName = 'ToastViewport'

// Root (Individual Toast Container)

export interface ToastRootProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * 열림 상태
   * @default true
   */
  open?: boolean
  /**
   * 애니메이션 완료 시 호출되는 핸들러
   */
  onAnimationComplete?: () => void
  /**
   * Toast 제거 시 호출되는 핸들러
   */
  onRemove?: () => void
  /**
   * 추가 className
   */
  className?: string
}

const ToastRoot = forwardRef<HTMLDivElement, ToastRootProps>(
  ({ className, open = true, onAnimationComplete, onRemove, ...props }, ref) => {
    const handleAnimationEnd = (e: React.AnimationEvent<HTMLDivElement>) => {
      // root 자체 애니메이션만 처리 (자식 요소 버블링 무시)
      if (e.target !== e.currentTarget) return
      if (!open) onRemove?.()
      onAnimationComplete?.()
    }

    return (
      <div
        ref={ref}
        data-slot="toast-root"
        data-state={open ? 'open' : 'closed'}
        role="alert"
        aria-live="polite"
        className={cn(rootVariants(), className)}
        {...props}
        onAnimationEnd={composeEventHandlers(props.onAnimationEnd, handleAnimationEnd, {
          // animationend 는 취소 불가 이벤트라 preventDefault() 에 의미가 없다.
          // 그런데 React SyntheticEvent 는 그래도 defaultPrevented 를 세우므로,
          // 소비자가 습관적으로 호출하면 onRemove 가 영영 불리지 않아 토스트가 남는다.
          checkForDefaultPrevented: false,
        })}
      />
    )
  },
)
ToastRoot.displayName = 'ToastRoot'

// Content

export interface ToastContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * 추가 className
   */
  className?: string
}

const ToastContent = forwardRef<HTMLDivElement, ToastContentProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="toast-content"
        className={cn('flex items-center gap-2.5', className)}
        {...props}
      />
    )
  },
)
ToastContent.displayName = 'ToastContent'

// Close Button

export interface ToastCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * 추가 className
   */
  className?: string
}

const ToastClose = forwardRef<HTMLButtonElement, ToastCloseProps>(
  ({ className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        data-slot="toast-close"
        type="button"
        aria-label="toast-close"
        className={cn(closeVariants(), className)}
        {...props}
      >
        <XIcon size={16} className="h-[16px] w-[16px]" strokeWidth={2} />
      </button>
    )
  },
)
ToastClose.displayName = 'ToastClose'

export const Toast = {
  Viewport: ToastViewport,
  Root: ToastRoot,
  Content: ToastContent,
  Close: ToastClose,
}

// Toaster Component

interface ToasterProps {
  /**
   * Y축 오프셋 (픽셀 단위)
   * @default 40
   */
  offsetY?: number
}

/**
 * Toaster - 앱 루트에 배치하는 Toast 컨테이너
 *
 * @example
 * ```tsx
 * // app/layout.tsx
 * import { Toaster } from '@turbo-project/afds'
 *
 * export default function RootLayout({ contents }) {
 *   return (
 *     <html>
 *       <body>
 *         {contents}
 *         <Toaster />
 *       </body>
 *     </html>
 *   )
 * }
 * ```
 */
export const Toaster = ({ offsetY = 40 }: ToasterProps) => {
  const { toasts, dismiss, remove } = useToast()

  const id = useId()
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    return store.subscribeToaster(id, ownerId => {
      setActiveId(ownerId)
    })
  }, [store, id])

  /* istanbul ignore next -- @preserve SSR 환경은 jsdom에서 테스트 불가 */
  if (typeof document === 'undefined') {
    return null
  }

  if (activeId !== id) {
    return null
  }

  return createPortal(
    <Toast.Viewport data-slot="toaster-viewport" offsetY={offsetY}>
      <SmoothList
        data-slot="toaster-list"
        className="flex w-full flex-col items-center gap-2.5"
        duration={100}
      >
        {toasts.map(t => (
          <Toast.Root key={t.id} open={t.open} onRemove={() => remove(t.id)} data-layout-id={t.id}>
            <Toast.Content>{t.content}</Toast.Content>
            {t.closable && <Toast.Close onClick={() => dismiss(t.id)} />}
          </Toast.Root>
        ))}
      </SmoothList>
    </Toast.Viewport>,
    document.body,
  )
}
