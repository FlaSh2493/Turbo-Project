import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { mkdirSync, writeFileSync, rmSync, cpSync } from 'node:fs'
import { mkdtempSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { buildRegistry } from '../lib/build-registry'
import { loadTaxonomy, type Taxonomy } from '../lib/taxonomy'

/**
 * 이 파일의 모든 테스트에 20초를 준다. **파일 단위인 것이 요점이다.**
 *
 * 36개 테스트가 전부 같은 비용 구조를 갖는다 — 각자 `ts.createProgram` 으로 배럴 표면을 읽는다.
 * 그래서 하나에만 타임아웃을 주면 다음 PR 에서 옆 테스트가 같은 이유로 터지고 같은 비용을 다시 낸다.
 *
 * 근거(실측):
 *   러너에서 `실제 컴포지션 트리…` 가 20212ms 로 기본값 5000ms 초과 → 다음 푸시엔 통과(flaky)
 *   같은 테스트 로컬 1720ms → 러너와 11.7배 격차
 *   파일 전체는 로컬 6.0s / 러너 14.0s·14.3s (2.3배) — 즉 평시엔 경계 바로 아래에 붙어 있고
 *   경합이 겹치는 순간에만 넘는다. 그래서 "가끔" 빨갛다.
 *
 * 배럴 program 배칭으로 대상 테스트를 1720ms → 589ms(3.0배)로 줄였지만 그것만으로는 부족하다.
 * 같은 11.7배 경합이 다시 오면 589 × 11.7 ≈ 6.9초로 여전히 5000ms 를 넘는다. 줄이는 것과
 * 명시 타임아웃은 **둘 중 하나를 고르는 문제가 아니다.**
 *
 * 20초는 줄어든 비용 기준 최악 추정(≈6.9초)의 약 3배이고, `spec-description.test.ts` 에 준 값과
 * 같다. 남은 느림은 이 검사의 비용이지 결함이 아니다 — 픽스처로 바꾸면 "가드가 실제 트리를
 * 본다" 는 단정이 자기 자신과의 비교가 된다.
 */
vi.setConfig({ testTimeout: 20_000 })
import { findLeftoverAfdsImports } from '../lib/verify-installed'
import { transformImports } from '../lib/transform'

/**
 * 가드가 **실제로 막는지** 픽스처로 검증한다.
 *
 * 이 저장소에서 반복된 결함 유형이 "검증을 넣었다" 와 "검증이 동작한다" 의 간극이다.
 * 아래 케이스는 전부 리뷰가 지적한 실제 통과/오탐 사례에서 왔다.
 */

const AFDS = join(__dirname, '../../../afds')
const AFDS_REGISTRY_COMPOSITIONS_DIR = join(__dirname, '../compositions')
const REAL_TAXONOMY = loadTaxonomy(join(__dirname, '../../taxonomy.json'))
/** 픽스처 트리 전용 — 실제 taxonomy.json 과 값이 다를 수 있지만 형태만 맞으면 된다. */
const FIXTURE_TAXONOMY: Taxonomy = { domains: ['common'], categories: ['form'] }
let base: string

beforeAll(() => {
  base = mkdtempSync(join(tmpdir(), 'registry-guard-'))
})
afterAll(() => {
  rmSync(base, { recursive: true, force: true })
})

// 인용 블록이 있어야 유효한 spec 이다 — 레지스트리 description 을 여기서 도출한다.
// frontmatter 도 필수다 — 없으면 `resolveSpecCategories` 가 막는다.
const SPEC = '---\ndomain: common\ncategory: form\n---\n\n# spec\n\n> 픽스처용 컴포지션.\n'
let seq = 0

/** AFDS 트리 구조를 모방한 픽스처. package.json 은 실제 것을 복사해 exports 를 실측 반영한다. */
function buildFixtureResult(files: Record<string, string>) {
  const root = join(base, `fx-${seq++}`)
  mkdirSync(join(root, 'src/bricks/action'), { recursive: true })
  mkdirSync(join(root, 'src/lib'), { recursive: true })
  writeFileSync(join(root, 'src/bricks/index.ts'), 'export const Button = 1\n')
  writeFileSync(join(root, 'src/bricks/action/button.ts'), 'export const Button = 1\n')
  writeFileSync(join(root, 'src/lib/utils.ts'), 'export const cn = (x: string) => x\n')
  writeFileSync(join(root, 'src/lib/slot.ts'), 'export const Slot = 1\n')
  // 루트 배럴 — bare 루트 import 의 심볼 표면을 읽으려면 실제 파일이 있어야 한다.
  writeFileSync(
    join(root, 'src/lib/compose-event-handlers.ts'),
    'export const composeEventHandlers = 1\n',
  )
  writeFileSync(
    join(root, 'src/lib/index.ts'),
    "export * from './utils'\nexport * from './compose-event-handlers'\n",
  )
  writeFileSync(join(root, 'src/index.ts'), "export * from './bricks'\nexport * from './lib'\n")
  cpSync(join(AFDS, 'package.json'), join(root, 'package.json'))
  for (const [rel, content] of Object.entries(files)) {
    const p = join(root, 'src/compositions', rel)
    mkdirSync(join(p, '..'), { recursive: true })
    writeFileSync(p, content)
  }
  return buildRegistry({
    afdsDir: root,
    compositionsDir: join(root, 'src/compositions'),
    taxonomy: FIXTURE_TAXONOMY,
  })
}

/** 에러만 필요할 때. spec.md 관련 잡음은 걷어낸다. */
function buildFixture(files: Record<string, string>) {
  return buildFixtureResult(files).errors.filter(e => !e.includes('spec.md'))
}

const OK_IMPORT = `import { Button } from '../../bricks/action/button'\nexport const X = Button\n`

describe('빌드 가드 — 치환 규칙 없는 AFDS 내부 import 를 막는다', () => {
  // 이전 가드는 자체 정규식(`from '...'`)으로 훑어서 이 네 가지를 아예 보지 못했다.
  it.each([
    ['side-effect import', `import '../../styles/index.css'\nexport const X = 1\n`],
    ['동적 import()', `export const load = () => import('../../lib/slot')\n`],
    ['require()', `const s = require('../../lib/slot')\nexport const X = s\n`],
    ['export * from', `export * from '../../lib/slot'\n`],
  ])('%s 형태도 잡는다', (_label, source) => {
    const errors = buildFixture({ 'demo/index.ts': source, 'demo/demo.spec.md': SPEC })
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0]).toContain('transform 규칙이 없다')
  })

  // #118 에서 `lib/utils` 치환 규칙을 제거했다. 규칙이 사라졌다는 것만으로는 부족하고,
  // **그 상대 import 가 이제 실제로 막히는지**를 단정해야 한다. 막히지 않으면 치환되지 않은
  // `../../lib/utils` 가 그대로 소비처로 나가 컴파일이 깨진다 — 예전 결함보다 늦게 드러난다.
  it('`../../lib/utils` 는 규칙이 사라졌으므로 이제 막힌다 (#118 회귀)', () => {
    const errors = buildFixture({
      'demo/index.ts': `import { cn } from '../../lib/utils'\nexport const X = cn\n`,
      'demo/demo.spec.md': SPEC,
    })
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0]).toContain('transform 규칙이 없다')
  })

  // #118 은 루트 bare import 를 정본으로 삼았으나, codex 사후 리뷰(#141)가 그 근거("도달
  // 모듈 수가 같다")가 Module Federation 의 shared-key 동일성과 무관함을 지적해 뒤집혔다.
  // 정본은 이제 서브패스다 — 같은 심볼을 서브패스로 가져오면 통과해야 한다.
  it('같은 `cn` 을 서브패스로 가져오면 통과한다 (#141 이후 정본)', () => {
    const errors = buildFixture({
      'demo/index.ts': `import { cn } from '@turbo-project/afds/lib/utils'\nexport const X = cn\n`,
      'demo/demo.spec.md': SPEC,
    })
    expect(errors).toEqual([])
  })

  // 루트 barrel import 는 서브패스와 섞이면 Module Federation 인스턴스가 갈라진다(#141) —
  // exports 에 루트가 선언돼 있어도 무조건 막는다. fail-closed.
  it('같은 `cn` 을 루트 bare import 로 가져오면 막는다 (#141 — #118 뒤집힘)', () => {
    const errors = buildFixture({
      'demo/index.ts': `import { cn } from '@turbo-project/afds'\nexport const X = cn\n`,
      'demo/demo.spec.md': SPEC,
    })
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0]).toContain('루트 barrel')
  })

  it('컴포지션이 아닌 형제 참조를 잡는다 — add 는 컴포지션 디렉터리만 내려받는다', () => {
    const errors = buildFixture({
      'demo/index.ts': `import { fmt } from '../shared/format'\nexport const X = fmt\n`,
      'demo/demo.spec.md': SPEC,
      'shared/format.ts': 'export const fmt = 1\n',
    })
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0]).toContain('컴포지션이 아닌')
  })
})

