import { describe, it, expect } from 'vitest'
import { readdirSync, type Dirent } from 'node:fs'
import { join } from 'node:path'
import eslintConfig from '../../eslint.config.js'
import oxlintConfig from '../../.oxlintrc.json'

/**
 * `eslint.config.js`·`.oxlintrc.json` 의 디렉터리 한정 `files` 글롭이 **의도한 만큼 매칭하는가.**
 *
 * `.claude/rules` 글롭은 `rule-globs.test.ts` 가 고정하는데 eslint 글롭은 아무것도 고정하지
 * 않았다. 같은 결함이 두 곳에 있었고 한 곳만 막혀 있었다 — 실제로 공유 설정의
 * `**\/primitives/**`·`**\/components/**` 가 죽은 채 남아 있었고(#163), 이 파일의
 * `src/primitives/**` 도 한 번 죽었다가 지워졌다(G4).
 *
 * **0건이 항상 결함인 것은 아니다.** 글롭은 의도가 둘로 갈린다.
 *
 * - **커버 글롭** — 규칙을 걸 대상이 있어야 한다. 0건이면 규칙이 통째로 꺼진 것이므로 실패다.
 * - **금지 글롭** — 그 경로가 생기는 것 자체를 막는다. 0건이 정상이고, 매칭되면 실패다.
 *
 * 둘을 아래 목록으로 **분류해 고정한다.** 설정에 새 글롭이 들어오면 어느 쪽인지 적기 전까지
 * 대조군 단정이 실패한다 — 분류하지 않은 글롭이 조용히 통과하지 않는다.
 *
 * **두 목록을 「일관성」을 이유로 합치지 마라.** 단순히 「죽은 글롭 = 실패」로 만들면
 * `src/schemas/compositions/**` 가 **거짓 실패**한다 — 그 글롭은 0건이어야 정상이다.
 * `rule-globs.test.ts` 에는 이 구분이 없는데, 거기 글롭이 전부 커버 글롭이라 필요가 없었을
 * 뿐이다. 여기서는 필요하다.
 */

const AFDS_ROOT = join(__dirname, '../..')

/** 규칙을 걸 대상이 있어야 하는 글롭 — 0건이면 규칙이 꺼진 것이다. */
const COVERAGE_GLOBS = ['src/bricks/**/*.{ts,tsx}', 'src/headless/**/*.{ts,tsx}'] as const

/**
 * 경로가 생기는 것 자체를 막는 글롭 — 0건이 정상이다.
 *
 * `src/schemas/compositions/**` 는 `selector: 'Program'` 으로 파일 존재 자체를 error 로 만든다.
 * 컴포지션 스키마는 그 디렉터리가 아니라 컴포지션 자체 디렉터리에서 인라인으로 관리한다.
 */
const PROHIBITION_GLOBS = ['src/schemas/compositions/**/*.{ts,tsx}'] as const

/** 규칙을 끄는 면제 override 의 글롭 — 대상 파일 수를 셀 이유가 없다(stories/test 데모 교차 조합). */
const EXEMPTION_GLOBS = new Set(['src/**/__test__/**'])

/**
 * 이 검사가 읽는 글롭은 **디렉터리 한정** 글롭뿐이다 — `**\/` 로 시작하는 전역 글롭
 * (`**\/*.{ts,mts,cts,tsx}` 등)은 정의상 죽을 수 없어 대상이 아니다.
 */
function directoryScopedGlobs(): string[] {
  const found = new Set<string>()
  for (const entry of eslintConfig as Array<{ files?: unknown }>) {
    const files = entry?.files
    if (!Array.isArray(files)) continue
    // tseslint 가 `files: [[a, b], [a, c]]` 처럼 중첩 배열을 넣는다 — 평탄화해서 읽는다.
    for (const glob of files.flat(Infinity) as unknown[]) {
      if (typeof glob !== 'string') continue
      if (glob.startsWith('**/')) continue
      found.add(glob)
    }
  }
  // 레이어 경계(`no-restricted-imports`)는 oxlint 가 맡는다 — 같은 방식으로 글롭을 읽는다.
  for (const o of oxlintConfig.overrides) {
    for (const glob of o.files) {
      if (glob.startsWith('**/') || EXEMPTION_GLOBS.has(glob)) continue
      found.add(glob)
    }
  }
  return [...found].sort()
}

