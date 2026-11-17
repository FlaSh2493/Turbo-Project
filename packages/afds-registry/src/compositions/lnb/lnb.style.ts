import type { CSSProperties } from 'react'
import { cva } from 'class-variance-authority'

/*
 * LNB 스타일. 값은 원본 원본 디자인 시안의 LNB에서 대조했다.
 * 토큰이 없는 값은 원본 값을 그대로 쓰고, 그 자리에 이유를 적는다.
 *
 * variant 축
 * - theme: 메인 메뉴 색. gradient(남색 그라데이션) / white(밝은 회색). 상단 메뉴는 항상 white 다
 * - mode: 펼침(expanded, 220px) / 접힘(minimized, 60px)
 * - placement: 하위 메뉴가 펼침 아코디언(section) 안인지, 접힘·상단 드롭다운(dropdown) 안인지
 */

// Root · Nav

export const lnbRootBase = 'flex h-screen'

export const lnbNavBase =
  'group/lnb relative h-full w-afds-spacing-60 min-w-afds-spacing-60 shrink-0 transition-all duration-300 ease-in-out data-[state=open]:w-55 data-[state=open]:min-w-55'

/** 폭이 바뀌는 동안 넘치는 펼침 모양을 잘라낸다 */
export const lnbNavClipBase = 'h-full w-full overflow-hidden'

export const lnbPanelVariants = cva('flex h-full select-none flex-col', {
  variants: {
    mode: {
      expanded: 'w-55',
      minimized: 'w-afds-spacing-60',
    },
  },
})

/*
 * 원본 IconButton(line · circle · sm). 위치 top 45px · z-index 999(원본 Z_INDEX_NAV)는 토큰이 없어 원본 값이다.
 * 가로는 원본 left 48px / 208px(열림) = LNB 오른쪽 끝에 버튼 절반이 걸친 자리다.
 * 아이콘색 gray600 은 대응하는 semantic 토큰이 없어 primitive 를 쓴다.
 */
export const lnbToggleBase =
  'absolute right-0 top-[45px] z-[999] flex size-6 translate-x-1/2 cursor-pointer items-center justify-center rounded-full border border-afds-border-strong bg-afds-bg-surface text-afds-gray-600 opacity-0 transition-opacity duration-300 ease-in-out hover:bg-linear-to-t hover:from-afds-interaction-hover-overlay hover:to-afds-interaction-hover-overlay focus-visible:opacity-100 active:text-afds-icon-primary group-hover/lnb:opacity-100'

export const lnbToggleIconBase =
  'size-4 transition-transform duration-300 ease-in-out group-data-[state=open]/lnb:-rotate-180'

// TopMenu · MainMenu

const modeAlign = {
  expanded: '',
  minimized: 'items-center',
}

/** 상단 밝은 영역 — 테마와 무관하게 항상 white 다 (원본 동작) */
export const lnbTopMenuVariants = cva(
  'flex flex-col gap-afds-spacing-10 bg-afds-bg-surface-sunken p-afds-spacing-8 text-afds-text-secondary ring-1 ring-afds-border-default ring-inset',
  { variants: { mode: modeAlign } },
)

export const lnbMainMenuVariants = cva(
  'flex min-h-0 grow flex-col px-afds-spacing-8 pt-afds-spacing-8',
  {
    variants: {
      theme: {
        gradient:
          'bg-linear-to-t from-afds-extra-ui-darknavy to-afds-extra-ui-navy text-afds-text-lnb-default',
        white:
          'bg-afds-bg-surface-sunken text-afds-text-secondary ring-1 ring-afds-border-default ring-inset',
      },
      mode: modeAlign,
    },
  },
)

// ScrollArea · Footer

/*
 * AFDS ScrollArea 루트 — 남은 높이를 채운다.
 * 원본 스크롤바 thumb 색 rgba(34,34,34,0.3) 은 토큰이 없어 원본 값이다 (AFDS 기본 gray-400 을 덮는다)
 */
export const lnbScrollAreaRootVariants = cva('min-h-0 flex-1', {
  variants: {
    mode: {
      expanded: '[&_[data-slot=scroll-thumb]]:bg-[rgba(34,34,34,0.3)]',
      minimized: 'w-full',
    },
  },
})

