import { readFileSync } from 'node:fs'
import { join, sep } from 'node:path'
import { isSpecDoc } from './composition-files'
import { dependencyName } from './derive-dependencies'
import { transformImports } from './transform'
import type { Component, Registry } from '../types'

/**
 * 내부 매니페스트(`build-registry.ts` 의 수집 결과)를 shadcn 규격 `registry.json` 으로 옮긴다.
 *
 * **왜 파일 내용을 인라인하지 않는가.** shadcn 의 GitHub 소스 스킴은 `registry.json` 을
 * 저장소에서 읽고 `files[].path` 를 **저장소 경로 그대로** 읽는다. 내용을 박아 두면
 * 소스와 산출물이 갈라진다 — 이 저장소에서 파생 산출물 고착으로 실제 사고가 있었다.
 *
 * 대신 **전제를 검사한다**: 표준 CLI 는 저장소 파일을 그대로 복사할 뿐 치환 단계가 없다
 * (철거된 자체 CLI 가 설치 시 `transformImports` 로 하던 일이다). 치환이 필요한 파일이
 * 하나라도 있으면 저장소 원본을 그대로 내려보낼 수 없으므로 **막는다**.
 *
 * **왜 `registryDependencies` 를 쓰지 않고 형제 파일을 함께 싣는가.** 실측 결과 형제를
 * 가리키는 방법이 둘뿐인데 양쪽 다 ref 고정을 깬다:
 *
 * - bare 이름(`base-input`)은 **언제나 기본 shadcn 레지스트리**로 해석된다 — 부모가
 *   어디서 왔든 상관없다(실측: `https://ui.shadcn.com/r/styles/…/base-input.json` 404).
 * - GitHub 주소(`FlaSh2493/turbo-project/base-input`)는 ref 를 붙이지 않으면 `ref ?? 'HEAD'`
 *   로 **기본 브랜치**를 본다. 즉 부모를 태그로 고정해 받아도 형제는 늘 HEAD 에서 온다.
 *
 * GitHub 소스 스킴을 고른 결정적 이유가 **ref → 커밋 SHA 고정**이었으므로, 그 고정을
 * 형제에 대해서만 조용히 무력화하는 형태를 택할 수 없다. 형제 파일을 부모 아이템에 함께
 * 실으면 전부 부모와 **같은 커밋**에서 온다. `target` 이 같아 디스크에 중복도 생기지 않는다.
 *
 * 의존 관계 자체는 버리지 않고 `meta.compositionDeps` 에 남긴다 — 해소 방식만 바꾼 것이지
 * 데이터를 잃은 것이 아니다.
 */

/**
 * 산출물의 고정 값. **생성 스크립트와 정합 테스트가 같은 상수를 읽어야 한다** —
 * 테스트가 값을 복제하면 복제본끼리만 일치하고 실제 산출물은 틀릴 수 있다.
 */
export const SHADCN_REGISTRY_CONFIG = {
  /**
   * 레지스트리 이름. npm 패키지 이름(`@turbo-project/afds-registry`)과 별개다 —
   * 이쪽은 소비처가 이름공간으로 읽는 이름이다.
   */
  name: 'afds-registry',
  homepage: 'https://github.com/FlaSh2493/turbo-project',
  /** 저장소 루트 기준 컴포지션 부모 디렉터리. */
  compositionsPathFromRepoRoot: 'packages/afds-registry/src/compositions',
} as const

/** shadcn registry-item 의 `files[]` 항목. `content` 없이 경로만 준다(위 주석 참조). */
export interface ShadcnRegistryFile {
  /** 저장소 루트 기준 경로. */
  path: string
  type: 'registry:ui' | 'registry:file'
  /** 소비처 설치 경로. `@ui` 는 소비처 `components.json` 의 ui 별칭으로 해소된다. */
  target: string
}

