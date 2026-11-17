'use client'

import * as React from 'react'
import { Accordion as AccordionPrimitive } from '@base-ui/react/accordion'
import { ChevronDownIcon } from 'lucide-react'
import { cn } from '../../../lib/utils'
import {
  accordionRootBase,
  accordionItemBase,
  accordionTriggerBase,
  accordionContentBase,
  accordionBodyBase,
  accordionIndicatorBase,
} from './accordion.style'
import { Typography } from '../../display/typography'

export type AccordionRootProps = AccordionPrimitive.Root.Props & {
  /**
   * 추가 className
   */
  className?: string
}

export const AccordionRoot = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Root>,
  AccordionRootProps
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Root
    ref={ref}
    data-slot="accordion-root"
    className={cn(accordionRootBase, className)}
    {...props}
  />
))
AccordionRoot.displayName = 'AccordionRoot'

export type AccordionItemProps = AccordionPrimitive.Item.Props

export const AccordionItem = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Item>,
  AccordionItemProps
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    data-slot="accordion-item"
    className={cn(accordionItemBase, className)}
    {...props}
  />
))
AccordionItem.displayName = 'AccordionItem'

export type AccordionHeaderProps = AccordionPrimitive.Header.Props

export const AccordionHeader = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Header>,
  AccordionHeaderProps
>((props, ref) => <AccordionPrimitive.Header ref={ref} data-slot="accordion-header" {...props} />)
AccordionHeader.displayName = 'AccordionHeader'

export type AccordionTriggerProps = AccordionPrimitive.Trigger.Props

export const AccordionTrigger = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Trigger>,
  AccordionTriggerProps
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header data-slot="accordion-header">
    <AccordionPrimitive.Trigger
      ref={ref}
      data-slot="accordion-trigger"
      className={cn(accordionTriggerBase, 'group', className)}
      {...props}
    >
      {children}
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
))
AccordionTrigger.displayName = 'AccordionTrigger'

// Indicator (프리셋)

export type AccordionIndicatorProps = React.HTMLAttributes<HTMLSpanElement> & {
  /**
   * 추가 className
   */
  className?: string
  /**
   * 인디케이터 내부 콘텐츠 (기본값: 화살표 아이콘)
   */
  children?: React.ReactNode
}

export const AccordionIndicator = React.forwardRef<HTMLSpanElement, AccordionIndicatorProps>(
  ({ className, children, ...props }, ref) => (
    <span
      ref={ref}
      data-slot="accordion-indicator"
      className={cn(accordionIndicatorBase, className)}
      {...props}
    >
      {children ?? <ChevronDownIcon size={16} />}
    </span>
  ),
)
AccordionIndicator.displayName = 'AccordionIndicator'

// Content

export type AccordionContentProps = AccordionPrimitive.Panel.Props

export const AccordionContent = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Panel>,
  AccordionContentProps
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Panel
    ref={ref}
    data-slot="accordion-content"
    className={cn(accordionContentBase, className)}
    {...props}
  >
    {children}
  </AccordionPrimitive.Panel>
))
AccordionContent.displayName = 'AccordionContent'

// Body (프리셋)

export type AccordionBodyProps = React.ComponentPropsWithoutRef<typeof Typography> & {
  /**
   * 추가 className
   */
  className?: string
}

export const AccordionBody = React.forwardRef<HTMLElement, AccordionBodyProps>(
  ({ className, children, ...props }, ref) => (
    <Typography
      ref={ref}
      as="div"
      data-slot="accordion-body"
      variant="body2"
      color="text-secondary"
      className={cn(accordionBodyBase, className)}
      {...props}
    >
      {children}
    </Typography>
  ),
)
AccordionBody.displayName = 'AccordionBody'

export const Accordion = {
  Root: AccordionRoot,
  Item: AccordionItem,
  Header: AccordionHeader,
  Trigger: AccordionTrigger,
  Indicator: AccordionIndicator,
  Content: AccordionContent,
  Body: AccordionBody,
}
