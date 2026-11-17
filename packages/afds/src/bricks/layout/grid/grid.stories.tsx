import type { Meta, StoryObj } from '@storybook/react'
import { Grid } from '@turbo-project/afds/bricks'
import { Box, Flex } from '@turbo-project/afds/bricks'
import { PRIMITIVE_SPACING_VALUES } from '../../../schemas/tokens.schema'

const SPACING_TOKEN_SUMMARY = PRIMITIVE_SPACING_VALUES.map(t => `'${t}'`).join(' | ')

const argTypes = {
  gap: {
    control: { type: 'select' as const },
    options: PRIMITIVE_SPACING_VALUES,
    description: '행·열 모두 동일한 간격 (spacing token)',
    table: { type: { summary: SPACING_TOKEN_SUMMARY } },
  },
  gapX: {
    control: { type: 'select' as const },
    options: PRIMITIVE_SPACING_VALUES,
    description: '열 방향 간격만 지정 (spacing token)',
    table: { type: { summary: SPACING_TOKEN_SUMMARY } },
  },
  gapY: {
    control: { type: 'select' as const },
    options: PRIMITIVE_SPACING_VALUES,
    description: '행 방향 간격만 지정 (spacing token)',
    table: { type: { summary: SPACING_TOKEN_SUMMARY } },
  },
  flow: {
    control: { type: 'select' as const },
    options: ['row', 'col', 'row-dense', 'col-dense'],
    description: '자동 배치 알고리즘 (`grid-auto-flow`)',
    table: {
      type: { summary: "'row' | 'col' | 'row-dense' | 'col-dense'" },
      defaultValue: { summary: 'row' },
    },
  },
  align: {
    control: { type: 'select' as const },
    options: ['start', 'center', 'end', 'stretch'],
    description: '셀 수직 정렬 (`align-items`)',
    table: { type: { summary: "'start' | 'center' | 'end' | 'stretch'" } },
  },
  justify: {
    control: { type: 'select' as const },
    options: ['start', 'center', 'end', 'between', 'around', 'evenly'],
    description: '셀 수평 정렬 (`justify-content`)',
    table: {
      type: { summary: "'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'" },
    },
  },
}

const meta = {
  title: 'AFDS / Bricks / Layout / Grid',
  component: Grid,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
CSS Grid 레이아웃을 위한 React 래퍼 컴포넌트입니다.

**Import:**
\`\`\`tsx
import { Grid } from '@turbo-project/afds/bricks'
\`\`\`

### 기본 사용법
\`\`\`tsx
<Grid columns={3} gap="spacing-4">
  <div>1</div>
  <div>2</div>
  <div>3</div>
</Grid>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes,
  args: {
    columns: 3,
    gap: 'spacing-4',
    flow: 'row',
  },
} satisfies Meta<typeof Grid>

export default meta
type Story = StoryObj<typeof meta>

const Cell = ({ label }: { label: string }) => (
  <Box className="flex items-center justify-center h-16 rounded-afds-sm border border-afds-gray-200 bg-afds-gray-0 text-afds-gray-500 text-sm font-medium">
    {label}
  </Box>
)

/** 기본 Grid입니다. Controls 패널에서 `columns`, `gap`, `align`, `justify` 등을 직접 조작할 수 있습니다. */
export const Default: Story = {
  render: args => (
    <Grid {...args} className="w-full max-w-[640px]">
      {Array.from({ length: 6 }, (_, i) => (
        <Cell key={i} label={`셀 ${i + 1}`} />
      ))}
    </Grid>
  ),
}

/** `columns`에 CSS `grid-template-columns` 문자열을 전달하면 비균등 레이아웃을 구성할 수 있습니다. */
export const CustomColumns: Story = {
  args: {
    columns: '200px 1fr',
    gap: 'spacing-4',
  },
  render: args => (
    <Grid {...args} className="w-full max-w-[640px] h-[280px]">
      <Box className="bg-afds-gray-100 border-r border-afds-gray-200 p-4 flex flex-col gap-2">
        <span className="text-afds-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">
          사이드바
        </span>
        {['개요', '분석', '설정'].map(item => (
          <Box
            key={item}
            className="px-3 py-2 rounded-afds-sm text-sm text-afds-gray-700 hover:bg-afds-brand-500 cursor-pointer"
          >
            {item}
          </Box>
        ))}
      </Box>
      <Box className="p-4 flex items-center justify-center text-afds-gray-500 text-sm">
        메인 콘텐츠 영역
      </Box>
    </Grid>
  ),
}

/** `align` prop으로 높이가 다른 셀들의 수직 정렬을 제어하는 예시입니다. */
export const AlignVariants: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Flex direction="column" gap="spacing-8" className="w-full max-w-[500px]">
      <Flex direction="column" gap="spacing-8">
        <span className="text-afds-gray-500 text-xs font-semibold uppercase tracking-wider">
          align=&quot;start&quot;
        </span>
        <Grid
          columns={3}
          gap="spacing-4"
          align="start"
          className="border border-dashed border-afds-gray-200 rounded-afds-sm p-2"
        >
          <Cell label="A" />
          <Box className="h-24 rounded-afds-sm border border-afds-gray-200 bg-afds-gray-0 flex items-center justify-center text-afds-gray-500 text-sm">
            B
          </Box>
          <Cell label="C" />
        </Grid>
      </Flex>

      <Flex direction="column" gap="spacing-8">
        <span className="text-afds-gray-500 text-xs font-semibold uppercase tracking-wider">
          align=&quot;center&quot;
        </span>
        <Grid
          columns={3}
          gap="spacing-4"
          align="center"
          className="border border-dashed border-afds-gray-200 rounded-afds-sm p-2"
        >
          <Cell label="A" />
          <Box className="h-24 rounded-afds-sm border border-afds-gray-200 bg-afds-gray-0 flex items-center justify-center text-afds-gray-500 text-sm">
            B
          </Box>
          <Cell label="C" />
        </Grid>
      </Flex>

      <Flex direction="column" gap="spacing-8">
        <span className="text-afds-gray-500 text-xs font-semibold uppercase tracking-wider">
          align=&quot;end&quot;
        </span>
        <Grid
          columns={3}
          gap="spacing-4"
          align="end"
          className="border border-dashed border-afds-gray-200 rounded-afds-sm p-2"
        >
          <Cell label="A" />
          <Box className="h-24 rounded-afds-sm border border-afds-gray-200 bg-afds-gray-0 flex items-center justify-center text-afds-gray-500 text-sm">
            B
          </Box>
          <Cell label="C" />
        </Grid>
      </Flex>
    </Flex>
  ),
}

/** `gap`, `gapX`, `gapY`를 개별 지정하여 행·열 간격을 다르게 설정하는 예시입니다. */
export const GapControl: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Flex direction="column" gap="spacing-8" className="w-full max-w-[500px]">
      <Flex direction="column" gap="spacing-8">
        <span className="text-afds-gray-500 text-xs font-semibold uppercase tracking-wider">
          gap=&quot;4&quot; (행·열 동일)
        </span>
        <Grid columns={3} gap="spacing-4">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <Cell key={n} label={String(n)} />
          ))}
        </Grid>
      </Flex>

      <Flex direction="column" gap="spacing-8">
        <span className="text-afds-gray-500 text-xs font-semibold uppercase tracking-wider">
          gapX=&quot;8&quot; gapY=&quot;4&quot; (열·행 별도)
        </span>
        <Grid columns={3} gapX="spacing-8" gapY="spacing-4">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <Cell key={n} label={String(n)} />
          ))}
        </Grid>
      </Flex>
    </Flex>
  ),
}
