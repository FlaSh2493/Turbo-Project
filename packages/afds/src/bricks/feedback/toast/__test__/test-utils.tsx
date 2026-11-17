import { render, type RenderOptions, type RenderResult } from '@testing-library/react'
import type { ReactElement } from 'react'
import { Toaster } from '../toast'

export const CustomRenderer = (ui: ReactElement, options?: RenderOptions): RenderResult => {
  return render(
    <>
      {ui}
      <Toaster />
    </>,
    options,
  )
}
