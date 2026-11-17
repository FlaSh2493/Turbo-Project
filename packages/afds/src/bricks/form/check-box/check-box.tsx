'use client'

import * as React from 'react'
import { Checkbox as CheckboxPrimitive } from '@base-ui/react/checkbox'
import { CheckIcon } from 'lucide-react'
import { cn } from '../../../lib/utils'
import {
  rootVariants,
  checkboxVariants,
  indicatorVariants,
  indeterminateIndicatorVariants,
  labelVariants,
  checkMarkVariants,
} from './check-box.style'

// Container (non-base-ui, DS wrapper)
//
// group/cbx 컨텍스트만 제공. checked/disabled 상태는 has-[]/group-has-[]로 자동 감지.

export interface CheckBoxContainerProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /**
   * 추가 className
   */
  className?: string
}

export const CheckBoxContainer = React.forwardRef<HTMLLabelElement, CheckBoxContainerProps>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      data-slot="check-box-container"
      className={cn(rootVariants(), className)}
      {...props}
    />
  ),
)
CheckBoxContainer.displayName = 'CheckBoxContainer'

// Root
//
// base-ui Checkbox.Root가 controlled/uncontrolled 모두 지원하고
// data-checked/data-unchecked/data-indeterminate/data-disabled 자동 부여.
// 스타일은 그 속성을 cva가 직접 selector로 받음.

/**
 * CheckBox.Root의 Props
 */
export type CheckBoxRootProps = CheckboxPrimitive.Root.Props

export const CheckBoxRoot = React.forwardRef<HTMLElement, CheckBoxRootProps>(
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
    <CheckboxPrimitive.Root
      ref={ref}
      data-slot="check-box"
      className={cn(checkboxVariants(), className)}
      {...props}
    />
  ),
)
CheckBoxRoot.displayName = 'CheckBoxRoot'

// Indicator

/**
 * CheckBox.Indicator의 Props
 */
export interface CheckBoxIndicatorProps extends CheckboxPrimitive.Indicator.Props {
  /** 체크(checked) 시 표시할 마크. 미지정 시 기본 체크 아이콘. */
  children?: React.ReactNode
  /** indeterminate 시 표시할 마크. 미지정 시 기본 dash. */
  indeterminateMark?: React.ReactNode
}

/**
 * 체크 상태 시각화. checked일 땐 checkmark, indeterminate일 땐 dash를 CSS로 토글한다.
 * checkmark는 `children`, indeterminate 마크는 `indeterminateMark`로 커스텀한다.
 */
export const CheckBoxIndicator = React.forwardRef<HTMLSpanElement, CheckBoxIndicatorProps>(
  ({ className, children, indeterminateMark, ...props }, ref) => (
    <CheckboxPrimitive.Indicator
      ref={ref}
      data-slot="check-box-indicator"
      className={cn(indicatorVariants(), className)}
      {...props}
    >
      <span data-slot="check-box-check-mark" className={checkMarkVariants()}>
        {children ?? <CheckIcon size={16} />}
      </span>
      <span data-slot="check-box-indeterminate-mark" className={indeterminateIndicatorVariants()}>
        {indeterminateMark}
      </span>
    </CheckboxPrimitive.Indicator>
  ),
)
CheckBoxIndicator.displayName = 'CheckBoxIndicator'

// Label (non-base-ui)
//
// Root(peer/cbx)의 data-* 속성을 peer-data-로 자동 감지.

export interface CheckBoxLabelProps extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * 추가 className
   */
  className?: string
}

export const CheckBoxLabel = React.forwardRef<HTMLSpanElement, CheckBoxLabelProps>(
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
    <span
      ref={ref}
      data-slot="check-box-label"
      className={cn(labelVariants(), className)}
      {...props}
    />
  ),
)
CheckBoxLabel.displayName = 'CheckBoxLabel'

export const CheckBox = {
  Container: CheckBoxContainer,
  Root: CheckBoxRoot,
  Indicator: CheckBoxIndicator,
  Label: CheckBoxLabel,
}
