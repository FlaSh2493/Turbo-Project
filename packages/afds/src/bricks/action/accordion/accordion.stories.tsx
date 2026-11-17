import * as React from 'react'
import type { ArgTypes, Meta, StoryObj } from '@storybook/react'
import { expect, userEvent, within } from '@storybook/test'
import { Accordion } from '@turbo-project/afds/bricks'
import { ScrollArea } from '@turbo-project/afds/bricks'
import { Typography } from '@turbo-project/afds/bricks'
import { ChevronDownIcon } from 'lucide-react'

/**
 *
 * 슬롯 분리형 아코디언 컴포넌트입니다.
 * 디폴트 비주얼 프리셋(`Indicator`, `Body`)과 자유로운 합성을 모두 지원합니다.
 *
 * ### 커스터마이즈
 * - 라벨은 `Typography variant="title3"` 등으로 Trigger 안에서 자유 조합 (필요 시 임의 ReactNode)
 * - `Indicator`, `Body` 는 옵셔널 프리셋 — 안 쓰면 안 그려짐
 * - `Indicator` children 으로 아이콘 교체, `className` 으로 회전 동작 override
 * - `Body` 미사용 시 `Content` 안에 임의 컴포넌트 직접 렌더 가능
 *
 * ### multiple 옵션
 * - `false` (default): 한 번에 하나만 열림
 * - `true`: 여러 항목 동시 열기 가능
 */

const argTypes: Partial<ArgTypes> = {
  multiple: {
    control: 'boolean',
    description: '여러 항목 동시 열기 허용',
    table: {
      category: 'Accordion.Root',
      type: { summary: 'boolean' },
      defaultValue: { summary: 'false' },
    },
  },
}