/**
 * 글롭이 매칭하는 파일 수. `rule-globs.test.ts` 와 같은 판단으로 `globSync`(Node 22+)를 쓰지
 * 않고 `readdirSync` 로 훑는다 — 검사를 넣는 자리에서 런타임 하한을 조용히 올리지 않는다.
 *
 * **읽지 못하는 형태는 0 이 아니라 예외로 멈춘다.** 0 을 돌려주면 "죽은 글롭" 과 구분되지
 * 않아 이 검사가 스스로 약해진다.
 */
const GLOB_SHAPE = /^([^*{}]+)\/\*\*(?:\/\*\.(\{[^}]+\}|[A-Za-z0-9.]+))?$/

function matchedFileCount(pattern: string): number {
  const shape = pattern.match(GLOB_SHAPE)
  if (!shape) {
    throw new Error(
      `지원하지 않는 글롭 형태: '${pattern}'. ` +
        `이 매처는 '<디렉터리>/**' 와 '<디렉터리>/**/*.<확장자>' 만 읽는다 — ` +
        `패턴을 그 형태로 맞추거나 매처를 확장하라(조용히 통과시키지 않는다).`,
    )
  }
  const [, prefix, extGroup] = shape
  const suffixes = extGroup
    ? (extGroup.startsWith('{') ? extGroup.slice(1, -1).split(',') : [extGroup]).map(
        e => `.${e.trim()}`,
      )
    : null

  let count = 0
  const walk = (dir: string): void => {
    let entries: Dirent[]
    try {
      entries = readdirSync(dir, { withFileTypes: true })
    } catch {
      return // 경로가 없으면 0건 — 커버 글롭이라면 그것이 곧 죽은 글롭이다.
    }
    for (const entry of entries) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules') continue
        walk(full)
      } else if (!suffixes || suffixes.some(s => entry.name.endsWith(s))) {
        count++
      }
    }
  }
  walk(join(AFDS_ROOT, prefix))
  return count
}

describe('eslint·oxlint 글롭', () => {
  const globs = directoryScopedGlobs()

  it('대조군 — 디렉터리 한정 글롭을 실제로 읽었다', () => {
    // 0 이면 아래 단정들이 빈 목록을 돌며 조용히 통과한다.
    expect(globs.length).toBeGreaterThan(0)
  })

  it('모든 디렉터리 한정 글롭이 커버·금지 중 하나로 분류돼 있다', () => {
    const classified = new Set<string>([...COVERAGE_GLOBS, ...PROHIBITION_GLOBS])
    const unclassified = globs.filter(g => !classified.has(g))
    expect(
      unclassified,
      `분류되지 않은 글롭이다 — COVERAGE_GLOBS(대상이 있어야 함) 또는 ` +
        `PROHIBITION_GLOBS(0건이어야 함) 중 하나에 적어라: ${unclassified.join(', ')}`,
    ).toEqual([])

    // 반대 방향도 본다 — 설정에서 사라진 글롭이 목록에 남아 있으면 검사가 허공을 센다.
    const present = new Set(globs)
    const vanished = [...classified].filter(g => !present.has(g))
    expect(
      vanished,
      `설정에 없는 글롭이 목록에 남아 있다 — 규칙이 사라졌다면 목록에서도 빼라: ${vanished.join(', ')}`,
    ).toEqual([])
  })

  it('커버 글롭은 각각 1건 이상 매칭한다 (0건이면 규칙이 꺼진 것이다)', () => {
    const dead: string[] = []
    let total = 0
    for (const glob of COVERAGE_GLOBS) {
      const n = matchedFileCount(glob)
      total += n
      if (n === 0) dead.push(`${glob}: 0건`)
    }
    expect(total, `대조군 — 커버 글롭이 센 파일 ${total}개`).toBeGreaterThan(0)
    expect(dead).toEqual([])
  })

  it('금지 글롭은 0건이다 (매칭되면 금지한 경로가 생긴 것이다)', () => {
    const violated: string[] = []
    for (const glob of PROHIBITION_GLOBS) {
      const n = matchedFileCount(glob)
      if (n > 0) violated.push(`${glob}: ${n}건`)
    }
    expect(violated).toEqual([])
  })
})
