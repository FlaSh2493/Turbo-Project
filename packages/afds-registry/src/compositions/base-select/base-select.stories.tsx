import * as React from 'react'
import type { ArgTypes, Meta, StoryObj } from '@storybook/react'
import { expect, userEvent, within } from '@storybook/test'
import { BaseSelect } from '.'

/**
 *
 * `Select` 컴포넌트를 감싼 간편 래퍼입니다.
 * 옵션 배열만 넘기면 즉시 사용할 수 있으며, 검색·크기·상태 제어를 단일 인터페이스로 제공합니다.
 *
 * ### 기본 사용법
 * ```tsx
 * import { BaseSelect } from '.'
 *
 * <BaseSelect value={value} onValueChange={setValue} options={options} placeholder="선택" />
 * ```
 *
 * ### 언제 사용하나요?
 * - 단순 단일 선택이 필요한 폼 필드
 * - `Select` 컴포넌트의 세부 구성 없이 빠르게 사용하고 싶을 때
 * - 검색 가능한 드롭다운이 필요할 때 (`hasSearch`)
 *
 * ### BaseSelect vs Select
 * | 항목 | BaseSelect | Select |
 * |------|-----------|--------|
 * | 구성 | 옵션 배열만 전달 | 컴파운드 컴포넌트 직접 조합 |
 * | 유연성 | 제한적 | 높음 |
 * | 빠른 사용 | ✓ | — |
 *
 * ### 베스트 프랙티스
 * - 검색 기능이 필요하면 `hasSearch` + `searchPlaceholder`를 함께 사용하세요
 * - `contentWidth`로 드롭다운 너비를 트리거와 다르게 지정할 수 있습니다
 */
const argTypes: Partial<ArgTypes> = {
  size: {
    control: 'select',
    options: ['sm', 'md'],
    description: '크기',
    table: { type: { summary: "'sm' | 'md'" }, defaultValue: { summary: 'sm' }, category: 'Style' },
  },
}

const meta = {
  title: 'Compositions / Common / Form / BaseSelect',
  component: BaseSelect,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Select 컴포넌트를 감싼 간편 래퍼입니다. 옵션 배열만 전달하면 즉시 동작합니다.

**Import:**
\`\`\`tsx
import { BaseSelect } from '.'
\`\`\`

### 기본 사용법
\`\`\`tsx
<BaseSelect value={value} onValueChange={setValue} options={options} placeholder="선택" />
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  args: {
    options: [],
    value: '',
    onValueChange: () => {},
  },
  argTypes,
} satisfies Meta<typeof BaseSelect>

export default meta
type Story = StoryObj<typeof meta>

const options = [
  { value: 'all', label: '전체' },
  { value: 'active', label: '활성' },
  { value: 'inactive', label: '비활성' },
  { value: 'pending', label: '대기' },
]

/** 기본 선택 컴포넌트입니다. */
export const Default: Story = {
  parameters: { controls: { disable: true } },
  render: function DefaultSelect() {
    const [value, setValue] = React.useState('all')
    return (
      <div className="flex flex-col gap-afds-spacing-8 items-start">
        <BaseSelect options={options} value={value} onValueChange={setValue} placeholder="선택" />
        <span className="text-xs text-afds-text-secondary">선택된 값: {value}</span>
      </div>
    )
  },
}

/** 검색 기능이 활성화된 선택 컴포넌트입니다. */
export const WithSearch: Story = {
  parameters: { controls: { disable: true } },
  render: function SearchSelect() {
    const [value, setValue] = React.useState('')
    const manyOptions = [
      { value: 'kr', label: '한국' },
      { value: 'us', label: '미국' },
      { value: 'jp', label: '일본' },
      { value: 'cn', label: '중국' },
      { value: 'de', label: '독일' },
      { value: 'fr', label: '프랑스' },
      { value: 'gb', label: '영국' },
      { value: 'au', label: '호주' },
    ]
    return (
      <BaseSelect
        options={manyOptions}
        value={value}
        onValueChange={setValue}
        placeholder="국가 선택"
        hasSearch
        searchPlaceholder="국가 검색..."
      />
    )
  },
}

/**
 * `contentWidth`로 드롭다운 너비를 트리거와 다르게 지정할 수 있습니다.
 * 미지정 시 트리거 너비(`w-[130px]`)와 동일하게 맞춰집니다.
 */
export const WithContentWidth: Story = {
  parameters: { controls: { disable: true } },
  render: function ContentWidthSelect() {
    const [value, setValue] = React.useState('all')
    return (
      <BaseSelect
        options={options}
        value={value}
        onValueChange={setValue}
        placeholder="선택"
        contentWidth="220px"
      />
    )
  },
}

/** md 크기의 선택 컴포넌트입니다. */
export const MediumSize: Story = {
  args: { options, value: 'active', size: 'md', placeholder: '선택' },
}

/** 비활성화 상태입니다. */
export const Disabled: Story = {
  args: { options, value: 'active', disabled: true, placeholder: '선택' },
}

/** 읽기 전용 상태입니다. */
export const ReadOnly: Story = {
  args: { options, value: 'active', readOnly: true, placeholder: '선택' },
}

/** 오류 상태입니다. */
export const Error: Story = {
  args: { options, value: '', error: true, placeholder: '선택 필요' },
}

/**
 * 옵션을 비동기로 로드하는 동안 content 위에 Spinner를 표시합니다.
 * 트리거를 열면 1.5초간 Spinner와 함께 직전 옵션이 유지되고, 로딩이 끝나면 Spinner만 사라집니다.
 */
export const Loading: Story = {
  parameters: { controls: { disable: true } },
  render: function LoadingSelect() {
    const [value, setValue] = React.useState('')
    const [loading, setLoading] = React.useState(false)

    const handleOpen = (open: boolean) => {
      if (!open) return
      setLoading(true)
      setTimeout(() => setLoading(false), 1500)
    }

    return (
      <BaseSelect
        options={options}
        value={value}
        onValueChange={setValue}
        onOpenChange={handleOpen}
        placeholder="선택"
        loading={loading}
      />
    )
  },
}

/**
 * `name` prop으로 네이티브 폼 제출에 참여합니다.
 * 선택된 옵션의 `value`가 hidden input에 동기화되어 `FormData`에 포함됩니다.
 */
export const FormSubmission: Story = {
  parameters: { controls: { disable: true } },
  render: function FormSelect() {
    const [value, setValue] = React.useState('all')
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
        <BaseSelect
          name="status"
          options={options}
          value={value}
          onValueChange={setValue}
          placeholder="선택"
        />
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

// Interaction Test Stories

export const SelectInteraction: Story = {
  parameters: { controls: { disable: true } },
  render: function InteractionSelect() {
    const [value, setValue] = React.useState('all')
    return (
      <div>
        <BaseSelect options={options} value={value} onValueChange={setValue} placeholder="선택" />
        <div data-testid="selected-value" className="text-xs mt-afds-spacing-8">
          {value}
        </div>
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('button')
    await expect(trigger).toBeInTheDocument()
    await userEvent.click(trigger)
    const menu = await within(document.body).findByRole('menu')
    await expect(menu).toBeInTheDocument()
  },
}
