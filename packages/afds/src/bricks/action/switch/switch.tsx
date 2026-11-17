'use client'

import * as React from 'react'
import { Switch as SwitchPrimitive } from '@base-ui/react/switch'
import { cn } from '../../../lib/utils'
import { switchRootBase, switchThumbBase } from './switch.style'

export type SwitchRootProps = SwitchPrimitive.Root.Props & {
  /**
   * 추가 className
   */
  className?: string
}

export const SwitchRoot = React.forwardRef<
  React.ComponentRef<typeof SwitchPrimitive.Root>,
  SwitchRootProps
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    data-slot="switch"
    className={cn(switchRootBase(), className)}
    {...props}
  />
))
SwitchRoot.displayName = 'SwitchRoot'

export type SwitchThumbProps = SwitchPrimitive.Thumb.Props & {
  /**
   * 추가 className
   */
  className?: string
}

export const SwitchThumb = React.forwardRef<
  React.ComponentRef<typeof SwitchPrimitive.Thumb>,
  SwitchThumbProps
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Thumb
    ref={ref}
    data-slot="switch-thumb"
    className={cn(switchThumbBase(), className)}
    {...props}
  />
))
SwitchThumb.displayName = 'SwitchThumb'

export const Switch = {
  Root: SwitchRoot,
  Thumb: SwitchThumb,
}