describe('빌드 가드 — 정상 입력을 막지 않는다 (오탐 회귀)', () => {
  it.each([
    [
      '배럴 형태',
      { 'demo/index.ts': `import { Button } from '../../bricks'\nexport const X = Button\n` },
    ],
    [
      '주석 안의 예시 import',
      { 'demo/index.ts': `/** 예: import { x } from '../../lib/slot' */\n${OK_IMPORT}` },
    ],
    [
      "중첩 파일의 '../../../bricks/...'",
      {
        'demo/index.ts': `export * from './hooks/use-x'\n`,
        'demo/hooks/use-x.ts': `import { Button } from '../../../bricks/action/button'\nexport const useX = () => Button\n`,
      },
    ],
    [
      // `../` 개수를 세는 방식이 오탐했던 입력. base-table/hooks/use-table.ts 가 실제로 이 모양이다.
      "중첩 파일의 컴포지션 내부 '../types'",
      {
        'demo/index.ts': `export * from './hooks/use-x'\n`,
        'demo/types.ts': 'export type T = 1\n',
        'demo/hooks/use-x.ts': `import type { T } from '../types'\nexport const useX = (t: T) => t\n`,
      },
    ],
    ['정상 deep import', { 'demo/index.ts': OK_IMPORT }],
  ])('%s 는 통과한다', (_label, files) => {
    expect(buildFixture({ ...files, 'demo/demo.spec.md': SPEC })).toEqual([])
  })

  it('형제 컴포지션 참조는 통과하고 compositionDeps 로 기록된다', () => {
    expect(
      buildFixture({
        'demo/index.ts': `import { Y } from '../other'\nexport const X = Y\n`,
        'demo/demo.spec.md': SPEC,
        'other/index.ts': 'export const Y = 1\n',
        'other/other.spec.md': SPEC,
      }),
    ).toEqual([])
  })
})

