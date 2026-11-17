import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { CheckBoxCard } from '.'
import { CheckBoxGroup } from '@turbo-project/afds/bricks'

/**
 * # CheckBoxCard
 *
 * 테두리 카드형(선택 리스트 UI)으로 표시되는 체크박스 컴포지션입니다.
 * 네이티브 체크박스를 숨기고 카드 전체를 선택 영역으로 사용하며, 우측에 체크 아이콘을 표시합니다.
 *
 * ### 기본 사용
 * ```tsx
 * <CheckBoxCard label="선택 항목" />
 * ```
 *
 * ### checked 상태
 * - `true`: 선택됨
 * - `false`: 미선택 (기본값)
 * - `'indeterminate'`: 중간 상태
 *
 * ### 베스트 프랙티스
 * - 일반 체크박스(+라벨) 형태가 필요하면 `BaseCheckBox`를 사용하세요.
 * - `CheckBoxGroup`과 함께 사용할 때는 반드시 `value` prop을 지정합니다.
 */
const argTypes = {
  checked: {
    control: { type: 'select' as const },
    options: [true, false, 'indeterminate'],
    description: "체크 상태. `true` | `false` | `'indeterminate'`.",
    table: { type: { summary: "boolean | 'indeterminate'" } },
  },
}

const meta = {
  title: 'Compositions / Common / Form / CheckBoxCard',
  component: CheckBoxCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
테두리 카드형(선택 리스트 UI)으로 표시되는 체크박스 컴포지션입니다.

**Import:**
\`\`\`tsx
import { CheckBoxCard } from '.'
\`\`\`

### 기본 사용법
\`\`\`tsx
<CheckBoxCard label="선택 항목" />
<CheckBoxCard label="선택 항목" defaultChecked />
<CheckBoxCard label="선택 항목" checked={checked} onCheckedChange={setChecked} />
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes,
  args: {
    label: '카드 항목',
    disabled: false,
  },
} satisfies Meta<typeof CheckBoxCard>

export default meta
type Story = StoryObj<typeof meta>

/** 기본 카드 체크박스입니다. Controls 패널에서 props를 직접 조작할 수 있습니다. */
export const Default: Story = {}

/** 미선택 / 선택 / 비활성 상태입니다. */
export const AllStates: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-2 w-[240px]">
      <CheckBoxCard label="미선택 항목" />
      <CheckBoxCard label="선택된 항목" defaultChecked />
      <CheckBoxCard label="비활성 항목" disabled />
      <CheckBoxCard label="비활성 + 선택 항목" disabled defaultChecked />
    </div>
  ),
}

/** `renderLabel`로 라벨 영역을 완전히 커스텀합니다. `checked`, `disabled`를 인자로 받아 자유롭게 구성할 수 있습니다. */
export const CustomRenderLabel: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-2 w-[300px]">
      <CheckBoxCard
        label="기본 라벨"
        renderLabel={({ label, checked }) => (
          <div className="flex items-center justify-between gap-2 w-full">
            <span className="truncate">{label}</span>
            <span className="body3 text-afds-gray-500">{checked ? '선택됨' : '미선택'}</span>
          </div>
        )}
      />
      <CheckBoxCard
        label="기본 라벨"
        defaultChecked
        renderLabel={({ label, checked }) => (
          <div className="flex items-center justify-between gap-2 w-full">
            <span className="truncate">{label}</span>
            <span className="body3 text-afds-gray-500">{checked ? '선택됨' : '미선택'}</span>
          </div>
        )}
      />
    </div>
  ),
}

/** 외부 상태로 제어되는 카드 체크박스입니다. */
export const Controlled: Story = {
  parameters: { controls: { disable: true } },
  render: function ControlledStory() {
    const [checked, setChecked] = React.useState(false)
    return (
      <div className="flex flex-col items-start gap-3 w-[240px]">
        <CheckBoxCard
          label={`Controlled: ${checked ? '선택됨' : '미선택'}`}
          checked={checked}
          onCheckedChange={v => setChecked(v === true)}
        />
      </div>
    )
  },
}

const GROUP_FRUITS = [
  { value: 'apple', label: '사과' },
  { value: 'banana', label: '바나나' },
  { value: 'cherry', label: '체리' },
]

/**
 * `CheckBoxGroup`과 함께 카드형 다중 선택 리스트를 구성합니다.
 * 각 카드에 `value`를 지정하면 그룹이 선택 상태를 추적합니다. (uncontrolled — `defaultValue`)
 */
export const InGroup: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <CheckBoxGroup.Root defaultValue={['cherry']}>
      <div className="flex flex-col gap-1 w-[240px]">
        {GROUP_FRUITS.map(f => (
          <CheckBoxCard key={f.value} value={f.value} label={f.label} />
        ))}
      </div>
    </CheckBoxGroup.Root>
  ),
}

/** 외부 상태로 제어되는 카드 그룹입니다. 선택된 값이 아래에 표시됩니다. */
export const ControlledGroup: Story = {
  parameters: { controls: { disable: true } },
  render: function ControlledGroupStory() {
    const [value, setValue] = React.useState<string[]>(['apple'])
    return (
      <div className="flex flex-col gap-2 w-[240px]">
        <CheckBoxGroup.Root value={value} onValueChange={setValue}>
          <div className="flex flex-col gap-1">
            {GROUP_FRUITS.map(f => (
              <CheckBoxCard key={f.value} value={f.value} label={f.label} />
            ))}
          </div>
        </CheckBoxGroup.Root>
        <div className="body3 text-afds-text-secondary">선택됨: {value.join(', ') || '없음'}</div>
      </div>
    )
  },
}

/** 그룹 전체를 비활성화합니다. (`CheckBoxGroup`의 `disabled`) */
export const DisabledGroup: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <CheckBoxGroup.Root defaultValue={['cherry']} disabled>
      <div className="flex flex-col gap-1 w-[240px]">
        {GROUP_FRUITS.map(f => (
          <CheckBoxCard key={f.value} value={f.value} label={f.label} />
        ))}
      </div>
    </CheckBoxGroup.Root>
  ),
}
