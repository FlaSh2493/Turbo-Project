'use client'

import {
  cloneElement,
  createContext,
  createElement,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ComponentPropsWithoutRef,
  type ComponentType,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from 'react'
import { ChevronRightIcon, DotIcon } from 'lucide-react'
import {
  Accordion,
  Popover,
  ScrollArea,
  SquareBadge,
  type PopoverContentProps,
  type SquareBadgeContentProps,
  type SquareBadgeRootProps,
} from '@turbo-project/afds/bricks'
import { cn } from '@turbo-project/afds/lib/utils'
import {
  lnbAccordionRootBase,
  lnbBadgeContentBase,
  lnbBadgeVariants,
  lnbContentBase,
  lnbDropdownPanelBase,
  lnbDropdownPopupBase,
  lnbExpandedItemLabelBase,
  lnbExpandedItemVariants,
  lnbFooterVariants,
  lnbHeaderBase,
  lnbHeaderLabelBase,
  lnbHeaderMediaBase,
  lnbItemIconBase,
  lnbMainMenuVariants,
  lnbMinimizedIconBoxVariants,
  lnbMinimizedItemVariants,
  lnbMinimizedLabelVariants,
  lnbNavBase,
  lnbNavClipBase,
  lnbPanelVariants,
  lnbRootBase,
  lnbScrollAreaContentVariants,
  lnbScrollAreaRootVariants,
  lnbScrollBarStyle,
  lnbSectionBodyBase,
  lnbSectionContentVariants,
  lnbSectionIndicatorBase,
  lnbSectionItemBase,
  lnbSectionTriggerBase,
  lnbSubGroupDividerBase,
  lnbSubGroupLabelVariants,
  lnbSubGroupVariants,
  lnbSubItemDotBase,
  lnbSubItemLabelVariants,
  lnbSubItemVariants,
  lnbToggleBase,
  lnbToggleIconBase,
  lnbTopMenuVariants,
} from './lnb.style'

// Types

/** lucide-react 아이콘 컴포넌트와 같은 모양 */
export type LnbIcon = ComponentType<ComponentPropsWithoutRef<'svg'>>

export type LnbTheme = 'gradient' | 'white'

export type LnbPortalContainer = PopoverContentProps['container']

type LnbMode = 'expanded' | 'minimized'

// Context

interface LnbRootContextValue {
  expanded: boolean
  /** 화면에 그릴 모양. 접히는 애니메이션 동안은 펼친 모양을 유지한다 */
  mode: LnbMode
  toggle: () => void
  popoverContainer?: LnbPortalContainer
}

const LnbRootContext = createContext<LnbRootContextValue | null>(null)

const useLnbRoot = () => {
  const context = useContext(LnbRootContext)
  if (!context) throw new Error('Lnb components must be used within Lnb.Root')
  return context
}

/** 가장 가까운 TopMenu(항상 white) / MainMenu 의 테마 */
const LnbThemeContext = createContext<LnbTheme>('white')

/** 드롭다운 안에 있으면 닫기 함수가 들어온다. 하위 항목을 고르면 드롭다운을 닫는 데 쓴다 */
const LnbDropdownContext = createContext<(() => void) | null>(null)

// render

type RenderableProps = {
  className?: string
  onClick?: (event: MouseEvent) => void
  children?: ReactNode
}

/**
 * `render` 로 받은 element(라우터 Link 등)를 이 sub-part 의 루트로 쓴다.
 * className 은 합치고 onClick 은 둘 다 부른다. 없으면 `fallbackTag` 로 루트를 만든다.
 */
const renderRoot = (
  render: ReactElement | undefined,
  fallbackTag: 'button' | 'div',
  props: RenderableProps & Record<string, unknown>,
) => {
  if (!render) {
    return createElement(fallbackTag, {
      ...(fallbackTag === 'button' && { type: 'button' }),
      ...props,
    })
  }

  const element = render as ReactElement<RenderableProps>
  const own = element.props
  return cloneElement(element, {
    ...props,
    className: cn(props.className, own.className),
    onClick: (event: MouseEvent) => {
      own.onClick?.(event)
      props.onClick?.(event)
    },
  })
}

// Root

export interface LnbRootProps {
  children: ReactNode
  expanded?: boolean
  defaultExpanded?: boolean
  onExpandedChange?: (expanded: boolean) => void
  /** 드롭다운 포털 위치. 미지정 시 AfdsScope → document.body */
  popoverContainer?: LnbPortalContainer
  className?: string
}

/** 접는 애니메이션 시간 — lnbNavBase 의 duration-300 과 같아야 한다 */
const COLLAPSE_DURATION_MS = 300

/** 화면 전체 레이아웃 — `Lnb.Nav` 와 `Lnb.Content` 를 가로로 놓는다. 펼침 상태를 갖는다 */
const LnbRoot = forwardRef<HTMLDivElement, LnbRootProps>(
  (
    {
      children,
      expanded: controlledExpanded,
      defaultExpanded = false,
      onExpandedChange,
      popoverContainer,
      className,
    },
    ref,
  ) => {
    const [uncontrolledExpanded, setUncontrolledExpanded] = useState(defaultExpanded)
    const expanded = controlledExpanded ?? uncontrolledExpanded

    /* 접힐 때는 폭이 줄어드는 동안 펼친 모양을 유지하다가 끝나면 접힌 모양으로 바꾼다 (원본 동작) */
    const [collapsing, setCollapsing] = useState(false)
    const [prevExpanded, setPrevExpanded] = useState(expanded)
    if (prevExpanded !== expanded) {
      setPrevExpanded(expanded)
      setCollapsing(!expanded)
    }
    useEffect(() => {
      if (!collapsing) return
      const timer = setTimeout(() => setCollapsing(false), COLLAPSE_DURATION_MS)
      return () => clearTimeout(timer)
    }, [collapsing])

    const toggle = useCallback(() => {
      const next = !expanded
      if (controlledExpanded === undefined) setUncontrolledExpanded(next)
      onExpandedChange?.(next)
    }, [expanded, controlledExpanded, onExpandedChange])

    const mode: LnbMode = expanded || collapsing ? 'expanded' : 'minimized'

    const contextValue = useMemo(
      () => ({ expanded, mode, toggle, popoverContainer }),
      [expanded, mode, toggle, popoverContainer],
    )

    return (
      <LnbRootContext.Provider value={contextValue}>
        <div ref={ref} data-slot="lnb" className={cn(lnbRootBase, className)}>
          {children}
        </div>
      </LnbRootContext.Provider>
    )
  },
)
LnbRoot.displayName = 'Lnb.Root'

// Nav

export interface LnbNavProps {
  children: ReactNode
  /** 접기/펼치기 버튼의 접근성 이름 */
  expandLabel?: string
  collapseLabel?: string
  className?: string
}

/**
 * LNB 영역. 접힘 60px ↔ 펼침 220px 로 폭이 바뀌고, 넘치는 부분은 잘라 펼침 모양이 미끄러지듯 드러난다.
 * 접기/펼치기 버튼은 잘리지 않도록 이 안에서 그린다.
 */
const LnbNav = forwardRef<HTMLElement, LnbNavProps>(
  (
    {
      children,
      expandLabel = 'Expand navigation',
      collapseLabel = 'Collapse navigation',
      className,
    },
    ref,
  ) => {
    const { expanded, mode, toggle } = useLnbRoot()

    return (
      <nav
        ref={ref}
        data-slot="lnb-nav"
        data-state={expanded ? 'open' : 'closed'}
        className={cn(lnbNavBase, className)}
      >
        <div className={lnbNavClipBase}>
          <div data-slot="lnb-panel" data-mode={mode} className={lnbPanelVariants({ mode })}>
            {children}
          </div>
        </div>
        <button
          type="button"
          data-slot="lnb-toggle"
          aria-label={expanded ? collapseLabel : expandLabel}
          aria-expanded={expanded}
          onClick={toggle}
          className={lnbToggleBase}
        >
          <ChevronRightIcon size={16} className={lnbToggleIconBase} />
        </button>
      </nav>
    )
  },
)
LnbNav.displayName = 'Lnb.Nav'

// TopMenu

export interface LnbTopMenuProps {
  children: ReactNode
  className?: string
}

/** 상단 밝은 영역 — 테마와 무관하게 항상 white 다 (원본 동작) */
const LnbTopMenu = ({ children, className }: LnbTopMenuProps) => {
  const { mode } = useLnbRoot()

  return (
    <LnbThemeContext.Provider value="white">
      <div data-slot="lnb-top-menu" className={cn(lnbTopMenuVariants({ mode }), className)}>
        {children}
      </div>
    </LnbThemeContext.Provider>
  )
}
LnbTopMenu.displayName = 'Lnb.TopMenu'

// MainMenu

export interface LnbMainMenuProps {
  children: ReactNode
  /** 메인 메뉴 색 — `gradient` 남색 그라데이션 / `white` 밝은 회색 */
  theme?: LnbTheme
  className?: string
}

/** 메인 메뉴 영역. 안에 `Header` · `ScrollArea` · `Footer` 를 차례로 둔다 */
const LnbMainMenu = ({ children, theme = 'gradient', className }: LnbMainMenuProps) => {
  const { mode } = useLnbRoot()

  return (
    <LnbThemeContext.Provider value={theme}>
      <div
        data-slot="lnb-main-menu"
        className={cn(lnbMainMenuVariants({ theme, mode }), className)}
      >
        {children}
      </div>
    </LnbThemeContext.Provider>
  )
}
LnbMainMenu.displayName = 'Lnb.MainMenu'

// ScrollArea

export interface LnbScrollAreaProps {
  children: ReactNode
  /** 펼침에서 열려 있는 섹션의 `value`. 한 번에 하나만 열린다 */
  openSection?: string | null
  defaultOpenSection?: string | null
  onOpenSectionChange?: (value: string | null) => void
  className?: string
}

/**
 * 메뉴 목록 스크롤 영역 — AFDS ScrollArea. 남은 높이를 채운다.
 * 스크롤바는 메뉴 위에 뜨고(overlay), 접힘에서는 숨긴다 (원본 동작).
 * 펼침에서는 아코디언 루트가 되어 `Lnb.Section` 을 한 번에 하나만 연다.
 */
const LnbScrollArea = ({
  children,
  openSection,
  defaultOpenSection = null,
  onOpenSectionChange,
  className,
}: LnbScrollAreaProps) => {
  const { mode } = useLnbRoot()

  return (
    <ScrollArea
      data-slot="lnb-scroll-area"
      gutter="overlay"
      offsetYStart={0}
      offsetYEnd={0}
      hideHorizontal
      hideVertical={mode === 'minimized'}
      scrollBarVerticalStyle={lnbScrollBarStyle}
      className={cn(lnbScrollAreaRootVariants({ mode }), className)}
      contentClassName={lnbScrollAreaContentVariants({ mode })}
    >
      {mode === 'expanded' ? (
        <Accordion.Root
          multiple={false}
          {...(openSection !== undefined && { value: openSection ? [openSection] : [] })}
          defaultValue={defaultOpenSection ? [defaultOpenSection] : []}
          onValueChange={value => onOpenSectionChange?.((value[0] as string | undefined) ?? null)}
          className={lnbAccordionRootBase}
        >
          {children}
        </Accordion.Root>
      ) : (
        children
      )}
    </ScrollArea>
  )
}
LnbScrollArea.displayName = 'Lnb.ScrollArea'

// Footer

export interface LnbFooterProps {
  children: ReactNode
  className?: string
}

/** 메인 메뉴 하단 고정 영역 */
const LnbFooter = ({ children, className }: LnbFooterProps) => {
  const { mode } = useLnbRoot()

  return (
    <div data-slot="lnb-footer" className={cn(lnbFooterVariants({ mode }), className)}>
      {children}
    </div>
  )
}
LnbFooter.displayName = 'Lnb.Footer'

// Item visuals

const ExpandedItemContent = ({
  icon: Icon,
  label,
  addOn,
}: {
  icon: LnbIcon
  label: ReactNode
  addOn?: ReactNode
}) => (
  <>
    <Icon className={lnbItemIconBase} />
    <span className={lnbExpandedItemLabelBase}>{label}</span>
    {addOn}
  </>
)

const MinimizedItemContent = ({
  icon: Icon,
  label,
  srLabel,
  selected,
  breakLabel,
  theme,
}: {
  icon: LnbIcon
  label?: ReactNode
  /** 화면에 그리지 않고 접근성 이름으로만 쓰는 라벨 (접힘 상단 메뉴) */
  srLabel?: ReactNode
  selected?: boolean
  breakLabel?: boolean
  theme: LnbTheme
}) => (
  <>
    <span className={lnbMinimizedIconBoxVariants({ theme, selected })}>
      <Icon className={lnbItemIconBase} />
    </span>
    {label && <span className={lnbMinimizedLabelVariants({ breakLabel })}>{label}</span>}
    {srLabel && <span className="sr-only">{srLabel}</span>}
  </>
)

// Item

export interface LnbItemProps {
  icon: LnbIcon
  label: ReactNode
  selected?: boolean
  /** 비활성이면 `render` 대신 span 으로 그려 이동을 막는다 */
  disabled?: boolean
  /** 접힘 레일 라벨이 한 줄에 안 들어갈 때 줄바꿈시킨다 */
  breakLabel?: boolean
  /**
   * 이 항목의 루트 element 를 치환한다 — 보통 라우터 Link (`render={<Link to="/" />}`).
   * 새 탭 열기 등 링크 동작은 넘기는 element 가 정한다. 없으면 `<button>`.
   */
  render?: ReactElement
  onClick?: () => void
  className?: string
}

/** 하위가 없는 메뉴 한 칸. 펼침은 가로 한 줄, 접힘은 아이콘 + hover 라벨 */
const LnbItem = ({
  icon,
  label,
  selected,
  disabled,
  breakLabel,
  render,
  onClick,
  className,
}: LnbItemProps) => {
  const { mode } = useLnbRoot()
  const theme = useContext(LnbThemeContext)

  const itemClassName = cn(
    mode === 'expanded'
      ? lnbExpandedItemVariants({ theme, selected, disabled })
      : lnbMinimizedItemVariants({ theme, disabled }),
    className,
  )
  const content =
    mode === 'expanded' ? (
      <ExpandedItemContent icon={icon} label={label} />
    ) : (
      <MinimizedItemContent
        icon={icon}
        label={label}
        selected={selected}
        breakLabel={breakLabel}
        theme={theme}
      />
    )

  if (disabled) {
    return (
      <span data-slot="lnb-item" aria-disabled="true" className={itemClassName}>
        {content}
      </span>
    )
  }

  return renderRoot(render, 'button', {
    'data-slot': 'lnb-item',
    ...(selected && { 'aria-current': 'page' }),
    className: itemClassName,
    onClick,
    children: content,
  })
}
LnbItem.displayName = 'Lnb.Item'

// Dropdown

interface DropdownShellProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  disabled?: boolean
  triggerClassName: string
  trigger: ReactNode
  panelClassName?: string
  container?: LnbPortalContainer
  children: ReactNode
}

