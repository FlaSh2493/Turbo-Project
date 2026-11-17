'use client'

import { forwardRef, type CSSProperties, type ElementType, type ReactNode } from 'react'
import { cn } from '../../../lib/utils'

export interface FadeInProps extends React.HTMLAttributes<HTMLElement> {
  children: ReactNode
  duration?: number
  delay?: number
  as?: ElementType
}

export const FadeIn = forwardRef<HTMLElement, FadeInProps>(
  ({ children, className, duration = 300, delay = 0, as: Component = 'div', ...props }, ref) => {
    return (
      <Component
        ref={ref}
        data-slot="fade-in"
        className={cn(
          '[animation:enter_var(--fi-duration)_ease-out_both] [animation-delay:var(--fi-delay,0ms)] [--tw-enter-opacity:0]',
          className,
        )}
        style={
          {
            '--fi-duration': `${duration}ms`,
            '--fi-delay': delay > 0 ? `${delay}ms` : undefined,
          } as CSSProperties
        }
        {...props}
      >
        {children}
      </Component>
    )
  },
)
FadeIn.displayName = 'FadeIn'
