'use client'

import { createContext, useContext } from 'react'
import type { ComplexFilterConfig } from './types'
import type { FilterController } from './use-filter-controller'

export interface ComplexFilterContextValue {
  /** Root props 에서 기본값·문구가 해소된 설정 */
  config: ComplexFilterConfig & { maxLength: number; disabled: boolean }
  controller: FilterController
  expanded: boolean
  setExpanded: (next: boolean) => void
  /** 접힌 상태에서 칩이 가려졌는가(「…」 표시 근거) */
  overflowing: boolean
  /** 지울 것이 있는가(삭제 가능한 칩 또는 입력 중인 텍스트) */
  canClear: boolean
  /** 칩·입력을 비우고 `onClear` 를 알린 뒤 입력에 포커스를 돌린다 */
  clear: () => void
}

export const ComplexFilterContext = createContext<ComplexFilterContextValue | null>(null)

/** 파트 안에서 Root 가 만든 상태를 읽는다. 외부에는 공개하지 않는다 — 공개하면 controller 구조가 계약이 된다 */
export function useComplexFilterContext() {
  const ctx = useContext(ComplexFilterContext)
  if (!ctx) {
    throw new Error('ComplexFilter parts must be used within ComplexFilter.Root')
  }
  return ctx
}
