/**
 * AFDS Build Script
 *
 * Build order:
 * 1. tsup → JS files (bundle: false, per-component structure)
 * 2. tsc → DTS declarations for src/ and tokens/
 * 3. Prune empty dirs left by tsup bundle:false
 * 4. Tailwind CSS → dist/styles/index.css
 * 5. manifest + llms.txt → Agent documentation
 * 5.5. 토큰 매니페스트를 tokens/*.css 와 대조 검증 (어긋나면 빌드 실패)
 */
import { execSync } from 'node:child_process'
import { readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import postcss from 'postcss'
import { scopeAfdsPreflight } from '../src/postcss/scope-afds-preflight'
import {
  countTokenEntries,
  verifyTokenManifest,
  type TokenInfo,
  type TokenLayer,
} from './tokens-manifest'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

function run(cmd: string) {
  console.log(`\n$ ${cmd}`)
  const nodeOptions = [process.env.NODE_OPTIONS, '--max-old-space-size=4096']
    .filter(Boolean)
    .join(' ')

  execSync(cmd, {
    stdio: 'inherit',
    cwd: ROOT,
    env: { ...process.env, NODE_OPTIONS: nodeOptions },
  })
}

const SKIP_EXT_RE =
  /\.(js|mjs|cjs|jsx|css|json|svg|png|jpg|jpeg|gif|webp|woff2?|ttf|otf|md|html|wasm)(\?.*)?$/i
const SPEC_RE =
  /(from\s+|import\s*\(\s*|import\s+|export\s+\*\s+from\s+|export\s+\{[^}]*\}\s+from\s+)(['"])(\.{1,2}\/[^'"]+)(['"])/g

function fileExists(p: string): boolean {
  try {
    return statSync(p).isFile()
  } catch {
    return false
  }
}

function rewriteExt(
  fromFile: string,
  spec: string,
  resolveExt: string,
  specExt: string,
): string | null {
  const base = resolve(dirname(fromFile), spec)
  if (fileExists(base + resolveExt)) return spec + specExt
  if (fileExists(join(base, 'index' + resolveExt)))
    return spec.replace(/\/$/, '') + '/index' + specExt
  return null
}

/** Recursively adds explicit `.js`/`.cjs` extensions to relative imports in dist. */
function addImportExtensions(dir: string): {
  files: number
  imports: number
  unresolved: string[]
} {
  let files = 0
  let imports = 0
  const unresolved: string[] = []

  function walk(d: string) {
    for (const entry of readdirSync(d)) {
      const full = join(d, entry)
      const st = statSync(full)
      if (st.isDirectory()) {
        walk(full)
        continue
      }
      // .d.cts → resolve sibling .d.cts but write .cjs ref in spec
      // .d.ts  → resolve sibling .d.ts  but write .js  ref in spec
      // .cjs/.js → resolve and write matching extension
      let resolveExt: string
      let specExt: string
      if (entry.endsWith('.d.cts')) {
        resolveExt = '.d.cts'
        specExt = '.cjs'
      } else if (entry.endsWith('.d.ts')) {
        resolveExt = '.d.ts'
        specExt = '.js'
      } else if (entry.endsWith('.cjs')) {
        resolveExt = '.cjs'
        specExt = '.cjs'
      } else if (entry.endsWith('.js')) {
        resolveExt = '.js'
        specExt = '.js'
      } else {
        continue
      }
      const src = readFileSync(full, 'utf8')
      let touched = false
      const out = src.replace(SPEC_RE, (whole, prefix, q1, spec, q2) => {
        if (SKIP_EXT_RE.test(spec)) return whole
        if (spec.includes('?')) return whole
        const next = rewriteExt(full, spec, resolveExt, specExt)
        if (!next) {
          unresolved.push(`${full}: ${spec}`)
          return whole
        }
        touched = true
        imports++
        return `${prefix}${q1}${next}${q2}`
      })
      if (touched) {
        writeFileSync(full, out)
        files++
      }
    }
  }

  walk(dir)
  return { files, imports, unresolved }
}

/** Recursively removes directories that contain no files. */
function pruneEmptyDirs(dir: string): boolean {
  let hasFiles = false
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      const childHasFiles = pruneEmptyDirs(full)
      if (!childHasFiles) rmSync(full, { recursive: true })
      else hasFiles = true
    } else {
      hasFiles = true
    }
  }
  return hasFiles
}

console.log('🏗️  AFDS Build')
console.log('================\n')

