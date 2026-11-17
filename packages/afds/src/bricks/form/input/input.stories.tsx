import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { SearchIcon, CircleXIcon } from 'lucide-react'
import { Input } from '@turbo-project/afds/bricks'

/**
 *
 * 디자인 토큰이 적용된 입력 필드 dot-notation 합성 컴포넌트입니다.
 * Root/Field/Icon/ClearButton 파트를 자유롭게 조합합니다.
 *
 * **Import:**
 * ```tsx
 * import { Input } from '@turbo-project/afds/bricks'
 * ```
 *
 * ### 기본 사용법
 * ```tsx
 * <Input.Root size="sm">
 *   <Input.Field placeholder="입력" />
 * </Input.Root>
 * ```
 *
 * ### 베스트 프랙티스
 * - `Input.Icon`은 Field 앞에 배치 (시각적 prefix)
 * - `Input.ClearButton`은 Field 뒤에 배치
 * - controlled 사용 시 Field에 `value`/`onChange` 직접 전달
 */

const meta = {
  title: 'AFDS / Bricks / Form / Input',
  component: Input.Root,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md'],
      description: '입력 필드의 크기',
    },
  },
  decorators: [
    Story => (
      <div className="w-[280px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Input.Root>

export default meta
type Story = StoryObj<typeof meta>

/** 기본 Input — sm 사이즈, enabled 상태 */
export const Default: Story = {
  args: {
    size: 'sm',
  },
  render: args => (
    <Input.Root {...args}>
      <Input.Field placeholder="입력하세요" />
    </Input.Root>
  ),
}

/** size variant — sm/md */
export const AllSizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-2">
      <Input.Root size="sm">
        <Input.Field placeholder="sm 사이즈" />
      </Input.Root>
      <Input.Root size="md">
        <Input.Field placeholder="md 사이즈" />
      </Input.Root>
    </div>
  ),
}

/** state variant — enabled/fixed/completed/error/disabled */
export const AllStates: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-2">
      <Input.Root>
        <Input.Field placeholder="enabled" />
      </Input.Root>
      <Input.Root>
        <Input.Field placeholder="fixed" defaultValue="고정값" readOnly />
      </Input.Root>
      <Input.Root>
        <Input.Field placeholder="completed" defaultValue="완료" />
      </Input.Root>
      <Input.Root error>
        <Input.Field error placeholder="error: 입력값을 확인해주세요" />
      </Input.Root>
      <Input.Root>
        <Input.Field placeholder="disabled" disabled />
      </Input.Root>
    </div>
  ),
}

/** Disabled 상태 단독 */
export const Disabled: Story = {
  render: () => (
    <Input.Root>
      <Input.Field placeholder="비활성 상태" disabled />
    </Input.Root>
  ),
}

/** 좌측 아이콘 — 검색 필드 */
export const WithIcon: Story = {
  render: () => (
    <Input.Root size="sm">
      <Input.Icon>
        <SearchIcon size={16} />
      </Input.Icon>
      <Input.Field placeholder="검색어를 입력하세요" />
    </Input.Root>
  ),
}

/** 우측 ClearButton */
export const WithClearButton: Story = {
  render: function WithClearButtonStory() {
    const [value, setValue] = React.useState('지우기 가능한 값')
    return (
      <Input.Root size="sm">
        <Input.Field value={value} onChange={e => setValue(e.target.value)} placeholder="입력" />
        {value && (
          <Input.ClearButton onClick={() => setValue('')}>
            <CircleXIcon size={16} className="h-4 w-4" />
          </Input.ClearButton>
        )}
      </Input.Root>
    )
  },
}

/**
 * 폼 제출 예제.
 * `Input.Field`는 base-ui `Input`을 그대로 사용하므로 `name` prop이 그대로 전달되어
 * 네이티브 폼 제출에 참여한다.
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
        <Input.Root size="sm">
          <Input.Field name="email" type="email" placeholder="이메일" required />
        </Input.Root>
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

/** Controlled 패턴 */
export const Controlled: Story = {
  parameters: { controls: { disable: true } },
  render: function ControlledStory() {
    const [value, setValue] = React.useState('')
    return (
      <div className="flex flex-col gap-2">
        <Input.Root size="sm">
          <Input.Field
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="입력 후 아래 확인"
          />
        </Input.Root>
        <span className="body3 text-afds-text-secondary">입력값: {value || '없음'}</span>
      </div>
    )
  },
}
