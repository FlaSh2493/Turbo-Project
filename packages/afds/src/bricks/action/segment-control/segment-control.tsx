'use client'

import { createContext, useContext } from 'react'
import * as React from 'react'
import type { VariantProps } from 'class-variance-authority'
import {
  segmentControlIndicatorVariants,
  segmentControlItemVariants,
  segmentControlVariants,
} from './segment-control.style'
import { cn } from '../../../lib/utils'
import { composeEventHandlers } from '../../../lib/compose-event-handlers'
import { useSegmentControl } from '../../../headless/segment-control'

// Primitives

export type SegmentControlPrimitiveRootProps = React.HTMLAttributes<HTMLDivElement> & {
  /**
   * 자식 요소
   */
  children?: React.ReactNode
  /**
   * 추가 className
   */
  className?: string
}

export const SegmentControlPrimitiveRoot = React.forwardRef<
  HTMLDivElement,
  SegmentControlPrimitiveRootProps
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="segment-control-root"
    className={cn(className)}
    role="tablist"
    {...props}
  >
    {children}
  </div>
))
SegmentControlPrimitiveRoot.displayName = 'SegmentControlPrimitiveRoot'

export interface SegmentControlPrimitiveIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * 인디케이터의 좌측 위치 (px)
   */
  left: number
  /**
   * 인디케이터의 너비 (px)
   */
  width: number
  /**
   * 추가 className
   */
  className?: string
  /**
   * 인라인 스타일 (레이아웃 계산값)
   */
  style?: React.CSSProperties
}

export const SegmentControlPrimitiveIndicator = React.forwardRef<
  HTMLDivElement,
  SegmentControlPrimitiveIndicatorProps
>(({ className, left, width, style, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="segment-control-indicator"
    className={cn(className)}
    // eslint-disable-next-line no-restricted-syntax -- indicator 위치는 런타임 계산값
    style={{
      left,
      width,
      ...style,
    }}
    {...props}
  />
))
SegmentControlPrimitiveIndicator.displayName = 'SegmentControlPrimitiveIndicator'

export interface SegmentControlPrimitiveItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * 선택 여부
   * @default false
   */
  selected?: boolean
  /**
   * 버튼의 자식 요소
   */
  children: React.ReactNode
  /**
   * 추가 className
   */
  className?: string
}

export const SegmentControlPrimitiveItem = React.forwardRef<
  HTMLButtonElement,
  SegmentControlPrimitiveItemProps
>(({ className, selected = false, children, type = 'button', ...props }, ref) => (
  <button
    ref={ref}
    type={type}
    data-slot="segment-control-item"
    data-state={selected ? 'active' : 'inactive'}
    role="tab"
    aria-selected={selected}
    tabIndex={selected ? 0 : -1}
    className={cn(className)}
    {...props}
  >
    {children}
  </button>
))
SegmentControlPrimitiveItem.displayName = 'SegmentControlItem'

export const SegmentControlPrimitive = {
  Root: SegmentControlPrimitiveRoot,
  Indicator: SegmentControlPrimitiveIndicator,
  Item: SegmentControlPrimitiveItem,
}

// Context

interface ItemProps {
  ref: (element: HTMLElement | null) => void
  isSelected: boolean
  handleClick: () => void
}

interface ItemRect {
  left: number
  width: number
}

interface SegmentControlContextValue {
  getItemProps: (value: string) => ItemProps
  size: 'sm' | 'default' | 'lg'
  indicatorStyle: ItemRect | null
}

const SegmentControlContext = createContext<SegmentControlContextValue | null>(null)

function useSegmentControlContext() {
  const context = useContext(SegmentControlContext)
  if (!context) {
    throw new Error('SegmentControl components must be used within SegmentControl.Root')
  }
  return context
}

// Root

interface SegmentControlRootProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'defaultValue'>,
    VariantProps<typeof segmentControlVariants> {
  /**
   * 초기 선택값
   */
  defaultValue?: string
  /**
   * 현재 선택값 (제어 컴포넌트)
   */
  value?: string
  /**
   * 선택값 변경 시 호출되는 콜백
   */
  onValueChange?: (value: string) => void
  /**
   * 자식 요소 (SegmentControl.Item 등)
   */
  children: React.ReactNode
  /**
   * 세그먼트 컨트롤의 크기
   */
  size?: 'sm' | 'default' | 'lg'
  /**
   * 추가 className
   */
  className?: string
}

const SegmentControlRoot = ({
  className,
  size,
  value,
  defaultValue,
  onValueChange,
  children,
  ...props
}: SegmentControlRootProps) => {
  const { getItemProps, indicatorStyle } = useSegmentControl({ value, defaultValue, onValueChange })

  return (
    <SegmentControlContext.Provider
      value={{
        getItemProps,
        size: size ?? 'default',
        indicatorStyle,
      }}
    >
      <SegmentControlPrimitive.Root
        className={cn(segmentControlVariants({ size }), className)}
        data-size={size ?? 'default'}
        {...props}
      >
        {children}
      </SegmentControlPrimitive.Root>
    </SegmentControlContext.Provider>
  )
}

// Indicator

const SegmentControlIndicator = () => {
  const { indicatorStyle, size } = useSegmentControlContext()
  if (!indicatorStyle) return null

  return (
    <SegmentControlPrimitive.Indicator
      left={indicatorStyle.left}
      width={indicatorStyle.width}
      data-size={size}
      className={segmentControlIndicatorVariants({ size })}
    />
  )
}

// Item

interface SegmentControlItemProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'value'
> {
  /**
   * 아이템의 고유 값
   */
  value: string
  /**
   * 아이템의 자식 요소
   */
  children: React.ReactNode
  /**
   * 추가 className
   */
  className?: string
}

const SegmentControlItem = ({ className, value, children, ...props }: SegmentControlItemProps) => {
  const { getItemProps, size } = useSegmentControlContext()
  const { ref, isSelected, handleClick } = getItemProps(value)

  return (
    <SegmentControlPrimitive.Item
      ref={ref}
      selected={isSelected}
      data-size={size}
      data-value={value}
      className={cn(segmentControlItemVariants({ size, selected: isSelected }), className)}
      {...props}
      onClick={composeEventHandlers(props.onClick, handleClick)}
    >
      {children}
    </SegmentControlPrimitive.Item>
  )
}

export const SegmentControl = {
  Root: SegmentControlRoot,
  Indicator: SegmentControlIndicator,
  Item: SegmentControlItem,
}

export type { SegmentControlRootProps, SegmentControlItemProps }
