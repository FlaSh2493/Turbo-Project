'use client'

import * as React from 'react'
import { RadioGroup } from '@turbo-project/afds/bricks'
import { cn } from '@turbo-project/afds/lib/utils'

import { cardContainerVariants, cardLabelVariants } from './radio-card.style'

// RadioCard Component (thick closed API)
//
// 테두리 카드형(선택 리스트 UI) 라디오. 카드 전체를 선택 영역으로 사용하며,
// 라벨(좌측) + 라디오 dot(우측)을 카드 안에 배치한다.
//
// components의 `RadioGroup`(base-ui) part를 그대로 사용한다. 선택 상태/접근성/키보드는
// base-ui RadioGroup이 담당하므로 `RadioGroup.Root` 또는 `BaseRadioGroup` 어느 쪽으로 감싸도
// 동작한다. (선택 상태는 그룹이 소유)

export interface RadioCardProps {
  /** 그룹 내에서의 값 (그룹 사용 시 필수) */
  value?: string
  /** 카드에 표시할 라벨 */
  label?: React.ReactNode
  /** 비활성화 여부 */
  disabled?: boolean
  /** 라디오 요소(Item)에 추가할 className */
  className?: string
  /** 카드 컨테이너(label)에 추가할 className */
  containerClassName?: string
  /** 라디오 요소 id (라벨 연결용) */
  id?: string
  /** 라디오 요소 클릭 핸들러 */
  onClick?: React.MouseEventHandler<HTMLElement>
}

export const RadioCard = React.forwardRef<HTMLElement, RadioCardProps>(
  ({ className, containerClassName, label, id, disabled, value, onClick }, ref) => {
    const generatedId = React.useId()
    const radioId = id || generatedId

    return (
      <RadioGroup.Container
        htmlFor={radioId}
        className={cn(cardContainerVariants(), containerClassName)}
      >
        <RadioGroup.Item
          ref={ref}
          id={radioId}
          value={value ?? ''}
          disabled={disabled}
          className={cn(className)}
          onClick={onClick}
        >
          <RadioGroup.Indicator />
        </RadioGroup.Item>
        {label && (
          <span data-slot="radio-label" className={cn(cardLabelVariants())}>
            {label}
          </span>
        )}
      </RadioGroup.Container>
    )
  },
)

RadioCard.displayName = 'RadioCard'
