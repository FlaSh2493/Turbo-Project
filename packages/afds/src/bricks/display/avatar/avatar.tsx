'use client'

import * as React from 'react'
import { Avatar as AvatarPrimitive } from '@base-ui/react/avatar'
import { cn } from '../../../lib/utils'
import { avatarFallbackBase, avatarRootBase } from './avatar.style'

// Root

/**
 * Avatar Root 컴포넌트의 Props
 */
export interface AvatarRootProps extends AvatarPrimitive.Root.Props {
  /**
   * 추가 className
   */
  className?: string
}

export const AvatarRoot = React.forwardRef<
  React.ComponentRef<typeof AvatarPrimitive.Root>,
  AvatarRootProps
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    data-slot="avatar"
    className={cn(avatarRootBase, className)}
    {...props}
  />
))
AvatarRoot.displayName = 'AvatarRoot'

// Image

/**
 * Avatar Image 컴포넌트의 Props
 */
export interface AvatarImageProps extends AvatarPrimitive.Image.Props {
  /**
   * 추가 className
   */
  className?: string
}

export const AvatarImage = React.forwardRef<
  React.ComponentRef<typeof AvatarPrimitive.Image>,
  AvatarImageProps
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    data-slot="avatar-image"
    className={cn('block h-full w-full object-cover', className)}
    {...props}
  />
))
AvatarImage.displayName = 'AvatarImage'

// Fallback

/**
 * Avatar Fallback 컴포넌트의 Props
 */
export interface AvatarFallbackProps extends AvatarPrimitive.Fallback.Props {
  /**
   * 추가 className
   */
  className?: string
}

export const AvatarFallback = React.forwardRef<
  React.ComponentRef<typeof AvatarPrimitive.Fallback>,
  AvatarFallbackProps
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    data-slot="avatar-fallback"
    className={cn(avatarFallbackBase, className)}
    {...props}
  />
))
AvatarFallback.displayName = 'AvatarFallback'

export const Avatar = {
  Root: AvatarRoot,
  Image: AvatarImage,
  Fallback: AvatarFallback,
}
