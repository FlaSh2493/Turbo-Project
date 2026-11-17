import { describe, it, expect, afterAll } from 'vitest'
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
  type Dirent,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

/**
 * `.claude/rules/*.md` 의 `paths` 글롭이 **실재하는 파일을 가리키는가.**
 *
 * **왜 필요한가.** 규칙은 `paths` 가 매칭될 때만 로드된다. 글롭이 무엇도 가리키지 않으면
 * 그 규칙은 **통째로 꺼진 채 파일만 남는다** — 아무도 실패를 보지 않으므로 조용하다.
 * 이 저장소에서 실제로 그런 상태가 있었다(컴포지션이 `packages/afds` 에서
 * `packages/afds-registry` 로 이전됐는데 일부 규칙의 `paths` 가 따라가지 않았다).
 *
 * **두 가지를 구분한다.**
 *
 * 1. **죽은 글롭** — 그 패턴이 0건을 매칭한다. 규칙이 꺼진 것이므로 **실패**다.
 * 2. **목록에 없는 대상** — 패턴은 살아 있는데 커버해야 할 트리가 목록에 없다. 글롭 검사로는
 *    보이지 않으므로 아래 별도 단정이 **이름으로** 고정한다.
 *
 * 1번만 검사하면 2번이 조용히 통과한다 — 이 테스트를 넣게 된 결함이 바로 2번이었다.
 */

const REPO_ROOT = join(__dirname, '../../../..')
const RULES_DIR = join(REPO_ROOT, '.claude/rules')

interface Rule {
  file: string
  paths: string[]
}

/** frontmatter 의 `paths:` 목록만 읽는다. YAML 파서를 끌어오지 않는다. */
function readRules(): Rule[] {
  return readdirSync(RULES_DIR)
    .filter(f => f.endsWith('.md'))
    .sort()
    .map(file => {
      const text = readFileSync(join(RULES_DIR, file), 'utf-8')
      const fm = text.split('---')[1] ?? ''
      const paths: string[] = []
      let inPaths = false
      for (const raw of fm.split('\n')) {
        if (/^paths:\s*$/.test(raw)) {
          inPaths = true
          continue
        }
        if (inPaths) {
          const m = raw.match(/^\s*-\s*'([^']+)'\s*$/) ?? raw.match(/^\s*-\s*"([^"]+)"\s*$/)
          if (m) {
            paths.push(m[1])
            continue
          }
          if (raw.trim() !== '') break
        }
      }
      return { file, paths }
    })
}

const rules = readRules()

/**
 * 글롭이 **파일을 몇 개 매칭하는가.**
 *
 * `node:fs` 의 `globSync` 는 **Node 22 부터**다. 루트 `engines` 는 `>=18` 이고 CI 는 24 하나만
 * 돌아서 그 간극을 아무도 밟지 않는다 — 규칙 글롭을 검사하는 자리에서 런타임 하한을 조용히
 * 올릴 이유가 없으므로 `readdirSync` 로 직접 훑는다.
 *
 * 규칙 파일이 쓰는 형태는 두 가지뿐이다.
 *
 * - `<디렉터리>/**` — 그 아래 모든 파일
 * - `<디렉터리>/**\/*.<확장자>` — 확장자가 맞는 파일 (`*.{ts,tsx,md}` 중괄호 포함)
 *
 * **그 밖의 형태는 0 을 돌려주지 않고 예외로 멈춘다.** 0 은 "죽은 글롭" 과 구분되지 않으므로,
 * 못 읽는 패턴을 조용히 0 으로 넘기면 이 테스트가 **스스로 약해진다** — 새 형태의 패턴이
 * 들어왔을 때 "규칙이 꺼졌다" 는 거짓 신호를 내거나, 반대로 통과해 버린다.
 */
const GLOB_SHAPE = /^([^*{}]+)\/\*\*(?:\/\*\.(\{[^}]+\}|[A-Za-z0-9.]+))?$/

