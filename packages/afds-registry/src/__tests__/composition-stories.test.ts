import { describe, it, expect, afterAll } from 'vitest'
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
  type Dirent,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { isSkippedDir } from '../lib/composition-files'

/**
 * 모든 컴포지션에 `*.stories.tsx` 가 있는가.
 *
 * **왜 하드 게이트인가.** 현재 23/23 이 보유하고 있어 **기존 위반이 0건**이다. 래칫(현재
 * 위반 수를 상한으로 고정하고 줄여가는 방식)이 필요 없으므로 바로 막는다. 나중에 위반이
 * 생기면 그 PR 에서 잡힌다 — 지금 걸지 않으면 하나씩 새어 들어온 뒤에 래칫이 필요해진다.
 *
 * **대상 선정에 `index.ts` 보유 조건을 걸지 않는다.** 조건을 걸면 `index.ts` 없는 디렉터리가
 * 검사 대상에서 빠져 **자동으로 통과**한다 — 스토리도 없고 검사도 안 받는 상태가 조용히
 * 성립한다. `registry.json` 아이템 대조에서 같은 실수를 한 적이 있어 여기서는 처음부터
 * 원시 디렉터리 목록을 쓴다(`isSkippedDir` 만 제외).
 */

const COMPOSITIONS_DIR = join(__dirname, '../compositions')

/**
 * `node:fs` 의 `globSync` 는 **Node 22 부터**다. 루트 `engines` 는 `>=18` 이고 CI 는 24 하나만
 * 돌아서 그 간극을 아무도 밟지 않는다 — 등록 게이트를 넣는 자리에서 런타임 하한을 조용히
 * 올릴 이유가 없으므로 `readdirSync` 만으로 훑는다.
 */
function hasStoryFile(dir: string): boolean {
  let entries: Dirent[]
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    // 디렉터리를 읽을 수 없으면 "스토리가 없다" 로 본다 — 위반으로 드러나는 쪽이 안전하다.
    return false
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      // 하위 순회에도 `isSkippedDir` 를 적용한다. 적용하지 않으면 스토리를 `__test__/` 안에
      // 두는 것만으로 이 게이트가 만족된다 — 그 위치의 스토리는 수집·배포 대상이 아니므로
      // **없는 것과 같다.** 대상 디렉터리 선정에만 조심하고 안쪽을 열어 두면 조용히 통과한다.
      if (isSkippedDir(entry.name)) continue
      if (hasStoryFile(join(dir, entry.name))) return true
    } else if (entry.name.endsWith('.stories.tsx')) {
      return true
    }
  }
  return false
}

function compositionDirNames(root: string = COMPOSITIONS_DIR): string[] {
  return readdirSync(root, { withFileTypes: true })
    .filter(e => e.isDirectory() && !isSkippedDir(e.name))
    .map(e => e.name)
    .sort()
}

describe('컴포지션 스토리', () => {
  const dirs = compositionDirNames()

  it('대조군 — 검사할 컴포지션 디렉터리가 실제로 있다', () => {
    // 분모가 0 이면 아래 단정이 빈 목록을 돌며 조용히 통과한다.
    expect(dirs.length).toBeGreaterThan(0)
  })

  it('모든 컴포지션에 *.stories.tsx 가 있다', () => {
    const missing: string[] = []
    for (const name of dirs) {
      if (!hasStoryFile(join(COMPOSITIONS_DIR, name))) {
        missing.push(`${name}: *.stories.tsx 가 없다`)
      }
    }
    // 검사한 분모를 함께 남긴다 — "위반 0건" 이 "아무것도 안 봤다" 인지 구분하려면 필요하다.
    expect(dirs.length, `검사한 컴포지션 ${dirs.length}개`).toBeGreaterThan(0)
    expect(missing).toEqual([])
  })
})

/**
 * 게이트를 **임시 트리에 직접 먹인다.**
 *
 * **왜 필요한가.** 위 검사는 실재 `compositions/` **하나만** 본다. 지금 그 트리에는
 * `__test__/` 안에만 스토리를 둔 컴포지션이 **0건**이고, 스토리 없는 컴포지션도 **0건**이다
 * (23/23 보유). 즉 `hasStoryFile` 이 하위 순회에도 `isSkippedDir` 를 적용하는 분기는 **밟히는
 * 입력이 없다** — 지워도 실재 트리에서는 아무 검사도 실패하지 않는다. 구현 형태가 유일한
 * 보호막인 상태다. 아래는 그 입력을 만들어 판정 방향을 못박는다.
 */
