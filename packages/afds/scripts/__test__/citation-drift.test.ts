import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { nearestIndex, isPrependOnlyPath } from '../lib/citation-drift'

/**
 * `verify:docs` 의 줄 드리프트 판정을 고정한다.
 *
 * **왜 필요한가.** 이 판정을 「첫 등장(`indexOf`)」에서 「최근접」으로 고친 것(#196)이
 * **구현 형태만으로 보호되고 있었다** — 되돌리면 조용히 재개한다. 그리고 그 수정은 다른
 * 판단의 전제이기도 하다: **「어긋남 상한 게이트를 넣지 않는다」는 #196 의 결정이
 * 「정정 후 최대 11줄」에 서 있고, 그 값은 최근접 매칭을 전제한다.** 지표가 되돌아가면
 * 관측 최대가 233줄로 튀고 그 결정도 무효가 되는데 아무것도 알아채지 못한다.
 *
 * 아래 픽스처는 실측된 결함 형태를 그대로 재현한다(`popover.tsx:141` 의 `return (` 2회).
 */

const SCRIPT = join(__dirname, '../verify-doc-citations.ts')

describe('nearestIndex — 인용한 줄에 가장 가까운 등장을 고른다', () => {
  /**
   * 실측 재현: 인용이 **두 번째** `return (` 을 가리키는데 파일 앞쪽에 같은 줄이 하나 더 있다.
   * 첫 등장을 쓰면 「멀리 밀렸다」는 거짓 신호가 난다.
   */
  const dup = [
    'export function A() {',
    '  return (', // 2행 — 첫 등장
    '    <A />',
    '  )',
    '}',
    '',
    'export function B() {',
    '  return (', // 8행 — 인용이 가리키는 쪽
    '    <B />',
    '  )',
    '}',
  ]

  it('대조군 — 픽스처에 같은 줄이 실제로 두 번 있다', () => {
    // 이게 1이면 아래 단정이 「최근접」을 검증하지 못한다(첫 등장과 답이 같아진다).
    expect(dup.filter(l => l === '  return (')).toHaveLength(2)
  })

  it('★ 흔한 줄에서 첫 등장이 아니라 최근접을 고른다', () => {
    // 인용이 9행을 가리켰고 그 내용이 8행으로 1줄 밀린 상황.
    const near = nearestIndex(dup, '  return (', 9, true)
    expect(near + 1, '최근접은 8행이어야 한다').toBe(8)
    // 첫 등장이면 2행 — 어긋남이 1줄이 아니라 7줄로 보고된다.
    expect(dup.indexOf('  return ('), '첫 등장은 2행이므로 답이 다르다').toBe(1)
    expect(near).not.toBe(dup.indexOf('  return ('))
  })

  it('인용한 줄보다 앞에 있어도 가까운 쪽을 고른다', () => {
    // 3행을 인용했다면 2행(1줄)이 8행(5줄)보다 가깝다.
    expect(nearestIndex(dup, '  return (', 3, true) + 1).toBe(2)
  })

  it('내용이 유일하면 정확히 그 줄이다 (양성 대조군)', () => {
    expect(nearestIndex(dup, '    <B />', 1, true) + 1).toBe(9)
    expect(nearestIndex(dup, '    <B />', 99, true) + 1).toBe(9)
  })

  it('없으면 -1', () => {
    expect(nearestIndex(dup, '  return null', 5, true)).toBe(-1)
  })

  it('exact=false 는 앞뒤 공백을 무시하고 같은 규칙으로 고른다', () => {
    // 재들여쓰기로 공백만 바뀐 경우 — 이 분기도 최근접이어야 한다.
    const reindented = ['    return (', 'x', 'y', 'z', 'a', 'b', 'c', '      return (']
    expect(nearestIndex(reindented, '  return (', 8, false) + 1).toBe(8)
    expect(nearestIndex(reindented, '  return (', 1, false) + 1).toBe(1)
    // exact 로는 하나도 못 찾는다 — 두 분기가 실제로 다르다는 확인.
    expect(nearestIndex(reindented, '  return (', 8, true)).toBe(-1)
  })
})

describe('isPrependOnlyPath — CHANGELOG 은 드리프트 판정에서 뺀다', () => {
  it('CHANGELOG.md 를 잡는다 (루트·패키지 어디든)', () => {
    expect(isPrependOnlyPath('CHANGELOG.md')).toBe(true)
    expect(isPrependOnlyPath('packages/afds/CHANGELOG.md')).toBe(true)
    expect(isPrependOnlyPath('packages/afds-registry/CHANGELOG.md')).toBe(true)
  })

  it('비슷한 이름을 잡지 않는다 (과제외 방지)', () => {
    expect(isPrependOnlyPath('CHANGELOG.md.bak')).toBe(false)
    expect(isPrependOnlyPath('docs/CHANGELOG-old.md')).toBe(false)
    expect(isPrependOnlyPath('docs/changelog.md')).toBe(false)
    expect(isPrependOnlyPath('packages/afds/src/CHANGELOG.tsx')).toBe(false)
  })
})

describe('배선 — 검증기가 실제로 이 헬퍼를 쓴다', () => {
  const source = readFileSync(SCRIPT, 'utf-8')

  it('대조군 — 검증기 소스를 실제로 읽었다', () => {
    expect(source.length, '소스를 못 읽으면 아래 단정이 빈 문자열을 훑는다').toBeGreaterThan(1000)
  })

  it('헬퍼를 import 한다', () => {
    expect(source).toContain("from './lib/citation-drift'")
    expect(source).toContain('nearestIndex')
    expect(source).toContain('isPrependOnlyPath')
  })

  /**
   * **되돌림 감지.** 헬퍼가 남아 있어도 드리프트 분기가 `lines.indexOf(b)` 로 돌아가면
   * 위 단정들은 전부 통과한다 — 헬퍼는 그대로 있고 import 도 그대로이기 때문이다.
   * 그래서 **되돌린 형태를 이름으로 금지한다.**
   */
  it('★ 드리프트 판정이 첫 등장(`lines.indexOf(b)`)으로 되돌아가지 않았다', () => {
    expect(
      source.includes('lines.indexOf(b)'),
      '첫 등장 매칭은 흔한 줄에서 틀린 줄을 보고한다(#196) — 최근접을 써라',
    ).toBe(false)
  })

  it('★ 드리프트 분기 두 곳이 모두 최근접을 쓴다', () => {
    // 정확 일치 분기와 들여쓰기 변경 분기. 하나만 고치면 나머지가 조용히 남는다.
    const calls = source.match(/nearestIndex\(lines, b, ln, (true|false)\)/g) ?? []
    expect(calls, `nearestIndex 호출: ${calls.join(' · ')}`).toHaveLength(3)
    expect(calls).toContain('nearestIndex(lines, b, ln, true)')
    expect(calls).toContain('nearestIndex(lines, b, ln, false)')
  })
})