export interface ShadcnRegistryItem {
  name: string
  type: 'registry:ui'
  title: string
  description: string
  /** 설치 직후 소비자 터미널에 출력되는 안내. `add` 가 이 필드만 출력한다. */
  docs: string
  dependencies?: string[]
  categories?: string[]
  /** 자기 파일 + 전이적으로 도달하는 형제 컴포지션의 파일. */
  files: ShadcnRegistryFile[]
  meta: Record<string, unknown>
}

export interface ShadcnRegistry {
  $schema: string
  name: string
  homepage: string
  items: ShadcnRegistryItem[]
}

export interface BuildShadcnRegistryOptions {
  /** `buildRegistry` 가 만든 자체 매니페스트. */
  manifest: Registry
  /** `buildRegistry` 가 돌려준 컴포지션별 배포 파일 목록. */
  distributableFiles: Record<string, string[]>
  /** 컴포지션 부모 디렉터리의 **절대경로** — 전제 검사에서 파일을 읽는다. */
  compositionsDir: string
  /** 같은 디렉터리의 **저장소 루트 기준** 경로 (예: `packages/afds-registry/src/compositions`). */
  compositionsPathFromRepoRoot: string
  /** 레지스트리 이름. */
  name: string
  /** 규격 필수 필드. `shadcn build` 가 없으면 막는다. */
  homepage: string
}

export interface BuildShadcnRegistryResult {
  registry: ShadcnRegistry
  /** 비어 있지 않으면 산출물을 쓰면 안 된다. */
  errors: string[]
}

/**
 * 설치 시 안내 문구. **`add` 가 실제로 출력하는 유일한 아이템 텍스트다** — 실측으로
 * 확인했다: `description`·`title` 은 출력되지 않고, `docs` 만 파일 목록 직후에 찍힌다
 * (`n.docs && E.info(n.docs)`). `shadcn docs <item>` 은 공식 레지스트리 전용이라 못 쓴다.
 *
 * **값은 기계 도출이다.** 손으로 적으면 `registryAfdsVersion` 이 겪은 결함(23개 전부 백필
 * `0.7.1`, 이름이 약속한 것과 값이 다름)을 재생산한다. 생성 시점의 워크스페이스 afds 버전을
 * 그대로 쓴다 — 재생성마다 따라오므로 고착되지 않는다.
 *
 * **의미를 부풀리지 않는다.** 이 값은 "최소 요구 버전" 이 아니라 "이 버전으로 생성·검증됐다"
 * 이다. 어느 버전부터 실제로 동작하는지는 측정하지 않았다.
 *
 * 버전 정보 외의 것을 얹지 않는다 — 과적하면 아무도 읽지 않는다.
 */
function buildDocs(afdsVersion: string): string {
  return (
    `@turbo-project/afds ${afdsVersion} 기준으로 생성·검증됐습니다(최소 요구 버전이 아닙니다 — ` +
    `어느 버전부터 동작하는지는 측정하지 않았습니다). 설치된 afds 가 이보다 낮으면 설치는 ` +
    `성공해도 이후 tsc 가 TS2307 로 깨질 수 있습니다 — 그때는 afds 를 올리세요.`
  )
}

/** OS 구분자를 POSIX 로. JSON 산출물의 경로는 플랫폼에 따라 달라지면 안 된다. */
function toPosix(relPath: string): string {
  return relPath.split(sep).join('/')
}

