'use client'

import * as React from 'react'
import { Dialog as ModalPrimitive } from '@base-ui/react/dialog'
import { cn } from '../../../lib/utils'
import { useResolvedPortalContainer } from '../../../hooks/use-resolved-portal-container'
import { AfdsPortalContext } from '../../../hooks/use-afds-portal-container'
import { mergeRefs } from '../../../lib/slot'
import { modalOverlayVariants, modalContentVariants, modalBodyVariants } from './modal.style'
import { ScrollArea } from '../../layout/scroll-area'
import { Typography } from '../../display/typography'
import { ModalContext, ModalExitContext, useModalContext, type ModalSize } from './modal.context'

type ModalPrimitiveRootProps = ModalPrimitive.Root.Props
type ModalPrimitiveTriggerProps = ModalPrimitive.Trigger.Props
type ModalPrimitivePortalProps = ModalPrimitive.Portal.Props
type ModalPrimitiveBackdropProps = ModalPrimitive.Backdrop.Props
type ModalPrimitivePopupProps = ModalPrimitive.Popup.Props
type ModalPrimitiveCloseProps = ModalPrimitive.Close.Props

// Root

export interface ModalRootProps extends Omit<ModalPrimitiveRootProps, 'children'> {
  /**
   * 모달 크기
   * @default 'sm'
   */
  size?: ModalSize
  /**
   * 모달 콘텐츠
   */
  children?: React.ReactNode
}

export const ModalRoot = ({ size = 'sm', children, ...props }: ModalRootProps) => (
  <ModalContext.Provider value={{ size }}>
    <ModalPrimitive.Root {...props}>{children}</ModalPrimitive.Root>
  </ModalContext.Provider>
)
ModalRoot.displayName = 'ModalRoot'

// Trigger

export interface ModalTriggerProps extends ModalPrimitiveTriggerProps {
  /**
   * 모달 트리거 콘텐츠
   */
  children?: React.ReactNode
}

export const ModalTrigger = React.forwardRef<HTMLButtonElement, ModalTriggerProps>(
  ({ className, ...props }, ref) => (
    <ModalPrimitive.Trigger ref={ref} data-slot="modal-trigger" className={className} {...props} />
  ),
)
ModalTrigger.displayName = 'ModalTrigger'

// Portal

export interface ModalPortalProps extends ModalPrimitivePortalProps {
  /**
   * 모달 포탈 콘텐츠
   */
  children?: React.ReactNode
}

export const ModalPortal = ({ children, container, ...props }: ModalPortalProps) => {
  const resolvedContainer = useResolvedPortalContainer(container)
  return (
    <ModalPrimitive.Portal {...props} container={resolvedContainer}>
      {children}
    </ModalPrimitive.Portal>
  )
}
ModalPortal.displayName = 'ModalPortal'

// Overlay (Backdrop in Base UI)

export const ModalOverlay = React.forwardRef<HTMLDivElement, ModalPrimitiveBackdropProps>(
  ({ className, ...props }, ref) => (
    <ModalPrimitive.Backdrop
      ref={ref}
      data-slot="modal-overlay"
      className={cn(modalOverlayVariants(), className)}
      {...props}
    />
  ),
)
ModalOverlay.displayName = 'ModalOverlay'

// Content (Popup in Base UI)

export interface ModalContentProps extends Omit<ModalPrimitivePopupProps, 'children' | 'ref'> {
  /**
   * 모달 콘텐츠
   */
  children: React.ReactNode
  /**
   * 모달 애니메이션 종료 후 호출되는 콜백
   */
  onExited?: () => void
}

