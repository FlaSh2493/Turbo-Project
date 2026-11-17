'use client'

import { forwardRef, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@turbo-project/afds/lib/utils'
import { Actions, CollapseToggle } from './actions'
import { hasClearable } from './chips'
import { ComplexFilterContext } from './complex-filter.context'
import { Chip } from './chip'
import { Input } from './input'
import { resolveLabels } from './labels'
import { MatchMode } from './match-mode'
import type { ComplexFilterRootProps } from './types'
import { useFilterController } from './use-filter-controller'

/** 구 단일 컴포넌트와 같은 배치. 명시 조립과 DOM 이 같아야 한다(테스트가 고정) */
const DEFAULT_LAYOUT = (
  <>
    <MatchMode />
    <Input />
    <Actions />
  </>
)

const ComplexFilterRoot = forwardRef<HTMLDivElement, ComplexFilterRootProps>(
  (
    {
      fields,
      chips,
      onChange,
      onClear,
      matchMode,
      recentSearches,
      expanded: expandedProp,
      onToggle,
      maxChips,
      maxLength = 100,
      disabled = false,
      portalContainer,
      labels,
      className,
      children,
    },
    ref,
  ) => {
    const barRef = useRef<HTMLDivElement | null>(null)
    // WHY: 외부 ref 와 측정용 barRef 를 함께 채운다. mergeRefs 는 AFDS 루트 배럴에만 있어 서브패스 규칙상 쓸 수 없다
    const setRefs = useCallback(
      (node: HTMLDivElement | null) => {
        barRef.current = node
        if (typeof ref === 'function') ref(node)
        else if (ref) ref.current = node
      },
      [ref],
    )
    const [innerExpanded, setInnerExpanded] = useState(true)
    const [overflowing, setOverflowing] = useState(false)
    const expanded = expandedProp ?? innerExpanded

    const setExpanded = useCallback(
      (next: boolean) => {
        if (expandedProp === undefined) setInnerExpanded(next)
        onToggle?.(next)
      },
      [expandedProp, onToggle],
    )

    const controller = useFilterController({
      fields,
      chips,
      onChange,
      recentSearches,
      maxChips,
      maxLength,
    })
    const canClear = hasClearable(chips) || !controller.blank

    useLayoutEffect(() => {
      const bar = barRef.current
      if (!bar || expanded) {
        setOverflowing(false)
        return
      }
      const measure = () => setOverflowing(bar.scrollHeight > bar.clientHeight)
      measure()
      if (typeof ResizeObserver === 'undefined') return
      const observer = new ResizeObserver(measure)
      observer.observe(bar)
      return () => observer.disconnect()
    }, [expanded, chips])

    const resolvedLabels = useMemo(() => resolveLabels(labels), [labels])
    const clear = useCallback(() => {
      controller.clearAll()
      onClear()
      controller.focusInput()
    }, [controller, onClear])
    // WHY: 파트는 이 값이 바뀔 때만 다시 그려진다. 소비자가 fields·chips·labels 를 렌더마다 새로 만들어 넘기면 그만큼은 바뀐다
    const value = useMemo(
      () => ({
        config: {
          fields,
          chips,
          onChange,
          onClear,
          matchMode,
          recentSearches,
          expanded,
          onToggle,
          maxChips,
          maxLength,
          disabled,
          portalContainer,
          labels: resolvedLabels,
        },
        controller,
        expanded,
        setExpanded,
        overflowing,
        canClear,
        clear,
      }),
      [
        fields,
        chips,
        onChange,
        onClear,
        matchMode,
        recentSearches,
        expanded,
        onToggle,
        maxChips,
        maxLength,
        disabled,
        portalContainer,
        resolvedLabels,
        controller,
        setExpanded,
        overflowing,
        canClear,
        clear,
      ],
    )

    return (
      <ComplexFilterContext.Provider value={value}>
        <div
          ref={setRefs}
          data-slot="complex-filter"
          data-testid="complex-filter-bar"
          data-expanded={expanded}
          className={cn(
            'flex min-h-afds-spacing-44 w-full items-start gap-afds-spacing-14 rounded-afds-sm bg-afds-bg-surface-sunken border-y border-transparent py-afds-spacing-4 pl-afds-spacing-14 pr-afds-spacing-10',
            !expanded && 'max-h-afds-spacing-44 overflow-hidden',
            className,
          )}
        >
          {/* WHY: 상하 투명 보더 1px 이 시안의 위아래 5px 여백을 만든다(5 는 spacing 토큰에 없다). min-h 44 안에서 첫 줄 34 가 가운데에 선다 */}
          {/* WHY: 좌·우 그룹은 모두 첫 줄(34)에 붙인다. 칩이 여러 줄이어도 바 높이의 가운데로 내려가지 않는다(운영센터 SearchFilter 도 align=start) */}
          {children === undefined ? DEFAULT_LAYOUT : children}
        </div>
      </ComplexFilterContext.Provider>
    )
  },
)
ComplexFilterRoot.displayName = 'ComplexFilter.Root'

export const ComplexFilter = {
  Root: ComplexFilterRoot,
  MatchMode,
  Input,
  Chip,
  Actions,
  CollapseToggle,
}
