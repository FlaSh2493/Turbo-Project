import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { expect, userEvent, within } from '@storybook/test'
import { Drawer } from '@turbo-project/afds/bricks'
import { Button } from '@turbo-project/afds/bricks'
import { Select } from '@turbo-project/afds/bricks'

/**
 *
 * `direction` prop 하나로 side(left/right)와 bottom(down) 드로어를 모두 지원하는 컴포넌트입니다.
 *
 * ## 구조
 * ```tsx
 * <Drawer.Root open={open} onOpenChange={setOpen} direction="right">
 *   <Drawer.Overlay />
 *   <Drawer.Viewport>
 *     <Drawer.Panel>
 *       <Drawer.Header>제목</Drawer.Header>
 *       <Drawer.Content>내용</Drawer.Content>
 *       <Drawer.Footer>푸터</Drawer.Footer>
 *     </Drawer.Panel>
 *   </Drawer.Viewport>
 * </Drawer.Root>
 * ```
 *
 * ## direction별 동작
 * - `right` (기본 side): 오른쪽에서 슬라이드 인, Header에 border-b 자동 적용, 기본 너비 400px
 * - `left`: 왼쪽에서 슬라이드 인, Header에 border-b 자동 적용
 * - `down` (기본 bottom): 하단에서 슬라이드 인
 * - `up`: 상단에서 슬라이드 인
 */
const argTypes = {
  direction: {
    control: { type: 'select' as const },
    options: ['right', 'left', 'down', 'up'],
    description: '드로어가 열리는 방향',
    table: {
      category: 'Drawer.Root',
      type: { summary: "'right' | 'left' | 'down' | 'up'" },
      defaultValue: { summary: "'down'" },
    },
  },
}

