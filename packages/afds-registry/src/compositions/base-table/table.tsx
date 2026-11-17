'use client'

import React from 'react'
import {
  flexRender,
  type Table as TTable,
  type Header,
  type Row,
  type Cell,
  type Column,
} from '@tanstack/react-table'
import { ArrowUpDownIcon, ArrowDownIcon, ArrowUpIcon } from 'lucide-react'
import { Button, Flex, ScrollArea, Typography } from '@turbo-project/afds/bricks'
import { cn } from '@turbo-project/afds/lib/utils'

import { isLastLeftPinnedColumn, isFirstRightPinnedColumn, getPinStyle } from './table-utils'

import {
  PIN_HEAD_CLASSNAMES,
  PIN_CELL_CLASSNAMES,
  PIN_LEFT_SHADOW,
  PIN_RIGHT_SHADOW,
  HEAD_CELL_CLASSNAMES,
  BODY_CELL_CLASSNAMES,
  getRowHeightClass,
  type BaseTableSize,
} from './table.style'
import { TableContext, useTableContext } from './table.context'
import { useTableScrollState, type TableScrollContextValue } from './hooks'

// BaseTable Components

export type ColumnMetaAlign = 'left' | 'center' | 'right'

export interface ColumnMeta {
  align?: ColumnMetaAlign
  cellAlign?: ColumnMetaAlign
  headerAlign?: ColumnMetaAlign
  width?: string
  minWidth?: string
  maxWidth?: string
  style?: React.CSSProperties
}

const ALIGN_JUSTIFY: Record<ColumnMetaAlign, string> = {
  left: 'justify-start',
  center: 'justify-center',
  right: 'justify-end',
}

const getMeta = <T,>(column: Column<T, unknown>): ColumnMeta =>
  (column.columnDef.meta as ColumnMeta | undefined) ?? {}

const getHeaderAlignClass = <T,>(column: Column<T, unknown>) => {
  const meta = getMeta(column)
  return ALIGN_JUSTIFY[meta.headerAlign ?? meta.align ?? 'center']
}

const getCellAlignClass = <T,>(column: Column<T, unknown>) => {
  const meta = getMeta(column)
  return ALIGN_JUSTIFY[meta.cellAlign ?? meta.align ?? 'center']
}

const getSortPaddingClass = <T,>(column: Column<T, unknown>) => {
  const meta = getMeta(column)
  const cellAlign = meta.cellAlign ?? meta.align ?? 'center'
  return column.getCanSort() && (cellAlign === 'center' || cellAlign === 'right') ? 'pr-7' : ''
}

const getColumnPassthroughStyle = <T,>(
  column: Column<T, unknown>,
): React.CSSProperties | undefined => {
  const { style } = getMeta(column)
  return style && Object.keys(style).length ? style : undefined
}

export type BaseTableLayout = 'fill' | 'auto'

// 컬럼 meta(width/minWidth/maxWidth)로부터 grid-template-columns 한 트랙을 만든다.
// layout 'fill' — 남은 공간을 1fr 로 비례 분배(테이블 폭 분배와 동일).
// layout 'auto' — 지정된 너비만 사용하여 컨테이너가 컬럼 합만큼만 차지.
// pinned 컬럼은 sticky 오프셋 정확도를 위해 항상 고정 너비를 유지.
const buildColumnTrack = <T,>(column: Column<T, unknown>, layout: BaseTableLayout): string => {
  const { width, minWidth, maxWidth } = getMeta(column)
  const isPinned = !!column.getIsPinned()
  if (isPinned && width) return width
  if (layout === 'auto') {
    if (width) return width
    if (minWidth && maxWidth) return `minmax(${minWidth}, ${maxWidth})`
    if (minWidth) return minWidth
    if (maxWidth) return `minmax(0, ${maxWidth})`
    return 'auto'
  }
  if (width && maxWidth) return `minmax(${width}, ${maxWidth})`
  if (width) return `minmax(${width}, 1fr)`
  if (minWidth && maxWidth) return `minmax(${minWidth}, ${maxWidth})`
  if (minWidth) return `minmax(${minWidth}, 1fr)`
  if (maxWidth) return `minmax(0, ${maxWidth})`
  return 'minmax(0, 1fr)'
}

const TableScrollContext = React.createContext<TableScrollContextValue>({
  isScrolledLeft: false,
  isScrolledRight: false,
})

// ─── BaseTable.Root ─────────────────────────────────────────────────────────

