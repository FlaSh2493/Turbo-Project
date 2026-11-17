import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { RadioGroup } from '@turbo-project/afds/bricks'

/**
 *
 * 디자인 토큰이 적용된 라디오 그룹 dot-notation 합성 컴포넌트입니다.
 * Root/Container/Item/Indicator/Dot/Label 파트를 자유롭게 조합합니다.
 *
 * **Import:**
 * ```tsx
 * import { RadioGroup } from '@turbo-project/afds/bricks'
 * ```
 *
 * ### 기본 사용법
 * ```tsx
 * <RadioGroup.Root defaultValue="a">
 *   <RadioGroup.Container>
 *     <RadioGroup.Item value="a">
 *       <RadioGroup.Indicator />
 *     </RadioGroup.Item>
 *     <RadioGroup.Label>옵션 A</RadioGroup.Label>
 *   </RadioGroup.Container>
 * </RadioGroup.Root>
 * ```
 *
 * ### 베스트 프랙티스
 * - controlled/uncontrolled 모두 자동 지원 — base-ui Item의 data-* 속성이 CSS selector를 통해 스타일을 결정
 * - `Container.htmlFor` + `Item.id` 매칭으로 label 클릭 시 라디오 활성화
 */

const meta = {
  title: 'AFDS / Bricks / Form / RadioGroup',
  component: RadioGroup.Root,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    defaultValue: {
      control: 'text',
      description: 'uncontrolled 초기 값',
    },
    value: {
      control: 'text',
      description: 'controlled 값',
    },
    disabled: {
      control: 'boolean',
      description: '전체 그룹 비활성화',
    },
    readOnly: {
      control: 'boolean',
      description: '읽기 전용',
    },
    required: {
      control: 'boolean',
      description: '필수 입력 여부',
    },
  },
} satisfies Meta<typeof RadioGroup.Root>

export default meta
type Story = StoryObj<typeof meta>

const OPTIONS = [
  { value: 'a', label: '옵션 A' },
  { value: 'b', label: '옵션 B' },
  { value: 'c', label: '옵션 C' },
]

const RadioItem = ({
  value,
  label,
  disabled = false,
}: {
  value: string
  label: string
  disabled?: boolean
}) => {
  const id = React.useId()
  return (
    <RadioGroup.Container htmlFor={id}>
      <RadioGroup.Item id={id} value={value} disabled={disabled}>
        <RadioGroup.Indicator />
      </RadioGroup.Item>
      <RadioGroup.Label>{label}</RadioGroup.Label>
    </RadioGroup.Container>
  )
}

/** 기본 RadioGroup — uncontrolled (defaultValue) */
export const Default: Story = {
  args: { defaultValue: 'a' },
  render: args => (
    <RadioGroup.Root {...args}>
      <div className="flex flex-col gap-2">
        {OPTIONS.map(opt => (
          <RadioItem key={opt.value} value={opt.value} label={opt.label} />
        ))}
      </div>
    </RadioGroup.Root>
  ),
}

/** Uncontrolled — 클릭으로 자동 토글, 스타일 자동 갱신 */
export const Uncontrolled: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <RadioGroup.Root defaultValue="a">
      <div className="flex flex-col gap-2">
        {OPTIONS.map(opt => (
          <RadioItem key={opt.value} value={opt.value} label={opt.label} />
        ))}
      </div>
    </RadioGroup.Root>
  ),
}

/** Controlled */
export const Controlled: Story = {
  parameters: { controls: { disable: true } },
  render: function ControlledStory() {
    const [value, setValue] = React.useState('a')
    return (
      <div className="flex flex-col gap-2">
        <RadioGroup.Root value={value} onValueChange={v => setValue(String(v))}>
          {OPTIONS.map(opt => (
            <RadioItem key={opt.value} value={opt.value} label={opt.label} />
          ))}
        </RadioGroup.Root>
        <span className="body3 text-afds-text-secondary">선택: {value}</span>
      </div>
    )
  },
}

/** 모든 상태 — checked/unchecked */
export const AllStates: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <RadioGroup.Root defaultValue="checked">
      <div className="flex flex-col gap-2">
        <RadioItem value="unchecked" label="unchecked" />
        <RadioItem value="checked" label="checked" />
      </div>
    </RadioGroup.Root>
  ),
}

/**
 * 폼 제출 예제.
 * `RadioGroup.Root`에 `name` prop을 주면 선택된 옵션의 `value`가 hidden input에 동기화된다.
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
        <RadioGroup.Root name="plan" defaultValue="a">
          <div className="flex flex-col gap-2">
            {OPTIONS.map(opt => (
              <RadioItem key={opt.value} value={opt.value} label={opt.label} />
            ))}
          </div>
        </RadioGroup.Root>
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

/** Disabled */
export const Disabled: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-2">
      <span className="body3 text-afds-text-secondary">disabled</span>
      <RadioGroup.Root defaultValue="checked">
        <RadioItem value="unchecked" label="disabled unchecked" disabled />
        <RadioItem value="checked" label="disabled checked" disabled />
      </RadioGroup.Root>
    </div>
  ),
}
