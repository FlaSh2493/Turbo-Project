import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { SearchIcon } from 'lucide-react'
import { BaseInput as Input } from './base-input'

/**
 * # Input
 *
 * 디자인 토큰이 적용된 입력 필드 컴포넌트입니다.
 *
 *
 * ### 기본 사용법
 * ```tsx
 * <Input placeholder="검색어를 입력하세요" />
 * <Input size="md" clearable />
 * <Input icon={<SearchIcon size={16} />} placeholder="검색" />
 * ```
 *
 * ### size 선택 기준
 * - `sm` (34px): 기본값. 대부분의 UI
 * - `md` (44px): 폼 레벨 입력 필드
 *
 * ### error 사용
 * - `error={true}`: 에러 상태 스타일만 적용
 * - `error="메시지"`: 에러 스타일 + placeholder에 메시지 표시
 *
 * ### 베스트 프랙티스
 * - 검색 필드에는 `icon={<SearchIcon size={16} />}` + `clearable` 조합 사용
 * - controlled 사용 시 `value` + `onChange` 함께 전달
 * - readOnly 필드는 `readOnly` prop 사용 (`disabled`는 포커스 자체를 막음)
 */
const argTypes = {
  size: {
    control: { type: 'select' as const },
    options: ['sm', 'md'],
    description: '입력 필드의 크기를 결정합니다.',
    table: {
      type: { summary: "'sm' | 'md'" },
      defaultValue: { summary: "'sm'" },
    },
  },
}

const meta = {
  title: 'Compositions / Common / Form / BaseInput',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
디자인 토큰이 적용된 입력 필드 컴포넌트입니다.

**Import:**
\`\`\`tsx
import { BaseInput as Input } from './base-input'
\`\`\`

### 기본 사용법
\`\`\`tsx
<Input placeholder="검색어를 입력하세요" />
<Input size="md" clearable />
<Input icon={<SearchIcon size={16} />} placeholder="검색" />
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes,
  args: {
    size: 'sm',
    placeholder: '검색어를 입력하세요',
    clearable: true,
    disabled: false,
    readOnly: false,
  },
  decorators: [
    (Story: React.ComponentType) => (
      <div className="w-[280px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

// Basic Stories

/** 기본 입력 필드입니다. Controls 패널에서 size·disabled·clearable 등을 직접 조작할 수 있습니다. */
export const Default: Story = {}

// Size Stories

/** 높이 34px. 기본 크기입니다. */
export const Small: Story = {
  args: { size: 'sm', placeholder: 'Small 크기' },
}

/** 높이 44px. 폼 레벨 입력 필드에 사용합니다. */
export const Medium: Story = {
  args: { size: 'md', placeholder: 'Medium 크기' },
}

// State Stories

/** 값이 입력된 상태입니다. clearable일 때 클리어 버튼이 표시됩니다. */
export const WithValue: Story = {
  args: { defaultValue: '입력된 값' },
}

/** 에러 상태입니다. 문자열을 전달하면 placeholder에 메시지가 표시됩니다. */
export const ErrorState: Story = {
  args: { error: '입력값을 확인해 주세요' },
}

/** 비활성화 상태입니다. 포인터 이벤트가 차단됩니다. */
export const Disabled: Story = {
  args: { disabled: true, placeholder: '비활성 상태' },
}

/** 읽기 전용 상태입니다. 포커스는 가능하지만 값을 변경할 수 없습니다. */
export const ReadOnly: Story = {
  args: { readOnly: true, defaultValue: '읽기 전용 텍스트' },
}

/** 앞에 아이콘이 있는 검색 필드입니다. */
export const WithIcon: Story = {
  args: { icon: <SearchIcon size={16} />, placeholder: '검색어를 입력하세요' },
}

// Overview Stories

/** 모든 상태를 한눈에 확인할 수 있습니다. */
export const AllStates: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-3">
      <Input placeholder="기본 상태" />
      <Input defaultValue="값 있음" />
      <Input disabled placeholder="비활성" />
      <Input readOnly defaultValue="읽기 전용" />
      <Input error="에러 메시지" />
    </div>
  ),
}

/**
 * 폼 제출 예제.
 * `name` prop이 내부 `Input.Field`로 spread되어 네이티브 폼 제출에 참여한다.
 */
export const FormSubmission: Story = {
  parameters: { controls: { disable: true } },
  render: function FormStory() {
    const [submitted, setSubmitted] = React.useState<Record<string, FormDataEntryValue> | null>(
      null,
    )
    return (
      <form
        className="flex flex-col items-start gap-afds-spacing-12 w-[280px]"
        onSubmit={e => {
          e.preventDefault()
          setSubmitted(Object.fromEntries(new FormData(e.currentTarget)))
        }}
      >
        <Input name="username" placeholder="아이디" required />
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

/** 외부 상태로 제어되는 입력 필드입니다. */
export const Controlled: Story = {
  parameters: { controls: { disable: true } },
  render: function ControlledStory() {
    const [value, setValue] = React.useState('')
    return (
      <div className="flex flex-col gap-2">
        <Input value={value} onChange={setValue} placeholder="입력 후 아래 확인" />
        <span className="body3 text-afds-gray-500">입력값: {value || '없음'}</span>
      </div>
    )
  },
}