const meta = {
  title: 'AFDS / Bricks / Action / Accordion',
  component: Accordion.Root,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
슬롯 분리형 아코디언 컴포넌트입니다.

**Import:**
\`\`\`tsx
import { Accordion } from '@turbo-project/afds/bricks'
\`\`\`

### 기본 사용법
\`\`\`tsx
<Accordion.Root>
  <Accordion.Item value="item-1">
    <Accordion.Trigger>
      <Typography variant="title3">제목</Typography>
      <Accordion.Indicator />
    </Accordion.Trigger>
    <Accordion.Content>
      <Accordion.Body>내용</Accordion.Body>
    </Accordion.Content>
  </Accordion.Item>
</Accordion.Root>
\`\`\`

### 아이콘 교체 (회전 유지)
\`\`\`tsx
<Accordion.Indicator>
  <ArrowDownIcon size={16} />
</Accordion.Indicator>
\`\`\`

### 상태별 아이콘 스왑 (회전 없음)
\`\`\`tsx
<Accordion.Indicator className="group-data-[panel-open]:rotate-0">
  <PlusIcon size={16} className="group-data-[panel-open]:hidden" />
  <MinusIcon size={16} className="hidden group-data-[panel-open]:inline" />
</Accordion.Indicator>
\`\`\`

### 본문에 임의 컴포넌트 (Body 미사용)
\`\`\`tsx
<Accordion.Content>
  <FilterPanel />
</Accordion.Content>
\`\`\`

### Indicator 없애기
\`\`\`tsx
<Accordion.Trigger>
  <Typography variant="title3">제목</Typography>
  {/* Indicator 미포함 시 아이콘 없음 */}
</Accordion.Trigger>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes,
  args: {
    multiple: false,
  },
} satisfies Meta<typeof Accordion.Root>

export default meta
type Story = StoryObj<typeof meta>

const faqItems = [
  {
    value: 'q1',
    title: '서비스 이용 방법은 어떻게 되나요?',
    content:
      '가입 후 대시보드에서 바로 시작할 수 있습니다. 상단 메뉴에서 원하는 기능을 선택하세요.',
  },
  {
    value: 'q2',
    title: '결제 방법은 무엇인가요?',
    content:
      '신용카드, 계좌이체, 페이팔을 지원합니다. 마이페이지 > 결제 설정에서 변경할 수 있습니다.',
  },
  {
    value: 'q3',
    title: '데이터는 어떻게 보호되나요?',
    content: 'AES-256 암호화와 HTTPS를 통해 모든 데이터를 안전하게 보호합니다.',
  },
]

const longFaqItems = [
  {
    value: 'q1',
    title: '서비스 이용 방법은 어떻게 되나요?',
    content:
      '가입 후 대시보드에서 바로 시작할 수 있습니다. 상단 메뉴에서 원하는 기능을 선택하세요. 처음 접속 시 온보딩 튜토리얼이 제공되며, 단계별로 안내를 따라가면 주요 기능을 빠르게 익힐 수 있습니다. 팀 단위로 사용하는 경우에는 관리자 계정에서 멤버를 초대하고 권한을 설정할 수 있습니다. 추가 도움이 필요하시면 고객센터 채팅을 통해 실시간 지원을 받으실 수 있습니다.',
  },
  {
    value: 'q2',
    title: '결제 방법은 무엇인가요?',
    content:
      '신용카드, 계좌이체, 페이팔을 지원합니다. 마이페이지 > 결제 설정에서 변경할 수 있습니다. 월 구독과 연 구독 중 선택 가능하며, 연 구독 시 20% 할인 혜택이 제공됩니다. 법인 고객의 경우 세금계산서 발행이 가능하며, 담당자에게 별도 문의 주시면 안내해 드리겠습니다.',
  },
  {
    value: 'q3',
    title: '데이터는 어떻게 보호되나요?',
    content:
      'AES-256 암호화와 HTTPS를 통해 모든 데이터를 안전하게 보호합니다. 서버는 ISO 27001 인증을 받은 데이터센터에서 운영되며, 연 2회 외부 보안 감사를 진행합니다.',
  },
]

// Basic Stories

/** 기본 아코디언입니다. Controls 패널에서 props를 직접 조작할 수 있습니다. */
export const Default: Story = {
  args: { multiple: false },
  render: args => (
    <Accordion.Root {...args} className="w-[400px]">
      {faqItems.map(item => (
        <Accordion.Item key={item.value} value={item.value}>
          <Accordion.Trigger>
            <Typography variant="title3">{item.title}</Typography>
            <Accordion.Indicator />
          </Accordion.Trigger>
          <Accordion.Content>
            <Accordion.Body>{item.content}</Accordion.Body>
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  ),
}

/** 기본으로 열린 항목이 있는 아코디언입니다. */
export const DefaultOpen: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Accordion.Root multiple={false} defaultValue={['q1']} className="w-[400px]">
      {faqItems.map(item => (
        <Accordion.Item key={item.value} value={item.value}>
          <Accordion.Trigger>
            <Typography variant="title3">{item.title}</Typography>
            <Accordion.Indicator />
          </Accordion.Trigger>
          <Accordion.Content>
            <Accordion.Body>{item.content}</Accordion.Body>
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  ),
}

// Type Stories

/** 여러 항목을 동시에 열 수 있는 아코디언입니다. */
export const Multiple: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Accordion.Root multiple defaultValue={['q1']} className="w-[400px]">
      {faqItems.map(item => (
        <Accordion.Item key={item.value} value={item.value}>
          <Accordion.Trigger>
            <Typography variant="title3">{item.title}</Typography>
            <Accordion.Indicator />
          </Accordion.Trigger>
          <Accordion.Content>
            <Accordion.Body>{item.content}</Accordion.Body>
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  ),
}

// State Stories

/** 일부 항목이 비활성화된 아코디언입니다. */
export const Disabled: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Accordion.Root multiple={false} className="w-[400px]">
      {faqItems.map((item, index) => (
        <Accordion.Item key={item.value} value={item.value} disabled={index === 2}>
          <Accordion.Trigger>
            <Typography variant="title3">{item.title}</Typography>
            <Accordion.Indicator />
          </Accordion.Trigger>
          <Accordion.Content>
            <Accordion.Body>{item.content}</Accordion.Body>
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  ),
}

/** 외부 상태로 제어되는 아코디언입니다. */
export const Controlled: Story = {
  parameters: { controls: { disable: true } },
  render: function ControlledStory() {
    const [value, setValue] = React.useState<string[]>([])
    return (
      <div className="flex flex-col gap-afds-spacing-14 w-[400px]">
        <div className="flex gap-afds-spacing-8">
          {faqItems.map(item => (
            <button
              key={item.value}
              onClick={() => setValue(v => (v[0] === item.value ? [] : [item.value]))}
            >
              {item.value}
            </button>
          ))}
        </div>
        <Accordion.Root multiple={false} value={value} onValueChange={setValue}>
          {faqItems.map(item => (
            <Accordion.Item key={item.value} value={item.value}>
              <Accordion.Trigger>
                <Typography variant="title3">{item.title}</Typography>
                <Accordion.Indicator />
              </Accordion.Trigger>
              <Accordion.Content>
                <Accordion.Body>{item.content}</Accordion.Body>
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </div>
    )
  },
}

// Composition Stories

/** 콘텐츠 영역에 ScrollArea가 적용된 아코디언입니다. */
export const WithScrollArea: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Accordion.Root multiple={false} className="w-[400px]">
      {longFaqItems.map(item => (
        <Accordion.Item key={item.value} value={item.value}>
          <Accordion.Trigger>
            <Typography variant="title3">{item.title}</Typography>
            <Accordion.Indicator />
          </Accordion.Trigger>
          <Accordion.Content>
            <Accordion.Body>
              <ScrollArea viewportClassName="max-h-[100px]">{item.content}</ScrollArea>
            </Accordion.Body>
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  ),
}

/** Indicator를 사용하지 않는 아코디언입니다. */
export const WithoutIndicator: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Accordion.Root multiple={false} className="w-[400px]">
      {faqItems.slice(0, 2).map(item => (
        <Accordion.Item key={item.value} value={item.value}>
          <Accordion.Trigger>
            <Typography variant="title3">{item.title}</Typography>
          </Accordion.Trigger>
          <Accordion.Content>
            <Accordion.Body>{item.content}</Accordion.Body>
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  ),
}

/** Plus/Minus 아이콘을 상태별로 스왑하는 아코디언입니다. 회전 동작을 끄고 아이콘을 교체합니다. */
export const SwapIndicator: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Accordion.Root multiple={false} className="w-[400px]">
      {faqItems.slice(0, 2).map(item => (
        <Accordion.Item key={item.value} value={item.value}>
          <Accordion.Trigger>
            <Typography variant="title3">{item.title}</Typography>
            <Accordion.Indicator className="group-data-[panel-open]:rotate-0">
              <span className="group-data-[panel-open]:hidden">＋</span>
              <span className="hidden group-data-[panel-open]:inline">－</span>
            </Accordion.Indicator>
          </Accordion.Trigger>
          <Accordion.Content>
            <Accordion.Body>{item.content}</Accordion.Body>
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  ),
}

/** Body 없이 임의 컴포넌트를 Content에 직접 렌더링합니다. */
export const RichContent: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Accordion.Root multiple={false} defaultValue={['q1']} className="w-[400px]">
      <Accordion.Item value="q1">
        <Accordion.Trigger>
          <Typography variant="title3">설정 패널</Typography>
          <Accordion.Indicator />
        </Accordion.Trigger>
        <Accordion.Content>
          {/* Body 없이 임의 컴포넌트 직접 렌더 */}
          <div className="p-afds-spacing-20 flex flex-col gap-afds-spacing-8">
            <label className="flex items-center gap-afds-spacing-8">
              <input type="checkbox" />
              <span>알림 수신</span>
            </label>
            <label className="flex items-center gap-afds-spacing-8">
              <input type="checkbox" defaultChecked />
              <span>이메일 구독</span>
            </label>
          </div>
        </Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="q2">
        <Accordion.Trigger>
          <Typography variant="title3">일반 텍스트 항목</Typography>
          <Accordion.Indicator />
        </Accordion.Trigger>
        <Accordion.Content>
          <Accordion.Body>Body 프리셋을 사용한 일반 텍스트 콘텐츠입니다.</Accordion.Body>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  ),
}

/** Trigger 안에 임의 노드를 자유롭게 합성합니다. 뱃지·카운터·상태 태그 등 어떤 노드도 배치 가능합니다. */
export const CustomTrigger: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Accordion.Root multiple={false} className="w-[400px]">
      <Accordion.Item value="q1">
        <Accordion.Trigger>
          <div className="flex items-center gap-afds-spacing-8 flex-1">
            <Typography variant="title3">공지사항</Typography>
            <span className="rounded-afds-pill bg-afds-bg-brand text-afds-text-inverse text-xs px-afds-spacing-8 py-afds-spacing-4">
              New
            </span>
          </div>
          <Accordion.Indicator />
        </Accordion.Trigger>
        <Accordion.Content>
          <Accordion.Body>라벨 옆에 임의 노드를 자유롭게 배치할 수 있습니다.</Accordion.Body>
        </Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="q2">
        <Accordion.Trigger>
          <div className="flex items-center gap-afds-spacing-8 flex-1">
            <Typography variant="title3">필터</Typography>
            <span className="rounded-afds-pill bg-afds-bg-selected text-afds-text-primary text-xs px-afds-spacing-8 py-afds-spacing-4">
              3
            </span>
          </div>
          <Accordion.Indicator />
        </Accordion.Trigger>
        <Accordion.Content>
          <Accordion.Body>선택된 필터 항목 수를 카운터로 표시합니다.</Accordion.Body>
        </Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="q3">
        <Accordion.Trigger>
          {/* 라벨/Typography 없이 완전 커스텀 레이아웃 */}
          <div className="flex flex-col items-start gap-afds-spacing-4">
            <span className="text-afds-text-primary font-afds-bold">커스텀 레이아웃</span>
            <span className="text-afds-text-secondary text-xs">부제목도 추가 가능합니다</span>
          </div>
          <Accordion.Indicator />
        </Accordion.Trigger>
        <Accordion.Content>
          <Accordion.Body>라벨 없이 완전히 다른 레이아웃도 가능합니다.</Accordion.Body>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  ),
}

/** Indicator의 className으로 회전 각도·속도·애니메이션을 커스텀합니다. */
export const CustomAnimation: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Accordion.Root className="w-[400px]">
      <Accordion.Item value="q1">
        <Accordion.Trigger>
          <Typography variant="title3">기본 (180도 회전)</Typography>
          <Accordion.Indicator />
        </Accordion.Trigger>
        <Accordion.Content>
          <Accordion.Body>group-data-[panel-open]:rotate-180 — 기본값</Accordion.Body>
        </Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="q2">
        <Accordion.Trigger>
          <Typography variant="title3">90도 회전</Typography>
          <Accordion.Indicator className="group-data-[panel-open]:rotate-90" />
        </Accordion.Trigger>
        <Accordion.Content>
          <Accordion.Body>group-data-[panel-open]:rotate-90</Accordion.Body>
        </Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="q3">
        <Accordion.Trigger>
          <Typography variant="title3">느린 회전 (500ms)</Typography>
          <Accordion.Indicator className="duration-500" />
        </Accordion.Trigger>
        <Accordion.Content>
          <Accordion.Body>duration-500 으로 transition 속도 변경</Accordion.Body>
        </Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="q4">
        <Accordion.Trigger>
          <Typography variant="title3">스케일 + 페이드</Typography>
          {/* Indicator 대신 raw span — 회전 외 동작은 직접 작성 */}
          <span
            data-slot="accordion-indicator"
            className="shrink-0 transition-all duration-200 opacity-40 scale-75 group-data-[panel-open]:opacity-100 group-data-[panel-open]:scale-100"
          >
            <ChevronDownIcon size={16} />
          </span>
        </Accordion.Trigger>
        <Accordion.Content>
          <Accordion.Body>
            Indicator 미사용. raw span + group-data-[panel-open]:* 로 스케일·페이드 구현
          </Accordion.Body>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  ),
}

// Interaction Tests

export const ToggleInteraction: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Accordion.Root multiple={false} className="w-[400px]">
      <Accordion.Item value="test">
        <Accordion.Trigger>
          <Typography variant="title3">토글 테스트 항목</Typography>
          <Accordion.Indicator />
        </Accordion.Trigger>
        <Accordion.Content>
          <Accordion.Body>열린 내용입니다.</Accordion.Body>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('button', { name: /토글 테스트 항목/ })

    await expect(trigger).not.toHaveAttribute('data-panel-open')
    await userEvent.click(trigger)
    await expect(trigger).toHaveAttribute('data-panel-open')
    await userEvent.click(trigger)
    await expect(trigger).not.toHaveAttribute('data-panel-open')
  },
}
