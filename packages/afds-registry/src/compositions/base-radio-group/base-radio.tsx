'use client'

import * as React from 'react'
import { RadioGroup } from '@turbo-project/afds/bricks'
import { cn } from '@turbo-project/afds/lib/utils'

// BaseRadio — base-ui Radio 패스스루 + 라벨 구성
//
// 선택 상태는 부모 BaseRadioGroup(base-ui RadioGroup)이 `value`로 결정한다.
// 선택 변경은 그룹의 `onValueChange`로 받는다(라디오 개별 콜백 아님 — base-ui 모델).
export interface BaseRadioProps {
  /** 그룹 내 고유 value */
  value?: string
  /** 비활성화 여부 */
  disabled?: boolean
  /** 라벨 */
  label?: React.ReactNode
  /** 추가 className */
  className?: string
  /** custom id */
  id?: string
  /** 클릭 핸들러 */
  onClick?: React.MouseEventHandler<HTMLElement>
}

export const BaseRadio = React.forwardRef<HTMLElement, BaseRadioProps>(
  ({ className, label, disabled, value, id, onClick }, ref) => {
    const generatedId = React.useId()
    const radioId = id || generatedId

    return (
      <RadioGroup.Container htmlFor={radioId} className={cn(className)}>
        <RadioGroup.Item
          ref={ref}
          id={radioId}
          value={value ?? ''}
          disabled={disabled}
          onClick={onClick}
        >
          <RadioGroup.Indicator />
        </RadioGroup.Item>
        {label && <RadioGroup.Label>{label}</RadioGroup.Label>}
      </RadioGroup.Container>
    )
  },
)
BaseRadio.displayName = 'BaseRadio'
