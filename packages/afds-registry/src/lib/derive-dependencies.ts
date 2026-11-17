import { builtinModules } from 'node:module'

/**
 * 컴포지션의 외부 의존성을 **소스의 import 문에서 기계적으로 도출**한다.
 *
 * import 추출은 `extract-specifiers.ts` 로 분리해 둔다(`typescript` 의존) — 그 제약의 유래는
 * 그 파일 헤더에 있다.
 *
 * 이전 구현은 `index.ts` 안의 손으로 쓴 주석(`afds-registry Dependencies: ...`)을 정규식으로 읽고,
 * 없으면 `['@turbo-project/afds']` 로 폴백했다. 그 주석을 쓴 컴포지션이 0개였으므로 23개 전부
 * `@turbo-project/afds` 만 선언했고, 자체 CLI(철거됨)의 `add` 는 소비처에 컴파일되지 않는 코드를
 * 내려놓았다. (실측: `add BaseTable` 직후 `@tanstack/react-table`·`lucide-react`
 * 가 MODULE_NOT_FOUND)
 *
 * 근거는 코드에 이미 다 있다 — 주석이 아니라 import 를 읽는다.
 * 주석 채널은 남아 있지만 폴백이 아니라 **전체 override** 다(`parseDependencyOverride`).
 */

/** 컴포지션의 기반 패키지. 항상 의존성에 포함되며 버전을 붙이지 않는다(아래 주석 참조). */
export const AFDS_PACKAGE = '@turbo-project/afds'

/**
 * 소비처에 이미 있다고 전제하는 패키지 — 의존성 목록에 싣지 않는다.
 * React 앱이 아니면 컴포지션 자체가 무의미하므로 설치를 지시할 필요가 없다.
 *
 * 내보내는 이유: 산출물 검사(`shadcn-registry-closure.test.ts`)가 "bare import 가 전부
 * `dependencies` 에 있는가" 를 단정하는데, 이 집합을 모르면 `react` 를 누락으로 오판한다.
 * 테스트가 같은 목록을 손으로 복제하면 두 목록이 갈라지는 순간 검사가 거짓이 된다.
 */
export const ASSUMED_PRESENT = new Set(['react', 'react-dom'])

const NODE_BUILTINS = new Set(builtinModules)

export interface DerivedDependencies {
  /** 설치 대상 의존성. `@turbo-project/afds` 는 bare, 서드파티는 `name@range`. */
  dependencies: string[]
  /** 범위를 찾지 못한 패키지 — 호출자가 빌드를 실패시키는 근거로 쓴다. */
  missingRanges: string[]
}

/**
 * 모듈 specifier 를 설치 가능한 패키지명으로 정규화한다.
 * 서브패스는 패키지명으로 접는다: `@base-ui/react/checkbox` → `@base-ui/react`.
 * 상대경로·절대경로·node 빌트인은 `null`(외부 의존성이 아님).
 */
export function toPackageName(specifier: string): string | null {
  if (!specifier || specifier.startsWith('.') || specifier.startsWith('/')) return null
  if (specifier.startsWith('node:')) return null

  const segments = specifier.split('/')

  let name: string
  if (specifier.startsWith('@')) {
    // 스코프만 있는 specifier(`@scope`)는 패키지가 아니다.
    if (segments.length < 2 || !segments[1]) return null
    name = `${segments[0]}/${segments[1]}`
  } else {
    name = segments[0]
  }

  if (!name) return null
  if (NODE_BUILTINS.has(name)) return null

  return name
}

/**
 * 주석 override 채널. 도출 결과를 **덮어쓴다**(폴백이 아니다).
 * 도출이 구조적으로 불가능한 예외 상황에만 쓴다.
 *
 *   // afds-registry Dependencies: @tanstack/react-table@^8.21.3, clsx@^2.1.1
 *
 * **다만 제약을 벗어나는 수단은 아니다.** 여기 적은 이름도 AFDS 의
 * `dependencies`·`peerDependencies` 에 있어야 한다(`build-registry.ts` 의 실존 검사).
 * 컴포지션은 AFDS 가 선언한 것 위에서 컴파일되므로 그 제약은 **override 와 무관하게 선재**하고
 * — AFDS 에 없는 패키지를 실제로 import 해도 도출 경로가 같은 이유로 막는다 — override 는
 * 그 목록에 **이미 있는 것의 범위·표기를 재지정**하는 수단일 뿐이다. AFDS 에 없는 패키지가
 * 필요하면 `packages/afds/package.json` 에 선언하는 것이 유일한 길이다.
 */
