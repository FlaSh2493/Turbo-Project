import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { expect, userEvent, within } from '@storybook/test'
import { AlertModal } from '.'
import { Button } from '@turbo-project/afds/bricks'

/**
 *
 * 확인 버튼만 있는 단순 알림 모달입니다.
 * 오류 알림, 정보 표시, 성공 메시지 등에 사용합니다.
 *
 * ### 기본 사용법
 * ```tsx
 * import { AlertModal } from '.'
 *
 * <AlertModal
 *   open={open}
 *   onOpenChange={setOpen}
 *   title="알림"
 *   message="작업이 완료되었습니다."
 *   onConfirm={handleConfirm}
 * />
 * ```
 *
 * ### 언제 사용하나요?
 * - 오류 메시지 표시
 * - 중요 안내 사항
 * - 작업 완료 알림
 *
 * ### NegativeModal과의 차이
 * - `AlertModal`: 확인 버튼만 (단순 알림)
 * - `NegativeModal`: 취소 + 확인 버튼 (위험한 동작 확인)
 *
 * ### 베스트 프랙티스
 * - 취소가 필요 없는 일방적 알림에 사용하세요
 * - `message`에 `\n`으로 줄바꿈이 가능합니다 (whitespace-pre-line 적용)
 */
const meta = {
  title: 'Compositions / Common / Overlay / AlertModal',
  component: AlertModal,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
확인 버튼만 있는 단순 알림 모달입니다.

**Import:**
\`\`\`tsx
import { AlertModal } from '.'
\`\`\`

### 기본 사용법
\`\`\`tsx
<AlertModal open={open} onOpenChange={setOpen} title="알림" message="작업이 완료되었습니다." onConfirm={handleConfirm} />
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  args: {
    open: false,
    onOpenChange: () => {},
    title: '알림',
    message: '메시지 내용입니다.',
  },
} satisfies Meta<typeof AlertModal>

export default meta
type Story = StoryObj<typeof meta>

/** 버튼을 클릭해 알림 모달을 열어보세요. */
export const Default: Story = {
  render: function DefaultAlertModal() {
    const [open, setOpen] = React.useState(false)
    return (
      <div>
        <Button onClick={() => setOpen(true)}>알림 모달 열기</Button>
        <AlertModal
          open={open}
          onOpenChange={setOpen}
          title="알림"
          message="작업이 성공적으로 완료되었습니다."
          onConfirm={() => setOpen(false)}
        />
      </div>
    )
  },
}

/** 여러 줄 메시지를 가진 알림 모달입니다. */
export const MultilineMessage: Story = {
  render: function MultilineAlertModal() {
    const [open, setOpen] = React.useState(false)
    return (
      <div>
        <Button onClick={() => setOpen(true)}>여러 줄 메시지</Button>
        <AlertModal
          open={open}
          onOpenChange={setOpen}
          title="처리 완료"
          message={'총 5개의 항목이 처리되었습니다.\n처리 내역은 이메일로 발송됩니다.'}
        />
      </div>
    )
  },
}

/** 에러 알림 모달입니다. */
export const ErrorAlert: Story = {
  render: function ErrorAlertModal() {
    const [open, setOpen] = React.useState(false)
    return (
      <div>
        <Button variant="primary-line" onClick={() => setOpen(true)}>
          에러 알림 열기
        </Button>
        <AlertModal
          open={open}
          onOpenChange={setOpen}
          title="오류 발생"
          message="요청을 처리하는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."
        />
      </div>
    )
  },
}

// Interaction Test Stories

export const OpenAndConfirmInteraction: Story = {
  render: function InteractionModal() {
    const [open, setOpen] = React.useState(false)
    const [confirmed, setConfirmed] = React.useState(false)
    return (
      <div>
        <Button onClick={() => setOpen(true)} aria-label="모달 열기">
          모달 열기
        </Button>
        {confirmed && <span data-testid="confirmed">확인됨</span>}
        <AlertModal
          open={open}
          onOpenChange={setOpen}
          title="확인"
          message="계속하시겠습니까?"
          confirmText="확인"
          onConfirm={() => {
            setConfirmed(true)
            setOpen(false)
          }}
        />
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const openButton = canvas.getByRole('button', { name: '모달 열기' })

    await userEvent.click(openButton)

    const confirmButton = await within(document.body).findByRole('button', { name: /확인/ })
    await expect(confirmButton).toBeInTheDocument()

    await userEvent.click(confirmButton)
    const confirmed = await canvas.findByTestId('confirmed')
    await expect(confirmed).toBeInTheDocument()
  },
}