function matchedFileCount(pattern: string, root: string = REPO_ROOT): number {
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
      return // 경로가 없으면 0건 — 그것이 곧 죽은 글롭이다.
    }
    for (const entry of entries) {
      // dot 로 시작하는 항목은 건너뛴다. 글롭 구현은 기본적으로 dot 를 매칭하지 않는다
      // (실측: `globSync('**/*.ts')` 는 `.hidden.ts` 와 `.hiddendir/inside.ts` 를 돌려주지
      // 않는다). 세면 **죽은 글롭이 살아 있는 것으로 보인다** — 거짓 통과 쪽으로 틀린다.
      if (entry.name.startsWith('.')) continue

      const full = join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(full)
        continue
      }
      // 심링크는 `Dirent` 만으로 판정할 수 없다 — `isDirectory()` 도 `isFile()` 도 **둘 다
      // false** 다. 그래서 `else if` 로 흘려보내면 **디렉터리 심링크가 파일로 세어진다**
      // (확장자 없는 `<디렉터리>/**` 형태에서 특히). 대상까지 따라가 분류한다.
      if (entry.isSymbolicLink()) {
        let target
        try {
          target = statSync(full)
        } catch {
          continue // 끊긴 링크 — 가리키는 파일이 없다.
        }
        // 디렉터리로 해소되면 세지 않고 **따라가지도 않는다**(순환 위험). 링크 뒤의 파일을
        // 놓치는 쪽이 죽은 글롭을 살아 있다고 하는 쪽보다 안전하다.
        if (!target.isFile()) continue
      } else if (!entry.isFile()) {
        continue // fifo·소켓 등 파일이 아닌 것.
      }
      if (suffixes === null || suffixes.some(s => entry.name.endsWith(s))) {
        count += 1
      }
    }
  }
  walk(join(root, prefix))
  return count
}

