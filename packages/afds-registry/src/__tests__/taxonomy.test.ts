import { describe, it, expect } from 'vitest'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  displayName,
  loadTaxonomy,
  parseSpecFrontmatter,
  resolveSpecCategories,
  validateTaxonomy,
  type Taxonomy,
} from '../lib/taxonomy'
import { buildRegistry } from '../lib/build-registry'

const T: Taxonomy = {
  domains: ['common'],
  categories: ['form', 'overlay'],
}
const spec = (fm: string) => `${fm}# Demo\n\n> 설명.\n`

describe('parseSpecFrontmatter', () => {
  it('frontmatter 가 없으면 null', () => {
    expect(parseSpecFrontmatter(spec(''))).toBeNull()
  })
  it('key: value 를 읽는다', () => {
    expect(parseSpecFrontmatter(spec('---\ndomain: common\ncategory: form\n---\n\n'))).toEqual({
      data: { domain: 'common', category: 'form' },
    })
  })
  it('닫는 --- 가 없으면 오류', () => {
    expect(parseSpecFrontmatter('---\ndomain: common\n# Demo\n')).toHaveProperty('error')
  })
  it('key: value 가 아닌 줄이 있으면 오류', () => {
    expect(parseSpecFrontmatter(spec('---\ndomain common\n---\n'))).toHaveProperty('error')
  })
  it('key 가 중복되면 그 key 를 담은 오류', () => {
    const r = parseSpecFrontmatter(spec('---\ncategory: form\ncategory: overlay\n---\n'))
    expect('error' in (r ?? {}) && (r as { error: string }).error).toContain('category')
  })
})

describe('resolveSpecCategories', () => {
  it('[domain, category] 를 낸다', () => {
    expect(resolveSpecCategories(spec('---\ndomain: common\ncategory: form\n---\n\n'), T)).toEqual({
      categories: ['common', 'form'],
    })
  })
  it.each([
    ['frontmatter 없음', spec('')],
    ['domain 없음', spec('---\ncategory: form\n---\n')],
    ['category 없음', spec('---\ndomain: common\n---\n')],
    ['선언 안 된 domain', spec('---\ndomain: report\ncategory: form\n---\n')],
    ['선언 안 된 category', spec('---\ndomain: common\ncategory: forms\n---\n')],
  ])('%s → 오류', (_, content) => {
    expect(resolveSpecCategories(content, T)).toHaveProperty('error')
  })
  it('선언 안 된 값의 오류는 taxonomy.json 추가를 안내한다', () => {
    const r = resolveSpecCategories(spec('---\ndomain: common\ncategory: forms\n---\n'), T)
    expect('error' in r && r.error).toContain('taxonomy.json')
  })
})

describe('validateTaxonomy', () => {
  it('정상 목록은 오류 0', () => {
    expect(validateTaxonomy(T)).toEqual([])
  })
  it('domain 과 category 사이 slug 가 겹치면 오류', () => {
    const bad: Taxonomy = { ...T, categories: [...T.categories, 'common'] }
    expect(validateTaxonomy(bad).length).toBeGreaterThan(0)
  })
  it('한 목록 안 중복 slug 는 오류', () => {
    const bad: Taxonomy = { ...T, domains: [...T.domains, 'common'] }
    expect(validateTaxonomy(bad).length).toBeGreaterThan(0)
  })
  it('kebab-case 가 아닌 slug 는 오류', () => {
    const bad: Taxonomy = { ...T, categories: [...T.categories, 'Form'] }
    expect(validateTaxonomy(bad).length).toBeGreaterThan(0)
  })
})

describe('loadTaxonomy', () => {
  it.each([
    ['domains 가 숫자', 'domains', { domains: 123, categories: ['form'] }],
    ['categories 에 숫자 포함', 'categories', { domains: ['common'], categories: ['form', 42] }],
  ])('%s → 파일 경로와 필드명을 담은 형태 오류', (_, field, data) => {
    const dir = mkdtempSync(join(tmpdir(), 'registry-taxonomy-shape-'))
    try {
      const file = join(dir, 'taxonomy.json')
      writeFileSync(file, JSON.stringify(data))
      let message = ''
      try {
        loadTaxonomy(file)
      } catch (e) {
        message = (e as Error).message
      }
      expect(message).toContain(file)
      expect(message).toContain(`'${field}' 는 문자열 배열이어야 한다`)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

describe('displayName', () => {
  it('한 단어는 첫 글자만 대문자로', () => {
    expect(displayName('form')).toBe('Form')
  })
  it('kebab-case 는 단어별로 대문자화해 공백으로 잇는다', () => {
    expect(displayName('data-display')).toBe('Data Display')
  })
})

// build-registry.ts 가드 픽스처 — guard.test.ts 의 buildFixtureResult 패턴을 따른다.
describe('buildRegistry 가드 — frontmatter 없는 정본 spec 을 막는다', () => {
  it('컴포지션 이름과 domain 을 담은 오류를 낸다', () => {
    const root = mkdtempSync(join(tmpdir(), 'registry-taxonomy-'))
    try {
      const compDir = join(root, 'src/compositions/demo')
      mkdirSync(compDir, { recursive: true })
      writeFileSync(
        join(root, 'package.json'),
        JSON.stringify({ name: '@turbo-project/afds', version: '0.0.0' }),
      )
      writeFileSync(join(compDir, 'index.ts'), 'export const X = 1\n')
      // frontmatter 없이 인용 블록만 있다 — description 도출은 통과하고 categories 만 막혀야 한다.
      writeFileSync(join(compDir, 'demo.spec.md'), '# spec\n\n> 픽스처용 컴포지션.\n')

      const { errors } = buildRegistry({
        afdsDir: root,
        compositionsDir: join(root, 'src/compositions'),
        taxonomy: T,
      })

      expect(errors.some(e => e.includes('Demo') && e.includes('domain'))).toBe(true)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