interface BaseTableRootProps<TData = unknown> {
  /**
   * TanStack Table 인스턴스 (필수)
   */
  table: TTable<TData>
  /**
   * 하위 요소 (BaseTable.Header, BaseTable.Body)
   */
  children?: React.ReactNode
  /**
   * 외부 컨테이너 클래스
   */
  className?: string
  /**
   * 내부 grid 컨테이너 클래스
   */
  tableClassName?: string
  /**
   * 행 높이 사이즈
   * @default 'md'
   */
  size?: BaseTableSize
  /**
   * 컬럼 폭 분배 방식
   * - `'fill'`: 컨테이너 전체 폭을 채우도록 비례 분배(기본)
   * - `'auto'`: 컬럼 너비 합만큼만 차지(남는 공간 없음)
   * @default 'fill'
   */
  layout?: BaseTableLayout
  /**
   * 수평 스크롤바 숨김
   * @default false
   */
  hideHorizontalScroll?: boolean
  /**
   * 수직 스크롤바 숨김
   * @default false
   */
  hideVerticalScroll?: boolean
  /**
   * ScrollArea viewport 참조
   */
  viewportRef?: React.Ref<HTMLDivElement>
}

const BaseTableSizeContext = React.createContext<BaseTableSize>('md')

const BaseTableRoot = React.forwardRef(function BaseTableRoot<TData>(
  {
    table,
    className,
    tableClassName,
    size = 'md',
    layout = 'fill',
    hideHorizontalScroll,
    hideVerticalScroll,
    viewportRef,
    children,
  }: BaseTableRootProps<TData>,
  ref: React.Ref<HTMLDivElement>,
) {
  const internalViewportRef = React.useRef<HTMLDivElement>(null)
  const resolvedViewportRef = (viewportRef ??
    internalViewportRef) as React.RefObject<HTMLDivElement>
  const { scrollState, updateScrollState } = useTableScrollState(resolvedViewportRef)

  const handleScroll = (e: React.UIEvent<Element>) => {
    updateScrollState(e.target as Element)
  }

  const hasLeftPin = table.getLeftLeafColumns().length > 0
  const hasRightPin = table.getRightLeafColumns().length > 0

  const visibleLeafColumns = table.getVisibleLeafColumns() as Column<unknown>[]
  const gridTemplateColumns = visibleLeafColumns
    .map(column => buildColumnTrack(column, layout))
    .join(' ')

  return (
    <TableScrollContext.Provider value={scrollState}>
      <BaseTableSizeContext.Provider value={size}>
        <TableContext.Provider value={table as TTable<unknown>}>
          <div ref={ref} data-slot="base-table" role="grid" className="relative">
            <ScrollArea
              className={cn(
                'rounded-lg border border-afds-border-default bg-afds-bg-surface',
                className,
              )}
              hideHorizontal={hideHorizontalScroll}
              hideVertical={hideVerticalScroll}
              viewportRef={resolvedViewportRef}
              contentClassName="h-full w-full"
              onScrollCapture={handleScroll}
              scrollBarVerticalStyle={{ zIndex: 2 }}
              scrollBarHorizontalStyle={{ zIndex: 2 }}
            >
              <div
                data-slot="base-table-grid"
                className={cn(
                  'grid h-full',
                  layout === 'fill' ? 'w-full min-w-full' : 'w-max',
                  tableClassName,
                )}
                // eslint-disable-next-line no-restricted-syntax -- gridTemplateColumns 은 컬럼 meta 로부터 런타임 계산
                style={{ gridTemplateColumns }}
              >
                {children}
              </div>
            </ScrollArea>
            {!hasLeftPin && scrollState.isScrolledLeft && (
              <div className="pointer-events-none absolute inset-y-0 left-0 w-8 rounded-l-lg bg-gradient-to-r from-black/5 to-transparent" />
            )}
            {!hasRightPin && scrollState.isScrolledRight && (
              <div className="pointer-events-none absolute inset-y-0 right-0 w-8 rounded-r-lg bg-gradient-to-r from-transparent to-black/5" />
            )}
          </div>
        </TableContext.Provider>
      </BaseTableSizeContext.Provider>
    </TableScrollContext.Provider>
  )
}) as unknown as (<TData>(
  props: BaseTableRootProps<TData> & React.RefAttributes<HTMLDivElement>,
) => React.ReactElement) & { displayName?: string }
BaseTableRoot.displayName = 'BaseTable.Root'

// ─── BaseTable.Header ───────────────────────────────────────────────────────

interface BaseTableHeaderProps<_TData = unknown> extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * 헤더 셀에 적용할 추가 클래스
   */
  headClassName?: string
}

