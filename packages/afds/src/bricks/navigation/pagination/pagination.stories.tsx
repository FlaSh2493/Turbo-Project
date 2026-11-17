import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { expect, userEvent, within } from '@storybook/test'
import { Pagination } from '@turbo-project/afds/bricks'
import type { PaginationItemDescriptor } from '@turbo-project/afds/headless'

/**
 *
 * 헤드리스 훅 + 컴파운드 컴포넌트로 분리된 페이지네이션입니다.
 * 이전/다음 버튼, 페이지 번호, 생략 부호(···)를 자유롭게 조합합니다.
 *
 * ### 사용 모드
 *
 * **Simple (uncontrolled)** — `defaultPage`만 전달, 내부에서 상태 관리
 * ```tsx
 * <Pagination.Root defaultPage={1} totalPages={20} onPageChange={setPage}>...</Pagination.Root>
 * ```
 *
 * **Controlled** — `currentPage` + `onPageChange`로 외부에서 상태 관리
 * ```tsx
 * <Pagination.Root currentPage={page} totalPages={20} onPageChange={setPage}>...</Pagination.Root>
 * ```
 *
 * **Advanced (hook spread)** — `usePagination` 결과를 spread로 주입
 * ```tsx
 * const props = usePagination({ currentPage, totalPages, onPageChange })
 * <Pagination.Root {...props}>...</Pagination.Root>
 * ```
 *
 * ### pageRange
 * 한 번에 표시할 페이지 버튼 개수입니다 (기본값: 5).
 * 페이지가 많으면 `···`으로 생략됩니다.
 *
 * ### 베스트 프랙티스
 * - 서버 사이드 페이지네이션과 함께 사용합니다
 * - `totalPages`가 1이면 숨기거나 비활성화하세요
 * - 완전 커스텀 UI 가 필요하면 `usePagination` 훅을 직접 사용합니다
 */