/** 오른쪽으로 뜨는 드롭다운. Popover.Content 는 위치만 잡고 실제 패널은 안쪽 div 가 그린다 */
const DropdownShell = ({
  open,
  onOpenChange,
  disabled = false,
  triggerClassName,
  trigger,
  panelClassName,
  container,
  children,
}: DropdownShellProps) => {
  const { popoverContainer } = useLnbRoot()
  const close = useCallback(() => onOpenChange(false), [onOpenChange])

  return (
    <Popover.Root
      open={open}
      onOpenChange={next => {
        if (!disabled) onOpenChange(next)
      }}
    >
      <Popover.Trigger disabled={disabled} className={triggerClassName}>
        {trigger}
      </Popover.Trigger>
      <Popover.Content
        side="right"
        align="start"
        sideOffset={12}
        container={container ?? popoverContainer}
        className={lnbDropdownPopupBase}
      >
        <div data-slot="lnb-dropdown" className={cn(lnbDropdownPanelBase, panelClassName)}>
          <LnbDropdownContext.Provider value={close}>{children}</LnbDropdownContext.Provider>
        </div>
      </Popover.Content>
    </Popover.Root>
  )
}

/** controlled/uncontrolled 열림 상태 */
const useOpenState = (
  open: boolean | undefined,
  defaultOpen: boolean,
  onOpenChange?: (open: boolean) => void,
) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen)
  const setOpen = useCallback(
    (next: boolean) => {
      if (open === undefined) setUncontrolledOpen(next)
      onOpenChange?.(next)
    },
    [open, onOpenChange],
  )
  return [open ?? uncontrolledOpen, setOpen] as const
}

