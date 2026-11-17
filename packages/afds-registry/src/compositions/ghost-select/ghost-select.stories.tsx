import * as React from 'react'
import type { ArgTypes, Meta, StoryObj } from '@storybook/react'
import { expect, userEvent, within } from '@storybook/test'
import { GhostSelect } from '.'

/**
 *
 * 배경이 없는 투명한 스타일의 선택 컴포넌트입니다.
 * 내부적으로 `Select` 컴포넌트를 사용하며 호버 시 배경이 나타납니다.
 *
 * ### 기본 사용법
 * ```tsx
 * import { GhostSelect } from '.'
 *
 * <GhostSelect value={value} onValueChange={setValue} options={options} />
 * ```
 *
 * ### 언제 사용하나요?
 * - 테이블 셀 내의 인라인 필터/정렬
 * - 페이지 헤더의 기간/필터 선택
 * - UI에 녹아드는 선택 요소가 필요한 경우
 *
 * ### 일반 Select와의 차이
 * - `Select`: 명확한 테두리와 배경이 있는 표준 선택 UI
 * - `GhostSelect`: 테두리 없이 투명하게 녹아드는 선택 UI
 *
 * ### 베스트 프랙티스
 * - 중요도가 낮은 필터나 정렬 옵션에 사용하세요
 * - 옵션에 `tooltip`을 추가해 추가 설명을 제공할 수 있습니다
 */
const argTypes: Partial<ArgTypes> = {
  contentAlign: {
    control: 'select',
    options: ['start', 'end'],
    description: '드롭다운 정렬 방향',
    table: {
      type: { summary: "'start' | 'end'" },
      defaultValue: { summary: 'start' },
      category: 'Style',
    },
  },
}

const meta = {
  title: 'Compositions / Common / Form / GhostSelect',
  component: GhostSelect,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
배경이 없는 투명한 스타일의 선택 컴포넌트입니다. 호버 시 회색 배경이 나타납니다.

**Import:**
\`\`\`tsx
import { GhostSelect } from '.'
\`\`\`

### 기본 사용법
\`\`\`tsx
<GhostSelect value={value} onValueChange={setValue} options={options} />
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
} satisfies Meta<typeof GhostSelect>

export default meta
type Story = StoryObj<typeof meta>

const statusOptions = [
  { value: 'all', label: '전체' },
  { value: 'active', label: '활성' },
  { value: 'inactive', label: '비활성' },
  { value: 'pending', label: '대기' },
]

/** 기본 GhostSelect입니다. */
export const Default: Story = {
  render: function DefaultGhostSelect() {
    const [value, setValue] = React.useState('all')
    return (
      <div className="flex flex-col gap-afds-spacing-8 items-start">
        <GhostSelect options={statusOptions} value={value} onValueChange={setValue} />
        <span className="text-afds-12 text-afds-text-secondary">선택된 값: {value}</span>
      </div>
    )
  },
}

/**
 * 옵션을 비동기로 로드하는 동안 content 위에 Spinner를 표시합니다.
 * 트리거를 열면 1.5초간 Spinner와 함께 직전 옵션이 유지되고, 로딩이 끝나면 Spinner만 사라집니다.
 */
export const Loading: Story = {
  render: function LoadingGhostSelect() {
    const [value, setValue] = React.useState('')
    const [loading, setLoading] = React.useState(false)

    const handleOpenChange = (open: boolean) => {
      if (!open) return
      setLoading(true)
      setTimeout(() => setLoading(false), 1500)
    }

    return (
      <GhostSelect
        options={statusOptions}
        value={value}
        onValueChange={setValue}
        loading={loading}
        onOpenChange={handleOpenChange}
      />
    )
  },
}

/** 툴팁이 포함된 옵션입니다. */
export const WithTooltips: Story = {
  render: function TooltipGhostSelect() {
    const [value, setValue] = React.useState('cpm')
    const options = [
      { value: 'cpm', label: 'CPM', tooltip: '1,000회 노출당 비용 (Cost Per Mille)' },
      { value: 'cpc', label: 'CPC', tooltip: '클릭당 비용 (Cost Per Click)' },
      { value: 'cpa', label: 'CPA', tooltip: '전환당 비용 (Cost Per Action)' },
    ]
    return <GhostSelect options={options} value={value} onValueChange={setValue} />
  },
}

/**
 * `name` prop으로 네이티브 폼 제출에 참여합니다.
 * 선택된 옵션의 `value`가 hidden input에 동기화됩니다.
 */
export const FormSubmission: Story = {
  parameters: { controls: { disable: true } },
  render: function FormGhostSelect() {
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
        <GhostSelect name="status" options={statusOptions} value={value} onValueChange={setValue} />
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
  render: function InteractionSelect() {
    const [value, setValue] = React.useState('all')
    return (
      <div>
        <GhostSelect options={statusOptions} value={value} onValueChange={setValue} />
        <div data-testid="selected-value" className="text-afds-12 mt-[8px]">
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
  },
}
