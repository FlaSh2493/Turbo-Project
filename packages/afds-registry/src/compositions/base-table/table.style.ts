export const PIN_HEAD_CLASSNAMES = 'data-[pinned]:sticky data-[pinned]:z-1'
export const PIN_CELL_CLASSNAMES = 'data-[pinned]:sticky data-[pinned]:z-1'
export const PIN_LEFT_SHADOW = 'shadow-[4px_0_6px_-2px_rgba(0,0,0,0.08)]'
export const PIN_RIGHT_SHADOW = 'shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.08)]'

export type BaseTableSize = 'sm' | 'md' | 'lg'

const ROW_HEIGHT: Record<BaseTableSize, string> = {
  sm: 'h-[40px]',
  md: 'h-[60px]',
  lg: 'h-[80px]',
}

export const HEAD_CELL_CLASSNAMES =
  'border-b border-afds-divider-default bg-afds-bg-surface-sunken px-3 text-afds-text-primary title3'

export const BODY_CELL_CLASSNAMES =
  'border-b border-afds-divider-default px-3 text-afds-text-primary body2'

export const getRowHeightClass = (size: BaseTableSize) => ROW_HEIGHT[size]
