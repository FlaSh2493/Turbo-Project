/**
 *
 * 스타일 없는 순수 HTML 테이블 래퍼입니다.
 * `className`을 통해 외부에서 자유롭게 스타일을 주입할 수 있습니다.
 *
 *
 * ### 기본 사용법
 * ```tsx
 * <Table.Root className="w-full border-collapse">
 *   <Table.Header>
 *     <Table.Row>
 *       <Table.Head className="border p-2">컬럼</Table.Head>
 *     </Table.Row>
 *   </Table.Header>
 *   <Table.Body>
 *     <Table.Row>
 *       <Table.Cell className="border p-2">값</Table.Cell>
 *     </Table.Row>
 *   </Table.Body>
 * </Table.Root>
 * ```
 *
 * ### 언제 사용하나요?
 * - 커스텀 테이블 레이아웃을 처음부터 만들 때
 * - `BaseTable` 없이 가벼운 테이블 구조가 필요할 때
 */

import type { Meta, StoryObj } from '@storybook/react'
import { Table } from '@turbo-project/afds/bricks'

const meta = {
  title: 'AFDS / Bricks / Display / Table',
  component: Table.Root,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `스타일 없는 순수 HTML 테이블 래퍼 컴포넌트입니다. className을 통해 외부에서 스타일을 주입합니다.

**Import:**
\`\`\`tsx
import { Table } from '@turbo-project/afds/bricks'
\`\`\`

### 기본 사용법
\`\`\`tsx
<Table.Root className="w-full border-collapse">
  <Table.Header>
    <Table.Row>
      <Table.Head className="border p-2">이름</Table.Head>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    <Table.Row>
      <Table.Cell className="border p-2">홍길동</Table.Cell>
    </Table.Row>
  </Table.Body>
</Table.Root>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Table.Root>

export default meta
type Story = StoryObj<typeof meta>

// Basic Stories

/** 기본 테이블 구조입니다. 스타일은 className으로 주입합니다. */
export const Default: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Table.Root className="border-collapse w-[400px]">
      <Table.Header>
        <Table.Row>
          <Table.Head className="border border-afds-border-strong px-3 py-afds-spacing-8 bg-afds-bg-surface-sunken">
            이름
          </Table.Head>
          <Table.Head className="border border-afds-border-strong px-3 py-afds-spacing-8 bg-afds-bg-surface-sunken">
            이메일
          </Table.Head>
          <Table.Head className="border border-afds-border-strong px-3 py-afds-spacing-8 bg-afds-bg-surface-sunken">
            역할
          </Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        <Table.Row>
          <Table.Cell className="border border-afds-border-strong px-3 py-afds-spacing-8">
            홍길동
          </Table.Cell>
          <Table.Cell className="border border-afds-border-strong px-3 py-afds-spacing-8">
            hong@example.com
          </Table.Cell>
          <Table.Cell className="border border-afds-border-strong px-3 py-afds-spacing-8">
            관리자
          </Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell className="border border-afds-border-strong px-3 py-afds-spacing-8">
            김철수
          </Table.Cell>
          <Table.Cell className="border border-afds-border-strong px-3 py-afds-spacing-8">
            kim@example.com
          </Table.Cell>
          <Table.Cell className="border border-afds-border-strong px-3 py-afds-spacing-8">
            사용자
          </Table.Cell>
        </Table.Row>
      </Table.Body>
    </Table.Root>
  ),
}

/** sm / md / lg 사이즈 비교입니다. 행 높이가 40 / 60 / 80px로 달라집니다. */
export const AllSizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-8">
      {(['sm', 'md', 'lg'] as const).map(size => (
        <div key={size}>
          <div className="mb-2 text-afds-text-secondary body3">size = {size}</div>
          <Table.Root size={size} aria-label={`size ${size}`}>
            <Table.Header>
              <Table.Row>
                <Table.Head>이름</Table.Head>
                <Table.Head>이메일</Table.Head>
                <Table.Head>역할</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              <Table.Row>
                <Table.Cell>홍길동</Table.Cell>
                <Table.Cell>hong@example.com</Table.Cell>
                <Table.Cell>관리자</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>김철수</Table.Cell>
                <Table.Cell>kim@example.com</Table.Cell>
                <Table.Cell>사용자</Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table.Root>
        </div>
      ))}
    </div>
  ),
}

/** Footer를 포함한 테이블입니다. */
export const WithFooter: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Table.Root className="border-collapse w-[400px]">
      <Table.Header>
        <Table.Row>
          <Table.Head className="border border-afds-border-strong px-3 py-afds-spacing-8 bg-afds-bg-surface-sunken">
            항목
          </Table.Head>
          <Table.Head className="border border-afds-border-strong px-3 py-afds-spacing-8 bg-afds-bg-surface-sunken">
            금액
          </Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        <Table.Row>
          <Table.Cell className="border border-afds-border-strong px-3 py-afds-spacing-8">
            광고비
          </Table.Cell>
          <Table.Cell className="border border-afds-border-strong px-3 py-afds-spacing-8">
            1,000,000원
          </Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell className="border border-afds-border-strong px-3 py-afds-spacing-8">
            운영비
          </Table.Cell>
          <Table.Cell className="border border-afds-border-strong px-3 py-afds-spacing-8">
            500,000원
          </Table.Cell>
        </Table.Row>
      </Table.Body>
      <Table.Footer>
        <Table.Row>
          <Table.Cell className="border border-afds-border-strong px-3 py-afds-spacing-8 font-bold bg-afds-bg-surface-sunken">
            합계
          </Table.Cell>
          <Table.Cell className="border border-afds-border-strong px-3 py-afds-spacing-8 font-bold bg-afds-bg-surface-sunken">
            1,500,000원
          </Table.Cell>
        </Table.Row>
      </Table.Footer>
    </Table.Root>
  ),
}
