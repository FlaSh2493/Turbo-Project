'use client'

import { useState, useCallback, useRef, useLayoutEffect } from 'react'

export interface UseSegmentControlOptions<T extends string> {
  /** 초기 선택 값 (uncontrolled) */
  defaultValue?: T
  /** 현재 선택 값 (controlled) */
  value?: T
  /** 값 변경 콜백 */
  onValueChange?: (value: T) => void
}

export interface ItemRect {
  left: number
  width: number
}

export interface ItemProps {
  ref: (element: HTMLElement | null) => void
  isSelected: boolean
  handleClick: () => void
}

export interface UseSegmentControlReturn<T extends string> {
  selectedValue: T | undefined
  indicatorStyle: ItemRect | null
  getItemProps: (value: T) => ItemProps
  recalculate: () => void
}

export function useSegmentControl<T extends string>({
  defaultValue,
  value,
  onValueChange,
}: UseSegmentControlOptions<T> = {}): UseSegmentControlReturn<T> {
  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = useState<T | undefined>(defaultValue)
  const selectedValue = isControlled ? value : internalValue

  const selectValue = useCallback(
    (newValue: T) => {
      if (!isControlled) {
        setInternalValue(newValue)
      }
      onValueChange?.(newValue)
    },
    [isControlled, onValueChange],
  )

  const itemsRef = useRef<Map<T, HTMLElement>>(new Map())
  const [indicatorStyle, setIndicatorStyle] = useState<ItemRect | null>(null)

  // selectedValue를 ref로 보관하여 recalculate의 deps를 []로 유지.
  //
  // **동기화를 렌더 밖에서 한다.** 렌더 중 `ref.current` 를 쓰면 React 가 그 렌더를 버릴 때
  // `setState` 는 되돌아가지만 **ref 쓰기는 남는다** — 커밋된 값과 ref 가 어긋난 채로
  // resize 같은 나중 호출이 `recalculate` 를 부르면 지표가 다른 항목에 놓인다.
  //
  // **`useEffect` 가 아니라 `useLayoutEffect` 이고, 아래 재계산 effect 보다 먼저 선언한다.**
  // 레이아웃 effect 는 선언 순서대로 커밋 직후에 돌고 일반 effect 보다 앞선다. `useEffect`
  // 로 옮기면 아래 `[selectedValue]` 재계산이 **먼저** 돌아 낡은 ref 를 읽는다.
  const selectedValueRef = useRef(selectedValue)
  useLayoutEffect(() => {
    selectedValueRef.current = selectedValue
  }, [selectedValue])

  const recalculate = useCallback(() => {
    const selected = selectedValueRef.current
    if (!selected) {
      setIndicatorStyle(null)
      return
    }

    const element = itemsRef.current.get(selected)
    if (!element) {
      setIndicatorStyle(null)
      return
    }

    // offsetLeft/offsetWidth는 offsetParent(=relative 컨테이너) 기준
    setIndicatorStyle({
      left: element.offsetLeft,
      width: element.offsetWidth,
    })
  }, [])

  // 아이템 props 생성
  const getItemProps = useCallback(
    (itemValue: T): ItemProps => ({
      ref: (element: HTMLElement | null) => {
        if (element) {
          itemsRef.current.set(itemValue, element)
        } else {
          itemsRef.current.delete(itemValue)
        }
      },
      isSelected: selectedValue === itemValue,
      handleClick: () => selectValue(itemValue),
    }),
    [selectedValue, selectValue],
  )

  // selectedValue 변경 또는 아이템 등록 후 위치 재계산
  useLayoutEffect(() => {
    recalculate()
  }, [selectedValue, recalculate])

  // 초기 마운트 시 DOM 배치 후 재계산 (callback ref 등록 직후에는 offsetLeft가 0일 수 있음)
  useLayoutEffect(() => {
    const frame = requestAnimationFrame(() => recalculate())
    return () => cancelAnimationFrame(frame)
  }, [recalculate])

  // 리사이즈 시 위치 재계산
  useLayoutEffect(() => {
    const handleResize = () => recalculate()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [recalculate])

  return {
    selectedValue,
    indicatorStyle,
    getItemProps,
    recalculate,
  }
}