describe('override 실존 검증 — 적어 넣은 패키지가 AFDS 에 있는가', () => {
  /**
   * `// afds-registry Dependencies:` override 는 도출 결과를 **덮어쓴다**(폴백이 아니다). 그래서
   * 거기 적힌 이름은 아무도 검증하지 않은 채 `registry.json` 의 `dependencies` 로 실려 나가고,
   * 소비처에서 `shadcn add` 가 그 패키지에서 404 를 받아 **반쯤 설치된 상태**를 남긴다.
   *
   * **override 를 쓰는 컴포지션이 현재 0건**이라 이 경로는 회귀해도 조용하다 — 그래서 픽스처로
   * 고정한다. `derive-dependencies.test.ts` 는 override **파싱**만 보고 실존은 보지 않는다.
   *
   * AFDS 의 `dependencies`·`peerDependencies` 를 정본으로 삼는 이유: 컴포지션은 AFDS 가
   * 선언한 것 위에서 컴파일되므로 그 목록이 소비처에 지시할 수 있는 유일한 근거다.
   */
  const withOverride = (entries: string) =>
    buildFixture({
      'demo/index.ts': `// afds-registry Dependencies: ${entries}\n${OK_IMPORT}`,
      'demo/demo.spec.md': SPEC,
    })

  it('AFDS 에 선언된 패키지만 적으면 통과한다 (대조군)', () => {
    // 통과가 "검사가 무동작" 이 아니라 "정상 입력을 막지 않는다" 임을 고정한다.
    expect(withOverride('clsx@^2.1.1, @tanstack/react-table@^8.21.3')).toEqual([])
  })

  it('실제 패키지를 유지한 채 없는 패키지를 추가하면 잡는다', () => {
    // **이 형태가 핵심이다.** bogus 만 적으면 컴파일·다른 테스트가 잡지만, 실제 것을
    // 유지한 채 **추가**하면 이 검사 전에는 아무도 보지 못했다.
    const errors = withOverride('clsx@^2.1.1, not-a-real-package@^1.0.0')
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0]).toContain('not-a-real-package')
    expect(errors[0]).toContain('AFDS 의 dependencies·peerDependencies 에 없다')
  })

  it('없는 패키지만 적어도 잡는다', () => {
    const errors = withOverride('not-a-real-package@^1.0.0')
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0]).toContain('not-a-real-package')
  })

  it('react·react-dom 은 소비처에 이미 있다고 전제하므로 통과한다', () => {
    // ASSUMED_PRESENT 예외가 살아 있는지 — 이것이 죽으면 정상 override 가 막힌다.
    expect(withOverride('react@^19.0.0')).toEqual([])
  })
})

