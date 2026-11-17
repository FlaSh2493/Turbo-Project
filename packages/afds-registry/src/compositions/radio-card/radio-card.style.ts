import { cva } from 'class-variance-authority'

// Container — RadioGroup.Container의 base(group/r, flex 등)에 카드 외형을 더한다.
// flex-row-reverse로 라벨(좌) / 라디오 dot(우) 배치. 후손 Item의 data-* 상태를 has-[]로 감지.
export const cardContainerVariants = cva([
  'w-full flex-row-reverse justify-between px-3.5 py-2.5 rounded-[5px] border transition-colors duration-200',
  'border-afds-border-strong bg-afds-bg-surface',
  'has-[[data-checked]]:border-afds-border-brand-subtle',
  'has-[[data-disabled]]:cursor-not-allowed has-[[data-disabled]]:bg-afds-bg-surface-sunken',
  '[&:not(:has([data-disabled]))]:hover:bg-afds-interaction-hover-overlay',
])

// Label — peer/r(Item) 상태를 peer-data-로 감지해 텍스트 색상 결정.
// RadioGroup.Label의 기본 색상(default)이 섞이지 않도록 카드 전용 span으로 렌더한다(자급식).
export const cardLabelVariants = cva([
  'body2 overflow-hidden text-ellipsis whitespace-nowrap user-select-none transition-colors duration-200 cursor-pointer',
  'text-left text-afds-text-primary',
  'peer-data-[checked]/r:text-afds-text-brand-subtle',
  'peer-data-[disabled]/r:peer-data-[unchecked]/r:text-afds-text-secondary',
  'peer-data-[disabled]/r:cursor-not-allowed',
])
