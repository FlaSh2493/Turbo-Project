import type { ArgTypes, Meta, StoryObj } from '@storybook/react'
import { SegmentControl } from '@turbo-project/afds/bricks'
import { Button } from '@turbo-project/afds/bricks'
import { useState, type ComponentProps } from 'react'

/**
 *
 * 세그먼트 형태의 탭 선택 컴포넌트입니다.
 * `SegmentControl.Root`, `SegmentControl.Item` 컴파운드 구조입니다.
 *
 *
 * ### 기본 사용법
 * ```tsx
 * <SegmentControl.Root defaultValue="menu1">
 *   <SegmentControl.Indicator />
 *   <SegmentControl.Item value="menu1">Menu 1</SegmentControl.Item>
 *   <SegmentControl.Item value="menu2">Menu 2</SegmentControl.Item>
 * </SegmentControl.Root>
 * ```
 *
 * ### 언제 사용하나요?
 * - 2~4개의 옵션 중 하나를 선택하는 UI
 * - Tab보다 콤팩트한 모드 전환 (그리드/리스트 뷰 등)
 *
 * ### 베스트 프랙티스
 * - 아이템 수는 2~4개를 권장합니다
 * - `size` prop으로 컨텍스트에 맞는 높이를 선택하세요 (sm: 24px, default: 34px, lg: 44px)
 */

const argTypes: Partial<ArgTypes> = {
  size: {
    control: { type: 'radio' },
    options: ['sm', 'default', 'lg'],
    description: '컴포넌트 크기 (sm: 24px, default: 34px, lg: 44px)',
    table: {
      category: 'SegmentControl.Root',
      type: { summary: "'sm' | 'default' | 'lg'" },
      defaultValue: { summary: "'default'" },
    },
  },
}