export const lnbScrollAreaContentVariants = cva('', {
  variants: {
    mode: {
      expanded: '',
      minimized: 'flex flex-col items-center gap-afds-spacing-4',
    },
  },
})

/**
 * 원본 스크롤바 두께 5px — AFDS 트랙은 좌우 5px 여백을 두므로 트랙 15px = thumb 5px.
 * 트랙 폭은 ScrollArea 가 Root 인라인 변수로 정의하므로 `scrollBarVerticalStyle` 로만 바꿀 수 있다.
 */
export const lnbScrollBarStyle = { '--scrollbar-track-size': '15px' } as unknown as CSSProperties

/** AFDS 아코디언 기본 간격(spacing-8)을 덮는다 — cn 이 커스텀 토큰 충돌을 못 풀어 ! 를 쓴다 */
export const lnbAccordionRootBase = 'gap-afds-spacing-20!'

/* 원본 marginTop 16px · 접힘 항목 사이 -6px(isMarginBottomMinimized) — 토큰이 없어 원본 값이다 */
export const lnbFooterVariants = cva('mt-[16px] flex flex-col', {
  variants: {
    mode: {
      expanded: 'gap-afds-spacing-10 pb-afds-spacing-20',
      minimized: 'items-center pb-afds-spacing-4 *:not-last:mb-[-6px]',
    },
  },
})

// Item — 펼침

/*
 * 테마별 색. 원본은 CSS 변수(label / selected / hover)를 테마마다 갈아끼웠다.
 * 열림(아코디언 data-panel-open · 드롭다운 data-popup-open)은 hover 와 같은 음영 + 선택색이다.
 */
export const lnbExpandedItemVariants = cva(
  'flex w-51 cursor-pointer select-none items-center gap-afds-spacing-10 rounded-afds-md p-afds-spacing-10 text-left',
  {
    variants: {
      theme: {
        gradient:
          'text-afds-text-lnb-default hover:bg-afds-bg-lnb-selected data-[panel-open]:bg-afds-bg-lnb-selected data-[panel-open]:text-afds-text-inverse data-[popup-open]:bg-afds-bg-lnb-selected data-[popup-open]:text-afds-text-inverse',
        white:
          'text-afds-text-secondary hover:bg-afds-interaction-hover-overlay data-[panel-open]:bg-afds-interaction-hover-overlay data-[panel-open]:text-afds-text-primary data-[popup-open]:bg-afds-interaction-hover-overlay data-[popup-open]:text-afds-text-primary',
      },
      selected: { true: '', false: '' },
      disabled: { true: 'pointer-events-none cursor-default opacity-20', false: '' },
    },
    compoundVariants: [
      { theme: 'gradient', selected: true, class: 'text-afds-text-inverse' },
      { theme: 'white', selected: true, class: 'text-afds-text-primary' },
    ],
    defaultVariants: { selected: false, disabled: false },
  },
)

export const lnbItemIconBase = 'size-6 shrink-0'

/** 원본 라벨 폭 124px — 아이템 204px 안에서 아이콘·셰브론과 맞물린다 */
export const lnbExpandedItemLabelBase = 'title3 w-31 whitespace-pre'

// Item — 접힘

export const lnbMinimizedItemVariants = cva(
  'group/item flex w-fit cursor-pointer select-none flex-col items-center',
  {
    variants: {
      theme: {
        gradient: 'text-afds-text-lnb-default',
        white: 'text-afds-text-secondary',
      },
      disabled: { true: 'pointer-events-none cursor-default opacity-20', false: '' },
    },
    defaultVariants: { disabled: false },
  },
)

