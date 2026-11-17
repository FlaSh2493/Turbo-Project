import { useState } from 'react'
import type { ArgTypes, Meta, StoryObj } from '@storybook/react'
import { BaseMultiSelect } from '.'

/**
 *
 * `MultiSelect` 컴포넌트를 감싼 간편 래퍼입니다.
 * 옵션 배열만 넘기면 즉시 다중 선택 드롭다운으로 동작합니다.
 *
 * ### 기본 사용법
 * ```tsx
 * import { BaseMultiSelect } from '.'
 *
 * <BaseMultiSelect value={values} onValueChange={setValues} options={options} placeholder="선택" />
 * ```
 *
 * ### 언제 사용하나요?
 * - 단순 다중 선택이 필요한 폼 필드
 * - `MultiSelect`의 세부 컴파운드 구성 없이 빠르게 쓰고 싶을 때
 * - 검색 가능한 다중 선택 드롭다운 (`hasSearch`)
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
  title: 'Compositions / Common / Form / BaseMultiSelect',
  component: BaseMultiSelect,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
MultiSelect 컴포넌트를 감싼 간편 래퍼입니다. 옵션 배열만 전달하면 즉시 동작합니다.

**Import:**
\`\`\`tsx
import { BaseMultiSelect } from '.'
\`\`\`

### 기본 사용법
\`\`\`tsx
<BaseMultiSelect value={values} onValueChange={setValues} options={options} placeholder="선택" />
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes,
} satisfies Meta<typeof BaseMultiSelect>

export default meta
type Story = StoryObj<typeof meta>

const fruitOptions = [
  { label: '사과', value: 'apple' },
  { label: '바나나', value: 'banana' },
  { label: '오렌지', value: 'orange' },
  { label: '포도', value: 'grape' },
]

export const Default: Story = {
  args: {
    options: fruitOptions,
    value: [],
    onValueChange: () => {},
    placeholder: '과일을 선택',
    className: 'w-[320px]',
  },
  render: function DefaultExample(args) {
    const [values, setValues] = useState<string[]>([])
    return <BaseMultiSelect {...args} value={values} onValueChange={setValues} />
  },
}

export const WithSearch: Story = {
  args: {
    options: fruitOptions,
    value: [],
    onValueChange: () => {},
    placeholder: '검색',
    hasSearch: true,
    searchPlaceholder: '검색어 입력',
    contentWidth: '280px',
  },
  render: function WithSearchExample(args) {
    const [values, setValues] = useState<string[]>([])
    return (
      <div className="w-[200px]">
        <BaseMultiSelect {...args} value={values} onValueChange={setValues} />
      </div>
    )
  },
}

export const NoFooter: Story = {
  args: {
    options: fruitOptions,
    value: [],
    onValueChange: () => {},
    placeholder: 'Footer 없음',
    hasFooter: false,
  },
  render: function NoFooterExample(args) {
    const [values, setValues] = useState<string[]>([])
    return (
      <div className="w-[200px]">
        <BaseMultiSelect {...args} value={values} onValueChange={setValues} />
      </div>
    )
  },
}

export const Disabled: Story = {
  args: {
    options: fruitOptions,
    value: [],
    onValueChange: () => {},
    placeholder: '비활성',
    disabled: true,
  },
}

export const WithError: Story = {
  args: {
    options: fruitOptions,
    value: [],
    onValueChange: () => {},
    placeholder: '에러',
    error: true,
  },
}

export const AllSizes: Story = {
  args: {
    options: fruitOptions,
    value: [],
    onValueChange: () => {},
  },
  render: function AllSizesExample() {
    const [v1, setV1] = useState<string[]>([])
    const [v2, setV2] = useState<string[]>([])
    return (
      <div className="flex gap-4">
        <div className="w-[200px]">
          <p className="text-xs mb-1">sm</p>
          <BaseMultiSelect
            options={fruitOptions}
            value={v1}
            onValueChange={setV1}
            placeholder="sm"
            size="sm"
          />
        </div>
        <div className="w-[200px]">
          <p className="text-xs mb-1">md</p>
          <BaseMultiSelect
            options={fruitOptions}
            value={v2}
            onValueChange={setV2}
            placeholder="md"
            size="md"
          />
        </div>
      </div>
    )
  },
}
