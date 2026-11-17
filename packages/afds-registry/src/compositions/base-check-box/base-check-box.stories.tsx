import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { BaseCheckBox as CheckBox } from '.'

/**
 * # CheckBox
 *
 * 디자인 토큰이 적용된 체크박스 컴포넌트입니다.
 *
 *
 * ### 기본 사용
 * ```tsx
 * <CheckBox label="동의합니다" />
 * ```
 *
 * > 테두리 카드형 항목(선택 리스트 UI)이 필요하면 `CheckBoxCard` 컴포지션을 사용하세요.
 *
 * ### checked 상태
 * - `true`: 체크됨
 * - `false`: 미체크 (기본값)
 * - `'indeterminate'`: 중간 상태 (전체 선택 패턴의 부모 체크박스에 활용)
 *
 * ### 베스트 프랙티스
 * - `CheckBoxGroup`과 함께 사용할 때는 반드시 `value` prop을 지정합니다
 * - 전체 선택 패턴은 `IndeterminateGroup` 스토리를 참고하세요
 */
const argTypes = {
  checked: {
    control: { type: 'select' as const },
    options: [true, false, 'indeterminate'],
    description: "체크 상태. `true` | `false` | `'indeterminate'`(부모 전체 선택 패턴용).",
    table: { type: { summary: "boolean | 'indeterminate'" } },
  },
}

const meta = {
  title: 'Compositions / Common / Form / BaseCheckBox',
  component: CheckBox,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
디자인 토큰이 적용된 체크박스 컴포넌트입니다.

**Import:**
\`\`\`tsx
import { BaseCheckBox as CheckBox } from '.'
\`\`\`

### 기본 사용법
\`\`\`tsx
<CheckBox label="동의합니다" />
<CheckBox label="동의합니다" defaultChecked />
<CheckBox label="동의합니다" checked={checked} onCheckedChange={setChecked} />
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes,
  args: {
    label: '체크박스 라벨',
    disabled: false,
  },
} satisfies Meta<typeof CheckBox>

export default meta
type Story = StoryObj<typeof meta>

// Basic Stories

/** 기본 체크박스입니다. Controls 패널에서 props를 직접 조작할 수 있습니다. */
export const Default: Story = {}

/** 모든 상태를 한눈에 확인할 수 있습니다. */
export const AllStates: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-3">
      <CheckBox label="기본 (unchecked)" />
      <CheckBox label="체크됨" defaultChecked />
      <CheckBox label="중간 상태 (indeterminate)" checked="indeterminate" />
      <CheckBox label="비활성" disabled />
      <CheckBox label="비활성 + indeterminate" checked="indeterminate" disabled />
    </div>
  ),
}

/** `renderLabel`로 라벨 영역을 완전히 커스텀합니다. `checked`, `disabled`를 인자로 받아 자유롭게 구성할 수 있습니다. */
export const CustomRenderLabel: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-2 w-[300px]">
      <CheckBox
        label="기본 라벨"
        renderLabel={({ label, checked }) => (
          <div className="flex items-center justify-between gap-2 w-full">
            <span className="truncate">{label}</span>
            <span className="body3 text-afds-gray-500">{checked ? '선택됨' : '미선택'}</span>
          </div>
        )}
      />
      <CheckBox
        label="기본 라벨"
        defaultChecked
        renderLabel={({ label, checked }) => (
          <div className="flex items-center justify-between gap-2 w-full">
            <span className="truncate">{label}</span>
            <span className="body3 text-afds-gray-500">{checked ? '선택됨' : '미선택'}</span>
          </div>
        )}
      />
    </div>
  ),
}

/** 외부 상태로 제어되는 체크박스입니다. */
export const Controlled: Story = {
  parameters: { controls: { disable: true } },
  render: function ControlledStory() {
    const [checked, setChecked] = React.useState(false)
    return (
      <div className="flex flex-col items-start gap-3">
        <CheckBox
          label={`Controlled: ${checked ? '체크됨' : '미체크'}`}
          checked={checked}
          onCheckedChange={v => setChecked(v === true)}
        />
      </div>
    )
  },
}

// Pattern Stories

/**
 * 폼 제출 예제.
 * `BaseCheckBox`는 base-ui `Checkbox.Root` props를 spread하므로 `name`/`value`를 그대로 전달한다.
 * 체크 시 hidden input이 렌더되어 `FormData`에 포함된다.
 */
export const FormSubmission: Story = {
  parameters: { controls: { disable: true } },
  render: function FormStory() {
    const [submitted, setSubmitted] = React.useState<Record<string, FormDataEntryValue> | null>(
      null,
    )
    return (
      <form
        className="flex flex-col items-start gap-afds-spacing-12"
        onSubmit={e => {
          e.preventDefault()
          setSubmitted(Object.fromEntries(new FormData(e.currentTarget)))
        }}
      >
        <CheckBox label="이용약관에 동의합니다" name="agree" value="yes" required />
        <button
          type="submit"
          className="px-afds-10 py-afds-4 rounded-afds-sm border border-afds-border-default text-afds-12 bg-afds-bg-surface"
        >
          제출
        </button>
        {submitted && (
          <pre className="bg-afds-bg-surface-sunken rounded-afds-sm p-afds-spacing-8 text-afds-13">
            {JSON.stringify(submitted, null, 2)}
          </pre>
        )}
      </form>
    )
  },
}

/**
 * "전체 선택" 패턴입니다.
 * 부모 체크박스는 자식 선택 상태에 따라 `indeterminate` 또는 `true`/`false` 상태를 가집니다.
 */
export const IndeterminateGroup: Story = {
  parameters: { controls: { disable: true } },
  render: function IndeterminateGroupStory() {
    const items = [
      { value: 'apple', label: '사과' },
      { value: 'banana', label: '바나나' },
      { value: 'cherry', label: '체리' },
    ]
    const [selected, setSelected] = React.useState<string[]>(['apple'])

    const allChecked = selected.length === items.length
    const parentState = allChecked ? true : selected.length > 0 ? 'indeterminate' : false

    const handleParentChange = () => {
      setSelected(allChecked ? [] : items.map(i => i.value))
    }

    return (
      <div className="flex flex-col gap-2 w-48">
        <CheckBox label="전체 선택" checked={parentState} onCheckedChange={handleParentChange} />
        <div className="pl-6 flex flex-col gap-2">
          {items.map(item => (
            <CheckBox
              key={item.value}
              label={item.label}
              checked={selected.includes(item.value)}
              onCheckedChange={() =>
                setSelected(prev =>
                  prev.includes(item.value)
                    ? prev.filter(v => v !== item.value)
                    : [...prev, item.value],
                )
              }
            />
          ))}
        </div>
        <div className="text-afds-12 text-afds-text-secondary">
          선택됨: {selected.join(', ') || '없음'}
        </div>
      </div>
    )
  },
}
