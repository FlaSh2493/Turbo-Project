export const SCROLL_INDICATOR_WIDTH = 100
export const SCROLL_INDICATOR_HEIGHT = 52
export const SCROLL_INDICATOR_TRACK_PADDING = 10
export const SCROLL_INDICATOR_VIEWPORT_WIDTH = 60

export const scrollIndicatorRootBase =
  'absolute z-[1] h-[52px] w-[100px] rounded-[5px] bg-afds-bg-surface p-[10px] shadow-afds-1'

export const scrollIndicatorTrackBase =
  'relative flex h-full flex-col overflow-hidden rounded-[5px]'

export const scrollIndicatorHeaderBase = 'h-[7px] shrink-0 bg-afds-gray-300'

export const scrollIndicatorBodyBase = 'min-h-0 flex-1 bg-afds-bg-surface-sunken'

export const scrollIndicatorViewportBase =
  'border-afds-border-brand-subtle absolute inset-y-0 cursor-grab rounded-[5px] border-2 active:cursor-grabbing'
