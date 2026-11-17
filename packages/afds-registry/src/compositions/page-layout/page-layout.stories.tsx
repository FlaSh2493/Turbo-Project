import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { expect, within } from '@storybook/test'
import { PageLayout } from '.'
import { Button } from '@turbo-project/afds/bricks'

/**
 *
 * 표준 페이지 레이아웃 컴포넌트입니다.
 * Header와 Contents(그리드 레이아웃)로 구성된 컴파운드 컴포넌트입니다.
 *
 * ### 기본 사용법
 * ```tsx
 * import { PageLayout } from '.'
 *
 * <PageLayout>
 *   <PageLayout.Header>
 *     <PageLayout.Header.Title>페이지 제목</PageLayout.Header.Title>
 *   </PageLayout.Header>
 *   <PageLayout.Contents cols={2} gap="spacing-14">
 *     <PageLayout.Contents.Section>섹션 A</PageLayout.Contents.Section>
 *     <PageLayout.Contents.Section>섹션 B</PageLayout.Contents.Section>
 *   </PageLayout.Contents>
 * </PageLayout>
 * ```
 *
 * ### 구조
 * ```tsx
 * <PageLayout>
 *   <PageLayout.Header>
 *     <PageLayout.Header.Title>페이지 제목</PageLayout.Header.Title>
 *     <PageLayout.Header.Actions>
 *       <Button>액션</Button>
 *     </PageLayout.Header.Actions>
 *   </PageLayout.Header>
 *
 *   <PageLayout.Contents cols={2} gap="spacing-14">
 *     <PageLayout.Contents.Section colSpan={1}>섹션 1</PageLayout.Contents.Section>
 *     <PageLayout.Contents.Section colSpan={1}>섹션 2</PageLayout.Contents.Section>
 *   </PageLayout.Contents>
 * </PageLayout>
 * ```
 *
 * ### Contents props
 * - `cols`: 그리드 컬럼 수 (1~12)
 * - `rows`: 그리드 행 수 (1~6, 선택)
 * - `gap`: 간격 (Tailwind gap scale, 기본값: 4)
 * - `width`: 콘텐츠 폭 유형 — `fluid`(기본, 최대폭 없음) · `bounded`(최대 1340px 중앙) · `narrow`(660px 고정 중앙)
 *
 * ### Section props
 * - `colSpan`: 차지할 컬럼 수 (1~12, 기본값: 1)
 * - `rowSpan`: 차지할 행 수 (1~6, 기본값: 1)
 */
