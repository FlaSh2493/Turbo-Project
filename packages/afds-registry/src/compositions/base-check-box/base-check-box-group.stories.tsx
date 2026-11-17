import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { BaseCheckBoxGroup as CheckBoxGroup } from '.'
import { BaseCheckBox as CheckBox } from '.'

/**
 * # CheckBoxGroup
 *
 * 여러 CheckBox를 그룹으로 묶어 선택 상태를 통합 관리하는 컨텍스트 컴포넌트입니다.
 *
 *
 * ### 구조
 * ```tsx
 * <CheckBoxGroup defaultValue={['apple']}>
 *   <CheckBox value="apple" label="사과" />
 *   <CheckBox value="banana" label="바나나" />
 * </CheckBoxGroup>
 * ```
 *
 * ### 베스트 프랙티스
 * - 자식 `CheckBox`에는 반드시 고유한 `value` prop을 지정합니다
 * - `defaultValue` (uncontrolled) 또는 `value` + `onValueChange` (controlled)로 선택 상태를 관리합니다
 * - 전체 선택 패턴이 필요하면 `IndeterminateGroup` 스토리를 참고하세요
 */
const meta = {
  title: 'Compositions / Common / Form / BaseCheckBoxGroup',
  component: CheckBoxGroup,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
여러 CheckBox를 그룹으로 묶어 선택 상태를 통합 관리하는 컴포넌트입니다.

**Import:**
\`\`\`tsx
import { BaseCheckBoxGroup as CheckBoxGroup } from '.'
import { BaseCheckBox as CheckBox } from '.'
\`\`\`

### 기본 사용법
\`\`\`tsx
<CheckBoxGroup defaultValue={['apple']}>
  <CheckBox value="apple" label="사과" />
  <CheckBox value="banana" label="바나나" />
  <CheckBox value="cherry" label="체리" />
</CheckBoxGroup>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  args: {
    disabled: false,
    children: null,
  },
} satisfies Meta<typeof CheckBoxGroup>

export default meta
type Story = StoryObj<typeof meta>

const fruits = [
  { value: 'apple', label: '사과' },
  { value: 'banana', label: '바나나' },
  { value: 'cherry', label: '체리' },
  { value: 'grape', label: '포도' },
]

// Basic Stories

/** 기본 그룹입니다. `defaultValue`로 초기 선택 항목을 지정합니다. */
export const Default: Story = {
  args: { defaultValue: ['apple'] },
  render: args => (
    <CheckBoxGroup {...args}>
      <div className="flex flex-col gap-2">
        {fruits.map(f => (
          <CheckBox key={f.value} value={f.value} label={f.label} />
        ))}
      </div>
    </CheckBoxGroup>
  ),
}

// State Stories

/** 외부 상태로 제어되는 그룹입니다. */
export const Controlled: Story = {
  parameters: { controls: { disable: true } },
  render: function ControlledStory() {
    const [values, setValues] = React.useState<string[]>(['banana'])
    return (
      <div className="flex flex-col gap-[16px]">
        <CheckBoxGroup value={values} onValueChange={setValues}>
          <div className="flex flex-col gap-2">
            {fruits.map(f => (
              <CheckBox key={f.value} value={f.value} label={f.label} />
            ))}
          </div>
        </CheckBoxGroup>
        <div className="text-afds-12 text-afds-text-secondary">
          선택됨: {values.length > 0 ? values.join(', ') : '없음'}
        </div>
      </div>
    )
  },
}

/** 그룹 전체를 비활성화합니다. */
export const AllDisabled: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <CheckBoxGroup defaultValue={['apple']} disabled>
      <div className="flex flex-col gap-2">
        {fruits.map(f => (
          <CheckBox key={f.value} value={f.value} label={f.label} />
        ))}
      </div>
    </CheckBoxGroup>
  ),
}

// Pattern Stories

/**
 * "전체 선택" 패턴입니다.
 * 부모 체크박스는 하위 선택 상태에 따라 `checked` / `indeterminate` / `unchecked` 상태를 가집니다.
 */
export const IndeterminateGroup: Story = {
  parameters: { controls: { disable: true } },
  render: function IndeterminateGroupStory() {
    const [values, setValues] = React.useState<string[]>(['apple'])

    const allChecked = values.length === fruits.length
    const parentState = allChecked ? true : values.length > 0 ? 'indeterminate' : false

    const handleParentChange = () => {
      setValues(allChecked ? [] : fruits.map(f => f.value))
    }

    return (
      <div className="flex flex-col gap-2">
        <CheckBox label="전체 선택" checked={parentState} onCheckedChange={handleParentChange} />
        <div className="pl-6">
          <CheckBoxGroup value={values} onValueChange={setValues}>
            <div className="flex flex-col gap-2">
              {fruits.map(f => (
                <CheckBox key={f.value} value={f.value} label={f.label} />
              ))}
            </div>
          </CheckBoxGroup>
        </div>
        <div className="text-afds-12 text-afds-text-secondary">
          선택됨: {values.length > 0 ? values.join(', ') : '없음'}
        </div>
      </div>
    )
  },
}
