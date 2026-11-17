'use client'

import { createContext, forwardRef, useContext, useMemo, useState, type ReactNode } from 'react'
import * as React from 'react'
import type { VariantProps } from 'class-variance-authority'
import { Drawer as DrawerPrimitive } from '@base-ui/react/drawer'
import { cn } from '../../../lib/utils'
import { AfdsPortalContext } from '../../../hooks/use-afds-portal-container'
import { mergeRefs } from '../../../lib/slot'
import {
  useResolvedPortalContainer,
  type PortalContainer,
} from '../../../hooks/use-resolved-portal-container'
import {
  drawerOverlayBase,
  drawerPanelVariants,
  drawerTitleVariants,
  drawerViewportVariants,
} from './drawer.style'

// ─── Context ──────────────────────────────────────────────────────────────────

type DrawerDirection = 'down' | 'up' | 'left' | 'right'

const DrawerContext = createContext<{ direction: DrawerDirection }>({ direction: 'down' })
const useDrawerContext = () => useContext(DrawerContext)

// ─── Root ─────────────────────────────────────────────────────────────────────

export interface DrawerRootProps {
  /**
   * 드로어 열림 상태
   */
  open: boolean
  /**
   * 열림 상태 변경 핸들러
   */
  onOpenChange: (open: boolean) => void
  /**
   * 드로어 방향
   * @default 'down'
   */
  direction?: DrawerDirection
  /**
   * 드로어 콘텐츠
   */
  children: ReactNode
  /**
   * 모달 동작 여부 (배경 클릭 시 닫힘)
   * @default true
   */
  modal?: boolean
  /**
   * 포털 컨테이너. 미지정 시 `<AfdsScope>` 컨텍스트 → `document.body` 순으로 해석된다.
   * 명시 `null` 은 **포털을 렌더하지 않는다**(선언형 base-ui Portal 의 동작) — body opt-out 이
   * 아니다. body 로 보내려면 `document.body` 를 직접 넘겨라. (실측 확인)
   */
  container?: PortalContainer
}

const DrawerRoot = ({
  open,
  onOpenChange,
  direction = 'down',
  children,
  modal = true,
  container,
}: DrawerRootProps) => {
  const resolvedContainer = useResolvedPortalContainer(container)
  const swipeDirection =
    direction === 'down'
      ? 'down'
      : direction === 'up'
        ? 'up'
        : direction === 'left'
          ? 'left'
          : 'right'

  return (
    <DrawerContext.Provider value={{ direction }}>
      <DrawerPrimitive.Root
        open={open}
        onOpenChange={onOpenChange}
        swipeDirection={swipeDirection}
        modal={modal}
      >
        <DrawerPrimitive.Portal container={resolvedContainer}>{children}</DrawerPrimitive.Portal>
      </DrawerPrimitive.Root>
    </DrawerContext.Provider>
  )
}
DrawerRoot.displayName = 'Drawer.Root'

// ─── Overlay ──────────────────────────────────────────────────────────────────

/**
 * 드로어 오버레이 (배경) props
 */
export type DrawerOverlayProps = React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Backdrop>

const DrawerOverlay = forwardRef<HTMLDivElement, DrawerOverlayProps>(
  ({ className, ...props }, ref) => (
    <DrawerPrimitive.Backdrop
      ref={ref}
      data-slot="drawer-overlay"
      className={cn(drawerOverlayBase, className)}
      {...props}
    />
  ),
)
DrawerOverlay.displayName = 'Drawer.Overlay'

// ─── Viewport ─────────────────────────────────────────────────────────────────

/**
 * 드로어 뷰포트 props
 */
export type DrawerViewportProps = React.HTMLAttributes<HTMLDivElement>

const DrawerViewport = forwardRef<HTMLDivElement, DrawerViewportProps>(
  ({ className, ...props }, ref) => {
    const { direction } = useDrawerContext()
    return (
      <DrawerPrimitive.Viewport
        ref={ref}
        className={cn(drawerViewportVariants({ direction }), className)}
        {...props}
      />
    )
  },
)
DrawerViewport.displayName = 'Drawer.Viewport'

// ─── Panel ────────────────────────────────────────────────────────────────────