describe('심볼 단위 검증 — 배럴로 접힌 뒤에도 이름이 살아남아야 한다', () => {
  /** AFDS 배럴 체인을 모방한 픽스처. `calendarIndex` 로 그룹 배럴의 재수출을 바꾼다. */
  function barrelFixture(calendarIndex: string, importLine: string) {
    const root = join(base, `barrel-${seq++}`)
    mkdirSync(join(root, 'src/bricks/form/calendar'), { recursive: true })
    writeFileSync(join(root, 'src/bricks/index.ts'), `export * from './form'\n`)
    writeFileSync(join(root, 'src/bricks/form/index.ts'), `export * from './calendar'\n`)
    writeFileSync(
      join(root, 'src/bricks/form/calendar/calendar.ts'),
      `export interface CalendarRootProps { a: number }\nexport const Calendar = 1\n`,
    )
    writeFileSync(join(root, 'src/bricks/form/calendar/index.ts'), calendarIndex)
    // exports['./bricks'].source 에서 진입 파일을 도출하므로 package.json 이 필요하다.
    writeFileSync(
      join(root, 'package.json'),
      JSON.stringify({
        name: '@turbo-project/afds',
        version: '0.0.0',
        exports: { './bricks': { source: './src/bricks/index.ts' } },
      }),
    )
    const comp = join(root, 'src/compositions/demo')
    mkdirSync(comp, { recursive: true })
    writeFileSync(join(comp, 'index.ts'), importLine)
    writeFileSync(join(comp, 'demo.spec.md'), SPEC)
    return buildRegistry({
      afdsDir: root,
      compositionsDir: join(root, 'src/compositions'),
      taxonomy: FIXTURE_TAXONOMY,
    })
  }

  const NAMED_ONLY = `export { Calendar, type CalendarRootProps } from './calendar'\n`
  const DROPS_TYPE = `export { Calendar } from './calendar'\n`

  it('배럴이 이름을 재수출하면 통과한다', () => {
    const { errors, coverage } = barrelFixture(
      NAMED_ONLY,
      `import { Calendar, type CalendarRootProps } from '../../bricks/form/calendar/calendar'\nexport const X: CalendarRootProps = { a: Calendar }\n`,
    )
    expect(errors).toEqual([])
    expect(coverage.symbolsChecked).toBe(2)
    expect(coverage.barrelsResolved).toContain('bricks')
  })

  // 실측된 결함: bricks → form 은 `export *` 인데 calendar/index.ts 만 명시적 named
  // 재수출이라 CalendarRootProps 가 탈락했다. 자체 CLI(철거됨) `add DatePicker` 가 컴파일
  // 안 되는 코드를 배포했다.
  it('체인 중간이 이름을 빼면 빌드를 막는다', () => {
    const { errors } = barrelFixture(
      DROPS_TYPE,
      `import { Calendar, type CalendarRootProps } from '../../bricks/form/calendar/calendar'\nexport const X: CalendarRootProps = { a: Calendar }\n`,
    )
    expect(errors.length).toBe(1)
    expect(errors[0]).toContain('CalendarRootProps')
    expect(errors[0]).toContain('TS2305')
  })

  it('배럴에 있는 이름만 가져오면 통과한다', () => {
    const { errors } = barrelFixture(
      DROPS_TYPE,
      `import { Calendar } from '../../bricks/form/calendar/calendar'\nexport const X = Calendar\n`,
    )
    expect(errors).toEqual([])
  })

  it('배럴 표면을 읽을 수 없으면 조용히 넘기지 않고 오류를 낸다', () => {
    // exports['./bricks'].source 가 없는 AFDS — 검증 불가를 통과로 오인하면
    // "위반 0건" 이 "보지 않았다" 가 된다.
    const root = join(base, `barrel-unresolvable-${seq++}`)
    mkdirSync(join(root, 'src/bricks'), { recursive: true })
    writeFileSync(join(root, 'src/bricks/index.ts'), 'export const Calendar = 1\n')
    writeFileSync(
      join(root, 'package.json'),
      JSON.stringify({
        name: '@turbo-project/afds',
        version: '0.0.0',
        exports: { './bricks': {} },
      }),
    )
    const comp = join(root, 'src/compositions/demo')
    mkdirSync(comp, { recursive: true })
    writeFileSync(
      join(comp, 'index.ts'),
      `import { Calendar } from '../../bricks/x'\nexport const X = Calendar\n`,
    )
    writeFileSync(join(comp, 'demo.spec.md'), SPEC)

    const { errors, coverage } = buildRegistry({
      afdsDir: root,
      compositionsDir: join(root, 'src/compositions'),
      taxonomy: FIXTURE_TAXONOMY,
    })
    expect(coverage.barrelsUnresolved).toContain('bricks')
    expect(errors.some(e => e.includes('표면을 읽을 수 없어'))).toBe(true)
  })
})

