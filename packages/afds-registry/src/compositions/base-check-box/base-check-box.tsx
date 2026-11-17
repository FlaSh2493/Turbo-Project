'use client'

import * as React from 'react'
import { Checkbox as CheckboxPrimitive } from '@base-ui/react/checkbox'
import { CheckBox } from '@turbo-project/afds/bricks'
import { cn } from '@turbo-project/afds/lib/utils'

// BaseCheckBox (thick closed API)
//
// 체크 상태·controlled/uncontrolled·그룹 멤버십(그룹 내 `value`로 자동)·indeterminate는
// 모두 base-ui Checkbox가 처리한다. AFDS 자체 헤드리스 훅에 의존하지 않는다.
// 3-state(`checked`/`defaultChecked`에 `'indeterminate'`)는 base-ui의 boolean `checked`
// + `indeterminate`로 매핑한다. 시각 상태는 base-ui data-* 속성을 CSS로 받아 처리한다.
// 카드형(사각 테두리) 체크박스는 `CheckBoxCard` 컴포지션을 사용한다.

export type BaseCheckBoxLabelRenderProps = {
  label: React.ReactNode
  checked: boolean | 'indeterminate'
  disabled?: boolean
}

export interface BaseCheckBoxProps extends Omit<
  CheckboxPrimitive.Root.Props,
  'checked' | 'defaultChecked' | 'indeterminate' | 'onCheckedChange'
> {
  /** 라벨 텍스트 */
  label?: React.ReactNode
  /** 컨테이너(label)에 추가할 className */
  containerClassName?: string
  /** 인디케이터에 추가할 className */
  indicatorClassName?: string
  /** 체크 상태. `'indeterminate'`는 부모 전체선택 패턴용. */
  checked?: boolean | 'indeterminate'
  /** 초기 체크 상태(uncontrolled). */
  defaultChecked?: boolean | 'indeterminate'
  /** 체크 상태 변경 콜백 */
  onCheckedChange?: (checked: boolean) => void
  /** 라벨 영역 커스텀 렌더 */
  renderLabel?: (props: BaseCheckBoxLabelRenderProps) => React.ReactNode
}

export const BaseCheckBox = React.forwardRef<HTMLButtonElement, BaseCheckBoxProps>(
  (
    {
      id,
      className,
      containerClassName,
      indicatorClassName,
      label,
      checked: checkedProp,
      defaultChecked,
      onCheckedChange,
      disabled,
      renderLabel,
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId()
    const checkboxId = id || generatedId

    const isIndeterminate = checkedProp === 'indeterminate'
    const isDefaultIndeterminate = defaultChecked === 'indeterminate'

    // renderLabel용 checked 미러 — base-ui가 controlled/uncontrolled/group 모두 onCheckedChange를 호출.
    // uncontrolled 초기 indeterminate는 'indeterminate'로 보존했다가, 첫 토글에서 boolean으로 확정된다.
    // (base-ui는 indeterminate를 자동 해제하지 않으므로 토글 여부를 이 미러로 추적한다.)
    const [checkedState, setCheckedState] = React.useState<boolean | 'indeterminate'>(
      typeof checkedProp === 'boolean'
        ? checkedProp
        : isDefaultIndeterminate
          ? 'indeterminate'
          : ((defaultChecked as boolean | undefined) ?? false),
    )
    React.useEffect(() => {
      if (typeof checkedProp === 'boolean') setCheckedState(checkedProp)
    }, [checkedProp])

    // controlled는 checkedProp가 우선, uncontrolled는 미러가 'indeterminate'인 동안만 mixed.
    const showIndeterminate = isIndeterminate || checkedState === 'indeterminate'
    const labelChecked: boolean | 'indeterminate' = isIndeterminate ? 'indeterminate' : checkedState

    return (
      <CheckBox.Container className={cn(containerClassName)}>
        <CheckBox.Root
          ref={ref}
          id={checkboxId}
          className={cn(className)}
          checked={isIndeterminate ? false : (checkedProp as boolean | undefined)}
          defaultChecked={isDefaultIndeterminate ? false : (defaultChecked as boolean | undefined)}
          indeterminate={showIndeterminate}
          disabled={disabled}
          onCheckedChange={(value, _eventDetails) => {
            setCheckedState(value)
            onCheckedChange?.(value)
          }}
          {...props}
        >
          <CheckBox.Indicator keepMounted className={cn(indicatorClassName)} />
        </CheckBox.Root>
        {label && (
          <CheckBox.Label>
            {renderLabel ? renderLabel({ label, checked: labelChecked, disabled }) : label}
          </CheckBox.Label>
        )}
      </CheckBox.Container>
    )
  },
)

BaseCheckBox.displayName = 'BaseCheckBox'
