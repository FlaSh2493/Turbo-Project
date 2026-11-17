'use client'

import * as React from 'react'
import { Field } from '@base-ui/react/field'
import { Input as InputPrimitive } from '@base-ui/react/input'
import type { VariantProps } from 'class-variance-authority'
import { cn } from '../../../lib/utils'
import { inputRootVariants, inputFieldVariants, inputClearButtonVariants } from './input.style'

export interface InputRootProps extends Field.Root.Props, VariantProps<typeof inputRootVariants> {
  /**
   * 입력 필드의 크기
   */
  size?: VariantProps<typeof inputRootVariants>['size']
  /**
   * 에러 상태 여부. 지정 시 `data-error`로 노출되어 에러 스타일이 적용된다.
   */
  error?: boolean
  /**
   * 추가 className
   */
  className?: string
}

export const InputRoot = React.forwardRef<React.ComponentRef<typeof Field.Root>, InputRootProps>(
  (
    {
      /**
       * 입력 필드의 크기
       */
      size,
      /**
       * 에러 상태 여부
       */
      error,
      /**
       * 추가 className
       */
      className,
      disabled,
      ...props
    },
    ref,
  ) => (
    <Field.Root
      ref={ref}
      data-slot="input"
      data-error={error || undefined}
      data-disabled={disabled || undefined}
      disabled={disabled}
      className={cn(inputRootVariants({ size }), className)}
      {...props}
    />
  ),
)
InputRoot.displayName = 'InputRoot'

// Field (the <input>)

export interface InputFieldProps extends InputPrimitive.Props {
  /**
   * 입력 필드의 타입
   * @default 'text'
   */
  type?: string
  /**
   * 에러 상태 여부. 지정 시 `data-error`로 노출되어 에러 텍스트 색이 적용된다.
   */
  error?: boolean
  /**
   * 추가 className
   */
  className?: string
}

export const InputField = React.forwardRef<
  React.ComponentRef<typeof InputPrimitive>,
  InputFieldProps
>(
  (
    {
      /**
       * 입력 필드의 타입
       * @default 'text'
       */
      type = 'text',
      /**
       * 에러 상태 여부
       */
      error,
      /**
       * 추가 className
       */
      className,
      disabled,
      ...props
    },
    ref,
  ) => (
    <InputPrimitive
      ref={ref}
      type={type}
      data-slot="input-field"
      data-error={error || undefined}
      disabled={disabled}
      className={cn(inputFieldVariants(), className)}
      {...props}
    />
  ),
)
InputField.displayName = 'InputField'

// Icon (non-base-ui, DS layout wrapper)

export interface InputIconProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * 추가 className
   */
  className?: string
}

export const InputIcon = React.forwardRef<HTMLDivElement, InputIconProps>(
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
    <div
      ref={ref}
      data-slot="input-icon"
      className={cn('flex-shrink-0 text-afds-text-secondary', className)}
      {...props}
    />
  ),
)
InputIcon.displayName = 'InputIcon'

// ClearButton (non-base-ui, DS button)

export interface InputClearButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * 버튼의 접근성 라벨
   * @default 'Clear input'
   */
  'aria-label'?: string
  /**
   * 추가 className
   */
  className?: string
}

export const InputClearButton = React.forwardRef<HTMLButtonElement, InputClearButtonProps>(
  (
    {
      /**
       * 버튼의 접근성 라벨
       * @default 'Clear input'
       */
      'aria-label': ariaLabel = 'Clear input',
      /**
       * 추가 className
       */
      className,
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      type="button"
      data-slot="input-clear-button"
      aria-label={ariaLabel}
      className={cn(inputClearButtonVariants(), className)}
      {...props}
    />
  ),
)
InputClearButton.displayName = 'InputClearButton'

export const Input = {
  Root: InputRoot,
  Field: InputField,
  Icon: InputIcon,
  ClearButton: InputClearButton,
}
