'use client'

import { Popover } from '@turbo-project/afds/bricks'
import { SearchIcon } from 'lucide-react'
import { forwardRef } from 'react'
import { cn } from '@turbo-project/afds/lib/utils'
import { Chip } from './chip'
import { useComplexFilterContext } from './complex-filter.context'
import { FieldMenu, SubMenu } from './field-menu'
import { SuggestList } from './suggest-list'
import { rowId } from './listbox'
import { CARD_CLASS, keepFocusOnPopupPress, POPUP_ATTR, stripTriggerSemantics } from './popup'
import type { ComplexFilterInputProps } from './types'

const LIST_TYPES = new Set(['menu', 'suggest', 'submenu'])

/** 입력 아이콘 + 칩 + 입력칸과, 입력을 앵커로 하는 필드 메뉴·추천 팝업 */
export const Input = forwardRef<HTMLDivElement, ComplexFilterInputProps>(
  ({ children, className }, ref) => {
    const { config, controller, expanded, setExpanded } = useComplexFilterContext()
    const { chips, recentSearches, portalContainer, labels, disabled, maxLength } = config
    const { ui, subRow, dispatch } = controller
    const listOpen = LIST_TYPES.has(ui.type)
    const container = portalContainer ?? undefined
    const focusInSub = subRow?.type === 'field' && subRow.field.multiple !== false
    const emptyRecent = subRow?.type === 'recent' && !recentSearches?.items.length

    const activeId =
      ui.type === 'menu' || ui.type === 'suggest'
        ? rowId(controller.listId, ui.index)
        : ui.type === 'submenu' && !focusInSub && !emptyRecent
          ? rowId(controller.subListId, ui.subIndex)
          : undefined

    const input = (
      <input
        ref={controller.inputRef}
        role="combobox"
        aria-expanded={listOpen}
        aria-controls={
          listOpen ? (ui.type === 'submenu' ? controller.subListId : controller.listId) : undefined
        }
        aria-activedescendant={listOpen ? activeId : undefined}
        aria-autocomplete="list"
        value={controller.draft}
        onChange={event => dispatch({ type: 'draft', value: event.target.value })}
        onClick={() => dispatch({ type: 'open' })}
        onKeyDown={controller.onKeyDown}
        onPaste={controller.onPaste}
        onFocus={() => {
          if (!expanded) setExpanded(true)
        }}
        onBlur={event => controller.leaveIfOutside(event.relatedTarget)}
        placeholder={labels.searchPlaceholder}
        aria-label={labels.search}
        disabled={disabled}
        maxLength={maxLength}
        // WHY: 시안 고정 폭 160px — AFDS spacing 토큰(최대 60)에 없고 Tailwind 숫자 스케일은 rem 기반이라 호스트에 따라 값이 변한다. 래칫 baseline 예외 6곳 중 하나(arbitrary-token-ratchet.baseline.json)
        className="body3 h-afds-spacing-34 w-[160px] shrink-0 rounded-afds-sm border border-afds-border-default bg-afds-bg-surface-sunken px-afds-spacing-10 text-afds-text-primary outline-none placeholder:text-afds-text-disabled"
        data-testid="complex-filter-input"
      />
    )

    return (
      <div
        ref={ref}
        // 빈 여백 클릭은 마우스 편의 — 키보드 경로는 입력(↓·클릭)이 맡는다
        role="presentation"
        data-slot="complex-filter-input"
        className={cn(
          'flex min-w-0 flex-1 cursor-text flex-wrap items-center gap-afds-spacing-4',
          className,
        )}
        onClick={event => {
          // WHY: 칩 수정·서브메뉴 팝업은 포털로 그려지지만 React 트리로는 이 영역의 하위라 클릭이 전파돼 온다.
          // DOM 으로 이 영역 안쪽인 클릭만 빈 여백 클릭으로 본다
          const target = event.target as Node
          if (!event.currentTarget.contains(target)) return
          if (!(target as HTMLElement).closest('button, input, [role=option]')) {
            controller.openMenu()
          }
        }}
      >
        <SearchIcon
          width={16}
          height={16}
          className="shrink-0 text-afds-icon-secondary"
          aria-hidden
        />
        {children === undefined ? chips.map(chip => <Chip key={chip.id} chip={chip} />) : children}
        <Popover.Root
          open={listOpen}
          onOpenChange={(next, details) => {
            // WHY: 입력이 트리거를 겸해 클릭마다 토글 요청이 온다. 열기는 입력·방향키·빈 여백이, 닫기는 바깥 클릭·Esc 가 정한다
            if (next || details?.reason === 'trigger-press') return
            dispatch({ type: 'close' })
          }}
        >
          <Popover.Trigger
            nativeButton={false}
            render={props => (
              <span
                {...stripTriggerSemantics(props)}
                // WHY: base-ui 가 render 인자로 넘기는 data-slot="popover-trigger" 를 우리 값이 덮는다(spread 뒤). 이 앵커는 Popover 트리거가 아니라 입력의 래퍼다
                data-slot="complex-filter-input-anchor"
                className="inline-flex shrink-0"
              >
                {input}
              </span>
            )}
          />
          <Popover.Content
            align="start"
            alignOffset={-10}
            sideOffset={5}
            // WHY: 시안 고정 폭 160px — AFDS spacing 토큰(최대 60)에 없고 Tailwind 숫자 스케일은 rem 기반이라 호스트에 따라 값이 변한다. 래칫 baseline 예외 6곳 중 하나(arbitrary-token-ratchet.baseline.json)
            className={`${CARD_CLASS} w-[160px]`}
            container={container}
            initialFocus={false}
            finalFocus={false}
            side="bottom"
            {...{ [POPUP_ATTR]: '' }}
            onMouseDown={keepFocusOnPopupPress}
            onBlur={event => controller.leaveIfOutside(event.relatedTarget)}
          >
            {ui.type === 'suggest' ? (
              <SuggestList controller={controller} labels={labels} />
            ) : (
              <FieldMenu
                controller={controller}
                labels={labels}
                container={container}
                subMenu={
                  <SubMenu
                    controller={controller}
                    chips={chips}
                    recentSearches={recentSearches}
                    labels={labels}
                  />
                }
              />
            )}
          </Popover.Content>
        </Popover.Root>
      </div>
    )
  },
)
Input.displayName = 'ComplexFilter.Input'
