import type { Meta, StoryObj } from '@storybook/react'
import * as React from 'react'
import { ScrollArea, CheckBox } from '@turbo-project/afds/bricks'

/**
 *
 * 커스텀 스크롤바를 가진 스크롤 영역 컴포넌트입니다.
 *
 * **Import:**
 * ```tsx
 * import { ScrollArea } from '@turbo-project/afds/bricks'
 * ```
 *
 * ### 기본 사용법
 * ```tsx
 * <ScrollArea className="h-[200px] w-[280px]">
 *   <div>스크롤 가능한 콘텐츠</div>
 * </ScrollArea>
 * ```
 *
 * ### 베스트 프랙티스
 * - 컨테이너에 반드시 `height`를 지정해야 수직 스크롤이 동작합니다.
 * - 가로 스크롤이 필요한 경우 내부 콘텐츠에 `style={{ width: 'max-content' }}`를 설정하세요.
 * - `hideVertical` / `hideHorizontal`로 특정 방향의 스크롤바를 숨길 수 있습니다.
 * - `offsetYStart` / `offsetYEnd`로 세로 스크롤바의 상·하단 여백을 조절합니다.
 */
const meta = {
  title: 'AFDS / Bricks / Layout / ScrollArea',
  component: ScrollArea,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    hideVertical: {
      control: 'boolean',
      description: '세로 스크롤바를 숨깁니다',
      table: { defaultValue: { summary: 'false' } },
    },
    hideHorizontal: {
      control: 'boolean',
      description: '가로 스크롤바를 숨깁니다',
      table: { defaultValue: { summary: 'false' } },
    },
    offsetYStart: {
      control: { type: 'number', min: 0, max: 100, step: 1 },
      description: '세로 스크롤바 상단 여백(px)',
      table: { defaultValue: { summary: '10' } },
    },
    offsetYEnd: {
      control: { type: 'number', min: 0, max: 100, step: 1 },
      description: '세로 스크롤바 하단 여백(px)',
      table: { defaultValue: { summary: '10' } },
    },
    offsetXStart: {
      control: { type: 'number', min: 0, max: 100, step: 1 },
      description: '가로 스크롤바 좌측 여백(px)',
      table: { defaultValue: { summary: '10' } },
    },
    offsetXEnd: {
      control: { type: 'number', min: 0, max: 100, step: 1 },
      description: '가로 스크롤바 우측 여백(px)',
      table: { defaultValue: { summary: '10' } },
    },
    scrollBarVerticalStyle: {
      control: false,
      description: '세로 스크롤바에 주입할 CSS 변수 / 스타일',
    },
    scrollBarHorizontalStyle: {
      control: false,
      description: '가로 스크롤바에 주입할 CSS 변수 / 스타일',
    },
    viewportClassName: { control: false, description: '뷰포트 요소에 추가할 className' },
    contentClassName: { control: false, description: '콘텐츠 요소에 추가할 className' },
    gutter: {
      control: 'inline-radio',
      options: ['reserve', 'overlay'],
      description:
        '세로 스크롤바 폭을 콘텐츠에서 예약할지 — `overlay`는 예약하지 않아 전체폭 요소가 끝까지 간다',
      table: { defaultValue: { summary: 'reserve' } },
    },
  },
  args: {
    hideVertical: false,
    hideHorizontal: false,
    offsetYStart: 10,
    offsetYEnd: 10,
    offsetXStart: 10,
    offsetXEnd: 10,
  },
} satisfies Meta<typeof ScrollArea>

export default meta
type Story = StoryObj<typeof meta>

const longContent = Array.from(
  { length: 20 },
  (_, i) => `항목 ${i + 1}: 스크롤 가능한 콘텐츠입니다.`,
)

