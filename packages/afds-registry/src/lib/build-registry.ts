import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import {
  isDistributableFile,
  isImportScannableFile,
  isSkippedDir,
  isSpecDoc,
} from './composition-files'
import {
  ASSUMED_PRESENT,
  buildDependencies,
  dependencyName,
  parseCompositionDepsOverride,
  parseDependencyOverride,
} from './derive-dependencies'
import { AFDS_PACKAGE } from './derive-dependencies'
import { extractImportBindings, extractSpecifiers } from './extract-specifiers'
import { extractSpecDescription, pickCanonicalSpec } from './spec-summary'
import { resolveSpecCategories, type Taxonomy } from './taxonomy'
import { AFDS_IMPORT_RULES, findAfdsImportRule } from './transform'
import { classifySubpath, getBarrelSurface } from './barrel-exports'
import type { Registry } from '../types'

/**
 * 레지스트리 매니페스트를 컴포지션 소스에서 생성한다.
 *
 * 생성 스크립트(`scripts/generate-manifest.ts`)와 정합 테스트가 **같은 함수**를 쓴다.
 * 테스트가 로직을 복제하면 복제본끼리만 일치하고 실제 산출물은 틀릴 수 있다 —
 * 이 저장소에서 `dist/manifest/tokens.primitive.json` 이 `{}` 로 배포된 것이 그 유형이다.
 */

export interface BuildRegistryOptions {
  /**
   * `packages/afds` 디렉터리 경로. 컴포지션 자체는 더 이상 여기 없다(afds-registry 로 이전) —
   * `readAfdsMetadata`(exports·dependencies 범위)와 `afdsSrcDir`(상대 import 가 afds
   * 소스 트리를 직접 가리키는 실수를 잡는 방어선)에만 쓰인다.
   */
  afdsDir: string
  /** 컴포지션 디렉터리들의 부모 — `packages/afds-registry/src/compositions` */
  compositionsDir: string
  /** 정본 spec frontmatter 의 `domain`·`category` 를 검사할 허용 목록. */
  taxonomy: Taxonomy
}

/**
 * 가드가 **무엇을 실제로 들여다봤는지**. "위반 0건" 이 "깨끗하다" 인지 "보지 않았다" 인지
 * 구분하려면 검사 대상 수를 함께 보고해야 한다.
 */
export interface GuardCoverage {
  /** import 를 읽은 코드 파일 수 */
  filesScanned: number
  /** 분류한 상대 specifier 수 (internal + sibling + afds + outside) */
  relativeSpecifiers: number
  /** 분류한 bare specifier 수 (afdsRootRefs + afdsSubpathRefs + externalRefs) */
  bareSpecifiers: number
  /** `@turbo-project/afds` 루트 import — 소비처에서 그대로 동작한다 */
  afdsRootRefs: number
  /** `@turbo-project/afds/<서브패스>` — AFDS exports 에 선언돼 있어야 한다 */
  afdsSubpathRefs: number
  /** 그 밖의 외부 패키지 — 의존성 도출이 담당한다 */
  externalRefs: number
  /** 컴포지션 내부 경로 — 함께 배포되므로 통과 */
  internalPaths: number
  /** 형제 컴포지션 참조 */
  siblingRefs: number
  /** AFDS 소스를 가리키는 참조 — 치환 규칙이 있어야 한다 */
  afdsRefs: number
  /** AFDS 소스 트리 밖 — 항상 오류 */
  outsideRefs: number
  /** 심볼 대조를 수행한 import 문 수 */
  symbolCheckedSites: number
  /** 심볼 대조를 수행한 이름 수 */
  symbolsChecked: number
  /** 표면을 실제로 읽어낸 배럴 서브패스 */
  barrelsResolved: string[]
  /** 사용되는데 표면을 읽지 못한 배럴 — 검증 불가이므로 오류로 처리한다 */
  barrelsUnresolved: string[]
  /** 심볼 표면이라는 개념이 없는 서브패스 (CSS·JSON) — 오류가 아니라 미검사로 드러낸다 */
  nonBarrelSubpaths: string[]
  /**
   * AFDS 를 가리키면서 named binding 을 가진 import 문 수.
   * `symbolCheckedSites + 미검사(비-배럴) + 검증불가(표면 못 읽음)` 와 **반드시 같아야 한다** —
   * 분류는 늘었는데 대조는 줄어드는 모순을 수치로 잡기 위한 것이다.
   */
  afdsBindingSites: number
  /** AFDS binding 중 비-배럴이라 대조하지 않은 사이트 수 */
  symbolSkippedNonBarrel: number
  /** AFDS binding 중 표면을 못 읽어 대조하지 못한 사이트 수 */
  symbolSkippedUnresolved: number
}

