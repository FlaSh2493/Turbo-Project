import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { CheckBoxGroup, CheckBox } from '@turbo-project/afds/bricks'

/**
 *
 * 디자인 토큰이 적용된 체크박스 그룹 dot-notation 합성 컴포넌트입니다.
 * `Root` 파트가 그룹 컨테이너 역할을 하고, 내부 체크박스는 `CheckBox.*`로 조합합니다.
 *
 * **Import:**
 * ```tsx
 * import { CheckBoxGroup, CheckBox } from '@turbo-project/afds/bricks'
 * ```
 *
 * ### 기본 사용법
 * ```tsx
 * <CheckBoxGroup.Root defaultValue={['apple']} className="flex flex-col gap-2">
 *   <CheckBox.Container>
 *     <CheckBox.Root value="apple">
 *       <CheckBox.Indicator keepMounted />
 *     </CheckBox.Root>
 *     <CheckBox.Label>사과</CheckBox.Label>
 *   </CheckBox.Container>
 * </CheckBoxGroup.Root>
 * ```
 *
 * ### 베스트 프랙티스
 * - controlled/uncontrolled 모두 자동 지원 — base-ui CheckboxGroup 내부 상태 관리
 */

const meta = {
  title: 'AFDS / Bricks / Form / CheckBoxGroup',
  component: CheckBoxGroup.Root,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CheckBoxGroup.Root>

export default meta
type Story = StoryObj<typeof meta>

const OPTIONS = [
  { value: 'apple', label: '사과' },
  { value: 'banana', label: '바나나' },
  { value: 'cherry', label: '체리' },
]

const CheckBoxItem = ({
  value,
  label,
  disabled = false,
}: {
  value: string
  label: string
  disabled?: boolean
}) => (
  <CheckBox.Container>
    <CheckBox.Root value={value} disabled={disabled}>
      <CheckBox.Indicator keepMounted />
    </CheckBox.Root>
    <CheckBox.Label>{label}</CheckBox.Label>
  </CheckBox.Container>
)

/** 기본 CheckBoxGroup — uncontrolled (defaultValue) */
export const Default: Story = {
  render: () => (
    <CheckBoxGroup.Root defaultValue={['apple']} className="flex flex-col gap-2">
      {OPTIONS.map(opt => (
        <CheckBoxItem key={opt.value} value={opt.value} label={opt.label} />
      ))}
    </CheckBoxGroup.Root>
  ),
}

/** Uncontrolled — 클릭으로 자동 토글, 스타일 자동 갱신 */
export const Uncontrolled: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <CheckBoxGroup.Root defaultValue={['apple']} className="flex flex-col gap-2">
      {OPTIONS.map(opt => (
        <CheckBoxItem key={opt.value} value={opt.value} label={opt.label} />
      ))}
    </CheckBoxGroup.Root>
  ),
}

/** Controlled */
export const Controlled: Story = {
  parameters: { controls: { disable: true } },
  render: function ControlledStory() {
    const [values, setValues] = React.useState<string[]>(['apple'])
    return (
      <div className="flex flex-col gap-2">
        <CheckBoxGroup.Root
          value={values}
          onValueChange={v => setValues(v)}
          className="flex flex-col gap-2"
        >
          {OPTIONS.map(opt => (
            <CheckBoxItem key={opt.value} value={opt.value} label={opt.label} />
          ))}
        </CheckBoxGroup.Root>
        <span className="body3 text-afds-text-secondary">선택: {values.join(', ') || '없음'}</span>
      </div>
    )
  },
}

/**
 * 폼 제출 예제.
 * 각 `CheckBox.Root`에 동일한 `name`을 주면 같은 키로 여러 hidden input이 렌더되어
 * `FormData.getAll('fruit')`로 배열을 받을 수 있다.
 */
export const FormSubmission: Story = {
  parameters: { controls: { disable: true } },
  render: function FormStory() {
    const [submitted, setSubmitted] = React.useState<string[] | null>(null)
    return (
      <form
        className="flex flex-col items-start gap-afds-spacing-12"
        onSubmit={e => {
          e.preventDefault()
          setSubmitted(new FormData(e.currentTarget).getAll('fruit') as string[])
        }}
      >
        <CheckBoxGroup.Root defaultValue={['apple']} className="flex flex-col gap-2">
          {OPTIONS.map(opt => (
            <CheckBox.Container key={opt.value}>
              <CheckBox.Root name="fruit" value={opt.value}>
                <CheckBox.Indicator keepMounted />
              </CheckBox.Root>
              <CheckBox.Label>{opt.label}</CheckBox.Label>
            </CheckBox.Container>
          ))}
        </CheckBoxGroup.Root>
        <button
          type="submit"
          className="px-afds-10 py-afds-4 rounded-afds-sm border border-afds-border-default text-afds-12 bg-afds-bg-surface"
        >
          제출
        </button>
        {submitted && (
          <pre className="bg-afds-bg-surface-sunken rounded-afds-sm p-afds-spacing-8 text-afds-13">
            {JSON.stringify({ fruit: submitted }, null, 2)}
          </pre>
        )}
      </form>
    )
  },
}

/** Disabled — 그룹 전체 비활성 */
export const Disabled: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <CheckBoxGroup.Root disabled defaultValue={['apple']} className="flex flex-col gap-2">
      {OPTIONS.map(opt => (
        <CheckBoxItem key={opt.value} value={opt.value} label={opt.label} />
      ))}
    </CheckBoxGroup.Root>
  ),
}
