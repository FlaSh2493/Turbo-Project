'use client'

import * as React from 'react'
import { CheckboxGroup as CheckboxGroupPrimitive } from '@base-ui/react/checkbox-group'
import { cn } from '@turbo-project/afds/lib/utils'

// BaseCheckBoxGroup — base-ui CheckboxGroup 패스스루
//
// 그룹 상태(value 배열·자식 체크 동기화·전체선택/indeterminate)는 base-ui CheckboxGroup이
// 내부 context로 처리한다. 각 자식 BaseCheckBox는 `value`로 그룹에 자동 연결된다.
// 전체선택 부모는 base-ui `allValues` + `useCheckboxGroupParent`로 구성한다.
export interface BaseCheckBoxGroupProps extends React.ComponentPropsWithoutRef<
  typeof CheckboxGroupPrimitive
> {
  children: React.ReactNode
}

export const BaseCheckBoxGroup = React.forwardRef<
  React.ElementRef<typeof CheckboxGroupPrimitive>,
  BaseCheckBoxGroupProps
>(({ className, children, ...props }, ref) => (
  <CheckboxGroupPrimitive
    ref={ref}
    data-slot="check-box-group"
    className={cn(className)}
    {...props}
  >
    {children}
  </CheckboxGroupPrimitive>
))

BaseCheckBoxGroup.displayName = 'BaseCheckBoxGroup'

// BaseCheckBoxContent Component
export const BaseCheckBoxContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return <div ref={ref} data-slot="base-check-box-content" className={className} {...props} />
})

BaseCheckBoxContent.displayName = 'BaseCheckBoxContent'
