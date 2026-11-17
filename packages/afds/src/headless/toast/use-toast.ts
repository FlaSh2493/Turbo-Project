'use client'

import { useEffect, useState } from 'react'
import type { ToastData, UseToastReturn } from './types'

import { defaultStore as store } from './toast-store'

export const useToast = (): UseToastReturn => {
  const [toasts, setToasts] = useState<ToastData[]>(store.getSnapshot())

  useEffect(() => {
    const unsubscribe = store.subscribe(newToasts => {
      setToasts([...newToasts])
    })

    return () => {
      unsubscribe()
    }
  }, [])

  return {
    toasts,
    addToasts: store.add.bind(store),
    dismiss: store.dismiss.bind(store),
    dismissAll: store.dismissAll.bind(store),
    remove: store.remove.bind(store),
    removeAll: store.removeAll.bind(store),
  }
}
