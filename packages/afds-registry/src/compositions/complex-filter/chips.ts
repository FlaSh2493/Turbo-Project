import type {
  ComplexFilterChip,
  ComplexFilterCondition,
  ComplexFilterField,
  ComplexFilterKeywordChip,
  ComplexFilterKeywordField,
  ComplexFilterLabels,
  ComplexFilterSelectChip,
  ComplexFilterSelectField,
} from './types'

export const isKeywordField = (field: ComplexFilterField): field is ComplexFilterKeywordField =>
  field.type === 'keyword'

export const isSelectField = (field: ComplexFilterField): field is ComplexFilterSelectField =>
  field.type === 'select'

const SELECT_JOINER = ', '

/** 쉼표로 나눠 공백을 걷고 빈 값·중복·길이 초과를 버린다 */
export const splitKeywords = (raw: string, maxLength: number): string[] => [
  ...new Set(
    raw
      .split(',')
      .map(item => item.trim())
      .filter(item => item !== '' && item.length <= maxLength),
  ),
]

const sameKeyword = (
  chip: ComplexFilterChip,
  fieldKey: string,
  condition: ComplexFilterCondition,
  value: string,
) =>
  chip.kind === 'keyword' &&
  chip.fieldKey === fieldKey &&
  chip.condition === condition &&
  chip.value === value

interface AddOptions {
  maxChips?: number
  maxLength: number
  makeId: () => string
}

/** 입력 문자열로 키워드 칩을 끝에 더한다. 이미 있는 {필드·연산자·값} 은 무시한다 */
export function addKeywords(
  chips: ComplexFilterChip[],
  field: ComplexFilterKeywordField,
  raw: string,
  { maxChips, maxLength, makeId }: AddOptions,
): { chips: ComplexFilterChip[]; added: string[] } {
  const condition = field.conditions[0] ?? 'like'
  const room = maxChips === undefined ? Infinity : maxChips - chips.length
  const added = splitKeywords(raw, maxLength)
    .filter(value => !chips.some(chip => sameKeyword(chip, field.key, condition, value)))
    .slice(0, Math.max(0, room))
  const created: ComplexFilterKeywordChip[] = added.map(value => ({
    id: makeId(),
    kind: 'keyword',
    fieldKey: field.key,
    condition,
    value,
  }))
  return { chips: [...chips, ...created], added }
}

/** 칩 위치를 유지한 채 값·연산자를 바꾼다. 다른 칩과 같아지면 이 칩을 지운다 */
export function replaceKeyword(
  chips: ComplexFilterChip[],
  id: string,
  value: string,
  condition: ComplexFilterCondition,
): ComplexFilterChip[] {
  const target = chips.find(chip => chip.id === id)
  if (target?.kind !== 'keyword') return chips
  const duplicated = chips.some(
    chip => chip.id !== id && sameKeyword(chip, target.fieldKey, condition, value),
  )
  if (duplicated) return removeChip(chips, id)
  return chips.map(chip => (chip.id === id ? { ...target, value, condition } : chip))
}

/** 필드의 선택 칩을 제자리에서 바꾸거나(없으면 끝에 더하고) 값이 없으면 지운다. 값은 options 순서로 정렬한다 */
export function upsertSelect(
  chips: ComplexFilterChip[],
  field: ComplexFilterSelectField,
  values: string[],
  makeId: () => string,
): ComplexFilterChip[] {
  const wanted = new Set(values)
  const ordered = field.options.map(option => option.value).filter(value => wanted.has(value))
  const current = chips.find(chip => chip.kind === 'select' && chip.fieldKey === field.key)
  if (ordered.length === 0) return current ? removeChip(chips, current.id) : chips
  if (!current) {
    const created: ComplexFilterSelectChip = {
      id: makeId(),
      kind: 'select',
      fieldKey: field.key,
      values: ordered,
    }
    return [...chips, created]
  }
  return chips.map(chip => (chip.id === current.id ? { ...current, values: ordered } : chip))
}

export const removeChip = (chips: ComplexFilterChip[], id: string) =>
  chips.filter(chip => chip.id !== id)

/** 마지막 칩이 삭제 가능할 때만 돌려준다(삭제 불가 칩 뒤의 칩을 건너뛰지 않는다) */
export const lastRemovable = (chips: ComplexFilterChip[]) => {
  const last = chips[chips.length - 1]
  return last && last.deletable !== false ? last : undefined
}

export const hasClearable = (chips: ComplexFilterChip[]) =>
  chips.some(chip => chip.deletable !== false)

export const selectedValues = (chips: ComplexFilterChip[], fieldKey: string): string[] => {
  const chip = chips.find(item => item.kind === 'select' && item.fieldKey === fieldKey)
  return chip?.kind === 'select' ? chip.values : []
}

export interface ChipView {
  chip: ComplexFilterChip
  field: ComplexFilterField
  before: string
  value: string
  after: string
  /** 접근성 이름에 쓰는 전체 문구 */
  text: string
}

/** 정의에 없는 필드의 칩은 그리지 않는다 */
export function toChipViews(
  chips: ComplexFilterChip[],
  fields: ComplexFilterField[],
  labels: ComplexFilterLabels,
): ChipView[] {
  return chips.flatMap((chip): ChipView[] => {
    const field = fields.find(item => item.key === chip.fieldKey)
    if (!field) return []
    if (chip.kind === 'keyword') {
      const conditionLabel = labels.conditions[chip.condition]
      const before = labels.keywordPhrase.before(field.label, conditionLabel)
      const after = labels.keywordPhrase.after(field.label, conditionLabel)
      return [
        {
          chip,
          field,
          before,
          value: chip.value,
          after,
          text: [before, chip.value, after].filter(Boolean).join(' '),
        },
      ]
    }
    if (!isSelectField(field)) return []
    const value = field.options
      .filter(option => chip.values.includes(option.value))
      .map(option => option.label)
      .join(SELECT_JOINER)
    return [
      {
        chip,
        field,
        before: field.label,
        value,
        after: '',
        text: `${field.label} ${value}`,
      },
    ]
  })
}
