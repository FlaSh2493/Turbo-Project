import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { SmoothList } from '@turbo-project/afds/bricks'
import { Button } from '@turbo-project/afds/bricks'

/**
 *
 * FLIP 알고리즘으로 리스트 항목의 위치 변화를 부드럽게 애니메이션화하는 컴포넌트입니다.
 * 항목 재정렬·추가·삭제 시 자연스러운 이동 효과를 제공합니다.
 *
 *
 * ### 핵심 사용법
 * ```tsx
 * <SmoothList className="flex flex-col gap-2">
 *   {items.map(item => (
 *     <li key={item.id} data-layout-id={item.id}>
 *       {item.label}
 *     </li>
 *   ))}
 * </SmoothList>
 * ```
 *
 * ### 언제 사용하나요?
 * - 드래그 없이 순서가 바뀌는 리스트 (우선순위 변경, 필터링 등)
 * - 항목 추가·삭제 시 주변 항목이 자연스럽게 밀려나야 할 때
 *
 * ### 베스트 프랙티스
 * - 각 자식 요소에 **`data-layout-id`** 속성이 반드시 필요합니다. 없으면 FLIP 애니메이션이 실행되지 않습니다.
 * - `key`와 `data-layout-id`는 동일한 값을 사용하세요.
 * - `duration` 기본값 300ms. 500ms 초과 시 사용성이 저하될 수 있습니다.
 * - `as` prop으로 렌더링 태그를 변경할 수 있습니다 (기본값: `ul`).
 */
const meta = {
  title: 'AFDS / Bricks / Animation / SmoothList',
  component: SmoothList,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
FLIP 알고리즘 기반의 리스트 애니메이션 컴포넌트입니다.
항목 순서 변경·추가·삭제 시 각 요소가 부드럽게 이동합니다.

**Import:**
\`\`\`tsx
import { SmoothList } from '@turbo-project/afds/bricks'
\`\`\`

### 기본 사용법
\`\`\`tsx
<SmoothList className="flex flex-col gap-2" duration={300}>
  <li data-layout-id="a">A</li>
  <li data-layout-id="b">B</li>
</SmoothList>
\`\`\`

> **필수**: 각 자식 요소에 \`data-layout-id\` 속성을 지정해야 애니메이션이 동작합니다.
        `,
      },
    },
  },
  tags: ['autodocs'],
  args: { duration: 300 },
} satisfies Meta<typeof SmoothList>

export default meta
type Story = StoryObj<typeof meta>

// Basic Stories

/** Shuffle / Add 버튼으로 FLIP 애니메이션을 확인하세요. 항목 클릭 시 삭제됩니다. */
export const Default: Story = {
  render: function DefaultStory() {
    const [items, setItems] = React.useState([1, 2, 3, 4, 5])

    const shuffle = () => setItems(prev => [...prev].sort(() => Math.random() - 0.5))
    const addItem = () => setItems(prev => [...prev, Math.max(...prev, 0) + 1])
    const removeItem = (item: number) => setItems(prev => prev.filter(i => i !== item))

    return (
      <div className="flex flex-col gap-4 w-80">
        <div className="flex gap-2">
          <Button onClick={shuffle} variant="primary-line">
            Shuffle
          </Button>
          <Button onClick={addItem} variant="primary-line">
            Add
          </Button>
        </div>
        <SmoothList className="flex flex-col gap-2 p-4 bg-afds-gray-100 rounded-afds-md">
          {items.map(item => (
            <div
              key={item}
              data-layout-id={item}
              className="flex items-center justify-between p-3 bg-afds-gray-0 border border-afds-gray-200 rounded-afds-sm cursor-pointer"
              onClick={() => removeItem(item)}
            >
              <span className="body2 text-afds-gray-700">Item {item}</span>
              <span className="body3 text-afds-gray-500">클릭하여 삭제</span>
            </div>
          ))}
        </SmoothList>
      </div>
    )
  },
}

/** `as="div"` + `grid` 클래스로 그리드 레이아웃에서도 동작합니다. */
export const Grid: Story = {
  parameters: { controls: { disable: true } },
  render: function GridStory() {
    const [items, setItems] = React.useState(Array.from({ length: 9 }, (_, i) => i + 1))

    const shuffle = () => setItems(prev => [...prev].sort(() => Math.random() - 0.5))

    return (
      <div className="flex flex-col gap-4 w-80">
        <Button onClick={shuffle} variant="primary-line">
          Shuffle Grid
        </Button>
        <SmoothList
          as="div"
          className="grid grid-cols-3 gap-2 p-4 bg-afds-gray-100 rounded-afds-md"
        >
          {items.map(item => (
            <div
              key={item}
              data-layout-id={item}
              className="aspect-square flex items-center justify-center bg-afds-gray-0 border border-afds-gray-200 rounded-afds-sm heading2 text-afds-gray-700"
            >
              {item}
            </div>
          ))}
        </SmoothList>
      </div>
    )
  },
}

// Variant Stories

/** `duration={800}` — 느린 애니메이션으로 FLIP 효과를 명확하게 확인할 수 있습니다. */
export const SlowAnimation: Story = {
  parameters: { controls: { disable: true } },
  render: function SlowAnimationStory() {
    const [items, setItems] = React.useState([1, 2, 3, 4, 5])

    const shuffle = () => setItems(prev => [...prev].sort(() => Math.random() - 0.5))

    return (
      <div className="flex flex-col gap-4 w-80">
        <Button onClick={shuffle} variant="primary-line">
          Shuffle (느리게)
        </Button>
        <SmoothList
          duration={800}
          className="flex flex-col gap-2 p-4 bg-afds-gray-100 rounded-afds-md"
        >
          {items.map(item => (
            <div
              key={item}
              data-layout-id={item}
              className="p-3 bg-afds-gray-0 border border-afds-gray-200 rounded-afds-sm body2 text-afds-gray-700"
            >
              Item {item}
            </div>
          ))}
        </SmoothList>
      </div>
    )
  },
}

/** 실제 사용 패턴 — 우선순위 기반 태스크 목록 재정렬 예시입니다. */
export const TaskList: Story = {
  parameters: { controls: { disable: true } },
  render: function TaskListStory() {
    const [tasks, setTasks] = React.useState([
      { id: 'a', label: '디자인 검토' },
      { id: 'b', label: '코드 리뷰' },
      { id: 'c', label: '배포 준비' },
      { id: 'd', label: '테스트 작성' },
    ])

    const promoteLast = () =>
      setTasks(prev => {
        const next = [...prev]
        const last = next.pop()!
        return [last, ...next]
      })

    return (
      <div className="flex flex-col gap-4 w-72">
        <div className="flex items-center justify-between">
          <span className="title3 text-afds-gray-700">태스크 목록</span>
          <Button size="sm" onClick={promoteLast} variant="primary-line">
            마지막 항목 맨 위로
          </Button>
        </div>
        <SmoothList className="flex flex-col gap-1.5">
          {tasks.map((task, i) => (
            <div
              key={task.id}
              data-layout-id={task.id}
              className="flex items-center gap-3 p-3 bg-afds-gray-0 border border-afds-gray-200 rounded-afds-md"
            >
              <span className="body3 text-afds-gray-500 w-4">{i + 1}</span>
              <span className="body2 text-afds-gray-700">{task.label}</span>
            </div>
          ))}
        </SmoothList>
      </div>
    )
  },
}