export interface LnbDropdownProps {
  icon: LnbIcon
  label: ReactNode
  /** 드롭다운 안에 그릴 내용. 안의 `Lnb.SubItem` 을 고르면 닫힌다 */
  children: ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** 패널 className. 폭이 다른 콘텐츠는 여기서 바꾼다 */
  contentClassName?: string
  /** 이 드롭다운만 다른 곳에 포털해야 할 때 (예: AFDS 스코프 밖 콘텐츠) */
  container?: LnbPortalContainer
}

/** 아이콘 메뉴를 누르면 오른쪽에 패널이 뜬다 — 상단 메뉴에 쓴다 */
const LnbDropdown = ({
  icon,
  label,
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  contentClassName,
  container,
}: LnbDropdownProps) => {
  const { mode } = useLnbRoot()
  const theme = useContext(LnbThemeContext)
  const [open, setOpen] = useOpenState(controlledOpen, defaultOpen, onOpenChange)

  return (
    <DropdownShell
      open={open}
      onOpenChange={setOpen}
      container={container}
      panelClassName={contentClassName}
      triggerClassName={
        mode === 'expanded'
          ? lnbExpandedItemVariants({ theme })
          : lnbMinimizedItemVariants({ theme })
      }
      trigger={
        mode === 'expanded' ? (
          <ExpandedItemContent icon={icon} label={label} />
        ) : (
          <MinimizedItemContent icon={icon} srLabel={label} theme={theme} />
        )
      }
    >
      {children}
    </DropdownShell>
  )
}
LnbDropdown.displayName = 'Lnb.Dropdown'

