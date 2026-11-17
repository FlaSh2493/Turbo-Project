'use client'

import * as React from 'react'
import type { VariantProps } from 'class-variance-authority'
import { cn } from '../../../lib/utils'
import { squareBadgeRootVariants } from './square-badge.style'

export type SquareBadgeVariant = NonNullable<
  VariantProps<typeof squareBadgeRootVariants>['variant']
>
export type SquareBadgeColor = NonNullable<VariantProps<typeof squareBadgeRootVariants>['color']>

export interface SquareBadgeRootProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'> {
  /**
   * 뱃지의 시각적 변형
   */
  variant?: SquareBadgeVariant
  /**
   * 뱃지의 색상
   */
  color?: SquareBadgeColor
  /**
   * 자식 요소
   */
  children?: React.ReactNode
  /**
   * 추가 className
   */
  className?: string
}

export const SquareBadgeRoot = React.forwardRef<HTMLDivElement, SquareBadgeRootProps>(
  ({ className, variant, color, ...props }, ref) => {
    const resolvedVariant: SquareBadgeVariant = variant ?? 'filled'
    const resolvedColor: SquareBadgeColor = color ?? 'neutral'
    return (
      <div
        ref={ref}
        data-slot="badge-root"
        data-variant={resolvedVariant}
        data-color={resolvedColor}
        className={cn(
          squareBadgeRootVariants({ variant: resolvedVariant, color: resolvedColor }),
          className,
        )}
        {...props}
      />
    )
  },
)
SquareBadgeRoot.displayName = 'SquareBadge.Root'

export interface SquareBadgeContentProps
  extends React.PropsWithChildren, React.HTMLAttributes<HTMLDivElement> {
  /**
   * 자식 요소
   */
  children?: React.ReactNode
  /**
   * 추가 className
   */
  className?: string
}

export const SquareBadgeContent = React.forwardRef<HTMLDivElement, SquareBadgeContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} data-slot="badge-content" className={cn('body3', className)} {...props}>
        {children}
      </div>
    )
  },
)
SquareBadgeContent.displayName = 'SquareBadge.Content'

export const SquareBadge = {
  Root: SquareBadgeRoot,
  Content: SquareBadgeContent,
}
