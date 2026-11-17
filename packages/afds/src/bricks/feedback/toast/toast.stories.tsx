import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Toaster } from '@turbo-project/afds/bricks'
import { Button } from '@turbo-project/afds/bricks'
import { toast, type ToastOptions } from '@turbo-project/afds/headless'
import { CheckIcon, XIcon } from 'lucide-react'

/**
 *
 * 비침습적(non-intrusive) 알림 메시지를 표시하는 컴포넌트입니다.
 *
 *
 * ### 설정 방법
 *
 * **1. Toaster 배치 (앱 루트에 1회):**
 * ```tsx
 * import { Toaster } from '@FlaSh2493/turbo-project-design'
 *
 * export default function RootLayout({ contents }) {
 *   return (
 *     <html>
 *       <body>
 *         {contents}
 *         <Toaster />
 *       </body>
 *     </html>
 *   )
 * }
 * ```
 *
 * **2. toast.add() — 토스트 호출 (어디서나):**
 * ```tsx
 * import { toast } from '@FlaSh2493/turbo-project-design'
 *
 * toast.add({ content: '저장되었습니다.' })
 * toast.add({ content: '2초 후 사라집니다.', duration: 2000 })
 * toast.add({ content: '선택은 최대 30개입니다.', closable: true })
 * ```
 */

type ToastStoryArgs = React.ComponentProps<typeof Toaster> & ToastOptions

const meta = {
  title: 'AFDS / Bricks / Feedback / Toast',
  component: Toaster,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Toast는 비침습적 알림 메시지 컴포넌트입니다.

**Import:**

\`\`\`tsx
import { Toaster } from '@turbo-project/afds/bricks'
import { toast, useToast } from '@turbo-project/afds/headless'
\`\`\`

### 기본 사용법
\`\`\`tsx
// 1. 앱 루트에 Toaster 배치 (1회)
<Toaster />

// 2. 어디서나 toast.add()로 호출
toast.add({ content: '저장되었습니다.' })
\`\`\`

---

### toast.add() — 토스트 호출

React 컴포넌트 내·외부 어디서나 호출 가능합니다.

\`\`\`tsx
import { toast } from '@turbo-project/afds/headless'

// 기본 메시지 (아이콘 + 텍스트, 자동 사라짐)
toast.add({ content: '저장되었습니다.' })

// duration 지정
toast.add({ content: '2초 후 사라집니다.', duration: 2000 })

// 닫기 버튼 (closable: true이면 자동 삭제 없음)
toast.add({ content: '선택은 최대 30개입니다.', closable: true })
\`\`\`

`,
      },
    },
  },
  tags: ['autodocs'],
  args: {
    content: '저장되었습니다.',
    closable: false,
  },
  decorators: [
    Story => (
      <div className="min-h-[400px] p-afds-spacing-20">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<ToastStoryArgs>

export default meta
type Story = StoryObj<ToastStoryArgs>

// Default — Controls 패널에서 직접 조작

/** Controls 패널에서 `toast.add()` 옵션을 직접 조작해 보세요. */
export const Default: Story = {
  render: ({ content, duration, closable, showIcon, offsetY }) => {
    const Component = () => (
      <div className="flex flex-col gap-[12px]">
        <Button onClick={() => toast.add({ content, duration, closable, showIcon })}>
          토스트 띄우기
        </Button>
        <Toaster offsetY={offsetY} />
      </div>
    )
    return <Component />
  },
}

// Type 1: Icon + Text

/** 사용자 액션 피드백의 기본 패턴입니다. 아이콘이 자동으로 붙으며 일정 시간 후 사라집니다. */
export const Type1IconText: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const Component = () => (
      <div className="flex flex-col gap-[12px]">
        <h3 className="m-0 text-sm font-bold">Type 1: Icon + Text</h3>
        <p className="m-0 text-xs text-afds-text-secondary">
          사용자의 행동에 대한 결과 피드백은 아이콘 + 텍스트로 표현한다.
        </p>
        <div className="flex gap-afds-spacing-8">
          <Button onClick={() => toast.add({ content: '매체가 삭제 되었습니다.' })}>
            짧은 메시지
          </Button>
          <Button
            variant="primary-line"
            onClick={() =>
              toast.add({
                content: '총 xx개의 값이 변경되었습니다. 총 xx개의 값이 변경되었습니다.',
              })
            }
          >
            긴 메시지
          </Button>
        </div>
      </div>
    )
    return <Component />
  },
}