describe('hasStoryFile — 픽스처', () => {
  const roots: string[] = []

  /** `mkdtemp` 로 만든 트리만 지운다. 값이 `null` 이면 빈 디렉터리다. */
  function buildComposition(spec: Record<string, string | null>): string {
    const root = mkdtempSync(join(tmpdir(), 'afds-registry-stories-'))
    roots.push(root)
    for (const [rel, content] of Object.entries(spec)) {
      const full = join(root, rel)
      if (content === null) {
        mkdirSync(full, { recursive: true })
        continue
      }
      mkdirSync(dirname(full), { recursive: true })
      writeFileSync(full, content)
    }
    return root
  }

  afterAll(() => {
    for (const root of roots) rmSync(root, { recursive: true, force: true })
  })

  it('대조군 — 스토리가 있으면 있다고, 없으면 없다고 한다', () => {
    // 대조군이 없으면 아래 `false` 들이 "규칙대로 없다고 판정했다" 인지 "이 함수가 무엇도
    // 찾지 못한다" 인지 구분되지 않는다.
    const withStory = buildComposition({
      'index.ts': 'export {}',
      'thing.stories.tsx': 'export default {}',
    })
    const withoutStory = buildComposition({ 'index.ts': 'export {}', 'thing.tsx': 'export {}' })
    expect(hasStoryFile(withStory)).toBe(true)
    expect(hasStoryFile(withoutStory)).toBe(false)
  })

  it('__test__/ 안에만 있는 스토리는 없는 것으로 판정한다', () => {
    // 이 게이트를 만족시키는 가장 쉬운 우회로다. 그 위치의 스토리는 수집·배포 대상이
    // 아니므로 **없는 것과 같다.** 하위 순회에서 `isSkippedDir` 를 빼면 여기가 통과한다.
    const root = buildComposition({
      'index.ts': 'export {}',
      '__test__/thing.stories.tsx': 'export default {}',
    })
    expect(hasStoryFile(root)).toBe(false)
  })

  it('__tests__/ · node_modules/ 안에만 있는 스토리도 없는 것으로 판정한다', () => {
    const underTests = buildComposition({
      'index.ts': 'export {}',
      '__tests__/thing.stories.tsx': 'export default {}',
    })
    const underModules = buildComposition({
      'index.ts': 'export {}',
      'node_modules/pkg/thing.stories.tsx': 'export default {}',
    })
    expect(hasStoryFile(underTests)).toBe(false)
    expect(hasStoryFile(underModules)).toBe(false)
  })

  it('정상 하위 디렉터리의 스토리는 인정한다', () => {
    // 위 배제가 "중첩된 스토리를 전부 못 본다" 로 넘어가지 않았음을 고정한다.
    const root = buildComposition({
      'index.ts': 'export {}',
      'parts/inner/thing.stories.tsx': 'export default {}',
    })
    expect(hasStoryFile(root)).toBe(true)
  })

  it('.stories.ts (tsx 아님) 는 스토리로 세지 않는다', () => {
    const root = buildComposition({ 'index.ts': 'export {}', 'thing.stories.ts': 'export {}' })
    expect(hasStoryFile(root)).toBe(false)
  })

  it('디렉터리 심링크 뒤의 스토리는 없는 것으로 판정한다', () => {
    // `Dirent` 는 심링크에 대해 `isDirectory()` · `isFile()` 이 둘 다 false 이므로 링크를
    // 따라가지 않는다. **여기서는 그 방향이 안전한 쪽이다** — 스토리를 놓치면 위반으로
    // 드러나고(거짓 실패), 반대로 세면 실재하지 않는 스토리로 통과한다(거짓 통과).
    // `rule-globs` 의 같은 자리와 안전한 방향이 반대라서 처리도 다르다.
    // 대상은 **컴포지션 밖에** 둔다. 안에 두면 실재 경로로 먼저 발견되어 링크가 경로에서
    // 빠진다 — 심링크를 검사하지 않는 픽스처가 된다(처음 이렇게 썼다가 걸렸다).
    const outside = buildComposition({ 'stories/thing.stories.tsx': 'export default {}' })
    const root = buildComposition({ 'index.ts': 'export {}' })
    symlinkSync(join(outside, 'stories'), join(root, 'linked'))
    expect(hasStoryFile(join(root, 'linked'))).toBe(true) // 링크를 직접 열면 보인다
    expect(hasStoryFile(root)).toBe(false) // 순회가 링크를 통과해서는 찾지 않는다
  })

  it('읽을 수 없는 디렉터리는 스토리 없음으로 판정한다', () => {
    const root = buildComposition({ 'index.ts': 'export {}' })
    expect(hasStoryFile(join(root, 'does-not-exist'))).toBe(false)
  })

  it('compositionDirNames 는 디렉터리만 · 배제 대상 제외 · 정렬해서 돌려준다', () => {
    const root = buildComposition({
      'zebra/index.ts': 'export {}',
      'alpha/index.ts': 'export {}',
      '__test__/helper.ts': 'export {}',
      '__tests__/helper.ts': 'export {}',
      'node_modules/pkg/index.ts': 'export {}',
      'index.ts': 'export {}',
    })
    expect(compositionDirNames(root)).toEqual(['alpha', 'zebra'])
  })
})
