'use client'

import { type ComponentProps, forwardRef } from 'react'
import { cn } from '../../../lib/utils'
import { flexVariants } from './flex.style'
import type { PrimitiveSpacing } from '../../../schemas/tokens.schema'

export interface FlexProps extends Omit<ComponentProps<'div'>, 'className'> {
  /**
   * Flexbox 방향
   * @default 'row'
   */
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
  /**
   * 주축 정렬
   * @default 'flex-start'
   */
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly'
  /**
   * 교차축 정렬
   * @default 'stretch'
   */
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline'
  /**
   * 요소 간 간격 (AFDS spacing 토큰)
   */
  gap?: PrimitiveSpacing
  /**
   * 줄 바꿈 허용
   * @default 'nowrap'
   */
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse'
  /**
   * 교차축 정렬 (여러 줄)
   */
  alignContent?:
    | 'flex-start'
    | 'center'
    | 'flex-end'
    | 'space-between'
    | 'space-around'
    | 'space-evenly'
  /**
   * 추가 className
   */
  className?: string
}

export const Flex = forwardRef<HTMLDivElement, FlexProps>(
  ({ direction, justify, align, gap, wrap, alignContent, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="flex"
        className={cn(
          flexVariants({ direction, justify, align, gap, wrap, alignContent }),
          className,
        )}
        {...props}
      />
    )
  },
)

Flex.displayName = 'Flex'
