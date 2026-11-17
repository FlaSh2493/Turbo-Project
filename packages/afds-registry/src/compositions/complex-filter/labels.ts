import type { ComplexFilterLabels, ComplexFilterLabelsOverride } from './types'

export const DEFAULT_LABELS: ComplexFilterLabels = {
  search: 'Search',
  searchPlaceholder: 'Search and filter',
  clear: 'Clear',
  removeChip: text => `Remove ${text}`,
  conditions: { like: 'contains', unlike: 'excludes' },
  keywordTitle: field => field,
  keywordPhrase: {
    before: (field, condition) => `${field} ${condition}`,
    after: () => '',
  },
  editor: {
    cancel: 'Cancel',
    apply: 'Apply',
    emptyValue: 'Enter a value',
    clearValue: 'Clear input',
  },
  listbox: 'Filter list',
  recent: {
    title: 'Recent searches',
    empty: 'No search history',
    remove: item => `Remove ${item}`,
  },
  toggle: { expand: 'Expand filters', collapse: 'Collapse filters' },
  hiddenChips: 'More filters are hidden',
}

/** override 를 기본 문구 위에 얹는다. 객체형 문구는 한 단계만 병합하고 함수형·문자열 문구는 통째로 교체한다 */
export function resolveLabels(override?: ComplexFilterLabelsOverride): ComplexFilterLabels {
  const merged: Record<string, unknown> = { ...DEFAULT_LABELS }
  for (const [key, value] of Object.entries(override ?? {})) {
    if (value === undefined) continue
    const base = merged[key]
    merged[key] =
      typeof value === 'object' && typeof base === 'object'
        ? { ...(base as object), ...value }
        : value
  }
  return merged as unknown as ComplexFilterLabels
}
