import React from 'react'
import type { Column } from '@tanstack/react-table'

/**
 * Returns true if the column is the last left-pinned column.
 * Pass table.getLeftLeafColumns() as leftLeafColumns for accurate detection.
 */
export function isLastLeftPinnedColumn(
  column: Column<unknown>,
  leftLeafColumns: Column<unknown>[],
): boolean {
  return (
    column.getIsPinned() === 'left' && leftLeafColumns[leftLeafColumns.length - 1]?.id === column.id
  )
}

/**
 * Returns true if the column is the first right-pinned column.
 * Pass table.getRightLeafColumns() as rightLeafColumns for accurate detection.
 */
export function isFirstRightPinnedColumn(
  column: Column<unknown>,
  rightLeafColumns: Column<unknown>[],
): boolean {
  return column.getIsPinned() === 'right' && rightLeafColumns[0]?.id === column.id
}

/**
 * Returns CSS position offset for a pinned column.
 * Uses TanStack Table's getStart/getAfter for accurate offset calculation.
 */
export function getPinStyle(column: Column<unknown>): React.CSSProperties {
  const isPinned = column.getIsPinned()
  if (!isPinned) return {}
  return {
    left: isPinned === 'left' ? `${column.getStart('left')}px` : undefined,
    right: isPinned === 'right' ? `${column.getAfter('right')}px` : undefined,
  }
}
