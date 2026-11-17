'use client'

import * as React from 'react'

export interface BoxProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * 추가 className
   */
  className?: string
  /**
   * 자식 요소
   */
  children?: React.ReactNode
}

const Box = React.forwardRef<HTMLDivElement, BoxProps>(({ className, ...props }, ref) => {
  return <div data-slot="box" className={className} ref={ref} {...props} />
})
Box.displayName = 'Box'

export { Box }
