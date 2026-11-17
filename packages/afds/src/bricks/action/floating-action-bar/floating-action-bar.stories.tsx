import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { expect, userEvent, within } from '@storybook/test'
import { FloatingActionBar } from '@turbo-project/afds/bricks'
import { Button } from '@turbo-project/afds/bricks'

/**
 *
 * 화면 하단에 떠 있는 플로팅 액션 바 컴포넌트입니다.
 * Dim(배경 그라데이션), Card(액션 영역), ClearButton(닫기 버튼)의 3개 명시 슬롯으로 구성합니다.
 *
 * ### 구조
 * ```tsx
 * <FloatingActionBar show={open} onClose={handleClose}>
 *   <FloatingActionBar.Dim />
 *   <FloatingActionBar.Card>
 *     {/* 임의의 children — 카운트/액션 버튼 등 *\/}
 *     <Button size="sm" variant="ghost">일괄 처리</Button>
 *     <FloatingActionBar.ClearButton />
 *   </FloatingActionBar.Card>
 * </FloatingActionBar>
 * ```
 *
 * ### 언제 사용하나요?
 * - 테이블/리스트에서 다중 선택 후 일괄 작업
 * - 체크박스로 항목을 선택한 뒤 나타나는 액션 바
 *
 * ### 베스트 프랙티스
 * - `show` prop으로 노출 여부를 제어합니다
 * - `onClose`로 선택 초기화 콜백을 전달합니다 — `ClearButton`이 자동으로 사용합니다
 * - 진입/퇴장 애니메이션이 자동으로 적용됩니다
 */
