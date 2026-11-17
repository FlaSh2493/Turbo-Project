import { readFileSync } from 'node:fs'

export interface Taxonomy {
  domains: string[]
  categories: string[]
}

const KEBAB_CASE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/

/** kebab-case slug → 표시용 이름 (`data-display` → `Data Display`). */
export function displayName(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function validateTaxonomy(t: Taxonomy): string[] {
  const errors: string[] = []
  const seen = new Map<string, string>()
  for (const [list, entries] of [
    ['domains', t.domains],
    ['categories', t.categories],
  ] as const) {
    for (const slug of entries) {
      if (!KEBAB_CASE.test(slug)) errors.push(`${list}: '${slug}' 는 kebab-case 가 아니다`)
      const prev = seen.get(slug)
      // registry 배열 [domain, category] 에서 둘을 구별할 수 없게 된다.
      if (prev) errors.push(`slug '${slug}' 가 ${prev} 와 ${list} 에 중복된다`)
      seen.set(slug, list)
    }
  }
  return errors
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every(entry => typeof entry === 'string')
}

export function loadTaxonomy(path: string): Taxonomy {
  const parsed = JSON.parse(readFileSync(path, 'utf-8')) as Record<string, unknown>
  for (const field of ['domains', 'categories'] as const) {
    if (!isStringArray(parsed[field])) {
      throw new Error(`${path}: '${field}' 는 문자열 배열이어야 한다`)
    }
  }
  const t = parsed as unknown as Taxonomy
  const errors = validateTaxonomy(t)
  if (errors.length > 0) throw new Error(`${path}: ${errors.join(' · ')}`)
  return t
}

export function parseSpecFrontmatter(
  content: string,
): { data: Record<string, string> } | { error: string } | null {
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  if (lines[0] !== '---') return null
  const end = lines.indexOf('---', 1)
  if (end === -1) return { error: 'frontmatter 를 닫는 `---` 가 없다' }
  const data: Record<string, string> = {}
  for (const line of lines.slice(1, end)) {
    if (line.trim() === '') continue
    const m = /^([a-z][a-z0-9-]*):\s*(\S.*?)\s*$/.exec(line)
    if (!m) return { error: `frontmatter 줄이 \`key: value\` 가 아니다: '${line}'` }
    const [, key, value] = m
    if (key in data) return { error: `frontmatter key '${key}' 가 중복된다` }
    data[key] = value
  }
  return { data }
}

export function resolveSpecCategories(
  content: string,
  taxonomy: Taxonomy,
): { categories: string[] } | { error: string } {
  const fm = parseSpecFrontmatter(content)
  if (fm === null) return { error: 'frontmatter(`domain`·`category`)가 없다 — 둘 다 필수다' }
  if ('error' in fm) return fm
  const { domain, category } = fm.data
  if (!domain || !category) return { error: '`domain`·`category` 는 둘 다 필수다' }
  for (const [key, value, entries] of [
    ['domain', domain, taxonomy.domains],
    ['category', category, taxonomy.categories],
  ] as const) {
    if (!entries.includes(value)) {
      return {
        error:
          `${key} '${value}' 는 선언되지 않았다 (${entries.join(', ')}) — ` +
          `오타가 아니라 새 분류라면 packages/afds-registry/taxonomy.json 에 한 줄 추가하라`,
      }
    }
  }
  return { categories: [domain, category] }
}
