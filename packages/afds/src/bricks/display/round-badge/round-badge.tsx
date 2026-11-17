'use client'

import * as React from 'react'
import type { VariantProps } from 'class-variance-authority'
import { cn } from '../../../lib/utils'
import { roundBadgeDotVariants, roundBadgeRootBase } from './round-badge.style'

export interface RoundBadgeRootProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * 자식 요소
   */
  children?: React.ReactNode
  /**
   * 추가 className
   */
  className?: string
}

export const RoundBadgeRoot = React.forwardRef<HTMLDivElement, RoundBadgeRootProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="badge-root"
        className={cn(roundBadgeRootBase, className)}
        {...props}
      />
    )
  },
)
RoundBadgeRoot.displayName = 'RoundBadge.Root'

export type RoundBadgeDotColor = NonNullable<VariantProps<typeof roundBadgeDotVariants>['color']>

export interface RoundBadgeDotProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'> {
  /**
   * 뱃지의 색상
   */
  color?: RoundBadgeDotColor
  /**
   * 추가 className
   */
  className?: string
}

export const RoundBadgeDot = React.forwardRef<HTMLDivElement, RoundBadgeDotProps>(
  ({ className, color, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="badge-dot"
        data-color={color}
        className={cn(roundBadgeDotVariants({ color }), className)}
        {...props}
      />
    )
  },
)
RoundBadgeDot.displayName = 'RoundBadge.Dot'

export interface RoundBadgeContentProps
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

export const RoundBadgeContent = React.forwardRef<HTMLDivElement, RoundBadgeContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="badge-content"
        className={cn('body3 text-afds-text-primary', className)}
        {...props}
      >
        {children}
      </div>
    )
  },
)
RoundBadgeContent.displayName = 'RoundBadge.Content'

export const RoundBadge = {
  Root: RoundBadgeRoot,
  Dot: RoundBadgeDot,
  Content: RoundBadgeContent,
}
