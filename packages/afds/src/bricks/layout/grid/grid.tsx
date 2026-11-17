'use client'

import * as React from 'react'
import { cn } from '../../../lib/utils'
import { gridVariants } from './grid.style'
import { Box } from '../../layout/box'
import type { PrimitiveSpacing } from '../../../schemas/tokens.schema'

export interface GridProps extends React.ComponentPropsWithoutRef<typeof Box> {
  /**
   * 그리드 열의 개수 또는 템플릿 문자열
   */
  columns?: number | string
  /**
   * 그리드 행의 개수 또는 템플릿 문자열
   */
  rows?: number | string
  /**
   * 양방향 간격 (x, y 동시 적용, AFDS spacing 토큰)
   */
  gap?: PrimitiveSpacing
  /**
   * 수평 간격 (AFDS spacing 토큰)
   */
  gapX?: PrimitiveSpacing
  /**
   * 수직 간격 (AFDS spacing 토큰)
   */
  gapY?: PrimitiveSpacing
  /**
   * 그리드 항목 배치 흐름
   */
  flow?: 'row' | 'col' | 'row-dense' | 'col-dense'
  /**
   * 수직 정렬
   */
  align?: 'start' | 'center' | 'end' | 'stretch'
  /**
   * 수평 정렬
   */
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  /**
   * 추가 className
   */
  className?: string
}

const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  ({ className, columns, rows, gap, gapX, gapY, flow, align, justify, style, ...props }, ref) => {
    return (
      <Box
        ref={ref}
        data-slot="grid"
        className={cn(gridVariants({ flow, align, justify, gap, gapX, gapY }), className)}
        style={{
          ...style,
          ...(typeof columns === 'number'
            ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }
            : {}),
          ...(typeof columns === 'string' ? { gridTemplateColumns: columns } : {}),
          ...(typeof rows === 'number'
            ? { gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }
            : {}),
          ...(typeof rows === 'string' ? { gridTemplateRows: rows } : {}),
        }}
        {...props}
      />
    )
  },
)
Grid.displayName = 'Grid'

export { Grid }
