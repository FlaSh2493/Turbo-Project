import { cva } from 'class-variance-authority'

// Container — group/cbx 컨텍스트를 만들어 자식 part가 Root 상태를 감지하게 함
export const rootVariants = cva(
  'flex items-center gap-2 group/cbx cursor-pointer has-[[data-disabled]]:cursor-not-allowed',
)

// Root — base-ui Checkbox.Root가 data-checked/unchecked/indeterminate/disabled 자동 부여
export const checkboxVariants = cva([
  'peer/cbx flex-shrink-0 w-[16px] h-[16px] flex items-center justify-center rounded-[5px] border transition-all duration-200 overflow-hidden cursor-pointer',
  'bg-afds-bg-surface border-afds-border-strong',
  'data-[checked]:bg-afds-bg-selected data-[checked]:border-afds-border-brand-subtle',
  'data-[disabled]:bg-afds-bg-disabled data-[disabled]:cursor-not-allowed',
  'data-[disabled]:data-[checked]:border-afds-border-strong',
])

// Indicator — pure layout
export const indicatorVariants = cva('flex items-center justify-center w-full h-full text-current')

// IndeterminateMark — indeterminate 상태에서만 표시 + disabled 색상
export const indeterminateIndicatorVariants = cva([
  'h-2 w-2 rounded-[2px]',
  'bg-afds-bg-selected',
  'group-has-[[data-disabled]]/cbx:bg-afds-gray-400',
  'hidden group-has-[[data-indeterminate]]/cbx:block',
])

// CheckMark — checked 상태에서만 표시 (indeterminate일 땐 숨김)
export const checkMarkVariants = cva([
  'hidden group-has-[[data-checked]]/cbx:flex items-center justify-center',
  '[&>svg]:w-3 [&>svg]:h-3',
  'text-afds-text-inverse',
  'group-has-[[data-disabled]]/cbx:text-afds-gray-400',
])

// Label — peer/cbx (Root)의 data-* 속성을 peer-data- 로 감지
export const labelVariants = cva([
  'body2 user-select-none w-full cursor-pointer',
  'text-afds-text-primary',
  'peer-data-[disabled]/cbx:text-afds-text-secondary peer-data-[disabled]/cbx:cursor-not-allowed',
])
