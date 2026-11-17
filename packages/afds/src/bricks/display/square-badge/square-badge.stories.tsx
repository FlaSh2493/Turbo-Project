import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { SquareBadge } from '@turbo-project/afds/bricks'
import type { SquareBadgeColor, SquareBadgeVariant } from './square-badge'

/**
 *
 * 모서리가 살짝 둥근 사각형 배지 컴포넌트입니다.
 * Compound 패턴(Root / Content)으로 구성됩니다.
 *
 * **Import:**
 * ```tsx
 * import { SquareBadge } from '@turbo-project/afds/bricks'
 * ```
 *
 * ### 기본 사용법
 * ```tsx
 * <SquareBadge.Root variant="filled" color="brand">
 *   <SquareBadge.Content>NEW</SquareBadge.Content>
 * </SquareBadge.Root>
 * ```
 */
const meta = {
  title: 'AFDS / Bricks / Display / SquareBadge',
  component: SquareBadge.Root,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['filled', 'outlined'] satisfies SquareBadgeVariant[],
    },
    color: {
      control: 'select',
      options: [
        'brand',
        'neutral',
        'success',
        'warning',
        'error',
        'gradient-ai',
      ] satisfies SquareBadgeColor[],
    },
  },
} satisfies Meta<typeof SquareBadge.Root>

export default meta
type Story = StoryObj<typeof meta>

const VARIANTS: SquareBadgeVariant[] = ['filled', 'outlined']
const COLORS: SquareBadgeColor[] = [
  'brand',
  'neutral',
  'success',
  'warning',
  'error',
  'gradient-ai',
]

export const Default: Story = {
  args: {
    variant: 'filled',
    color: 'brand',
  },
  render: args => (
    <SquareBadge.Root {...args}>
      <SquareBadge.Content>
        <span className="text-afds-12">NEW</span>
      </SquareBadge.Content>
    </SquareBadge.Root>
  ),
}

export const AllVariants: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex gap-afds-spacing-8">
      {VARIANTS.map(variant => (
        <div key={variant} className="flex flex-col gap-afds-spacing-8">
          {COLORS.map(color => (
            <SquareBadge.Root key={color} variant={variant} color={color}>
              <SquareBadge.Content>
                <span className="text-afds-12">badge</span>
              </SquareBadge.Content>
            </SquareBadge.Root>
          ))}
        </div>
      ))}
    </div>
  ),
}

export const MultipleLabels: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-wrap items-center gap-afds-spacing-10">
      <SquareBadge.Root variant="filled" color="brand">
        <SquareBadge.Content>
          <span className="text-afds-12">NEW</span>
        </SquareBadge.Content>
      </SquareBadge.Root>
      <SquareBadge.Root variant="filled" color="error">
        <SquareBadge.Content>
          <span className="text-afds-12">HOT</span>
        </SquareBadge.Content>
      </SquareBadge.Root>
      <SquareBadge.Root variant="outlined" color="success">
        <SquareBadge.Content>
          <span className="text-afds-12">SALE</span>
        </SquareBadge.Content>
      </SquareBadge.Root>
    </div>
  ),
}

export const InContext: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex items-center gap-afds-spacing-8">
      <span className="text-afds-14 font-afds-semibold">신상품</span>
      <SquareBadge.Root variant="filled" color="brand">
        <SquareBadge.Content>
          <span className="text-[11px]">NEW</span>
        </SquareBadge.Content>
      </SquareBadge.Root>
    </div>
  ),
}