// Type 2: Text + Close

/** `closable: true`로 닫기 버튼을 활성화합니다. 사용자가 직접 닫기 전까지 유지됩니다. */
export const Type2TextClose: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const Component = () => (
      <div className="flex flex-col gap-[12px]">
        <h3 className="m-0 text-sm font-bold">Type 2: Text + Close</h3>
        <p className="m-0 text-xs text-afds-text-secondary">
          사용자가 직접 닫기 전까지 유지됩니다.
        </p>
        <div className="flex gap-afds-spacing-8">
          <Button
            onClick={() =>
              toast.add({ content: '선택은 최대 30개만 선택할 수 있습니다.', closable: true })
            }
          >
            짧은 메시지
          </Button>
          <Button
            variant="primary-line"
            onClick={() =>
              toast.add({
                content:
                  '전체 선택은 최대 100개만 선택할 수 있습니다. 나머지는 하나씩 선택해주세요.',
                closable: true,
              })
            }
          >
            긴 메시지
          </Button>
        </div>
      </div>
    )
    return <Component />
  },
}

// Long Text

/** `line-clamp-2` 동작을 확인합니다. 2줄을 초과하는 텍스트는 잘립니다. */
export const LongText: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const Component = () => (
      <div className="flex flex-col gap-[12px]">
        <h3 className="m-0 text-sm font-bold">긴 텍스트</h3>
        <p className="m-0 text-xs text-afds-text-secondary">
          최대 2줄까지 표시되며 초과분은 잘립니다.
        </p>
        <div className="flex gap-afds-spacing-8">
          <Button
            onClick={() =>
              toast.add({
                content:
                  '총 127개의 소재 데이터가 성공적으로 업로드되었습니다. 일부 소재는 심사 중이며 승인 완료 후 자동으로 캠페인에 반영됩니다.',
              })
            }
          >
            자동 닫힘
          </Button>
          <Button
            variant="primary-line"
            onClick={() =>
              toast.add({
                content:
                  '총 127개의 소재 데이터가 성공적으로 업로드되었습니다. 일부 소재는 심사 중이며 승인 완료 후 자동으로 캠페인에 반영됩니다.',
                closable: true,
              })
            }
          >
            닫기 버튼 포함
          </Button>
        </div>
        <Toaster />
      </div>
    )
    return <Component />
  },
}

// Composition (Icon + Divider + Action Button)

const successIcon = (
  <CheckIcon size={16} className="h-4 w-4 text-afds-extra-ui-positive" strokeWidth={3} />
)
const divider = <div className="self-stretch w-px bg-afds-divider-default" />
const descCls = 'min-w-[140px] whitespace-pre-wrap break-words text-sm text-afds-text-inverse'

