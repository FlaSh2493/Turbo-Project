import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { vi, type Mock } from 'vitest'
import { ComplexFilter } from '..'
import type {
  ComplexFilterChip,
  ComplexFilterField,
  ComplexFilterLabels,
  ComplexFilterRootProps,
} from '../types'

export const FIELDS: ComplexFilterField[] = [
  {
    type: 'keyword',
    key: 'name',
    label: '이름',
    conditions: ['like', 'unlike'],
  },
  { type: 'keyword', key: 'id', label: 'ID', conditions: ['like'] },
  {
    type: 'select',
    key: 'media',
    label: '매체',
    options: [
      { value: 'KAKAO', label: 'Kakao' },
      { value: 'FACEBOOK', label: 'Meta' },
    ],
  },
  {
    type: 'select',
    key: 'status',
    label: '상태',
    multiple: false,
    options: [
      { value: 'pending', label: '실행 대기' },
      { value: 'done', label: '실행 완료' },
    ],
  },
]

export const LABELS: ComplexFilterLabels = {
  search: '검색',
  searchPlaceholder: '검색 및 필터링',
  clear: '지우기',
  removeChip: text => `${text} 삭제`,
  conditions: { like: '포함', unlike: '제외' },
  keywordTitle: field => `${field}에`,
  keywordPhrase: {
    before: field => `${field}에`,
    after: (_field, condition) => condition,
  },
  editor: {
    cancel: '취소',
    apply: '적용',
    emptyValue: '값을 입력해 주세요',
    clearValue: '입력 지우기',
  },
  listbox: '필터 목록',
  recent: {
    title: '최근 검색',
    empty: '검색 기록 없음',
    remove: item => `${item} 삭제`,
  },
  toggle: { expand: '필터 펼치기', collapse: '필터 접기' },
  hiddenChips: '가려진 칩이 더 있음',
}

export const kw = (
  id: string,
  value: string,
  extra: Partial<ComplexFilterChip> = {},
  fieldKey = 'name',
  condition: 'like' | 'unlike' = 'like',
) =>
  ({
    id,
    kind: 'keyword',
    fieldKey,
    condition,
    value,
    ...extra,
  }) as ComplexFilterChip
export const sel = (id: string, fieldKey: string, values: string[]): ComplexFilterChip => ({
  id,
  kind: 'select',
  fieldKey,
  values,
})

export interface SetupOptions extends Partial<ComplexFilterRootProps> {
  initial?: ComplexFilterChip[]
}

export const setup = ({ initial = [], ...extra }: SetupOptions = {}) => {
  const onChange = vi.fn()
  const onClear = vi.fn()
  function Harness() {
    const [chips, setChips] = useState(initial)
    return (
      <>
        <ComplexFilter.Root
          fields={FIELDS}
          chips={chips}
          onChange={next => {
            onChange(next)
            setChips(next)
          }}
          onClear={() => {
            onClear()
            setChips([])
          }}
          labels={LABELS}
          {...extra}
        />
        <button type="button">다음 요소</button>
      </>
    )
  }
  render(<Harness />)
  return { onChange, onClear, input: screen.getByRole('combobox') }
}

export const chipTexts = () =>
  screen.queryAllByTestId('complex-filter-chip').map(chip => chip.textContent)
export const type = (input: HTMLElement, text: string) =>
  fireEvent.change(input, { target: { value: text } })
export const press = (input: HTMLElement, key: string, init = {}) =>
  fireEvent.keyDown(input, { key, ...init })
export const lastCall = (fn: Mock) => fn.mock.calls[fn.mock.calls.length - 1]![0]