describe('가드 검사 범위 — 위반 0건이 "보지 않았다" 가 아님을 확인한다', () => {
  it('실제 컴포지션 트리에서 검사한 사이트 수를 보고한다', () => {
    const { coverage } = buildRegistry({
      afdsDir: AFDS,
      compositionsDir: AFDS_REGISTRY_COMPOSITIONS_DIR,
      taxonomy: REAL_TAXONOMY,
    })

    // 0 이면 가드가 아무것도 안 본 것이다. 회귀 시 즉시 드러나게 하한을 건다.
    expect(coverage.filesScanned).toBeGreaterThan(50)
    expect(coverage.relativeSpecifiers).toBeGreaterThan(50)
    // 컴포지션이 afds-registry 로 이전되며 afds 소스 트리로의 상대 import 는 전부 서브패스로
    // 바뀌었다(upstream codex 리뷰 #141) — 0 이어야 정상이다. 0 초과는 회귀다.
    expect(coverage.afdsRefs).toBe(0)
    expect(coverage.symbolsChecked).toBeGreaterThan(50)
    // subpath 통일(#141)로 같은 파일의 여러 import 문이 서브패스 하나로 합쳐져 "사이트"
    // (import 문) 수는 줄었다(실측 47) — 심볼 수(symbolsChecked)는 그대로다. 통합 전
    // 하한(50)을 그대로 두지 않고 실측값 기준으로 다시 잡는다.
    expect(coverage.symbolCheckedSites).toBeGreaterThan(40)
    expect(coverage.outsideRefs).toBe(0)

    // 분류 합이 전체와 일치해야 한다 — 어느 분류에도 안 든 채 넘어간 specifier 가 없다.
    expect(
      coverage.internalPaths + coverage.siblingRefs + coverage.afdsRefs + coverage.outsideRefs,
    ).toBe(coverage.relativeSpecifiers)

    // 수치를 나란히 찍는 것만으로는 부족하다 — 실제로 분류는 늘었는데 대조는 줄어든
    // 모순이 두 수치를 같은 블록에 출력하면서도 통과했다. 관계를 단정해야 잡힌다.
    expect(
      coverage.symbolCheckedSites +
        coverage.symbolSkippedNonBarrel +
        coverage.symbolSkippedUnresolved,
    ).toBe(coverage.afdsBindingSites)
    // symbolCheckedSites 와 같은 이유(subpath 통일로 import 문이 합쳐짐)로 하한을 재조정.
    expect(coverage.afdsBindingSites).toBeGreaterThan(40)

    // bare specifier 도 같은 규율을 받는다. 예전에는 분류에서 통째로 빠져 있어서
    // "검사했고 통과" 와 "분류 밖이라 안 봤다" 가 구분되지 않았다.
    expect(coverage.bareSpecifiers).toBeGreaterThan(50)
    // 루트 barrel(`@turbo-project/afds`) import 는 0 이어야 한다 — 서브패스만 쓴다(#141).
    // 0 초과는 root/subpath 혼용이 재발했다는 뜻이고, buildRegistry 가 이를 errors 로도 잡는다.
    expect(coverage.afdsRootRefs).toBe(0)
    // subpath 통일로 여러 import 문이 하나로 합쳐져 specifier 등장 횟수 자체가 줄었다
    // (symbolCheckedSites 와 같은 이유) — 실측 기준으로 하한을 잡는다.
    expect(coverage.afdsSubpathRefs).toBeGreaterThan(30)
    expect(coverage.afdsRootRefs + coverage.afdsSubpathRefs + coverage.externalRefs).toBe(
      coverage.bareSpecifiers,
    )

    // 쓰이는 배럴은 모두 표면을 읽어야 한다.
    expect(coverage.barrelsUnresolved).toEqual([])
    expect(coverage.barrelsResolved.length).toBeGreaterThan(0)
  })

  it('컴포지션에 루트 barrel import 가 다시 들어오면 errors 로 잡는다 (파괴 재현)', () => {
    const root = join(base, `root-mix-${seq++}`)
    mkdirSync(join(root, 'src/compositions/demo'), { recursive: true })
    mkdirSync(join(root, 'src/lib'), { recursive: true })
    writeFileSync(join(root, 'src/lib/utils.ts'), 'export const cn = (x: string) => x\n')
    writeFileSync(join(root, 'src/lib/index.ts'), "export * from './utils'\n")
    writeFileSync(join(root, 'src/index.ts'), "export * from './lib'\n")
    cpSync(join(AFDS, 'package.json'), join(root, 'package.json'))
    writeFileSync(
      join(root, 'src/compositions/demo/index.ts'),
      "import { cn } from '@turbo-project/afds'\nexport const Demo = cn('x')\n",
    )
    writeFileSync(join(root, 'src/compositions/demo/demo.spec.md'), SPEC)

    const { errors, coverage } = buildRegistry({
      afdsDir: root,
      compositionsDir: join(root, 'src/compositions'),
      taxonomy: FIXTURE_TAXONOMY,
    })
    expect(coverage.afdsRootRefs).toBe(1)
    expect(errors.some(e => e.includes('루트 barrel'))).toBe(true)
  })
})

