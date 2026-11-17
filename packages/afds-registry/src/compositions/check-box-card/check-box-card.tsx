'use client'

import * as React from 'react'
import { Checkbox as CheckboxPrimitive } from '@base-ui/react/checkbox'
import { CheckBox } from '@turbo-project/afds/bricks'
import { cn } from '@turbo-project/afds/lib/utils'

import { CheckIcon } from 'lucide-react'

import {
  cardContainerVariants,
  cardLabelVariants,
  cardCheckIconVariants,
} from './check-box-card.style'

// CheckBoxCard Component
//
// 테두리 카드형(선택 리스트 UI) 체크박스. 네이티브 체크박스를 숨기고
// 카드 전체를 선택 영역으로 사용하며, 우측에 체크 아이콘을 표시한다.
//
// base-checkbox(BaseCheckBox/BaseCheckBoxGroup)에 의존하지 않는 독립 컴포지션.
// components의 base-ui `CheckBox.*`만으로 구성되며, 그룹은 components의
// `CheckBoxGroup`(base-ui CheckboxGroup)과 `value`로 동작한다.
// 카드 chrome 스타일은 base-ui Root의 data-* 속성을 CSS로 읽어 자동 반영된다.

export type CheckBoxCardLabelRenderProps = {
  label: React.ReactNode
  checked: boolean
  disabled?: boolean
}

export interface CheckBoxCardProps extends CheckboxPrimitive.Root.Props {
  /** 카드에 표시할 라벨 */
  label?: React.ReactNode
  /** 카드 컨테이너(label)에 추가할 className */
  containerClassName?: string
  /**
   * 라벨 영역을 완전히 커스텀하는 렌더 함수.
   * `checked`는 standalone(controlled/uncontrolled)에서는 정확하며,
   * 그룹 사용 시 첫 토글 전까지는 초기값일 수 있다(기본 카드 표시는 CSS 구동이라 항상 정확).
   */
  renderLabel?: (props: CheckBoxCardLabelRenderProps) => React.ReactNode
}

export const CheckBoxCard = React.forwardRef<HTMLButtonElement, CheckBoxCardProps>(
  ({ className, containerClassName, label, renderLabel, ...rootProps }, ref) => {
    const { checked: checkedProp, defaultChecked, onCheckedChange, disabled } = rootProps

    // renderLabel용 checked 미러 — base-ui가 controlled/uncontrolled/group 모두 onCheckedChange를 호출
    const [checked, setChecked] = React.useState<boolean>(checkedProp ?? defaultChecked ?? false)
    React.useEffect(() => {
      if (checkedProp !== undefined) setChecked(checkedProp)
    }, [checkedProp])

    return (
      <CheckBox.Container className={cn(cardContainerVariants(), containerClassName)}>
        <CheckBox.Root
          ref={ref}
          hidden
          className={cn(className)}
          {...rootProps}
          onCheckedChange={(value, eventDetails) => {
            setChecked(value)
            onCheckedChange?.(value, eventDetails)
          }}
        />
        {label && (
          <span data-slot="check-box-label" className={cn(cardLabelVariants())}>
            {renderLabel ? (
              renderLabel({ label, checked, disabled })
            ) : (
              <div className="flex items-center justify-between gap-10">
                <div className="truncate">{label}</div>
                <span data-slot="check-box-card-icon" className={cn(cardCheckIconVariants())}>
                  <CheckIcon />
                </span>
              </div>
            )}
          </span>
        )}
      </CheckBox.Container>
    )
  },
)

CheckBoxCard.displayName = 'CheckBoxCard'
