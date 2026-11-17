/**
 * AFDS Token Manifest — 토큰 매니페스트 빌드 · 렌더 · 검증
 *
 * 이름의 정본은 `src/schemas/tokens.schema.ts` 다. 그 파일은 `tokens/*.css` 와 **같은**
 * figma-token-bridge 실행으로 생성되므로, 이름을 거기서 가져오면 CSS 와 어긋날 수 없다.
 * 값(`resolves`)만 `tokens/json/*.tokens.json`(레거시 Tokens Studio 포맷 — `value`/`type`)에서 읽는다.
 *
 * 이 모듈은 부작용이 없다(파일을 쓰지 않는다). generate-manifest.ts 가 산출을, build.ts 가 검증을 호출한다.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import postcss from 'postcss'
import {
  CUSTOM_DURATION_VALUES,
  CUSTOM_SHADOW_VALUES,
  CUSTOM_TEXT_VALUES,
  PRIMITIVE_COLOR_VALUES,
  PRIMITIVE_RADIUS_VALUES,
  PRIMITIVE_SPACING_VALUES,
  PRIMITIVE_TYPOGRAPHY_VALUES,
  SEMANTIC_COLOR_VALUES,
} from '../src/schemas/tokens.schema'

// Types

export interface TokenEntry {
  /** 이 토큰이 선언하는 CSS 커스텀 프로퍼티. `@utility` 로만 나가는 토큰(custom text)은 없다. */
  cssVar?: string
  /** 그대로 쓸 수 있는 Tailwind 클래스. 매핑이 불분명한 토큰은 생략한다. */
  tailwind?: string
  /** 해당 CSS 선언의 값 — primitive 는 원시 값(`5px`), semantic 은 참조(`var(--afds-color-gray-0)`) */
  resolves?: string
}

export interface TokenCategory {
  [role: string]: TokenEntry
}

export interface TokenLayer {
  [category: string]: TokenCategory
}

export interface TokenInfo {
  semantic: TokenLayer
  primitive: TokenLayer
  custom: TokenLayer
}

/** tokens/json 의 leaf 노드 — 레거시 포맷은 `{ value, type }` 을 가진 객체가 leaf 다. */
interface TokenLeaf {
  /** JSON 상의 전체 경로. 예: ['color', 'icon', 'lnbDefault'] */
  path: string[]
  value: unknown
  type?: string
}

// 이름 정규화 — JSON 키 → 파이프라인이 만드는 토큰 이름 조각

/**
 * `fontSize` → `font-size`, `s_36` → `s-36`, `SM` → `sm`, `lnbDefault` → `lnb-default`.
 * figma-token-bridge 가 CSS 변수명을 만들 때 쓰는 규칙과 동일하다(실측 대조 완료).
 */
function normalizeSegment(segment: string): string {
  return segment
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase()
}

/** JSON 전체 경로 → CSS 커스텀 프로퍼티. 예: color.icon.lnbDefault → --afds-color-icon-lnb-default */
function toCssVar(path: string[]): string {
  return `--afds-${path.map(normalizeSegment).join('-')}`
}

/** `{color.alpha.white.050}` → `var(--afds-color-alpha-white-050)` */
function referenceToCssVar(reference: string): string {
  return `var(${toCssVar(reference.slice(1, -1).split('.'))})`
}

function isReference(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('{') && value.endsWith('}')
}

// tokens/json 읽기

function collectLeaves(node: Record<string, unknown>, path: string[] = []): TokenLeaf[] {
  const leaves: TokenLeaf[] = []
  for (const [key, child] of Object.entries(node)) {
    if (!child || typeof child !== 'object') continue
    const next = [...path, key]
    if ('value' in (child as Record<string, unknown>)) {
      const leaf = child as { value: unknown; type?: string }
      leaves.push({ path: next, value: leaf.value, type: leaf.type })
    } else {
      leaves.push(...collectLeaves(child as Record<string, unknown>, next))
    }
  }
  return leaves
}

function readLeaves(tokensJsonDir: string, file: string): TokenLeaf[] {
  const raw = JSON.parse(readFileSync(join(tokensJsonDir, file), 'utf-8')) as Record<
    string,
    unknown
  >
  return collectLeaves(raw)
}

/**
 * 토큰 값 하나를 CSS 에 쓰는 문자열로. 레거시 Tokens Studio JSON 은 fontWeight·duration·spacing 을
 * 숫자(`500`)로도 저장할 수 있다. 그때 값을 흘리면 `resolves` 가 비어 가드가 원인 파악 어려운
 * 빌드 실패를 낸다(현재 JSON 은 전부 문자열 — 선제 대비다).
 */
