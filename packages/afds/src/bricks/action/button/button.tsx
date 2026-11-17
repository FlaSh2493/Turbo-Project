'use client'

import * as React from 'react'
import { forwardRef } from 'react'
import { Button as ButtonPrimitive } from '@base-ui/react/button'
import type { VariantProps } from 'class-variance-authority'
import { buttonVariants } from './button.style'
import { cn } from '../../../lib/utils'

type ButtonPrimitiveProps = React.ComponentProps<typeof ButtonPrimitive>

export interface ButtonProps
  extends Omit<ButtonPrimitiveProps, 'className'>, VariantProps<typeof buttonVariants> {
  /**
   * 버튼의 시각적 변형
   * @default 'fill'
   */
  variant?: 'fill' | 'primary-line' | 'line' | 'ghost' | 'danger'
  /**
   * 버튼의 크기
   * @default 'md'
   */
  size?: 'md' | 'sm' | 'lg' | 'icon-sm' | 'icon-lg' | 'icon-xs'
  /**
   * 추가 className
   */
  className?: string
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'fill', size = 'md', ...props }, ref) => {
    return (
      <ButtonPrimitive
        ref={ref}
        data-slot="button"
        data-variant={variant}
        data-size={size}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    )
  },
)

Button.displayName = 'Button'
