'use client'

import * as React from 'react'
import type { VariantProps } from 'class-variance-authority'
import { Separator as SeparatorPrimitive } from '@base-ui/react/separator'
import { cn } from '../../../lib/utils'
import { dividerVariants } from './divider.style'

export interface DividerProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof dividerVariants> {
  /**
   * 구분선 방향
   * @default 'horizontal'
   */
  orientation?: 'horizontal' | 'vertical'
  /**
   * 추가 className
   */
  className?: string
}

export const Divider = React.forwardRef<HTMLDivElement, DividerProps>(
  ({ className, orientation = 'horizontal', ...props }, ref) => {
    const resolvedOrientation = orientation ?? 'horizontal'
    return (
      <SeparatorPrimitive
        ref={ref}
        orientation={resolvedOrientation}
        className={cn(dividerVariants({ orientation: resolvedOrientation }), className)}
        {...props}
      />
    )
  },
)

Divider.displayName = 'Divider'