export const Default: Story = {
  render: args => (
    <ScrollArea
      {...args}
      className="h-[200px] w-[280px] border border-afds-border-default rounded-afds-md"
    >
      <div
        className="flex flex-col gap-afds-spacing-8 px-afds-spacing-14 py-3"
        style={{ width: 'max-content' }}
      >
        {longContent.map(item => (
          <div
            key={item}
            className="text-sm py-afds-spacing-4 border-b border-afds-divider-default whitespace-nowrap"
            style={{ minWidth: 480 }}
          >
            {item}
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
}

export const Vertical: Story = {
  render: args => (
    <ScrollArea
      {...args}
      hideHorizontal
      className="h-[200px] w-[280px] border border-afds-border-default rounded-afds-md"
    >
      <div className="flex flex-col gap-afds-spacing-8 px-afds-spacing-14 py-3">
        {longContent.map(item => (
          <div
            key={item}
            className="text-sm py-afds-spacing-4 border-b border-afds-divider-default"
          >
            {item}
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
}

export const Horizontal: Story = {
  render: args => (
    <ScrollArea
      {...args}
      hideVertical
      className="w-[280px] border border-afds-border-default rounded-afds-md"
    >
      <div className="flex gap-3 px-afds-spacing-14 py-3" style={{ width: 'max-content' }}>
        {Array.from({ length: 10 }, (_, i) => (
          <div
            key={i}
            className="flex items-center justify-center bg-afds-bg-surface-sunken rounded-afds-sm text-afds-text-secondary text-sm"
            style={{ minWidth: 80, height: 60 }}
          >
            Card {i + 1}
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
}

export const BothAxes: Story = {
  render: args => (
    <ScrollArea
      {...args}
      className="h-[200px] w-[280px] border border-afds-border-default rounded-afds-md"
    >
      <div className="px-afds-spacing-14 py-3" style={{ width: 'max-content' }}>
        {longContent.map(item => (
          <div
            key={item}
            className="text-sm py-afds-spacing-4 border-b border-afds-divider-default whitespace-nowrap"
            style={{ minWidth: 480 }}
          >
            {item}
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
}

export const HiddenScrollbar: Story = {
  args: { hideVertical: true },
  render: args => (
    <ScrollArea
      {...args}
      className="h-[200px] w-[280px] border border-afds-border-default rounded-afds-md"
    >
      <div className="flex flex-col gap-afds-spacing-8 px-afds-spacing-14 py-3">
        {longContent.map(item => (
          <div key={item} className="text-sm py-afds-spacing-4">
            {item}
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
}

export const CustomOffset: Story = {
  args: { offsetYStart: 40, offsetYEnd: 40 },
  render: args => (
    <ScrollArea
      {...args}
      className="h-[200px] w-[280px] border border-afds-border-default rounded-afds-md"
    >
      <div className="flex flex-col gap-afds-spacing-8 px-afds-spacing-14 py-3">
        {longContent.map(item => (
          <div
            key={item}
            className="text-sm py-afds-spacing-4 border-b border-afds-divider-default"
          >
            {item}
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
}

export const CustomScrollBar: Story = {
  render: args => (
    <ScrollArea
      {...args}
      className="h-[200px] w-[280px] border border-afds-border-default rounded-afds-md"
      scrollBarVerticalStyle={{ '--scrollbar-track-size': '8px' } as React.CSSProperties}
    >
      <div className="flex flex-col gap-afds-spacing-8 px-afds-spacing-14 py-3">
        {longContent.map(item => (
          <div
            key={item}
            className="text-sm py-afds-spacing-4 border-b border-afds-divider-default"
          >
            {item}
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
}

/**
 * **스크롤바가 오른쪽 끝 컨트롤을 덮지 않는지** 확인하는 스토리 (소비처 갭 G5).
 *
 * 소비처가 실제로 겪은 것: 폭 200px 목록에서 세로 스크롤바 x=183~200, 체크박스 x=184~200 —
 * 17px 전부 겹쳐 **체크박스를 클릭할 수 없었다.** 우회로 `contentClassName="pr-[17px]"` 를 썼다.
 *
 * ⚠️ **여기서 눈으로 확인해야 하는 것**: 오른쪽 끝 체크박스가 스크롤바에 가리지 않고
 * 클릭되는가. **자동 검증이 없다** — jsdom 은 좌표를 계산하지 않고 Chromatic 은 쿼터가 없다.
 * 단위 테스트는 "속성이 거터 클래스를 구동하는가" 까지만 본다.
 */
export const ScrollbarGutter: Story = {
  args: { className: 'w-[200px] h-[160px] border border-afds-border-default rounded-afds-sm' },
  render: args => (
    <ScrollArea {...args}>
      {Array.from({ length: 12 }, (_, i) => (
        <div
          key={i}
          className="flex items-center justify-between px-afds-spacing-8 py-afds-spacing-4"
        >
          <span className="body3 text-afds-text-primary">매체 {i + 1}</span>
          <CheckBox.Root aria-label={`매체 ${i + 1} 선택`}>
            <CheckBox.Indicator keepMounted />
          </CheckBox.Root>
        </div>
      ))}
    </ScrollArea>
  ),
}

/**
 * **hover-reveal 에서 레이아웃이 흔들리지 않는지** 확인하는 스토리.
 *
 * 소비처(`WeekGrid`)가 `hideVertical={!isHovered}` 로 스크롤바를 hover 에만 보여준다.
 * 거터를 **가시성**에 걸면 hover 마다 17px 이 생겼다 사라져 콘텐츠가 리플로우한다.
 * 그래서 거터는 `data-has-overflow-y`(오버플로 **존재**)에 걸었다.
 *
 * ⚠️ **여기서 눈으로 확인해야 하는 것**: 마우스를 올렸다 내릴 때 **텍스트가 움직이지 않는가**.
 * 스크롤바의 표시만 바뀌어야 한다. 단위 테스트는 클래스가 같다는 것까지만 본다.
 */
export const HoverRevealNoReflow: Story = {
  args: { className: 'w-[200px] h-[160px] border border-afds-border-default rounded-afds-sm' },
  render: function HoverRevealStory(args) {
    const [hovered, setHovered] = React.useState(false)
    return (
      <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
        <ScrollArea {...args} hideVertical={!hovered}>
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className="px-afds-spacing-8 py-afds-spacing-4">
              <span className="body3 text-afds-text-primary">
                항목 {i + 1} — 가장자리 정렬 확인
              </span>
            </div>
          ))}
        </ScrollArea>
      </div>
    )
  },
}

const affectedRows = Array.from({ length: 14 }, (_, i) => ({
  target: `대상 ${i + 1}`,
  before: `${(i + 1) * 10}px`,
  after: `${(i + 1) * 12}px`,
}))

const AffectedItemsTable = () => (
  <table className="w-full table-fixed border-collapse">
    <thead className="bg-afds-bg-surface-sunken">
      <tr>
        {['대상', '변경 전', '변경 후'].map(head => (
          <th key={head} className="body3 text-afds-text-secondary py-afds-spacing-4 text-left">
            {head}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {affectedRows.map(row => (
        <tr key={row.target} className="border-b border-afds-divider-default">
          <td className="body3 text-afds-text-primary py-afds-spacing-4">{row.target}</td>
          <td className="body3 text-afds-text-primary py-afds-spacing-4">{row.before}</td>
          <td className="body3 text-afds-text-primary py-afds-spacing-4">{row.after}</td>
        </tr>
      ))}
    </tbody>
  </table>
)

/**
 * **전체폭 요소가 컨테이너 끝까지 가는지** 확인하는 스토리 (upstream #244).
 *
 * `reserve`(기본값)는 거터를 예약해 **모든 자식을 밀어내므로** 테이블 헤더 배경·행 구분선처럼
 * 끝까지 이어져야 하는 장식까지 잘린다. `overlay` 는 예약하지 않아 전체폭 자식이 끝까지 가고,
 * 대신 바가 콘텐츠 위에 뜬다 — **본문이 있는 목록에는 쓰지 않는다.**
 *
 * ⚠️ **눈으로 확인할 것**: 왼쪽(reserve)은 헤더 배경이 오른쪽 테두리 전에 끊기고, 오른쪽(overlay)은
 * 테두리까지 이어지는가. **자동 검증이 없다** — jsdom 은 좌표를 계산하지 않고 Chromatic 은 쿼터가 없다.
 */
export const GutterOverlayFullWidth: Story = {
  render: args => (
    <div className="flex gap-afds-spacing-24">
      {(['reserve', 'overlay'] as const).map(gutter => (
        <div key={gutter} className="flex flex-col gap-afds-spacing-8">
          <span className="title4 text-afds-text-secondary">gutter=&quot;{gutter}&quot;</span>
          <ScrollArea
            {...args}
            gutter={gutter}
            className="w-[500px] max-h-[320px] border border-afds-border-default rounded-afds-sm"
          >
            <AffectedItemsTable />
          </ScrollArea>
        </div>
      ))}
    </div>
  ),
}

/**
 * **`contentClassName` 의 좌우 패딩이 보존되는지** 확인하는 스토리 (upstream #244).
 *
 * 예전에는 우리가 주입한 `pr-*` 이 소비처 패딩을 이겨, 소비처(`WeekGrid`)가 준 10px 이 **오버플로가
 * 있는 컬럼에서만** 17px 로 바뀌었다. 지금은 두 컬럼 모두 준 값 그대로 10px 이고, 거터는 그
 * 안쪽 래퍼가 따로 진다.
 *
 * ⚠️ **눈으로 확인할 것**: 두 컬럼의 콘텐츠 여백이 같은가. 오른쪽 끝은 오버플로가 있는 쪽만
 * 거터만큼 더 들어간다 — 그것까지 없애려면 `gutter="overlay"` 다.
 */
export const ContentPaddingPreserved: Story = {
  render: args => (
    <div className="flex gap-afds-spacing-24">
      {([12, 3] as const).map(count => (
        <div key={count} className="flex flex-col gap-afds-spacing-8">
          <span className="title4 text-afds-text-secondary">
            {count === 12 ? '오버플로 있음' : '오버플로 없음'}
          </span>
          <ScrollArea
            {...args}
            contentClassName="p-afds-spacing-10"
            className="w-[220px] h-[200px] border border-afds-border-default rounded-afds-sm"
          >
            <div className="flex flex-col gap-afds-spacing-8">
              {Array.from({ length: count }, (_, i) => (
                <div
                  key={i}
                  className="body3 text-afds-text-primary bg-afds-bg-surface-sunken rounded-afds-sm px-afds-spacing-8 py-afds-spacing-4"
                >
                  카드 {i + 1}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      ))}
    </div>
  ),
}
