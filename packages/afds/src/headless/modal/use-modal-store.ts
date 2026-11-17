'use client'

import * as React from 'react'
import { defaultModalStore, type ModalEntry } from './modal-store'

export const useModalStore = (): ModalEntry[] => {
  const [modals, setModals] = React.useState<ModalEntry[]>(() => defaultModalStore.getModals())

  React.useEffect(() => {
    return defaultModalStore.subscribe(() => {
      setModals([...defaultModalStore.getModals()])
    })
  }, [])

  return modals
}
