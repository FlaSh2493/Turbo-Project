import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { expect, userEvent, waitFor, within, fn } from '@storybook/test'
import { NegativeModal } from '.'
import { Button } from '@turbo-project/afds/bricks'

/**
 *
 * 취소/확인 버튼이 있는 위험한 동작 확인 모달입니다.
 * 삭제, 탈퇴, 취소 등 되돌릴 수 없는 동작 전 사용자 확인을 받습니다.
 *
 * ### 기본 사용법
 * ```tsx
 * import { NegativeModal } from '.'
 *
 * <NegativeModal
 *   open={open}
 *   onOpenChange={setOpen}
 *   title="항목 삭제"
 *   message="이 항목을 삭제하시겠습니까?"
 *   onConfirm={handleDelete}
 * />
 * ```
 *
 * ### 언제 사용하나요?
 * - 데이터 삭제 확인
 * - 계정 탈퇴
 * - 작업 취소 (저장되지 않은 변경사항 있을 때)
 *
 * ### AlertModal과의 차이
 * - `AlertModal`: 확인 버튼만 (단순 알림)
 * - `NegativeModal`: 취소 + 확인(위험) 버튼 (되돌릴 수 없는 동작 확인)
 *
 * ### 베스트 프랙티스
 * - 확인 버튼은 빨간색으로 표시되어 위험성을 나타냅니다
 * - `message`에 `ReactNode`를 전달할 수 있어 강조 텍스트 등을 사용할 수 있습니다
 */
const meta = {
  title: 'Compositions / Common / Overlay / NegativeModal',
  component: NegativeModal,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
취소/확인 버튼이 있는 위험한 동작 확인 모달입니다. 삭제, 탈퇴 등 되돌릴 수 없는 동작에 사용합니다.

**Import:**
\`\`\`tsx
import { NegativeModal } from '.'
\`\`\`

### 기본 사용법
\`\`\`tsx
<NegativeModal open={open} onOpenChange={setOpen} title="항목 삭제" message="이 항목을 삭제하시겠습니까?" onConfirm={handleDelete} />
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  args: {
    open: false,
    onOpenChange: () => {},
    onConfirm: () => {},
    title: '삭제 확인',
    message: '정말 삭제하시겠습니까?',
  },
} satisfies Meta<typeof NegativeModal>

export default meta
type Story = StoryObj<typeof meta>

/** 기본 삭제 확인 모달입니다. */
export const Default: Story = {
  render: function DefaultNegativeModal() {
    const [open, setOpen] = React.useState(false)
    const [deleted, setDeleted] = React.useState(false)
    return (
      <div className="flex flex-col gap-afds-spacing-14 items-center">
        <Button
          variant="primary-line"
          onClick={() => {
            setOpen(true)
            setDeleted(false)
          }}
        >
          삭제 확인 모달 열기
        </Button>
        {deleted && <span className="text-afds-text-error text-sm">삭제 확인됨</span>}
        <NegativeModal
          open={open}
          onOpenChange={setOpen}
          title="항목 삭제"
          message="이 항목을 삭제하시겠습니까? 삭제된 데이터는 복구할 수 없습니다."
          onConfirm={() => setDeleted(true)}
        />
      </div>
    )
  },
}

/** ReactNode 메시지를 사용하는 예시입니다. */
export const WithReactNodeMessage: Story = {
  render: function ReactNodeModal() {
    const [open, setOpen] = React.useState(false)
    return (
      <div>
        <Button variant="primary-line" onClick={() => setOpen(true)}>
          계정 탈퇴
        </Button>
        <NegativeModal
          open={open}
          onOpenChange={setOpen}
          title="계정을 탈퇴하시겠습니까?"
          message={
            <span>
              탈퇴 시 모든 데이터가 <strong>영구적으로 삭제</strong>됩니다.{'\n'}이 작업은 되돌릴 수
              없습니다.
            </span>
          }
          confirmText="탈퇴하기"
          onConfirm={() => setOpen(false)}
        />
      </div>
    )
  },
}

// Interaction Test Stories

export const CancelInteraction: Story = {
  render: function CancelModal() {
    const [open, setOpen] = React.useState(false)
    const onConfirm = fn()
    return (
      <div>
        <Button onClick={() => setOpen(true)} aria-label="모달 열기">
          열기
        </Button>
        <NegativeModal
          open={open}
          onOpenChange={setOpen}
          title="삭제 확인"
          message="정말 삭제하시겠습니까?"
          cancelText="취소"
          onConfirm={onConfirm}
        />
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: '모달 열기' }))

    const cancelButton = await within(document.body).findByRole('button', { name: /취소/ })
    await expect(cancelButton).toBeInTheDocument()

    await userEvent.click(cancelButton)
    await waitFor(() =>
      expect(within(document.body).queryByRole('button', { name: /취소/ })).not.toBeInTheDocument(),
    )
  },
}
