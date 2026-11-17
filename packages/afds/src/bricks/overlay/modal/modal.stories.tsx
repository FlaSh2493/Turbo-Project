import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Modal } from '@turbo-project/afds/bricks'
import { Button } from '@turbo-project/afds/bricks'
import { Select } from '@turbo-project/afds/bricks'
import { modal } from '@turbo-project/afds/headless'

const argTypes = {
  size: {
    control: { type: 'select' as const },
    options: ['sm', 'md', 'lg', 'xl'],
    description: '모달 너비를 결정합니다. Content·Body에 Context로 전파됩니다.',
    table: {
      type: { summary: "'sm' | 'md' | 'lg' | 'xl'" },
      defaultValue: { summary: "'sm'" },
      category: 'Modal.Root',
    },
  },
}

const meta = {
  title: 'AFDS / Bricks / Overlay / Modal',
  component: Modal.Root,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `사용자 확인·폼 입력·정보 표시를 위한 Compound Component 패턴의 대화 상자입니다.

**Import:**
\`\`\`tsx
import { Modal, ModalContainer } from '@turbo-project/afds/bricks'
import { modal } from '@turbo-project/afds/headless'
\`\`\`

### 기본 사용법

앱 루트에 \`ModalContainer\`를 한 번 등록한다.

\`\`\`tsx
// App.tsx
<ModalContainer />
\`\`\`

\`modal.open\`으로 어디서나 모달을 연다.

\`\`\`tsx
modal.open(({ isOpen, close }) => (
  <Modal.Root open={isOpen} onOpenChange={o => !o && close()} size="md">
    <Modal.Portal>
      <Modal.Overlay />
      <Modal.Content>
        <Modal.Header><Modal.Title>제목</Modal.Title></Modal.Header>
        <Modal.Body>내용</Modal.Body>
        <Modal.Footer>
          <Button variant="ghost" onClick={close}>취소</Button>
          <Button onClick={close}>확인</Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal.Portal>
  </Modal.Root>
))
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes,
} satisfies Meta<typeof Modal.Root>

export default meta
type Story = StoryObj<typeof meta>

// Basic

/** Controls 패널에서 size를 직접 조작할 수 있습니다. */
export const Default: Story = {
  args: { size: 'sm' },
  render: (args: React.ComponentProps<typeof Modal.Root>) => {
    const handleOpen = () => {
      modal.open(({ isOpen, close }) => (
        <Modal.Root {...args} open={isOpen} onOpenChange={o => !o && close()}>
          <Modal.Portal>
            <Modal.Overlay />
            <Modal.Content>
              <Modal.Header>
                <Modal.Title>기본 모달</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <p className="body2 text-afds-gray-700">modal.open을 사용한 기본 모달입니다.</p>
              </Modal.Body>
              <Modal.Footer>
                <Button size="lg" variant="ghost" onClick={close}>
                  취소
                </Button>
                <Button size="lg" onClick={close}>
                  확인
                </Button>
              </Modal.Footer>
            </Modal.Content>
          </Modal.Portal>
        </Modal.Root>
      ))
    }

    return (
      <Button size="lg" onClick={handleOpen}>
        Open Modal
      </Button>
    )
  },
}

// Size

/** size별 모달 너비(360 / 640 / 840 / 1280px)를 비교합니다. */
export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const sizes = [
      { size: 'sm' as const, label: 'Small', width: 360 },
      { size: 'md' as const, label: 'Medium', width: 640 },
      { size: 'lg' as const, label: 'Large', width: 840 },
      { size: 'xl' as const, label: 'XLarge', width: 1280 },
    ]

    return (
      <div className="flex gap-2">
        {sizes.map(({ size, label, width }) => (
          <Button
            key={size}
            size="lg"
            onClick={() =>
              modal.open(({ isOpen, close }) => (
                <Modal.Root open={isOpen} onOpenChange={o => !o && close()} size={size}>
                  <Modal.Portal>
                    <Modal.Overlay />
                    <Modal.Content>
                      <Modal.Header>
                        <Modal.Title>{label} Modal</Modal.Title>
                      </Modal.Header>
                      <Modal.Body>
                        <p className="body2 text-afds-gray-500">width: {width}px</p>
                      </Modal.Body>
                      <Modal.Footer>
                        <Button size="lg" onClick={close}>
                          확인
                        </Button>
                      </Modal.Footer>
                    </Modal.Content>
                  </Modal.Portal>
                </Modal.Root>
              ))
            }
          >
            {label} ({width}px)
          </Button>
        ))}
      </div>
    )
  },
}

// Pattern

/**
 * `modal.open`으로 모달을 여는 **권장 패턴**입니다.
 * 앱 루트에 `ModalContainer`를 **한 번** 등록해야 동작합니다.
 *
 * ```tsx
 * // 앱 루트
 * <ModalContainer />
 *
 * // 어디서나
 * modal.open(({ isOpen, close }) => (
 *   <Modal.Root open={isOpen} onOpenChange={o => !o && close()}>
 *     <Modal.Portal>
 *       <Modal.Overlay />
 *       <Modal.Content>...</Modal.Content>
 *     </Modal.Portal>
 *   </Modal.Root>
 * ))
 * ```
 */
export const ProgrammaticOpen: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const handleOpen = () => {
      modal.open(({ isOpen, close }) => (
        <Modal.Root open={isOpen} onOpenChange={o => !o && close()} size="sm">
          <Modal.Portal>
            <Modal.Overlay />
            <Modal.Content>
              <Modal.Header>
                <Modal.Title>modal.open 패턴</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <p className="body2 text-afds-gray-700">modal.open을 사용한 권장 패턴입니다.</p>
              </Modal.Body>
              <Modal.Footer>
                <Button size="lg" variant="ghost" onClick={close}>
                  취소
                </Button>
                <Button size="lg" onClick={close}>
                  확인
                </Button>
              </Modal.Footer>
            </Modal.Content>
          </Modal.Portal>
        </Modal.Root>
      ))
    }

    return (
      <Button size="lg" onClick={handleOpen}>
        modal.open()으로 열기
      </Button>
    )
  },
}

/** 본문이 길면 Body 내부가 자동으로 스크롤됩니다. */
export const WithScrollableContent: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const handleOpen = () => {
      modal.open(({ isOpen, close }) => (
        <Modal.Root open={isOpen} onOpenChange={o => !o && close()} size="md">
          <Modal.Portal>
            <Modal.Overlay />
            <Modal.Content>
              <Modal.Header>
                <Modal.Title>스크롤 콘텐츠</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <div className="space-y-4">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <p key={i} className="body2 text-afds-gray-700">
                      {i + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                    </p>
                  ))}
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button size="lg" variant="ghost" onClick={close}>
                  취소
                </Button>
                <Button size="lg" onClick={close}>
                  확인
                </Button>
              </Modal.Footer>
            </Modal.Content>
          </Modal.Portal>
        </Modal.Root>
      ))
    }

    return (
      <Button size="lg" onClick={handleOpen}>
        긴 콘텐츠 모달
      </Button>
    )
  },
}

/**
 * **모달 안에서 연 드롭다운은 모달 DOM 안에 머문다** (upstream #675).
 *
 * 이 스토리는 **사람이 눈으로 확인할 수 있는 유일한 경로**다. jsdom 은 레이아웃을 계산하지
 * 않으므로 DOM 위치 단정만으로는 "드롭다운이 제대로 보이는가" 를 말할 수 없다.
 * 특히 `Modal.Content` 는 `position: fixed` + `translate(-50%, -50%)` 라 자손의 containing
 * block 이 된다 — `Menu.Positioner` 의 기본 `positionMethod: 'absolute'` 가 이 안에서
 * 어떻게 배치되는지는 실제 렌더로만 확인된다.
 *
 * 소비처는 이것이 없어서 모달 안에서 `Select` 을 포기하고 `relative`+`absolute` 목록에
 * 바깥클릭·ARIA 를 손으로 붙여 썼다.
 */
export const SelectInsideModal: Story = {
  args: { size: 'md' },
  render: function SelectInModalStory(args) {
    return (
      <Modal.Root open size={args.size}>
        <Modal.Portal>
          <Modal.Overlay />
          <Modal.Content>
            <Modal.Header>
              <Modal.Title>모달 안 드롭다운</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Select defaultValue="roas">
                <Select.Trigger placeholder="지표 선택" />
                <Select.Content>
                  <Select.List>
                    <Select.Item value="roas">ROAS</Select.Item>
                    <Select.Item value="cpc">CPC</Select.Item>
                    <Select.Item value="ctr">CTR</Select.Item>
                  </Select.List>
                </Select.Content>
              </Select>
            </Modal.Body>
          </Modal.Content>
        </Modal.Portal>
      </Modal.Root>
    )
  },
}
