'use client'

import * as React from 'react'
import { Button, Popover, Typography, type PopoverContentProps } from '@turbo-project/afds/bricks'

import { popconfirmTitleBase, popconfirmButtonAreaBase } from './popconfirm.style'

// PopConfirm
//
// 컴포지션: Popover(컴포넌트) + Button을 조합하고, 확인/취소 흐름(비동기 confirm +
// 로딩 + 에러 시 열림 유지)은 이 안에 인라인한다. 별도 헤드리스에 의존하지 않는다.

export interface PopConfirmProps {
  /** 트리거 요소 */
  children: React.ReactNode
  /** 확인 메시지 */
  title: React.ReactNode
  /** 확인 버튼 텍스트 */
  confirmText?: string
  /** 아니요 버튼 텍스트 */
  cancelText?: string
  /** Popover가 나타날 방향 (top, bottom, left, right) */
  side?: PopoverContentProps['side']
  /** Popover의 정렬 기준 (start, center, end) */
  align?: PopoverContentProps['align']
  /** side 방향 오프셋 (px) */
  sideOffset?: PopoverContentProps['sideOffset']
  /** 화살표 표시 여부 */
  showArrow?: boolean
  /** 로딩 중 텍스트 */
  loadingText?: string
  /** 확인 버튼 비활성화 */
  confirmDisabled?: boolean
  /** 취소 버튼 비활성화 */
  cancelDisabled?: boolean
  /** 추가 클래스명 */
  className?: string
  /** 열림 상태 (Controlled) */
  open?: boolean
  /** 기본 열림 상태 (Uncontrolled) */
  defaultOpen?: boolean
  /** 열림 상태 변경 콜백 */
  onOpenChange?: (open: boolean) => void
  /** 확인 버튼 클릭 콜백 (Promise 반환 시 로딩 상태 지원) */
  onConfirm?: () => void | Promise<void>
  /** 취소 버튼 클릭 콜백 */
  onCancel?: () => void
}

/**
 * PopConfirm Component
 * 특정 요소를 클릭했을 때 확인/취소 버튼이 포함된 팝오버를 표시합니다.
 */
export const PopConfirm = React.forwardRef<HTMLButtonElement, PopConfirmProps>(
  (
    {
      children,
      title,
      confirmText = 'Yes',
      cancelText = 'No',
      side = 'top',
      align = 'center',
      sideOffset,
      showArrow = true,
      className,
      loadingText,
      confirmDisabled = false,
      cancelDisabled = false,
      open: controlledOpen,
      defaultOpen = false,
      onOpenChange,
      onConfirm,
      onCancel,
    },
    ref,
  ) => {
    const isControlled = controlledOpen !== undefined
    const [internalOpen, setInternalOpen] = React.useState(defaultOpen)
    const [isLoading, setIsLoading] = React.useState(false)
    const open = isControlled ? controlledOpen : internalOpen

    const setOpen = React.useCallback(
      (newOpen: boolean) => {
        if (!isControlled) {
          setInternalOpen(newOpen)
        }
        onOpenChange?.(newOpen)
      },
      [isControlled, onOpenChange],
    )

    const handleConfirm = React.useCallback(() => {
      if (!onConfirm) {
        setOpen(false)
        return
      }
      const result = onConfirm()
      if (result instanceof Promise) {
        setIsLoading(true)
        result
          .then(() => setOpen(false))
          .catch(() => {
            // 에러 시 열린 상태 유지
          })
          .finally(() => setIsLoading(false))
      } else {
        setOpen(false)
      }
    }, [onConfirm, setOpen])

    const handleCancel = React.useCallback(() => {
      onCancel?.()
      setOpen(false)
    }, [onCancel, setOpen])

    return (
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger ref={ref} render={children as React.ReactElement} />
        <Popover.Content side={side} align={align} sideOffset={sideOffset} className={className}>
          <Typography variant="title3" className={popconfirmTitleBase} data-slot="popconfirm-title">
            {title}
          </Typography>
          <div data-slot="popconfirm-button-area" className={popconfirmButtonAreaBase}>
            <Button
              variant="line"
              size="md"
              data-slot="popconfirm-cancel-button"
              onClick={handleCancel}
              disabled={cancelDisabled || isLoading}
            >
              {cancelText}
            </Button>
            <Button
              variant="primary-line"
              size="md"
              data-slot="popconfirm-confirm-button"
              onClick={handleConfirm}
              disabled={confirmDisabled || isLoading}
            >
              {isLoading ? (loadingText ?? confirmText) : confirmText}
            </Button>
          </div>
          {showArrow && <Popover.Arrow />}
        </Popover.Content>
      </Popover.Root>
    )
  },
)

PopConfirm.displayName = 'PopConfirm'
