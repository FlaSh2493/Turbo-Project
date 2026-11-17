import { beforeAll, describe, expect, it } from 'vitest'
import { join } from 'node:path'
import { extractSpecDescription, pickCanonicalSpec } from '../lib/spec-summary'
import { buildRegistry } from '../lib/build-registry'
import { loadTaxonomy } from '../lib/taxonomy'
import shadcnRegistryJson from '../../../../registry.json' with { type: 'json' }

const AFDS = join(__dirname, '../../../afds')
const AFDS_REGISTRY_COMPOSITIONS_DIR = join(__dirname, '../compositions')

describe('spec 에서 한 줄 설명 도출', () => {
  it('첫 헤딩 다음의 인용 블록을 뽑는다', () => {
    expect(
      extractSpecDescription('# AlertModal\n\n> 단일 확인 버튼만 가진 모달.\n\n## Rules\n'),
    ).toBe('단일 확인 버튼만 가진 모달.')
  })

  // 섹션 안의 인용은 설명이 아니다 — 규칙 본문에 인용이 있을 수 있다.
  it('첫 섹션(`##`) 이후의 인용은 무시한다', () => {
    expect(extractSpecDescription('# A\n\n## Rules\n\n> 이건 규칙 안 인용이다\n')).toBeNull()
  })

  it('인용이 없으면 null', () => {
    expect(extractSpecDescription('# A\n\n본문만 있다.\n')).toBeNull()
  })

  // ── 아래 3종은 독립 리뷰가 만든 **생존 입력**이다 ─────────────────────────
  // 예전 파서는 "첫 `##` 이전의 `^> ` 아무 줄" 을 채택해서, 비어 있는 것만 막고
  // **틀린 값은 통과시켰다.** 배포되는 레지스트리 설명에 들어가던 값들이다.
  it('HTML 주석 안의 인용을 설명으로 채택하지 않는다', () => {
    expect(
      extractSpecDescription('# AlertModal\n\n<!--\n> hidden comment only\n-->\n\n## Rules\n'),
    ).toBeNull()
  })

  it('경고 블록이 먼저 오면 모호하므로 고르지 않는다', () => {
    expect(
      extractSpecDescription('# A\n\n> ⚠️ 내부 구현 경고.\n\n> 실제 설명.\n\n## Rules\n'),
    ).toBeNull()
  })

  it('인용 문단이 둘 이상이면 고르지 않는다', () => {
    expect(extractSpecDescription('# A\n\n> 첫째.\n\n> 둘째.\n\n## Rules\n')).toBeNull()
  })

  it('H1 다음 첫 내용이 산문이면 뒤의 인용을 채택하지 않는다', () => {
    expect(extractSpecDescription('# A\n\n설명 아님.\n\n> 인용.\n\n## Rules\n')).toBeNull()
  })

  it('H1 이 없으면 null', () => {
    expect(extractSpecDescription('> 인용만 있다.\n')).toBeNull()
  })

  it('여러 줄 인용은 한 문단으로 합친다', () => {
    expect(extractSpecDescription('# A\n\n> 앞줄\n> 뒷줄\n\n## Rules\n')).toBe('앞줄 뒷줄')
  })

  it('CRLF 도 정상 처리한다', () => {
    expect(extractSpecDescription('# A\r\n\r\n> 정상.\r\n\r\n## Rules\r\n')).toBe('정상.')
  })

  it('정본 spec 은 이름 일치로 고른다', () => {
    expect(
      pickCanonicalSpec(
        ['base-check-box-group.spec.md', 'base-check-box.spec.md'],
        'base-check-box',
      ),
    ).toBe('base-check-box.spec.md')
  })

  it('spec 이 하나면 이름이 달라도 그것을 쓴다', () => {
    expect(pickCanonicalSpec(['whatever.spec.md'], 'demo')).toBe('whatever.spec.md')
  })

  // 임의로 하나를 집으면 어느 설명이 실렸는지 알 수 없다 — 고르지 않는 것이 맞다.
  it('이름이 일치하지 않고 여럿이면 고르지 않는다', () => {
    expect(pickCanonicalSpec(['a.spec.md', 'b.spec.md'], 'demo')).toBeNull()
  })
})

describe('레지스트리 description — 23개 전부 채워져 있어야 한다', () => {
  /**
   * 실제 AFDS 트리에서 한 번만 도출해 두고 아래 단정들이 공유한다.
   *
   * **왜 느린가.** `buildRegistry` 는 컴포지션 23개 디렉터리를 걸어 모든 파일을 읽고,
   * TypeScript 스캐너로 import 를 뽑고, 배럴 표면을 로드한다. 실측: 로컬 단독 1.9~2.0초,
   * 로컬 전체 병렬 2.09~2.14초. **CI 러너에서는 기본 5000ms 를 넘겼다**(run 33184080104) —
   * 로컬보다 최소 2.4배 느리다.
   *
   * **빠르게 하려면 무엇을 포기해야 하나.** 픽스처로 바꾸면 빨라지지만, 이 단정의 목적이
   * *"커밋된 레지스트리가 실제 트리의 도출값과 같은가"* 이므로 실제 트리를 쓰지 않으면
   * 검사가 아니라 자기 자신과의 비교가 된다. **느린 것이 이 검사의 비용이지 결함이 아니다.**
   *
   * 다만 결함이 하나 있었고 고쳤다 — 같은 파일에서 `buildRegistry` 를 **두 번** 불렀다.
   * `beforeAll` 로 한 번만 부르게 해서 비용을 절반으로 줄였다. 남은 비용에는 측정에 근거한
   * 명시 타임아웃을 준다(로컬 2.1초 · CI 5초 초과 관측 → 20초는 관측된 실패점의 4배).
   */
  let derived: Map<string, string>
  let errors: string[]

  beforeAll(() => {
    const result = buildRegistry({
      afdsDir: AFDS,
      compositionsDir: AFDS_REGISTRY_COMPOSITIONS_DIR,
      taxonomy: loadTaxonomy(join(__dirname, '../../taxonomy.json')),
    })
    errors = result.errors
    derived = new Map(result.manifest.components.map(c => [c.name, c.description]))
  }, 20_000)

  it('커밋된 레지스트리에 빈 description 이 없다', () => {
    const empty = shadcnRegistryJson.items.filter(i => !i.description)
    expect(empty.map(i => i.name)).toEqual([])
    expect(shadcnRegistryJson.items.length).toBeGreaterThan(20)
  })

  it('실제 트리에서 다시 도출해도 전부 채워진다', () => {
    expect(errors.filter(e => e.includes('한 줄 설명'))).toEqual([])
    expect([...derived].filter(([, d]) => !d).map(([n]) => n)).toEqual([])
  })

  // 도출값이 커밋된 값과 어긋나면 레지스트리가 낡은 것이다.
  it('도출값이 커밋된 레지스트리와 일치한다', () => {
    // 아이템 이름은 kebab(디렉터리명)이고 도출 맵의 키는 PascalCase 다 — `meta.pascalName` 으로 잇는다.
    for (const item of shadcnRegistryJson.items) {
      const pascal = (item.meta as { pascalName: string }).pascalName
      expect(derived.get(pascal), item.name).toBe(item.description)
    }
  })
})
