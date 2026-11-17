import type { ArgTypes, Meta, StoryObj } from '@storybook/react'
import { expect, userEvent, within, fn } from '@storybook/test'
import { Button } from '@turbo-project/afds/bricks'

/**
 *
 * 디자인 토큰이 적용된 버튼 컴포넌트입니다.
 *
 *
 * ### 기본 사용법
 * ```tsx
 * <Button variant="fill" size="md">저장</Button>
 * ```
 *
 * ### render 패턴 (링크로 렌더링)
 * ```tsx
 * <Button variant="line" render={<a href="/path">이동</a>} />
 * ```
 *
 * ### variant 선택 기준
 * - `fill`: 페이지의 주요 CTA (로그인, 저장, 결제). 페이지당 1–2개만 사용
 * - `primary-line`: 강조된 테두리 버튼. fill과 함께 쓰는 보조 CTA
 * - `line`: 일반 보조 액션 (취소, 목록으로)
 * - `ghost`: 최소 강조가 필요한 액션 (닫기, 더보기)
 * - `danger`: 삭제·철회 등 되돌릴 수 없는 액션
 *
 * ### size 선택 기준
 * - `lg` (44px): 단독 페이지 레벨 CTA
 * - `md` (34px): 기본값. 대부분의 UI
 * - `sm` (24px): 테이블·카드 내 인라인 액션
 * - `icon-sm` / `icon-lg` / `icon-xs`: 텍스트 없이 아이콘만 표시할 때
 *
 * ### 베스트 프랙티스
 * - 아이콘만 있는 버튼은 `aria-label` 필수
 * - 비동기 작업 중에는 `disabled` 또는 로딩 스피너를 함께 사용
 */
const argTypes: Partial<ArgTypes> = {
  variant: {
    control: 'select',
    options: ['fill', 'primary-line', 'line', 'ghost', 'danger'],
    description: '버튼의 시각적 스타일을 결정합니다. 용도에 따라 선택하세요.',
    table: {
      type: {
        summary: "'fill' | 'primary-line' | 'line' | 'ghost' | 'danger'",
      },
      defaultValue: { summary: 'fill' },
    },
  },
  size: {
    control: 'select',
    options: ['lg', 'md', 'sm', 'icon-sm', 'icon-lg', 'icon-xs'],
    description: '버튼의 크기를 결정합니다.',
    table: {
      type: {
        summary: "'lg' | 'md' | 'sm' | 'icon-sm' | 'icon-lg' | 'icon-xs'",
      },
      defaultValue: { summary: 'md' },
    },
  },
}

const meta = {
  title: 'AFDS / Bricks / Action / Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
디자인 토큰이 적용된 버튼 컴포넌트입니다.

**Import:**
\`\`\`tsx
import { Button } from '@turbo-project/afds/bricks'
\`\`\`

### 기본 사용법
\`\`\`tsx
<Button variant="fill" size="md">저장</Button>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes,
  args: {
    children: 'Button',
    variant: 'fill',
    size: 'md',
    disabled: false,
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

// Basic Stories

/** 기본 버튼입니다. Controls 패널에서 variant·size·disabled를 직접 조작할 수 있습니다. */
export const Default: Story = {}

// Variant Stories

/** 주요 CTA에 사용합니다. 페이지당 1–2개 이내로 제한합니다. */
export const Fill: Story = {
  args: { variant: 'fill', children: '저장하기' },
}

/** fill과 함께 사용하는 강조 보조 버튼입니다. */
export const PrimaryLine: Story = {
  args: { variant: 'primary-line', children: '미리보기' },
}

/** 일반 보조 액션(취소, 목록으로 등)에 사용합니다. */
export const Line: Story = {
  args: { variant: 'line', children: '취소' },
}

/** 최소 강조가 필요한 액션(닫기, 더보기 등)에 사용합니다. */
export const Ghost: Story = {
  args: { variant: 'ghost', children: '더보기' },
}

/** 삭제·철회 등 되돌릴 수 없는 위험 액션에 사용합니다. */
export const Danger: Story = {
  args: { variant: 'danger', children: '삭제' },
}

/** 모든 variant를 한눈에 비교합니다. */
export const AllVariants: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-wrap items-center gap-afds-spacing-10">
      <Button variant="fill">Fill</Button>
      <Button variant="primary-line">Primary Line</Button>
      <Button variant="line">Line</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="danger">Danger</Button>
    </div>
  ),
}

// Size Stories

/** 높이 24px. 테이블·카드 내 인라인 액션에 사용합니다. */
export const Small: Story = {
  args: { size: 'sm', children: '소형 버튼' },
}

/** 높이 34px. 기본 크기입니다. */
export const Medium: Story = {
  args: { size: 'md', children: '중형 버튼' },
}

/** 높이 44px. 단독 페이지 레벨 CTA에 사용합니다. */
export const Large: Story = {
  args: { size: 'lg', children: '대형 버튼' },
}

/** 모든 텍스트 size를 한눈에 비교합니다. */
export const AllSizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-wrap items-center gap-afds-spacing-10">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
}

// State Stories

/** 비활성화된 버튼입니다. 포인터 이벤트가 차단됩니다. */
export const Disabled: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-wrap items-center gap-afds-spacing-10">
      <Button variant="fill" disabled>
        Fill
      </Button>
      <Button variant="primary-line" disabled>
        Primary Line
      </Button>
      <Button variant="line" disabled>
        Line
      </Button>
      <Button variant="ghost" disabled>
        Ghost
      </Button>
      <Button variant="danger" disabled>
        Danger
      </Button>
    </div>
  ),
}

// Interaction Tests

export const ClickInteraction: Story = {
  args: {
    children: '클릭하세요',
    onClick: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button', { name: '클릭하세요' })
    await expect(button).toBeInTheDocument()
    await userEvent.click(button)
    await expect(args.onClick).toHaveBeenCalledTimes(1)
  },
}