export function buildShadcnRegistry({
  manifest,
  distributableFiles,
  compositionsDir,
  compositionsPathFromRepoRoot,
  name,
  homepage,
}: BuildShadcnRegistryOptions): BuildShadcnRegistryResult {
  const errors: string[] = []

  // 컴포지션 간 의존성은 자체 매니페스트에서 PascalCase 로 적혀 있다. 규격 산출물의
  // 아이템 이름은 kebab(디렉터리명)이므로 **이름표를 바꾼다** — 대응이 안 되면 막는다.
  // 조용히 떨어뜨리면 소비처가 형제 컴포지션 없이 설치돼 컴파일이 깨진다.
  const dirNameByPascal = new Map<string, string>()
  const componentByDirName = new Map<string, Component>()
  for (const component of manifest.components) {
    if (!component.dirName) continue
    dirNameByPascal.set(component.name, component.dirName)
    componentByDirName.set(component.dirName, component)
  }

  /** 컴포지션 → 직접 의존하는 형제(kebab). 이름표를 못 바꾸면 오류를 남기고 뺀다. */
  const directDeps = new Map<string, string[]>()
  for (const component of manifest.components) {
    if (!component.dirName) continue
    const deps: string[] = []
    for (const dep of component.compositionDeps ?? []) {
      const depDir = dirNameByPascal.get(dep)
      if (!depDir) {
        errors.push(
          `${component.dirName}: compositionDeps 의 '${dep}' 에 대응하는 컴포지션이 ` +
            `매니페스트에 없다. 형제 파일을 함께 실을 수 없다.`,
        )
        continue
      }
      deps.push(depDir)
    }
    directDeps.set(component.dirName, deps)
  }

  /**
   * 전이적으로 도달하는 형제 전부. `overflow-tooltip → base-tooltip` 처럼 2단이 있으므로
   * 직접 의존만 실으면 손자가 빠진다. 방문 집합으로 순환도 그대로 처리한다(합집합이므로
   * 순환이어도 결과가 잘 정의된다).
   */
  const resolveDeps = (root: string): string[] => {
    const seen = new Set<string>()
    const stack = [...(directDeps.get(root) ?? [])]
    while (stack.length > 0) {
      const next = stack.pop() as string
      if (next === root || seen.has(next)) continue
      seen.add(next)
      stack.push(...(directDeps.get(next) ?? []))
    }
    return [...seen].sort()
  }

  // 안내 문구의 버전은 매니페스트에서 온다. 없으면 문구가 거짓이 되므로 막는다.
  if (!manifest.afdsVersion) {
    errors.push('manifest.afdsVersion 이 없다 — 설치 안내(docs)의 버전을 도출할 수 없다.')
  }
  const docs = buildDocs(manifest.afdsVersion ?? 'unknown')

  const items: ShadcnRegistryItem[] = []

  for (const component of manifest.components) {
    const dirName = component.dirName
    if (!dirName) {
      errors.push(`${component.name}: dirName 이 없어 규격 아이템 이름을 정할 수 없다.`)
      continue
    }

    const relPaths = distributableFiles[dirName]
    if (!relPaths || relPaths.length === 0) {
      // 파일이 0개인 아이템은 설치해도 아무것도 안 생긴다 — 통과시키면 소비처에서
      // "받았는데 없다" 가 된다.
      errors.push(`${dirName}: 배포 대상 파일이 0개다. 규격 아이템의 files[] 가 빈다.`)
      continue
    }

    // 자기 파일 먼저, 그다음 전이적 형제. 형제가 없는 아이템의 files[] 는 이전과 같다.
    const transitiveDeps = resolveDeps(dirName)
    const files: ShadcnRegistryFile[] = []
    for (const owner of [dirName, ...transitiveDeps]) {
      const ownerFiles = distributableFiles[owner]
      if (!ownerFiles || ownerFiles.length === 0) {
        errors.push(`${dirName}: 형제 '${owner}' 의 배포 대상 파일이 0개다. 함께 실을 수 없다.`)
        continue
      }
      for (const relPath of ownerFiles) {
        const posixRel = toPosix(relPath)

        // 전제 검사 — 표준 CLI 는 transform 단계가 없다. 저장소 원본이 그대로 소비처로
        // 간다는 전제가 깨지면 여기서 멈춘다.
        const content = readFileSync(join(compositionsDir, owner, relPath), 'utf-8')
        if (transformImports(content) !== content) {
          errors.push(
            `${owner}/${posixRel}: AFDS 내부 상대 import 가 있어 설치 시 치환이 필요하다. ` +
              `표준 CLI 에는 치환 단계가 없으므로 저장소 원본을 그대로 내려보낼 수 없다 — ` +
              `'@turbo-project/afds/<서브패스>' bare import 로 바꿔라.`,
          )
        }

        files.push({
          path: `${compositionsPathFromRepoRoot}/${owner}/${posixRel}`,
          // 스펙 문서는 코드가 아니다. `registry:file` 로 두면 shadcn 의 코드 변환기를
          // 거치지 않고 그대로 복사된다.
          type: isSpecDoc(relPath) ? 'registry:file' : 'registry:ui',
          // **형제도 자기 디렉터리 이름으로 간다.** 소스의 `../base-input` 상대 import 가
          // 소비처에서 그대로 해소되려면 형제가 형제 자리에 있어야 한다.
          target: `@ui/${owner}/${posixRel}`,
        })
      }
    }

    // **형제 파일을 실었으면 형제의 npm 의존성도 실어야 한다.** 자체 매니페스트의
    // `dependencies` 는 그 컴포지션이 스캔한 import 에서만 도출되므로 형제 것이 빠져 있다.
    // 예전에는 shadcn 이 형제 아이템을 따로 설치하며 그쪽 dependencies 를 처리했다 —
    // 인라인으로 바꾸면 그 경로가 사라지므로 여기서 합집합을 만든다. 빠뜨리면 소비처에서
    // `TS2307` · `ERR_MODULE_NOT_FOUND` 가 난다(pnpm 은 호이스팅하지 않아 그쪽에서 먼저 드러난다).
    const dependencySpecs = new Map<string, string>()
    for (const owner of [dirName, ...transitiveDeps]) {
      const ownerComponent = componentByDirName.get(owner)
      for (const spec of ownerComponent?.dependencies ?? []) {
        const pkg = dependencyName(spec)
        const existing = dependencySpecs.get(pkg)
        if (existing !== undefined && existing !== spec) {
          // 같은 패키지에 서로 다른 범위가 붙으면 어느 쪽을 실을지 우리가 정할 수 없다.
          // 임의로 고르면 소비처가 받는 범위가 조용히 달라진다.
          errors.push(
            `${dirName}: 형제와 합칠 때 '${pkg}' 의 버전 범위가 어긋난다 ` +
              `('${existing}' vs '${spec}'). 한쪽으로 맞춰라.`,
          )
          continue
        }
        dependencySpecs.set(pkg, spec)
      }
    }
    const dependencies = [...dependencySpecs.values()].sort()

    items.push({
      name: dirName,
      type: 'registry:ui',
      // 사람이 읽는 이름. PascalCase 는 소비처 코드의 심볼 이름과 같으므로 버리지 않는다.
      title: component.name,
      description: component.description,
      docs,
      ...(dependencies.length > 0 && { dependencies }),
      ...(component.categories.length > 0 && { categories: component.categories }),
      files,
      // 규격에 없는 우리 고유 필드는 전부 자유 형식 `meta` 로 민다. **표준 CLI 는 읽지
      // 않는다** — 승인 게이트의 강제는 CI 가 한다.
      meta: {
        pascalName: component.name,
        dirName,
        // 의존 관계는 **버리지 않는다.** 해소 방식을 registryDependencies 에서 파일 인라인으로
        // 바꿨을 뿐이다 — 관계를 잃으면 문서·승인 게이트가 근거를 잃는다.
        // `compositionDeps` 는 직접 의존, `bundledCompositions` 는 실제로 실린 전이 목록이다.
        ...(directDeps.get(dirName)?.length ? { compositionDeps: directDeps.get(dirName) } : {}),
        ...(transitiveDeps.length > 0 && { bundledCompositions: transitiveDeps }),
        ...(component.meta && {
          registryAfdsVersion: component.meta.registryAfdsVersion,
          specFiles: component.meta.specFiles,
        }),
      },
    })
  }

  return {
    registry: {
      $schema: 'https://ui.shadcn.com/schema/registry.json',
      name,
      homepage,
      items,
    },
    errors,
  }
}
