export const paginationRootBase = 'flex items-center justify-center gap-2.5'

export const paginationListBase = 'flex items-center gap-2.5'

const paginationItemBaseShared =
  'flex h-6 w-6 items-center justify-center rounded-full border border-transparent transition-all title4'

export const paginationItemBase = `${paginationItemBaseShared} text-afds-text-secondary hover:bg-afds-interaction-hover-overlay data-[active=true]:bg-afds-bg-selected data-[active=true]:text-afds-text-inverse data-[active=true]:hover:bg-afds-bg-selected`

export const paginationEllipsisBase = `${paginationItemBaseShared} text-afds-text-disabled pointer-events-none`

export const paginationNavBase = `${paginationItemBaseShared} text-afds-text-secondary hover:text-afds-text-primary hover:bg-afds-interaction-hover-overlay disabled:text-afds-text-disabled disabled:pointer-events-none`
