import { cva } from 'class-variance-authority'

// Container — 후손 Item의 data-* 속성을 has-[]로 감지
export const rootVariants = cva(
  'flex items-center gap-2 group/r cursor-pointer has-[[data-disabled]]:cursor-not-allowed',
)

// Item (Radio.Root) — peer/r + group/r. base-ui가 data-checked/unchecked/disabled 자동 부여
export const radioVariants = cva([
  'peer/r group/r w-4 h-4 flex-shrink-0 rounded-full border transition-all duration-200 outline-none cursor-pointer',
  'bg-afds-bg-surface border-afds-border-focus',
  'data-[checked]:bg-afds-bg-selected data-[checked]:border-afds-border-brand-subtle',
  'data-[disabled]:cursor-not-allowed data-[disabled]:border-afds-gray-500',
  'data-[checked]:data-[disabled]:bg-afds-gray-500 data-[checked]:data-[disabled]:border-afds-gray-500',
  'data-[unchecked]:data-[disabled]:bg-afds-bg-surface',
])

// Indicator — pure layout
export const indicatorVariants = cva('flex items-center justify-center w-3.5 h-3.5')

// Dot — Item(group/r) data-disabled로 색상 변경
export const radioDotVariants = cva([
  'h-1.5 w-1.5 rounded-full bg-afds-bg-surface',
  'group-data-[disabled]/r:bg-afds-bg-disabled',
])

// Label — peer Item의 data-* 자동 감지
export const labelVariants = cva([
  'body2 overflow-hidden text-ellipsis whitespace-nowrap user-select-none transition-colors duration-200 cursor-pointer',
  'w-full text-afds-text-primary',
  'peer-data-[disabled]/r:text-afds-text-secondary peer-data-[disabled]/r:cursor-not-allowed',
])