function toCssScalar(value: unknown): string | undefined {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  return undefined
}

/** shadow 합성값 → CSS 선언과 동일한 문자열. 예: `0 4px 30px 0 rgba(0, 0, 0, 0.1)` */
function formatShadow(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') return undefined
  const v = value as Record<string, unknown>
  const parts = [v.offsetX, v.offsetY, v.blur, v.spread, v.color].map(toCssScalar)
  return parts.every(p => p !== undefined) ? parts.join(' ') : undefined
}

/**
 * typography 합성값의 표기. 예: `16px/26px 500`
 *
 * 빌더는 tokens/json 에서, 가드는 `@utility` 본문에서 각각 이 값을 만들어 대조한다.
 * 표기 규칙만 공유하고 값의 출처는 서로 독립이다.
 */
function formatTypography(
  fontSize?: string,
  lineHeight?: string,
  fontWeight?: string,
): string | undefined {
  if (!fontSize || !lineHeight || !fontWeight) return undefined
  return `${fontSize}/${lineHeight} ${fontWeight}`
}

/** leaf 값 → `resolves`. 참조는 CSS 가 선언하는 형태(`var(--afds-…)`)로 바꾼다. */
function formatValue(leaf: TokenLeaf): string | undefined {
  if (isReference(leaf.value)) return referenceToCssVar(leaf.value)
  const scalar = toCssScalar(leaf.value)
  if (scalar !== undefined) return scalar
  if (leaf.type === 'shadow') return formatShadow(leaf.value)
  return undefined
}

// 스키마 이름 ↔ JSON leaf 매칭

interface TokenMatch {
  /** tokens.schema.ts 가 정의한 이름 */
  name: string
  /** JSON 경로에서 그룹 키를 뺀 이름 (primitive color 만 스키마 이름과 다르다) */
  jsonName: string
  leaf: TokenLeaf
}

/**
 * 스키마가 정본이므로 스키마 이름을 순회하고, JSON 에서 값을 찾아 붙인다.
 * 한쪽에만 있는 이름은 두 생성물이 어긋났다는 뜻이므로 조용히 넘기지 않고 실패시킨다.
 */
function matchByName(
  layerName: string,
  group: string,
  schemaNames: readonly string[],
  leaves: TokenLeaf[],
  /** 스키마 이름 → JSON 이름(경로에서 group 을 뺀 나머지) */
  toJsonName: (schemaName: string) => string = name => name,
): TokenMatch[] {
  const byName = new Map<string, TokenLeaf>()
  for (const leaf of leaves) {
    if (leaf.path[0] !== group) continue
    byName.set(leaf.path.slice(1).map(normalizeSegment).join('-'), leaf)
  }

  const matched: TokenMatch[] = []
  const missing: string[] = []
  for (const schemaName of schemaNames) {
    const jsonName = toJsonName(schemaName)
    const leaf = byName.get(jsonName)
    if (leaf) {
      matched.push({ name: schemaName, jsonName, leaf })
      byName.delete(jsonName)
    } else {
      missing.push(schemaName)
    }
  }

  const problems: string[] = []
  if (missing.length > 0) {
    problems.push(`tokens.schema.ts 에는 있으나 JSON 에 없음: ${missing.join(', ')}`)
  }
  if (byName.size > 0) {
    problems.push(`JSON 에는 있으나 tokens.schema.ts 에 없음: ${[...byName.keys()].join(', ')}`)
  }
  if (problems.length > 0) {
    throw new Error(
      `token-manifest: ${layerName}/${group} 이름이 어긋났다 — ` +
        `'pnpm --filter @turbo-project/afds generate:tokens' 로 두 생성물을 다시 맞춰라.\n  ` +
        problems.join('\n  '),
    )
  }
  return matched
}

/** 매니페스트 카테고리 키는 JSON 이름을 쓴다(네임스페이스 없는 짧은 이름). */
function toEntries(
  matched: TokenMatch[],
  buildEntry: (match: TokenMatch) => TokenEntry,
): TokenCategory {
  const category: TokenCategory = {}
  for (const match of matched) category[match.jsonName] = buildEntry(match)
  return category
}

