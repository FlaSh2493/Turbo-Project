'use client'

import * as React from 'react'
import type { MultiSelectContextValue } from './use-multi-select'

export const MultiSelectContext = React.createContext<MultiSelectContextValue | null>(null)

export const useMultiSelectContext = () => {
  const context = React.useContext(MultiSelectContext)
  if (!context) {
    throw new Error('MultiSelect components must be used within MultiSelectProvider')
  }
  return context
}
