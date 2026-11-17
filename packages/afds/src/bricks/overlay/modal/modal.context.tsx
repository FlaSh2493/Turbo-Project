'use client'

import * as React from 'react'

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl'

export interface ModalContextValue {
  size: ModalSize
}

export const ModalContext = React.createContext<ModalContextValue | undefined>(undefined)

export const useModalContext = () => {
  const context = React.useContext(ModalContext)
  if (!context) {
    throw new Error('Modal components must be wrapped in <Modal.Root />')
  }
  return context
}

export const ModalExitContext = React.createContext<(() => void) | null>(null)
