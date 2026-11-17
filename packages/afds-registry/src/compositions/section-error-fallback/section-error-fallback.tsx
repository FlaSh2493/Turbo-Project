'use client'

import { forwardRef } from 'react'
import { CircleAlertIcon } from 'lucide-react'
import { Button, Flex, Typography } from '@turbo-project/afds/bricks'
import { cn } from '@turbo-project/afds/lib/utils'

export interface SectionErrorFallbackProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  message?: string
  retryText?: string
  reset?: () => void
}

export const SectionErrorFallback = forwardRef<HTMLDivElement, SectionErrorFallbackProps>(
  (
    {
      title = 'Something went wrong',
      message = 'Please try again later.',
      retryText = 'Retry',
      reset,
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <Flex
        ref={ref}
        data-slot="section-error-fallback"
        direction="column"
        align="center"
        justify="center"
        gap="spacing-4"
        className={cn('py-20', className)}
        {...props}
      >
        <CircleAlertIcon width={120} height={120} />
        <Flex direction="column" align="center" gap="spacing-4">
          <Typography variant="title2" color="text-primary">
            {title}
          </Typography>
          <Typography variant="body2" color="text-secondary">
            {message}
          </Typography>
        </Flex>
        {reset && (
          <Button variant="primary-line" size="md" onClick={reset}>
            {retryText}
          </Button>
        )}
      </Flex>
    )
  },
)
SectionErrorFallback.displayName = 'SectionErrorFallback'