describe('.claude/rules 의 paths 글롭', () => {
  it('대조군 — 규칙 파일과 paths 를 실제로 읽었다', () => {
    // 파싱이 죽으면 아래 검사들이 빈 목록을 돌며 조용히 통과한다.
    expect(rules.length).toBeGreaterThan(0)
    expect(
      rules.every(r => r.paths.length > 0),
      '모든 규칙이 paths 를 가져야 한다',
    ).toBe(true)
  })

  it('모든 글롭이 실재하는 파일을 1건 이상 매칭한다 (죽은 글롭 = 꺼진 규칙)', () => {
    const dead: string[] = []
    let checked = 0
    for (const rule of rules) {
      for (const pattern of rule.paths) {
        checked += 1
        if (matchedFileCount(pattern) === 0) {
          dead.push(`${rule.file}: '${pattern}' 이 0건을 매칭한다 — 이 규칙은 꺼져 있다`)
        }
      }
    }
    expect(checked, '글롭을 한 건도 검사하지 못했다면 이 검사는 무동작이다').toBeGreaterThan(0)
    expect(dead).toEqual([])
  })

  it('컴포지션을 커버해야 하는 규칙이 모두 커버한다 (목록 누락)', () => {
    // 글롭이 살아 있어도 **커버 대상이 빠져 있으면** 그 트리에서 규칙이 로드되지 않는다.
    // 컴포지션이 `packages/afds` → `packages/afds-registry` 로 이전됐을 때 실제로 그랬다:
    // 패턴 `packages/afds/src/bricks/**` 는 260건을 매칭해 **살아 있었고**, 그래서 위
    // 검사로는 보이지 않았다. 이름으로 고정하는 수밖에 없다.
    //
    // **현재 커버하는 규칙을 기계로 뽑아 쓰면 안 된다** — 그러면 커버가 빠질 때 도출 목록도
    // 같이 줄어들어 언제나 통과한다(순환). 무엇이 컴포지션 작업에 로드돼야 하는지는 사람이
    // 정하는 것이므로 이름을 박는다. 규칙 파일을 새로 만들면 이 목록도 갱신해야 한다.
    //
    // 스토리북 규칙 2개(`compositions`·`patterns`)도 여기 있어야 한다 — `patterns.md` 는
    // `bricks/**/*.stories.tsx` 도 함께 가리키므로, 컴포지션 글롭만 빠져도 **죽은 글롭 검사에는
    // 걸리지 않는다**(남은 글롭이 39건으로 살아 있다). 위 검사가 못 보는 자리다.
    // **★ 이 검사는 「닿는가」만 본다. 「맞는가」는 못 본다.**
    // `afds-component-structure.md` 가 여기 있어서 그 문서의 `paths` 에 컴포지션이
    // 추가됐는데, 그 본문은 「`packages/afds/src/bricks/{name}/` 아래 4파일 필수」이고
    // **컴포지션에서는 거짓**이다(`.style.ts` 를 가진 것이 4/23). 즉 이 검사는 통과하면서
    // **틀린 규칙이 로드되는 상태**를 만들었다 — 규칙이 꺼진 것보다 나쁘다.
    // 그래서 구조 항목을 컴포지션 전용 규칙으로 옮겼다(#160).
    //
    // **목록에 이름을 넣을 때는 그 문서 본문이 컴포지션에 참인지 먼저 읽어라.**
    const COMPOSITION_TREE = 'packages/afds-registry/src/compositions/'
    const mustCover = [
      // 구조는 컴포지션 전용 규칙이 담당한다 — bricks 규칙(`afds-component-structure.md`)은
      // 파일 구성이 달라 적용되지 않는다. 그쪽은 `spec.md` 절만 공유하고 본문이 참조한다.
      'afds-composition-structure.md',
      'afds-component-tokens.md',
      'afds-component-patterns.md',
      'afds-component-philosophy.md',
      'afds-storybook-compositions.md',
      'afds-storybook-patterns.md',
    ]
    const missing: string[] = []
    for (const file of mustCover) {
      const rule = rules.find(r => r.file === file)
      if (!rule) {
        missing.push(`${file}: 규칙 파일이 없다`)
        continue
      }
      if (!rule.paths.some(p => p.startsWith(COMPOSITION_TREE))) {
        missing.push(`${file}: paths 가 '${COMPOSITION_TREE}' 를 커버하지 않는다`)
      }
    }
    expect(missing).toEqual([])
  })
})

/**
 * 매처를 **임시 트리에 직접 먹인다.**
 *
 * **왜 필요한가.** 위 검사들은 실재 저장소 트리 **하나만** 본다. 그 트리에는 dotfile ·
 * dot-디렉터리 · 심링크 · 파일 없는 디렉터리가 **하나도 없다**(측정: 커버 대상 3개 트리에서
 * 각각 0건). 즉 매처의 판정이 옳은 것이 아니라 **틀릴 입력이 없어서** 통과한다 —
 * 구현 형태가 유일한 보호막이다. 아래는 그 입력을 만들어 **판정 방향까지** 못박는다.
 *
 * 기준은 `node:fs` 의 `globSync` 실측이다(매처가 흉내내려는 대상). 같은 트리에서
 * `globSync('**\/*.ts')` 는 `plain.ts` · `sub/nested.ts` · `filelink.ts` ·
 * `realdir/behind-link.ts` 4건을 돌려주고, `.hidden.ts` 와 `.hiddendir/inside.ts` 는
 * 돌려주지 않는다. 파일 없이 디렉터리만 있는 트리에서는 `[]` 다.
 */