const meta = {
  title: 'AFDS / Bricks / Action / FloatingActionBar',
  component: FloatingActionBar,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
화면 하단에 떠 있는 플로팅 액션 바입니다. 다중 선택 시 나타나는 일괄 작업 UI로 사용합니다.

**Import:**
\`\`\`tsx
import { FloatingActionBar } from '@turbo-project/afds/bricks'
\`\`\`

### 기본 사용법
\`\`\`tsx
<FloatingActionBar show={open} onClose={handleClose}>
  <FloatingActionBar.Dim />
  <FloatingActionBar.Card>
    <Button size="sm" variant="ghost">내보내기</Button>
    <FloatingActionBar.ClearButton />
  </FloatingActionBar.Card>
</FloatingActionBar>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  args: {
    show: false,
    children: null,
  },
} satisfies Meta<typeof FloatingActionBar>

export default meta
type Story = StoryObj<typeof meta>

/** 체크박스를 선택하면 플로팅 액션 바가 나타납니다. */
export const Default: Story = {
  render: function DefaultFloatingActionBar() {
    const [selected, setSelected] = React.useState<number[]>([])
    const items = ['항목 1', '항목 2', '항목 3', '항목 4', '항목 5']

    const toggle = (i: number) =>
      setSelected(prev => (prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]))

    return (
      <div className="p-afds-spacing-24 min-h-[400px]">
        <h3 className="mb-3 text-sm font-semibold">항목 선택</h3>
        <div className="flex flex-col gap-afds-spacing-8" style={{ marginBottom: 80 }}>
          {items.map((item, i) => (
            <label
              key={i}
              className={`flex items-center gap-afds-spacing-8 cursor-pointer px-3 py-afds-spacing-8 border border-afds-border-default rounded-md ${selected.includes(i) ? 'bg-afds-bg-selected' : 'bg-afds-bg-surface'}`}
            >
              <input type="checkbox" checked={selected.includes(i)} onChange={() => toggle(i)} />
              {item}
            </label>
          ))}
        </div>

        <FloatingActionBar show={selected.length > 0} onClose={() => setSelected([])}>
          <FloatingActionBar.Dim />
          <FloatingActionBar.Card>
            <Button size="sm" variant="ghost">
              내보내기
            </Button>
            <Button size="sm" variant="ghost">
              복사
            </Button>
            <Button size="sm" variant="ghost">
              삭제
            </Button>
            <FloatingActionBar.ClearButton />
          </FloatingActionBar.Card>
        </FloatingActionBar>
      </div>
    )
  },
}

/** 항상 표시되는 예시입니다. */
export const AlwaysVisible: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="p-afds-spacing-24 min-h-[400px] relative">
      <p className="text-afds-text-secondary text-sm">플로팅 액션 바가 항상 표시되는 예시입니다.</p>
      <FloatingActionBar show={true}>
        <FloatingActionBar.Dim />
        <FloatingActionBar.Card>
          <Button size="sm" variant="ghost">
            내보내기
          </Button>
          <Button size="sm" variant="fill">
            삭제
          </Button>
          <FloatingActionBar.ClearButton />
        </FloatingActionBar.Card>
      </FloatingActionBar>
    </div>
  ),
}

/** 여러 액션 버튼이 있는 케이스입니다. */
export const WithManyActions: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="p-afds-spacing-24 min-h-[400px]">
      <p className="text-afds-text-secondary text-sm">5개의 액션 버튼이 있는 예시입니다.</p>
      <FloatingActionBar show={true} onClose={() => {}}>
        <FloatingActionBar.Dim />
        <FloatingActionBar.Card>
          <Button size="sm" variant="ghost">
            라벨 변경
          </Button>
          <Button size="sm" variant="ghost">
            내보내기
          </Button>
          <Button size="sm" variant="ghost">
            복사
          </Button>
          <Button size="sm" variant="ghost">
            이동
          </Button>
          <Button size="sm" variant="ghost">
            삭제
          </Button>
          <FloatingActionBar.ClearButton />
        </FloatingActionBar.Card>
      </FloatingActionBar>
    </div>
  ),
}

/** `ClearButton`의 `onClick`을 직접 전달해 Root의 `onClose`를 오버라이드하는 패턴입니다. */
export const WithCustomClose: Story = {
  parameters: { controls: { disable: true } },
  render: function WithCustomCloseStory() {
    const [show, setShow] = React.useState(true)
    const [log, setLog] = React.useState<string[]>([])

    const addLog = (msg: string) => setLog(prev => [...prev, msg])

    return (
      <div className="p-afds-spacing-24 min-h-[400px]">
        <Button size="sm" onClick={() => setShow(true)} className="mb-3">
          다시 표시
        </Button>
        <div className="text-xs text-afds-text-secondary mb-3">
          {log.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
        <FloatingActionBar
          show={show}
          onClose={() => {
            addLog('Root onClose 호출됨')
            setShow(false)
          }}
        >
          <FloatingActionBar.Dim />
          <FloatingActionBar.Card>
            <Button size="sm" variant="ghost">
              처리
            </Button>
            <FloatingActionBar.ClearButton
              onClick={() => {
                addLog('ClearButton onClick 오버라이드 호출됨')
                setShow(false)
              }}
            />
          </FloatingActionBar.Card>
        </FloatingActionBar>
      </div>
    )
  },
}

/**
 * Card 의 `className` 으로 기본 위치(`mb-12` · 가로 중앙)를 덮어써 위치를 조정한 예시입니다.
 *
 * - 하단 여백을 키우려면 `mb-*` 클래스를 추가합니다.
 * - 우측 정렬은 Card 에 `ml-auto mr-*` 또는 Root 의 `justify-*` 를 조정합니다.
 */
export const WithCustomPosition: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="p-afds-spacing-24 min-h-[400px]">
      <p className="text-afds-text-secondary text-sm">
        기본 위치(하단 중앙)에서 우측 하단으로, 하단 여백을 더 키운 예시입니다.
      </p>
      <FloatingActionBar show={true}>
        <FloatingActionBar.Card className="mb-afds-spacing-24 ml-auto mr-afds-spacing-24">
          <Button size="sm" variant="ghost">
            처리
          </Button>
          <FloatingActionBar.ClearButton />
        </FloatingActionBar.Card>
      </FloatingActionBar>
    </div>
  ),
}

/** `Dim`을 생략해 배경 그라데이션 오버레이를 제거한 케이스입니다. */
export const WithoutOverlay: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="p-afds-spacing-24 min-h-[400px]">
      <p className="text-afds-text-secondary text-sm">그라데이션 오버레이가 없는 예시입니다.</p>
      <FloatingActionBar show={true}>
        <FloatingActionBar.Card>
          <Button size="sm" variant="ghost">
            처리
          </Button>
          <FloatingActionBar.ClearButton />
        </FloatingActionBar.Card>
      </FloatingActionBar>
    </div>
  ),
}

export const ShowHideInteraction: Story = {
  parameters: { controls: { disable: true } },
  render: function ShowHideBar() {
    const [show, setShow] = React.useState(false)
    return (
      <div className="p-afds-spacing-24 min-h-[400px]">
        <Button onClick={() => setShow(true)} aria-label="액션바 표시" className="mr-afds-8">
          표시
        </Button>
        <Button onClick={() => setShow(false)} variant="primary-line" aria-label="액션바 숨기기">
          숨기기
        </Button>
        <FloatingActionBar show={show} onClose={() => setShow(false)}>
          <FloatingActionBar.Dim />
          <FloatingActionBar.Card>
            <Button size="sm" variant="ghost">
              처리
            </Button>
            <FloatingActionBar.ClearButton />
          </FloatingActionBar.Card>
        </FloatingActionBar>
      </div>
    )
  },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement)

    const showButton = canvas.getByRole('button', { name: '액션바 표시' })
    const hideButton = canvas.getByRole('button', { name: '액션바 숨기기' })

    await expect(canvasElement.querySelector('[data-slot="floating-action-bar"]')).toBeNull()

    await userEvent.click(showButton)
    await expect(canvasElement.querySelector('[data-slot="floating-action-bar"]')).not.toBeNull()

    await userEvent.click(hideButton)
  },
}