/** cssVar/tailwind/resolves 중 값이 있는 것만 담는다(빈 필드로 매니페스트를 부풀리지 않는다). */
function entry(parts: TokenEntry): TokenEntry {
  return {
    ...(parts.cssVar ? { cssVar: parts.cssVar } : {}),
    ...(parts.tailwind ? { tailwind: parts.tailwind } : {}),
    ...(parts.resolves ? { resolves: parts.resolves } : {}),
  }
}

// Tailwind 클래스 매핑

/** semantic 카테고리 → Tailwind 유틸리티 접두사. 매핑이 없는 카테고리는 CSS 변수로만 쓴다. */
const SEMANTIC_TAILWIND_PREFIX: Record<string, string> = {
  bg: 'bg',
  text: 'text',
  border: 'border',
  icon: 'text',
  divider: 'border',
  // @theme 에 --color-afds-interaction-* 가 있어 bg-afds-interaction-* 는 실존 유틸이다.
  interaction: 'bg',
}

/** primitive typography 이름 → Tailwind 클래스. @theme 에 대응 네임스페이스가 없으면 undefined. */
function typographyTailwind(name: string): string | undefined {
  if (name.startsWith('font-size-')) return `text-afds-${name.slice('font-size-'.length)}`
  if (name.startsWith('line-height-')) return `leading-afds-${name.slice('line-height-'.length)}`
  if (name.startsWith('font-weight-')) return `font-afds-${name.slice('font-weight-'.length)}`
  // font-family 는 @theme 변수가 --font-family-* 라 Tailwind 유틸리티가 생기지 않는다.
  return undefined
}

// Build

export function buildTokenInfo(tokensJsonDir: string): TokenInfo {
  const primitiveLeaves = readLeaves(tokensJsonDir, 'primitive.tokens.json')
  const semanticLeaves = readLeaves(tokensJsonDir, 'semantic.tokens.json')
  const customLeaves = readLeaves(tokensJsonDir, 'custom.tokens.json')

  // custom text(typography 합성)는 primitive 를 참조하므로 원시 값을 먼저 색인해 둔다.
  const primitiveByCssVar = new Map<string, string>()
  for (const leaf of primitiveLeaves) {
    const value = formatValue(leaf)
    if (value) primitiveByCssVar.set(toCssVar(leaf.path), value)
  }
  const resolvePrimitive = (reference: unknown): string | undefined => {
    if (!isReference(reference)) return toCssScalar(reference)
    return primitiveByCssVar.get(toCssVar(reference.slice(1, -1).split('.')))
  }

  const primitive: TokenLayer = {
    color: toEntries(
      // 스키마의 primitive color 이름만 네임스페이스(`afds-`)가 붙어 있다.
      matchByName('primitive', 'color', PRIMITIVE_COLOR_VALUES, primitiveLeaves, name =>
        name.slice('afds-'.length),
      ),
      ({ name, leaf }) =>
        entry({
          cssVar: toCssVar(leaf.path),
          // 색은 유틸리티 접두사가 용도에 따라 바뀐다(bg/text/border/ring). bg 를 대표로 싣는다.
          tailwind: `bg-${name}`,
          resolves: formatValue(leaf),
        }),
    ),
    typography: toEntries(
      matchByName('primitive', 'typography', PRIMITIVE_TYPOGRAPHY_VALUES, primitiveLeaves),
      ({ name, leaf }) =>
        entry({
          cssVar: toCssVar(leaf.path),
          tailwind: typographyTailwind(name),
          resolves: formatValue(leaf),
        }),
    ),
    radius: toEntries(
      matchByName('primitive', 'radius', PRIMITIVE_RADIUS_VALUES, primitiveLeaves),
      ({ name, leaf }) =>
        entry({
          cssVar: toCssVar(leaf.path),
          tailwind: `rounded-afds-${name}`,
          resolves: formatValue(leaf),
        }),
    ),
    spacing: toEntries(
      matchByName('primitive', 'spacing', PRIMITIVE_SPACING_VALUES, primitiveLeaves),
      ({ name, leaf }) =>
        entry({
          cssVar: toCssVar(leaf.path),
          // 접두사 교체 가능(p/px/py/m/gap 등). p 를 대표로 싣는다.
          tailwind: `p-afds-${name}`,
          resolves: formatValue(leaf),
        }),
    ),
  }

  // ---- semantic ----
  // JSON 이 `color` 로 한 번 더 감싸여 있다. 매니페스트의 카테고리는 그 아래 레이어(icon/bg/text/…)다.
  const semantic: TokenLayer = {}
  for (const { name, leaf } of matchByName(
    'semantic',
    'color',
    SEMANTIC_COLOR_VALUES,
    semanticLeaves,
  )) {
    const category = normalizeSegment(leaf.path[1])
    const role = leaf.path.slice(2).map(normalizeSegment).join('-')
    const prefix = SEMANTIC_TAILWIND_PREFIX[category]
    semantic[category] ??= {}
    semantic[category][role] = entry({
      cssVar: toCssVar(leaf.path),
      tailwind: prefix ? `${prefix}-afds-${name}` : undefined,
      resolves: formatValue(leaf),
    })
  }

  const custom: TokenLayer = {
    text: toEntries(
      matchByName('custom', 'text', CUSTOM_TEXT_VALUES, customLeaves),
      ({ name, leaf }) => {
        // typography 합성 토큰은 CSS 변수가 아니라 `@utility {name}` 으로 나간다.
        const v = (leaf.value ?? {}) as Record<string, unknown>
        return entry({
          tailwind: name,
          resolves: formatTypography(
            resolvePrimitive(v.fontSize),
            resolvePrimitive(v.lineHeight),
            resolvePrimitive(v.fontWeight),
          ),
        })
      },
    ),
    shadow: toEntries(
      matchByName('custom', 'shadow', CUSTOM_SHADOW_VALUES, customLeaves),
      ({ name, leaf }) =>
        entry({
          cssVar: toCssVar(leaf.path),
          tailwind: `shadow-afds-${name}`,
          resolves: formatValue(leaf),
        }),
    ),
    duration: toEntries(
      matchByName('custom', 'duration', CUSTOM_DURATION_VALUES, customLeaves),
      ({ leaf }) =>
        entry({
          // @theme 변수가 --animation-* 이라 Tailwind 유틸리티가 생기지 않는다 → CSS 변수로만 쓴다.
          cssVar: toCssVar(leaf.path),
          resolves: formatValue(leaf),
        }),
    ),
  }

  return { semantic, primitive, custom }
}