export const ModalContent = React.forwardRef<HTMLDivElement, ModalContentProps>(
  ({ className, children, onExited: onExitedProp, ...props }, ref) => {
    const { size } = useModalContext()
    // 자기 노드를 state 로 잡는다 — element 가 붙는 순간 하위 오버레이가 리렌더돼 포털이 옮겨간다.
    const [node, setNode] = React.useState<HTMLDivElement | null>(null)
    // **병합 ref 를 안정화한다.** `mergeRefs` 는 매 호출마다 새 함수를 만들므로 렌더 안에서
    // 인라인 호출하면 ref 신원이 매 렌더 바뀌고, React 가 `ref(null) → ref(element)` 를 다시
    // 부른다. callback ref 에 옵저버·포커스·React 19 cleanup 을 붙인 소비자는 모달이 리렌더될
    // 때마다 teardown/setup 을 맞는다(실측: 마운트에 el,null,el / 리렌더마다 +2).
    const mergedRef = React.useMemo(() => mergeRefs(ref, setNode), [ref])
    const onExitedContext = React.useContext(ModalExitContext)
    const onExited = onExitedProp ?? onExitedContext

    React.useEffect(
      () => () => {
        // ModalContent unmount 시 = 애니메이션 완료 + DOM 제거 = 정확한 종료 시점
        onExited?.()
      },
      [],
    )

    return (
      <ModalPrimitive.Popup
        ref={mergedRef}
        data-slot="modal-content"
        data-size={size}
        className={cn('flex flex-col', modalContentVariants({ size, className }))}
        {...props}
      >
        {/*
          **모달 안의 오버레이는 모달 안으로 포털한다.**

          `<AfdsScope>` 가 공급하는 포털 타깃은 모달의 **형제**다. 그래서 모달 안에서 Select 을
          열면 드롭다운이 모달 밖에 렌더돼 스태킹에 따라 뒤에 가려진다. 여기서 컨텍스트를
          **자기 노드로 재공급**하면 하위 오버레이가 모달 DOM 안에서 해소된다.

          이것이 없어서 소비처는 모달 안에서 AFDS Select 을 포기하고 `relative`+`absolute`
          목록에 바깥클릭·ARIA 를 손으로 붙여 썼다(upstream #675). 그 우회를 걷어내는 것이
          이 재공급의 목적이다.

          마운트 전 `node` 는 `null` 이다. 이때 `Provider value={null}` 은 상위 `AfdsScope` 를
          **가린다**(하위 소비자가 `null` 을 본다) — 스코프로 폴백하는 것이 아니라 건너뛰고
          `useResolvedPortalContainer` 가 `null → undefined` 로 접어 body 로 간다.
          실무 영향은 없다: 팝업은 첫 커밋 시점에 이미 모달 안에 안착한다(실측).
          (처음 이 주석은 "스코프 → body 로 폴백" 이라고 적었는데 부정확했다 — 독립 리뷰가 적발.)
        */}
        <AfdsPortalContext.Provider value={node}>{children}</AfdsPortalContext.Provider>
      </ModalPrimitive.Popup>
    )
  },
)
ModalContent.displayName = 'ModalContent'

// Header

export const ModalHeader = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="modal-header"
      className={cn('flex h-24 items-center px-7.5 py-10', className)}
      {...props}
    >
      {children}
    </div>
  ),
)
ModalHeader.displayName = 'ModalHeader'

// Title

export const ModalTitle = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} data-slot="modal-title" className={cn(className)} {...props}>
      <Typography variant="title1" color="text-primary">
        {children}
      </Typography>
    </div>
  ),
)
ModalTitle.displayName = 'ModalTitle'

// Body

export interface ModalBodyProps extends Omit<React.ComponentPropsWithoutRef<'div'>, 'dir'> {
  /**
   * 모달 본문 콘텐츠
   */
  children: React.ReactNode
}

export const ModalBody = React.forwardRef<HTMLDivElement, ModalBodyProps>(
  ({ className, children, ...props }, ref) => {
    const { size } = useModalContext()
    return (
      <ScrollArea
        ref={ref}
        data-slot="modal-body"
        data-size={size}
        className={cn(modalBodyVariants({ size, className }))}
        viewportClassName="flex h-full flex-col px-7.5"
        {...props}
      >
        {children}
      </ScrollArea>
    )
  },
)
ModalBody.displayName = 'ModalBody'

// Footer

export const ModalFooter = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="modal-footer"
      className={cn('flex h-26 items-center justify-end gap-2.5 px-7.5 py-7.5', className)}
      {...props}
    >
      {children}
    </div>
  ),
)
ModalFooter.displayName = 'ModalFooter'

// Close

export interface ModalCloseProps extends ModalPrimitiveCloseProps {
  /**
   * 닫기 버튼 콘텐츠
   */
  children?: React.ReactNode
}

export const ModalClose = React.forwardRef<HTMLButtonElement, ModalCloseProps>(
  ({ className, ...props }, ref) => (
    <ModalPrimitive.Close
      ref={ref}
      data-slot="modal-close"
      className={cn('cursor-pointer', className)}
      {...props}
    />
  ),
)
ModalClose.displayName = 'ModalClose'

export const Modal = {
  Root: ModalRoot,
  Trigger: ModalTrigger,
  Portal: ModalPortal,
  Overlay: ModalOverlay,
  Content: ModalContent,
  Header: ModalHeader,
  Title: ModalTitle,
  Body: ModalBody,
  Footer: ModalFooter,
  Close: ModalClose,
}
