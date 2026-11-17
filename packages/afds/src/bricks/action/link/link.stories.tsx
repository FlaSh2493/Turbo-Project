import type { ArgTypes, Meta, StoryObj } from '@storybook/react'
import { expect, within } from '@storybook/test'
import { Link } from '@turbo-project/afds/bricks'

/**
 *
 * 페이지 이동 및 외부 URL 연결을 위한 텍스트 링크 컴포넌트입니다.
 *
 *
 * ### 언제 사용하나요?
 * - 다른 페이지로 이동하는 링크
 * - 외부 URL 연결 (`target="_blank" rel="noopener noreferrer"`)
 * - "자세히 보기", "공식 문서" 등 텍스트 링크
 *
 * ### Link vs Button 선택
 * - URL 이동 → `<Link>`
 * - 클릭 액션(모달 열기·폼 제출) → `<Button>`
 *
 * ### 베스트 프랙티스
 * - 외부 링크는 `target="_blank" rel="noopener noreferrer"` 반드시 추가
 * - 본문 인라인 링크는 접근성을 위해 `className="underline"` 추가 (WCAG 1.4.1)
 * - 링크 텍스트만으로 목적지 파악 가능해야 함 ("여기", "클릭" 금지)
 */

const argTypes: Partial<ArgTypes> = {
  target: {
    control: 'select',
    options: ['_self', '_blank', '_parent', '_top'],
    description: '링크 열기 방식',
    table: {
      type: { summary: "'_self' | '_blank' | '_parent' | '_top'" },
      defaultValue: { summary: '_self' },
    },
  },
}

const meta = {
  title: 'AFDS / Bricks / Action / Link',
  component: Link,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
시맨틱 디자인 토큰이 적용된 텍스트 링크 컴포넌트입니다.

**Import:**
\`\`\`tsx
import { Link } from '@turbo-project/afds/bricks'
\`\`\`

### 기본 사용법
\`\`\`tsx
<Link href="/page">페이지로 이동</Link>
<Link href="https://example.com" target="_blank" rel="noopener noreferrer">
  외부 링크
</Link>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes,
  args: {
    href: '#',
    children: '링크 텍스트',
  },
} satisfies Meta<typeof Link>

export default meta
type Story = StoryObj<typeof meta>

// Basic Stories

/** 기본 링크입니다. 호버 시 밑줄이 표시됩니다. */
export const Default: Story = {
  args: { href: '#', children: '기본 링크' },
}

/** 외부 링크입니다. 새 탭에서 열립니다. */
export const ExternalLink: Story = {
  args: {
    href: 'https://example.com',
    target: '_blank',
    rel: 'noopener noreferrer',
    children: '외부 링크 (새 탭)',
  },
}

/** 본문 텍스트 안에 인라인으로 사용하는 예시입니다. 접근성을 위해 className="underline"을 추가합니다. */
export const InlineInText: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <p className="text-afds-14 leading-[24px] max-w-[360px]">
      자세한 내용은{' '}
      <Link href="#" className="underline">
        공식 문서
      </Link>
      를 참고하세요.
    </p>
  ),
}

export const RenderTest: Story = {
  args: { href: '#test', children: '링크 테스트' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const link = canvas.getByRole('link', { name: '링크 테스트' })
    await expect(link).toBeInTheDocument()
    await expect(link).toHaveAttribute('href', '#test')
    await expect(link).toHaveAttribute('data-slot', 'link')
  },
}