// llms.txt — 토큰 섹션

const SEMANTIC_CATEGORY_LABELS: Record<string, { label: string; prefix: string }> = {
  icon: { label: 'Color · Icon', prefix: 'text-afds-icon-' },
  bg: { label: 'Color · Background', prefix: 'bg-afds-bg-' },
  text: { label: 'Color · Text', prefix: 'text-afds-text-' },
  border: { label: 'Color · Border', prefix: 'border-afds-border-' },
  divider: { label: 'Color · Divider', prefix: 'border-afds-divider-' },
  interaction: { label: 'Color · Interaction', prefix: 'bg-afds-interaction-' },
}

/** 표시 순서. 여기에 없는 카테고리도 조용히 빠지지 않고 뒤에 이어 붙는다. */
const SEMANTIC_ORDER = ['icon', 'bg', 'text', 'border', 'divider', 'interaction']

/** primitive color 표시 순서. 어느 접두사에도 안 맞는 색은 'other' 로 모아 반드시 노출한다. */
const PRIMITIVE_COLOR_GROUPS = ['brand', 'gray', 'extra-ui', 'extra-graph', 'alpha']

/** 지정 순서를 먼저, 나머지를 그 뒤에 — 순서 목록에 빠진 항목이 사라지지 않게 한다. */
function orderedKeys(keys: string[], order: string[]): string[] {
  const known = order.filter(k => keys.includes(k))
  return [...known, ...keys.filter(k => !known.includes(k))]
}