export interface BuildRegistryResult {
  manifest: Registry
  /** 비어 있지 않으면 산출물을 쓰면 안 된다. */
  errors: string[]
  /** 사람이 읽을 생성 로그 (컴포지션별 도출 결과) */
  log: string[]
  /** 가드가 검사한 사이트 수 */
  coverage: GuardCoverage
  /**
   * 컴포지션 디렉터리명 → 배포 대상 파일 (컴포지션 디렉터리 기준 상대경로, 정렬됨).
   *
   * 매니페스트에 넣지 않고 따로 돌려준다. shadcn 규격이 요구하는 `files[]` 모양과 내부
   * 매니페스트의 모양을 분리해 두기 위한 것이다 — 같은 수집 결과를 두 산출물이 나눠 쓰되
   * 한쪽 모양이 다른 쪽에 새지 않게 한다.
   */
  distributableFiles: Record<string, string[]>
}

export function toPascalCase(dirName: string): string {
  return dirName.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase())
}

interface CollectedFiles {
  /** 소비처로 내려갈 파일 (컴포지션 디렉터리 기준 상대경로) */
  distributable: string[]
  /** import 를 읽을 파일 (절대경로) */
  scannable: string[]
}

function collectFiles(dirPath: string, baseDir: string, acc: CollectedFiles) {
  for (const entry of readdirSync(dirPath, { withFileTypes: true })) {
    const full = join(dirPath, entry.name)
    if (entry.isDirectory()) {
      if (isSkippedDir(entry.name)) continue
      collectFiles(full, baseDir, acc)
      continue
    }
    if (!entry.isFile()) continue
    if (isDistributableFile(entry.name)) acc.distributable.push(relative(baseDir, full))
    if (isImportScannableFile(entry.name)) acc.scannable.push(full)
  }
}

/**
 * AFDS package.json 의 dependencies ∪ peerDependencies 에서 버전 범위를 읽는다.
 *
 * 컴포지션 소스는 AFDS 안에 있고 AFDS 가 선언한 범위에 대해 컴파일된다.
 * 따라서 이 범위가 소비처에 지시할 가장 정확한 근거다.
 */
export function readAfdsMetadata(afdsDir: string) {
  const pkg = JSON.parse(readFileSync(join(afdsDir, 'package.json'), 'utf-8'))
  const ranges: Record<string, string> = {
    ...(pkg.peerDependencies ?? {}),
    ...(pkg.dependencies ?? {}),
  }
  return {
    version: pkg.version as string,
    ranges,
    exportKeys: new Set(Object.keys(pkg.exports ?? {})),
  }
}

/** 상대 import 가 해소된 절대경로가 어디에 속하는지. */
type TargetLocation =
  | { kind: 'internal' }
  | { kind: 'sibling'; name: string }
  | { kind: 'afds' }
  | { kind: 'outside' }

/**
 * exports 키 대조. Node 는 `"./bricks/*"` 같은 패턴 키를 지원하므로 평평한 키 집합만
 * 보면 **선언돼 있는데 미선언이라고 막는다** — 정당한 변경을 틀린 이유로 차단하는 오탐이다.
 */