export function parseDependencyOverride(indexContent: string): string[] | null {
  const match = indexContent.match(/afds-registry Dependencies:\s*([^\n\r]+)/)
  if (!match) return null
  const entries = match[1]
    .split(',')
    .map(d => d.trim())
    .filter(Boolean)
  return entries.length > 0 ? entries : null
}

/**
 * 형제 컴포지션 의존성 override 채널. 도출 결과를 **덮어쓴다**.
 *
 *   // afds-registry CompositionDeps: DatePicker, BaseInput
 *
 * 이전 정규식 `([\w,-]+)` 은 공백을 포함하지 않아 `DatePicker,` 까지만 캡처하고
 * split 결과에 빈 문자열을 남겼다. 빈 이름이 `compositionDeps` 에 들어가면
 * `add` 가 `Component "" not found in registry` 로 실패한다.
 * 같은 파일의 `Dependencies:` override 예시가 `, ` 로 공백을 쓰므로 현실적인 입력이었다.
 * `Dependencies:` 와 같은 파싱을 쓴다.
 */
export function parseCompositionDepsOverride(indexContent: string): string[] | null {
  const match = indexContent.match(/afds-registry CompositionDeps:\s*([^\n\r]+)/)
  if (!match) return null
  const entries = match[1]
    .split(',')
    .map(d => d.trim())
    .filter(Boolean)
  return entries.length > 0 ? entries : null
}

/**
 * specifier 목록에서 설치 대상 의존성을 만든다.
 *
 * `ranges` 는 패키지명 → 버전 범위(예: `@tanstack/react-table` → `^8.21.3`).
 * 출처는 `packages/afds/package.json` 의 dependencies ∪ peerDependencies — 컴포지션 소스가
 * 실제로 컴파일되는 제약이므로 가장 정확한 근거다.
 *
 * `@turbo-project/afds` 에는 **의도적으로 범위를 붙이지 않는다.** 0.x 에서 `^0.7.1` 은
 * `>=0.7.1 <0.8.0` 이라 캐럿이 마이너를 잠근다. 컴포지션이 AFDS 버전을 강제하면
 * "composition 이 afds 버전을 따라갈 필욘 없다" 는 요구를 코드가 위반한다.
 * 승인 기준 버전은 `approvedAtAfdsVersion` 에 기록만 하고 `add` 는 경고만 한다.
 */
export function buildDependencies(
  specifiers: Iterable<string>,
  ranges: Record<string, string>,
): DerivedDependencies {
  const external = new Set<string>()

  for (const specifier of specifiers) {
    const name = toPackageName(specifier)
    if (name === null) continue
    if (ASSUMED_PRESENT.has(name)) continue
    // AFDS 서브패스(`@turbo-project/afds/bricks` 등 — transform.ts 산출물)를 별개 패키지로 오인하지 않는다.
    if (name === AFDS_PACKAGE) continue
    external.add(name)
  }

  const missingRanges: string[] = []
  const thirdParty: string[] = []

  for (const name of [...external].sort()) {
    const range = ranges[name]
    if (!range) {
      missingRanges.push(name)
      continue
    }
    thirdParty.push(`${name}@${range}`)
  }

  return { dependencies: [AFDS_PACKAGE, ...thirdParty], missingRanges }
}

/** 의존성 문자열(`name@range` 또는 `name`)에서 패키지명만 뽑는다. */
export function dependencyName(entry: string): string {
  const atIndex = entry.lastIndexOf('@')
  if (atIndex <= 0) return entry
  return entry.slice(0, atIndex)
}