export function renderTokenSections(tokens: TokenInfo): string[] {
  const { semantic, primitive, custom } = tokens
  const lines: string[] = []

  lines.push(`## Design Tokens`)
  lines.push(``)
  lines.push(
    `> Semantic 토큰을 최우선으로 사용하라. Primitive는 Semantic에 정의되지 않은 경우에만 참조하고,`,
  )
  lines.push(`> 원시 값(#hex)은 절대 직접 사용하지 않는다.`)
  lines.push(``)
  lines.push(`### Semantic`)
  lines.push(``)

  // llms.txt 는 최종 값을 보여야 한다 — semantic 의 `resolves` 는 CSS 선언과 1:1 이어야 가드가
  // 성립하므로 참조(`var(--afds-color-gray-0)`) 형태로 두고, 표시할 때만 원시 값으로 푼다.
  const primitiveValueByCssVar = new Map<string, string>()
  for (const entries of Object.values(primitive)) {
    for (const e of Object.values(entries)) {
      if (e.cssVar && e.resolves) primitiveValueByCssVar.set(e.cssVar, e.resolves)
    }
  }
  const displayValue = (resolves?: string): string | undefined => {
    if (!resolves) return undefined
    const ref = resolves.match(/^var\(\s*(--[a-z0-9-]+)\s*\)$/i)
    return (ref && primitiveValueByCssVar.get(ref[1])) ?? resolves
  }

  for (const cat of orderedKeys(Object.keys(semantic), SEMANTIC_ORDER)) {
    const entries = semantic[cat]
    if (!entries || Object.keys(entries).length === 0) continue
    const meta = SEMANTIC_CATEGORY_LABELS[cat] ?? { label: `Color · ${cat}`, prefix: '' }
    const prefixHint = meta.prefix
      ? ` (Tailwind prefix: \`${meta.prefix.slice(0, -1)}-\`)`
      : ` (CSS var only)`
    lines.push(`#### ${meta.label}${prefixHint}`)
    lines.push(``)
    for (const tokenEntry of Object.values(entries)) {
      const twPart = tokenEntry.tailwind ? `\`${tokenEntry.tailwind}\`` : `\`${tokenEntry.cssVar}\``
      const shown = displayValue(tokenEntry.resolves)
      lines.push(`- ${twPart}${shown ? ` → ${shown}` : ''}`)
    }
    lines.push(``)
  }

  lines.push(`### Primitive (Semantic에 없는 경우만 참조)`)
  lines.push(``)

  const primColor = primitive['color'] ?? {}
  const colorGroupOf = (key: string) =>
    PRIMITIVE_COLOR_GROUPS.find(g => key.startsWith(`${g}-`)) ?? 'other'
  const byGroup = new Map<string, string[]>()
  for (const key of Object.keys(primColor)) {
    const group = colorGroupOf(key)
    byGroup.set(group, [...(byGroup.get(group) ?? []), key])
  }
  for (const group of orderedKeys([...byGroup.keys()], PRIMITIVE_COLOR_GROUPS)) {
    const keys = byGroup.get(group) ?? []
    if (keys.length === 0) continue
    const rendered = keys.map(k => `\`bg-afds-${k}\` → ${primColor[k].resolves ?? ''}`.trim())
    lines.push(`- **${group}**: ${rendered.join(', ')}`)
  }
  lines.push(``)

  const primTypo = primitive['typography'] ?? {}
  const withResolves = (e: TokenEntry) => `\`${e.tailwind}\`${e.resolves ? ` → ${e.resolves}` : ''}`
  const fontSizeEntries = Object.values(primTypo).filter(e => e.tailwind?.startsWith('text-afds-'))
  const lineHeightEntries = Object.values(primTypo).filter(e => e.tailwind?.startsWith('leading-'))
  const fontWeightEntries = Object.values(primTypo).filter(e =>
    e.tailwind?.startsWith('font-afds-'),
  )
  const radiusEntries = Object.values(primitive['radius'] ?? {})
  const spacingEntries = Object.values(primitive['spacing'] ?? {})

  if (fontSizeEntries.length > 0)
    lines.push(`- **fontSize**: ${fontSizeEntries.map(withResolves).join(', ')}`)
  if (lineHeightEntries.length > 0)
    lines.push(`- **lineHeight**: ${lineHeightEntries.map(withResolves).join(', ')}`)
  if (fontWeightEntries.length > 0)
    lines.push(`- **fontWeight**: ${fontWeightEntries.map(withResolves).join(', ')}`)
  if (radiusEntries.length > 0)
    lines.push(`- **radius**: ${radiusEntries.map(withResolves).join(', ')}`)
  if (spacingEntries.length > 0)
    lines.push(
      `- **spacing** (prefix 교체 가능: p/m/gap/px/py 등): ${spacingEntries.map(withResolves).join(', ')}`,
    )
  lines.push(``)

  lines.push(`### Custom`)
  lines.push(``)
  const textEntries = Object.entries(custom['text'] ?? {})
  if (textEntries.length > 0)
    lines.push(
      `- **typography utilities** (클래스명 그대로 사용): ` +
        textEntries.map(([k, e]) => `\`${k}\`${e.resolves ? ` → ${e.resolves}` : ''}`).join(', '),
    )
  const shadowEntries = Object.values(custom['shadow'] ?? {})
  if (shadowEntries.length > 0)
    lines.push(`- **shadow**: ${shadowEntries.map(withResolves).join(', ')}`)
  const durationEntries = Object.values(custom['duration'] ?? {})
  if (durationEntries.length > 0)
    lines.push(
      `- **duration**: ${durationEntries.map(e => `\`${e.cssVar}\`${e.resolves ? ` → ${e.resolves}` : ''}`).join(', ')}`,
    )
  lines.push(``)

  return lines
}

// 가드 — 산출물이 tokens/*.css 와 실제로 맞는지 검증

// tokens/index.css 가 import 하는 범위와 맞춘다. effects 를 빼면 gradient 유틸을 계약에 넣는
// 순간 실존 유틸을 거짓 실패시킨다. (tokens.dark.css 는 파이프라인이 만들지 않는 고아 파일이었고 삭제됐다)
const GUARDED_CSS_FILES = [
  'tokens.css',
  'tokens.semantic.css',
  'tokens.custom.css',
  'tokens.effects.css',
]

interface CssFacts {
  /** 선언된 CSS 커스텀 프로퍼티 → 값 */
  declarations: Map<string, string>
  /** `@utility {name}` → 그 본문의 속성 → 값. 이름뿐 아니라 본문까지 담아야 값을 검증할 수 있다. */
  utilities: Map<string, Map<string, string>>
}

/** tokens/*.css 를 postcss AST 로 읽는다 — substring 검사보다 포맷 변화에 견고하다. */
export function readCssFacts(tokensDir: string): CssFacts {
  const declarations = new Map<string, string>()
  const utilities = new Map<string, Map<string, string>>()
  for (const file of GUARDED_CSS_FILES) {
    const root = postcss.parse(readFileSync(join(tokensDir, file), 'utf-8'))
    root.walkDecls(decl => {
      if (decl.prop.startsWith('--')) declarations.set(decl.prop, decl.value.trim())
    })
    root.walkAtRules('utility', rule => {
      const body = new Map<string, string>()
      rule.walkDecls(decl => {
        body.set(decl.prop.trim(), decl.value.trim())
      })
      utilities.set(rule.params.trim(), body)
    })
  }
  return { declarations, utilities }
}

/** `var(--afds-…)` 를 실제 선언 값으로 푼다. 참조가 아니면 그대로 돌려준다. */
function derefCssValue(
  raw: string | undefined,
  declarations: Map<string, string>,
): string | undefined {
  if (raw === undefined) return undefined
  const ref = raw.match(/^var\(\s*(--[a-z0-9-]+)\s*\)$/i)
  return ref ? declarations.get(ref[1]) : raw
}

/**
 * `@utility` 본문에서 그 유틸리티가 실제로 만들어내는 값을 읽는다.
 * CSS 변수가 없는 토큰(typography 합성)의 값을 검증하는 유일한 근거다.
 * 본문을 해석할 수 없으면 undefined 를 돌려주고, 호출부는 그것을 통과가 아니라 실패로 다룬다.
 */
function readUtilityValue(
  body: Map<string, string>,
  declarations: Map<string, string>,
): string | undefined {
  return formatTypography(
    derefCssValue(body.get('font-size'), declarations),
    derefCssValue(body.get('line-height'), declarations),
    derefCssValue(body.get('font-weight'), declarations),
  )
}

/**
 * Tailwind 유틸리티 접두사 → 그 유틸을 만들어내는 `@theme` 변수 네임스페이스 후보.
 * `text-` 는 색(`--color-afds-text-primary`)과 글자크기(`--text-afds-s-36`) 양쪽이 가능하다.
 */
const TAILWIND_THEME_NAMESPACES: Record<string, string[]> = {
  bg: ['--color-'],
  text: ['--color-', '--text-'],
  border: ['--color-'],
  ring: ['--color-'],
  rounded: ['--radius-'],
  p: ['--spacing-'],
  leading: ['--leading-'],
  font: ['--font-weight-'],
  shadow: ['--shadow-'],
}

/**
 * 엔트리 키가 가리켜야 하는 CSS 커스텀 프로퍼티를 되짚는다.
 *
 * 값 대조만으로는 **값이 같은 토큰끼리 맞바꿔도** 통과한다(실측: resolves 가 겹치는 그룹 19개 —
 * `bg-surface`/`bg-canvas` 는 둘 다 `var(--afds-color-gray-0)`, `body3`/`caption1` 은 둘 다
 * `12px/16px 500`). 신원까지 확인해야 그 부류가 닫힌다.
 */
function expectedCssVar(layerName: string, category: string, role: string): string {
  // semantic 은 JSON 이 color 로 한 번 더 감싸여 있어 CSS 이름에도 color 가 들어간다.
  return layerName === 'semantic'
    ? `--afds-color-${category}-${role}`
    : `--afds-${category}-${role}`
}

/**
 * `tailwind` 가 실제로 존재하는 클래스인지 확인한다. 에이전트가 JSX 에 복사해 넣는 값이므로
 * 없는 이름을 계약에 실어 배포하는 것은 이번 결함과 같은 부류다.
 * 근거는 `@theme` 변수(`--color-afds-*` 등) 또는 `@utility` 등록이다.
 */
function tailwindProblem(tailwind: string, facts: CssFacts): string | undefined {
  const marker = tailwind.indexOf('-afds-')
  if (marker < 0) {
    // 접두사 없는 이름은 `@utility` 로 등록된 클래스여야 한다.
    return facts.utilities.has(tailwind)
      ? undefined
      : `tailwind '${tailwind}' 가 @utility 로 등록돼 있지 않다`
  }
  const prefix = tailwind.slice(0, marker)
  const suffix = tailwind.slice(marker + 1)
  const namespaces = TAILWIND_THEME_NAMESPACES[prefix]
  if (!namespaces) {
    return `tailwind '${tailwind}' 의 접두사 '${prefix}-' 를 @theme 네임스페이스로 해석할 수 없다`
  }
  const candidates = namespaces.map(ns => ns + suffix)
  return candidates.some(candidate => facts.declarations.has(candidate))
    ? undefined
    : `tailwind '${tailwind}' 를 뒷받침하는 @theme 변수가 없다 (${candidates.join(' 또는 ')})`
}

function countEntries(layer: TokenLayer): number {
  return Object.values(layer).reduce((sum, cat) => sum + Object.keys(cat).length, 0)
}

/** 매니페스트에 실린 토큰 총 개수 — 빌드 로그용. */
export function countTokenEntries(tokens: TokenInfo): number {
  return (
    countEntries(tokens.primitive) + countEntries(tokens.semantic) + countEntries(tokens.custom)
  )
}

const collapse = (s: string) => s.replace(/\s+/g, ' ').trim()

/**
 * 매니페스트 토큰이 `tokens/*.css` 와 맞는지 검증하고, 어긋나면 throw 한다.
 *
 * 네 방향을 모두 본다.
 * 1. 실존 — `cssVar`·`tailwind` 가 CSS 에 실제로 있는가 (`tailwind` 는 `@theme` 변수로 역산)
 * 2. 값   — `resolves` 가 CSS 선언(또는 `@utility` 본문)의 값과 같은가
 * 3. 신원 — 그 CSS 이름이 **이 토큰의 것**인가 (값이 같은 토큰끼리 맞바꿈 탐지)
 * 4. 역방향 — CSS 에 있는 토큰을 매니페스트가 빠뜨리지 않았는가 (조용한 누락 탐지)
 *
 * 근거를 찾지 못하면 통과시키지 않는다 — 검증 면제 경로를 두지 않는다.
 *
 * 이 결함(토큰 전량 드롭)이 조용히 배포된 이유는 파서 버그가 아니라 검증 부재였다.
 * build.ts 가 산출 직후 이 함수를 호출해 빌드를 실패시킨다.
 */
