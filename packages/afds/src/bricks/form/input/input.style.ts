import { cva } from 'class-variance-authority'

// 상태 스타일은 base-ui/네이티브 속성 기반 data-attr 셀렉터로 구동한다.
// - 기본(enabled=completed): base 클래스
// - fixed: input의 native `:read-only`
// - error: Root/Field의 `data-error`(prop 기반)
// - disabled: base-ui `data-disabled` / native `disabled` (최우선 — 뒤에 배치)
export const inputRootVariants = cva(
  [
    'relative flex items-center rounded-[5px] border transition-[color,background-color,border-color] duration-200',
    // enabled / completed (기본)
    'border-afds-border-default bg-afds-bg-surface-sunken',
    'has-[:focus-visible]:bg-afds-bg-surface has-[:focus-visible]:border-afds-border-focus',
    // fixed (readonly)
    'has-[:read-only]:bg-afds-bg-surface has-[:read-only]:has-[:focus-visible]:border-afds-border-default',
    // error
    'data-[error]:bg-afds-bg-surface data-[error]:border-afds-border-error data-[error]:has-[:focus-visible]:border-afds-border-error',
    // disabled (최우선)
    'data-[disabled]:cursor-not-allowed data-[disabled]:border-afds-border-default data-[disabled]:bg-afds-bg-disabled',
  ],
  {
    variants: {
      size: {
        md: 'h-11 gap-2.5 px-3.5 body2',
        sm: 'h-[34px] gap-2.5 px-2.5 body3',
      },
    },
    defaultVariants: {
      size: 'sm',
    },
  },
)

export const inputFieldVariants = cva([
  'flex-1 w-full bg-transparent outline-none placeholder:transition-colors duration-200',
  // enabled (기본)
  'text-afds-text-primary placeholder:text-afds-text-disabled',
  // fixed (readonly)
  'read-only:cursor-default read-only:placeholder:text-afds-text-primary',
  // error
  'data-[error]:text-afds-text-error data-[error]:placeholder:text-afds-text-error',
  // disabled (최우선)
  'disabled:cursor-not-allowed disabled:text-afds-text-disabled disabled:placeholder:text-afds-text-disabled',
])

export const inputClearButtonVariants = cva(
  'flex h-4 w-4 flex-shrink-0 cursor-pointer items-center justify-center text-afds-text-secondary transition-colors duration-200',
)
