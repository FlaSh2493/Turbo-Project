import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'

/**
 * AFDS 서브패스 배럴이 실제로 내보내는 이름 집합을 구한다.
 *
 * **왜 필요한가.** `transform.ts` 는 깊은 경로를 배럴로 접는다:
 * `../../bricks/form/calendar/calendar` → `@turbo-project/afds/bricks`.
 * 체인의 어느 한 단계라도 `export *` 가 아니면 심볼이 탈락한다. 실측된 체인:
 *
 *     bricks/index.ts    export * from './form'
 *     form/index.ts      export * from './calendar'
 *     calendar/index.ts  export { Calendar, type CalendarCellState } from './calendar'
 *                        ← 여기만 명시적 named 재수출 → CalendarRootProps 탈락
 *
 * 그래서 자체 CLI(철거됨)의 `add DatePicker` 가 내려준 코드가 소비처에서 컴파일되지 않았다:
 *
 *     TS2305: Module '"@turbo-project/afds/bricks"' has no exported member 'CalendarRootProps'.
 *
 * 서브패스가 `exports` 에 있는지만 보는 검증으로는 잡히지 않는다 — 검증 단위가 심볼이다.
 *
 * **빌드 타임 전용.** `typescript` 에 의존하므로 `src/cli/**` 에서 import 하지 마라
 * (esbuild ESM 번들에 들어가면 런타임에 `Dynamic require of "fs"` 로 죽는다).
 */

export interface BarrelSurface {
  /** 배럴이 내보내는 이름들. */
  names: Set<string>
  /** 표면을 읽어낸 진입 파일 (보고용). */
  entry: string
}

/**
 * `afdsDir` 하나당 표면 맵 하나.
 *
 * 이전에는 `afdsDir::subpath` 를 키로 서브패스마다 `ts.createProgram` 을 만들었다. 배럴 5개면
 * **같은 소스 그래프를 5번 파싱**한다 — 실측 1921ms. 진입 파일을 한 program 에 모으면 425ms 로
 * 4.5배 줄고, 5개 배럴의 심볼 집합은 완전히 동일했다(483·235·73·1·166개 전부 일치).
 * 검사를 덜 하는 게 아니라 같은 검사를 한 번만 파싱해서 한다.
 */
const surfaces = new Map<string, Map<string, BarrelSurface | null>>()

/**
 * 서브패스의 배럴 표면. 판정할 수 없으면 `null`.
 *
 * `null` 은 "검사를 건너뛴다" 가 아니라 **"검증할 수 없다"** 는 뜻이다. 호출자는 그 서브패스가
 * 실제로 쓰이고 있다면 오류로 취급해야 한다 — 조용히 넘기면 "위반 0건" 이
 * "깨끗하다" 인지 "보지 않았다" 인지 구분되지 않는다.
 */
export function getBarrelSurface(afdsDir: string, subpath: string): BarrelSurface | null {
  const perDir = computeAllSurfaces(afdsDir)
  // 선언에 없던 서브패스는 표면을 읽을 수 없다 — 예전 경로와 같은 `null` 이다.
  return perDir.get(subpath) ?? null
}