const meta = {
  title: 'AFDS / Bricks / Overlay / Drawer',
  component: Drawer.Root,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
side drawer와 bottom drawer를 \`direction\` prop 하나로 통합한 컴포넌트입니다.

**Import:**
\`\`\`tsx
import { Drawer } from '@turbo-project/afds/bricks'
\`\`\`

### 기본 사용법
\`\`\`tsx
<Drawer.Root open={open} onOpenChange={setOpen} direction="right">
  <Drawer.Overlay />
  <Drawer.Viewport>
    <Drawer.Panel>
      <Drawer.Header>제목</Drawer.Header>
      <Drawer.Content>내용</Drawer.Content>
      <Drawer.Footer>
        <Button onClick={() => setOpen(false)}>확인</Button>
      </Drawer.Footer>
    </Drawer.Panel>
  </Drawer.Viewport>
</Drawer.Root>
\`\`\`

**Drawer.Header**: 제목 텍스트와 X 닫기 버튼이 내장된 헤더 컴포넌트.
direction=right/left일 때 border-b가 자동으로 적용됩니다.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes,
  args: {
    open: false,
    onOpenChange: () => {},
    direction: 'right',
    modal: true,
    children: null,
  },
} satisfies Meta<typeof Drawer.Root>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: function DefaultStory() {
    const [open, setOpen] = React.useState(false)
    return (
      <div className="p-6">
        <Button onClick={() => setOpen(true)}>드로어 열기</Button>
        <Drawer.Root open={open} onOpenChange={setOpen} direction="right">
          <Drawer.Overlay />
          <Drawer.Viewport>
            <Drawer.Panel>
              <Drawer.Header>드로어 제목</Drawer.Header>
              <Drawer.Content>
                <p className="text-afds-text-secondary text-sm">드로어 내용입니다.</p>
              </Drawer.Content>
              <Drawer.Footer>
                <Button variant="fill" className="w-full" onClick={() => setOpen(false)}>
                  확인
                </Button>
              </Drawer.Footer>
            </Drawer.Panel>
          </Drawer.Viewport>
        </Drawer.Root>
      </div>
    )
  },
}

/** 오른쪽에서 슬라이드 인되는 사이드 드로어 (구 SideDrawer) */
export const SideDrawer: Story = {
  render: function SideDrawerStory() {
    const [open, setOpen] = React.useState(false)
    return (
      <div className="p-6">
        <Button onClick={() => setOpen(true)}>사이드 드로어 열기</Button>
        <Drawer.Root open={open} onOpenChange={setOpen} direction="right">
          <Drawer.Overlay />
          <Drawer.Viewport>
            <Drawer.Panel>
              <Drawer.Header>사이드 드로어</Drawer.Header>
              <Drawer.Content>
                <p className="text-afds-text-secondary text-sm">
                  사이드 드로어의 내용입니다. 상세 정보, 필터, 편집 폼 등을 여기에 배치합니다.
                </p>
              </Drawer.Content>
              <Drawer.Footer>
                <Button variant="fill" className="w-full">
                  확인
                </Button>
              </Drawer.Footer>
            </Drawer.Panel>
          </Drawer.Viewport>
        </Drawer.Root>
      </div>
    )
  },
}

/** 너비를 커스터마이즈한 사이드 드로어 */
export const WideDrawer: Story = {
  render: function WideDrawerStory() {
    const [open, setOpen] = React.useState(false)
    return (
      <div className="p-6">
        <Button onClick={() => setOpen(true)}>넓은 드로어 열기 (600px)</Button>
        <Drawer.Root open={open} onOpenChange={setOpen} direction="right">
          <Drawer.Overlay />
          <Drawer.Viewport>
            <Drawer.Panel width="600px">
              <Drawer.Header>넓은 사이드 드로어</Drawer.Header>
              <Drawer.Content>
                <p className="text-afds-text-secondary text-sm">
                  더 많은 콘텐츠를 담기 위해 너비를 늘렸습니다.
                </p>
              </Drawer.Content>
            </Drawer.Panel>
          </Drawer.Viewport>
        </Drawer.Root>
      </div>
    )
  },
}

/** 하단에서 슬라이드 인되는 바텀 드로어 (구 BottomDrawer) */
export const BottomDrawer: Story = {
  render: function BottomDrawerStory() {
    const [open, setOpen] = React.useState(false)
    return (
      <div className="p-6 min-h-[400px]">
        <Button onClick={() => setOpen(true)}>바텀 드로어 열기</Button>
        <Drawer.Root open={open} onOpenChange={setOpen} direction="down">
          <Drawer.Overlay />
          <Drawer.Viewport>
            <Drawer.Panel>
              <Drawer.Header>바텀 드로어</Drawer.Header>
              <Drawer.Content>
                <p className="text-afds-text-secondary text-sm">
                  하단에서 올라오는 드로어입니다. 옵션, 필터, 액션 메뉴에 적합합니다.
                </p>
              </Drawer.Content>
              <Drawer.Footer>
                <div className="flex gap-2">
                  <Button variant="fill" className="flex-1">
                    확인
                  </Button>
                  <Button variant="primary-line" className="flex-1" onClick={() => setOpen(false)}>
                    취소
                  </Button>
                </div>
              </Drawer.Footer>
            </Drawer.Panel>
          </Drawer.Viewport>
        </Drawer.Root>
      </div>
    )
  },
}

/** 하단 드로어 — 액션 시트 패턴 (Header 없이 Content만 사용) */
export const ActionSheet: Story = {
  render: function ActionSheetStory() {
    const [open, setOpen] = React.useState(false)
    const [selected, setSelected] = React.useState('')
    const actions = [
      { label: '편집', description: '항목을 편집합니다' },
      { label: '복사', description: '항목을 복사합니다' },
      { label: '공유', description: '항목을 공유합니다' },
    ]
    return (
      <div className="p-6 min-h-[400px]">
        <Button onClick={() => setOpen(true)}>액션 시트 열기</Button>
        {selected && <p className="mt-2 text-sm text-afds-text-secondary">선택됨: {selected}</p>}
        <Drawer.Root open={open} onOpenChange={setOpen} direction="down">
          <Drawer.Overlay />
          <Drawer.Viewport>
            <Drawer.Panel>
              <Drawer.Content>
                {actions.map(act => (
                  <button
                    key={act.label}
                    onClick={() => {
                      setSelected(act.label)
                      setOpen(false)
                    }}
                    className="w-full px-6 py-4 border-b border-afds-divider-default text-left cursor-pointer bg-transparent hover:bg-afds-interaction-hover-overlay"
                  >
                    <div className="font-medium">{act.label}</div>
                    <div className="text-xs text-afds-text-secondary mt-0.5">{act.description}</div>
                  </button>
                ))}
                <button
                  onClick={() => setOpen(false)}
                  className="w-full px-6 py-4 text-afds-text-error font-medium cursor-pointer bg-transparent border-none hover:bg-afds-interaction-hover-overlay"
                >
                  취소
                </button>
              </Drawer.Content>
            </Drawer.Panel>
          </Drawer.Viewport>
        </Drawer.Root>
      </div>
    )
  },
}

// ── Interaction Tests ──────────────────────────────────────────────────────────

export const OpenCloseInteraction: Story = {
  render: function InteractionStory() {
    const [open, setOpen] = React.useState(false)
    return (
      <div className="p-6">
        <Button onClick={() => setOpen(true)} aria-label="드로어 열기">
          드로어 열기
        </Button>
        <Drawer.Root open={open} onOpenChange={setOpen} direction="right">
          <Drawer.Overlay />
          <Drawer.Viewport>
            <Drawer.Panel>
              <Drawer.Header>제목</Drawer.Header>
              <Drawer.Content>
                <p>드로어 내용</p>
              </Drawer.Content>
            </Drawer.Panel>
          </Drawer.Viewport>
        </Drawer.Root>
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: '드로어 열기' }))
    const panel = await within(document.body).findByRole('dialog')
    await expect(panel).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
  },
}

/**
 * **드로어 안에서 연 드롭다운은 드로어 DOM 안에 머문다** (upstream #675).
 *
 * 모달과 같은 이유로 `Drawer.Panel` 이 자기 노드로 포털 컨텍스트를 재공급한다.
 * 여기서 확인할 것: `Drawer.Viewport` 가 `overflow-hidden` 이라 `position: absolute`
 * 드롭다운이 잘리지 않는지 — jsdom 으로는 판정할 수 없다.
 */
export const SelectInsideDrawer: Story = {
  render: function SelectInDrawerStory() {
    return (
      <Drawer.Root open onOpenChange={() => {}} direction="right">
        <Drawer.Viewport>
          <Drawer.Overlay />
          <Drawer.Panel>
            <Drawer.Header>
              <Drawer.Title>드로어 안 드롭다운</Drawer.Title>
            </Drawer.Header>
            <Drawer.Content>
              <Select defaultValue="roas">
                <Select.Trigger placeholder="지표 선택" />
                <Select.Content>
                  <Select.List>
                    <Select.Item value="roas">ROAS</Select.Item>
                    <Select.Item value="cpc">CPC</Select.Item>
                  </Select.List>
                </Select.Content>
              </Select>
            </Drawer.Content>
          </Drawer.Panel>
        </Drawer.Viewport>
      </Drawer.Root>
    )
  },
}
