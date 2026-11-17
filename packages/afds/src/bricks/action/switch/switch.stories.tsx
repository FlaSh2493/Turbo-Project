import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Switch } from '@turbo-project/afds/bricks'

/**
 *
 * 디자인 토큰이 적용된 토글 스위치 합성 컴포넌트입니다.
 * base-ui `Switch`를 그대로 노출하므로 `Switch.Root`와 `Switch.Thumb`를 조합해 사용합니다.
 *
 * **Import:**
 * ```tsx
 * import { Switch } from '@turbo-project/afds/bricks'
 * ```
 *
 * ### 기본 사용법
 * ```tsx
 * <Switch.Root checked={checked} onCheckedChange={setChecked}>
 *   <Switch.Thumb />
 * </Switch.Root>
 * ```
 *
 * ### 베스트 프랙티스
 * - controlled: `checked` + `onCheckedChange` 함께 사용
 * - uncontrolled: `defaultChecked`만 사용
 * - 인접 레이블이 없으면 `aria-label` 필수
 */

const meta = {
  title: 'AFDS / Bricks / Action / Switch',
  component: Switch.Root,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Switch.Root>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: function DefaultExample() {
    const [checked, setChecked] = React.useState(false)
    return (
      <Switch.Root checked={checked} onCheckedChange={setChecked} aria-label="기본 스위치">
        <Switch.Thumb />
      </Switch.Root>
    )
  },
}

export const Checked: Story = {
  render: () => (
    <Switch.Root defaultChecked aria-label="체크된 스위치">
      <Switch.Thumb />
    </Switch.Root>
  ),
}

export const Unchecked: Story = {
  render: () => (
    <Switch.Root aria-label="체크되지 않은 스위치">
      <Switch.Thumb />
    </Switch.Root>
  ),
}

export const Disabled: Story = {
  render: () => (
    <Switch.Root disabled aria-label="비활성화 스위치">
      <Switch.Thumb />
    </Switch.Root>
  ),
}

export const DisabledChecked: Story = {
  render: () => (
    <Switch.Root defaultChecked disabled aria-label="비활성화 체크된 스위치">
      <Switch.Thumb />
    </Switch.Root>
  ),
}

export const AllStates: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-wrap items-center gap-afds-spacing-10">
      <Switch.Root aria-label="off">
        <Switch.Thumb />
      </Switch.Root>
      <Switch.Root defaultChecked aria-label="on">
        <Switch.Thumb />
      </Switch.Root>
      <Switch.Root disabled aria-label="off-disabled">
        <Switch.Thumb />
      </Switch.Root>
      <Switch.Root defaultChecked disabled aria-label="on-disabled">
        <Switch.Thumb />
      </Switch.Root>
    </div>
  ),
}

export const WithLabel: Story = {
  parameters: { controls: { disable: true } },
  render: function WithLabelExample() {
    const [checked, setChecked] = React.useState(false)
    return (
      <label className="inline-flex items-center gap-afds-8">
        <Switch.Root checked={checked} onCheckedChange={setChecked}>
          <Switch.Thumb />
        </Switch.Root>
        <span className="text-afds-14">{checked ? '켜짐' : '꺼짐'}</span>
      </label>
    )
  },
}

/**
 * 폼 제출 예제.
 * `Switch.Root`는 base-ui `Switch.Root`이므로 `name` prop이 그대로 전달된다.
 * 체크된 경우 `value`(기본 `'on'`)가 hidden input으로 동기화되고, 미체크 시 폼에서 제외된다.
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
        <label className="inline-flex items-center gap-afds-8">
          <Switch.Root name="notifications" value="enabled">
            <Switch.Thumb />
          </Switch.Root>
          <span className="text-afds-14">알림 받기</span>
        </label>
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