export interface DrawerPanelProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    Omit<VariantProps<typeof drawerPanelVariants>, 'direction'> {
  /**
   * 드로어 패널 콘텐츠
   */
  children: ReactNode
  /**
   * side-drawer 방향일 때 너비 (direction=left|right)
   * @default '400px'
   */
  width?: string
}

const DrawerPanel = forwardRef<HTMLDivElement, DrawerPanelProps>(
  ({ children, className, width, style, ...props }, ref) => {
    const { direction } = useDrawerContext()
    const isSide = direction === 'left' || direction === 'right'
    // 모달과 같은 이유로 자기 노드를 컨텍스트로 재공급한다 — 스코프 포털 타깃은 드로어의
    // **형제**라, 재공급이 없으면 드로어 안에서 연 Select 이 드로어 밖으로 나간다.
    // `mergeRefs` 를 렌더마다 새로 만들면 소비자 callback ref 가 뗐다 붙으므로 안정화한다.
    const [node, setNode] = useState<HTMLDivElement | null>(null)
    const mergedRef = useMemo(() => mergeRefs(ref, setNode), [ref])

    const resolvedWidth = isSide ? (width ?? '400px') : undefined
    return (
      <DrawerPrimitive.Popup
        ref={mergedRef}
        data-slot="drawer-panel"
        className={cn(drawerPanelVariants({ direction }), className)}
        style={resolvedWidth ? { width: resolvedWidth, ...style } : style}
        {...props}
      >
        <DrawerPrimitive.Content className="contents">
          <AfdsPortalContext.Provider value={node}>{children}</AfdsPortalContext.Provider>
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Popup>
    )
  },
)
DrawerPanel.displayName = 'Drawer.Panel'

// ─── Header ───────────────────────────────────────────────────────────────────

export interface DrawerHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * 드로어 헤더 콘텐츠
   */
  children: ReactNode
}

const DrawerHeader = forwardRef<HTMLDivElement, DrawerHeaderProps>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} data-slot="drawer-header" className={cn(className)} {...props}>
      {children}
    </div>
  ),
)
DrawerHeader.displayName = 'Drawer.Header'

// ─── Title ────────────────────────────────────────────────────────────────────

export interface DrawerTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /**
   * 드로어 제목 텍스트
   */
  children: ReactNode
}

const DrawerTitle = forwardRef<HTMLHeadingElement, DrawerTitleProps>(
  ({ children, className, ...props }, ref) => {
    const { direction } = useDrawerContext()
    return (
      <DrawerPrimitive.Title
        ref={ref}
        data-slot="drawer-title"
        className={cn(drawerTitleVariants({ direction }), className)}
        {...props}
      >
        {children}
      </DrawerPrimitive.Title>
    )
  },
)
DrawerTitle.displayName = 'Drawer.Title'

// ─── Content ──────────────────────────────────────────────────────────────────

export interface DrawerContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * 드로어 본문 콘텐츠
   */
  children: ReactNode
}

const DrawerContent = forwardRef<HTMLDivElement, DrawerContentProps>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} data-slot="drawer-content" className={cn(className)} {...props}>
      {children}
    </div>
  ),
)
DrawerContent.displayName = 'Drawer.Content'

// ─── Footer ───────────────────────────────────────────────────────────────────

export interface DrawerFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * 드로어 푸터 콘텐츠
   */
  children: ReactNode
}

const DrawerFooter = forwardRef<HTMLDivElement, DrawerFooterProps>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} data-slot="drawer-footer" className={cn(className)} {...props}>
      {children}
    </div>
  ),
)
DrawerFooter.displayName = 'Drawer.Footer'

// ─── Close ────────────────────────────────────────────────────────────────────

/**
 * 드로어 닫기 버튼 props
 */
export type DrawerCloseProps = React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Close>

const DrawerClose = forwardRef<HTMLButtonElement, DrawerCloseProps>(
  ({ className, ...props }, ref) => (
    <DrawerPrimitive.Close
      ref={ref}
      data-slot="drawer-close"
      className={cn(className)}
      {...props}
    />
  ),
)
DrawerClose.displayName = 'Drawer.Close'

export const Drawer = {
  Root: DrawerRoot,
  Overlay: DrawerOverlay,
  Viewport: DrawerViewport,
  Panel: DrawerPanel,
  Header: DrawerHeader,
  Title: DrawerTitle,
  Content: DrawerContent,
  Footer: DrawerFooter,
  Close: DrawerClose,
}
