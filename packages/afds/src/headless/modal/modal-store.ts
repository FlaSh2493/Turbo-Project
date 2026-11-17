'use client'

import * as React from 'react'

// Types

export interface ModalRenderProps {
  isOpen: boolean
  close: () => void
}

export interface ModalEntry {
  id: string
  isOpen: boolean
  render: (props: ModalRenderProps) => React.ReactNode
}

type ModalListener = () => void

// Store

class ModalStore {
  private modals: ModalEntry[] = []
  private listeners: Set<ModalListener> = new Set()

  subscribe(listener: ModalListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getModals(): ModalEntry[] {
    return this.modals
  }

  open(render: (props: ModalRenderProps) => React.ReactNode): () => void {
    const id = crypto.randomUUID()
    this.modals = [...this.modals, { id, isOpen: true, render }]
    this.notify()
    return () => this.close(id)
  }

  close(id: string): void {
    this.modals = this.modals.map(m => (m.id === id ? { ...m, isOpen: false } : m))
    this.notify()
  }

  destroy(id: string): void {
    this.modals = this.modals.filter(m => m.id !== id)
    this.notify()
  }

  private notify(): void {
    this.listeners.forEach(l => l())
  }
}

export const defaultModalStore = new ModalStore()

export const modal = {
  open: defaultModalStore.open.bind(defaultModalStore),
}