const meta = {
  title: 'Compositions / Common / Layout / PageLayout',
  component: PageLayout,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
표준 페이지 레이아웃 컴포넌트입니다. Header와 그리드 기반 Contents로 구성됩니다.

**Import:**
\`\`\`tsx
import { PageLayout } from '.'
\`\`\`

### 기본 사용법
\`\`\`tsx
<PageLayout>
  <PageLayout.Header>
    <PageLayout.Header.Title>페이지 제목</PageLayout.Header.Title>
    <PageLayout.Header.Actions>
      <Button>새로 만들기</Button>
    </PageLayout.Header.Actions>
  </PageLayout.Header>
  <PageLayout.Contents cols={2} gap="spacing-14">
    <PageLayout.Contents.Section>섹션 A</PageLayout.Contents.Section>
    <PageLayout.Contents.Section>섹션 B</PageLayout.Contents.Section>
  </PageLayout.Contents>
</PageLayout>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  args: {
    children: null,
  },
} satisfies Meta<typeof PageLayout>

export default meta
type Story = StoryObj<typeof meta>

const sectionClassName =
  'bg-afds-bg-surface-sunken border border-afds-border-default rounded-afds-md p-afds-spacing-14 min-h-[120px]'
const sectionClassNameTall =
  'bg-afds-bg-surface-sunken border border-afds-border-default rounded-afds-md p-afds-spacing-14 min-h-[200px]'

/** 기본 페이지 레이아웃입니다. */
export const Default: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <PageLayout>
      <PageLayout.Header>
        <PageLayout.Header.Title>페이지 제목</PageLayout.Header.Title>
        <PageLayout.Header.Actions>
          <Button variant="primary-line" size="sm">
            내보내기
          </Button>
          <Button size="sm">새로 만들기</Button>
        </PageLayout.Header.Actions>
      </PageLayout.Header>

      <PageLayout.Contents cols={2} gap="spacing-14">
        <PageLayout.Contents.Section>
          <div className={sectionClassName}>섹션 A</div>
        </PageLayout.Contents.Section>
        <PageLayout.Contents.Section>
          <div className={sectionClassName}>섹션 B</div>
        </PageLayout.Contents.Section>
      </PageLayout.Contents>
    </PageLayout>
  ),
}

/** 3컬럼 레이아웃입니다. */
export const ThreeColumns: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <PageLayout>
      <PageLayout.Header>
        <PageLayout.Header.Title>3컬럼 레이아웃</PageLayout.Header.Title>
      </PageLayout.Header>

      <PageLayout.Contents cols={3} gap="spacing-14">
        {['섹션 1', '섹션 2', '섹션 3'].map(s => (
          <PageLayout.Contents.Section key={s}>
            <div className={sectionClassName}>{s}</div>
          </PageLayout.Contents.Section>
        ))}
      </PageLayout.Contents>
    </PageLayout>
  ),
}

/** colSpan을 사용한 불균등 레이아웃입니다. */
export const UnequalColumns: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <PageLayout>
      <PageLayout.Header>
        <PageLayout.Header.Title>불균등 레이아웃</PageLayout.Header.Title>
      </PageLayout.Header>

      <PageLayout.Contents cols={3} gap="spacing-14">
        <PageLayout.Contents.Section colSpan={2}>
          <div className={sectionClassNameTall}>넓은 섹션 (colSpan=2)</div>
        </PageLayout.Contents.Section>
        <PageLayout.Contents.Section colSpan={1}>
          <div className={sectionClassNameTall}>좁은 섹션 (colSpan=1)</div>
        </PageLayout.Contents.Section>
      </PageLayout.Contents>
    </PageLayout>
  ),
}

/** 액션 없는 헤더입니다. */
export const HeaderOnly: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <PageLayout>
      <PageLayout.Header>
        <PageLayout.Header.Title>액션 없는 헤더</PageLayout.Header.Title>
      </PageLayout.Header>
      <PageLayout.Contents cols={1} gap="spacing-14">
        <PageLayout.Contents.Section>
          <div className={sectionClassName}>콘텐츠 영역</div>
        </PageLayout.Contents.Section>
      </PageLayout.Contents>
    </PageLayout>
  ),
}

/** 콘텐츠 폭 `fluid`(기본) — 최대폭이 없고 영역을 채웁니다. 최소 924px. */
export const WidthFluid: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <PageLayout>
      <PageLayout.Header>
        <PageLayout.Header.Title>fluid</PageLayout.Header.Title>
      </PageLayout.Header>
      <PageLayout.Contents cols={1} width="fluid">
        <PageLayout.Contents.Section>
          <div className={sectionClassName}>콘텐츠 영역: 가용 폭을 채움</div>
        </PageLayout.Contents.Section>
      </PageLayout.Contents>
    </PageLayout>
  ),
}

/** 콘텐츠 폭 `bounded` — 최대 1340px 로 제한하고 가운데 정렬합니다. */
export const WidthBounded: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <PageLayout>
      <PageLayout.Header>
        <PageLayout.Header.Title>bounded</PageLayout.Header.Title>
      </PageLayout.Header>
      <PageLayout.Contents cols={1} width="bounded">
        <PageLayout.Contents.Section>
          <div className={sectionClassName}>콘텐츠 영역: 최대 1340px</div>
        </PageLayout.Contents.Section>
      </PageLayout.Contents>
    </PageLayout>
  ),
}

/** 콘텐츠 폭 `narrow` — 660px 로 고정하고 가운데 정렬합니다. */
export const WidthNarrow: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <PageLayout>
      <PageLayout.Header>
        <PageLayout.Header.Title>narrow</PageLayout.Header.Title>
      </PageLayout.Header>
      <PageLayout.Contents cols={1} width="narrow">
        <PageLayout.Contents.Section>
          <div className={sectionClassName}>콘텐츠 영역: 660px 고정</div>
        </PageLayout.Contents.Section>
      </PageLayout.Contents>
    </PageLayout>
  ),
}

// Interaction Test Stories

export const RenderTest: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <PageLayout>
      <PageLayout.Header>
        <PageLayout.Header.Title>테스트 페이지</PageLayout.Header.Title>
      </PageLayout.Header>
      <PageLayout.Contents cols={1}>
        <PageLayout.Contents.Section>
          <div data-testid="content">콘텐츠</div>
        </PageLayout.Contents.Section>
      </PageLayout.Contents>
    </PageLayout>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('테스트 페이지')).toBeInTheDocument()
    await expect(canvas.getByTestId('content')).toBeInTheDocument()
  },
}