// Section

export interface LnbSectionProps {
  /** 섹션 식별자. 펼침 아코디언의 열림 상태에 쓴다 */
  value: string
  icon: LnbIcon
  label: ReactNode
  /** `Lnb.SubGroup` 들 */
  children: ReactNode
  selected?: boolean
  disabled?: boolean
  /** 접힘 레일 라벨이 한 줄에 안 들어갈 때 줄바꿈시킨다 */
  breakLabel?: boolean
  /** 접힘 드롭다운 패널 className (예: 항목이 길면 `w-max`) */
  dropdownClassName?: string
}

/**
 * 하위 메뉴가 있는 섹션. 펼침에서는 아코디언, 접힘에서는 오른쪽 드롭다운이 된다.
 * 펼침에서는 아코디언 루트인 `Lnb.ScrollArea` 안에 둔다.
 */
const LnbSection = ({
  value,
  icon,
  label,
  children,
  selected,
  disabled,
  breakLabel,
  dropdownClassName,
}: LnbSectionProps) => {
  const { mode } = useLnbRoot()
  const theme = useContext(LnbThemeContext)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  if (mode === 'minimized') {
    return (
      <DropdownShell
        open={dropdownOpen}
        onOpenChange={setDropdownOpen}
        disabled={disabled}
        panelClassName={dropdownClassName}
        triggerClassName={lnbMinimizedItemVariants({ theme, disabled })}
        trigger={
          <MinimizedItemContent
            icon={icon}
            label={label}
            selected={selected}
            breakLabel={breakLabel}
            theme={theme}
          />
        }
      >
        {children}
      </DropdownShell>
    )
  }

  return (
    <Accordion.Item
      value={value}
      disabled={disabled}
      data-slot="lnb-section"
      className={lnbSectionItemBase}
    >
      <Accordion.Trigger
        className={cn(
          lnbExpandedItemVariants({ theme, selected, disabled }),
          lnbSectionTriggerBase,
        )}
      >
        <ExpandedItemContent
          icon={icon}
          label={label}
          addOn={<Accordion.Indicator className={lnbSectionIndicatorBase} />}
        />
      </Accordion.Trigger>
      <Accordion.Content className={lnbSectionContentVariants({ theme })}>
        <div className={lnbSectionBodyBase}>{children}</div>
      </Accordion.Content>
    </Accordion.Item>
  )
}
LnbSection.displayName = 'Lnb.Section'

