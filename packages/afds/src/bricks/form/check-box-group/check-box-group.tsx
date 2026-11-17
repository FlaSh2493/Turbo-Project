'use client'

import * as React from 'react'
import { CheckboxGroup as CheckboxGroupPrimitive } from '@base-ui/react/checkbox-group'
import { cn } from '../../../lib/utils'

// Root

export interface CheckBoxGroupRootProps extends React.ComponentPropsWithoutRef<
  typeof CheckboxGroupPrimitive
> {
  /**
   * 추가 className
   */
  className?: string
}

export const CheckBoxGroupRoot = React.forwardRef<
  React.ElementRef<typeof CheckboxGroupPrimitive>,
  CheckBoxGroupRootProps
>(
  (
    {
      /**
       * 추가 className
       */
      className,
      ...props
    },
    ref,
  ) => (
    <CheckboxGroupPrimitive
      ref={ref}
      data-slot="check-box-group-root"
      className={cn(className)}
      {...props}
    />
  ),
)
CheckBoxGroupRoot.displayName = 'CheckBoxGroupRoot'

export const CheckBoxGroup = {
  Root: CheckBoxGroupRoot,
}
