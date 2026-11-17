/**
 * AFDS Manifest Generator (v4 — minimal)
 *
 * Generates:
 * - dist/manifest.json          — lightweight index
 * - dist/manifest/{name}.json   — per-component minimal detail
 * - dist/manifest/tokens.*.json — token files split by layer
 * - dist/llms.txt               — llmstxt.org-compliant LLM-readable plain text
 *
 * Per-component manifest holds ONLY information that is NOT derivable from code
 * or naturally exposed by the example (i.e. "human intent / runtime constraints
 * / public DOM contract"):
 *
 * - summary    ← src/bricks/{category}/{name}.spec.md (blockquote)
 * - rules      ← src/bricks/{category}/{name}.spec.md (## Rules)
 * - examples   ← src/bricks/{category}/{name}.spec.md (## Examples code blocks)
 * - slots      ← src/bricks/{category}/{name}.tsx     (data-slot attributes)
 * - schemaPath → src/schemas/{name}.schema.ts (props zod schema, ts-morph 추출 산출물)
 *
 * Props/variants/sizes/defaults/parts are intentionally not in the manifest.
 * Their source of truth is the component code (.tsx Props + JSDoc, .style.ts CVA,
 * .tsx exports). Agents reading the manifest should use the example as the
 * canonical usage template and consult the .tsx file only for edge cases.
 */
import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, basename, dirname, extname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildTokenInfo, renderTokenSections, type TokenInfo } from './tokens-manifest'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..')
// 필드 추가는 minor · 제거나 의미 변경은 major. `manifest.json` 은 공개 export 이므로
// 이 값이 소비처가 읽는 계약이다.
const SCHEMA_VERSION = '3.0.0'

// Types

/** Per-component detail manifest (dist/manifest/{name}.json) */
interface ComponentDetail {
  name: string
  category: string
  importPath: string
  filePath: string
  schemaPath?: string
  summary?: string
  rules?: string[]
  examples?: string[]
  slots?: string[]
}

/** Lightweight entry in the index manifest */
interface EntryIndex {
  name: string
  category: string
  importPath: string
  filePath: string
  summary?: string
  manifestPath: string
  schemaPath?: string
}

interface HeadlessInfo {
  name: string
  category: 'headless'
  importPath: string
  filePath: string
  schemaPath?: string
  summary?: string
  examples?: string[]
}

interface UtilInfo {
  name: string
  category: 'hook' | 'util'
  importPath: string
  filePath: string
  summary?: string
  examples?: string[]
}

/** Lightweight index manifest (dist/manifest.json) */
interface IndexManifest {
  schemaVersion: string
  name: string
  version: string
  generatedAt: string
  package: {
    entry: string
    types: string
    styles: string
  }
  tokens: {
    semanticPath: string
    primitivePath: string
    customPath: string
  }
  components: EntryIndex[]
  headless: EntryIndex[]
  hooks: EntryIndex[]
  lib: EntryIndex[]
  scope: EntryIndex[]
}

// Helpers

function findFiles(dir: string, pattern: RegExp, ignore: RegExp[] = []): string[] {
  if (!existsSync(dir)) return []
  const results: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (ignore.some(re => re.test(full))) continue
      results.push(...findFiles(full, pattern, ignore))
    } else if (pattern.test(entry.name) && !ignore.some(re => re.test(full))) {
      results.push(full)
    }
  }
  return results
}

// .tsx → data-slot extraction

function parseSlotsFromTsx(filePath: string): string[] {
  if (!existsSync(filePath)) return []
  const content = readFileSync(filePath, 'utf-8')
  const slots = new Set<string>()
  const matches = content.matchAll(/data-slot=["']([^"']+)["']/g)
  for (const m of matches) slots.add(m[1])
  return [...slots]
}

// spec.md → summary / rules / examples