describe('bare specifier 분류 — 분류 밖으로 빠져나가는 경로가 없다', () => {
  const SRC = (imp: string) => `${imp}\nexport const X = 1\n`

  // #141 이후 루트 barrel import 는 분류는 되지만(afdsRootRefs) 통과하지 않는다 — 무조건
  // errors 로 잡는다(Module Federation shared-key 분리 방지, fail-closed).
  it('AFDS 루트 import 는 분류에 집계되지만 막힌다 (#141)', () => {
    const { errors, coverage } = buildFixtureResult({
      'demo/index.ts': SRC(`import { composeEventHandlers } from '@turbo-project/afds'`),
      'demo/demo.spec.md': SPEC,
    })
    expect(errors.filter(e => !e.includes('spec.md') && e.includes('루트 barrel'))).toHaveLength(1)
    expect(coverage.afdsRootRefs).toBe(1)
    expect(coverage.bareSpecifiers).toBe(1)
  })

  it('exports 에 선언된 AFDS 서브패스는 통과한다', () => {
    const { errors, coverage } = buildFixtureResult({
      'demo/index.ts': SRC(`import { Button } from '@turbo-project/afds/bricks'`),
      'demo/demo.spec.md': SPEC,
    })
    expect(errors.filter(e => !e.includes('spec.md'))).toEqual([])
    expect(coverage.afdsSubpathRefs).toBe(1)
  })

  // 이게 예전에 조용히 통과하던 경로다. exports 대조는 상대 import 에서 파생된
  // 서브패스만 보고 있었고, 작성자가 직접 쓴 bare 서브패스는 아무도 안 봤다.
  it('exports 에 없는 AFDS 서브패스를 직접 쓰면 막는다', () => {
    const { errors, coverage } = buildFixtureResult({
      'demo/index.ts': SRC(`import { mergeRefs } from '@turbo-project/afds/lib/slot'`),
      'demo/demo.spec.md': SPEC,
    })
    expect(coverage.afdsSubpathRefs).toBe(1)
    const hit = errors.find(e => e.includes('AFDS exports 에 없는 서브패스'))
    expect(hit).toBeDefined()
    expect(hit).toContain('./lib/slot')
  })

  it('외부 패키지는 통과하되 집계된다 — 의존성 도출이 담당한다', () => {
    const { errors, coverage } = buildFixtureResult({
      'demo/index.ts': SRC(`import * as React from 'react'`),
      'demo/demo.spec.md': SPEC,
    })
    expect(errors.filter(e => !e.includes('spec.md'))).toEqual([])
    expect(coverage.externalRefs).toBe(1)
    expect(coverage.afdsRootRefs + coverage.afdsSubpathRefs).toBe(0)
  })

  it('상대 import 와 bare 를 섞어도 각각의 분류로 집계된다', () => {
    const { coverage } = buildFixtureResult({
      'demo/index.ts':
        `import { Button } from '../../bricks/action/button'\n` +
        `import * as React from 'react'\n` +
        `import { composeEventHandlers } from '@turbo-project/afds'\n` +
        `export const X = [Button, React, composeEventHandlers]\n`,
      'demo/demo.spec.md': SPEC,
    })
    expect(coverage.relativeSpecifiers).toBe(1)
    expect(coverage.bareSpecifiers).toBe(2)
    expect(coverage.externalRefs).toBe(1)
    expect(coverage.afdsRootRefs).toBe(1)
  })
})