// SubGroup

export interface LnbSubGroupProps {
  /** 그룹 라벨. 펼침은 작은 제목, 접힘 드롭다운은 제목 + 구분선 */
  label?: ReactNode
  /** `Lnb.SubItem` 들 */
  children: ReactNode
}

const LnbSubGroup = ({ label, children }: LnbSubGroupProps) => {
  const placement = useContext(LnbDropdownContext) ? 'dropdown' : 'section'
  const theme = useContext(LnbThemeContext)

  return (
    <div data-slot="lnb-sub-group" className={lnbSubGroupVariants({ placement })}>
      {label && <span className={lnbSubGroupLabelVariants({ placement, theme })}>{label}</span>}
      {label && placement === 'dropdown' && <span className={lnbSubGroupDividerBase} />}
      {children}
    </div>
  )
}
LnbSubGroup.displayName = 'Lnb.SubGroup'

// SubItem

export interface LnbSubItemProps {
  children: ReactNode
  selected?: boolean
  /** 라벨 오른쪽 부가 요소 — 보통 `<Lnb.Badge>` */
  badge?: ReactNode
  /** 이 항목의 루트 element 를 치환한다 — 보통 라우터 Link. 없으면 `<button>` */
  render?: ReactElement
  onClick?: () => void
}

/** 섹션 안의 하위 링크. 접힘 드롭다운에서 고르면 드롭다운이 닫힌다 */
const LnbSubItem = ({ children, selected, badge, render, onClick }: LnbSubItemProps) => {
  const closeDropdown = useContext(LnbDropdownContext)
  const theme = useContext(LnbThemeContext)
  const placement = closeDropdown ? 'dropdown' : 'section'

  return renderRoot(render, 'button', {
    'data-slot': 'lnb-sub-item',
    ...(selected && { 'aria-current': 'page' }),
    className: lnbSubItemVariants({ placement, theme, selected, withBadge: badge != null }),
    onClick: () => {
      onClick?.()
      closeDropdown?.()
    },
    children: (
      <>
        {placement === 'section' && <DotIcon size={16} className={lnbSubItemDotBase} />}
        <span className={lnbSubItemLabelVariants({ placement })}>{children}</span>
        {badge}
      </>
    ),
  })
}
LnbSubItem.displayName = 'Lnb.SubItem'

