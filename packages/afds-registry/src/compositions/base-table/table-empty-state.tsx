'use client'

import { forwardRef, type ReactNode } from 'react'
import { InboxIcon } from 'lucide-react'
import { Flex, Typography } from '@turbo-project/afds/bricks'

interface TableEmptyStateProps {
  className?: string
  /**
   * 빈 상태 메시지.
   * @default 'No data'
   */
  text?: ReactNode
}

export const TableEmptyState = forwardRef<HTMLDivElement, TableEmptyStateProps>(
  ({ className, text = 'No data' }, ref) => (
    <Flex
      ref={ref}
      data-slot="table-empty-state"
      direction="column"
      align="center"
      justify="center"
      gap="spacing-20"
      className={className}
    >
      <InboxIcon width={180} height={100} />
      <Typography variant="title3" color="text-secondary">
        {text}
      </Typography>
    </Flex>
  ),
)

TableEmptyState.displayName = 'TableEmptyState'
