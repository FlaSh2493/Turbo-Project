'use client'

import { Popover, Typography } from '@turbo-project/afds/bricks'
import { CheckIcon, ChevronRightIcon, XIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { selectedValues } from './chips'
import { hoverHandler, Listbox } from './listbox'
import { OptionPicker } from './option-picker'
import {
  CARD_CLASS,
  isInsidePopup,
  keepFocusOnPopupPress,
  POPUP_ATTR,
  stripTriggerSemantics,
} from './popup'
import type { ComplexFilterConfig, ComplexFilterSelectField } from './types'
import type { FilterController } from './use-filter-controller'

type Labels = ComplexFilterConfig['labels']

interface ListProps {
  controller: FilterController
  labels: Labels
}

interface FieldMenuProps extends ListProps {
  /** 열린 행의 서브메뉴 내용 */
  subMenu: ReactNode
  container?: HTMLElement
}

/**
 * 입력이 비었을 때의 필드 메뉴. 행 우측 › 가 서브메뉴를 뜻하고, 서브메뉴는 **열린 행 자신을 앵커로**
 * 오른쪽에 뜬다(상단 = 행 상단, 좌측 = 카드 오른쪽 + 8). 부모 하이라이트는 서브메뉴를 연 행에 고정된다
 */
export function FieldMenu({ controller, labels, subMenu, container }: FieldMenuProps) {
  const { ui } = controller
  const active = ui.type === 'menu' ? ui.index : ui.type === 'submenu' ? ui.menuIndex : -1
  return (
    <Listbox
      id={controller.listId}
      ariaLabel={labels.listbox}
      onPick={controller.enterSub}
      onHover={hoverHandler(controller, 'menu')}
      rows={controller.menuRows.map((row, at) => ({
        key: row.type === 'recent' ? 'recent' : row.field.key,
        testId:
          row.type === 'recent' ? 'complex-filter-recent' : `complex-filter-field-${row.field.key}`,
        label: row.type === 'recent' ? labels.recent.title : row.field.label,
        trailing: (
          <ChevronRightIcon
            width={16}
            height={16}
            className="shrink-0 text-afds-icon-primary"
            aria-hidden
          />
        ),
        active: at === active,
      }))}
      wrapRow={(row, at) => {
        const open = ui.type === 'submenu' && ui.menuIndex === at
        const menuRow = controller.menuRows[at]
        return (
          <Popover.Root
            open={open}
            onOpenChange={(next, details) => {
              if (next || !open || details?.reason === 'trigger-press') return
              // WHY: 운영센터는 부모 필드 메뉴 카드를 눌러도 서브메뉴(와 토글해 둔 값)를 그대로 둔다. base-ui 는 이를
              // 하위 팝업의 바깥 클릭으로 닫으므로 부모 카드 안을 향한 누름은 무시한다. Esc·진짜 바깥 누름은 메뉴 전체를 닫는다
              if (details?.reason === 'outside-press') {
                if (isInsidePopup(details.event?.target ?? null)) return
                controller.closeAll()
              } else if (details?.reason === 'escape-key') controller.closeAll()
              else controller.leaveSub()
            }}
          >
            <Popover.Trigger
              nativeButton={false}
              render={props => (
                <div
                  {...stripTriggerSemantics(props)}
                  // WHY: base-ui 가 넘기는 data-slot="popover-trigger" 를 우리 값이 덮는다(spread 뒤). 이 행은 Popover 트리거가 아니라 서브메뉴 앵커 행이다
                  data-slot="complex-filter-field-row"
                  role="presentation"
                  className="px-afds-spacing-10"
                >
                  {row}
                </div>
              )}
            />
            <Popover.Content
              align="start"
              // WHY: 시안 고정 폭 180px — AFDS spacing 토큰(최대 60)에 없고 Tailwind 숫자 스케일은 rem 기반이라 호스트에 따라 값이 변한다. 래칫 baseline 예외 6곳 중 하나(arbitrary-token-ratchet.baseline.json)
              // WHY: 최대 높이 430px(사용자 지정, 화면이 더 작으면 가용 높이) — AFDS spacing 토큰(최대 60)에 없어 baseline 예외로 기재한다
              className={`${CARD_CLASS} flex max-h-[min(var(--available-height),430px)] w-[180px] flex-col`}
              container={container}
              initialFocus={false}
              finalFocus={false}
              side="right"
              sideOffset={8}
              aria-label={menuRow?.type === 'field' ? menuRow.field.label : labels.recent.title}
              {...{ [POPUP_ATTR]: '' }}
              onMouseDown={keepFocusOnPopupPress}
              onBlur={event => controller.leaveIfOutside(event.relatedTarget)}
            >
              {subMenu}
            </Popover.Content>
          </Popover.Root>
        )
      }}
    />
  )
}

interface SubMenuProps extends Pick<ComplexFilterConfig, 'chips' | 'recentSearches' | 'labels'> {
  controller: FilterController
}

/** 필드 메뉴 행의 서브메뉴 — 최근 검색 / 단일 선택(즉시 적용) / 다중 선택(취소·적용 푸터) */
export function SubMenu({ controller, chips, recentSearches, labels }: SubMenuProps) {
  const { subRow, dispatch } = controller
  if (!subRow) return null

  if (subRow.type === 'recent') {
    return (
      <RecentList
        controller={controller}
        labels={labels}
        items={recentSearches?.items ?? []}
        onRemove={item => recentSearches?.onRemove(item)}
      />
    )
  }

  const { field } = subRow
  const selected = selectedValues(chips, field.key)
  if (field.multiple === false) {
    return <OptionList controller={controller} field={field} selected={selected} />
  }
  return (
    <OptionPicker
      key={field.key}
      listId={controller.subListId}
      field={field}
      selected={selected}
      labels={labels}
      autoFocus
      showTitle={false}
      onBack={controller.leaveSub}
      onCancel={() => {
        dispatch({ type: 'close' })
        controller.focusInput()
      }}
      onApply={values => controller.applySelect(field, values)}
    />
  )
}

const subIndex = (controller: FilterController) =>
  controller.ui.type === 'submenu' ? controller.ui.subIndex : -1

interface RecentProps extends ListProps {
  items: string[]
  onRemove: (item: string) => void
}

/** 최근 검색 서브메뉴. 고르면 입력에 채워 추천 모드로 넘어간다(바로 칩이 되지 않는다) */
export function RecentList({ controller, labels, items, onRemove }: RecentProps) {
  if (items.length === 0) {
    return (
      <div id={controller.subListId} role="listbox" aria-label={labels.recent.title}>
        <Typography
          as="p"
          variant="body3"
          color="text-secondary"
          className="px-afds-spacing-20 py-afds-spacing-20"
          data-testid="complex-filter-recent-empty"
        >
          {labels.recent.empty}
        </Typography>
      </div>
    )
  }
  return (
    <Listbox
      id={controller.subListId}
      ariaLabel={labels.recent.title}
      scroll
      onPick={controller.pickSub}
      onHover={hoverHandler(controller, 'sub')}
      rows={items.map((item, at) => ({
        key: item,
        testId: 'complex-filter-recent-item',
        label: <span className="truncate">{item}</span>,
        trailing: (
          <button
            type="button"
            tabIndex={-1}
            aria-label={labels.recent.remove(item)}
            className="flex shrink-0 cursor-pointer items-center justify-center"
            onClick={event => {
              event.stopPropagation()
              onRemove(item)
            }}
            data-testid="complex-filter-recent-remove"
          >
            <XIcon width={16} height={16} className="text-afds-icon-secondary" aria-hidden />
          </button>
        ),
        active: at === subIndex(controller),
      }))}
    />
  )
}

interface OptionListProps {
  controller: FilterController
  field: ComplexFilterSelectField
  selected: string[]
}

/** 단일 선택 서브메뉴. 고르는 즉시 적용되고 닫힌다 */
export function OptionList({ controller, field, selected }: OptionListProps) {
  const selectedSet = new Set(selected)
  return (
    <Listbox
      id={controller.subListId}
      ariaLabel={field.label}
      scroll
      onPick={controller.pickSub}
      onHover={hoverHandler(controller, 'sub')}
      rows={field.options.map((option, at) => ({
        key: option.value,
        testId: `complex-filter-option-${field.key}-${option.value}`,
        label: option.label,
        trailing: selectedSet.has(option.value) ? (
          <CheckIcon width={16} height={16} className="text-afds-icon-brand-subtle" aria-hidden />
        ) : undefined,
        active: at === subIndex(controller),
        selected: selectedSet.has(option.value),
      }))}
    />
  )
}
