'use client'

import * as React from 'react'
import type { SelectOption } from '../select'

export type { SelectOption }

export interface UseMultiSelectStateProps {
  /** 선택 가능한 옵션 목록 */
  options: SelectOption[]
  /** Controlled 선택값 */
  value?: string[]
  /** Uncontrolled 초기값 */
  defaultValue?: string[]
  /** 선택값이 변경될 때마다 호출 (아이템 토글 즉시 발화) */
  onValueChange?: (value: string[]) => void
  /** Controlled open 상태 */
  open?: boolean
  /** 열림 상태 변경 콜백 */
  onOpenChange?: (open: boolean) => void
}

export interface MultiSelectState {
  /** 선택값 */
  value: string[]
  /** 드롭다운 열림 여부 */
  open: boolean
  /** 옵션 (selected 플래그 포함). 검색/필터링은 소비자가 외부에서 처리해 `options`로 주입한다. */
  options: SelectOption[]
  /** 원본 옵션 */
  allOptions: SelectOption[]
  /** 열림 상태 변경 */
  onOpenChange: (open: boolean) => void
  /** 아이템 선택(토글) — value를 갱신하고 onValueChange를 즉시 호출 */
  onItemSelect: (value: string) => void
}

export interface MultiSelectContextValue extends MultiSelectState {
  size: 'sm' | 'md'
  loading: boolean
}

export const useMultiSelect = (props: UseMultiSelectStateProps): MultiSelectState => {
  const { options = [] } = props

  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
  const isOpenControlled = props.open !== undefined
  const open = isOpenControlled ? props.open! : uncontrolledOpen

  const setOpen = React.useCallback(
    (newOpen: boolean) => {
      if (!isOpenControlled) {
        setUncontrolledOpen(newOpen)
      }
      props.onOpenChange?.(newOpen)
    },
    [isOpenControlled, props.onOpenChange],
  )

  const onValueChange = props.onValueChange
  const isValueControlled = props.value !== undefined
  const [uncontrolledValue, setUncontrolledValue] = React.useState<string[]>(
    () => props.defaultValue ?? [],
  )

  const value = props.value ?? uncontrolledValue

  const setValue = React.useCallback(
    (newValue: string[]) => {
      if (!isValueControlled) {
        setUncontrolledValue(newValue)
      }
      onValueChange?.(newValue)
    },
    [isValueControlled, onValueChange],
  )

  // Business Logic
  const handleItemSelect = React.useCallback(
    (itemValue: string) => {
      const isSelected = value.includes(itemValue)
      const nextValues = isSelected ? value.filter(v => v !== itemValue) : [...value, itemValue]
      setValue(nextValues)
    },
    [value, setValue],
  )

  // Options (selected 플래그 주입 — 필터링은 외부에서)
  const optionsWithSelected = React.useMemo(
    () => options.map(option => ({ ...option, selected: value.includes(option.value) })),
    [options, value],
  )

  return {
    value,
    open,
    onOpenChange: setOpen,
    onItemSelect: handleItemSelect,
    options: optionsWithSelected,
    allOptions: options,
  }
}
