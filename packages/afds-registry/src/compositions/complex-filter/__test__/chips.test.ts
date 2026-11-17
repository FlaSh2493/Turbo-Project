import { describe, expect, it } from 'vitest'
import {
  addKeywords,
  hasClearable,
  lastRemovable,
  replaceKeyword,
  selectedValues,
  splitKeywords,
  toChipViews,
  upsertSelect,
} from '../chips'
import type {
  ComplexFilterChip,
  ComplexFilterKeywordField,
  ComplexFilterLabels,
  ComplexFilterSelectField,
} from '../types'

const NAME: ComplexFilterKeywordField = {
  type: 'keyword',
  key: 'name',
  label: '이름',
  conditions: ['like', 'unlike'],
}
const MEDIA: ComplexFilterSelectField = {
  type: 'select',
  key: 'media',
  label: '매체',
  options: [
    { value: 'KAKAO', label: 'Kakao' },
    { value: 'META', label: 'Meta' },
    { value: 'NAVER', label: 'Naver' },
  ],
}

let seq = 0
const makeId = () => `n${++seq}`
const kw = (
  id: string,
  value: string,
  condition: 'like' | 'unlike' = 'like',
): ComplexFilterChip => ({
  id,
  kind: 'keyword',
  fieldKey: 'name',
  condition,
  value,
})

describe('splitKeywords', () => {
  it('쉼표로 나눠 trim 하고 빈 값·중복을 버린다', () => {
    expect(splitKeywords(' a , b,, a ,c ', 100)).toEqual(['a', 'b', 'c'])
  })

  it('최대 길이를 넘는 값은 버린다(경계값은 통과)', () => {
    expect(splitKeywords(`${'x'.repeat(100)},${'y'.repeat(101)}`, 100)).toEqual(['x'.repeat(100)])
  })
})

describe('addKeywords', () => {
  const options = { maxLength: 100, makeId }

  it('필드의 첫 연산자로 끝에 더하고 더한 값을 알려 준다', () => {
    // When
    const result = addKeywords([kw('a', 'old')], NAME, 'x,y', options)

    // Then
    expect(result.added).toEqual(['x', 'y'])
    expect(result.chips.map(chip => chip.kind === 'keyword' && chip.value)).toEqual([
      'old',
      'x',
      'y',
    ])
    expect(result.chips[1]).toMatchObject({
      fieldKey: 'name',
      condition: 'like',
    })
  })

  it('같은 필드·연산자·값은 무시하지만 연산자가 다르면 더한다', () => {
    // Given
    const chips = [kw('a', 'x', 'unlike')]

    // When
    const result = addKeywords(chips, NAME, 'x', options)

    // Then
    expect(result.added).toEqual(['x'])
    expect(addKeywords([kw('a', 'x')], NAME, 'x', options).added).toEqual([])
  })

  it('maxChips 를 넘는 값은 만들지 않는다', () => {
    // When
    const result = addKeywords([kw('a', 'old')], NAME, 'x,y,z', {
      ...options,
      maxChips: 3,
    })

    // Then
    expect(result.added).toEqual(['x', 'y'])
  })

  it('원본 배열을 바꾸지 않는다', () => {
    const chips = [kw('a', 'old')]
    addKeywords(chips, NAME, 'x', options)
    expect(chips).toHaveLength(1)
  })
})

describe('replaceKeyword', () => {
  it('칩 위치를 유지한 채 값·연산자를 바꾼다', () => {
    // Given
    const chips = [kw('a', '1'), kw('b', '2'), kw('c', '3')]

    // When
    const next = replaceKeyword(chips, 'b', 'new', 'unlike')

    // Then
    expect(next.map(chip => chip.id)).toEqual(['a', 'b', 'c'])
    expect(next[1]).toMatchObject({ value: 'new', condition: 'unlike' })
  })

  it('다른 칩과 같아지면 이 칩을 지운다', () => {
    expect(replaceKeyword([kw('a', '1'), kw('b', '2')], 'b', '1', 'like')).toEqual([kw('a', '1')])
  })

  it('선택 칩이나 없는 id 는 그대로 둔다', () => {
    const chips = upsertSelect([], MEDIA, ['KAKAO'], makeId)
    expect(replaceKeyword(chips, chips[0]!.id, 'x', 'like')).toBe(chips)
  })
})

describe('upsertSelect', () => {
  it('값을 options 정의 순서로 정렬해 끝에 칩을 만든다', () => {
    // When
    const chips = upsertSelect([kw('a', '1')], MEDIA, ['NAVER', 'KAKAO'], makeId)

    // Then
    expect(chips).toHaveLength(2)
    expect(chips[1]).toMatchObject({
      kind: 'select',
      values: ['KAKAO', 'NAVER'],
    })
  })

  it('있는 칩은 제자리에서 교체하고 id 를 유지한다', () => {
    // Given
    const first = upsertSelect([], MEDIA, ['KAKAO'], makeId)
    const chips = [...first, kw('z', 'tail')]

    // When
    const next = upsertSelect(chips, MEDIA, ['META'], makeId)

    // Then
    expect(next.map(chip => chip.id)).toEqual([first[0]!.id, 'z'])
    expect(selectedValues(next, 'media')).toEqual(['META'])
  })

  it('값이 없으면 칩을 지우고, 칩이 없으면 아무것도 하지 않는다', () => {
    const chips = upsertSelect([], MEDIA, ['KAKAO'], makeId)
    expect(upsertSelect(chips, MEDIA, [], makeId)).toEqual([])
    expect(upsertSelect([], MEDIA, [], makeId)).toEqual([])
  })

  it('옵션에 없는 값은 버린다', () => {
    expect(selectedValues(upsertSelect([], MEDIA, ['KAKAO', 'X'], makeId), 'media')).toEqual([
      'KAKAO',
    ])
  })
})

describe('삭제 가능 판정', () => {
  it('lastRemovable 은 마지막 칩이 삭제 가능할 때만 돌려준다', () => {
    expect(lastRemovable([kw('a', '1'), kw('b', '2')])?.id).toBe('b')
    expect(lastRemovable([kw('a', '1'), { ...kw('b', '2'), deletable: false }])).toBeUndefined()
    expect(lastRemovable([])).toBeUndefined()
  })

  it('hasClearable 은 삭제 가능한 칩이 하나라도 있을 때 참이다', () => {
    expect(hasClearable([{ ...kw('a', '1'), deletable: false }])).toBe(false)
    expect(hasClearable([{ ...kw('a', '1'), deletable: false }, kw('b', '2')])).toBe(true)
  })
})

describe('toChipViews', () => {
  const labels = {
    conditions: { like: '포함', unlike: '제외' },
    keywordPhrase: {
      before: (field: string) => `${field}에`,
      after: (_field: string, condition: string) => condition,
    },
  } as unknown as ComplexFilterLabels

  it('키워드는 「필드에 값 연산자」, 선택은 「필드 값들」 문구를 만든다', () => {
    // Given
    const chips = [
      kw('a', '마그', 'unlike'),
      ...upsertSelect([], MEDIA, ['NAVER', 'KAKAO'], makeId),
    ]

    // When
    const views = toChipViews(chips, [NAME, MEDIA], labels)

    // Then
    expect(views.map(view => view.text)).toEqual(['이름에 마그 제외', '매체 Kakao, Naver'])
  })

  it('정의에 없는 필드의 칩은 그리지 않는다', () => {
    expect(toChipViews([kw('a', '1')], [MEDIA], labels)).toEqual([])
  })
})