function isDeclaredSubpath(exportKeys: Set<string>, key: string): boolean {
  if (exportKeys.has(key)) return true
  for (const declared of exportKeys) {
    const star = declared.indexOf('*')
    if (star === -1) continue
    const head = declared.slice(0, star)
    const tail = declared.slice(star + 1)
    if (key.length >= head.length + tail.length && key.startsWith(head) && key.endsWith(tail)) {
      return true
    }
  }
  return false
}

function classifyTarget(
  target: string,
  dirs: { compositionDir: string; compositionsDir: string; afdsSrcDir: string },
): TargetLocation {
  const within = (parent: string) => target === parent || target.startsWith(parent + sep)

  if (within(dirs.compositionDir)) return { kind: 'internal' }
  if (within(dirs.compositionsDir)) {
    const rest = relative(dirs.compositionsDir, target)
    const first = rest.split(sep)[0]
    return first ? { kind: 'sibling', name: first } : { kind: 'outside' }
  }
  if (within(dirs.afdsSrcDir)) return { kind: 'afds' }
  return { kind: 'outside' }
}

export function buildRegistry({
  afdsDir,
  compositionsDir,
  taxonomy,
}: BuildRegistryOptions): BuildRegistryResult {
  const afdsSrcDir = join(afdsDir, 'src')
  const errors: string[] = []
  const log: string[] = []

  if (!existsSync(compositionsDir)) {
    return {
      manifest: { name: 'afds-registry', version: '0.1.0', components: [] },
      errors: [`compositions dir not found: ${compositionsDir}`],
      log,
      distributableFiles: {},
      coverage: {
        filesScanned: 0,
        relativeSpecifiers: 0,
        bareSpecifiers: 0,
        afdsRootRefs: 0,
        afdsSubpathRefs: 0,
        externalRefs: 0,
        internalPaths: 0,
        siblingRefs: 0,
        afdsRefs: 0,
        outsideRefs: 0,
        symbolCheckedSites: 0,
        symbolsChecked: 0,
        barrelsResolved: [],
        barrelsUnresolved: [],
        nonBarrelSubpaths: [],
        afdsBindingSites: 0,
        symbolSkippedNonBarrel: 0,
        symbolSkippedUnresolved: 0,
      },
    }
  }

  const afds = readAfdsMetadata(afdsDir)

  const coverage: GuardCoverage = {
    filesScanned: 0,
    relativeSpecifiers: 0,
    bareSpecifiers: 0,
    afdsRootRefs: 0,
    afdsSubpathRefs: 0,
    externalRefs: 0,
    internalPaths: 0,
    siblingRefs: 0,
    afdsRefs: 0,
    outsideRefs: 0,
    symbolCheckedSites: 0,
    symbolsChecked: 0,
    barrelsResolved: [],
    barrelsUnresolved: [],
    nonBarrelSubpaths: [],
    afdsBindingSites: 0,
    symbolSkippedNonBarrel: 0,
    symbolSkippedUnresolved: 0,
  }

  const compDirs = readdirSync(compositionsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    // 파일시스템 순서는 OS마다 다르므로 이름순 정렬 — 결정론적 산출물(CI 재생성 정합)
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))

  const validCompositionDirs = new Set(
    compDirs.filter(d => existsSync(join(compositionsDir, d.name, 'index.ts'))).map(d => d.name),
  )

  /** 실제로 매칭된 규칙의 치환 서브패스 — 도달 가능한 규칙만 exports 검증 대상으로 삼는다. */
  const usedSubpaths = new Set<string>()
  const components: Registry['components'] = []
  const distributableFiles: Record<string, string[]> = {}

  for (const dir of compDirs) {
    if (!validCompositionDirs.has(dir.name)) continue
    const dirPath = join(compositionsDir, dir.name)
    const name = toPascalCase(dir.name)
    const files: CollectedFiles = { distributable: [], scannable: [] }
    collectFiles(dirPath, dirPath, files)
    // 파일시스템 순회 순서는 OS마다 다르다 — 정렬해야 산출물이 결정론적이다(CI 재생성 정합).
    distributableFiles[dir.name] = [...files.distributable].sort()

    // ── 의존성: import 문에서 기계 도출 (주석은 override 전용) ────────────────
    const specifiers = new Set<string>()
    const siblings = new Set<string>()

    for (const file of files.scannable) {
      const content = readFileSync(file, 'utf-8')
      const rel = relative(dirPath, file)

      // specifier 수집·상대경로 검증 모두 **같은 TypeScript 스캐너 결과**를 쓴다.
      // 이전에는 가드가 자체 정규식(`from '...'`)으로 훑어서 side-effect import·
      // 동적 `import()`·`require()`·`export ... from` 을 아예 보지 못했고, 반대로 주석 안의
      // 예시 import 를 실제 import 로 오인했다. 스캐너 하나로 통일해 두 방향을 함께 닫는다.
      coverage.filesScanned += 1
      const allSpecifiers = extractSpecifiers(content)
      for (const specifier of allSpecifiers) specifiers.add(specifier)

      for (const specifier of allSpecifiers) {
        // 상대 specifier 는 **실제 경로로 해소해서** 분류한다. `../` 개수를 세는 방식은
        // 파일 깊이를 무시해 틀린다 — 중첩 파일 `base-table/hooks/use-table.ts` 의
        // `../types` 는 컴포지션 내부(`base-table/types.ts`)지 형제 컴포지션이 아니다.
        if (!specifier.startsWith('.')) {
          // **불변식**: 래핑 계약이 컴포지션에 사용을 요구하는 모든 심볼은 컴포지션에서
          // 도달 가능해야 하고, **그 경로가 이 분류에 나타나야 한다.** 도달 경로는 두
          // 가지다 — 상대 import + transform 규칙(`../../lib/utils` → `@turbo-project/afds/
          // lib/utils`), 또는 bare import(루트 `@turbo-project/afds` 나 선언된 서브패스).
          // 어느 쪽이든 분류에 잡혀야 하고, 잡히지 않으면 그건 통과가 아니라 미검사다.
          //
          // bare specifier 도 분류한다. 예전에는 그냥 건너뛰어서 커버리지에 흔적이 남지
          // 않았고, 그러면 **"검사했고 통과" 와 "분류 밖이라 안 봤다" 가 구분되지 않는다.**
          // 특히 작성자가 `@turbo-project/afds/<서브패스>` 를 직접 쓰면 그 서브패스가 AFDS
          // exports 에 없어도 조용히 통과해 소비처에서 깨진다 — 아래 exports 대조는 상대
          // import 에서 파생된 서브패스만 보고 있었다.
          coverage.bareSpecifiers += 1

          if (specifier === AFDS_PACKAGE) {
            coverage.afdsRootRefs += 1
            // 루트 barrel(`@turbo-project/afds`)과 서브패스(`@turbo-project/afds/bricks` 등)를
            // 같은 컴포지션 안에서 섞으면 Module Federation 환경에서 shared key 가
            // 갈라진다(packages/afds/README.md 「주의: root barrel과 subpath를 섞지
            // 마세요」) — emotion CacheProvider·Theme/Locale Context 가 두 인스턴스로
            // 쪼개져 스타일 누락·Context 단절이 난다(upstream codex 리뷰 #141).
            // 컴포지션은 `shadcn add` 로 소비처 코드베이스에 그대로 복사되므로 이
            // 위험이 직접적이다 — 항상 서브패스로만 써야 한다. fail-closed.
            errors.push(
              `${name} (${rel}): '${specifier}' 처럼 AFDS 루트 barrel 을 import 한다. ` +
                `컴포지션은 서브패스만 써야 한다(예: '@turbo-project/afds/lib/utils') — ` +
                `루트와 서브패스를 섞으면 Module Federation 에서 AFDS 인스턴스가 갈라진다.`,
            )
            continue
          }

          if (specifier.startsWith(`${AFDS_PACKAGE}/`)) {
            coverage.afdsSubpathRefs += 1
            const sub = `./${specifier.slice(AFDS_PACKAGE.length + 1)}`
            if (!isDeclaredSubpath(afds.exportKeys, sub)) {
              errors.push(
                `${name} (${rel}): '${specifier}' 가 AFDS exports 에 없는 서브패스를 가리킨다 ` +
                  `('${sub}' 미선언). 이대로 배포하면 소비처에서 해소되지 않는다 ` +
                  `(packages/afds/package.json 의 exports 에 추가하거나 선언된 경로를 쓸 것).`,
              )
            }
            continue
          }

          // 절대경로는 소비처에 존재할 수 없다. 같은 의미의 상대경로는 아래에서 "AFDS 소스
          // 트리 밖" 으로 하드 오류인데, 절대경로만 조용히 통과하던 비대칭을 없앤다.
          if (specifier.startsWith('/')) {
            coverage.externalRefs += 1
            errors.push(
              `${name} (${rel}): '${specifier}' 는 절대경로다. 소비처에 존재할 수 없는 경로다.`,
            )
            continue
          }

          coverage.externalRefs += 1
          continue
        }
        coverage.relativeSpecifiers += 1

        const target = resolve(dirname(file), specifier)
        const location = classifyTarget(target, {
          compositionDir: dirPath,
          compositionsDir,
          afdsSrcDir,
        })

        if (location.kind === 'internal') {
          coverage.internalPaths += 1
          continue // 컴포지션과 함께 배포되므로 그대로 동작한다
        }

        if (location.kind === 'sibling') {
          coverage.siblingRefs += 1
          if (!validCompositionDirs.has(location.name)) {
            errors.push(
              `${name} (${rel}): '${specifier}' 가 컴포지션이 아닌 ` +
                `'compositions/${location.name}' 을 가리킨다. add 는 컴포지션 디렉터리만 ` +
                `내려받으므로 이 경로는 소비처에 존재하지 않는다.`,
            )
            continue
          }
          siblings.add(location.name)
          continue
        }

        if (location.kind === 'afds') {
          coverage.afdsRefs += 1
          const rule = findAfdsImportRule(specifier)
          if (!rule) {
            errors.push(
              `${name} (${rel}): AFDS 내부 import '${specifier}' 를 치환할 transform 규칙이 없다. ` +
                `이대로 배포하면 소비처에 상대경로가 그대로 남아 컴파일되지 않는다 ` +
                `(src/lib/transform.ts 의 AFDS_IMPORT_RULES 에 추가할 것).`,
            )
            continue
          }
          usedSubpaths.add(rule.subpath)
          continue
        }

        coverage.outsideRefs += 1
        errors.push(
          `${name} (${rel}): '${specifier}' 가 AFDS 소스 트리 밖(${target})을 가리킨다. ` +
            `소비처에 존재할 수 없는 경로다.`,
        )
      }

      // ── 심볼 단위 검증: 배럴로 접힌 뒤에도 이름이 살아남는가 ─────────────────
      for (const { specifier, names } of extractImportBindings(content)) {
        if (names.length === 0) continue

        // 도달 경로가 둘이므로 심볼 검사도 둘 다 받아야 한다. 예전에는 상대 import 만
        // 검사해서, **같은 모듈·같은 심볼인데 표기법만 bare 로 바꾸면 검증이 사라졌다** —
        // `../../bricks` 는 배럴 표면 대조에 걸리는데 `@turbo-project/afds/bricks` 는 통과했다.
        // transform 이 전자를 후자로 치환하므로 최종 대상 모듈이 문자 그대로 같은데도 그랬다.
        let subpath: string | null = null
        if (specifier === AFDS_PACKAGE) {
          subpath = '.'
        } else if (specifier.startsWith(`${AFDS_PACKAGE}/`)) {
          subpath = specifier.slice(AFDS_PACKAGE.length + 1)
          // exports 에 없는 서브패스는 위 분류에서 이미 오류다 — 여기서 또 보고하지 않는다.
          if (!isDeclaredSubpath(afds.exportKeys, `./${subpath}`)) continue
        } else if (specifier.startsWith('.')) {
          const bindingTarget = resolve(dirname(file), specifier)
          const bindingLocation = classifyTarget(bindingTarget, {
            compositionDir: dirPath,
            compositionsDir,
            afdsSrcDir,
          })
          if (bindingLocation.kind !== 'afds') continue
          const rule = findAfdsImportRule(specifier)
          if (!rule) continue // 위에서 이미 오류로 보고했다
          subpath = rule.subpath
        } else {
          continue // 외부 패키지 — 표면을 알 방법이 없다
        }

        // 여기 도달했다는 것은 AFDS 를 가리키는 named binding 이라는 뜻이다.
        // 아래 세 갈래(대조 / 비-배럴 / 표면 못 읽음) 중 정확히 하나로 떨어져야 한다.
        coverage.afdsBindingSites += 1

        /** 사람이 읽는 이름. 루트는 서브패스를 붙이지 않는다. */
        const shown = subpath === '.' ? AFDS_PACKAGE : `${AFDS_PACKAGE}/${subpath}`

        // CSS·JSON 서브패스는 심볼 표면이라는 개념이 없다 — 오류가 아니라 미검사로 드러낸다.
        // 다만 `source` 가 아예 없는 경우(unknown)는 **검증 불가**이므로 아래 오류 경로로 보낸다.
        if (classifySubpath(afdsDir, subpath) === 'non-barrel') {
          coverage.symbolSkippedNonBarrel += 1
          if (!coverage.nonBarrelSubpaths.includes(subpath)) {
            coverage.nonBarrelSubpaths.push(subpath)
          }
          continue
        }

        const surface = getBarrelSurface(afdsDir, subpath)
        if (!surface) {
          coverage.symbolSkippedUnresolved += 1
          // 검증 불가를 조용히 넘기지 않는다 — "위반 0건" 이 "보지 않았다" 가 되면 안 된다.
          if (!coverage.barrelsUnresolved.includes(subpath)) {
            coverage.barrelsUnresolved.push(subpath)
            errors.push(
              `'${shown}' 배럴의 export 표면을 읽을 수 없어 심볼을 ` +
                `검증할 수 없다. AFDS package.json 의 exports 를 확인해라.`,
            )
          }
          continue
        }
        if (!coverage.barrelsResolved.includes(subpath)) {
          coverage.barrelsResolved.push(subpath)
        }

        coverage.symbolCheckedSites += 1
        coverage.symbolsChecked += names.length

        for (const symbol of names) {
          if (surface.names.has(symbol)) continue
          errors.push(
            `${name} (${rel}): '${specifier}' 의 '${symbol}' 은 ` +
              `'${shown}' 배럴 표면에 없다. 소비처에서 ` +
              `TS2305 (has no exported member) 가 난다. ` +
              `${relative(afdsDir, surface.entry)} 에서 원본까지의 재수출 체인 중 어딘가가 ` +
              `이 이름을 빼고 있다 (\`export *\` 가 아닌 명시적 named 재수출을 찾아라).`,
          )
        }
      }
    }

    const indexContent = readFileSync(join(dirPath, 'index.ts'), 'utf-8')
    const override = parseDependencyOverride(indexContent)
    const derived = buildDependencies(specifiers, afds.ranges)

    if (derived.missingRanges.length > 0 && !override) {
      errors.push(
        `${name}: 다음 패키지의 버전 범위를 찾을 수 없다 — ${derived.missingRanges.join(', ')}. ` +
          `packages/afds/package.json 의 dependencies 또는 peerDependencies 에 선언할 것. ` +
          `('// afds-registry Dependencies: ...' override 는 탈출구가 아니다 — 아래 실존 검사가 ` +
          `AFDS 에 없는 패키지를 같은 이유로 막으므로, override 를 적으면 오류만 바뀐다.)`,
      )
    }

    // ── override 로 선언한 패키지가 실재하는가 ──────────────────────────────
    // override 는 도출 결과를 **덮어쓴다**(폴백이 아니다). 그래서 여기 적힌 이름은 아무도
    // 검증하지 않은 채 `registry.json` 에 그대로 실린다 — 실측으로 확인했다: 배포된 적
    // 없는 이름을 **실제 의존성과 함께** 적으면 전 게이트가 통과한다(bogus 만 적으면
    // 컴파일·다른 테스트가 잡지만, 실제 것을 유지한 채 **추가**하면 아무도 못 본다).
    // 소비처에서는 `shadcn add` 가 그 패키지에서 404 를 받아 **반쯤 설치된 상태**를 남긴다.
    //
    // AFDS 가 선언한 범위를 정본으로 삼는다 — 컴포지션은 AFDS 가 선언한 것 위에서 컴파일되고,
    // 그 목록이 소비처에 지시할 수 있는 유일한 근거다. (공개 레지스트리 조회는 하지 않는다 —
    // 네트워크에 의존하면 오프라인에서 판정이 흔들린다.)
    if (override) {
      for (const entry of override) {
        const pkg = dependencyName(entry)
        if (pkg === AFDS_PACKAGE) continue // 컴포지션의 기반 패키지 자신
        if (ASSUMED_PRESENT.has(pkg)) continue // 소비처에 이미 있다고 전제하는 것
        if (afds.ranges[pkg] !== undefined) continue
        errors.push(
          `${name}: override 가 선언한 '${entry}' 의 패키지 '${pkg}' 가 AFDS 의 ` +
            `dependencies·peerDependencies 에 없다. 실재하지 않는 패키지를 적으면 소비처의 ` +
            `설치가 404 로 반쯤 끝난다 — packages/afds/package.json 에 선언하거나 override 에서 빼라.`,
        )
      }
    }

    const dependencies = override ?? derived.dependencies

    // ── 스펙 문서: 에이전트가 읽는 정본이므로 반드시 하나 이상 있어야 한다 ────────
    const specFiles = files.distributable.filter(isSpecDoc).sort()
    if (specFiles.length === 0) {
      errors.push(
        `${name}: '*.spec.md' 가 없다. 컴포지션의 계약 문서는 소비처와 에이전트에게 ` +
          `배포되는 정본이므로 필수다.`,
      )
    }

    // ── 한 줄 설명: spec 문서에서 기계 도출한다 ─────────────────────────────
    // 레지스트리에 설명이 없어서 에이전트가 이름만으로 컴포지션을 구분할 수 없었다.
    // 손으로 다시 쓰지 않는다 — 두 곳이 어긋나면 문서가 거짓이 된다(#101 과 같은 원칙).
    // **없으면 막는다.** 새 컴포지션이 인용 블록 없이 들어오면 그 자리에서 드러나야 한다.
    let description = ''
    // 정본이 없으면(spec 0개·복수 spec 모호·resolveSpecCategories 오류) 이미 위에서 오류가 보고됐다 — 타입만 만족시킨다.
    let categories: string[] = []
    if (specFiles.length > 0) {
      const canonical = pickCanonicalSpec(specFiles, dir.name)
      if (!canonical) {
        errors.push(
          `${name}: spec 이 ${specFiles.length}개인데 '${dir.name}.spec.md' 가 없어 정본을 ` +
            `고를 수 없다 (${specFiles.join(', ')}). 컴포지션 이름과 같은 spec 을 두거나 ` +
            `하나로 합쳐라 — 임의로 고르면 어느 설명이 실렸는지 알 수 없다.`,
        )
      } else {
        const canonicalContent = readFileSync(join(dirPath, canonical), 'utf-8')
        const extracted = extractSpecDescription(canonicalContent)
        if (!extracted) {
          errors.push(
            `${name} (${canonical}): 첫 헤딩 다음에 한 줄 설명(\`> …\`)이 없다. ` +
              `레지스트리의 description 을 여기서 도출하므로 필수다 — 없으면 에이전트가 ` +
              `이름만 보고 이 컴포지션이 무엇인지 알 수 없다.`,
          )
        } else {
          description = extracted
        }

        const resolved = resolveSpecCategories(canonicalContent, taxonomy)
        if ('error' in resolved) {
          errors.push(`${name} (${canonical}): ${resolved.error}`)
        } else {
          categories = resolved.categories
        }
      }
    }

    const compositionDepsOverride = parseCompositionDepsOverride(indexContent)
    const compositionDeps = compositionDepsOverride ?? [...siblings].sort().map(toPascalCase)

    log.push(`  • ${name}`)
    log.push(`      dependencies   : ${dependencies.join(', ')}`)
    if (compositionDeps.length > 0) {
      log.push(`      compositionDeps: ${compositionDeps.join(', ')}`)
    }
    log.push(`      specFiles      : ${specFiles.join(', ')}`)
    log.push(`      description    : ${description || '(없음)'}`)

    components.push({
      name,
      description,
      categories,
      dirName: dir.name,
      dependencies,
      ...(compositionDeps.length > 0 && { compositionDeps }),
      meta: {
        // 레지스트리를 **생성한 시점**의 AFDS 버전이다. 컴포지션이 작성된 버전이 아니다.
        registryAfdsVersion: afds.version,
        specFiles,
      },
    })
  }

  // ── 도달 가능한 transform 규칙의 치환 대상이 AFDS exports 에 실제로 있는지 ────
  for (const rule of AFDS_IMPORT_RULES) {
    if (!usedSubpaths.has(rule.subpath)) continue
    if (!afds.exportKeys.has(`./${rule.subpath}`)) {
      errors.push(
        `transform 규칙의 치환 대상 '@turbo-project/afds/${rule.subpath}' 가 ` +
          `packages/afds/package.json 의 exports 에 없다. 소비처에서 모듈을 해소할 수 없다.`,
      )
    }
  }

  coverage.barrelsResolved.sort()
  coverage.barrelsUnresolved.sort()
  coverage.nonBarrelSubpaths.sort()

  // ── 수치 사이의 **관계**를 단정한다 ──────────────────────────────────────
  // 나란히 찍는 것만으로는 부족하다. 실제로 이런 일이 있었다: 분류가 "AFDS 서브패스 1" 로
  // 늘었다고 말하는데 심볼 대조 사이트는 71 → 70 으로 **줄었다.** 두 수치를 같은 블록에
  // 출력하고 있었는데도 아무도 못 봤다 — 등식이 없었기 때문이다.
  //
  // AFDS 를 가리키는 named binding 은 정확히 세 갈래 중 하나로 떨어져야 한다:
  // 대조했거나 · 비-배럴이라 대조 대상이 아니거나 · 표면을 못 읽어 검증 불가이거나.
  // 어긋나면 그건 코드가 아니라 **가드 자신의 결함**이므로 그렇게 말한다.
  const accounted =
    coverage.symbolCheckedSites + coverage.symbolSkippedNonBarrel + coverage.symbolSkippedUnresolved
  if (accounted !== coverage.afdsBindingSites) {
    errors.push(
      `가드 내부 불일치: AFDS binding 사이트 ${coverage.afdsBindingSites}건 중 ` +
        `${accounted}건만 분류됐다 (대조 ${coverage.symbolCheckedSites} · ` +
        `비-배럴 ${coverage.symbolSkippedNonBarrel} · 검증불가 ${coverage.symbolSkippedUnresolved}). ` +
        `어느 갈래에도 들지 않고 빠져나간 사이트가 있다 — 코드가 아니라 가드의 결함이다.`,
    )
  }

  return {
    manifest: {
      name: 'afds-registry',
      version: '0.1.0',
      afdsVersion: afds.version,
      components,
    },
    errors,
    log,
    coverage,
    distributableFiles,
  }
}
