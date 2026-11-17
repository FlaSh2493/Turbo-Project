'use client'

import {
  type ElementType,
  forwardRef,
  type PropsWithChildren,
  type ComponentPropsWithRef,
} from 'react'
import { cn } from '../../../lib/utils'
import {
  typographyVariants,
  type TypographyVariant,
  type TypographyColor,
} from './typography.style'

interface TypographyBaseProps extends PropsWithChildren {
  /**
   * 타이포그래피의 시각적 변형
   * @default 'body1'
   */
  variant?: TypographyVariant
  /**
   * 텍스트의 색상
   */
  color?: TypographyColor
  /**
   * 추가 className
   */
  className?: string
  /**
   * 자식 요소
   */
  children?: React.ReactNode
}

/**
 * Typography 컴포넌트의 Props
 */
type TypographyProps<T extends ElementType = 'span'> = TypographyBaseProps &
  ComponentPropsWithRef<T> & {
    /**
     * 렌더링할 HTML 요소
     * @default 'span'
     */
    as?: T
  }

/**
 * Typography Component
 * Semantic text component with variant typography styles using Tailwind CSS v4 @theme tokens
 *
 * @example
 * <Typography variant="heading0">Main Title</Typography>
 * <Typography variant="body2" as="p">Paragraph text</Typography>
 * <Typography variant="caption1" color="text-secondary">Caption</Typography>
 * <Typography variant="body2" color="text-brand">Highlight text</Typography>
 */
export const Typography = forwardRef<HTMLElement, TypographyProps<ElementType>>(
  ({ as: Component = 'span', variant = 'body1', color, className, children, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        data-slot="typography"
        className={cn(typographyVariants({ variant, color }), className)}
        {...props}
      >
        {children}
      </Component>
    )
  },
)

Typography.displayName = 'Typography'
