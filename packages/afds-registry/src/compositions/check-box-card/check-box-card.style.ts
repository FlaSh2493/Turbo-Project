import { cva } from 'class-variance-authority'

// Container — CheckBox.Container의 base(group/cbx, flex 등)에 카드 외형을 더한다.
// Root의 data-* 상태를 has-[]로 감지해 border/배경을 결정.
export const cardContainerVariants = cva([
  'w-full justify-between px-[14px] py-[10px] rounded-[5px] border transition-colors duration-200',
  'border-afds-border-strong bg-afds-bg-surface',
  'has-[[data-checked]]:border-afds-border-brand-subtle',
  'has-[[data-disabled]]:cursor-not-allowed has-[[data-disabled]]:bg-afds-bg-surface-sunken',
  '[&:not(:has([data-disabled]))]:hover:bg-afds-interaction-hover-overlay',
])

// Label — peer/cbx(Root) 상태를 peer-data-로 감지해 텍스트 색상 결정.
// CheckBox.Label의 기본 색상(default)이 섞이지 않도록 카드 전용 span으로 렌더한다.
export const cardLabelVariants = cva([
  'body2 user-select-none w-full cursor-pointer',
  'text-afds-text-primary',
  'peer-data-[checked]/cbx:text-afds-text-brand-subtle',
  'peer-data-[disabled]/cbx:peer-data-[unchecked]/cbx:text-afds-text-disabled',
  'peer-data-[disabled]/cbx:cursor-not-allowed',
])

// CheckIcon — Container 후손이라 group-has-[]로 Root 상태 감지.
export const cardCheckIconVariants = cva([
  'flex-shrink-0 w-6 h-6 [&>svg]:w-full [&>svg]:h-full',
  'text-afds-text-secondary',
  'group-has-[[data-checked]]/cbx:text-afds-text-brand-subtle',
  'group-has-[[data-disabled]]/cbx:group-has-[[data-unchecked]]/cbx:text-afds-text-disabled',
])
