import * as React from 'react'
import type { ArgTypes, Meta, StoryObj } from '@storybook/react'
import { Typography } from '@turbo-project/afds/bricks'

/**
 *
 * 디자인 토큰 기반 타이포그래피 컴포넌트입니다.
 * `variant`로 스타일을, `color`로 색상을, `as`로 렌더링 태그를 지정합니다.
 */
const argTypes: Partial<ArgTypes> = {
  variant: {
    control: 'select',
    options: [
      'heading0',
      'heading1',
      'heading2',
      'title1',
      'title2',
      'title3',
      'title4',
      'body1',
      'body2',
      'body3',
      'caption1',
      'caption2',
    ],
  },
  color: {
    control: 'select',
    options: [
      'text-primary',
      'text-secondary',
      'text-disabled',
      'text-inverse',
      'text-brand',
      'text-brand-subtle',
      'text-error',
      'text-ai',
      'text-lnb-default',
      'text-lnb-disabled',
    ],
  },
  as: {
    control: 'select',
    options: ['span', 'p', 'h1', 'h2', 'h3', 'h4', 'div', 'label'],
  },
}

const meta = {
  title: 'AFDS / Bricks / Display / Typography',
  component: Typography,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `디자인 토큰 기반 타이포그래피 컴포넌트입니다. \`variant\`로 스타일을, \`color\`로 색상을, \`as\`로 렌더링 태그를 지정합니다.

**Import:**
\`\`\`tsx
import { Typography } from '@turbo-project/afds/bricks'
\`\`\`

### 기본 사용법
\`\`\`tsx
<Typography variant="body1">본문 텍스트입니다.</Typography>
<Typography variant="heading1" as="h1">페이지 제목</Typography>
<Typography variant="caption1" color="text-secondary">보조 설명</Typography>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes,
  args: {
    variant: 'body1',
    children: '텍스트 예시입니다',
  },
} satisfies Meta<typeof Typography>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const AllVariants: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-afds-spacing-8 p-afds-spacing-14">
      <Typography variant="heading0">heading0 — 대제목</Typography>
      <Typography variant="heading1">heading1 — 제목 1</Typography>
      <Typography variant="heading2">heading2 — 제목 2</Typography>
      <Typography variant="title1">title1 — 타이틀 1</Typography>
      <Typography variant="title2">title2 — 타이틀 2</Typography>
      <Typography variant="title3">title3 — 타이틀 3</Typography>
      <Typography variant="title4">title4 — 타이틀 4</Typography>
      <Typography variant="body1">body1 — 본문 1</Typography>
      <Typography variant="body2">body2 — 본문 2</Typography>
      <Typography variant="body3">body3 — 본문 3</Typography>
      <Typography variant="caption1">caption1 — 캡션 1</Typography>
      <Typography variant="caption2">caption2 — 캡션 2</Typography>
    </div>
  ),
}

/** 시맨틱 텍스트 컬러 — Typography가 노출하는 유일한 color 카테고리. */
export const SemanticColors: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-wrap items-center gap-afds-spacing-10">
      <Typography variant="body1" color="text-primary">
        text-primary
      </Typography>
      <Typography variant="body1" color="text-secondary">
        text-secondary
      </Typography>
      <Typography variant="body1" color="text-disabled">
        text-disabled
      </Typography>
      <Typography variant="body1" color="text-inverse">
        text-inverse
      </Typography>
      <Typography variant="body1" color="text-brand">
        text-brand
      </Typography>
      <Typography variant="body1" color="text-brand-subtle">
        text-brand-subtle
      </Typography>
      <Typography variant="body1" color="text-error">
        text-error
      </Typography>
      <Typography variant="body1" color="text-ai">
        text-ai
      </Typography>
      <Typography variant="body1" color="text-lnb-default">
        text-lnb-default
      </Typography>
      <Typography variant="body1" color="text-lnb-disabled">
        text-lnb-disabled
      </Typography>
    </div>
  ),
}

export const SemanticElements: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-afds-spacing-8">
      <Typography variant="heading1" as="h1">
        h1 태그로 렌더링
      </Typography>
      <Typography variant="body1" as="p">
        p 태그로 렌더링된 본문 텍스트입니다.
      </Typography>
      <Typography variant="caption1" as="label">
        label 태그로 렌더링
      </Typography>
    </div>
  ),
}
