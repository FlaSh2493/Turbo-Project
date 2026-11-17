import { describe, it, expect } from 'vitest'
import { extractCitations } from '../lib/citation-antecedent'

/**
 * `:줄` 단독 인용의 **선행사**를 고정한다.
 *
 * **왜 필요한가.** 선행사를 「같은 블록의 직전 파일명」으로만 잡으면 **표는 빈 줄이 없어
 * 통째로 한 블록**이므로, 앞 행 산문에 나온 파일명이 뒷 행의 `:N` 에 붙는다. 그러면 검증기가
 * **문서가 하지 않은 인용을 요구한다** — 실측(#192): 완전 모드 실패 10건 중 2건이 그것이었다.
 *
 * 그 2건은 **거짓 통과로 뒤집힐 수도 있었다.** 잘못 붙은 파일이 88줄이라 인용한 줄이 범위
 * 안이고 드리프트는 게이트가 아니다 — 해소 규칙을 먼저 넓혔다면 조용히 통과했다. 그래서
 * 선행사를 먼저 고치고, 그 판정을 여기서 못박는다.
 */
describe('extractCitations — 선행사', () => {
  it('대조군 — 파일:줄 · 범위 · 콤마 나열을 모두 뽑는다', () => {
    // 이 대조군이 없으면 아래 결과들이 "규칙대로 뽑았다" 인지 "아무것도 못 뽑는다" 인지
    // 구분되지 않는다.
    const { cites } = extractCitations(
      ['`a.ts:10`', '', '`b.tsx:20-25`', '', '`c.ts:30,31,32`'].join('\n'),
    )
    expect(cites.map(c => `${c.file}:${c.from}-${c.to}`)).toEqual([
      'a.ts:10-10',
      'b.tsx:20-25',
      'c.ts:30-30',
      'c.ts:31-31',
      'c.ts:32-32',
    ])
  })

  it('같은 블록의 `:N` 은 직전 파일을 물려받는다', () => {
    const { cites, contextless } = extractCitations('`a.ts:10` 을 보라 — `:12` 도 같다.')
    expect(contextless).toEqual([])
    expect(cites.map(c => `${c.file}:${c.from}`)).toEqual(['a.ts:10', 'a.ts:12'])
  })

  it('물려받을 파일이 없으면 조용히 넘기지 않고 문맥없음으로 드러낸다', () => {
    const { cites, contextless } = extractCitations('문맥 없이 `:42` 만 적었다.')
    expect(cites).toEqual([])
    expect(contextless).toEqual(['`:42`'])
  })

  it('빈 줄로 갈린 다른 블록의 파일명은 물려받지 않는다', () => {
    // 문서 전역으로 물리면 몇 단락 떨어진 다른 파일이 문맥으로 잡혀 거짓 실패를 낸다.
    const { contextless } = extractCitations(['`a.ts:10`', '', '이제 `:12` 만 적는다.'].join('\n'))
    expect(contextless).toEqual(['`:12`'])
  })

  it('★ 표에서 `:N` 은 다른 행의 파일명을 물려받지 않고 표의 주제를 쓴다', () => {
    // #192 의 실제 형태다. 주제 파일을 한 줄로 적고 빈 줄을 두고 표가 온다.
    const doc = [
      '#### 7.2c OverflowTooltip',
      '',
      '`src/compositions/overflow-tooltip/overflow-tooltip.tsx`',
      '',
      '| 위치  | 내용 |',
      '| ----- | ---- |',
      '| `:7`  | 공개 계약에 남는다(`base-tooltip.tsx:27` · `:29`) |',
      '| `:13` | 구조분해 — 둘 다 빠져 있다 |',
      '| `:28` | 소비자 값이 앞의 둘을 덮는다 |',
    ].join('\n')
    const { cites, contextless } = extractCitations(doc)
    expect(contextless).toEqual([])
    expect(cites.map(c => `${c.docLine}|${c.file}:${c.from}`)).toEqual([
      // 표의 주제 파일 — 첫 행도 뒷 행과 **같은 규칙**을 받는다
      '7|src/compositions/overflow-tooltip/overflow-tooltip.tsx:7',
      // 같은 행 안의 `파일:줄` 과 그 뒤 `:29` — 같은 행이므로 그 파일을 물려받는다
      '7|base-tooltip.tsx:27',
      '7|base-tooltip.tsx:29',
      // 다른 행이므로 `base-tooltip.tsx` 를 물려받지 않는다
      '8|src/compositions/overflow-tooltip/overflow-tooltip.tsx:13',
      '9|src/compositions/overflow-tooltip/overflow-tooltip.tsx:28',
    ])
  })

  it('표 앞에 주제가 없으면 다른 행에서 끌어오지 않고 문맥없음이다', () => {
    // 「다른 행을 쓰지 않는다」가 「아무거나 찾아서 쓴다」로 넘어가지 않음을 고정한다.
    const doc = [
      '#### 제목',
      '',
      '| 위치  | 내용 |',
      '| ----- | ---- |',
      '| `:7`  | `other.ts:5` 를 언급한다 |',
      '| `:13` | 뒷 행 |',
    ].join('\n')
    const { cites, contextless } = extractCitations(doc)
    expect(contextless).toEqual(['`:7`', '`:13`'])
    expect(cites.map(c => `${c.file}:${c.from}`)).toEqual(['other.ts:5'])
  })

  it('주제는 표 **바로 앞**에서만 온다 — 앞 절의 주제 줄은 새어 들어오지 않는다', () => {
    // 앞 절의 주제 파일이 뒷 절 표로 새어 들어오면 절이 바뀔 때마다 거짓 실패가 난다.
    const doc = [
      '#### 앞 절',
      '',
      '`prev.ts`',
      '',
      '#### 뒷 절',
      '',
      '| 위치 | 내용 |',
      '| ---- | ---- |',
      '| `:9` | 주제가 없다 |',
    ].join('\n')
    expect(extractCitations(doc).contextless).toEqual(['`:9`'])
  })

  it('★ 산문에 스친 파일명은 주제가 아니다 — 검증기 자신을 서술하는 표가 이것을 밟았다', () => {
    // 「표 앞에서 파일명을 찾는다」로 느슨하게 짜면 이 형태가 **없는 인용을 만들어낸다.**
    // 실측: 검증기의 자기 서술 표(`범위 초과 인용(:900)` · `범위 역전(:900-2)` ·
    // `6줄 파일에 :7` 행)가 앞쪽 산문의 `segment-control.tsx` 를 주제로 잡아 **인용 6건을
    // 새로 만들었다.** 그 행들은 인용이 아니라 **테스트 입력의 서술**이다.
    const doc = [
      '#### 돌연변이 표',
      '',
      '앞서 `segment-control.tsx` 를 산문에서 언급한다.',
      '',
      '| 입력                      | 결과   |',
      '| ------------------------- | ------ |',
      '| 범위 초과 인용(`:900`)    | 적발   |',
      '| 6줄 파일에 `:7`           | 적발   |',
    ].join('\n')
    const { cites, contextless } = extractCitations(doc)
    expect(contextless).toEqual(['`:900`', '`:7`'])
    // 산문의 파일명은 줄인용이 없으므로 인용으로 세지 않는다.
    expect(cites).toEqual([])
  })

  it('주제 줄은 파일 인용 **하나만** 있는 줄이다 (다른 내용이 붙으면 주제가 아니다)', () => {
    const withText = [
      '`subject.ts` 를 보라.', // 설명이 붙었다 — 주제 줄이 아니다
      '',
      '| 위치 | 내용 |',
      '| ---- | ---- |',
      '| `:5` | 행 |',
    ].join('\n')
    const bare = ['`subject.ts`', '', '| 위치 | 내용 |', '| ---- | ---- |', '| `:5` | 행 |'].join(
      '\n',
    )
    expect(extractCitations(withText).contextless).toEqual(['`:5`'])
    expect(extractCitations(bare).cites.map(c => c.raw)).toEqual(['`subject.ts:5`'])
  })

  it('표시 문자열에 백틱이 끼지 않는다', () => {
    // 예전에는 `raw` 를 `${파일}${매치}` 로 이어 붙여 ``a.ts`:29`` 로 깨졌다 — 목록을 읽고
    // 원인을 짚기 어렵게 만든다(#192 실패 10건 중 3건이 그 형태였다).
    const { cites } = extractCitations('`a.ts:27` · `:29` · `:31-33`')
    expect(cites.map(c => c.raw)).toEqual(['`a.ts:27`', '`a.ts:29`', '`a.ts:31-33`'])
    expect(cites.every(c => !/\w`:/.test(c.raw))).toBe(true)
  })

  it('인용이 적힌 문서 줄을 함께 돌려준다 (blame 유래를 그 줄에서 찾는다)', () => {
    const { cites } = extractCitations(['첫 줄', '`a.ts:10`', '', '`b.ts:20`'].join('\n'))
    expect(cites.map(c => c.docLine)).toEqual([2, 4])
  })
})
