'use client'

import { createContext, forwardRef, useContext } from 'react'
import * as React from 'react'
import { Progress as ProgressPrimitive } from '@base-ui/react/progress'
import { cn } from '../../../lib/utils'
import {
  progressIndicatorBase,
  progressLabelBase,
  progressTrackBase,
  progressValueBase,
} from './progress.style'

// Context

interface ProgressContextValue {
  percentage: number
  displayValue: string
}

const ProgressContext = createContext<ProgressContextValue | null>(null)

function useProgressContext() {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('Progress sub-components must be used within Progress.Root')
  return ctx
}

export type ProgressRootProps = Omit<ProgressPrimitive.Root.Props, 'value' | 'max'> & {
  /**
   * 현재 진행도 값
   * @default 0
   */
  value?: number
  /**
   * 최대 진행도 값
   * @default 100
   */
  max?: number
}

export const ProgressRoot = forwardRef<
  React.ComponentRef<typeof ProgressPrimitive.Root>,
  ProgressRootProps
>(({ value = 0, max = 100, children, ...props }, ref) => {
  const safeValue = Number.isFinite(value) ? value : 0
  const safeMax = Number.isFinite(max) && max > 0 ? max : 100
  const clampedValue = Math.min(safeMax, Math.max(0, safeValue))
  const percentage = (clampedValue / safeMax) * 100
  const displayValue = `${Math.round(percentage)}%`

  return (
    <ProgressContext.Provider value={{ percentage, displayValue }}>
      <ProgressPrimitive.Root
        ref={ref}
        value={clampedValue}
        max={safeMax}
        data-slot="progress"
        {...props}
      >
        {children}
      </ProgressPrimitive.Root>
    </ProgressContext.Provider>
  )
})
ProgressRoot.displayName = 'ProgressRoot'

export interface ProgressTrackProps extends ProgressPrimitive.Track.Props {
  /**
   * 추가 className
   */
  className?: string
}

export const ProgressTrack = forwardRef<
  React.ComponentRef<typeof ProgressPrimitive.Track>,
  ProgressTrackProps
>(({ className, ...props }, ref) => {
  return (
    <ProgressPrimitive.Track
      ref={ref}
      data-slot="progress-track"
      className={cn(progressTrackBase, className)}
      {...props}
    />
  )
})
ProgressTrack.displayName = 'ProgressTrack'

export interface ProgressIndicatorProps extends ProgressPrimitive.Indicator.Props {
  /**
   * 추가 className
   */
  className?: string
}

export const ProgressIndicator = forwardRef<
  React.ComponentRef<typeof ProgressPrimitive.Indicator>,
  ProgressIndicatorProps
>(({ className, ...props }, ref) => {
  return (
    <ProgressPrimitive.Indicator
      ref={ref}
      data-slot="progress-indicator"
      className={cn(progressIndicatorBase, 'bg-afds-bg-selected', className)}
      {...props}
    />
  )
})
ProgressIndicator.displayName = 'ProgressIndicator'

// Value

export interface ProgressValueProps extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * 추가 className
   */
  className?: string
}

export const ProgressValue = forwardRef<HTMLSpanElement, ProgressValueProps>(
  ({ className, ...props }, ref) => {
    const { percentage, displayValue } = useProgressContext()

    return (
      <>
        <span
          ref={ref}
          data-slot="progress-value"
          className={cn(
            progressValueBase,
            'left-1/2 -translate-x-1/2 text-afds-text-secondary',
            className,
          )}
          {...props}
        >
          {displayValue}
        </span>
        <div
          aria-hidden="true"
          data-slot="progress-value-foreground"
          className="pointer-events-none absolute inset-0"
          style={{ clipPath: `inset(0 ${100 - percentage}% 0 0)` }}
        >
          <span
            className={cn(progressValueBase, 'text-afds-text-inverse left-1/2 -translate-x-1/2')}
          >
            {displayValue}
          </span>
        </div>
      </>
    )
  },
)
ProgressValue.displayName = 'ProgressValue'

export interface ProgressLabelProps extends ProgressPrimitive.Label.Props {
  /**
   * 추가 className
   */
  className?: string
}

export const ProgressLabel = forwardRef<
  React.ComponentRef<typeof ProgressPrimitive.Label>,
  ProgressLabelProps
>(({ className, ...props }, ref) => (
  <ProgressPrimitive.Label
    ref={ref}
    data-slot="progress-label"
    className={cn(progressLabelBase, className)}
    {...props}
  />
))
ProgressLabel.displayName = 'ProgressLabel'

export const Progress = Object.assign(ProgressRoot, {
  Track: ProgressTrack,
  Indicator: ProgressIndicator,
  Value: ProgressValue,
  Label: ProgressLabel,
})
