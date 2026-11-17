'use client'

import * as React from 'react'
import { RadioGroup as RadioGroupPrimitive } from '@base-ui/react/radio-group'
import { Radio as RadioPrimitive } from '@base-ui/react/radio'
import { cn } from '../../../lib/utils'
import {
  rootVariants,
  radioVariants,
  indicatorVariants,
  radioDotVariants,
  labelVariants,
} from './radio-group.style'

// Root

export interface RadioGroupRootProps extends React.ComponentPropsWithoutRef<
  typeof RadioGroupPrimitive
> {
  /**
   * 추가 className
   */
  className?: string
}

export const RadioGroupRoot = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive>,
  RadioGroupRootProps
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
    <RadioGroupPrimitive
      ref={ref}
      data-slot="radio-group-root"
      className={cn(className)}
      {...props}
    />
  ),
)
RadioGroupRoot.displayName = 'RadioGroupRoot'

// Container (non-base-ui, DS wrapper <label>)
//
// checked/disabled는 자식 Item의 data-* 자동 감지.

export interface RadioGroupContainerProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /**
   * 추가 className
   */
  className?: string
}

export const RadioGroupContainer = React.forwardRef<HTMLLabelElement, RadioGroupContainerProps>(
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
    <label
      ref={ref}
      data-slot="radio-container"
      className={cn(rootVariants(), className)}
      {...props}
    />
  ),
)
RadioGroupContainer.displayName = 'RadioGroupContainer'

// Item
//
// base-ui Radio.Root — data-checked/unchecked/disabled 자동 부여

/**
 * RadioGroup.Item의 Props
 */
export type RadioGroupItemProps = RadioPrimitive.Root.Props

export const RadioGroupItem = React.forwardRef<HTMLElement, RadioGroupItemProps>(
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
    <RadioPrimitive.Root
      ref={ref}
      data-slot="radio-input"
      className={cn(radioVariants(), className)}
      {...props}
    />
  ),
)
RadioGroupItem.displayName = 'RadioGroupItem'

// Indicator

/**
 * RadioGroup.Indicator의 Props
 */
export interface RadioGroupIndicatorProps extends RadioPrimitive.Indicator.Props {
  /** 선택 시 표시할 마크. 미지정 시 기본 dot. */
  children?: React.ReactNode
}

/**
 * 라디오 선택 시각화. 선택 시 dot(기본) 또는 `children`을 표시한다.
 */
export const RadioGroupIndicator = React.forwardRef<HTMLSpanElement, RadioGroupIndicatorProps>(
  ({ className, children, ...props }, ref) => (
    <RadioPrimitive.Indicator
      ref={ref}
      data-slot="radio-indicator"
      className={cn(indicatorVariants(), className)}
      {...props}
    >
      {children ?? <span data-slot="radio-dot" className={radioDotVariants()} />}
    </RadioPrimitive.Indicator>
  ),
)
RadioGroupIndicator.displayName = 'RadioGroupIndicator'

// Label (non-base-ui, DS text)
//
// peer Item의 data-* 자동 감지.

export interface RadioGroupLabelProps extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * 추가 className
   */
  className?: string
}

export const RadioGroupLabel = React.forwardRef<HTMLSpanElement, RadioGroupLabelProps>(
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
    <span ref={ref} data-slot="radio-label" className={cn(labelVariants(), className)} {...props} />
  ),
)
RadioGroupLabel.displayName = 'RadioGroupLabel'

export const RadioGroup = {
  Root: RadioGroupRoot,
  Container: RadioGroupContainer,
  Item: RadioGroupItem,
  Indicator: RadioGroupIndicator,
  Label: RadioGroupLabel,
}
