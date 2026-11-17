'use client'

import { type ComponentProps, forwardRef } from 'react'
import { cn } from '../../../lib/utils'
import { linkBase } from './link.style'

export interface LinkProps extends Omit<ComponentProps<'a'>, 'className'> {
  /**
   * 추가 className
   */
  className?: string
  /**
   * 링크의 자식 요소
   */
  children?: React.ReactNode
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ className, children, ...props }, ref) => (
    <a ref={ref} data-slot="link" className={cn(linkBase, className)} {...props}>
      {children}
    </a>
  ),
)

Link.displayName = 'Link'
