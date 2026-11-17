'use client'

import { Typography } from '@turbo-project/afds/bricks'
import type { ChipView } from './chips'

export function ChipText({ view }: { view: ChipView }) {
  return (
    <>
      {view.before && (
        <Typography as="span" variant="title4" color="text-secondary" className="whitespace-nowrap">
          {view.before}
        </Typography>
      )}
      <Typography as="span" variant="title4" color="text-brand-subtle" className="min-w-0 truncate">
        {view.value}
      </Typography>
      {view.after && (
        <Typography as="span" variant="title4" color="text-secondary" className="whitespace-nowrap">
          {view.after}
        </Typography>
      )}
    </>
  )
}
