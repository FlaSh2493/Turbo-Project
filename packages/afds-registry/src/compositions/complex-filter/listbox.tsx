'use client'

import { Typography } from '@turbo-project/afds/bricks'
import { Fragment, type ReactNode } from 'react'
import { ActiveRow, HoverScroll } from './hover-scroll'
import type { HoverList } from './reducer'
import type { FilterController } from './use-filter-controller'

interface ListboxRow {
  key: string
  testId: string
  label: ReactNode
  trailing?: ReactNode
  /** 키보드 하이라이트(= aria-activedescendant 가 가리키는 행) */
  active: boolean
  /** 다중 선택 값 목록의 선택 상태 — aria-selected 는 이것만 뜻한다 */
  selected?: boolean
}

interface ListboxProps {
  id: string
  ariaLabel: string
  rows: ListboxRow[]
  onPick: (at: number) => void
  onHover: (at: number) => void
  /** 행을 감싼다. 서브메뉴처럼 행을 앵커로 쓰는 팝업이 카드 폭 전체의 행 박스를 필요로 할 때 쓴다 */
  wrapRow?: (row: ReactNode, at: number) => ReactNode
  /** 길어지면 스크롤한다(스크롤바는 hover 시). 부모 팝업이 최대 높이를 정한다 */
  scroll?: boolean
}

export const hoverHandler = (controller: FilterController, list: HoverList) => (index: number) =>
  controller.dispatch({
    type: 'hover',
    list,
    index,
    count: controller.counts[list],
  })

export const rowId = (listId: string, at: number) => `${listId}-${at}`

/**
 * 입력이 포커스를 쥔 채 aria-activedescendant 로 가리키는 목록이다. AFDS Menu/Select 는 포커스를 목록으로
 * 옮기는 패턴이라 이 combobox 에 맞지 않아 Popover 안에 직접 그린다. 행 클릭이 입력의 포커스를 뺏지 않게 mousedown 을 막는다
 */
export function Listbox({
  id,
  ariaLabel,
  rows,
  onPick,
  onHover,
  wrapRow,
  scroll = false,
}: ListboxProps) {
  const list = (
    <div
      id={id}
      role="listbox"
      aria-label={ariaLabel}
      className="flex flex-col gap-afds-spacing-4 py-afds-spacing-10"
    >
      {rows.map((row, at) => {
        const node = (
          <ActiveRow
            active={row.active}
            id={rowId(id, at)}
            role="option"
            aria-selected={row.selected ?? false}
            className={`flex h-afds-spacing-34 w-full cursor-pointer items-center justify-between gap-afds-spacing-4 rounded-afds-sm px-afds-spacing-10 ${
              row.selected || row.active ? 'bg-afds-interaction-selected-overlay' : ''
            } ${row.selected && row.active ? 'ring-1 ring-inset ring-afds-border-focus' : ''}`}
            onMouseDown={event => event.preventDefault()}
            onMouseEnter={() => onHover(at)}
            onClick={() => onPick(at)}
            data-testid={row.testId}
            data-active={row.active || undefined}
          >
            <Typography
              as="span"
              variant="body3"
              color={row.active ? 'text-brand-subtle' : 'text-primary'}
              className="flex min-w-0 flex-1 items-center gap-afds-spacing-4"
            >
              {typeof row.label === 'string' ? (
                <span className="truncate" title={row.label}>
                  {row.label}
                </span>
              ) : (
                row.label
              )}
            </Typography>
            {row.trailing}
          </ActiveRow>
        )
        // wrapRow 가 있으면 감싸는 쪽이 카드 폭 전체와 좌우 여백(px-afds-spacing-10)을 책임진다 — 앵커 박스가 카드 폭이어야 서브메뉴가 카드 오른쪽 + 8 에 뜬다
        return wrapRow ? (
          <Fragment key={row.key}>{wrapRow(node, at)}</Fragment>
        ) : (
          <div key={row.key} role="presentation" className="px-afds-spacing-10">
            {node}
          </div>
        )
      })}
    </div>
  )
  return scroll ? <HoverScroll>{list}</HoverScroll> : list
}