/** 접힘 아이콘 박스. hover 는 펼침과 다르다(gradient: black-015 vs white-005) — 원본 그대로다 */
export const lnbMinimizedIconBoxVariants = cva(
  'flex items-center justify-center rounded-afds-md p-afds-spacing-10',
  {
    variants: {
      theme: {
        gradient:
          'group-hover/item:bg-afds-interaction-pressed-overlay group-data-[popup-open]/item:bg-afds-interaction-pressed-overlay group-data-[popup-open]/item:text-afds-text-inverse',
        white:
          'group-hover/item:bg-afds-interaction-hover-overlay group-data-[popup-open]/item:bg-afds-interaction-hover-overlay group-data-[popup-open]/item:text-afds-text-primary',
      },
      selected: { true: '', false: '' },
    },
    compoundVariants: [
      { theme: 'gradient', selected: true, class: 'text-afds-text-inverse' },
      { theme: 'white', selected: true, class: 'text-afds-text-primary' },
    ],
    defaultVariants: { selected: false },
  },
)

/**
 * 접힘 라벨 — 평소 숨어 있고 hover·키보드 포커스·열림 때만 보인다 (원본 동작).
 * visibility 가 아니라 opacity 로 숨긴다 — visibility:hidden 이면 접근성 이름에서 빠져
 * 접힘 메뉴가 이름 없는 아이콘 버튼이 된다.
 */
export const lnbMinimizedLabelVariants = cva(
  'caption2 flex max-w-afds-spacing-44 justify-center whitespace-pre text-center opacity-0 group-hover/item:opacity-100 group-focus-visible/item:opacity-100 group-data-[popup-open]/item:opacity-100',
  {
    variants: {
      breakLabel: { true: 'whitespace-break-spaces', false: '' },
    },
    defaultVariants: { breakLabel: false },
  },
)

// Dropdown

/*
 * AFDS Popover 기본 패널(radius·shadow·scale 등장)을 지우고 원본 등장(왼쪽 8px 에서 120ms)으로 바꾼다.
 * 커스텀 토큰끼리는 cn 이 충돌을 못 풀어 ! 를 쓴다. 8px · 120ms 는 토큰이 없어 원본 값이다.
 */
export const lnbDropdownPopupBase =
  'rounded-none! bg-transparent p-0 shadow-none! duration-[120ms] ease-out data-[ending-style]:scale-100 data-[starting-style]:translate-x-[-8px] data-[starting-style]:scale-100'

export const lnbDropdownPanelBase =
  'flex w-45 flex-col rounded-afds-sm border border-afds-border-default bg-afds-bg-surface p-afds-spacing-10 shadow-afds-1'

// Section

/** AFDS 아코디언 아이템 기본 외형(테두리·배경·radius)을 지운다 */
export const lnbSectionItemBase = 'rounded-afds-md! border-0 bg-transparent'

/**
 * AFDS 트리거 기본 패딩(spacing-20)을 덮는다. 열리면 아래 모서리를 펴 콘텐츠와 붙이고,
 * 닫힐 때만 모서리를 500ms linear 로 되돌린다 (원본 동작).
 */
export const lnbSectionTriggerBase =
  'justify-start p-afds-spacing-10! data-[panel-open]:rounded-b-none not-data-[panel-open]:transition-[border-radius] not-data-[panel-open]:duration-500 not-data-[panel-open]:ease-linear'

/** 셰브론 회전 — 원본 150ms ease-out (AFDS Indicator 기본 200ms 를 덮는다) */
export const lnbSectionIndicatorBase = 'duration-150 ease-out'

export const lnbSectionContentVariants = cva('', {
  variants: {
    theme: {
      gradient: 'bg-afds-bg-lnb-selected text-afds-text-lnb-default',
      white: 'bg-afds-interaction-hover-overlay text-afds-text-secondary',
    },
  },
})

export const lnbSectionBodyBase = 'flex flex-col gap-afds-spacing-10 p-afds-spacing-10'

// SubGroup

export const lnbSubGroupVariants = cva('', {
  variants: {
    placement: {
      section: 'flex flex-col gap-afds-spacing-4',
      dropdown: 'not-last:mb-afds-spacing-20',
    },
  },
})

export const lnbSubGroupLabelVariants = cva('', {
  variants: {
    placement: {
      section: 'caption2 pl-afds-spacing-34',
      dropdown: 'title4 flex items-center p-afds-spacing-10 text-afds-text-secondary',
    },
    theme: { gradient: '', white: '' },
  },
  compoundVariants: [
    { placement: 'section', theme: 'gradient', class: 'text-afds-text-inverse' },
    { placement: 'section', theme: 'white', class: 'text-afds-text-primary' },
  ],
})

