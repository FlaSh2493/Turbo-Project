'use client'

import * as React from 'react'
import { cn } from '../../../lib/utils'
import { Flex, type FlexProps } from '../../layout/flex'

export interface CenterProps extends FlexProps {
  /**
   * inline-flex 사용 여부
   * @default false
   */
  inline?: boolean
}

const Center = React.forwardRef<HTMLDivElement, CenterProps>(
  ({ className, inline = false, ...props }, ref) => {
    return (
      <Flex
        ref={ref}
        data-slot="center"
        data-inline={inline}
        align="center"
        justify="center"
        className={cn('flex data-[inline=true]:inline-flex', className)}
        {...props}
      />
    )
  },
)
Center.displayName = 'Center'

export { Center }