/** `toast.add()`의 `content`에 plain DOM을 직접 주입해 레이아웃을 조합하는 패턴입니다. */
export const WithComposition: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-afds-spacing-14">
      <h3 className="m-0 text-sm font-bold">조합 패턴</h3>

      {/* 아이콘 + 텍스트 */}
      <div className="flex flex-col gap-[4px]">
        <p className="m-0 text-xs text-afds-text-secondary">아이콘 + 텍스트</p>
        <div className="flex items-center justify-between rounded-xl bg-afds-bg-black p-afds-spacing-20">
          <div className="flex items-center gap-2.5">
            {successIcon}
            <div className={descCls}>저장되었습니다.</div>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() =>
            toast.add({
              content: (
                <div className="flex items-center gap-2.5">
                  {successIcon}
                  <div className={descCls}>저장되었습니다.</div>
                </div>
              ),
            })
          }
        >
          띄우기
        </Button>
      </div>

      {/* 아이콘 + 텍스트 + 디바이더 + 액션 버튼 */}
      <div className="flex flex-col gap-[4px]">
        <p className="m-0 text-xs text-afds-text-secondary">아이콘 + 텍스트 + 디바이더 + 버튼</p>
        <div className="flex items-center justify-between rounded-xl bg-afds-bg-black p-afds-spacing-20">
          <div className="flex items-center gap-2.5">
            {successIcon}
            <div className={descCls}>성공적으로 처리되었습니다.</div>
          </div>
          {divider}
          <button className="cursor-pointer px-afds-spacing-14 text-sm text-afds-text-inverse outline-none">
            실행 취소
          </button>
        </div>
        <Button
          size="sm"
          onClick={() =>
            toast.add({
              content: (
                <>
                  <div className="flex items-center gap-2.5">
                    {successIcon}
                    <div className={descCls}>성공적으로 처리되었습니다.</div>
                  </div>
                  {divider}
                  <button className="cursor-pointer px-afds-spacing-14 text-sm text-afds-text-inverse outline-none">
                    실행 취소
                  </button>
                </>
              ),
            })
          }
        >
          띄우기
        </Button>
      </div>

      {/* 텍스트 + 닫기 버튼 */}
      <div className="flex flex-col gap-[4px]">
        <p className="m-0 text-xs text-afds-text-secondary">텍스트 + 닫기 버튼</p>
        <div className="flex items-center justify-between rounded-xl bg-afds-bg-black p-afds-spacing-20">
          <div className="flex items-center gap-2.5">
            <div className={descCls}>선택은 최대 30개만 선택할 수 있습니다.</div>
          </div>
          <button
            aria-label="toast-close"
            className="ml-2.5 flex h-fit w-fit cursor-pointer items-center justify-center text-afds-text-secondary outline-none"
          >
            <XIcon size={16} className="h-[16px] w-[16px]" strokeWidth={2} />
          </button>
        </div>
        <Button
          size="sm"
          onClick={() =>
            toast.add({
              closable: true,
              content: <div className={descCls}>선택은 최대 30개만 선택할 수 있습니다.</div>,
            })
          }
        >
          띄우기
        </Button>
      </div>

      {/* 텍스트 + 디바이더 + 버튼 2개 */}
      <div className="flex flex-col gap-[4px]">
        <p className="m-0 text-xs text-afds-text-secondary">텍스트 + 디바이더 + 버튼 2개</p>
        <div className="flex items-center justify-between rounded-xl bg-afds-bg-black p-afds-spacing-20">
          <div className="flex items-center gap-2.5">
            <div className={descCls}>캠페인이 일시정지되었습니다.</div>
          </div>
          {divider}
          <button className="cursor-pointer px-afds-spacing-14 text-sm text-afds-text-inverse outline-none">
            닫기
          </button>
          {divider}
          <button className="cursor-pointer px-afds-spacing-14 text-sm text-afds-text-inverse outline-none">
            재시작
          </button>
        </div>
        <Button
          size="sm"
          onClick={() =>
            toast.add({
              closable: true,
              content: (
                <>
                  <div className={descCls}>캠페인이 일시정지되었습니다.</div>
                  {divider}
                  <button className="cursor-pointer px-afds-spacing-14 text-sm text-afds-text-inverse outline-none">
                    닫기
                  </button>
                  {divider}
                  <button className="cursor-pointer px-afds-spacing-14 text-sm text-afds-text-inverse outline-none">
                    재시작
                  </button>
                </>
              ),
            })
          }
        >
          띄우기
        </Button>
      </div>

      <Toaster />
    </div>
  ),
}

// Multiple / Duration

/** 여러 토스트가 동시에 쌓이는 패턴입니다. 아래부터 최신 순으로 10px 간격으로 쌓입니다. */
export const MultipleToasts: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const Component = () => (
      <div className="flex flex-col gap-[12px]">
        <h3 className="m-0 text-sm font-bold">여러 토스트</h3>
        <div className="flex gap-afds-spacing-8">
          <Button
            onClick={() => {
              toast.add({ content: '첫 번째 토스트' })
              setTimeout(() => toast.add({ content: '두 번째 토스트' }), 100)
              setTimeout(() => toast.add({ content: '세 번째 토스트' }), 200)
            }}
          >
            3개 띄우기
          </Button>
          <Button
            variant="primary-line"
            onClick={() => {
              toast.add({ content: '임시저장이 되었습니다.' })
              setTimeout(() => toast.add({ content: '총 xx개의 값이 변경되었습니다.' }), 100)
              setTimeout(() => toast.add({ content: '데이터 통합이 완료되었습니다.' }), 200)
            }}
          >
            Figma 예시
          </Button>
        </div>
      </div>
    )
    return <Component />
  },
}

/** `duration` 옵션으로 표시 시간을 조절합니다. `closable: true`이면 자동 삭제 없이 사용자가 직접 닫아야 합니다. */
export const CustomDuration: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const Component = () => (
      <div className="flex flex-col gap-[12px]">
        <h3 className="m-0 text-sm font-bold">커스텀 Duration</h3>
        <div className="flex gap-afds-spacing-8">
          <Button onClick={() => toast.add({ content: '2초 후 사라집니다', duration: 2000 })}>
            2초
          </Button>
          <Button
            variant="primary-line"
            onClick={() => toast.add({ content: '사라지지 않습니다', closable: true })}
          >
            무한 (닫기 버튼 필요)
          </Button>
        </div>
      </div>
    )
    return <Component />
  },
}