export function verifyTokenManifest(tokens: TokenInfo, tokensDir: string): void {
  const facts = readCssFacts(tokensDir)
  const { declarations, utilities } = facts
  const problems: string[] = []
  /** 매니페스트가 실제로 싣고 있는 CSS 이름 — 역방향 비교용 */
  const claimedVars = new Set<string>()
  const claimedUtilities = new Set<string>()

  for (const [layerName, layer] of Object.entries(tokens)) {
    const count = countEntries(layer as TokenLayer)
    if (count === 0) {
      problems.push(`${layerName}: 엔트리가 0개다 (토큰 파서가 leaf 를 하나도 인식하지 못했다)`)
      continue
    }
    for (const [category, entries] of Object.entries(layer as TokenLayer)) {
      for (const [role, tokenEntry] of Object.entries(entries)) {
        const at = `${layerName}.${category}.${role}`
        // 값 없는 엔트리는 소비 프로젝트가 rounded-[5px] 를 쓰게 만든 바로 그 구멍이다.
        if (!tokenEntry.resolves) {
          problems.push(`${at}: resolves 가 비었다 (토큰 값을 읽지 못했다)`)
        }

        // 모든 엔트리는 CSS 에 값의 근거가 있어야 한다. cssVar 가 없는 것이 검증 면제가 되어선
        // 안 되므로(cssVar 를 지우고 실존 유틸명만 넣으면 값 검사를 빠져나갈 수 있었다),
        // 근거를 못 찾으면 통과가 아니라 실패로 다룬다.
        let cssValue: string | undefined
        let source: string | undefined
        if (tokenEntry.cssVar) {
          claimedVars.add(tokenEntry.cssVar)
          source = `CSS 선언 ${tokenEntry.cssVar}`
          cssValue = declarations.get(tokenEntry.cssVar)
          if (cssValue === undefined) {
            problems.push(`${at}: cssVar '${tokenEntry.cssVar}' 가 tokens/*.css 에 없다`)
          }
          const expected = expectedCssVar(layerName, category, role)
          if (tokenEntry.cssVar !== expected) {
            problems.push(
              `${at}: cssVar '${tokenEntry.cssVar}' 는 이 토큰의 이름이 아니다 (기대 '${expected}')`,
            )
          }
        } else if (tokenEntry.tailwind && utilities.has(tokenEntry.tailwind)) {
          // CSS 변수 없이 `@utility` 로만 나가는 토큰(typography 합성)은 본문을 파싱해 값을 얻는다.
          claimedUtilities.add(tokenEntry.tailwind)
          source = `@utility ${tokenEntry.tailwind}`
          cssValue = readUtilityValue(utilities.get(tokenEntry.tailwind)!, declarations)
          if (cssValue === undefined) {
            problems.push(
              `${at}: '@utility ${tokenEntry.tailwind}' 본문에서 값을 읽지 못해 resolves 를 검증할 수 없다`,
            )
          }
          if (tokenEntry.tailwind !== role) {
            problems.push(
              `${at}: '@utility ${tokenEntry.tailwind}' 는 이 토큰의 이름이 아니다 (기대 '${role}')`,
            )
          }
        } else if (tokenEntry.tailwind) {
          problems.push(
            `${at}: cssVar 도 '@utility ${tokenEntry.tailwind}' 도 tokens/*.css 에 없다`,
          )
        } else {
          problems.push(`${at}: cssVar 도 tailwind 도 없다 (쓸 수 없는 토큰)`)
        }

        if (tokenEntry.resolves && cssValue !== undefined) {
          if (collapse(tokenEntry.resolves) !== collapse(cssValue)) {
            problems.push(
              `${at}: resolves '${tokenEntry.resolves}' 가 ${source} 의 값 '${cssValue}' 와 다르다`,
            )
          }
        }

        // `tailwind` 는 cssVar 유무와 무관하게 검증한다 — 에이전트가 JSX 에 복사하는 값이다.
        if (tokenEntry.tailwind) {
          const problem = tailwindProblem(tokenEntry.tailwind, facts)
          if (problem) problems.push(`${at}: ${problem}`)
        }
      }
    }
  }

  // 역방향 — CSS 에 있는 토큰을 매니페스트가 빠뜨렸는지 본다. 이번 결함이 '조용한 누락'이었고,
  // 매니페스트만 순회하면 엔트리가 몇 개 사라져도 빌드가 초록이다.
  for (const declared of declarations.keys()) {
    if (!declared.startsWith('--afds-')) continue // @theme 변수(--color-afds-* 등)는 토큰 자체가 아니다
    if (!claimedVars.has(declared)) {
      problems.push(`누락: '${declared}' 가 tokens/*.css 에 선언됐으나 매니페스트에 없다`)
    }
  }
  for (const [name, body] of utilities) {
    // 값을 조립할 수 있는 유틸(typography 합성)만 계약 대상이다. gradient 등은 계약 밖(일감 D).
    if (readUtilityValue(body, declarations) === undefined) continue
    if (!claimedUtilities.has(name)) {
      problems.push(`누락: '@utility ${name}' 가 tokens/*.css 에 있으나 매니페스트에 없다`)
    }
  }

  if (problems.length > 0) {
    const shown = problems.slice(0, 10)
    const rest = problems.length - shown.length
    throw new Error(
      `token-manifest: 매니페스트 토큰이 tokens/*.css 와 맞지 않는다 (${problems.length}건)\n  ` +
        shown.join('\n  ') +
        (rest > 0 ? `\n  … 외 ${rest}건` : ''),
    )
  }
}
