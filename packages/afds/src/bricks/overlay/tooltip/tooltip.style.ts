import { cva } from 'class-variance-authority'

export const closeVariants = cva(
  'cursor-pointer p-0.5 transition-opacity duration-200 hover:opacity-70',
)

export const contentVariants = cva(
  'z-50 max-w-[300px] rounded-[5px] bg-afds-gray-700 text-afds-text-inverse transition-all duration-200 opacity-100 scale-100 data-[starting-style]:opacity-0 data-[starting-style]:scale-90 data-[ending-style]:opacity-0 data-[ending-style]:scale-90',
  {
    variants: {
      size: {
        sm: 'px-2 py-1 text-[10px] font-bold leading-4',
        md: 'px-2 py-2.25 body3 leading-4',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
)

export const arrowVariants = cva(
  'absolute w-3.5 h-2.25 bg-afds-gray-700 [clip-path:polygon(50%_0%,100%_100%,0%_100%)] data-[side=top]:bottom-[-8px] data-[side=top]:rotate-180 data-[side=bottom]:top-[-8px] data-[side=bottom]:rotate-0 data-[side=left]:right-[-10px] data-[side=left]:rotate-90 data-[side=right]:left-[-10px] data-[side=right]:-rotate-90',
)