describe('bare import 도 심볼 검증을 받는다 — 표기법으로 검증이 사라지면 안 된다', () => {
  // 예전에는 상대 import 만 심볼 대조를 받았다. transform 이 `../../bricks` 를
  // `@turbo-project/afds/bricks` 로 치환하므로 **최종 대상 모듈이 문자 그대로 같은데도**
  // bare 로 쓰면 검증이 통째로 사라졌다.
  const NOT_IN_BRICKS = 'cn' // lib 에 있고 bricks 배럴에는 없다

  it('상대 import 로 배럴에 없는 심볼을 가져오면 막는다 (기존 동작)', () => {
    const errors = buildFixture({
      'demo/index.ts': `import { ${NOT_IN_BRICKS} } from '../../bricks'\nexport const X = ${NOT_IN_BRICKS}\n`,
      'demo/demo.spec.md': SPEC,
    })
    expect(errors.some(e => e.includes('배럴 표면에 없다'))).toBe(true)
  })

  it('같은 심볼을 bare 서브패스로 가져와도 똑같이 막는다', () => {
    const { errors, coverage } = buildFixtureResult({
      'demo/index.ts': `import { ${NOT_IN_BRICKS} } from '@turbo-project/afds/bricks'\nexport const X = ${NOT_IN_BRICKS}\n`,
      'demo/demo.spec.md': SPEC,
    })
    expect(errors.some(e => e.includes('배럴 표면에 없다'))).toBe(true)
    // 분류가 늘었는데 심볼 대조가 줄면 "검사했다" 가 거짓이 된다.
    expect(coverage.afdsSubpathRefs).toBe(1)
    expect(coverage.symbolCheckedSites).toBeGreaterThan(0)
  })

  it('bare 루트에서 없는 심볼을 가져와도 막는다', () => {
    const { errors, coverage } = buildFixtureResult({
      'demo/index.ts': `import { NoSuchSymbolAtAll } from '@turbo-project/afds'\nexport const X = NoSuchSymbolAtAll\n`,
      'demo/demo.spec.md': SPEC,
    })
    expect(errors.some(e => e.includes('배럴 표면에 없다'))).toBe(true)
    expect(coverage.symbolCheckedSites).toBeGreaterThan(0)
  })

  // #141 이후: 루트에 실재하는 심볼이어도 루트 barrel 경유라는 이유만으로 막힌다 —
  // 심볼 존재 여부보다 root/subpath 혼용 방지가 우선한다.
  it('루트에 실제로 있는 심볼이어도 루트 경유면 막힌다 (#141)', () => {
    const errors = buildFixture({
      'demo/index.ts': `import { composeEventHandlers } from '@turbo-project/afds'\nexport const X = composeEventHandlers\n`,
      'demo/demo.spec.md': SPEC,
    })
    expect(errors.some(e => e.includes('루트 barrel'))).toBe(true)
  })

  // 돌연변이 방어: `startsWith(AFDS_PACKAGE + '/')` 에서 `/` 를 지우면 이 테스트가 깨진다.
  it('접두가 같은 다른 패키지를 AFDS 서브패스로 오인하지 않는다', () => {
    const { errors, coverage } = buildFixtureResult({
      'demo/index.ts': `import { Icon } from '@turbo-project/afds-icons'\nexport const X = Icon\n`,
      'demo/demo.spec.md': SPEC,
    })
    expect(coverage.externalRefs).toBe(1)
    expect(coverage.afdsSubpathRefs).toBe(0)
    // AFDS 서브패스로 오인했다면 '미선언 서브패스' 오류가 났을 것이다.
    // (버전 범위 미선언 오류는 이 테스트의 관심사가 아니다 — 별개 검사다.)
    expect(errors.some(e => e.includes('AFDS exports 에 없는 서브패스'))).toBe(false)
  })

  // 돌연변이 방어: 루트 분기의 errors.push 를 지우면 이 테스트가 깨진다.
  // #141 이후로는 exports 에 루트가 선언돼 있는지와 무관하게 루트 import 자체가 막힌다.
  it('exports 에 루트가 없어도 있어도 루트를 import 하면 막는다', () => {
    const root = join(base, `no-root-export-${seq++}`)
    mkdirSync(join(root, 'src/compositions/demo'), { recursive: true })
    writeFileSync(
      join(root, 'package.json'),
      JSON.stringify({
        name: '@turbo-project/afds',
        version: '0.0.0',
        exports: { './bricks': {} },
      }),
    )
    writeFileSync(
      join(root, 'src/compositions/demo/index.ts'),
      `import { Anything } from '@turbo-project/afds'\nexport const X = Anything\n`,
    )
    writeFileSync(join(root, 'src/compositions/demo/demo.spec.md'), SPEC)
    const { errors } = buildRegistry({
      afdsDir: root,
      compositionsDir: join(root, 'src/compositions'),
      taxonomy: FIXTURE_TAXONOMY,
    })
    expect(errors.some(e => e.includes('루트 barrel'))).toBe(true)
  })

  it('비-배럴 서브패스도 등식에 포함된다 — 어느 갈래에도 안 든 채 빠져나가지 않는다', () => {
    const { coverage } = buildFixtureResult({
      'demo/index.ts': `import { a } from '@turbo-project/afds/styles'\nimport { cn } from '../../lib/utils'\nexport const X = [a, cn]\n`,
      'demo/demo.spec.md': SPEC,
    })
    expect(coverage.symbolSkippedNonBarrel).toBe(1)
    expect(
      coverage.symbolCheckedSites +
        coverage.symbolSkippedNonBarrel +
        coverage.symbolSkippedUnresolved,
    ).toBe(coverage.afdsBindingSites)
  })

  // 와일드카드 키를 평평한 집합으로만 보면 **선언돼 있는데 미선언이라고 막는다.**
  it('exports 의 와일드카드 패턴에 매칭되는 서브패스를 막지 않는다', () => {
    const root = join(base, `wildcard-${seq++}`)
    mkdirSync(join(root, 'src/bricks/action'), { recursive: true })
    mkdirSync(join(root, 'src/compositions/demo'), { recursive: true })
    writeFileSync(join(root, 'src/bricks/action/index.ts'), 'export const Button = 1\n')
    writeFileSync(
      join(root, 'package.json'),
      JSON.stringify({
        name: '@turbo-project/afds',
        version: '0.0.0',
        exports: { './bricks/*': { source: './src/bricks/*/index.ts' } },
      }),
    )
    writeFileSync(
      join(root, 'src/compositions/demo/index.ts'),
      `import { Button } from '@turbo-project/afds/bricks/action'\nexport const X = Button\n`,
    )
    writeFileSync(join(root, 'src/compositions/demo/demo.spec.md'), SPEC)
    const { errors, coverage } = buildRegistry({
      afdsDir: root,
      compositionsDir: join(root, 'src/compositions'),
      taxonomy: FIXTURE_TAXONOMY,
    })
    expect(coverage.afdsSubpathRefs).toBe(1)
    expect(errors.some(e => e.includes('AFDS exports 에 없는 서브패스'))).toBe(false)
  })

  // 같은 의미의 상대경로는 "트리 밖" 하드 오류인데 절대경로만 조용히 통과하던 비대칭.
  it('절대경로 specifier 를 막는다', () => {
    const { errors, coverage } = buildFixtureResult({
      'demo/index.ts': `import { X } from '/abs/path/mod'\nexport const Y = X\n`,
      'demo/demo.spec.md': SPEC,
    })
    expect(coverage.bareSpecifiers).toBe(1)
    expect(errors.some(e => e.includes('절대경로'))).toBe(true)
  })

  it('CSS·JSON 서브패스는 오류가 아니라 미검사로 드러낸다', () => {
    const { errors, coverage } = buildFixtureResult({
      'demo/index.ts': `import { anything } from '@turbo-project/afds/styles'\nexport const X = anything\n`,
      'demo/demo.spec.md': SPEC,
    })
    expect(coverage.nonBarrelSubpaths).toContain('styles')
    expect(errors.filter(e => !e.includes('spec.md'))).toEqual([])
  })
})

