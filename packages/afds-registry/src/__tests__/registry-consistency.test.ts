import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildRegistry } from '../lib/build-registry'
import { buildShadcnRegistry, SHADCN_REGISTRY_CONFIG } from '../lib/build-shadcn-registry'
import { dependencyName } from '../lib/derive-dependencies'
import { loadTaxonomy } from '../lib/taxonomy'
import shadcnRegistryJson from '../../../../registry.json' with { type: 'json' }

/**
 * 커밋된 레지스트리가 컴포지션 소스와 일치하는지 검증한다.
 *
 * 이 가드가 없으면 "생성 스크립트는 고쳤는데 레지스트리를 재생성하지 않았다" 또는
 * "레지스트리를 손으로 고쳤다" 가 조용히 통과한다. 그 결과가 소비처에서 컴파일되지 않는
 * 코드로 나타난다 — 이번에 고친 결함이 정확히 그 형태였다.
 */

const AFDS_DIR = join(__dirname, '../../../afds')
const AFDS_REGISTRY_DIR = join(__dirname, '../..')
const COMPOSITIONS_DIR = join(AFDS_REGISTRY_DIR, 'src/compositions')

describe('레지스트리 ↔ 컴포지션 소스 정합', () => {
  const { manifest, errors, distributableFiles } = buildRegistry({
    afdsDir: AFDS_DIR,
    compositionsDir: COMPOSITIONS_DIR,
    taxonomy: loadTaxonomy(join(AFDS_REGISTRY_DIR, 'taxonomy.json')),
  })

  it('생성 가드가 통과한다 (미선언 의존성·spec.md 누락·규칙/심볼 누락 없음)', () => {
    // 실패 시 읽을 수 있게: 이 단정은 AFDS 배럴이 컴포지션이 쓰는 심볼을 전부 재수출하는
    // 것에 의존한다. `CalendarRootProps`·`RangeCalendarRootProps` 재수출(PR #100)이
    // 머지되기 전까지는 여기서 2건이 뜨는 것이 정상이다 — 가드가 실제 결함을 보고하는 것이다.
    expect(
      errors,
      'AFDS 배럴 재수출(PR #100)이 선행되어야 한다. 위 오류가 그 2건이면 #100 머지 대기 상태다.',
    ).toEqual([])
  })

  it('모든 컴포지션이 @turbo-project/afds 를 버전 없이 선언한다', () => {
    for (const component of manifest.components) {
      expect(component.dependencies, component.name).toContain('@turbo-project/afds')
      expect(
        component.dependencies.filter(d => d.startsWith('@turbo-project/afds@')),
        `${component.name}: AFDS 에 버전 범위를 붙이면 소비처의 AFDS 버전을 잠근다`,
      ).toEqual([])
    }
  })

  it('모든 서드파티 의존성에 버전 범위가 붙어 있다', () => {
    for (const component of manifest.components) {
      for (const entry of component.dependencies) {
        if (entry === '@turbo-project/afds') continue
        expect(entry, `${component.name}: ${entry} 에 버전 범위가 없다`).toMatch(/.@[\^~\d]/)
      }
    }
  })

  it('모든 컴포지션이 기준 AFDS 버전과 스펙 문서를 기록한다', () => {
    const afdsVersion = JSON.parse(readFileSync(join(AFDS_DIR, 'package.json'), 'utf-8')).version
    for (const component of manifest.components) {
      expect(component.meta?.registryAfdsVersion, component.name).toBe(afdsVersion)
      expect(component.meta?.specFiles.length, component.name).toBeGreaterThan(0)
    }
  })

  it('커밋된 registry.json(shadcn 규격)이 소스에서 재생성한 결과와 완전히 같다', () => {
    // `shadcn registry validate` 는 **규격 준수**만 본다 — 낡은 산출물도 규격만 맞으면
    // 통과한다. 소스와의 정합은 이 단정만이 잡는다. 두 검사는 서로를 대신하지 못한다.
    const { registry, errors: shadcnErrors } = buildShadcnRegistry({
      manifest,
      distributableFiles,
      compositionsDir: COMPOSITIONS_DIR,
      ...SHADCN_REGISTRY_CONFIG,
    })
    expect(shadcnErrors).toEqual([])
    expect(shadcnRegistryJson).toEqual(registry)
  })

  it('레지스트리가 실측된 외부 의존성을 빠뜨리지 않는다 (회귀 고정)', () => {
    // f80ea4e 기준 실측: add 직후 MODULE_NOT_FOUND 였던 두 패키지를 포함해 고정한다.
    const baseTable = manifest.components.find(c => c.name === 'BaseTable')
    expect(baseTable?.dependencies.map(dependencyName).sort()).toEqual([
      '@tanstack/react-table',
      '@turbo-project/afds',
      'lucide-react',
    ])

    const periodFilter = manifest.components.find(c => c.name === 'PeriodFilter')
    expect(periodFilter?.dependencies.map(dependencyName).sort()).toEqual([
      '@base-ui/react',
      '@internationalized/date',
      '@turbo-project/afds',
      'class-variance-authority',
    ])
  })
})
