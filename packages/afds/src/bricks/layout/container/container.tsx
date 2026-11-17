'use client'

import * as React from 'react'
import { cn } from '../../../lib/utils'
import { Box } from '../../layout/box'

export interface ContainerProps extends React.ComponentPropsWithoutRef<typeof Box> {
  /**
   * 최대 너비 크기
   * @default 'xl'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  /**
   * 중앙 정렬 여부
   * @default true
   */
  center?: boolean
}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size = 'xl', center = true, ...props }, ref) => {
    return (
      <Box
        ref={ref}
        data-slot="container"
        className={cn(
          'w-full',
          {
            'mx-auto': center,
            'max-w-screen-sm': size === 'sm',
            'max-w-screen-md': size === 'md',
            'max-w-screen-lg': size === 'lg',
            'max-w-screen-xl': size === 'xl',
            'max-w-screen-2xl': size === '2xl',
            'max-w-full': size === 'full',
          },
          className,
        )}
        {...props}
      />
    )
  },
)
Container.displayName = 'Container'

const Section = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => {
    return (
      <section
        ref={ref}
        data-slot="container-section"
        className={cn('py-8 md:py-12 lg:py-16', className)}
        {...props}
      />
    )
  },
)
Section.displayName = 'Section'

export { Container, Section }
