'use client'

import { Popover } from '@turbo-project/afds/bricks'
import { XIcon } from 'lucide-react'
import { forwardRef } from 'react'
import { cn } from '@turbo-project/afds/lib/utils'
import { selectedValues, toChipViews } from './chips'
import { ChipText } from './chip-text'
import { useComplexFilterContext } from './complex-filter.context'
import { KeywordEditForm } from './keyword-edit-form'
import { OptionPicker } from './option-picker'
import { CARD_CLASS, POPUP_ATTR, keepFocusOnPopupPress } from './popup'
import type { ComplexFilterChipProps } from './types'

/**
 * 칩 자체가 수정 팝오버의 앵커다. 트리거를 칩의 좌측 끝(-ml-px 로 테두리까지)부터 깔아
 * `align="start"` 만으로 팝오버 좌측 끝이 칩 좌측 끝과 맞는다 — 좌표 보정 없음
 */
export const Chip = forwardRef<HTMLSpanElement, ComplexFilterChipProps>(
  ({ chip: chipValue, className }, ref) => {
    const { config, controller } = useComplexFilterContext()
    const { chips, fields, labels, portalContainer, disabled, maxLength } = config
    const view = toChipViews([chipValue], fields, labels)[0]
    if (!view) return null
    const { chip, field } = view
    const { ui, dispatch } = controller
    const open = ui.type === 'edit' && ui.chipId === chip.id
    const editable = chip.editable !== false && !disabled
    const deletable = chip.deletable !== false

    const close = () => {
      dispatch({ type: 'close' })
      controller.focusInput()
    }

    return (
      <span
        ref={ref}
        data-slot="complex-filter-chip"
        // WHY: 시안 칩 최대 폭 250 — AFDS spacing 토큰(최대 60)에 없고 Tailwind 숫자 스케일은 rem 기반이라 호스트에 따라 값이 변한다. 래칫 baseline 예외 6곳 중 하나(arbitrary-token-ratchet.baseline.json)
        className={cn(
          'inline-flex h-afds-spacing-34 min-w-afds-spacing-50 max-w-[min(250px,100%)] shrink-0 items-stretch rounded-afds-pill border border-afds-border-default bg-afds-bg-surface',
          className,
        )}
        data-testid="complex-filter-chip"
        data-chip-id={chip.id}
      >
        {editable ? (
          <Popover.Root
            open={open}
            onOpenChange={next => {
              if (next) dispatch({ type: 'edit', chipId: chip.id, chip })
              else if (open) dispatch({ type: 'close' })
            }}
          >
            <Popover.Trigger
              className="-ml-px flex min-w-0 cursor-pointer items-center gap-afds-spacing-8 rounded-l-afds-pill pl-afds-spacing-14"
              data-testid="complex-filter-chip-edit"
            >
              <ChipText view={view} />
            </Popover.Trigger>
            <Popover.Content
              align="start"
              // WHY: 최대 높이 430px(사용자 지정, 화면이 더 작으면 가용 높이) — AFDS spacing 토큰(최대 60)에 없어 baseline 예외로 기재한다
              // WHY: 시안 고정 폭 200px — AFDS spacing 토큰(최대 60)에 없고 Tailwind 숫자 스케일은 rem 기반이라 호스트에 따라 값이 변한다. 래칫 baseline 예외 6곳 중 하나(arbitrary-token-ratchet.baseline.json)
              className={`${CARD_CLASS} flex max-h-[min(var(--available-height),430px)] w-[200px] flex-col`}
              container={portalContainer ?? undefined}
              side="bottom"
              sideOffset={4}
              aria-label={field.label}
              {...{ [POPUP_ATTR]: '' }}
            >
              <div
                role="presentation"
                className="flex min-h-0 flex-1 flex-col"
                onMouseDown={keepFocusOnPopupPress}
              >
                {chip.kind === 'keyword' && field.type === 'keyword' ? (
                  <KeywordEditForm
                    field={field}
                    chip={chip}
                    labels={labels}
                    maxLength={maxLength}
                    onCancel={close}
                    onApply={(value, condition) =>
                      controller.editKeyword(chip.id, value, condition)
                    }
                  />
                ) : (
                  field.type === 'select' && (
                    <OptionPicker
                      field={field}
                      selected={selectedValues(chips, field.key)}
                      labels={labels}
                      single={field.multiple === false}
                      onCancel={close}
                      onApply={values => controller.applySelect(field, values)}
                    />
                  )
                )}
              </div>
            </Popover.Content>
          </Popover.Root>
        ) : (
          <span className="-ml-px flex min-w-0 items-center gap-afds-spacing-8 pl-afds-spacing-14">
            <ChipText view={view} />
          </span>
        )}
        {deletable ? (
          <button
            type="button"
            aria-label={labels.removeChip(view.text)}
            disabled={disabled}
            className="flex cursor-pointer items-center pl-afds-spacing-8 pr-afds-spacing-14 disabled:cursor-default"
            onClick={() => controller.removeById(chip.id)}
          >
            <XIcon width={16} height={16} className="text-afds-icon-secondary" aria-hidden />
          </button>
        ) : (
          <span className="pr-afds-spacing-14" />
        )}
      </span>
    )
  },
)
Chip.displayName = 'ComplexFilter.Chip'
