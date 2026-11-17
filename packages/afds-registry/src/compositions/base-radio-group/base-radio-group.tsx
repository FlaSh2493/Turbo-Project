'use client'

import * as React from 'react'
import { RadioGroup as RadioGroupPrimitive } from '@base-ui/react/radio-group'
import { cn } from '@turbo-project/afds/lib/utils'

// BaseRadioGroup — base-ui RadioGroup 패스스루
//
// 선택 상태(value·controlled/uncontrolled·자식 선택 동기화·키보드 네비게이션)는
// base-ui RadioGroup이 내부 context로 처리한다. 각 자식 BaseRadio는 `value`로 연결된다.
// AFDS 자체 헤드리스 훅에 의존하지 않는다.
// 공개 API는 `value`/`onValueChange`를 string으로 고정하고 내부에서 base-ui에 어댑트한다.
export interface BaseRadioGroupProps extends Omit<
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive>,
  'value' | 'defaultValue' | 'onValueChange'
> {
  /** Controlled 선택값 */
  value?: string
  /** Uncontrolled 초기 선택값 */
  defaultValue?: string
  /** 선택값 변경 콜백 */
  onValueChange?: (value: string) => void
  children: React.ReactNode
}

export const BaseRadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive>,
  BaseRadioGroupProps
>(({ className, children, value, defaultValue, onValueChange, ...props }, ref) => (
  <RadioGroupPrimitive
    ref={ref}
    data-slot="radio-group-root"
    className={cn('grid gap-2', className)}
    value={value}
    defaultValue={defaultValue}
    onValueChange={onValueChange ? v => onValueChange(v as string) : undefined}
    {...props}
  >
    {children}
  </RadioGroupPrimitive>
))

BaseRadioGroup.displayName = 'BaseRadioGroup'
