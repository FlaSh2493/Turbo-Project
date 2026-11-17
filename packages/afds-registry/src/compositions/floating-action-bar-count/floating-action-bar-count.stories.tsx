import type { Meta, StoryObj } from '@storybook/react'
import { FloatingActionBarCount } from './floating-action-bar-count'

/**
 *
 * `FloatingActionBar.Card` 내부에 배치하는 선택 개수 표시 컴포지션입니다.
 *
 * **Import:**
 * ```tsx
 * import { FloatingActionBarCount } from '.'
 * ```
 *
 * ### 기본 사용법
 * ```tsx
 * <FloatingActionBarCount count={3} />
 * ```
 *
 * ### 베스트 프랙티스
 * - 도메인 표현이 필요하면 `formatter`로 커스터마이즈합니다 (예: `n명`, `n건`)
 */
const meta = {
  title: 'Compositions / Common / Display / FloatingActionBarCount',
  component: FloatingActionBarCount,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof FloatingActionBarCount>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { count: 3 },
}

export const WithFormatter: Story = {
  args: {
    count: 12,
    formatter: (n: number) => `${n}명 선택됨`,
  },
}
