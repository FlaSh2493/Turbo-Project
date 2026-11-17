import type {
  ColumnDef,
  ColumnPinningState,
  ColumnFiltersState,
  PaginationState,
  Row,
  SortingState,
  RowSelectionState,
  TableState,
  OnChangeFn,
  TableOptions,
} from '@tanstack/react-table'

export interface UseTableOptions<TData> {
  /** Row data */
  data: TData[]

  /** Column definitions */
  columns: ColumnDef<TData, unknown>[]

  /** Enable sorting feature */
  enableSorting?: boolean

  /** Manual (server-side) sorting — disables client-side sort row model */
  manualSorting?: boolean

  /** Enable row selection feature */
  enableRowSelection?: boolean | ((row: Row<TData>) => boolean)

  /** Enable pagination feature */
  enablePagination?: boolean

  /** Enable column filters feature */
  enableColumnFilters?: boolean

  /** Enable column pinning feature */
  enableColumnPinning?: boolean

  /** Default page size for pagination */
  defaultPageSize?: number

  /** Initial column pinning state */
  initialColumnPinning?: ColumnPinningState

  /** Controlled state (optional) */
  state?: Partial<TableState>

  /** Sorting change callback */
  onSortingChange?: OnChangeFn<SortingState>

  /** Row selection change callback */
  onRowSelectionChange?: OnChangeFn<RowSelectionState>

  /** Pagination change callback */
  onPaginationChange?: OnChangeFn<PaginationState>

  /** Column filters change callback */
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>

  /** Column pinning change callback */
  onColumnPinningChange?: OnChangeFn<ColumnPinningState>

  /** Custom metadata passed to table instance (accessible via table.options.meta) */
  meta?: Record<string, unknown>

  /** Function to get unique row ID */
  getRowId?: TableOptions<TData>['getRowId']
}

export type {
  ColumnDef,
  ColumnPinningState,
  ColumnFiltersState,
  PaginationState,
  SortingState,
  RowSelectionState,
  TableState,
}
