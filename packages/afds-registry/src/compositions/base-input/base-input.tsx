'use client'

import { type InputHTMLAttributes, forwardRef, useCallback, useState, type ReactNode } from 'react'
import { CircleXIcon } from 'lucide-react'
import { Input, type InputRootProps } from '@turbo-project/afds/bricks'
import { cn } from '@turbo-project/afds/lib/utils'

// BaseInput — base-ui Input 패스스루 + 라벨/아이콘/클리어 구성
//
// value/controlled-uncontrolled·readOnly·disabled·error 상태는 base-ui Input(Field)이
// data-attr로 처리하고 스타일은 CSS(data-attr/native :read-only)로 구동된다.
// AFDS 헤드리스에 의존하지 않으며, clear 버튼 표시/초기화 같은 소형 UI 로직만 인라인한다.
export interface BaseInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size' | 'onChange'
> {
  size?: InputRootProps['size']
  defaultValue?: string
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
  readOnly?: boolean
  error?: boolean | string
  icon?: ReactNode | false
  clearable?: boolean
  onClear?: () => void
}

export const BaseInput = forwardRef<HTMLInputElement, BaseInputProps>(
  (
    {
      className,
      size = 'sm',
      defaultValue,
      value,
      onChange,
      disabled,
      readOnly,
      error,
      icon,
      clearable = true,
      onClear,
      placeholder = 'Placeholder',
      ...props
    },
    ref,
  ) => {
    const isControlled = value !== undefined
    const [internalValue, setInternalValue] = useState(defaultValue ?? '')
    const currentValue = isControlled ? value : internalValue

    const hasError = Boolean(error)
    const errorMessage = typeof error === 'string' ? error : undefined
    const displayPlaceholder = errorMessage ?? placeholder

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const next = e.target.value
        if (!isControlled) setInternalValue(next)
        onChange?.(next)
      },
      [isControlled, onChange],
    )

    const handleClearClick = useCallback(() => {
      if (!isControlled) setInternalValue('')
      onChange?.('')
      onClear?.()
    }, [isControlled, onChange, onClear])

    const showClearButton = clearable && !disabled && !readOnly && !!currentValue
    const showIcon = !!icon

    return (
      <Input.Root size={size} error={hasError} className={cn(className)}>
        {showIcon && <Input.Icon>{icon}</Input.Icon>}
        <Input.Field
          ref={ref}
          error={hasError}
          value={currentValue}
          disabled={disabled}
          readOnly={readOnly}
          placeholder={displayPlaceholder}
          onChange={handleChange}
          {...props}
        />
        {showClearButton && (
          <Input.ClearButton onClick={handleClearClick}>
            <CircleXIcon size={16} className="h-4 w-4" />
          </Input.ClearButton>
        )}
      </Input.Root>
    )
  },
)

BaseInput.displayName = 'BaseInput'