export const lnbSubGroupDividerBase = 'mb-afds-spacing-4 block h-px bg-afds-divider-default'

// SubItem

/* 드롭다운 항목색 gray600 은 대응하는 semantic 토큰이 없어 primitive 를 쓴다 */
export const lnbSubItemVariants = cva('flex w-full cursor-pointer items-center text-left', {
  variants: {
    placement: {
      section: 'h-afds-spacing-34 gap-afds-spacing-4 rounded-afds-sm pl-afds-spacing-14',
      dropdown:
        'title3 justify-between gap-afds-spacing-8 rounded-afds-sm px-afds-spacing-10 py-afds-spacing-8 text-afds-gray-600 not-last:mb-afds-spacing-4 hover:bg-afds-interaction-hover-overlay',
    },
    theme: { gradient: '', white: '' },
    selected: { true: '', false: '' },
    withBadge: { true: '', false: '' },
  },
  compoundVariants: [
    { placement: 'section', theme: 'gradient', class: 'hover:bg-afds-bg-lnb-selected' },
    { placement: 'section', theme: 'white', class: 'hover:bg-afds-interaction-hover-overlay' },
    { placement: 'section', withBadge: true, class: 'justify-between pr-afds-spacing-10' },
    {
      placement: 'section',
      theme: 'gradient',
      selected: true,
      class: 'text-afds-text-inverse',
    },
    { placement: 'section', theme: 'white', selected: true, class: 'text-afds-text-primary' },
    { placement: 'dropdown', selected: true, class: 'text-afds-text-brand-subtle' },
  ],
  defaultVariants: { selected: false, withBadge: false },
})

export const lnbSubItemDotBase = 'size-4 shrink-0'

export const lnbSubItemLabelVariants = cva('truncate', {
  variants: {
    placement: {
      section: 'title4 min-w-0 flex-1',
      dropdown: '',
    },
  },
})

// Badge

/*
 * 원본 LNB 배지 = SquareBadge(caption1 · padding 1px 4px · radius 3px) + 호스트 배지 배경.
 * AFDS SquareBadge 위에 원본 값만 덮는다. radius 3px · 그라데이션 · 브랜드 10% 배경은
 * AFDS 토큰이 없어 원본 값이다. 커스텀 토큰 클래스끼리는 cn 이 충돌을 못 풀어 ! 를 쓴다.
 * subtle 은 어두운 펼침 메뉴(dark)와 밝은 드롭다운(light)에서 색이 다르다.
 */
export const lnbBadgeVariants = cva(
  'shrink-0 whitespace-nowrap rounded-[3px]! px-afds-spacing-4 py-px!',
  {
    variants: {
      variant: {
        gradient:
          'bg-[linear-gradient(257deg,#9D55F9_-21.42%,#556AF9_71.34%)]! text-afds-text-inverse',
        subtle: '',
      },
      surface: { dark: '', light: '' },
    },
    compoundVariants: [
      {
        variant: 'subtle',
        surface: 'dark',
        class: 'bg-afds-bg-scrim-white text-afds-text-inverse',
      },
      {
        variant: 'subtle',
        surface: 'light',
        class: 'bg-[rgba(85,106,249,0.1)] text-afds-text-brand-subtle',
      },
    ],
  },
)

/** 원본 caption1 — SquareBadge.Content 기본(body3)을 덮는다 */
export const lnbBadgeContentBase = 'caption1!'

// Header

export const lnbHeaderBase =
  'mb-afds-spacing-20 flex h-afds-spacing-44 shrink-0 items-center gap-afds-spacing-20'

export const lnbHeaderMediaBase =
  'flex size-afds-spacing-44 shrink-0 items-center justify-center overflow-hidden rounded-afds-md'

export const lnbHeaderLabelBase = 'title2 truncate text-afds-text-inverse'

// Content

export const lnbContentBase = 'h-full min-w-0 flex-1 overflow-auto'
