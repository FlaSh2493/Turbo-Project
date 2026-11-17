/**
 * AFDS Components Props → Zod Schemas Generator
 *
 * 각 컴포넌트의 .tsx에서 export된 Props 타입을 읽어
 * sibling `<name>.schema.ts`를 emit한다.
 *
 * 정책:
 * - JSON 직렬화 가능한 prop만 포함 (literal union, boolean, number, string,
 *   위 타입만 가진 객체/배열, 토큰 union)
 * - HTML attr 스프레드(ComponentProps<'X'>)는 declaration source 기준으로 통째 스킵
 * - 함수형 / ReactNode / ReactElement / ref / render / className / style 제외
 * - 토큰 union 타입(PrimitiveSpacing 등)은 token-enums.ts 참조로 emit
 * - <name>.schema.override.ts 존재 시 추출 결과로 덮어쓰지 않음 (별도 파일 그대로 유지)
 */
import { Project, SyntaxKind } from 'ts-morph'
import type { Symbol as MorphSymbol, Type, Node, SourceFile, PropertySignature } from 'ts-morph'
import { readdirSync, statSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { join, dirname, relative, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const SRC = join(ROOT, 'src')
const COMPONENTS_DIR = join(SRC, 'bricks')
const HEADLESS_DIR = join(SRC, 'headless')
const SCHEMAS_DIR = join(SRC, 'schemas')
const TOKEN_ENUMS_PATH = join(SCHEMAS_DIR, 'tokens.schema.ts')

const EXCLUDED_PROP_NAMES = new Set([
  'render',
  'as',
  'className',
  'style',
  'key',
  'ref',
  'children',
])

const TOKEN_TYPE_NAMES = new Set([
  'PrimitiveColor',
  'PrimitiveTypography',
  'PrimitiveRadius',
  'PrimitiveSpacing',
  'SemanticColor',
  'CustomShadow',
  'CustomDuration',
  'CustomBlur',
])

function toScreamingSnake(s: string): string {
  return s.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase()
}

function isExternalDeclaration(filePath: string): boolean {
  return (
    filePath.includes('/node_modules/@types/react/') ||
    filePath.includes('/node_modules/typescript/lib/') ||
    filePath.includes('/typescript/lib/lib.')
  )
}

function isInternalDeclaration(filePath: string): boolean {
  return !isExternalDeclaration(filePath) && !filePath.includes('/node_modules/')
}

/** Property가 외부(React/HTML) 선언에서만 온 것이면 skip */
function isOnlyExternalDeclared(sym: MorphSymbol): boolean {
  const decls = sym.getDeclarations()
  if (decls.length === 0) return false
  return decls.every(d => isExternalDeclaration(d.getSourceFile().getFilePath()))
}

/** Property가 AFDS 컴포넌트 자체에서 선언된 적이 있는지 (재선언 패턴 감지) */
function hasInternalDeclaration(sym: MorphSymbol): boolean {
  return sym.getDeclarations().some(d => isInternalDeclaration(d.getSourceFile().getFilePath()))
}

type ZodResult =
  | { kind: 'emit'; expr: string; extraImports?: Set<string> }
  | { kind: 'skip'; reason: string }

/** Literal/primitive 단위 타입을 zod expression으로 변환. union 처리 등은 호출자 책임. */
function singleTypeToZod(t: Type): ZodResult {
  if (t.isStringLiteral()) {
    return { kind: 'emit', expr: `z.literal('${String(t.getLiteralValue())}')` }
  }
  if (t.isNumberLiteral()) {
    return { kind: 'emit', expr: `z.literal(${String(t.getLiteralValue())})` }
  }
  if (t.isBooleanLiteral()) {
    // true / false literal
    const text = t.getText()
    return { kind: 'emit', expr: `z.literal(${text})` }
  }
  if (t.isBoolean()) return { kind: 'emit', expr: 'z.boolean()' }
  if (t.isString()) return { kind: 'emit', expr: 'z.string()' }
  if (t.isNumber()) return { kind: 'emit', expr: 'z.number()' }
  if (t.isUndefined() || t.isNull()) {
    return { kind: 'skip', reason: 'undefined/null direct' }
  }
  if (t.isAny() || t.isUnknown()) {
    return { kind: 'skip', reason: 'any/unknown' }
  }
  return { kind: 'skip', reason: `unsupported type: ${t.getText().slice(0, 80)}` }
}

/** 토큰 alias union 인지 감지 (PrimitiveSpacing 등) */
function detectTokenAlias(t: Type): string | null {
  const aliasSym = t.getAliasSymbol()
  const name = aliasSym?.getName()
  if (name && TOKEN_TYPE_NAMES.has(name)) return name
  return null
}

/** 선언 노드의 type annotation 텍스트로 token alias 직접 매칭.
 * `gap?: PrimitiveSpacing` 같이 union expand로 alias가 사라지는 케이스를 잡는다. */
function detectTokenAliasFromDeclaration(sym: MorphSymbol): string | null {
  for (const decl of sym.getDeclarations()) {
    if (decl.getKind() !== SyntaxKind.PropertySignature) continue
    const sig = decl as PropertySignature
    const typeNode = sig.getTypeNode()
    if (!typeNode) continue
    const text = typeNode.getText().trim()
    if (TOKEN_TYPE_NAMES.has(text)) return text
  }
  return null
}

/** Property 타입을 zod expression으로 변환 (최상위 진입점) */
function propTypeToZod(t: Type): ZodResult {
  const tokenName = detectTokenAlias(t)
  if (tokenName) {
    return {
      kind: 'emit',
      expr: `z.enum(${toScreamingSnake(tokenName)}_VALUES)`,
      extraImports: new Set([tokenName]),
    }
  }

  if (t.isUnion()) {
    const members = t.getUnionTypes()
    // undefined 제거는 호출자(optional 처리)에서 이미 했을 것이지만 안전망
    const nonUndef = members.filter(m => !m.isUndefined() && !m.isNull())
    if (nonUndef.length === 0) return { kind: 'skip', reason: 'only undefined/null' }

    // 모두 literal이면 z.enum 또는 z.union(literals)
    const allStringLit = nonUndef.every(m => m.isStringLiteral())
    if (allStringLit) {
      const values = nonUndef.map(m => `'${String(m.getLiteralValue())}'`).join(', ')
      return { kind: 'emit', expr: `z.enum([${values}])` }
    }
    const allNumberLit = nonUndef.every(m => m.isNumberLiteral())
    if (allNumberLit) {
      const values = nonUndef.map(m => String(m.getLiteralValue())).join(', ')
      return {
        kind: 'emit',
        expr: `z.union([${nonUndef.map(m => `z.literal(${String(m.getLiteralValue())})`).join(', ')}])`,
      }
    }
    // boolean union (true | false) → z.boolean
    if (nonUndef.every(m => m.isBooleanLiteral() || m.isBoolean())) {
      return { kind: 'emit', expr: 'z.boolean()' }
    }
    // mixed (e.g., string | number) — 안전하게 skip
    return {
      kind: 'skip',
      reason: `mixed union: ${nonUndef
        .map(m => m.getText())
        .join(' | ')
        .slice(0, 80)}`,
    }
  }

  // 함수/객체/배열/ReactNode 등은 단순 분기에서 처리
  if (t.getCallSignatures().length > 0) {
    return { kind: 'skip', reason: 'function type' }
  }
  if (t.isArray()) {
    const el = t.getArrayElementTypeOrThrow()
    const inner = propTypeToZod(el)
    if (inner.kind === 'skip') return { kind: 'skip', reason: `array element: ${inner.reason}` }
    return { kind: 'emit', expr: `z.array(${inner.expr})`, extraImports: inner.extraImports }
  }
  // 단일 primitive
  return singleTypeToZod(t)
}

/** Property symbol에서 optional 여부와 underlying 타입을 추출 */
function resolveProperty(sym: MorphSymbol, contextNode: Node): { optional: boolean; type: Type } {
  const t = sym.getTypeAtLocation(contextNode)
  if (!t.isUnion()) return { optional: false, type: t }

  const members = t.getUnionTypes()
  const hasUndef = members.some(m => m.isUndefined())
  if (!hasUndef) return { optional: false, type: t }

  const nonUndef = members.filter(m => !m.isUndefined())
  if (nonUndef.length === 1) return { optional: true, type: nonUndef[0] }

  // 재구성된 union이 필요 — alias 정보는 보존하기 어려우니 원 type 그대로 반환하고
  // propTypeToZod가 undefined 멤버를 무시하도록 한다.
  return { optional: true, type: t }
}

interface ExtractResult {
  exportName: string
  schemaExpr: string
  imports: Set<string>
  skipped: Array<{ name: string; reason: string }>
}

function extractPropsType(typeName: string, type: Type, contextNode: Node): ExtractResult {
  const imports = new Set<string>()
  const fields: string[] = []
  const skipped: ExtractResult['skipped'] = []
  let hasHtmlAttrSpread = false

  for (const prop of type.getProperties()) {
    const name = prop.getName()
    if (EXCLUDED_PROP_NAMES.has(name)) {
      skipped.push({ name, reason: 'excluded by name policy' })
      continue
    }
    if (isOnlyExternalDeclared(prop) && !hasInternalDeclaration(prop)) {
      skipped.push({ name, reason: 'HTML/React attr (external declaration only)' })
      hasHtmlAttrSpread = true
      continue
    }

    const { optional, type: t } = resolveProperty(prop, contextNode)

    // 선언부 type annotation에서 토큰 alias를 먼저 시도 (alias가 union expand로 사라지는 케이스)
    const tokenFromDecl = detectTokenAliasFromDeclaration(prop)
    if (tokenFromDecl) {
      const expr =
        `z.enum(${toScreamingSnake(tokenFromDecl)}_VALUES)` + (optional ? '.optional()' : '')
      fields.push(`  ${JSON.stringify(name)}: ${expr},`)
      imports.add(tokenFromDecl)
      continue
    }

    const result = propTypeToZod(t)
    if (result.kind === 'skip') {
      skipped.push({ name, reason: result.reason })
      continue
    }

    const expr = optional ? `${result.expr}.optional()` : result.expr
    fields.push(`  ${JSON.stringify(name)}: ${expr},`)
    result.extraImports?.forEach(i => imports.add(i))
  }

  const base = fields.length === 0 ? `z.object({})` : `z.object({\n${fields.join('\n')}\n})`
  const schemaExpr = hasHtmlAttrSpread ? `${base}.passthrough()` : base

  return {
    exportName: `${typeName}Schema`,
    schemaExpr,
    imports,
    skipped,
  }
}

function collectComponentTsxFiles(): string[] {
  const out: string[] = []
  function walk(dir: string) {
    for (const entry of readdirSync(dir)) {
      if (entry === '__test__' || entry === 'node_modules') continue
      const full = join(dir, entry)
      const st = statSync(full)
      if (st.isDirectory()) {
        walk(full)
      } else if (
        entry.endsWith('.tsx') &&
        !entry.endsWith('.stories.tsx') &&
        !entry.endsWith('.test.tsx')
      ) {
        out.push(full)
      }
    }
  }
  walk(COMPONENTS_DIR)
  return out
}

/** 헤드리스 훅 파일만 수집 (`use-*.ts`, context/store/types/test 제외) */
function collectHeadlessTsFiles(): string[] {
  const out: string[] = []
  function walk(dir: string) {
    for (const entry of readdirSync(dir)) {
      if (entry === '__test__' || entry === 'node_modules') continue
      const full = join(dir, entry)
      const st = statSync(full)
      if (st.isDirectory()) {
        walk(full)
        continue
      }
      if (!entry.startsWith('use-')) continue
      if (!entry.endsWith('.ts')) continue
      if (entry.endsWith('.test.ts')) continue
      out.push(full)
    }
  }
  walk(HEADLESS_DIR)
  return out
}

function hasSchemaSuffix(name: string): boolean {
  return name.endsWith('Props') || name.endsWith('Options')
}

function findPropsExports(src: SourceFile): Array<{ name: string; type: Type; node: Node }> {
  const out: Array<{ name: string; type: Type; node: Node }> = []
  for (const iface of src.getInterfaces()) {
    if (!iface.isExported()) continue
    if (!hasSchemaSuffix(iface.getName())) continue
    out.push({ name: iface.getName(), type: iface.getType(), node: iface })
  }
  for (const alias of src.getTypeAliases()) {
    if (!alias.isExported()) continue
    if (!hasSchemaSuffix(alias.getName())) continue
    out.push({ name: alias.getName(), type: alias.getType(), node: alias })
  }
  return out
}

function relativeImportPath(from: string, to: string): string {
  let rel = relative(dirname(from), to).replace(/\\/g, '/')
  if (!rel.startsWith('.')) rel = './' + rel
  return rel.replace(/\.tsx?$/, '')
}

const GENERATED_HEADER = `/**
 * generated by scripts/generate-schemas.ts — DO NOT EDIT DIRECTLY
 * Re-run 'pnpm --filter afds generate:schemas' to update.
 */`

interface PerFileEmit {
  schemaPath: string
  exportNames: string[]
  isOverride: boolean
}

function emitSchemaFile(sourcePath: string, results: ExtractResult[]): PerFileEmit | null {
  // sourcePath: .../src/bricks/action/button/button.tsx
  //          or .../src/headless/calendar/use-calendar.ts
  // schemaPath: .../src/schemas/button.schema.ts (flat)
  //          or .../src/schemas/use-calendar.schema.ts (flat)
  const baseName = sourcePath
    .replace(/\.tsx?$/, '')
    .split('/')
    .pop()!
  const schemaPath = join(SCHEMAS_DIR, `${baseName}.schema.ts`)
  const overridePath = join(SCHEMAS_DIR, `${baseName}.schema.override.ts`)

  if (existsSync(overridePath)) {
    // override가 있으면 .schema.ts는 단순히 override를 re-export
    const overrideRel = `./${baseName}.schema.override`
    const lines = [GENERATED_HEADER, '', `export * from '${overrideRel}'`, '']
    if (!existsSync(SCHEMAS_DIR)) mkdirSync(SCHEMAS_DIR, { recursive: true })
    writeFileSync(schemaPath, lines.join('\n'))
    return { schemaPath, exportNames: [], isOverride: true }
  }

  if (results.length === 0) return null

  // 토큰 enum import 모으기
  const tokenImports = new Set<string>()
  for (const r of results) {
    for (const i of r.imports) {
      tokenImports.add(`${toScreamingSnake(i)}_VALUES`)
    }
  }

  const lines: string[] = [GENERATED_HEADER, '', `import { z } from 'zod'`]
  if (tokenImports.size > 0) {
    const tokenEnumsRel = relativeImportPath(schemaPath, TOKEN_ENUMS_PATH)
    lines.push(`import { ${[...tokenImports].sort().join(', ')} } from '${tokenEnumsRel}'`)
  }
  lines.push('')

  const exportNames: string[] = []
  for (const r of results) {
    lines.push(`export const ${r.exportName} = ${r.schemaExpr}`)
    lines.push('')
    exportNames.push(r.exportName)
  }

  if (!existsSync(SCHEMAS_DIR)) mkdirSync(SCHEMAS_DIR, { recursive: true })
  writeFileSync(schemaPath, lines.join('\n'))
  return { schemaPath, exportNames, isOverride: false }
}

/** 더 이상 소스가 없는 orphan `<name>.schema.ts`를 제거한다.
 * 이번 run에서 생성한 파일 + tokens.schema.ts + 손수 관리하는 override 소스는 보존한다. */
function pruneOrphanSchemaFiles(emits: PerFileEmit[]): string[] {
  if (!existsSync(SCHEMAS_DIR)) return []
  const keep = new Set<string>(['tokens.schema.ts'])
  for (const e of emits) keep.add(basename(e.schemaPath))
  // override 소스(`<name>.schema.override.ts`)와 그 re-export 대상은 보존
  for (const entry of readdirSync(SCHEMAS_DIR)) {
    if (entry.endsWith('.schema.override.ts')) {
      keep.add(entry)
      keep.add(entry.replace('.schema.override.ts', '.schema.ts'))
    }
  }
  const removed: string[] = []
  for (const entry of readdirSync(SCHEMAS_DIR)) {
    if (!entry.endsWith('.schema.ts')) continue
    if (keep.has(entry)) continue
    rmSync(join(SCHEMAS_DIR, entry))
    removed.push(entry)
  }
  return removed
}

function emitIndexFile(emits: PerFileEmit[]): void {
  const lines: string[] = [GENERATED_HEADER, '']
  // tokens.schema.ts가 존재하면 함께 re-export (figma-token-bridge가 zodOutput으로 생성)
  if (existsSync(join(SCHEMAS_DIR, 'tokens.schema.ts'))) {
    lines.push(`export * from './tokens.schema'`)
  }
  for (const e of emits) {
    const rel = relativeImportPath(join(SCHEMAS_DIR, 'index.ts'), e.schemaPath)
    lines.push(`export * from '${rel}'`)
  }
  lines.push('')
  if (!existsSync(SCHEMAS_DIR)) mkdirSync(SCHEMAS_DIR, { recursive: true })
  writeFileSync(join(SCHEMAS_DIR, 'index.ts'), lines.join('\n'))
}

function main() {
  console.log('🧪 AFDS Schema Generation')
  console.log('==========================\n')

  const tsxFiles = collectComponentTsxFiles()
  const headlessFiles = collectHeadlessTsFiles()
  console.log(`Found ${tsxFiles.length} .tsx files in components/`)
  console.log(`Found ${headlessFiles.length} use-*.ts files in headless/\n`)

  const project = new Project({
    tsConfigFilePath: join(ROOT, 'tsconfig.json'),
    skipAddingFilesFromTsConfig: false,
  })

  const emits: PerFileEmit[] = []
  let totalGenerated = 0
  let totalOverridden = 0
  let totalSkippedFiles = 0
  let totalSkippedProps = 0

  for (const filePath of [...tsxFiles, ...headlessFiles]) {
    const src = project.getSourceFile(filePath)
    if (!src) {
      console.warn(`  ⚠️  source not in project: ${relative(ROOT, filePath)}`)
      continue
    }
    const propsExports = findPropsExports(src)
    if (propsExports.length === 0) {
      totalSkippedFiles++
      continue
    }

    const results: ExtractResult[] = propsExports.map(({ name, type, node }) =>
      extractPropsType(name, type, node),
    )
    totalSkippedProps += results.reduce((s, r) => s + r.skipped.length, 0)

    const emit = emitSchemaFile(filePath, results)
    if (!emit) continue
    emits.push(emit)
    if (emit.isOverride) {
      totalOverridden++
      console.log(`  [override] ${relative(ROOT, filePath)}`)
    } else {
      totalGenerated++
    }
  }

  const removed = pruneOrphanSchemaFiles(emits)
  for (const r of removed) console.log(`  [pruned]   ${r}`)
  emitIndexFile(emits)

  console.log(`\nSummary:`)
  console.log(`  generated:    ${totalGenerated}`)
  console.log(`  overridden:   ${totalOverridden}`)
  console.log(`  pruned:       ${removed.length}`)
  console.log(`  no-props:     ${totalSkippedFiles}`)
  console.log(`  skipped props (across all files): ${totalSkippedProps}`)
  console.log(`\n✅ Schema generation complete.`)
}

main()
