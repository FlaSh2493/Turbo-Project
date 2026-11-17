import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Container, Section } from '@turbo-project/afds/bricks'

const argTypes = {
  size: {
    control: { type: 'select' as const },
    options: ['sm', 'md', 'lg', 'xl', '2xl', 'full'],
    description: '최대 너비 (screen size 기준)',
    table: {
      type: { summary: "'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'" },
      defaultValue: { summary: 'xl' },
    },
  },
}

const meta = {
  title: 'AFDS / Bricks / Layout / Container',
  component: Container,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
콘텐츠의 최대 너비를 제어하고 중앙에 배치하는 레이아웃 컴포넌트입니다.
Container는 \`max-width\`와 \`mx-auto\`를 적용하고, Section은 수직 여백(\`py\`)이 적용된 \`<section>\` 태그입니다.

**Import:**
\`\`\`tsx
import { Container, Section } from '@turbo-project/afds/bricks'
\`\`\`

### 기본 사용법
\`\`\`tsx
<Section>
  <Container size="xl">콘텐츠</Container>
</Section>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes,
  args: {
    size: 'xl',
    center: true,
  },
} satisfies Meta<typeof Container>

export default meta
type Story = StoryObj<typeof meta>

/** size별 최대 너비를 Controls에서 조작해보세요. */
export const Default: Story = {
  render: args => (
    <div className="bg-afds-gray-100 w-full">
      <Container
        {...args}
        className="bg-white border-x border-dashed border-afds-gray-300 min-h-[200px] p-4"
      >
        <div className="bg-blue-50 p-4 rounded text-center text-blue-800">
          <strong>{args.size}</strong> 컨테이너 내부 콘텐츠
        </div>
      </Container>
    </div>
  ),
}

/** Section과 함께 페이지 구획을 나누는 패턴입니다. */
export const WithSection: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="w-full">
      <Section className="bg-afds-gray-100">
        <Container>
          <h2 className="text-2xl font-bold mb-4">첫 번째 섹션</h2>
          <p>기본 수직 여백이 적용됩니다.</p>
        </Container>
      </Section>
      <Section className="bg-white">
        <Container>
          <h2 className="text-2xl font-bold mb-4">두 번째 섹션</h2>
          <p>배경만 다르고 여백은 동일합니다.</p>
        </Container>
      </Section>
    </div>
  ),
}

/** `size="md"` — 블로그·문서처럼 가독성이 중요한 텍스트 콘텐츠에 적합합니다. */
export const BlogPostLayout: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="w-full bg-white">
      <Section className="py-12">
        <Container size="md" className="prose prose-lg mx-auto">
          <h1>레이아웃 프리미티브 이해하기</h1>
          <p>Container를 사용하면 다양한 화면 크기에서 콘텐츠를 일관되게 정렬할 수 있습니다.</p>
        </Container>
      </Section>
    </div>
  ),
}

/** `size="2xl"` — 대시보드나 넓은 공간이 필요한 UI에 적합합니다. */
export const DashboardShell: Story = {
  parameters: { controls: { disable: true }, layout: 'fullscreen' },
  render: () => (
    <div className="min-h-[300px] bg-afds-gray-100">
      <nav className="bg-white border-b border-afds-gray-200">
        <Container size="2xl" className="h-16 flex items-center justify-between">
          <span className="font-bold text-xl">Dashboard</span>
          <div className="flex gap-4">
            <span className="text-sm text-afds-gray-500">Overview</span>
            <span className="text-sm text-afds-gray-500">Settings</span>
          </div>
        </Container>
      </nav>
      <Container size="2xl" className="py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="bg-white p-6 rounded-lg shadow-sm border border-afds-gray-100 h-32"
            >
              Widget {i}
            </div>
          ))}
        </div>
      </Container>
    </div>
  ),
}
