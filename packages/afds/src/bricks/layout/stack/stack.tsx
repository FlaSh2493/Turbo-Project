'use client'

import * as React from 'react'
import { cn } from '../../../lib/utils'
import { Flex, type FlexProps } from '../../layout/flex'

/**
 * VStack과 HStack이 공유하는 props 타입 (FlexProps를 확장)
 */
export type StackProps = FlexProps

const VStack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ className, align = 'stretch', ...props }, ref) => {
    return (
      <Flex
        ref={ref}
        data-slot="vstack"
        direction="column"
        align={align}
        className={cn('w-full', className)}
        {...props}
      />
    )
  },
)
VStack.displayName = 'VStack'

const HStack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ className, align = 'center', ...props }, ref) => {
    return (
      <Flex
        ref={ref}
        data-slot="hstack"
        direction="row"
        align={align}
        className={cn(className)}
        {...props}
      />
    )
  },
)
HStack.displayName = 'HStack'

export { VStack, HStack }
