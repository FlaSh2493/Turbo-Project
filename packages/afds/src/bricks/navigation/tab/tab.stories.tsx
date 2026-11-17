import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { expect, userEvent, within } from '@storybook/test'
import { Tab } from '@turbo-project/afds/bricks'

/**
 *
 * 스타일이 적용된 탭 컴포넌트입니다.
 * `Tab.Root`, `Tab.List`, `Tab.Tab`, `Tab.Panel` 컴파운드 구조입니다.
 *
 *
 * ### 구조
 * ```tsx
 * <Tab.Root defaultValue="tab1">
 *   <Tab.List>
 *     <Tab.Tab value="tab1">탭 1</Tab.Tab>
 *     <Tab.Tab value="tab2">탭 2</Tab.Tab>
 *   </Tab.List>
 *   <Tab.Panel value="tab1">탭 1 내용</Tab.Panel>
 *   <Tab.Panel value="tab2">탭 2 내용</Tab.Panel>
 * </Tab.Root>
 * ```
 *
 * ### 베스트 프랙티스
 * - `Tab.Tab`의 `value`와 `Tab.Panel`의 `value`를 동일하게 설정하세요
 * - `defaultValue`로 기본 선택 탭을 지정합니다
 * - 키보드 화살표 키로 탭 간 이동이 자동 지원됩니다
 */

const meta = {
  title: 'AFDS / Bricks / Navigation / Tab',
  component: Tab.Root,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
스타일이 적용된 탭 컴포넌트입니다. Base UI Tabs 기반의 Compound 패턴입니다.

**Import:**
\`\`\`tsx
import { Tab } from '@turbo-project/afds/bricks'
\`\`\`

### 기본 사용법
\`\`\`tsx
<Tab.Root defaultValue="tab1">
  <Tab.List>
    <Tab.Tab value="tab1">첫 번째</Tab.Tab>
    <Tab.Tab value="tab2">두 번째</Tab.Tab>
  </Tab.List>
  <Tab.Panel value="tab1">첫 번째 탭 콘텐츠</Tab.Panel>
  <Tab.Panel value="tab2">두 번째 탭 콘텐츠</Tab.Panel>
</Tab.Root>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Tab.Root>

export default meta
type Story = StoryObj<typeof meta>

const tabItems = [
  { value: 'overview', label: '개요', content: '개요 탭의 내용입니다.' },
  { value: 'analytics', label: '분석', content: '분석 탭의 내용입니다.' },
  { value: 'reports', label: '리포트', content: '리포트 탭의 내용입니다.' },
]

/** 기본 탭 컴포넌트입니다. */
export const Default: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Tab.Root defaultValue="overview">
      <Tab.List>
        {tabItems.map(tab => (
          <Tab.Tab key={tab.value} value={tab.value}>
            {tab.label}
          </Tab.Tab>
        ))}
      </Tab.List>
      {tabItems.map(tab => (
        <Tab.Panel key={tab.value} value={tab.value} className="p-[16px_0] text-afds-14">
          {tab.content}
        </Tab.Panel>
      ))}
    </Tab.Root>
  ),
}

/** 탭 전환 인터랙션 테스트 */
export const SwitchInteraction: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Tab.Root defaultValue="tab1">
      <Tab.List>
        <Tab.Tab value="tab1">탭 1</Tab.Tab>
        <Tab.Tab value="tab2">탭 2</Tab.Tab>
        <Tab.Tab value="tab3">탭 3</Tab.Tab>
      </Tab.List>
      <Tab.Panel value="tab1" className="p-[16px_0]">
        탭 1의 콘텐츠
      </Tab.Panel>
      <Tab.Panel value="tab2" className="p-[16px_0]">
        탭 2의 콘텐츠
      </Tab.Panel>
      <Tab.Panel value="tab3" className="p-[16px_0]">
        탭 3의 콘텐츠
      </Tab.Panel>
    </Tab.Root>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const tab1 = canvas.getByRole('tab', { name: '탭 1' })
    const tab2 = canvas.getByRole('tab', { name: '탭 2' })

    await expect(tab1).toHaveAttribute('data-active')

    await userEvent.click(tab2)
    await expect(tab2).toHaveAttribute('data-active')
    await expect(tab1).not.toHaveAttribute('data-active')

    const content2 = canvas.getByText('탭 2의 콘텐츠')
    await expect(content2).toBeVisible()
  },
}
