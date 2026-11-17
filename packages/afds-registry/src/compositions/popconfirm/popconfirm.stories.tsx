import type { Meta, StoryObj } from '@storybook/react'
import { PopConfirm, type PopConfirmProps } from '.'
import { Button } from '@turbo-project/afds/bricks'
import { useState } from 'react'

const meta = {
  title: 'Compositions / Common / Overlay / PopConfirm',
  component: PopConfirm,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `버튼 주변에 확인/취소 팝오버를 표시하는 인라인 확인 컴포넌트입니다. 삭제·적용 등 짧은 확인이 필요할 때 Modal보다 가볍게 사용합니다.

**Import:**
\`\`\`tsx
import { PopConfirm } from '.'
\`\`\`

### 기본 사용법
\`\`\`tsx
<PopConfirm title="정말 삭제하시겠습니까?" onConfirm={() => handleDelete()}>
  <Button variant="primary-line">삭제</Button>
</PopConfirm>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PopConfirm>

export default meta
type Story = StoryObj<PopConfirmProps>

// Basic Stories
export const Default: Story = {
  args: {
    title: '정말 삭제하시겠습니까?',
    children: <Button variant="primary-line">삭제</Button>,
  },
}

export const WithCustomText: Story = {
  args: {
    title: '이 항목을 삭제하시겠습니까?',
    confirmText: '확인',
    cancelText: '취소',
    children: <Button variant="primary-line">삭제</Button>,
  },
}

export const WithoutArrow: Story = {
  args: {
    title: '정말 삭제하시겠습니까?',
    showArrow: false,
    children: <Button variant="primary-line">삭제</Button>,
  },
}

// Position Stories
export const SideAndAlign: Story = {
  args: {
    title: '정말 삭제하시겠습니까?',
    side: 'right',
    align: 'start',
    children: <Button variant="primary-line">Right Start</Button>,
  },
}

// All Combinations Grid
export const AllCombinations: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const sides = ['top', 'bottom', 'left', 'right'] as const
    const aligns = ['start', 'center', 'end'] as const

    return (
      <div className="grid grid-cols-3 gap-x-[80px] gap-y-[60px] p-[100px] place-items-center w-[600px]">
        {sides.map(side =>
          aligns.map(align => (
            <PopConfirm
              key={`${side}-${align}`}
              title={`${side} ${align}`}
              side={side}
              align={align}
            >
              <Button variant="primary-line">
                {side} / {align}
              </Button>
            </PopConfirm>
          )),
        )}
      </div>
    )
  },
}

// Controlled Mode
export const Controlled: Story = {
  parameters: { controls: { disable: true } },
  render: function ControlledExample() {
    const [open, setOpen] = useState(false)

    return (
      <div className="flex flex-col gap-afds-spacing-14 items-center">
        <div className="flex gap-afds-spacing-8">
          <Button variant="primary-line" onClick={() => setOpen(true)}>
            열기
          </Button>
          <Button variant="primary-line" onClick={() => setOpen(false)}>
            닫기
          </Button>
        </div>
        <PopConfirm
          title="정말 삭제하시겠습니까?"
          open={open}
          onOpenChange={setOpen}
          onConfirm={() => {
            console.log('확인됨')
          }}
          onCancel={() => {
            console.log('취소됨')
          }}
        >
          <Button variant="primary-line">삭제</Button>
        </PopConfirm>
        <p>현재 상태: {open ? '열림' : '닫힘'}</p>
      </div>
    )
  },
}

// Async Confirm
export const AsyncConfirm: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const handleConfirm = async () => {
      // 2초 대기 (API 호출 시뮬레이션)
      await new Promise(resolve => setTimeout(resolve, 2000))
      console.log('삭제 완료!')
    }

    return (
      <PopConfirm title="정말 삭제하시겠습니까?" onConfirm={handleConfirm} loadingText="삭제 중...">
        <Button variant="primary-line">삭제 (비동기)</Button>
      </PopConfirm>
    )
  },
}

// Async Confirm with Error
export const AsyncConfirmWithError: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const handleConfirm = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      throw new Error('삭제 실패!')
    }

    return (
      <PopConfirm
        title="삭제 시 에러가 발생합니다"
        onConfirm={handleConfirm}
        loadingText="삭제 중..."
      >
        <Button variant="primary-line">삭제 (에러 발생)</Button>
      </PopConfirm>
    )
  },
}

// With Callbacks
export const WithCallbacks: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    return (
      <PopConfirm
        title="정말 삭제하시겠습니까?"
        onConfirm={() => {
          alert('확인 버튼이 클릭되었습니다!')
        }}
        onCancel={() => {
          alert('취소 버튼이 클릭되었습니다!')
        }}
        onOpenChange={open => {
          console.log('열림 상태 변경:', open)
        }}
      >
        <Button variant="primary-line">삭제</Button>
      </PopConfirm>
    )
  },
}

// Custom Title with ReactNode
export const CustomTitle: Story = {
  args: {
    title: (
      <div className="flex flex-col gap-[4px]">
        <strong className="text-afds-extra-ui-red">⚠️ 경고</strong>
        <span>이 작업은 되돌릴 수 없습니다.</span>
      </div>
    ),
    children: <Button variant="primary-line">삭제</Button>,
  },
}

// Disabled Buttons
export const DisabledConfirm: Story = {
  args: {
    title: '확인 버튼이 비활성화되어 있습니다',
    confirmDisabled: true,
    children: <Button variant="primary-line">삭제</Button>,
  },
}

export const DisabledCancel: Story = {
  args: {
    title: '취소 버튼이 비활성화되어 있습니다',
    cancelDisabled: true,
    children: <Button variant="primary-line">삭제</Button>,
  },
}