// Badge

export interface LnbBadgeProps extends Omit<SquareBadgeRootProps, 'variant'> {
  /** 배지 모양 — `gradient` 그라데이션 / `subtle` 반투명(어두운 메뉴·밝은 드롭다운에 맞춰 바뀐다) */
  variant: 'gradient' | 'subtle'
  /** 보통 `<Lnb.Badge.Content>` */
  children: ReactNode
}

/** AFDS SquareBadge 위에 원본 LNB 배지 모양을 입힌다 */
const LnbBadgeRoot = ({ variant, className, ...props }: LnbBadgeProps) => {
  const surface = useContext(LnbDropdownContext) ? 'light' : 'dark'

  return (
    <SquareBadge.Root
      data-slot="lnb-badge"
      variant="filled"
      color={variant === 'gradient' ? 'gradient-ai' : 'neutral'}
      className={cn(lnbBadgeVariants({ variant, surface }), className)}
      {...props}
    />
  )
}
LnbBadgeRoot.displayName = 'Lnb.Badge'

export type LnbBadgeContentProps = SquareBadgeContentProps

/** 배지 글자 */
const LnbBadgeContent = ({ className, ...props }: LnbBadgeContentProps) => (
  <SquareBadge.Content
    data-slot="lnb-badge-content"
    className={cn(lnbBadgeContentBase, className)}
    {...props}
  />
)
LnbBadgeContent.displayName = 'Lnb.Badge.Content'

