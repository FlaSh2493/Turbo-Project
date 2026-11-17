import * as React from 'react'
import type { ArgTypes, Meta, StoryObj } from '@storybook/react'
import { Spinner } from '@turbo-project/afds/bricks'

/**
 *
 * 로딩 상태를 나타내는 스피너 컴포넌트입니다.
 *
 *
 * ### 기본 사용법
 * ```tsx
 * // 컨테이너 중앙에 오버레이로 표시 (기본값)
 * <div style={{ position: 'relative' }}>
 *   <Spinner />
 * </div>
 *
 * // 인라인으로 표시
 * <Spinner fullscreen="static" size="sm" />
 *
 * // 페이지 전체 오버레이
 * <Spinner fullscreen="page" dim="black" size="lg" />
 * ```
 *
 * ### 언제 사용하나요?
 * - 데이터 페칭, API 요청 대기 시
 * - 버튼·폼 제출 처리 중 피드백
 * - 페이지·섹션 단위 로딩 상태
 *
 * ### 베스트 프랙티스
 * - `fullscreen="container"` 사용 시 부모 요소에 `position: relative` 필수
 * - `fullscreen="page"`는 전체 화면을 덮으므로 최상위에서 한 번만 렌더링
 * - `dim="black"`은 밝은 배경 위에, `dim="white"`는 어두운 배경 위에 사용
 * - 스피너 크기는 컨테이너 크기에 비례해 선택 (xs/sm: 인라인, md/lg: 섹션·페이지)
 */
const argTypes: Partial<ArgTypes> = {
  size: {
    control: 'select',
    options: ['xs', 'sm', 'md', 'lg'],
    description: '스피너 SVG의 크기입니다. xs(16px) · sm(24px) · md(32px) · lg(48px).',
    table: {
      type: { summary: "'xs' | 'sm' | 'md' | 'lg'" },
      defaultValue: { summary: "'sm'" },
    },
  },
  fullscreen: {
    control: 'select',
    options: ['page', 'container', 'static'],
    description:
      '배치 방식입니다. `page`는 viewport 전체 고정, `container`는 가장 가까운 relative 부모 기준 절대 배치, `static`은 인라인 배치.',
    table: {
      type: { summary: "'page' | 'container' | 'static'" },
      defaultValue: { summary: "'container'" },
    },
  },
  dim: {
    control: 'select',
    options: ['white', 'black'],
    description: '배경 딤 색상입니다. `white`는 흰색 반투명, `black`은 검정 반투명 오버레이.',
    table: {
      type: { summary: "'white' | 'black'" },
      defaultValue: { summary: "'white'" },
    },
  },
}

const meta = {
  title: 'AFDS / Bricks / Feedback / Spinner',
  component: Spinner,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
로딩 상태를 나타내는 SVG 기반 스피너 컴포넌트입니다.

**Import:**
\`\`\`tsx
import { Spinner } from '@turbo-project/afds/bricks'
\`\`\`

**컨테이너 오버레이 (기본):**
\`\`\`tsx
<div className="relative h-48">
  <Spinner size="md" dim="black" />
</div>
\`\`\`

**인라인:**
\`\`\`tsx
<Spinner fullscreen="static" size="sm" />
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes,
  args: {
    size: 'sm',
    fullscreen: 'static',
    dim: 'white',
  },
} satisfies Meta<typeof Spinner>

export default meta
type Story = StoryObj<typeof meta>

// Basic Stories

/** Controls 패널에서 size·fullscreen·dim을 직접 조작해 보세요. */
export const Default: Story = {}

/** xs · sm · md · lg 네 가지 크기를 한눈에 비교합니다. */
export const AllSizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-wrap items-center gap-afds-spacing-10">
      <Spinner size="xs" fullscreen="static" />
      <Spinner size="sm" fullscreen="static" />
      <Spinner size="md" fullscreen="static" />
      <Spinner size="lg" fullscreen="static" />
    </div>
  ),
}

// Fullscreen Variant Stories

/**
 * `fullscreen="container"` — 부모 요소 기준 절대 배치입니다.
 * 부모에 `position: relative`가 있어야 정상 동작합니다.
 */
export const ContainerMode: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="relative w-[280px] h-40 border border-dashed border-afds-gray-200 rounded-afds-sm bg-afds-gray-100 flex items-center justify-center">
      <span className="body3 text-afds-gray-500">컨텐츠 영역</span>
      <Spinner size="md" fullscreen="container" dim="black" />
    </div>
  ),
}

/**
 * `fullscreen="page"` — viewport 전체를 덮는 전체 화면 오버레이입니다.
 * 실제 사용 시 최상위 컴포넌트에서 한 번만 렌더링하세요.
 *
 * ⚠️ 이 스토리는 Storybook 캔버스 전체를 덮으므로 iframe 기준으로 표시됩니다.
 */
export const PageMode: Story = {
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
  },
  render: () => (
    <div className="relative w-full h-[300px] bg-afds-gray-100">
      <p className="p-6 body2 text-afds-gray-500">페이지 전체 로딩 오버레이 예시입니다.</p>
      <Spinner size="lg" fullscreen="page" dim="black" />
    </div>
  ),
}

// Dim Variant Stories

/** `dim="white"` (어두운 배경) vs `dim="black"` (밝은 배경) 비교입니다. */
export const DimVariants: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex gap-6">
      <div className="relative w-40 h-[120px] rounded-afds-sm bg-afds-gray-800 flex items-center justify-center">
        <span className="body3 text-afds-gray-0">dim=&quot;white&quot;</span>
        <Spinner size="md" fullscreen="container" dim="white" />
      </div>
      <div className="relative w-40 h-[120px] rounded-afds-sm bg-afds-gray-100 border border-afds-gray-200 flex items-center justify-center">
        <span className="body3 text-afds-gray-500">dim=&quot;black&quot;</span>
        <Spinner size="md" fullscreen="container" dim="black" />
      </div>
    </div>
  ),
}
