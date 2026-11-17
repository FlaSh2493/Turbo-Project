import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { RadioGroup } from '@turbo-project/afds/bricks'
import { RadioCard } from '.'
import { BaseRadioGroup } from '../base-radio-group'

/**
 * 테두리 카드형(선택 리스트 UI)으로 표시되는 라디오 컴포지션입니다.
 * 카드 전체를 선택 영역으로 사용하며, 라벨(좌측)과 라디오 dot(우측)을 함께 배치합니다.
 *
 * **Import:**
 * ```tsx
 * import { RadioGroup } from '@turbo-project/afds/bricks'
 * import { RadioCard } from '.'
 * ```
 *
 * ### 기본 사용법
 * ```tsx
 * <RadioGroup.Root defaultValue="b">
 *   <RadioCard value="a" label="옵션 A" />
 *   <RadioCard value="b" label="옵션 B" />
 * </RadioGroup.Root>
 * ```
 *
 * ### 베스트 프랙티스
 * - base-ui RadioGroup으로 감싸 사용합니다 — `RadioGroup.Root`(components) 또는 `BaseRadioGroup`(compositions) 모두 가능.
 * - 각 카드에 고유 `value`를 지정합니다. 선택 상태는 그룹이 소유합니다.
 * - 일반 라디오(+라벨) 형태가 필요하면 `RadioGroup` 파트 조합 또는 `BaseRadio`를 사용하세요.
 */
const meta = {
  title: 'Compositions / Common / Form / RadioCard',
  component: RadioCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    label: '카드 항목',
    disabled: false,
  },
} satisfies Meta<typeof RadioCard>

export default meta
type Story = StoryObj<typeof meta>

/** 기본 카드 라디오입니다. Controls 패널에서 props를 직접 조작할 수 있습니다. */
export const Default: Story = {
  render: args => (
    <RadioGroup.Root defaultValue="a">
      <div className="w-[240px]">
        <RadioCard {...args} value="a" />
      </div>
    </RadioGroup.Root>
  ),
}

/**
 * 미선택 / 선택 / 비활성 / 비활성+선택 상태입니다.
 * 라디오는 그룹당 하나만 선택되므로, 활성·비활성 두 그룹으로 나눠 보여줍니다.
 */
export const AllStates: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex w-[240px] flex-col gap-6">
      <RadioGroup.Root defaultValue="checked" className="flex flex-col gap-2">
        <RadioCard value="unchecked" label="미선택 항목" />
        <RadioCard value="checked" label="선택된 항목" />
      </RadioGroup.Root>
      <RadioGroup.Root defaultValue="disabled-checked" disabled className="flex flex-col gap-2">
        <RadioCard value="disabled-unchecked" label="비활성 항목" />
        <RadioCard value="disabled-checked" label="비활성 + 선택 항목" />
      </RadioGroup.Root>
    </div>
  ),
}

/** 외부 상태로 제어되는 카드 라디오 그룹입니다. */
export const Controlled: Story = {
  parameters: { controls: { disable: true } },
  render: function ControlledStory() {
    const [value, setValue] = React.useState('a')
    return (
      <div className="flex w-[240px] flex-col gap-3">
        <RadioGroup.Root
          value={value}
          onValueChange={v => setValue(String(v))}
          className="flex flex-col gap-2"
        >
          <RadioCard value="a" label="옵션 A" />
          <RadioCard value="b" label="옵션 B" />
          <RadioCard value="c" label="옵션 C" />
        </RadioGroup.Root>
        <p className="body3 text-afds-text-secondary">
          선택된 값: <strong>{value}</strong>
        </p>
      </div>
    )
  },
}

/** `BaseRadioGroup`(compositions)으로 감싸도 동일하게 동작합니다. */
export const WithBaseRadioGroup: Story = {
  parameters: { controls: { disable: true } },
  render: function BaseGroupStory() {
    return (
      <div className="w-[240px]">
        <BaseRadioGroup defaultValue="b" className="flex flex-col gap-2">
          <RadioCard value="a" label="옵션 A" />
          <RadioCard value="b" label="옵션 B" />
          <RadioCard value="c" label="옵션 C" />
        </BaseRadioGroup>
      </div>
    )
  },
}
