import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, mkdtempSync, writeFileSync, rmSync, type Dirent } from 'node:fs'
import { join, relative } from 'node:path'
import { tmpdir } from 'node:os'
import { isSkippedDir } from '../lib/composition-files'
import { loadTaxonomy, type Taxonomy } from '../lib/taxonomy'
import { readMetaTitle, resolveValueExports, expectedTitlePrefix } from '../lib/story-title'

describe('readMetaTitle', () => {
  it('satisfies 래핑된 meta 의 최상위 title 을 읽는다', () => {
    const src = `const meta = {\n  title: 'Compositions / Common / Form / X',\n  args: { title: '정말?' },\n} satisfies Meta<typeof X>\nexport default meta\n`
    expect(readMetaTitle(src)).toBe('Compositions / Common / Form / X')
  })
  it('args.title 은 meta title 로 읽지 않는다', () => {
    const src = `const meta = {\n  args: { title: '정말?' },\n} satisfies Meta<typeof X>\nexport default meta\n`
    expect(readMetaTitle(src)).toBeNull()
  })
  it('default export 가 아닌 객체의 title 은 읽지 않는다', () => {
    const src = `const other = { title: 'A' }\nconst meta = { title: 'B' }\nexport default meta\n`
    expect(readMetaTitle(src)).toBe('B')
  })
})

describe('resolveValueExports', () => {
  it('export * 재수출·alias 를 남기고 타입 전용 export(type alias·interface)는 뺀다', () => {
    const dir = mkdtempSync(join(tmpdir(), 'story-title-'))
    try {
      writeFileSync(
        join(dir, 'a.ts'),
        'export const A = 1\nexport type AProps = {}\nexport interface B {}\n',
      )
      const indexPath = join(dir, 'index.ts')
      writeFileSync(
        indexPath,
        [
          "export * from './a'",
          "export { A as Renamed } from './a'",
          "export type { AProps } from './a'",
          '',
        ].join('\n'),
      )
      const result = resolveValueExports([indexPath])
      expect(result.get(indexPath)).toEqual(new Set(['A', 'Renamed']))
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

describe('expectedTitlePrefix', () => {
  const T = { domains: ['common'], categories: ['form', 'data-display'] }
  it('표시 이름으로 만든다', () => {
    expect(expectedTitlePrefix(['common', 'form'], T)).toBe('Compositions / Common / Form')
    expect(expectedTitlePrefix(['common', 'data-display'], T)).toBe(
      'Compositions / Common / Data Display',
    )
  })
  it('형식이 다르면 null', () => {
    expect(expectedTitlePrefix(['common'], T)).toBeNull()
    expect(expectedTitlePrefix(['common', 'unknown'], T)).toBeNull()
  })
})

// ── 실재 트리 게이트 ─────────────────────────────────────────────────────

const COMPOSITIONS_DIR = join(__dirname, '../compositions')
const REGISTRY_PATH = join(__dirname, '../../../../registry.json')
const TAXONOMY_PATH = join(__dirname, '../../taxonomy.json')

interface RegistryItem {
  name: string
  categories: string[]
}

function loadRegistryItems(): RegistryItem[] {
  const parsed = JSON.parse(readFileSync(REGISTRY_PATH, 'utf-8')) as { items: RegistryItem[] }
  return parsed.items
}

/** 컴포지션 폴더 아래 모든 `*.stories.tsx` 를 재귀로 모은다(`isSkippedDir` 제외). */
function listStoryFiles(dir: string): string[] {
  let entries: Dirent[]
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return []
  }
  const files: string[] = []
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (isSkippedDir(entry.name)) continue
      files.push(...listStoryFiles(full))
    } else if (entry.name.endsWith('.stories.tsx')) {
      files.push(full)
    }
  }
  return files
}

const indexFileFor = (name: string) => join(COMPOSITIONS_DIR, name, 'index.ts')

describe('컴포지션 스토리 title 이 registry categories 와 정합한다', () => {
  const taxonomy: Taxonomy = loadTaxonomy(TAXONOMY_PATH)
  const items = loadRegistryItems()
  const exportsByIndexFile = resolveValueExports(items.map(i => indexFileFor(i.name)))

  it('대조군 — 검사할 registry 아이템이 실제로 있다', () => {
    // 분모가 0 이면 아래 단정이 빈 목록을 돌며 조용히 통과한다.
    expect(items.length).toBeGreaterThan(0)
  })

  it('모든 스토리의 meta title 이 categories 로 만든 prefix + index.ts export 이름이다', () => {
    const violations: string[] = []
    let storyFileCount = 0
    const itemsWithStory = new Set<string>()

    for (const item of items) {
      const dir = join(COMPOSITIONS_DIR, item.name)
      const expectedPrefix = expectedTitlePrefix(item.categories, taxonomy)
      if (expectedPrefix === null) {
        violations.push(
          `${item.name}: categories(${JSON.stringify(item.categories)}) 로 기대 prefix 를 만들 수 없다`,
        )
        // categories 부터 잘못된 아이템은 그 자체로 이미 문제로 잡혔다 — 아래
        // "스토리 없는 아이템" 단정에서 또 잡히면 같은 문제가 두 번 보고된다.
        itemsWithStory.add(item.name)
        continue
      }

      const storyFiles = listStoryFiles(dir)
      if (storyFiles.length > 0) itemsWithStory.add(item.name)
      storyFileCount += storyFiles.length

      const exportNames = exportsByIndexFile.get(indexFileFor(item.name)) ?? new Set<string>()

      for (const storyFile of storyFiles) {
        const source = readFileSync(storyFile, 'utf-8')
        const actualTitle = readMetaTitle(source)
        const rel = relative(COMPOSITIONS_DIR, storyFile)

        if (actualTitle === null || !actualTitle.startsWith(`${expectedPrefix} / `)) {
          violations.push(
            `${rel}: meta title 이 '${expectedPrefix} / <이름>' 로 시작해야 한다 ` +
              `(실제: ${actualTitle === null ? 'null(읽을 수 없음)' : actualTitle})`,
          )
          continue
        }

        const name = actualTitle.slice(expectedPrefix.length + ' / '.length)
        if (!exportNames.has(name)) {
          violations.push(
            `${rel}: title 의 이름 '${name}' 이 ${item.name}/index.ts 의 export 에 없다 ` +
              `(기대 prefix: '${expectedPrefix}')`,
          )
        } else if (!/^[A-Z]/.test(name)) {
          // useTable 같은 훅 이름도 값 export 라 위 exportNames 검사만으로는 통과한다 —
          // title 의 이름 마디는 컴포넌트를 가리켜야 하므로 대문자 시작을 별도로 요구한다.
          violations.push(
            `${rel}: title 의 이름 '${name}' 은 대문자로 시작해야 한다(컴포넌트가 아니다)`,
          )
        }
      }
    }

    // 대상 집합이 조용히 비지 않게 — 검사한 스토리 파일 수와 registry 아이템 커버리지를 함께 남긴다.
    expect(storyFileCount, '검사한 스토리 파일 수').toBeGreaterThan(0)
    expect(
      storyFileCount,
      '검사한 스토리 파일 수는 registry 아이템 수 이상이어야 한다',
    ).toBeGreaterThanOrEqual(items.length)
    const unmatched = items.filter(i => !itemsWithStory.has(i.name)).map(i => i.name)
    expect(unmatched, '스토리가 1개도 없는 registry 아이템').toEqual([])

    expect(violations).toEqual([])
  })
})