const meta: Meta<typeof Pagination.Root> = {
  title: 'AFDS / Bricks / Navigation / Pagination',
  component: Pagination.Root,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
헤드리스 훅 + 컴파운드 페이지네이션입니다. 페이지 번호 버튼과 이전/다음 버튼을 자유롭게 조합합니다.

**Import:**
\`\`\`tsx
import { Pagination } from '@turbo-project/afds/bricks'
import { usePagination } from '@turbo-project/afds/headless'
\`\`\`

### Simple (uncontrolled)
\`\`\`tsx
<Pagination.Root defaultPage={1} totalPages={20} onPageChange={setPage}>...</Pagination.Root>
\`\`\`

### Controlled
\`\`\`tsx
<Pagination.Root currentPage={page} totalPages={20} onPageChange={setPage}>
  <Pagination.PrevTrigger />
  <Pagination.List>
    <Pagination.Items
      render={item =>
        item.type === 'page' ? (
          <Pagination.Item key={item.value} value={item.value} />
        ) : (
          <Pagination.Ellipsis key={\`e-\${item.index}\`} />
        )
      }
    />
  </Pagination.List>
  <Pagination.NextTrigger />
</Pagination.Root>
\`\`\`

### Advanced (hook spread)
\`\`\`tsx
const props = usePagination({ currentPage, totalPages, onPageChange })
<Pagination.Root {...props}>...</Pagination.Root>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Pagination.Root>

const renderItems = (item: PaginationItemDescriptor) =>
  item.type === 'page' ? (
    <Pagination.Item key={item.value} value={item.value} />
  ) : (
    <Pagination.Ellipsis key={`e-${item.index}`} />
  )

// Basic Stories

/** `defaultPage`만 전달하는 uncontrolled 모드입니다. 내부에서 상태를 관리합니다. */
export const Uncontrolled: Story = {
  render: function UncontrolledPagination() {
    return (
      <Pagination.Root defaultPage={1} totalPages={20}>
        <Pagination.PrevTrigger />
        <Pagination.List>
          <Pagination.Items render={renderItems} />
        </Pagination.List>
        <Pagination.NextTrigger />
      </Pagination.Root>
    )
  },
}

/** 기본 페이지네이션입니다. */
export const Default: Story = {
  render: function DefaultPagination() {
    const [page, setPage] = React.useState(1)
    return (
      <div className="flex flex-col gap-afds-spacing-14 items-center">
        <Pagination.Root currentPage={page} totalPages={20} onPageChange={setPage}>
          <Pagination.PrevTrigger />
          <Pagination.List>
            <Pagination.Items render={renderItems} />
          </Pagination.List>
          <Pagination.NextTrigger />
        </Pagination.Root>
        <span className="text-afds-12 text-afds-text-secondary">현재 페이지: {page} / 20</span>
      </div>
    )
  },
}

/** 페이지 중간에 위치한 경우 `···`이 양쪽에 표시됩니다. */
export const MiddlePage: Story = {
  render: function MiddlePagination() {
    const [page, setPage] = React.useState(10)
    return (
      <Pagination.Root currentPage={page} totalPages={20} onPageChange={setPage}>
        <Pagination.PrevTrigger />
        <Pagination.List>
          <Pagination.Items render={renderItems} />
        </Pagination.List>
        <Pagination.NextTrigger />
      </Pagination.Root>
    )
  },
}

/** 마지막 페이지입니다. 다음 버튼이 비활성화됩니다. */
export const LastPage: Story = {
  render: function LastPagination() {
    const [page, setPage] = React.useState(20)
    return (
      <Pagination.Root currentPage={page} totalPages={20} onPageChange={setPage}>
        <Pagination.PrevTrigger />
        <Pagination.List>
          <Pagination.Items render={renderItems} />
        </Pagination.List>
        <Pagination.NextTrigger />
      </Pagination.Root>
    )
  },
}

/** 페이지가 적을 때 `···`이 표시되지 않습니다. */
export const FewPages: Story = {
  render: function FewPagination() {
    const [page, setPage] = React.useState(1)
    return (
      <Pagination.Root currentPage={page} totalPages={5} onPageChange={setPage}>
        <Pagination.PrevTrigger />
        <Pagination.List>
          <Pagination.Items render={renderItems} />
        </Pagination.List>
        <Pagination.NextTrigger />
      </Pagination.Root>
    )
  },
}

/** 더 좁은 pageRange 예시입니다. */
export const NarrowRange: Story = {
  render: function NarrowPagination() {
    const [page, setPage] = React.useState(5)
    return (
      <Pagination.Root currentPage={page} totalPages={20} onPageChange={setPage} pageRange={3}>
        <Pagination.PrevTrigger />
        <Pagination.List>
          <Pagination.Items render={renderItems} />
        </Pagination.List>
        <Pagination.NextTrigger />
      </Pagination.Root>
    )
  },
}

/** 아이콘 대신 라벨 텍스트를 사용한 변형입니다. */
export const TextTriggers: Story = {
  render: function TextTriggersPagination() {
    const [page, setPage] = React.useState(5)
    return (
      <Pagination.Root currentPage={page} totalPages={20} onPageChange={setPage}>
        <Pagination.PrevTrigger className="w-auto px-3">이전</Pagination.PrevTrigger>
        <Pagination.List>
          <Pagination.Items render={renderItems} />
        </Pagination.List>
        <Pagination.NextTrigger className="w-auto px-3">다음</Pagination.NextTrigger>
      </Pagination.Root>
    )
  },
}

// Interaction Test Stories

/** 페이지 변경 인터랙션 테스트 */
export const NavigationInteraction: Story = {
  render: function NavigationPagination() {
    const [page, setPage] = React.useState(1)
    return (
      <div>
        <Pagination.Root currentPage={page} totalPages={10} onPageChange={setPage}>
          <Pagination.PrevTrigger />
          <Pagination.List>
            <Pagination.Items render={renderItems} />
          </Pagination.List>
          <Pagination.NextTrigger />
        </Pagination.Root>
        <div data-testid="current-page" className="text-afds-12 text-center mt-[8px]">
          {page}
        </div>
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const nextButton = canvas.getByRole('button', { name: 'Next page' })
    const currentPage = canvas.getByTestId('current-page')

    await expect(currentPage).toHaveTextContent('1')
    await userEvent.click(nextButton)
    await expect(currentPage).toHaveTextContent('2')
    await userEvent.click(nextButton)
    await expect(currentPage).toHaveTextContent('3')
  },
}