function parseSpecMd(specPath: string): Pick<ComponentDetail, 'summary' | 'rules' | 'examples'> {
  if (!existsSync(specPath)) return {}
  const content = readFileSync(specPath, 'utf-8')
  const info: Pick<ComponentDetail, 'summary' | 'rules' | 'examples'> = {}

  // H1 직후 blockquote
  const blockquoteMatch = content.match(/^#\s+.+\n+>\s+(.+)/m)
  if (blockquoteMatch) {
    info.summary = blockquoteMatch[1].trim()
  } else {
    const plainDescMatch = content.match(/^#\s+.+\n\n([^#\n>].+)/m)
    if (plainDescMatch) info.summary = plainDescMatch[1].trim()
  }

  // ## Rules — 숫자 목록
  const rulesSection = content.match(/## Rules[^\n]*\n([\s\S]*?)(?=\n## |\s*$)/)
  if (rulesSection) {
    const rules = rulesSection[1]
      .split('\n')
      .filter(l => /^\d+\./.test(l.trim()))
      .map(l => l.replace(/^\d+\.\s*/, '').trim())
    if (rules.length > 0) info.rules = rules
  }

  // ## Examples — 코드 펜스 블록 (```tsx ... ```)
  const examplesSection = content.match(/## Examples[^\n]*\n([\s\S]*?)(?=\n## |\s*$)/)
  if (examplesSection) {
    const examples: string[] = []
    const fenceMatches = examplesSection[1].matchAll(/```(?:tsx|jsx|ts|js)?\n([\s\S]*?)```/g)
    for (const m of fenceMatches) {
      const code = m[1].trim()
      if (code) examples.push(code)
    }
    if (examples.length > 0) info.examples = examples
  }

  return info
}

// JSDoc @example parser (headless hooks only)

function parseJsdocExamples(filePath: string): string[] {
  if (!existsSync(filePath)) return []
  const content = readFileSync(filePath, 'utf-8')
  const examples: string[] = []
  const jsdocMatches = content.matchAll(/\/\*\*([\s\S]*?)\*\//g)
  for (const match of jsdocMatches) {
    const block = match[1]
    const exampleMatches = block.matchAll(/@example\s*\n([\s\S]*?)(?=\s*\*\s*@|$)/g)
    for (const exMatch of exampleMatches) {
      const exampleText = exMatch[1]
        .split('\n')
        .map(line => line.replace(/^\s*\*\s?/, ''))
        .join('\n')
        .trim()
      if (exampleText) examples.push(exampleText)
    }
  }
  return examples
}

// Headless Hook Parser

function parseAllExports(filePath: string): {
  summary?: string
  exportNames: string[]
  signatures: string[]
} {
  if (!existsSync(filePath)) return { exportNames: [], signatures: [] }
  const content = readFileSync(filePath, 'utf-8')

  const exportNames: string[] = []
  const signatures: string[] = []
  const exportRe = /export\s+(?:default\s+)?(?:function|const|let|var)\s+(\w+)/g
  for (const m of content.matchAll(exportRe)) {
    const startIdx = m.index ?? 0
    const exportName = m[1]
    if (!exportName) continue
    exportNames.push(exportName)
    const lineEnd = content.indexOf('\n', startIdx)
    const braceEnd = content.indexOf('{', startIdx)
    const sigEnd = braceEnd > 0 && (lineEnd < 0 || braceEnd < lineEnd) ? braceEnd : lineEnd
    if (sigEnd > 0) {
      signatures.push(content.slice(startIdx, sigEnd).replace(/\s+/g, ' ').trim())
    }
  }

  let summary: string | undefined
  const jsdocMatch = content.match(/\/\*\*\s*\n([\s\S]*?)\*\//)
  if (jsdocMatch) {
    const lines = jsdocMatch[1]
      .split('\n')
      .map(l => l.replace(/^\s*\*\s?/, '').trim())
      .filter(l => l && !l.startsWith('@'))
    if (lines.length > 0) summary = lines[0]
  }

  return { summary, exportNames, signatures }
}

/** 헤드리스 훅 파일에서 메인 `useXxx` 선언 바로 위 JSDoc만 summary로 채택한다. */
function parseHeadlessHook(filePath: string): { summary?: string; signature?: string } {
  if (!existsSync(filePath)) return {}
  const content = readFileSync(filePath, 'utf-8')

  // 파일명에서 메인 훅 이름 도출 (use-modal.ts → useModal)
  const fileBase = basename(filePath, '.ts')
  const mainHookName = fileBase.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())

  // 메인 훅 선언 위치 찾기
  const declRe = new RegExp(`export\\s+(?:function|const|let|var)\\s+${mainHookName}\\b`)
  const declMatch = content.match(declRe)
  if (!declMatch || declMatch.index === undefined) return {}

  const declIdx = declMatch.index
  const sigEnd = content.indexOf('{', declIdx)
  const signature =
    sigEnd > 0 ? content.slice(declIdx, sigEnd).replace(/\s+/g, ' ').trim() : undefined

  // 선언 직전 JSDoc만 추출 (공백/주석 외 다른 토큰이 끼어 있으면 매칭 안 함)
  const preceding = content.slice(0, declIdx)
  const jsdocBeforeRe = /\/\*\*\s*\n([\s\S]*?)\*\/\s*$/
  const trimmedPreceding = preceding.replace(/\s*\n\s*$/, '\n')
  const jsdocMatch = trimmedPreceding.match(jsdocBeforeRe)
  let summary: string | undefined
  if (jsdocMatch) {
    const lines = jsdocMatch[1]
      .split('\n')
      .map(l => l.replace(/^\s*\*\s?/, '').trim())
      .filter(l => l && !l.startsWith('@'))
    if (lines.length > 0) summary = lines[0]
  }

  return { summary, signature }
}

// Tokens

/**
 * 토큰 이름은 `src/schemas/tokens.schema.ts`(같은 figma-token-bridge 산출물)에서 가져오고,
 * 값만 `tokens/json/*.tokens.json` 에서 읽는다. 자세한 규칙은 scripts/tokens-manifest.ts 참조.
 */
function scanTokens(): TokenInfo {
  return buildTokenInfo(join(ROOT, 'tokens', 'json'))
}

// Component scanner

async function scanComponents(pkg: { name: string }): Promise<{
  details: ComponentDetail[]
  headless: HeadlessInfo[]
}> {
  const srcDir = join(ROOT, 'src')
  const componentsDir = join(srcDir, 'bricks')

  const componentFiles = findFiles(componentsDir, /\.tsx$/, [
    /__test__/,
    /\.test\.tsx$/,
    /\.stories\.tsx$/,
    /\.css\.ts$/,
    /index\.tsx?$/,
    /_template/,
  ])

  const details: ComponentDetail[] = componentFiles.map(file => {
    const kebabName = basename(file, '.tsx')
    const fileDir = dirname(file)

    const relFromComponents = relative(componentsDir, fileDir)
    const category = relFromComponents.split('/')[0] ?? 'misc'

    const name = kebabName
      .split('-')
      .map(p => p.charAt(0).toUpperCase() + p.slice(1))
      .join('')

    const specPath = join(fileDir, `${kebabName}.spec.md`)
    const specInfo = parseSpecMd(specPath)
    const schemaPath = join(srcDir, 'schemas', `${kebabName}.schema.ts`)
    const slots = parseSlotsFromTsx(file)

    return {
      name,
      category,
      importPath: `${pkg.name}/bricks`,
      filePath: relative(ROOT, file),
      ...(existsSync(schemaPath) ? { schemaPath: relative(ROOT, schemaPath) } : {}),
      ...specInfo,
      ...(slots.length > 0 ? { slots } : {}),
    } satisfies ComponentDetail
  })

  const headlessDir = join(srcDir, 'headless')
  const hookFiles = findFiles(headlessDir, /\.ts$/, [/__test__/, /\.test\.ts$/, /index\.ts$/])

  const headless: HeadlessInfo[] = hookFiles.map(file => {
    const rawName = basename(file, '.ts')
    const name = rawName.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
    const hookInfo = parseHeadlessHook(file)
    const examples = parseJsdocExamples(file)
    const schemaPath = join(srcDir, 'schemas', `${rawName}.schema.ts`)

    return {
      name,
      category: 'headless',
      importPath: `${pkg.name}/headless`,
      filePath: relative(ROOT, file),
      ...(existsSync(schemaPath) ? { schemaPath: relative(ROOT, schemaPath) } : {}),
      ...(hookInfo.summary ? { summary: hookInfo.summary } : {}),
      ...(examples.length > 0 ? { examples } : {}),
    } satisfies HeadlessInfo
  })

  return { details, headless }
}

function scanUtilDir(
  dir: string,
  category: 'hook' | 'util',
  importPathFor: (file: string) => string,
): UtilInfo[] {
  if (!existsSync(dir)) return []
  const files = findFiles(dir, /\.tsx?$/, [
    /__test__/,
    /\.test\.tsx?$/,
    /\.stories\.tsx?$/,
    /index\.tsx?$/,
  ])
  return files.map(file => {
    const rawName = basename(file).replace(/\.tsx?$/, '')
    const name = rawName.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
    const parsed = parseAllExports(file)
    const examples = parseJsdocExamples(file)
    return {
      name,
      category,
      importPath: importPathFor(file),
      filePath: relative(ROOT, file),
      ...(parsed.summary ? { summary: parsed.summary } : {}),
      ...(examples.length > 0 ? { examples } : {}),
    } satisfies UtilInfo
  })
}

// llms.txt — llmstxt.org format

/** package.json 중 llms.txt 생성에 쓰는 부분만. */
interface PkgFacts {
  name: string
  version: string
  files?: string[]
  exports?: Record<string, unknown>
}

/**
 * package.json 에서 계약 생성에 쓰는 필드만 읽고 **런타임에 검증**한다.
 *
 * `JSON.parse(...) as PkgFacts` 는 컴파일러만 속인다. 이 저장소가 겪은 실패가 정확히
 * "타입은 통과하고 런타임에 비어 있었다" 이므로, 안내가 파생되는 필드는 실제로 확인한다.
 * 특히 exports 가 비면 Quick Start 의 import 안내가 통째로 사라진다 — 조용히 넘기지 않는다.
 */
function readPkgFacts(): PkgFacts {
  const raw: unknown = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'))
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('package.json: 최상위가 객체가 아니다')
  }
  const { name, version, files, exports } = raw as Record<string, unknown>
  if (typeof name !== 'string' || name === '') throw new Error('package.json: name 이 비었다')
  if (typeof version !== 'string' || version === '') {
    throw new Error('package.json: version 이 비었다')
  }
  if (typeof exports !== 'object' || exports === null) {
    throw new Error('package.json: exports 가 없다 — Quick Start 의 import 안내가 여기서 파생된다')
  }
  if (files !== undefined && !Array.isArray(files)) {
    throw new Error('package.json: files 가 배열이 아니다')
  }
  return {
    name,
    version,
    exports: exports as Record<string, unknown>,
    ...(files ? { files: files.filter((f): f is string => typeof f === 'string') } : {}),
  }
}

/**
 * exports 에 실제로 있는 서브패스만 `<pkg>/<subpath>` 로 돌려준다.
 *
 * Quick Start 안내를 문자열로 박아두면 exports 가 바뀌어도 아무도 고치지 않는다
 * (`./styles` 가 추가된 뒤에도 안내는 `tokens.css` 를 가리키고 있었다).
 * 여기서 파생시키면 exports 가 계약의 단일 출처가 된다.
 */
function exportedSubpath(pkg: PkgFacts, subpath: string): string | undefined {
  return pkg.exports?.[`./${subpath}`] ? `${pkg.name}/${subpath}` : undefined
}

/**
 * 배포되는 CSS 에 다크 모드 배선이 있는지 — `.dark` 셀렉터 또는 `@custom-variant dark`.
 *
 * 안내를 배선에서 파생시켜야 "지원한다고 적혀 있으나 배선은 없는" 상태가 다시 생기지 않는다.
 * 배선이 생기면 이 함수가 true 가 되어 안내가 자동으로 돌아온다.
 */
function hasDarkModeWiring(): boolean {
  const tokensDir = join(ROOT, 'tokens')
  const cssFiles = [
    join(ROOT, 'src', 'styles', 'index.css'),
    ...(existsSync(tokensDir)
      ? readdirSync(tokensDir)
          .filter(f => f.endsWith('.css'))
          .map(f => join(tokensDir, f))
      : []),
  ]
  return cssFiles.some(file => {
    if (!existsSync(file)) return false
    const css = readFileSync(file, 'utf-8')
    return /(?:^|[\s,{])\.dark\b/.test(css) || /@custom-variant\s+dark\b/.test(css)
  })
}

/** 모노레포 체크아웃에만 있는 규칙 문서 — 실재하는 것만 링크한다(이름이 바뀌면 조용히 빠진다). */
const RULE_DOCS: { path: string; label: string }[] = [
  { path: '.claude/rules/afds-component-tokens.md', label: '디자인 토큰 사용 규칙' },
  { path: '.claude/rules/afds-component-structure.md', label: '컴포넌트 구조 규칙' },
  { path: '.claude/rules/afds-component-philosophy.md', label: '설계 철학' },
]

function generateLlmsTxt(index: IndexManifest, tokens: TokenInfo, pkg: PkgFacts): string {
  const lines: string[] = [
    `# AFDS — Agent Friendly Design System`,
    ``,
    `> ${index.name} 는 Base UI · Tailwind CSS v4 · CVA 기반의 React 디자인 시스템으로,`,
    `> 에이전트가 토큰·접근성·variants를 안전하게 사용하도록 설계되었다. (v${index.version})`,
    ``,
    `## Quick Start`,
    ``,
    `- 패키지: \`${index.name}\``,
  ]

  // 아래 import 안내는 모두 package.json 의 exports 에서 파생된다 — 목록에 없는 서브패스는
  // Node 가 차단하므로, 있는 것만 안내해야 한다.
  const bricks = exportedSubpath(pkg, 'bricks')
  if (bricks) lines.push(`- 컴포넌트 import: \`import { ComponentName } from '${bricks}'\``)
  const headlessPath = exportedSubpath(pkg, 'headless')
  if (headlessPath)
    lines.push(`- 헤드리스 훅 import: \`import { useHookName } from '${headlessPath}'\``)

  const styles = exportedSubpath(pkg, 'styles')
  if (styles) lines.push(`- 스타일 import (사전 컴파일 CSS 엔트리): \`@import '${styles}'\``)
  const tokensEntry = exportedSubpath(pkg, 'tokens')
  if (tokensEntry) {
    const fonts = exportedSubpath(pkg, 'tokens/fonts')
    lines.push(
      `- 토큰 원본 import (copy-owned 소스를 자기 Tailwind 로 컴파일할 때): \`@import '${tokensEntry}'\`` +
        ` — 자기 소스의 클래스는 소비자 CSS 에서 \`@source\` 를 직접 선언해야 생성된다` +
        (fonts ? `. 폰트(Pretendard CDN)는 선택: \`@import '${fonts}'\`` : ``),
    )
  }

  // 다크 모드는 실제 CSS 배선이 있을 때만 안내한다 (없으면 이 줄 자체가 나오지 않는다).
  if (hasDarkModeWiring()) lines.push(`- 다크 모드: \`<html class="dark">\``)

  lines.push(
    `- 컴포넌트 사용 시: \`dist/manifest/{name}.json\`을 진입점으로 읽고, 그곳의 example을 템플릿으로 사용한다. props·variants 상세가 필요하면 같은 폴더의 \`.tsx\` Props 인터페이스와 JSDoc을 참조한다.`,
    ``,
  )

  // Design Tokens — 토큰 섹션은 scripts/tokens-manifest.ts 가 렌더한다
  lines.push(...renderTokenSections(tokens))

  // SVG — `fill`/`stroke` 에 토큰 쓰는 법. 안내가 없어서 소비처가 hex 를 하드코딩했다.
  lines.push(`### SVG (\`fill\` · \`stroke\`)`)
  lines.push(``)
  lines.push(
    `\`--color-*\` 네임스페이스는 \`fill-*\`·\`stroke-*\` 유틸도 생성한다 — \`bg-*\`·\`text-*\` 와 같은 토큰 이름을 쓴다.`,
  )
  lines.push(`SVG 도형에 hex 를 직접 쓰지 않는다.`)
  lines.push(``)
  lines.push('```tsx')
  lines.push(`<text className="fill-afds-text-secondary" />`)
  lines.push(`<path className="stroke-afds-border-default" />`)
  lines.push(`// Tailwind 없이 CSS 변수만으로도 동작한다 (클래스명을 정적으로 만들 수 없을 때)`)
  lines.push(`<circle fill="var(--afds-color-icon-brand)" />`)
  lines.push('```')
  lines.push(``)

  // Components
  const byCategory = new Map<string, EntryIndex[]>()
  for (const comp of index.components) {
    const list = byCategory.get(comp.category) ?? []
    list.push(comp)
    byCategory.set(comp.category, list)
  }

  lines.push(`## Components`)
  lines.push(``)
  for (const [, comps] of byCategory) {
    for (const comp of comps) {
      const summary = comp.summary ?? ''
      lines.push(`- [${comp.name}](${comp.manifestPath}): ${summary}`)
    }
  }
  lines.push(``)

  lines.push(`## Headless Hooks`)
  lines.push(``)
  for (const hook of index.headless) {
    const summary = hook.summary ?? ''
    lines.push(`- [${hook.name}](${hook.manifestPath}): ${summary}`)
  }
  lines.push(``)

  if (index.hooks.length > 0) {
    lines.push(`## Hooks (\`${index.name}/hooks\`)`)
    lines.push(``)
    for (const h of index.hooks) {
      const summary = h.summary ?? ''
      lines.push(`- [${h.name}](${h.manifestPath}): ${summary}`)
    }
    lines.push(``)
  }

  if (index.lib.length > 0) {
    lines.push(`## Lib Utilities`)
    lines.push(``)
    for (const u of index.lib) {
      const summary = u.summary ?? ''
      lines.push(`- [${u.name}](${u.manifestPath}) (\`${u.importPath}\`): ${summary}`)
    }
    lines.push(``)
  }

  if (index.scope.length > 0) {
    lines.push(`## Scope (\`${index.name}/scope\`)`)
    lines.push(``)
    lines.push(
      `> 다른 디자인시스템과 공존(opt-in): \`@import '${index.name}/styles/scoped'\` + \`<AfdsScope>\` 로 preflight·오버레이를 \`.afds\` 안에 가둔다. 레시피: docs/scoped-coexistence.md`,
    )
    lines.push(``)
    for (const s of index.scope) {
      const summary = s.summary ?? ''
      lines.push(`- [${s.name}](${s.manifestPath}) (\`${s.importPath}\`): ${summary}`)
    }
    lines.push(``)
  }

  lines.push(`## Rules & Docs`)
  lines.push(``)
  lines.push(`- [README](README.md): 설치 · CSS 엔트리 선택 · import 전략`)
  // 규칙 문서는 .claude/ 에 있고 files 에 없다 — 설치된 패키지에서는 존재하지 않는 경로다.
  // 링크로 위장하지 않고 코드 스팬으로 적고, 어디서 유효한지 함께 밝힌다.
  const monorepoRoot = join(ROOT, '..', '..')
  const existingRules = RULE_DOCS.filter(doc => existsSync(join(monorepoRoot, doc.path)))
  if (existingRules.length > 0) {
    const shipped = (pkg.files ?? []).map(f => `\`${f}\``).join(' · ')
    lines.push(
      `- 아래 규칙 문서는 **모노레포 체크아웃에서만** 유효하다` +
        (shipped ? ` — npm tarball 의 \`files\` 는 ${shipped} 뿐이라 \`.claude/\` 가 없다` : ``) +
        `:`,
    )
    for (const doc of existingRules) lines.push(`  - \`${doc.path}\` — ${doc.label}`)
  }
  lines.push(``)

  lines.push(`## Optional`)
  lines.push(``)
  lines.push(`- [컴포넌트 인덱스](dist/manifest.json): 전체 컴포넌트 목록 + 각 상세 파일 경로`)
  lines.push(
    `- [컴포넌트 상세](dist/manifest/): 컴포넌트별 summary·rules·examples·slots (예: dist/manifest/button.json)`,
  )
  lines.push(`- [Storybook 카탈로그](apps/storybook): 시각적 예시 (런타임 필요)`)
  lines.push(``)

  return lines.join('\n')
}

// Main

/**
 * 매니페스트 파일명을 OS-independent하게, 그리고 디렉터리 간 basename 충돌 없이 만든다.
 * 예: src/headless/pagination/types.ts → headless__pagination__types
 */
function manifestFileName(filePathFromRoot: string): string {
  const ext = extname(filePathFromRoot)
  const stem = filePathFromRoot.slice(0, filePathFromRoot.length - ext.length)
  return stem
    .replace(/^src[\\/]+/, '')
    .split(/[\\/]/)
    .join('__')
}

async function main() {
  console.log('📋 AFDS Manifest Generator v4 (minimal)')
  console.log('================================')

  const pkg = readPkgFacts()
  const { details, headless } = await scanComponents(pkg)
  const srcDir = join(ROOT, 'src')
  const hooks = scanUtilDir(join(srcDir, 'hooks'), 'hook', () => `${pkg.name}/hooks`)
  const lib = scanUtilDir(join(srcDir, 'lib'), 'util', file => {
    const base = basename(file).replace(/\.tsx?$/, '')
    return base === 'utils' ? `${pkg.name}/lib/utils` : pkg.name
  })
  // 공존(opt-in) 래퍼 — AfdsScope 등. bricks 가 아니라 별도 ./scope 엔트리.
  const scope = scanUtilDir(join(srcDir, 'scope'), 'util', () => `${pkg.name}/scope`)
  const tokens = scanTokens()

  const distDir = join(ROOT, 'dist')
  const manifestDir = join(distDir, 'manifest')
  if (!existsSync(distDir)) mkdirSync(distDir, { recursive: true })
  if (!existsSync(manifestDir)) mkdirSync(manifestDir, { recursive: true })

  // Write per-component detail files
  for (const detail of details) {
    const kebabName = detail.name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
    const filePath = join(manifestDir, `${kebabName}.json`)
    writeFileSync(filePath, JSON.stringify(detail, null, 2))
  }
  console.log(`✅ dist/manifest/*.json (${details.length} components)`)

  // Write per-hook detail files
  for (const hook of headless) {
    const filePath = join(manifestDir, `${manifestFileName(hook.filePath)}.json`)
    writeFileSync(filePath, JSON.stringify(hook, null, 2))
  }
  console.log(`✅ dist/manifest/use-*.json (${headless.length} headless hooks)`)

  // Write per-utility detail files (hooks/ + lib/ + scope/)
  for (const util of [...hooks, ...lib, ...scope]) {
    const filePath = join(manifestDir, `${manifestFileName(util.filePath)}.json`)
    writeFileSync(filePath, JSON.stringify(util, null, 2))
  }
  console.log(
    `✅ dist/manifest/{hooks,lib,scope}/*.json (${hooks.length + lib.length + scope.length} utilities)`,
  )

  // Write token files
  writeFileSync(join(manifestDir, 'tokens.semantic.json'), JSON.stringify(tokens.semantic, null, 2))
  writeFileSync(
    join(manifestDir, 'tokens.primitive.json'),
    JSON.stringify(tokens.primitive, null, 2),
  )
  writeFileSync(join(manifestDir, 'tokens.custom.json'), JSON.stringify(tokens.custom, null, 2))
  console.log(`✅ dist/manifest/tokens.*.json`)

  // Build lightweight index entries (shared shape across components / headless / hooks / lib)
  const componentEntries: EntryIndex[] = details.map(d => {
    const kebabName = d.name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
    return {
      name: d.name,
      category: d.category,
      importPath: d.importPath,
      filePath: d.filePath,
      ...(d.summary ? { summary: d.summary } : {}),
      manifestPath: `dist/manifest/${kebabName}.json`,
      ...(d.schemaPath ? { schemaPath: d.schemaPath } : {}),
    } satisfies EntryIndex
  })

  const toEntryIndex = (info: HeadlessInfo | UtilInfo): EntryIndex => {
    return {
      name: info.name,
      category: info.category,
      importPath: info.importPath,
      filePath: info.filePath,
      ...(info.summary ? { summary: info.summary } : {}),
      manifestPath: `dist/manifest/${manifestFileName(info.filePath)}.json`,
      ...('schemaPath' in info && info.schemaPath ? { schemaPath: info.schemaPath } : {}),
    }
  }
  const headlessEntries = headless.map(toEntryIndex)
  const hookEntries = hooks.map(toEntryIndex)
  const libEntries = lib.map(toEntryIndex)
  const scopeEntries = scope.map(toEntryIndex)

  const indexManifest: IndexManifest = {
    schemaVersion: SCHEMA_VERSION,
    name: pkg.name,
    version: pkg.version,
    generatedAt: new Date().toISOString(),
    package: {
      entry: './dist/index.js',
      types: './dist/index.d.ts',
      // llms.txt 의 스타일 안내와 같은 출처(exports)에서 파생시킨다 — 예전엔 여기에도
      // tokens.css 가 박혀 있었고, 그것은 Tailwind·semantic 레이어가 없는 파일이다.
      styles: pkg.exports?.['./styles'] ? './dist/styles/index.css' : './tokens/tokens.css',
    },
    tokens: {
      semanticPath: 'dist/manifest/tokens.semantic.json',
      primitivePath: 'dist/manifest/tokens.primitive.json',
      customPath: 'dist/manifest/tokens.custom.json',
    },
    components: componentEntries,
    headless: headlessEntries,
    hooks: hookEntries,
    lib: libEntries,
    scope: scopeEntries,
  }

  const manifestPath = join(distDir, 'manifest.json')
  writeFileSync(manifestPath, JSON.stringify(indexManifest, null, 2))
  console.log(`✅ ${manifestPath}`)

  const llmsPath = join(distDir, 'llms.txt')
  writeFileSync(llmsPath, generateLlmsTxt(indexManifest, tokens, pkg))
  console.log(`✅ ${llmsPath}`)

  const missingDesc = details.filter(c => !c.summary)
  const missingExamples = details.filter(c => !c.examples || c.examples.length === 0)

  console.log(`\n📦 components: ${details.length}`)
  console.log(`🔧 headless hooks: ${headless.length}`)
  if (missingDesc.length > 0) {
    console.log(
      `⚠️  summary 없는 컴포넌트 (${missingDesc.length}): ${missingDesc.map(c => c.name).join(', ')}`,
    )
  }
  if (missingExamples.length > 0) {
    console.log(
      `⚠️  examples 없는 컴포넌트 (${missingExamples.length}): ${missingExamples.map(c => c.name).join(', ')}`,
    )
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
