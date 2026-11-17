import { describe, it, expect } from 'vitest'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { resolveBySuffix, uniqueBySuffix, existsOnRefFiles } from '../lib/path-resolve'

/**
 * 경로 **접미사** 해소를 고정한다.
 *
 * **왜 필요한가.** 문서는 산문에서 약칭으로 파일을 가리킨다(`base-table/index.ts`). 해소하지
 * 못하면 검증기가 **모노레포 파일의 약칭을 소비처 경로 후보로 분류**해 「소비처에 그 파일이
 * 있어야 한다」고 요구한다 — 실측(#192): 그렇게 만들어진 실패가 7건이고 **5/5 가 소비처에
 * 없는 파일**이었다.
 *
 * **`basename` 단독으로는 안 된다.** 이 저장소에서 `index.ts` 는 92개다. 문서가 애초에
 * 디렉터리 한 칸을 붙여 적은 것이 유일성을 만든다 — 접미사로 봐야 그 의도가 산다.
 */
describe('resolveBySuffix / uniqueBySuffix', () => {
  const files = [
    'packages/afds/src/index.ts',
    'packages/afds/src/bricks/action/button/index.ts',
    'packages/afds-registry/src/compositions/base-table/index.ts',
    'packages/afds-registry/src/compositions/base-tooltip/base-tooltip.tsx',
    'package.json',
  ]

  it('대조군 — 전체 일치와 접미사 일치가 모두 해소된다', () => {
    // 대조군이 없으면 아래 `null` 들이 "규칙대로 해소 안 했다" 인지 "아무것도 못 찾는다" 인지
    // 구분되지 않는다.
    expect(uniqueBySuffix('packages/afds/src/index.ts', files)).toBe('packages/afds/src/index.ts')
    expect(uniqueBySuffix('base-tooltip/base-tooltip.tsx', files)).toBe(
      'packages/afds-registry/src/compositions/base-tooltip/base-tooltip.tsx',
    )
    expect(uniqueBySuffix('package.json', files)).toBe('package.json')
  })

  it('★ 여러 건에 걸리면 해소하지 않는다 — 아무거나 고르지 않는다', () => {
    // `[0]` 을 고르면 검증기가 **엉뚱한 파일의 줄 범위·내용을 검사하고 통과**한다.
    // 조용한 거짓 통과이고, 이 저장소에서 계속 잡아온 형태다.
    expect(resolveBySuffix('index.ts', files)).toHaveLength(3)
    expect(uniqueBySuffix('index.ts', files)).toBeNull()
  })

  it('디렉터리 한 칸을 붙이면 유일해진다 (문서가 그렇게 적는 이유)', () => {
    expect(uniqueBySuffix('base-table/index.ts', files)).toBe(
      'packages/afds-registry/src/compositions/base-table/index.ts',
    )
    expect(uniqueBySuffix('button/index.ts', files)).toBe(
      'packages/afds/src/bricks/action/button/index.ts',
    )
  })

  it('경계는 경로 구분자다 — 이름 조각이 걸리지 않는다', () => {
    // `ase-tooltip.tsx` 가 `base-tooltip.tsx` 에 걸리면 엉뚱한 파일이 해소된다.
    expect(resolveBySuffix('ase-tooltip.tsx', files)).toEqual([])
    expect(resolveBySuffix('tooltip.tsx', files)).toEqual([])
    expect(resolveBySuffix('e.json', files)).toEqual([])
  })

  it('해소되지 않으면 빈 목록 · null 이다', () => {
    expect(resolveBySuffix('does-not-exist.ts', files)).toEqual([])
    expect(uniqueBySuffix('does-not-exist.ts', files)).toBeNull()
    expect(resolveBySuffix('', files)).toEqual([])
    expect(resolveBySuffix('/absolute.ts', files)).toEqual([])
  })

  it('`./` 접두는 무시한다', () => {
    expect(uniqueBySuffix('./package.json', files)).toBe('package.json')
  })

  /**
   * **탐색 공간이 저장소 전체인지 고정한다.**
   *
   * 검증기의 옛 `findByBasename` 은 루트가 `packages/afds/{src,tokens}` + 소비처 `src` 뿐이라
   * **`packages/afds-registry` 가 아예 없었다.** 컴포지션이 그리로 이전됐으므로 그 루트 목록으로는
   * `base-tooltip.tsx` 를 영영 못 찾는다 — #192 의 실패 5건이 그 자리였다.
   *
   * 접미사 해소는 `git ls-files`(저장소 전체)를 검색 공간으로 쓰므로 루트 목록을 손으로
   * 유지하지 않는다. **그 공간이 조용히 줄면 해소가 실패로 돌아가는데, 그것은 「검사가
   * 엄격해졌다」처럼 보여 오진하기 쉽다.** 그래서 이름으로 못박는다.
   */
  it('★ 검색 공간은 저장소 전체다 — afds-registry 컴포지션이 유일하게 해소된다', () => {
    const repoRoot = join(__dirname, '../../../..')
    const tracked = execFileSync('git', ['ls-files'], { cwd: repoRoot, encoding: 'utf8' })
      .split('\n')
      .filter(Boolean)

    // 대조군 — 목록을 실제로 읽었다. 비면 아래 단정이 전부 무동작이 된다.
    expect(tracked.length).toBeGreaterThan(100)

    for (const [abbrev, expected] of [
      ['base-tooltip.tsx', 'packages/afds-registry/src/compositions/base-tooltip/base-tooltip.tsx'],
      [
        'overflow-tooltip.tsx',
        'packages/afds-registry/src/compositions/overflow-tooltip/overflow-tooltip.tsx',
      ],
      ['base-table/index.ts', 'packages/afds-registry/src/compositions/base-table/index.ts'],
      ['range-filter/index.ts', 'packages/afds-registry/src/compositions/range-filter/index.ts'],
    ] as const) {
      expect(uniqueBySuffix(abbrev, tracked), `${abbrev} 가 유일하게 해소돼야 한다`).toBe(expected)
    }
  })
})