// Step 1: Compile JS files (one file per source file, no bundling)
run('npx tsup --config tsup.config.ts')

// Step 2: Generate TypeScript declarations
run('npx tsc -p tsconfig.build.json')

// Step 3: Prune empty artifact dirs left by tsup bundle:false
console.log('\n$ pruning empty dirs in dist/')
pruneEmptyDirs(join(ROOT, 'dist'))

// Step 3.5: Add explicit .js/.cjs extensions to relative imports for strict ESM compat
console.log('\n$ adding explicit import extensions to dist/')
const extResult = addImportExtensions(join(ROOT, 'dist'))
console.log(`  rewrote ${extResult.imports} imports in ${extResult.files} files`)
if (extResult.unresolved.length) {
  console.warn(`  ⚠️  unresolved (${extResult.unresolved.length}):`)
  for (const u of extResult.unresolved) console.warn('    ' + u)
}

// Step 4: Compile Tailwind CSS
run('npx @tailwindcss/cli -i src/styles/index.css -o dist/styles/index.css --minify')

// Step 4.5: Scope preflight(@layer base) + theme 변수(:root,:host) → dist/styles/scoped.css
//           (opt-in 공존용. index.css 전역 산출물은 불변)
console.log('\n$ scoping preflight + theme vars → dist/styles/scoped.css')
const stylesDir = join(ROOT, 'dist', 'styles')
const indexCssPath = join(stylesDir, 'index.css')
const indexCss = readFileSync(indexCssPath, 'utf8')
// Tailwind 가 향후 preflight 를 @layer base 밖으로 옮기면 스코핑이 no-op 이 되므로 조용한 누락 대신 실패.
if (!indexCss.includes('@layer base')) {
  throw new Error(
    'scope-afds-preflight: "@layer base" not found in dist/styles/index.css — Tailwind output structure changed; scoping would be a no-op',
  )
}
const scopedCss = postcss([scopeAfdsPreflight()]).process(indexCss, { from: undefined }).css

// 누수 가드(AST): 변환 후 bare 루트성 셀렉터(:root/:host/html/body — 변환 규칙의 ROOTISH 와 동일)가
// 남으면 host 로 새므로 빌드 실패. substring 이 아니라 postcss 파싱으로 검사해 Tailwind 출력 포맷 변화에 견고.
const ROOTISH_GUARD = new Set([':root', ':host', 'html', 'body'])
const leaks = new Set<string>()
postcss.parse(scopedCss).walkRules(rule => {
  for (const sel of rule.selectors) {
    if (ROOTISH_GUARD.has(sel.trim())) leaks.add(rule.selector)
  }
})
if (leaks.size > 0) {
  throw new Error(
    `scope-afds-preflight: scoped.css still declares bare :root/:host (leak): ${[...leaks].slice(0, 5).join(' | ')}`,
  )
}

const scopedCssPath = join(stylesDir, 'scoped.css')
writeFileSync(scopedCssPath, scopedCss)
if (!fileExists(scopedCssPath)) {
  throw new Error('scope-afds-preflight: dist/styles/scoped.css was not written')
}

// Step 5: Generate manifest + llms.txt
run('tsx scripts/generate-manifest.ts')

// Step 5.5: 토큰 매니페스트 가드 — 에이전트 계약(dist/manifest/tokens.*.json)이 비었거나
//           tokens/*.css 에 없는 변수를 담고 있으면 빌드 실패.
//           dist/ 는 gitignore 라 PR diff 에 안 나오고 CI 도 내용을 검사하지 않아, 과거 이 결함이
//           토큰 전량 드롭 상태로 조용히 배포됐다. Step 4.5 누수 가드와 같은 패턴(postcss AST).
console.log('\n$ verifying token manifest against tokens/*.css')
const manifestDir = join(ROOT, 'dist', 'manifest')
const readTokenLayer = (file: string): TokenLayer =>
  JSON.parse(readFileSync(join(manifestDir, file), 'utf8')) as TokenLayer
const tokenManifest: TokenInfo = {
  semantic: readTokenLayer('tokens.semantic.json'),
  primitive: readTokenLayer('tokens.primitive.json'),
  custom: readTokenLayer('tokens.custom.json'),
}
verifyTokenManifest(tokenManifest, join(ROOT, 'tokens'))
console.log(`  ${countTokenEntries(tokenManifest)} tokens verified`)

console.log('\n✅ Build complete!')