const BaseTableHeader = React.forwardRef(function BaseTableHeader<TData>(
  { className, headClassName, ...props }: BaseTableHeaderProps<TData>,
  ref: React.Ref<HTMLDivElement>,
) {
  const table = useTableContext<TData>()
  const { isScrolledLeft, isScrolledRight } = React.useContext(TableScrollContext)
  const size = React.useContext(BaseTableSizeContext)
  const leftLeafCols = table.getLeftLeafColumns() as Column<unknown>[]
  const rightLeafCols = table.getRightLeafColumns() as Column<unknown>[]
  const heightClass = getRowHeightClass(size)
  return (
    <div
      ref={ref}
      role="rowgroup"
      data-slot="base-table-header"
      className={cn('sticky top-0 z-2 col-span-full grid grid-cols-subgrid self-start', className)}
      {...props}
    >
      {table.getHeaderGroups().map(headerGroup => (
        <div
          key={headerGroup.id}
          role="row"
          data-slot="base-table-row"
          className="col-span-full grid grid-cols-subgrid"
        >
          {headerGroup.headers.map((header: Header<TData, unknown>) => {
            const isPinned = header.column.getIsPinned()
            const isLastLeft = isLastLeftPinnedColumn(
              header.column as Column<unknown>,
              leftLeafCols,
            )
            const isFirstRight = isFirstRightPinnedColumn(
              header.column as Column<unknown>,
              rightLeafCols,
            )
            const pinStyle = getPinStyle(header.column as Column<unknown>)
            return (
              <div
                key={header.id}
                role="columnheader"
                data-slot="base-table-head"
                className={cn(
                  'group',
                  HEAD_CELL_CLASSNAMES,
                  heightClass,
                  PIN_HEAD_CLASSNAMES,
                  isLastLeft && isScrolledLeft && PIN_LEFT_SHADOW,
                  isFirstRight && isScrolledRight && PIN_RIGHT_SHADOW,
                  headClassName,
                )}
                // eslint-disable-next-line no-restricted-syntax -- pinning offset 은 런타임 계산값
                style={{ ...getColumnPassthroughStyle(header.column), ...pinStyle }}
                data-pinned={isPinned || undefined}
                data-last-left-pin={isLastLeft || undefined}
                data-first-right-pin={isFirstRight || undefined}
              >
                <Flex align="center" className={cn('h-full', getHeaderAlignClass(header.column))}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {header.column.getCanSort() && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className={cn(
                        'ml-1 shrink-0 bg-afds-interaction-hover-overlay text-afds-text-secondary transition-opacity hover:bg-afds-interaction-hover-overlay',
                        header.column.getIsSorted()
                          ? 'opacity-100'
                          : 'opacity-0 group-hover:opacity-100',
                      )}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {header.column.getIsSorted() === 'asc' ? (
                        <ArrowUpIcon size={16} />
                      ) : header.column.getIsSorted() === 'desc' ? (
                        <ArrowDownIcon size={16} />
                      ) : (
                        <ArrowUpDownIcon size={16} />
                      )}
                    </Button>
                  )}
                </Flex>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}) as unknown as (<TData>(
  props: BaseTableHeaderProps<TData> & React.RefAttributes<HTMLDivElement>,
) => React.ReactElement) & { displayName?: string }
BaseTableHeader.displayName = 'BaseTable.Header'

// ─── BaseTable.Body ─────────────────────────────────────────────────────────

interface BaseTableBodyProps<TData = unknown> extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * 행 클래스 (정적 또는 row 기반 동적)
   */
  rowClassName?: string | ((row: Row<TData>) => string)
  /**
   * 셀 클래스 (정적 또는 cell 기반 동적)
   */
  cellClassName?: string | ((cell: Cell<TData, unknown>) => string)
  /**
   * pinned 셀이 행 호버 시 배경을 동기화할지 결정하는 콜백
   */
  isPinnedHoverEnabled?: (row: Row<TData>) => boolean
  /**
   * 셀별 스타일 오버라이드 (pinStyle 을 함께 인자로 받음)
   */
  getCellStyle?: (
    cell: Cell<TData, unknown>,
    pinStyle: React.CSSProperties,
  ) => React.CSSProperties | undefined
}

const BaseTableBody = React.forwardRef(function BaseTableBody<TData>(
  {
    className,
    rowClassName,
    cellClassName,
    getCellStyle,
    isPinnedHoverEnabled,
    ...props
  }: BaseTableBodyProps<TData>,
  ref: React.Ref<HTMLDivElement>,
) {
  const table = useTableContext<TData>()
  const { isScrolledLeft, isScrolledRight } = React.useContext(TableScrollContext)
  const size = React.useContext(BaseTableSizeContext)
  const leftLeafCols = table.getLeftLeafColumns() as Column<unknown>[]
  const rightLeafCols = table.getRightLeafColumns() as Column<unknown>[]
  const rows = table.getRowModel().rows
  const heightClass = getRowHeightClass(size)

  return (
    <div
      ref={ref}
      role="rowgroup"
      data-slot="base-table-body"
      className={cn('col-span-full grid grid-cols-subgrid', className)}
      {...props}
    >
      {rows.map((row: Row<TData>) => (
        <div
          key={row.id}
          role="row"
          data-slot="base-table-row"
          className={cn(
            'group/row col-span-full grid grid-cols-subgrid',
            'hover:bg-afds-interaction-hover-overlay transition-colors duration-150',
            typeof rowClassName === 'function' ? rowClassName(row) : rowClassName,
          )}
          data-selected={row.getIsSelected() || undefined}
        >
          {row.getVisibleCells().map((cell: Cell<TData, unknown>) => {
            const isPinned = cell.column.getIsPinned()
            const isLastLeft = isLastLeftPinnedColumn(cell.column as Column<unknown>, leftLeafCols)
            const isFirstRight = isFirstRightPinnedColumn(
              cell.column as Column<unknown>,
              rightLeafCols,
            )
            const pinStyle = getPinStyle(cell.column as Column<unknown>)
            return (
              <div
                key={cell.id}
                role="gridcell"
                data-slot="base-table-cell"
                className={cn(
                  BODY_CELL_CLASSNAMES,
                  heightClass,
                  PIN_CELL_CLASSNAMES,
                  isPinned &&
                    cn(
                      'bg-afds-bg-surface transition-colors duration-150',
                      (!isPinnedHoverEnabled || isPinnedHoverEnabled(row)) &&
                        'group-hover/row:bg-afds-bg-surface-sunken',
                    ),
                  isLastLeft && isScrolledLeft && PIN_LEFT_SHADOW,
                  isFirstRight && isScrolledRight && PIN_RIGHT_SHADOW,
                  typeof cellClassName === 'function' ? cellClassName(cell) : cellClassName,
                )}
                // eslint-disable-next-line no-restricted-syntax -- pinning·사용자 cell 스타일은 런타임 계산값
                style={{
                  ...getColumnPassthroughStyle(cell.column),
                  ...pinStyle,
                  ...getCellStyle?.(cell, pinStyle),
                }}
                data-pinned={isPinned || undefined}
                data-last-left-pin={isLastLeft || undefined}
                data-first-right-pin={isFirstRight || undefined}
              >
                <div
                  className={cn(
                    'flex h-full items-center',
                    getCellAlignClass(cell.column),
                    getSortPaddingClass(cell.column),
                  )}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}) as unknown as (<TData>(
  props: BaseTableBodyProps<TData> & React.RefAttributes<HTMLDivElement>,
) => React.ReactElement) & { displayName?: string }
BaseTableBody.displayName = 'BaseTable.Body'

// ─── BaseTable.Fallback ─────────────────────────────────────────────────────

interface BaseTableFallbackProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
}

const BaseTableFallback = React.forwardRef<HTMLDivElement, BaseTableFallbackProps>(
  ({ className, children, ...props }, ref) => {
    const size = React.useContext(BaseTableSizeContext)
    const heightClass = getRowHeightClass(size)
    return (
      <div
        ref={ref}
        role="rowgroup"
        data-slot="base-table-fallback"
        className={cn('col-span-full grid grid-cols-subgrid', className)}
        {...props}
      >
        <div role="row" data-slot="base-table-row" className="col-span-full grid grid-cols-subgrid">
          <div
            role="gridcell"
            data-slot="base-table-cell"
            className={cn('text-center', heightClass, 'flex items-center justify-center')}
            // eslint-disable-next-line no-restricted-syntax -- empty row 가 전체 컬럼을 차지하도록 런타임 계산
            style={{ gridColumn: '1 / -1' }}
          >
            <Typography variant="body2" color="text-disabled">
              {children}
            </Typography>
          </div>
        </div>
      </div>
    )
  },
)
BaseTableFallback.displayName = 'BaseTable.Fallback'

export const BaseTable = {
  Root: BaseTableRoot,
  Header: BaseTableHeader,
  Body: BaseTableBody,
  Fallback: BaseTableFallback,
}

export type { BaseTableRootProps, BaseTableHeaderProps, BaseTableBodyProps, BaseTableFallbackProps }
