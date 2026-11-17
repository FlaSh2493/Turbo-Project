'use client'

import { Typography } from '@turbo-project/afds/bricks'
import { hoverHandler, Listbox } from './listbox'
import type { FilterController } from './use-filter-controller'
import type { ComplexFilterConfig } from './types'

type Labels = ComplexFilterConfig['labels']

interface ListProps {
  controller: FilterController
  labels: Labels
}

/** 입력이 있을 때의 추천 목록. 키워드 필드 전부를 늘 보여 준다(입력값으로 거르지 않음) */
export function SuggestList({ controller, labels }: ListProps) {
  const index = controller.ui.type === 'suggest' ? controller.ui.index : -1
  return (
    <Listbox
      id={controller.listId}
      ariaLabel={labels.listbox}
      onPick={controller.addKeyword}
      onHover={hoverHandler(controller, 'suggest')}
      rows={controller.keywordFields.map((field, at) => {
        const conditionLabel = labels.conditions[field.conditions[0] ?? 'like']
        const before = labels.keywordPhrase.before(field.label, conditionLabel)
        const after = labels.keywordPhrase.after(field.label, conditionLabel)
        return {
          key: field.key,
          testId: `complex-filter-suggestion-${field.key}`,
          label: (
            <>
              {before && (
                // WHY: 라벨·연산자는 한 줄 고정이다. 값이 길어도 글자 단위로 세로 줄바꿈되지 않게 줄어들지 않게 하고(shrink-0),
                // 긴 필드명이 값 자리를 다 먹지 않게 라벨에는 상한을 둔다
                <Typography
                  as="span"
                  variant="body3"
                  color="text-primary"
                  // WHY: 시안 고정 폭 88 (max-w)px — AFDS spacing 토큰(최대 60)에 없고 Tailwind 숫자 스케일은 rem 기반이라 호스트에 따라 값이 변한다. 래칫 baseline 예외 6곳 중 하나(arbitrary-token-ratchet.baseline.json)
                  className="max-w-[88px] shrink-0 truncate whitespace-nowrap"
                >
                  {before}
                </Typography>
              )}
              <span className="min-w-0 flex-1 truncate" title={controller.draft.trim()}>
                <Typography as="span" variant="title4" color="text-brand-subtle">
                  {controller.draft.trim()}
                </Typography>
              </span>
              {after && (
                <Typography
                  as="span"
                  variant="body3"
                  color="text-primary"
                  className="shrink-0 whitespace-nowrap"
                >
                  {after}
                </Typography>
              )}
            </>
          ),
          active: at === index,
        }
      })}
    />
  )
}