/** `exports` 키를 호출자가 쓰는 서브패스 표기로 되돌린다. `exportsKeyOf` 의 역함수다. */
function subpathOfExportsKey(key: string): string {
  return key === '.' ? '.' : key.replace(/^\.\//, '')
}

/**
 * 이 패키지가 선언한 **배럴 성격 서브패스 전부**의 표면을 program 하나로 한 번에 구한다.
 *
 * 와일드카드 키(`./bricks/*`)는 진입 파일이 하나로 정해지지 않으므로 뺀다 — 별을 그대로
 * 경로에 넣으면 존재하지 않는 파일이 되고, 그건 "표면을 못 읽었다" 와 구분되지 않는다.
 */
function computeAllSurfaces(afdsDir: string): Map<string, BarrelSurface | null> {
  const cached = surfaces.get(afdsDir)
  if (cached) return cached

  const result = new Map<string, BarrelSurface | null>()
  surfaces.set(afdsDir, result)

  let exportKeys: string[]
  try {
    const pkg = JSON.parse(readFileSync(join(afdsDir, 'package.json'), 'utf-8'))
    exportKeys = Object.keys(pkg.exports ?? {})
  } catch {
    return result
  }

  const targets: { subpath: string; entry: string }[] = []
  for (const key of exportKeys) {
    if (key.includes('*')) continue
    const subpath = subpathOfExportsKey(key)
    if (classifySubpath(afdsDir, subpath) !== 'barrel') continue
    const entry = resolveBarrelEntry(afdsDir, subpath)
    if (!entry) {
      result.set(subpath, null)
      continue
    }
    targets.push({ subpath, entry })
  }
  if (targets.length === 0) return result

  const program = ts.createProgram(
    targets.map(t => t.entry),
    PROGRAM_OPTIONS,
  )
  const checker = program.getTypeChecker()
  for (const { subpath, entry } of targets) {
    result.set(subpath, readSurface(program, checker, entry))
  }
  return result
}

function readSurface(
  program: ts.Program,
  checker: ts.TypeChecker,
  entry: string,
): BarrelSurface | null {
  const sourceFile = program.getSourceFile(entry)
  if (!sourceFile) return null
  const moduleSymbol = checker.getSymbolAtLocation(sourceFile)
  if (!moduleSymbol) return null
  return { names: new Set(checker.getExportsOfModule(moduleSymbol).map(s => s.getName())), entry }
}

/**
 * 진입 파일은 AFDS `package.json` 의 `exports['./<subpath>'].source` 에서 도출한다.
 * 하드코딩하면 AFDS 가 구조를 바꿀 때 조용히 어긋나고, 어긋난 결과가 "검증 건너뜀" 이다.
 *
 * 루트는 exports 키가 `'.'` 다. `./` 를 무조건 붙이면 `'./.'` 가 되어 표면을 못 읽는다.
 */
function exportsKeyOf(subpath: string): string {
  return subpath === '.' ? '.' : `./${subpath}`
}

/**
 * 서브패스의 성격. **세 갈래를 뭉개면 안 된다.**
 *
 * - `barrel` — `source` 가 `.ts`/`.tsx`. 심볼 표면을 읽어 대조한다.
 * - `non-barrel` — `source` 가 CSS·JSON 등. 심볼 표면이라는 개념이 없으므로 건너뛴다.
 * - `unknown` — `source` 가 아예 없거나 읽지 못했다. **검증 불가이고 오류다.**
 *
 * 처음에 `barrel` 이 아니면 전부 건너뛰게 짰다가 `unknown` 까지 조용히 통과시켰다 —
 * "표면을 읽을 수 없다" 를 "표면이 없는 종류다" 로 오인한 것이고, 그게 이 저장소가
 * 반복한 실패다. 갈라 둔다.
 */
export type SubpathKind = 'barrel' | 'non-barrel' | 'unknown'

export function classifySubpath(afdsDir: string, subpath: string): SubpathKind {
  try {
    const pkg = JSON.parse(readFileSync(join(afdsDir, 'package.json'), 'utf-8'))
    // 문자열 단축형(`"./tokens": "./tokens/index.css"`)도 경로를 알 수 있다.
    // `.source` 만 보면 그걸 `unknown` 으로 오인해 "표면을 읽을 수 없다" 는 틀린 진단을 낸다.
    const entry = pkg.exports?.[exportsKeyOf(subpath)]
    const declared = typeof entry === 'string' ? entry : entry?.source
    if (typeof declared !== 'string') return 'unknown'
    return /\.(ts|tsx)$/.test(declared) ? 'barrel' : 'non-barrel'
  } catch {
    return 'unknown'
  }
}

function resolveBarrelEntry(afdsDir: string, subpath: string): string | null {
  try {
    const pkg = JSON.parse(readFileSync(join(afdsDir, 'package.json'), 'utf-8'))
    const declared = pkg.exports?.[exportsKeyOf(subpath)]?.source
    if (typeof declared !== 'string') return null
    const entry = join(afdsDir, declared)
    return existsSync(entry) ? entry : null
  } catch {
    return null
  }
}

const PROGRAM_OPTIONS: ts.CompilerOptions = {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  jsx: ts.JsxEmit.ReactJSX,
  noEmit: true,
  skipLibCheck: true,
}