// Full Demo

// Scoped Toasters (Multiple Toasters)

/**
 * 여러 Toaster가 렌더될 때, 트리 안쪽(자식)에 마운트된 Toaster가 활성화됩니다.
 *
 * React의 useEffect는 자식이 부모보다 먼저 실행되기 때문에,
 * 가장 안쪽에 위치한 Toaster가 store에 먼저 등록되어 활성 상태를 가져갑니다.
 *
 * 패널이 열려있는 동안은 offsetY=200 Toaster가 활성화되고,
 * 패널을 닫으면 기본 offsetY=40 Toaster가 활성화됩니다.
 */
export const ScopedToasters: Story = {
  parameters: { controls: { disable: true } },
  render: function ScopedToastersExample() {
    const [panelOpen, setPanelOpen] = useState(true)
    const activeLabel = panelOpen ? 'Panel Toaster (offsetY: 200)' : 'Main Toaster (offsetY: 40)'

    return (
      <div className="flex flex-col gap-[12px] min-h-[500px]">
        <div className="px-3 py-afds-spacing-8 rounded-md bg-afds-bg-surface-sunken text-xs">
          활성 Toaster:{' '}
          <span
            className={`font-bold ${panelOpen ? 'text-afds-text-brand' : 'text-afds-extra-ui-green'}`}
          >
            {activeLabel}
          </span>
        </div>

        {panelOpen && (
          <div className="p-afds-spacing-14 rounded-afds-md border-2 border-afds-border-brand-subtle">
            <p className="m-0 mb-afds-8 text-xs font-bold text-afds-text-brand">
              패널 영역 — Toaster offsetY: 200
            </p>
            <Button
              size="sm"
              onClick={() => toast.add({ content: '패널 토스트입니다. (하단 200px)' })}
            >
              패널에서 토스트
            </Button>
            <Toaster offsetY={200} />
          </div>
        )}

        <div className="flex gap-afds-spacing-8">
          <Button
            variant={panelOpen ? 'primary-line' : 'fill'}
            onClick={() => setPanelOpen(v => !v)}
          >
            패널 {panelOpen ? '닫기' : '열기'}
          </Button>
          <Button onClick={() => toast.add({ content: '메인 토스트입니다. (하단 40px)' })}>
            메인에서 토스트
          </Button>
        </div>

        {/* 메인 Toaster: 패널이 닫히면 활성화됨 */}
        <Toaster offsetY={40} />
      </div>
    )
  },
}

// Full Demo

// Full Demo

/** 모든 타입을 한 화면에서 비교합니다. */
export const FullDemo: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const Component = () => (
      <div className="flex flex-col gap-afds-spacing-24 p-afds-spacing-20">
        <div>
          <h2 className="m-0 mb-afds-16 text-lg">Toast 컴포넌트</h2>
          <p className="m-0 text-sm text-afds-text-secondary">
            화면 중앙 하단, 하단에서 40px 위에 위치합니다.
            <br />
            여러 개가 뜨는 경우 세로 10px 간격으로 아래부터 쌓입니다.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-afds-24">
          <div className="p-afds-spacing-14 border border-afds-border-default rounded-afds-md">
            <h3 className="m-0 mb-afds-8 text-sm">Type 1: Icon + Text</h3>
            <p className="m-0 mb-3 text-xs text-afds-text-secondary">일정 시간 후 자동 사라짐</p>
            <Button size="sm" onClick={() => toast.add({ content: '저장되었습니다.' })}>
              토스트 띄우기
            </Button>
          </div>
          <div className="p-afds-spacing-14 border border-afds-border-default rounded-afds-md">
            <h3 className="m-0 mb-afds-8 text-sm">Type 2: Text + Close</h3>
            <p className="m-0 mb-3 text-xs text-afds-text-secondary">닫기 버튼으로 직접 닫기</p>
            <Button
              size="sm"
              onClick={() =>
                toast.add({
                  content: '선택은 최대 30개만 선택할 수 있습니다.',
                  closable: true,
                })
              }
            >
              토스트 띄우기
            </Button>
          </div>
        </div>
      </div>
    )
    return <Component />
  },
}
