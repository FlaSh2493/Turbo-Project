'use client'

import type { VariantProps } from 'class-variance-authority'
import { forwardRef } from 'react'
import { cn } from '../../../lib/utils'
import { spinnerVariants } from './spinner.style'

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg'
export type SpinnerFullscreen = VariantProps<typeof spinnerVariants>['fullscreen']
export type SpinnerDim = VariantProps<typeof spinnerVariants>['dim']

export interface SpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof spinnerVariants> {
  /**
   * 스피너 크기
   * - `xs`: 16px
   * - `sm`: 24px
   * - `md`: 32px
   * - `lg`: 48px
   * @default 'sm'
   */
  size?: SpinnerSize
  /**
   * 전체화면 오버레이 모드
   * - `container`: 부모 요소 기준 absolute (부모에 `position: relative` 필요)
   * - `viewport`: 화면 전체 fixed — 전역 로딩에만 사용
   * @default 'container'
   */
  fullscreen?: SpinnerFullscreen
  /**
   * 오버레이 배경 딤 색상
   * - `white`: 밝은 배경 위 반투명 화이트
   * - `dark`: 어두운 배경 위 반투명 다크
   * @default 'white'
   */
  dim?: SpinnerDim
  /**
   * 추가 className
   */
  className?: string
}

export const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(
  ({ size = 'sm', fullscreen = 'container', dim = 'white', className, ...props }, ref) => {
    const geometry = {
      xs: { viewBox: 16, radius: 6, strokeWidth: 2 },
      sm: { viewBox: 24, radius: 10, strokeWidth: 2 },
      md: { viewBox: 32, radius: 14, strokeWidth: 4 },
      lg: { viewBox: 48, radius: 22, strokeWidth: 4 },
    }[size]

    const center = geometry.viewBox / 2
    const circumference = 2 * Math.PI * geometry.radius

    return (
      <div
        ref={ref}
        data-slot="spinner"
        data-size={size}
        data-fullscreen={fullscreen}
        data-dim={dim}
        role="status"
        aria-label="loading"
        className={cn(spinnerVariants({ fullscreen, dim }), className)}
        {...props}
      >
        <svg
          data-slot="spinner-svg"
          viewBox={`0 0 ${geometry.viewBox} ${geometry.viewBox}`}
          fill="none"
          className="animate-spin [animation-duration:1.4s]"
          width={geometry.viewBox}
          height={geometry.viewBox}
        >
          <circle
            data-slot="spinner-track"
            cx={center}
            cy={center}
            r={geometry.radius}
            strokeWidth={geometry.strokeWidth}
            className="stroke-afds-gray-200"
          />
          <circle
            data-slot="spinner-indicator"
            cx={center}
            cy={center}
            r={geometry.radius}
            strokeWidth={geometry.strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeLinecap="round"
            className="stroke-afds-gray-500 [animation:spinner-dash_1.4s_ease-in-out_infinite]"
          />
        </svg>
      </div>
    )
  },
)

Spinner.displayName = 'Spinner'
