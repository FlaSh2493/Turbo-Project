import type { Meta, StoryObj } from '@storybook/react'
import { BaseRadioGroup as RadioGroup, BaseRadio as Radio } from '.'
import { useState, type ComponentProps } from 'react'

/**
 * # RadioGroup
 *
 * 여러 옵션 중 하나를 선택하는 라디오 버튼 그룹 컴포넌트입니다.
 *
 *
 * ### 기본 사용법
 * ```tsx
 * <RadioGroup defaultValue="1" onValueChange={(v) => console.log(v)}>
 *   <Radio value="1" label="Option 1" />
 *   <Radio value="2" label="Option 2" />
 * </RadioGroup>
 * ```
 *
 * ### 언제 사용하나요?
 * - 상호 배타적인 옵션 선택 (체크박스와 달리 하나만 선택 가능)
 * - 카드 형태의 선택지 UI가 필요하면 `RadioCard` 컴포지션을 사용하세요
 *
 * ### 베스트 프랙티스
 * - `disabled`는 RadioGroup 전체 또는 개별 Radio에 적용 가능합니다
 */

const argTypes = {
  // ── Primitive.Root ───────────────────────────
  orientation: {
    control: { type: 'radio' },
    options: ['vertical', 'horizontal'],
    description: '라디오 그룹의 배치 방향. 접근성(키보드 탐색) 방향에도 영향을 줍니다.',
    table: {
      category: 'Primitive.Root',
      type: { summary: "'vertical' | 'horizontal'" },
      defaultValue: { summary: "'vertical'" },
    },
  },
}

type RadioGroupProps = ComponentProps<typeof RadioGroup>

const meta = {
  title: 'Compositions / Common / Form / BaseRadioGroup',
  component: RadioGroup,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
여러 옵션 중 하나를 선택하는 라디오 버튼 그룹 컴포넌트입니다.

**Import:**
\`\`\`tsx
import { BaseRadioGroup as RadioGroup, BaseRadio as Radio } from '.'
\`\`\`

### 기본 사용법
\`\`\`tsx
<RadioGroup defaultValue="1" onValueChange={(v) => console.log(v)}>
  <Radio value="1" label="Option 1" />
  <Radio value="2" label="Option 2" />
  <Radio value="3" label="Option 3" />
</RadioGroup>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes,
  args: {
    disabled: false,
  },
} as Meta<RadioGroupProps>

export default meta
type Story = StoryObj<RadioGroupProps>

// Basic Stories

export const Default: Story = {
  render: args => (
    <RadioGroup defaultValue="a" {...args}>
      <div className="flex items-center gap-2">
        <Radio value="a" label="옵션 A" />
        <Radio value="b" label="옵션 B" />
      </div>
    </RadioGroup>
  ),
}

/** Controls 패널에서 disabled 등을 조작해 보세요. */
export const Basic: Story = {
  render: args => (
    <RadioGroup defaultValue="1" {...args}>
      <div className="flex items-center gap-2">
        <Radio value="1" label="Option 1" />
        <Radio value="2" label="Option 2" />
        <Radio value="3" label="Option 3" />
      </div>
    </RadioGroup>
  ),
}

// State Stories

/** 기본(uncontrolled)과 비활성 상태(미선택/선택)를 보여줍니다. */
export const States: Story = {
  parameters: { controls: { disable: true } },
  render: args => (
    <div className="flex w-[400px] flex-col gap-8">
      <div>
        <h4 className="mb-2">Uncontrolled (Default Value: 2)</h4>
        <RadioGroup defaultValue="2" {...args}>
          <div className="flex items-center gap-4">
            <Radio value="1" label="Option 1" />
            <Radio value="2" label="Option 2" />
            <Radio value="3" label="Option 3" />
          </div>
        </RadioGroup>
      </div>

      <div>
        <h4 className="mb-2">Disabled</h4>
        <RadioGroup defaultValue="checked" disabled>
          <div className="flex items-center gap-4">
            <Radio value="unchecked" label="비활성 (미선택)" />
            <Radio value="checked" label="비활성 (선택)" />
          </div>
        </RadioGroup>
      </div>
    </div>
  ),
}

/** Controlled 모드 및 그룹 사용 예시입니다. */
export const Groups: Story = {
  parameters: { controls: { disable: true } },
  render: function GroupsExample(args) {
    const [value, setValue] = useState<string>('kakaotalk')

    return (
      <div className="flex w-[400px] flex-col gap-6">
        <div>
          <h4 className="mb-3">SNS 선택 (Controlled)</h4>
          <RadioGroup
            value={value}
            onValueChange={setValue}
            className="flex flex-col gap-2"
            {...args}
          >
            <Radio value="facebook" label="Facebook" />
            <Radio value="instagram" label="Instagram" />
            <Radio value="kakaotalk" label="Kakaotalk" />
          </RadioGroup>
        </div>
        <p className="text-sm text-afds-gray-500">
          선택된 값: <strong>{value}</strong>
        </p>

        <div>
          <h4 className="mb-3">Uncontrolled Group</h4>
          <RadioGroup defaultValue="opt1" className="flex flex-col gap-2" {...args}>
            <Radio value="opt1" label="Option 1" />
            <Radio value="opt2" label="Option 2" />
          </RadioGroup>
        </div>
      </div>
    )
  },
}

/**
 * 폼 제출 예제.
 * `BaseRadioGroup`은 base-ui `RadioGroup` props를 spread하므로 `name`이 그대로 전달되어
 * 선택된 옵션의 `value`가 hidden input에 동기화된다.
 */
export const FormSubmission: Story = {
  parameters: { controls: { disable: true } },
  render: function FormStory() {
    const [submitted, setSubmitted] = useState<Record<string, FormDataEntryValue> | null>(null)
    return (
      <form
        className="flex flex-col items-start gap-afds-spacing-12"
        onSubmit={e => {
          e.preventDefault()
          setSubmitted(Object.fromEntries(new FormData(e.currentTarget)))
        }}
      >
        <RadioGroup name="plan" defaultValue="basic" className="flex flex-col gap-2">
          <Radio value="basic" label="Basic" />
          <Radio value="pro" label="Pro" />
          <Radio value="enterprise" label="Enterprise" />
        </RadioGroup>
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
