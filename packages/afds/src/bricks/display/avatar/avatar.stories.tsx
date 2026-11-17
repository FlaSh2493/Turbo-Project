import type { Meta, StoryObj } from '@storybook/react'
import { expect } from '@storybook/test'
import { Avatar } from '@turbo-project/afds/bricks'
import { ImageIcon } from 'lucide-react'

/**
 *
 * 사용자 프로필 또는 콘텐츠 대표 이미지를 표시하는 합성 컴포넌트입니다.
 * base-ui `Avatar`를 그대로 노출하므로 `Avatar.Root` / `Avatar.Image` / `Avatar.Fallback`
 * 을 직접 조합해 사용합니다.
 *
 * **Import:**
 * ```tsx
 * import { Avatar } from '@turbo-project/afds/bricks'
 * ```
 *
 * ### 기본 사용법
 * ```tsx
 * <Avatar.Root className="size-16 rounded-afds-md overflow-hidden">
 *   <Avatar.Image src={profileUrl} alt="홍길동" />
 *   <Avatar.Fallback>홍</Avatar.Fallback>
 * </Avatar.Root>
 * ```
 *
 * ### 베스트 프랙티스
 * - 크기·모양은 `Root`의 `className`으로 제어합니다
 * - 이미지 로드 실패 시 base-ui가 자동으로 Fallback을 표시합니다
 * - 닫힌 프롭 API가 필요하면 컴포지션 레이어에서 별도 구성합니다
 */

const meta = {
  title: 'AFDS / Bricks / Display / Avatar',
  component: Avatar.Root,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Avatar.Root>

export default meta
type Story = StoryObj<typeof meta>

// Basic Stories

/** 기본 합성: 이미지 + 폴백. */
export const Default: Story = {
  render: () => (
    <Avatar.Root className="size-16 rounded-afds-md overflow-hidden">
      <Avatar.Image src="https://picsum.photos/128/128" alt="프로필 이미지" />
      <Avatar.Fallback>?</Avatar.Fallback>
    </Avatar.Root>
  ),
}

/** 이미지 URL이 유효하지 않으면 Fallback이 표시됩니다. */
export const WithBrokenSrc: Story = {
  render: () => (
    <Avatar.Root className="size-16 rounded-afds-md overflow-hidden bg-afds-gray-100">
      <Avatar.Image src="https://this-url-does-not-exist.invalid/image.jpg" alt="로딩 실패" />
      <Avatar.Fallback className="title2 text-afds-text-primary">실</Avatar.Fallback>
    </Avatar.Root>
  ),
}

/** 기본 폴백 일러스트레이션: src가 없거나 로드 실패 시 표시할 기본 이미지 예시. */
export const WithDefaultFallback: Story = {
  render: () => (
    <Avatar.Root className="size-16 rounded-afds-md overflow-hidden">
      <Avatar.Image src="https://this-url-does-not-exist.invalid/image.jpg" alt="로딩 실패" />
      <Avatar.Fallback>
        <ImageIcon />
      </Avatar.Fallback>
    </Avatar.Root>
  ),
}

/** Image 없이 Fallback만 사용. */
export const FallbackOnly: Story = {
  render: () => (
    <Avatar.Root className="size-16 rounded-afds-md overflow-hidden bg-afds-gray-100">
      <Avatar.Fallback className="title2 text-afds-brand-700">홍</Avatar.Fallback>
    </Avatar.Root>
  ),
}

// Interaction Test Stories

export const RenderTest: Story = {
  render: () => (
    <Avatar.Root className="size-16 rounded-afds-md overflow-hidden">
      <Avatar.Fallback>FB</Avatar.Fallback>
    </Avatar.Root>
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('[data-slot="avatar"]')
    await expect(root).toBeInTheDocument()
    const fallback = canvasElement.querySelector('[data-slot="avatar-fallback"]')
    await expect(fallback).toBeInTheDocument()
  },
}
