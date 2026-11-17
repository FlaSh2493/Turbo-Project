export type PaginationItemDescriptor =
  | { type: 'page'; value: number; selected: boolean; index: number }
  | { type: 'ellipsis'; index: number }

export interface UsePaginationProps {
  totalPages: number
  pageRange?: number
  defaultPage?: number
  currentPage?: number
  onPageChange?: (page: number) => void
}

export interface UsePaginationReturn {
  items: PaginationItemDescriptor[]
  currentPage: number
  totalPages: number
  isFirst: boolean
  isLast: boolean
  goTo: (page: number) => void
  prev: () => void
  next: () => void
}
