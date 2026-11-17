import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Popover } from '@turbo-project/afds/bricks'

/**
 * Radix UI Popover를 래핑한 팝오버 컴포넌트입니다.
 * Compound 패턴(Root / Trigger / Content / Arrow / Close)으로 구성됩니다.
 * 확인/취소 다이얼로그가 필요하다면 Organisms의 PopConfirm을 활용하세요.
 */
const meta = {
  title: 'AFDS / Bricks / Overlay / Popover',
  component: Popover.Root,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `Radix UI Popover를 래핑한 팝오버 컴포넌트입니다. Compound 패턴(Root / Trigger / Content / Arrow / Close)으로 구성됩니다.

**Import:**
\`\`\`tsx
import { Popover } from '@turbo-project/afds/bricks'
\`\`\`

### 기본 사용법
\`\`\`tsx
<Popover.Root>
  <Popover.Trigger render={<Button>열기</Button>} />
  <Popover.Content>
    <p>팝오버 내용입니다.</p>
    <Popover.Arrow />
  </Popover.Content>
</Popover.Root>
\`\`\`

**닫기 버튼 포함:**
\`\`\`tsx
<Popover.Root>
  <Popover.Trigger render={<Button>열기</Button>} />
  <Popover.Content>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <strong>제목</strong>
      <Popover.Close>×</Popover.Close>
    </div>
    <p>팝오버 내용입니다.</p>
  </Popover.Content>
</Popover.Root>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  args: { children: null },
} satisfies Meta<typeof Popover.Root>

export default meta
type Story = StoryObj<typeof meta>

// Basic

/** Controls 패널에서 side·align·sideOffset 등 props를 직접 조작해 보세요. */
export const Default: Story = {
  render: (args: any) => {
    const {
      open,
      defaultOpen,
      modal,
      onOpenChange,
      side,
      align,
      sideOffset,
      alignOffset,
      arrowPadding,
      avoidCollisions,
      arrowClassName,
    } = args
    return (
      <Popover.Root open={open} defaultOpen={defaultOpen} modal={modal} onOpenChange={onOpenChange}>
        <Popover.Trigger
          render={
            <button className="px-afds-spacing-14 py-afds-spacing-8 rounded-md border border-afds-border-strong cursor-pointer">
              팝오버 열기
            </button>
          }
        />
        <Popover.Content
          side={side}
          align={align}
          sideOffset={sideOffset}
          alignOffset={alignOffset}
          arrowPadding={arrowPadding}
          avoidCollisions={avoidCollisions}
        >
          <p className="m-0 text-sm">팝오버 내용입니다.</p>
          <Popover.Arrow className={arrowClassName} />
        </Popover.Content>
      </Popover.Root>
    )
  },
}

/** Content 내부에 Popover.Close를 배치하면 클릭 시 팝오버가 닫힙니다. */
export const WithCloseButton: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Popover.Root>
      <Popover.Trigger
        render={
          <button className="px-afds-spacing-14 py-afds-spacing-8 rounded-md border border-afds-border-strong cursor-pointer">
            닫기 버튼 포함
          </button>
        }
      />
      <Popover.Content className="min-w-[160px]">
        <div className="flex justify-between items-center mb-afds-8">
          <strong className="text-sm">제목</strong>
          <Popover.Close>
            <span className="text-lg leading-none">×</span>
          </Popover.Close>
        </div>
        <p className="m-0 text-[13px]">팝오버 내용입니다.</p>
        <Popover.Arrow />
      </Popover.Content>
    </Popover.Root>
  ),
}

// Position

/** side 4방향 × align 3종 조합을 한눈에 확인합니다. */
export const SidesAndAligns: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="grid grid-cols-3 gap-[60px] p-[100px]">
      {(['top', 'bottom', 'left', 'right'] as const).flatMap(side =>
        (['start', 'center', 'end'] as const).map(align => (
          <Popover.Root key={`${side}-${align}`} defaultOpen>
            <Popover.Trigger
              render={
                <button className="px-afds-spacing-10 py-afds-spacing-4 rounded-md border border-afds-border-strong cursor-pointer text-xs">
                  {side} / {align}
                </button>
              }
            />
            <Popover.Content side={side} align={align}>
              <p className="m-0 text-sm">
                {side} · {align}
              </p>
              <Popover.Arrow />
            </Popover.Content>
          </Popover.Root>
        )),
      )}
    </div>
  ),
}

/** open/onOpenChange로 열림 상태를 직접 제어하는 패턴입니다. */
export const Controlled: Story = {
  parameters: { controls: { disable: true } },
  render: function ControlledExample() {
    const [open, setOpen] = React.useState(false)
    return (
      <div className="flex flex-col items-center gap-[12px]">
        <Popover.Root open={open} onOpenChange={setOpen}>
          <Popover.Trigger
            render={
              <button className="px-afds-spacing-14 py-afds-spacing-8 rounded-md border border-afds-border-strong cursor-pointer">
                {open ? '팝오버 닫기' : '팝오버 열기'}
              </button>
            }
          />
          <Popover.Content>
            <p className="m-0 text-sm">controlled 모드 팝오버</p>
            <Popover.Arrow />
          </Popover.Content>
        </Popover.Root>
        <span className="text-xs text-afds-text-disabled">상태: {open ? '열림' : '닫힘'}</span>
      </div>
    )
  },
}
