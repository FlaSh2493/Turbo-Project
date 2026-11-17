import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { CheckIcon, XIcon } from 'lucide-react'
import { CheckBox } from '@turbo-project/afds/bricks'

/**
 *
 * 디자인 토큰이 적용된 체크박스 dot-notation 합성 컴포넌트입니다.
 * Container/Root/Indicator/Label 파트를 자유롭게 조합합니다.
 *
 * **Import:**
 * ```tsx
 * import { CheckBox } from '@turbo-project/afds/bricks'
 * ```
 *
 * ### 기본 사용법
 * ```tsx
 * <CheckBox.Container>
 *   <CheckBox.Root defaultChecked>
 *     <CheckBox.Indicator keepMounted />
 *   </CheckBox.Root>
 *   <CheckBox.Label>동의합니다</CheckBox.Label>
 * </CheckBox.Container>
 * ```
 *
 * ### 베스트 프랙티스
 * - controlled/uncontrolled 모두 자동 지원 — base-ui Root의 data-* 속성이 CSS selector를 통해 스타일을 결정
 */

const meta = {
  title: 'AFDS / Bricks / Form / CheckBox',
  component: CheckBox.Container,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CheckBox.Container>

export default meta
type Story = StoryObj<typeof meta>

const renderDefault = (
  rootProps: React.ComponentProps<typeof CheckBox.Root> = {},
  label = '항목',
) => (
  <CheckBox.Container>
    <CheckBox.Root {...rootProps}>
      <CheckBox.Indicator keepMounted />
    </CheckBox.Root>
    <CheckBox.Label>{label}</CheckBox.Label>
  </CheckBox.Container>
)

/** 기본 CheckBox — uncontrolled */
export const Default: Story = {
  render: args => (
    <CheckBox.Container {...args}>
      <CheckBox.Root defaultChecked={false}>
        <CheckBox.Indicator keepMounted />
      </CheckBox.Root>
      <CheckBox.Label>동의합니다</CheckBox.Label>
    </CheckBox.Container>
  ),
}

/** Uncontrolled — 클릭으로 토글되며 스타일이 자동 갱신 */
export const Uncontrolled: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-2 w-[240px]">
      {renderDefault({ defaultChecked: false }, '클릭해서 토글')}
    </div>
  ),
}

/** Controlled */
export const Controlled: Story = {
  parameters: { controls: { disable: true } },
  render: function ControlledStory() {
    const [checked, setChecked] = React.useState<boolean | 'indeterminate'>(false)
    return (
      <div className="flex flex-col gap-2">
        {renderDefault(
          {
            checked: checked === true,
            indeterminate: checked === 'indeterminate',
            onCheckedChange: v => setChecked(v),
          },
          `controlled (${String(checked)})`,
        )}
      </div>
    )
  },
}

/** state — checked / unchecked / indeterminate */
export const AllStates: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-2">
      {renderDefault({ defaultChecked: false }, 'unchecked')}
      {renderDefault({ defaultChecked: true }, 'checked')}
      {renderDefault({ defaultChecked: false, indeterminate: true }, 'indeterminate')}
    </div>
  ),
}

/** Disabled */
export const Disabled: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-2">
      {renderDefault({ disabled: true }, 'disabled unchecked')}
      {renderDefault({ disabled: true, defaultChecked: true }, 'disabled checked')}
      {renderDefault({ disabled: true, indeterminate: true }, 'disabled indeterminate')}
    </div>
  ),
}

/**
 * 폼 제출 예제.
 * `CheckBox.Root`는 base-ui `Checkbox.Root` 그대로이므로 `name` prop이 전달되면
 * 체크 여부가 hidden input(`on`/없음)으로 동기화된다.
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
        <CheckBox.Container>
          <CheckBox.Root name="agree" value="yes">
            <CheckBox.Indicator keepMounted />
          </CheckBox.Root>
          <CheckBox.Label>이용약관에 동의합니다</CheckBox.Label>
        </CheckBox.Container>
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

/** Label 없이 (Indicator만) */
export const WithoutLabel: Story = {
  render: () => (
    <CheckBox.Container>
      <CheckBox.Root defaultChecked>
        <CheckBox.Indicator keepMounted />
      </CheckBox.Root>
    </CheckBox.Container>
  ),
}

/**
 * 체크마크 커스터마이즈 예시.
 * `CheckBox.Indicator`는 children으로 임의의 노드(다른 아이콘·텍스트·이모지)를 받고,
 * 자식 노드에 `className`을 주어 색상·크기 등을 덮어쓸 수 있다.
 */
export const CustomCheckMark: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-2 w-[240px]">
      {/* 다른 아이콘 — Delete 아이콘으로 교체 */}
      <CheckBox.Container>
        <CheckBox.Root defaultChecked>
          <CheckBox.Indicator keepMounted>
            <XIcon size={16} />
          </CheckBox.Indicator>
        </CheckBox.Root>
        <CheckBox.Label>다른 아이콘 (Delete)</CheckBox.Label>
      </CheckBox.Container>

      {/* 텍스트/이모지 마크 */}
      <CheckBox.Container>
        <CheckBox.Root defaultChecked>
          <CheckBox.Indicator keepMounted>
            <span className="text-afds-10 leading-none">★</span>
          </CheckBox.Indicator>
        </CheckBox.Root>
        <CheckBox.Label>텍스트/이모지 마크</CheckBox.Label>
      </CheckBox.Container>

      {/* className으로 색상 덮어쓰기 */}
      <CheckBox.Container>
        <CheckBox.Root defaultChecked>
          <CheckBox.Indicator keepMounted>
            <span className="text-afds-extra-ui-red">
              <CheckIcon size={16} />
            </span>
          </CheckBox.Indicator>
        </CheckBox.Root>
        <CheckBox.Label>색상 커스텀</CheckBox.Label>
      </CheckBox.Container>
    </div>
  ),
}