describe('matchedFileCount — 픽스처', () => {
  const roots: string[] = []

  /** `mkdtemp` 로 만든 트리만 지운다. 값이 `null` 이면 빈 디렉터리다. */
  function buildTree(spec: Record<string, string | null>): string {
    const root = mkdtempSync(join(tmpdir(), 'afds-rule-globs-'))
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

  it('대조군 — 실재하는 파일을 세고, 확장자 필터도 듣는다', () => {
    // 이 대조군이 없으면 아래 0건들이 "찾았는데 없다" 인지 "매처가 아무것도 못 본다" 인지
    // 구분되지 않는다.
    const root = buildTree({ 'src/a.ts': 'x', 'src/nested/b.ts': 'x', 'src/c.md': 'x' })
    expect(matchedFileCount('src/**', root)).toBe(3)
    expect(matchedFileCount('src/**/*.ts', root)).toBe(2)
    expect(matchedFileCount('src/**/*.{ts,md}', root)).toBe(3)
  })

  it('파일 0개 · 디렉터리만 있는 트리는 죽은 글롭이다', () => {
    // `globSync('**\/*.ts')` 도 `[]` 다. 디렉터리를 파일로 세면 규칙이 꺼져 있는데도
    // 살아 있는 것으로 보인다.
    const root = buildTree({ 'src/a/b/c': null })
    expect(matchedFileCount('src/**', root)).toBe(0)
    expect(matchedFileCount('src/**/*.ts', root)).toBe(0)
  })

  it('없는 경로는 죽은 글롭이다', () => {
    const root = buildTree({ 'src/a.ts': 'x' })
    expect(matchedFileCount('nope/**', root)).toBe(0)
  })

  it('dotfile 과 dot-디렉터리는 세지 않는다 (글롭 기본과 같다)', () => {
    const root = buildTree({ 'src/.hidden.ts': 'x', 'src/.hiddendir/inside.ts': 'x' })
    expect(matchedFileCount('src/**', root)).toBe(0)
    expect(matchedFileCount('src/**/*.ts', root)).toBe(0)
  })

  it('디렉터리 심링크는 파일로 세지 않는다', () => {
    // 가장 조용한 자리다. `Dirent` 는 심링크에 대해 `isDirectory()` · `isFile()` 이 **둘 다
    // false** 이므로, 분기를 `else if` 로 두면 확장자 없는 `<디렉터리>/**` 에서 디렉터리
    // 심링크가 **파일 1건으로 세어진다** — 트리에 실재 파일이 없어도 글롭이 살아 있다고
    // 판정한다(거짓 통과).
    const root = buildTree({ 'target/real.ts': 'x', 'src/keep': null })
    symlinkSync(join(root, 'target'), join(root, 'src/dirlink'))
    expect(matchedFileCount('src/**', root)).toBe(0)
    // `*.ts` 이름을 가진 디렉터리 심링크도 마찬가지다.
    symlinkSync(join(root, 'target'), join(root, 'src/weird.ts'))
    expect(matchedFileCount('src/**/*.ts', root)).toBe(0)
  })

  it('파일 심링크는 센다 (글롭이 세므로)', () => {
    // 심링크를 일괄 배제하면 여기서 글롭과 갈라진다 — `globSync` 는 `filelink.ts` 를
    // 돌려준다. `Dirent.isFile()` 만으로 거르는 단순한 수정이 이 방향으로 틀린다.
    const root = buildTree({ 'target/real.ts': 'x' })
    symlinkSync(join(root, 'target/real.ts'), join(root, 'target/filelink.ts'))
    expect(matchedFileCount('target/**/*.ts', root)).toBe(2)
  })

  it('끊긴 심링크는 세지 않는다', () => {
    const root = buildTree({ 'src/keep': null })
    symlinkSync(join(root, 'does-not-exist.ts'), join(root, 'src/broken.ts'))
    expect(matchedFileCount('src/**/*.ts', root)).toBe(0)
  })

  it('지원하지 않는 글롭 형태는 0 이 아니라 예외다', () => {
    // 0 을 돌려주면 "죽은 글롭" 과 구분되지 않는다 — 매처가 스스로 약해지는 자리다.
    const root = buildTree({ 'src/a.ts': 'x' })
    expect(() => matchedFileCount('src/*.ts', root)).toThrow(/지원하지 않는 글롭 형태/)
  })
})
