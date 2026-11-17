'use client'

import { forwardRef } from 'react'
import { Button, Modal, Typography } from '@turbo-project/afds/bricks'

interface AlertModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  message: string
  confirmText?: string
  onConfirm?: () => void
  onExited?: () => void
}

export const AlertModal = forwardRef<HTMLDivElement, AlertModalProps>(
  ({ open, onOpenChange, title, message, confirmText = 'OK', onConfirm, onExited }, ref) => {
    return (
      <Modal.Root open={open} onOpenChange={onOpenChange} size="sm">
        <Modal.Portal>
          <Modal.Overlay />
          <Modal.Content ref={ref} className="h-auto" data-slot="alert-modal" onExited={onExited}>
            <Modal.Header>
              <Modal.Title>
                <Typography variant="heading2" color="text-primary">
                  {title}
                </Typography>
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="min-h-0">
              <Typography
                variant="body2"
                color="text-primary"
                // Modal.Body 는 더 이상 자식에게 flex-col 을 주입하지 않는다(#90).
                // 세로 축 정렬이 필요하면 여기서 명시한다 — 계약 6번의 귀결이다.
                className="flex flex-col justify-center whitespace-pre-line text-center"
              >
                {message}
              </Typography>
            </Modal.Body>
            <Modal.Footer>
              <Modal.Close
                render={
                  <Button variant="fill" size="lg" className="w-[84px]" onClick={onConfirm}>
                    {confirmText}
                  </Button>
                }
              />
            </Modal.Footer>
          </Modal.Content>
        </Modal.Portal>
      </Modal.Root>
    )
  },
)

AlertModal.displayName = 'AlertModal'