const LnbBadge = Object.assign(LnbBadgeRoot, { Content: LnbBadgeContent })

// Header

export interface LnbHeaderProps {
  /** 44px 정사각 자리에 그릴 이미지·아이콘 */
  media: ReactNode
  /** 펼침에서만 보이는 라벨 */
  label?: ReactNode
  /** 루트 element 를 치환한다 — 보통 라우터 Link. 없으면 `<div>` */
  render?: ReactElement
  onClick?: () => void
  className?: string
}

/**
 * 메인 메뉴 맨 위 머리 영역 — 44px 이미지 + 라벨(펼침에서만).
 * 무엇을 보여줄지는 조립하는 쪽이 정한다.
 */
const LnbHeader = ({ media, label, render, onClick, className }: LnbHeaderProps) => {
  const { mode } = useLnbRoot()

  return renderRoot(render, 'div', {
    'data-slot': 'lnb-header',
    className: cn(lnbHeaderBase, className),
    onClick,
    children: (
      <>
        <span className={lnbHeaderMediaBase}>{media}</span>
        {mode === 'expanded' && label != null && (
          <span className={lnbHeaderLabelBase}>{label}</span>
        )}
      </>
    ),
  })
}
LnbHeader.displayName = 'Lnb.Header'

// Content

export interface LnbContentProps {
  children: ReactNode
  className?: string
}

/**
 * 페이지 콘텐츠 영역. 남은 폭을 채우고 자체 스크롤한다.
 * 원격 앱을 여기 마운트한다면 AFDS 스코프(AfdsScope) 밖에 둘지는 소비처가 정한다.
 */
const LnbContent = forwardRef<HTMLElement, LnbContentProps>(({ children, className }, ref) => (
  <main ref={ref} data-slot="lnb-content" className={cn(lnbContentBase, className)}>
    {children}
  </main>
))
LnbContent.displayName = 'Lnb.Content'

// Compound Component Assembly

export const Lnb = {
  Root: LnbRoot,
  Nav: LnbNav,
  TopMenu: LnbTopMenu,
  Dropdown: LnbDropdown,
  MainMenu: LnbMainMenu,
  Header: LnbHeader,
  ScrollArea: LnbScrollArea,
  Item: LnbItem,
  Section: LnbSection,
  SubGroup: LnbSubGroup,
  SubItem: LnbSubItem,
  Badge: LnbBadge,
  Footer: LnbFooter,
  Content: LnbContent,
}