// `findLeftoverAfdsImports` 의 계약을 고정한다 — **지금 이 함수를 쓰는 것은 문서 검사다.**
//
// 원래 자리는 자체 CLI 의 설치 직전 검사였다(철거됨). 그 CLI 는 `--ref`/`AFDS_REGISTRY_REF` 로
// 지정된 커밋에서 소스를 받아 빌드 가드가 본 적 없는 소스를 설치할 수 있었고, 이 함수가
// 그 구멍을 막는 마지막 관문이었다. 표준 `shadcn` CLI 는 파일을 그대로 복사하므로
// **설치 시점 검사는 지금 없다.**
//
// 함수는 남아 `docs-import-truth.test.ts` 가 쓴다 — 문서의 예시 import 를
// `transformImports` → `findLeftoverAfdsImports` 로 흘려 문서가 안내하는 import 가 실제로
// 치환 가능한지 대조한다. 즉 **이 describe 가 지키는 것은 그 문서 검사의 토대**다.
// 아래 케이스(side-effect·동적 `import()`·`require()`·형제·컴포지션 내부)가 무너지면
// 문서 검사가 조용히 약해진다.
describe('findLeftoverAfdsImports 계약 — 문서 검사가 이것에 의존한다', () => {
  it('치환 후 남은 AFDS 내부 상대 import 를 줄번호와 함께 찾는다', () => {
    const source = `import { A } from '../../bricks/a'\nimport { B } from '../../unmapped/b'\n`
    const leftovers = findLeftoverAfdsImports(transformImports(source))
    expect(leftovers).toEqual([{ specifier: '../../unmapped/b', line: 2 }])
  })

  it('규칙이 있는 import 는 남지 않는다', () => {
    // 예시는 **살아 있는 규칙**이어야 한다. 전에는 `../../lib/utils` 를 썼는데 #118 에서 그
    // 규칙을 없애면서 이 테스트가 "규칙 있음" 을 더는 대조하지 못하게 됐다.
    const source = `import { H } from '../../headless/h'\nimport { B } from '../../bricks/b'\n`
    expect(findLeftoverAfdsImports(transformImports(source))).toEqual([])
  })

  it('from 이 아닌 형태도 찾는다', () => {
    for (const source of [
      `import '../../styles/x.css'`,
      `const x = await import('../../lib/slot')`,
      `const y = require('../../lib/slot')`,
    ]) {
      expect(findLeftoverAfdsImports(source).length, source).toBeGreaterThan(0)
    }
  })

  it('형제 참조와 컴포지션 내부 경로는 잡지 않는다', () => {
    expect(findLeftoverAfdsImports(`import { A } from '../sibling'`)).toEqual([])
    expect(findLeftoverAfdsImports(`import { A } from './local'`)).toEqual([])
  })
})
