import type { Meta, StoryObj } from '@storybook/react'
import { Box } from '@turbo-project/afds/bricks'

const meta = {
  title: 'AFDS / Bricks / Layout / Box',
  component: Box,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
가장 기본이 되는 \`<div>\` 레이아웃 컴포넌트입니다. \`className\`으로 스타일을 적용합니다.

**Import:**
\`\`\`tsx
import { Box } from '@turbo-project/afds/bricks'
\`\`\`

### 기본 사용법
\`\`\`tsx
<Box className="p-4">콘텐츠</Box>
\`\`\`

**시맨틱 태그가 필요한 경우:**
Box 대신 적절한 HTML 태그를 직접 사용합니다 — \`<section>\`, \`<article>\`, \`<aside>\` 등.
\`\`\`tsx
<section className="p-4">섹션 콘텐츠</section>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Box>

export default meta
type Story = StoryObj<typeof meta>

/** 기본 Box입니다. Controls 패널에서 props를 직접 조작할 수 있습니다. */
export const Default: Story = {
  args: {
    children: 'Box Content',
    className: 'p-4 bg-afds-gray-0 rounded-afds-sm border border-afds-gray-200',
  },
}

/** 다양한 스타일을 적용한 Box입니다. */
export const Styling: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-wrap items-center gap-afds-spacing-10">
      <Box className="w-20 h-20 bg-afds-brand-700 rounded-afds-sm flex items-center justify-center text-afds-gray-0">
        1
      </Box>
      <Box className="w-20 h-20 bg-afds-brand-500 rounded-afds-sm flex items-center justify-center text-afds-brand-700">
        2
      </Box>
      <Box className="w-20 h-20 bg-afds-gray-0 rounded-afds-sm border border-afds-gray-200 flex items-center justify-center text-afds-gray-700">
        3
      </Box>
    </div>
  ),
}

/** 카드 형태의 Box입니다. 시맨틱이 필요하면 Box 대신 `<article>`을 직접 사용합니다. */
export const Card: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Box className="max-w-sm p-6 bg-afds-gray-0 border border-afds-gray-200 rounded-afds-md shadow hover:bg-afds-alpha-black-003 transition-colors cursor-pointer">
      <h5 className="mb-2 text-2xl font-bold tracking-tight text-afds-gray-700">
        Noteworthy technology acquisitions 2021
      </h5>
      <p className="font-normal text-afds-gray-500">
        Here are the biggest enterprise technology acquisitions of 2021 so far, in reverse
        chronological order.
      </p>
    </Box>
  ),
}
