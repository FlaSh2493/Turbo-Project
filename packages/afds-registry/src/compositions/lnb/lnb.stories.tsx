import { useState, type ReactElement, type ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import {
  ChevronRightIcon,
  PlusIcon,
  BellIcon,
  PaletteIcon,
  ChartBarIcon,
  LayoutDashboardIcon,
  DatabaseIcon,
  PanelLeftIcon,
  BookOpenIcon,
  HouseIcon,
  UsersIcon,
  MegaphoneIcon,
  SettingsIcon,
  CircleUserIcon,
  ImageIcon,
} from 'lucide-react'
import { Button, Typography } from '@turbo-project/afds/bricks'
import { PageLayout } from '../page-layout'
import { Lnb, type LnbIcon, type LnbRootProps, type LnbTheme } from './lnb'

/**
 * 접고 펼치는 LNB(60px ↔ 220px)와 오른쪽 콘텐츠 영역을 조립하는 Compound 레이아웃입니다.
 * 화면 조각만 제공합니다 — 메뉴 구성·링크·선택 상태는 조립하는 쪽이 정합니다.
 *
 * **Import:**
 * ```tsx
 * import { Lnb } from '.'
 * ```
 *
 * ### 기본 사용법
 * ```tsx
 * <Lnb.Root>
 *   <Lnb.Nav>
 *     <Lnb.TopMenu>
 *       <Lnb.Dropdown icon={PanelLeftIcon} label="메뉴">
 *         <Lnb.SubGroup>
 *           <Lnb.SubItem render={<Link to="/profile" />}>내 정보</Lnb.SubItem>
 *         </Lnb.SubGroup>
 *       </Lnb.Dropdown>
 *     </Lnb.TopMenu>
 *
 *     <Lnb.MainMenu theme="gradient">
 *       <Lnb.Header media={<img src={logo} alt="" />} label="Acme" render={<Link to="/" />} />
 *
 *       <Lnb.ScrollArea>
 *         <Lnb.Item icon={HouseIcon} label="홈" selected render={<Link to="/home" />} />
 *
 *         <Lnb.Section value="data-center" icon={DatabaseIcon} label="데이터 센터">
 *           <Lnb.SubGroup label="리포트">
 *             <Lnb.SubItem render={<Link to="/data-center" />}>리포트 관리</Lnb.SubItem>
 *             <Lnb.SubItem
 *               badge={
 *                 <Lnb.Badge variant="gradient">
 *                   <Lnb.Badge.Content>New</Lnb.Badge.Content>
 *                 </Lnb.Badge>
 *               }
 *               render={<Link to="/data-center/upload" />}
 *             >
 *               데이터 업로드
 *             </Lnb.SubItem>
 *           </Lnb.SubGroup>
 *         </Lnb.Section>
 *       </Lnb.ScrollArea>
 *
 *       <Lnb.Footer>
 *         <Lnb.Item icon={SettingsIcon} label="설정" render={<Link to="/setting" />} />
 *       </Lnb.Footer>
 *     </Lnb.MainMenu>
 *   </Lnb.Nav>
 *
 *   <Lnb.Content>
 *     <Outlet />
 *   </Lnb.Content>
 * </Lnb.Root>
 * ```
 *
 * ### 베스트 프랙티스
 * - 메뉴는 한 번만 조립한다 — 각 조각이 펼침/접힘에 맞춰 모양을 바꾼다
 * - `Lnb.Section` 은 `Lnb.ScrollArea` 안에, `Lnb.SubItem` 은 `Lnb.SubGroup` 안에 둔다
 * - 링크는 `render` 로 넘긴다. 새 탭 열기·트래킹·권한·선택 판정은 조립하는 쪽에서 한다
 * - LNB 없이 콘텐츠만 그릴 때는 `Lnb.Nav` 를 렌더하지 않는다
 * - 페이지 헤더·그리드는 `Lnb.Content` 안에 `PageLayout` 으로 조립한다
 */
const meta = {
  title: 'Compositions / Common / Navigation / Lnb',
  component: Lnb.Root,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta<typeof Lnb.Root>

export default meta
type Story = StoryObj<LnbRootProps>

// Fixtures — registry-host LNB 메뉴 구성. 스토리(=소비처)가 이 데이터로 조립한다

type SubItemDef = { href: string; label: string; badge?: 'new' | 'beta' }
type SectionDef = {
  value: string
  label: string
  icon: LnbIcon
  wide?: boolean
  breakLabel?: boolean
  groups: { key: string; label?: string; items: SubItemDef[] }[]
}

const SECTIONS: SectionDef[] = [
  {
    value: 'data-center',
    label: '데이터 센터',
    icon: DatabaseIcon,
    groups: [
      {
        key: 'main',
        items: [
          { href: '/data-center/report-rd', label: '리포트 RD 규칙 관리' },
          { href: '/data-center/upload', label: '데이터 업로드 관리' },
        ],
      },
    ],
  },
  {
    value: 'creative-center',
    label: '소재 센터',
    icon: PaletteIcon,
    groups: [
      {
        key: 'mine',
        label: '내 소재 관리',
        items: [
          { href: '/creative-center/reports', label: '소재 분석' },
          { href: '/creative-center/labels', label: '레이블 관리' },
        ],
      },
      {
        key: 'reference',
        label: '레퍼런스 찾기',
        items: [
          { href: '/creative-center/insight', label: '소재 인사이트', badge: 'new' },
          { href: '/creative-center/search', label: '소재 검색' },
          { href: '/creative-center/archive', label: '저장한 소재' },
        ],
      },
    ],
  },
  {
    value: 'da-center',
    label: '운영 센터',
    icon: ChartBarIcon,
    groups: [
      {
        key: 'advertise',
        label: '광고 설정',
        items: [
          { href: '/da-center/manage', label: '광고 운영' },
          { href: '/da-center/rule', label: '규칙 관리' },
          { href: '/da-center/log', label: '실행 내역' },
        ],
      },
      {
        key: 'feed',
        label: '상품 피드 메이커',
        items: [
          { href: '/da-center/media-feeds', label: '매체피드 관리' },
          { href: '/da-center/source-feeds', label: '원본피드 관리' },
        ],
      },
      {
        key: 'monitoring',
        label: '모니터링',
        items: [{ href: '/da-center/budget', label: '예산 모니터링' }],
      },
    ],
  },
  {
    value: 'ai-report',
    label: 'AI 리포트',
    icon: LayoutDashboardIcon,
    wide: true,
    groups: [
      {
        key: 'main',
        items: [
          { href: '/ai-report/performance', label: '성과 리포트', badge: 'beta' },
          { href: '/ai-report/kpi', label: 'KPI 트래커' },
          { href: '/ai-report/issue', label: '이슈보드' },
        ],
      },
    ],
  },
  {
    value: 'influencer-center',
    label: '인플루언서 마케팅 센터',
    icon: UsersIcon,
    wide: true,
    breakLabel: true,
    groups: [
      {
        key: 'main',
        items: [
          { href: '/influencer-center/branded', label: '브랜디드 콘텐츠 대시보드', badge: 'new' },
          { href: '/influencer-center/ad-code', label: '파트너십 데이터', badge: 'new' },
          { href: '/influencer-center/pa', label: '파트너십 광고 성과 분석', badge: 'new' },
          { href: '/influencer-center/discovery', label: '인플루언서 탐색', badge: 'new' },
          { href: '/influencer-center/calendar', label: '인플루언서 마케팅 캘린더', badge: 'new' },
        ],
      },
    ],
  },
]

const BaseMenu = () => (
  <div className="flex flex-col gap-afds-spacing-4">
    <button
      type="button"
      className="flex cursor-pointer flex-col gap-afds-spacing-4 rounded-afds-sm px-afds-spacing-10 py-afds-spacing-8 text-left hover:bg-afds-interaction-hover-overlay"
    >
      <span className="title3 flex items-center justify-between text-afds-text-primary">
        홍길동
        <ChevronRightIcon size={16} className="size-4" />
      </span>
      <span className="title4 truncate text-afds-text-secondary">user@example.com</span>
    </button>
    <span className="title4 p-afds-spacing-10 text-afds-text-secondary">조직</span>
    <span className="block h-px bg-afds-divider-default" />
    <span className="title3 px-afds-spacing-10 py-afds-spacing-8 text-afds-text-secondary">
      Acme
    </span>
    <button
      type="button"
      className="title3 cursor-pointer rounded-afds-sm px-afds-spacing-10 py-afds-spacing-8 text-left text-afds-text-secondary hover:bg-afds-interaction-hover-overlay"
    >
      로그아웃
    </button>
  </div>
)

/** 워크스페이스 머리 영역 — 미선택 자리표시자·이미지 대체는 앱(=스토리) 쪽 판단이다 */
const WorkspaceHeader = ({ name, render }: { name?: string; render: ReactElement }) =>
  name ? (
    <Lnb.Header
      media={<ImageIcon className="size-afds-spacing-44" />}
      label={name}
      render={render}
    />
  ) : (
    <Lnb.Header
      media={
        <span className="flex size-full items-center justify-center rounded-afds-md border border-dashed border-afds-text-lnb-default bg-afds-interaction-pressed-overlay text-afds-text-lnb-default">
          <PlusIcon size={16} className="size-4" />
        </span>
      }
      label="워크스페이스"
    />
  )

const SamplePage = ({ title }: { title: string }) => (
  <PageLayout>
    <PageLayout.Header>
      <PageLayout.Header.Title>{title}</PageLayout.Header.Title>
      <PageLayout.Header.Actions>
        <Button variant="fill">새로 만들기</Button>
      </PageLayout.Header.Actions>
    </PageLayout.Header>
    <PageLayout.Contents cols={12}>
      {Array.from({ length: 6 }, (_, index) => (
        <PageLayout.Contents.Section key={index} colSpan={4}>
          <div className="h-40 rounded-afds-md border border-afds-border-default bg-afds-bg-surface-sunken" />
        </PageLayout.Contents.Section>
      ))}
    </PageLayout.Contents>
  </PageLayout>
)

interface DemoProps extends Partial<LnbRootProps> {
  theme?: LnbTheme
  /** false 면 워크스페이스 미선택 — 카드가 자리표시자가 되고 메뉴가 비활성이 된다 */
  workspaceSelected?: boolean
  /** false 면 워크스페이스 카드를 그리지 않는다 (xap) */
  showWorkspace?: boolean
  /** false 면 LNB 를 그리지 않는다 (MAKER 역할) */
  showNav?: boolean
  /** 펼침에서 처음 열려 있을 섹션 */
  defaultOpenSection?: string
  content?: ReactNode
}

/** 소비처가 하는 조립을 그대로 보여준다. 링크는 이동 대신 선택 상태만 바꾼다 */
const LnbDemo = ({
  theme = 'gradient',
  workspaceSelected = true,
  showWorkspace = true,
  showNav = true,
  defaultOpenSection,
  content,
  ...rootProps
}: DemoProps) => {
  const [selectedHref, setSelectedHref] = useState('/creative-center/insight')
  const disabled = !workspaceSelected

  /* 링크 동작은 조립하는 쪽이 정한다 — 스토리에서는 이동 대신 선택만 바꾼다 */
  const link = (href: string) => (
    <a
      href={href}
      onClick={event => {
        event.preventDefault()
        setSelectedHref(href)
      }}
    />
  )

  const renderSection = (section: SectionDef) => (
    <Lnb.Section
      key={section.value}
      value={section.value}
      icon={section.icon}
      label={section.label}
      disabled={disabled}
      breakLabel={section.breakLabel}
      dropdownClassName={section.wide ? 'w-max min-w-45' : undefined}
      selected={selectedHref.startsWith(`/${section.value}`)}
    >
      {section.groups.map(group => (
        <Lnb.SubGroup key={group.key} label={group.label}>
          {group.items.map(item => (
            <Lnb.SubItem
              key={item.href}
              selected={selectedHref === item.href}
              badge={
                item.badge && (
                  <Lnb.Badge variant={item.badge === 'new' ? 'gradient' : 'subtle'}>
                    <Lnb.Badge.Content>{item.badge === 'new' ? 'New' : 'Beta'}</Lnb.Badge.Content>
                  </Lnb.Badge>
                )
              }
              render={link(item.href)}
            >
              {item.label}
            </Lnb.SubItem>
          ))}
        </Lnb.SubGroup>
      ))}
    </Lnb.Section>
  )

  return (
    <Lnb.Root {...rootProps}>
      {showNav && (
        <Lnb.Nav>
          <Lnb.TopMenu>
            <Lnb.Dropdown icon={PanelLeftIcon} label="기본 메뉴">
              <BaseMenu />
            </Lnb.Dropdown>
            <Lnb.Dropdown
              icon={BellIcon}
              label="알림 센터"
              contentClassName="w-80 gap-afds-spacing-8 rounded-afds-md p-afds-spacing-20"
            >
              <Typography variant="title3">알림 센터</Typography>
              <Typography variant="body2" color="text-secondary">
                새 알림이 없습니다.
              </Typography>
            </Lnb.Dropdown>
          </Lnb.TopMenu>

          <Lnb.MainMenu theme={theme}>
            {showWorkspace && (
              <WorkspaceHeader
                name={workspaceSelected ? 'Acme 마케팅팀' : undefined}
                render={link('/workspaces')}
              />
            )}

            <Lnb.ScrollArea defaultOpenSection={defaultOpenSection}>
              <Lnb.Item
                icon={HouseIcon}
                label="홈"
                disabled={disabled}
                selected={selectedHref === '/home'}
                render={link('/home')}
              />
              {SECTIONS.slice(0, 3).map(renderSection)}
              <Lnb.Item
                icon={MegaphoneIcon}
                label="자산 관리"
                disabled={disabled}
                selected={selectedHref === '/media-accounts'}
                render={link('/media-accounts')}
              />
              {SECTIONS.slice(3).map(renderSection)}
            </Lnb.ScrollArea>

            <Lnb.Footer>
              <Lnb.Item
                icon={CircleUserIcon}
                label="사용자 관리"
                disabled={disabled}
                selected={selectedHref === '/users'}
                render={link('/users')}
              />
              <Lnb.Item
                icon={SettingsIcon}
                label="설정"
                disabled={disabled}
                selected={selectedHref === '/setting'}
                render={link('/setting')}
              />
              <Lnb.Item
                icon={BookOpenIcon}
                label="이용 가이드"
                render={<a href="https://help.example.com" target="_blank" rel="noreferrer" />}
              />
            </Lnb.Footer>
          </Lnb.MainMenu>
        </Lnb.Nav>
      )}

      <Lnb.Content>{content ?? <SamplePage title={selectedHref} />}</Lnb.Content>
    </Lnb.Root>
  )
}

export const Default: Story = {
  render: args => <LnbDemo {...args} />,
}

export const Expanded: Story = {
  render: args => <LnbDemo {...args} defaultExpanded defaultOpenSection="creative-center" />,
}

/** xap(관리자) 화면 — 메인 메뉴가 밝은 테마이고 워크스페이스 카드가 없다 */
export const WhiteTheme: Story = {
  render: args => <LnbDemo {...args} theme="white" showWorkspace={false} defaultExpanded />,
}

/** 워크스페이스 미선택 — 메뉴가 비활성이고 카드가 자리표시자로 바뀐다 */
export const WorkspaceNotSelected: Story = {
  render: args => <LnbDemo {...args} workspaceSelected={false} defaultExpanded />,
}

/** LNB 없이 콘텐츠만 — `Lnb.Nav` 를 렌더하지 않는다 (MAKER 역할) */
export const WithoutNav: Story = {
  render: args => <LnbDemo {...args} showNav={false} />,
}

/** 콘텐츠가 길면 LNB 는 고정되고 콘텐츠 영역만 스크롤된다 */
export const LongContent: Story = {
  render: args => (
    <LnbDemo
      {...args}
      content={
        <div className="flex flex-col gap-afds-spacing-20 p-afds-spacing-20">
          {Array.from({ length: 60 }, (_, index) => (
            <Typography key={index} variant="body2">
              콘텐츠 {index + 1}
            </Typography>
          ))}
        </div>
      }
    />
  ),
}

/** 펼침 상태를 바깥에서 제어한다 — 예: LNB 폭을 다른 영역에 알려야 할 때 */
export const Controlled: Story = {
  render: function Render(args) {
    const [expanded, setExpanded] = useState(false)
    return (
      <LnbDemo
        {...args}
        expanded={expanded}
        onExpandedChange={setExpanded}
        content={
          <div className="flex flex-col items-start gap-afds-spacing-10 p-afds-spacing-20">
            <Typography variant="body2">expanded: {String(expanded)}</Typography>
            <Button variant="primary-line" onClick={() => setExpanded(current => !current)}>
              바깥에서 토글
            </Button>
          </div>
        }
      />
    )
  },
}