const meta = {
  title: 'AFDS / Bricks / Action / SegmentControl',
  component: SegmentControl.Root,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
세그먼트 형태의 탭 선택 컴포넌트입니다.

**Import:**
\`\`\`tsx
import { SegmentControl } from '@turbo-project/afds/bricks'
\`\`\`

### 기본 사용법
\`\`\`tsx
<SegmentControl.Root defaultValue="menu1">
  <SegmentControl.Indicator />
  <SegmentControl.Item value="menu1">Menu 1</SegmentControl.Item>
  <SegmentControl.Item value="menu2">Menu 2</SegmentControl.Item>
</SegmentControl.Root>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes,
} satisfies Meta<typeof SegmentControl.Root>

export default meta
type StoryProps = Omit<ComponentProps<typeof SegmentControl.Root>, 'children'>
type Story = StoryObj<StoryProps>

// Basic Stories

export const Default: Story = {
  args: {
    defaultValue: 'item1',
  },
  render: (args: StoryProps) => (
    <SegmentControl.Root {...args}>
      <SegmentControl.Indicator />
      <SegmentControl.Item value="item1">Item 1</SegmentControl.Item>
      <SegmentControl.Item value="item2">Item 2</SegmentControl.Item>
    </SegmentControl.Root>
  ),
}

/** Controls 패널에서 size, defaultValue 등을 조작해 보세요. */
export const Uncontrolled: Story = {
  args: {
    defaultValue: 'menu1',
  },
  render: (args: StoryProps) => (
    <SegmentControl.Root {...args}>
      <SegmentControl.Indicator />
      <SegmentControl.Item value="menu1">Menu 1</SegmentControl.Item>
      <SegmentControl.Item value="menu2">Menu 2</SegmentControl.Item>
    </SegmentControl.Root>
  ),
}

// Size Stories

/** 소형(24px) 세그먼트 컨트롤입니다. */
export const Small: Story = {
  args: {
    size: 'sm',
    defaultValue: 'menu1',
  },
  render: args => (
    <SegmentControl.Root {...args}>
      <SegmentControl.Indicator />
      <SegmentControl.Item value="menu1">Menu 1</SegmentControl.Item>
      <SegmentControl.Item value="menu2">Menu 2</SegmentControl.Item>
    </SegmentControl.Root>
  ),
}

/** 대형(44px) 세그먼트 컨트롤입니다. */
export const Large: Story = {
  args: {
    size: 'lg',
    defaultValue: 'menu1',
  },
  render: args => (
    <SegmentControl.Root {...args}>
      <SegmentControl.Indicator />
      <SegmentControl.Item value="menu1">Menu 1</SegmentControl.Item>
      <SegmentControl.Item value="menu2">Menu 2</SegmentControl.Item>
    </SegmentControl.Root>
  ),
}

/** 4개 아이템 세그먼트 컨트롤입니다. */
export const MultipleItems: Story = {
  args: {
    defaultValue: 'tab1',
  },
  render: args => (
    <SegmentControl.Root {...args}>
      <SegmentControl.Indicator />
      <SegmentControl.Item value="tab1">Tab 1</SegmentControl.Item>
      <SegmentControl.Item value="tab2">Tab 2</SegmentControl.Item>
      <SegmentControl.Item value="tab3">Tab 3</SegmentControl.Item>
      <SegmentControl.Item value="tab4">Tab 4</SegmentControl.Item>
    </SegmentControl.Root>
  ),
}

/** sm / default / lg 세 가지 크기를 한눈에 비교합니다. */
export const AllSizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-afds-spacing-24 items-start">
      <div>
        <p className="mb-afds-8 text-xs text-afds-text-secondary">Small (24px)</p>
        <SegmentControl.Root size="sm" defaultValue="menu1">
          <SegmentControl.Indicator />
          <SegmentControl.Item value="menu1">Menu 1</SegmentControl.Item>
          <SegmentControl.Item value="menu2">Menu 2</SegmentControl.Item>
        </SegmentControl.Root>
      </div>
      <div>
        <p className="mb-afds-8 text-xs text-afds-text-secondary">Medium (34px) - Default</p>
        <SegmentControl.Root size="default" defaultValue="menu1">
          <SegmentControl.Indicator />
          <SegmentControl.Item value="menu1">Menu 1</SegmentControl.Item>
          <SegmentControl.Item value="menu2">Menu 2</SegmentControl.Item>
        </SegmentControl.Root>
      </div>
      <div>
        <p className="mb-afds-8 text-xs text-afds-text-secondary">Large (44px)</p>
        <SegmentControl.Root size="lg" defaultValue="menu1">
          <SegmentControl.Indicator />
          <SegmentControl.Item value="menu1">Menu 1</SegmentControl.Item>
          <SegmentControl.Item value="menu2">Menu 2</SegmentControl.Item>
        </SegmentControl.Root>
      </div>
    </div>
  ),
}

// State Stories

/** 외부에서 값을 제어하는 controlled 모드입니다. */
export const Controlled: Story = {
  parameters: { controls: { disable: true } },
  render: function ControlledSegment() {
    const [selected, setSelected] = useState('menu1')

    return (
      <div className="flex flex-col items-center gap-afds-spacing-14">
        <SegmentControl.Root value={selected} onValueChange={setSelected}>
          <SegmentControl.Indicator />
          <SegmentControl.Item value="menu1">Menu 1</SegmentControl.Item>
          <SegmentControl.Item value="menu2">Menu 2</SegmentControl.Item>
          <SegmentControl.Item value="menu3">Menu 3</SegmentControl.Item>
        </SegmentControl.Root>
        <p className="text-sm text-afds-text-primary">
          선택된 값: <strong>{selected}</strong>
        </p>
        <div className="flex gap-afds-spacing-8">
          <Button onClick={() => setSelected('menu1')} variant="primary-line" size="sm">
            Menu 1
          </Button>
          <Button onClick={() => setSelected('menu2')} variant="primary-line" size="sm">
            Menu 2
          </Button>
          <Button onClick={() => setSelected('menu3')} variant="primary-line" size="sm">
            Menu 3
          </Button>
        </div>
      </div>
    )
  },
}

/** controlled / uncontrolled 모드 전환 데모입니다. */
export const ModeSwitching: Story = {
  parameters: { controls: { disable: true } },
  render: function ModeSwitchingStory() {
    const [isControlled, setIsControlled] = useState(true)
    const [value, setValue] = useState('menu1')

    return (
      <div className="flex flex-col items-center gap-afds-spacing-14">
        <div className="flex gap-afds-spacing-8 items-center">
          <label className="text-sm flex items-center gap-afds-spacing-8">
            <input
              type="checkbox"
              checked={isControlled}
              onChange={e => setIsControlled(e.target.checked)}
            />
            Controlled Mode
          </label>
        </div>

        <SegmentControl.Root
          value={isControlled ? value : undefined}
          defaultValue="menu1"
          onValueChange={(val: string) => {
            console.log('onValueChange', val)
            setValue(val)
          }}
        >
          <SegmentControl.Indicator />
          <SegmentControl.Item value="menu1">Menu 1</SegmentControl.Item>
          <SegmentControl.Item value="menu2">Menu 2</SegmentControl.Item>
          <SegmentControl.Item value="menu3">Menu 3</SegmentControl.Item>
        </SegmentControl.Root>

        <div className="text-afds-12 text-afds-text-secondary text-center">
          <p>Current Value: {value}</p>
          <p>
            {isControlled
              ? '부모 컴포넌트가 상태를 제어합니다.'
              : '컴포넌트가 내부적으로 상태를 관리합니다.'}
          </p>
        </div>
      </div>
    )
  },
}

/** 아이콘(이모지)을 아이템으로 사용한 예시입니다. */
export const WithIcons: Story = {
  args: {
    defaultValue: 'grid',
  },
  render: args => (
    <SegmentControl.Root {...args}>
      <SegmentControl.Indicator />
      <SegmentControl.Item value="grid">
        <span className="text-sm">⊞</span>
      </SegmentControl.Item>
      <SegmentControl.Item value="list">
        <span className="text-sm">☰</span>
      </SegmentControl.Item>
    </SegmentControl.Root>
  ),
}

/** 긴 레이블을 가진 아이템입니다. */
export const LongLabels: Story = {
  args: {
    defaultValue: 'option1',
    size: 'lg',
  },
  render: args => (
    <SegmentControl.Root {...args}>
      <SegmentControl.Indicator />
      <SegmentControl.Item value="option1">첫 번째 옵션</SegmentControl.Item>
      <SegmentControl.Item value="option2">두 번째 옵션</SegmentControl.Item>
      <SegmentControl.Item value="option3">세 번째 옵션</SegmentControl.Item>
    </SegmentControl.Root>
  ),
}
