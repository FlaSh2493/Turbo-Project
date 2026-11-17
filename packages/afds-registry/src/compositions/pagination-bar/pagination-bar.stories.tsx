import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { PaginationBar } from './pagination-bar'

/**
 *
 * `Pagination`을 한 줄 레이아웃으로 감싼 컴포지션입니다.
 * 좌측에는 총 개수(`total`)가 표시되고 중앙에는 페이지네이션 컨트롤이 위치합니다.
 *
 * **Import:**
 * ```tsx
 * import { PaginationBar } from '.'
 * ```
 *
 * ### 기본 사용법
 * ```tsx
 * <PaginationBar
 *   total={123}
 *   currentPage={page}
 *   totalPages={20}
 *   onPageChange={setPage}
 * />
 * ```
 *
 * ### 베스트 프랙티스
 * - `total`은 서버에서 받은 전체 레코드 수를 그대로 전달합니다.
 * - 총합 표기 포맷이 다를 경우 `totalFormatter`로 커스터마이즈합니다.
 */

const meta = {
  title: 'Compositions / Common / Navigation / PaginationBar',
  component: PaginationBar,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  args: {
    total: 123,
    currentPage: 1,
    totalPages: 20,
    onPageChange: () => {},
  },
} satisfies Meta<typeof PaginationBar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** 외부 state로 페이지를 제어하는 controlled 모드입니다. */
export const Controlled: Story = {
  parameters: { controls: { disable: true } },
  render: function ControlledPaginationBar() {
    const [page, setPage] = useState(1)
    return (
      <div className="flex flex-col gap-afds-spacing-14">
        <PaginationBar total={123} currentPage={page} totalPages={20} onPageChange={setPage} />
        <span className="text-afds-12 text-afds-text-secondary text-center">
          현재 페이지: {page} / 20
        </span>
      </div>
    )
  },
}

/** `pageRange`로 표시할 페이지 버튼 개수를 좁힌 예시입니다. */
export const NarrowRange: Story = {
  parameters: { controls: { disable: true } },
  render: function NarrowPaginationBar() {
    const [page, setPage] = useState(5)
    return (
      <PaginationBar
        total={500}
        currentPage={page}
        totalPages={50}
        onPageChange={setPage}
        pageRange={3}
      />
    )
  },
}

/** `totalFormatter`로 총합 표기 포맷을 변경한 예시입니다. */
export const CustomTotalFormatter: Story = {
  parameters: { controls: { disable: true } },
  render: function CustomFormatterPaginationBar() {
    const [page, setPage] = useState(1)
    return (
      <PaginationBar
        total={1234}
        currentPage={page}
        totalPages={20}
        onPageChange={setPage}
        totalFormatter={total => `총 ${total.toLocaleString()}건`}
      />
    )
  },
}

/** 페이지가 적을 때 (`···` 생략 없음) 예시입니다. */
export const FewPages: Story = {
  parameters: { controls: { disable: true } },
  render: function FewPagesPaginationBar() {
    const [page, setPage] = useState(1)
    return <PaginationBar total={42} currentPage={page} totalPages={5} onPageChange={setPage} />
  },
}