/**
 * **기준 ref 조회가 워크트리 탐색과 대칭인지** 고정한다.
 *
 * **왜 필요한가.** 워크트리 탐색(`searchRoots`)에는 `.changeset` 이 **있고** ref 조회의 접두
 * 목록(`REF_PREFIXES`)에는 **없었다.** 두 탐색이 비대칭이라 `.changeset/` 의 파일은 ref 에서
 * 영영 보이지 않았다 — 실측(#192): `base-ui-coverage-audit.md` 가
 * 「`afds-manifest-token-recovery.md` 가 `feat/jake` 에 이미 있다」고 서술하는데 **그 주장이
 * 참**이었고(`f80ea4e` 에 `.changeset/afds-manifest-token-recovery.md` 로 존재) 검사기가 못 봐서
 * 완전 모드의 마지막 실패 1건이 됐다. **문서가 아니라 검사기가 틀렸다.**
 *
 * 비대칭이 돌아오면 이 픽스처가 잡는다.
 */
describe('existsOnRefFiles', () => {
  const PREFIXES = ['', 'packages/afds/', 'packages/afds/tokens/', 'packages/afds/src/'] as const
  const ref = [
    'package.json',
    'packages/afds/package.json',
    'packages/afds/src/index.ts',
    'packages/afds/src/bricks/action/button/index.ts',
    '.changeset/afds-manifest-token-recovery.md',
    'apps/storybook/CHANGELOG.md',
    'packages/afds/CHANGELOG.md',
  ]

  it('대조군 — 접두로 맞는 정확 경로는 보인다', () => {
    expect(existsOnRefFiles('src/index.ts', [ref], PREFIXES)).toBe(true)
    expect(existsOnRefFiles('packages/afds/package.json', [ref], PREFIXES)).toBe(true)
  })

  it('★ `.changeset/` 의 파일이 ref 에서 보인다 (접두 목록에는 없는 디렉터리)', () => {
    // 이것이 #192 의 마지막 실패 1건이었다. 접두 목록에 `.changeset/` 이 없어도 접미사
    // 해소가 완결성을 준다 — 목록에 항목을 더하는 방식으로 고치지 않았다.
    expect(PREFIXES.some(p => ref.includes(p + 'afds-manifest-token-recovery.md'))).toBe(false)
    expect(existsOnRefFiles('afds-manifest-token-recovery.md', [ref], PREFIXES)).toBe(true)
  })

  it('접두로 보이던 모호한 이름은 계속 보인다 (접두 검사를 지우지 않은 이유)', () => {
    // 기준 ref 에서 `index.ts` 는 93개 · `package.json` 9 · `CHANGELOG.md` 4 다(실측).
    // 접미사는 「정확히 1건」만 인정하므로 접두 검사를 지우면 **보이던 것이 안 보이게** 된다.
    expect(uniqueBySuffix('index.ts', ref)).toBeNull() // 접미사로는 모호하다
    expect(existsOnRefFiles('index.ts', [ref], PREFIXES)).toBe(true) // 접두가 잡는다
    expect(uniqueBySuffix('CHANGELOG.md', ref)).toBeNull()
    expect(existsOnRefFiles('CHANGELOG.md', [ref], PREFIXES)).toBe(true)
  })

  it('없는 파일은 false 다', () => {
    expect(existsOnRefFiles('does-not-exist.ts', [ref], PREFIXES)).toBe(false)
  })

  it('★ 읽을 수 있는 ref 가 하나도 없으면 null — 부재와 판정 불가를 구분한다', () => {
    // `false` 로 뭉개면 shallow clone 에서 **없는 파일로 오판**해 거짓 실패를 낸다.
    expect(existsOnRefFiles('src/index.ts', [null, null], PREFIXES)).toBeNull()
    expect(existsOnRefFiles('src/index.ts', [], PREFIXES)).toBeNull()
  })

  it('일부 ref 만 읽히면 읽힌 것으로 판정한다', () => {
    expect(existsOnRefFiles('src/index.ts', [null, ref], PREFIXES)).toBe(true)
    expect(existsOnRefFiles('does-not-exist.ts', [null, ref], PREFIXES)).toBe(false)
  })

  it('여러 ref 중 하나에만 있어도 실재로 인정한다', () => {
    const other = ['unrelated/file.ts']
    expect(existsOnRefFiles('afds-manifest-token-recovery.md', [other, ref], PREFIXES)).toBe(true)
  })
})
