'use client'

import { forwardRef, type ReactNode } from 'react'
import { InfoIcon } from 'lucide-react'
import { Flex, Typography } from '@turbo-project/afds/bricks'
import { cn } from '@turbo-project/afds/lib/utils'

export interface FloatingActionBarCountProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 선택된 항목 개수 */
  count: number
  /**
   * count를 표시 텍스트로 변환하는 포매터. 한국어 등 다국어 표현이 필요하면 소비자가 주입한다.
   * @default (count) => `${count} selected`
   */
  formatter?: (count: number) => ReactNode
}

export const FloatingActionBarCount = forwardRef<HTMLDivElement, FloatingActionBarCountProps>(
  ({ count, formatter, className, ...props }, ref) => (
    <Flex
      ref={ref}
      gap="spacing-8"
      align="center"
      data-slot="floating-action-bar-count"
      className={cn(className)}
      {...props}
    >
      <InfoIcon size={16} className="h-[16px] w-[16px] text-afds-icon-primary" />
      <Typography variant="title3" className="text-afds-text-primary">
        {formatter ? formatter(count) : `${count} selected`}
      </Typography>
    </Flex>
  ),
)
FloatingActionBarCount.displayName = 'FloatingActionBarCount'
