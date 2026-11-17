#!/usr/bin/env node
// 패키지 경계 검사.
//
//   R1  소스(ts/tsx/js/mjs/cjs)에서 **자기 패키지 밖으로 나가는 상대경로**
//       import / require / export-from 금지.
//   R3  각 package.json 의 워크스페이스 패키지 의존(dependencies·devDependencies·
//       peerDependencies·optionalDependencies)이 ALLOWED_EDGES 안인지.
//
// R2(exports 밖 deep import)·R4(미선언 import)는 일부러 없다 — pnpm 의 격리된
// node_modules 가 선언 안 된 패키지를 해석하지 못하게 하고, `moduleResolution: bundler`
// 가 exports 맵 밖 경로를 막는다. 같은 것을 정규식으로 다시 막지 않는다.
//
// 사용: node check-package-boundaries.mjs [루트]   (기본: 이 파일 기준 저장소 루트)
// 위반마다 `::error file=…::…`, 위반이 있거나 소스를 한 파일도 못 읽으면 exit 1.
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

// 허용 간선: 의존하는 쪽 패키지 이름 → 의존해도 되는 패키지 이름 목록.
// 실측 방향(storybook→afds, afds-registry→afds, afds→figma-token-bridge,
// figma-token-bridge→tsconfig)을 고정한다. 새 간선은 여기서 리뷰 대상이다.
const ALLOWED_EDGES = {
  '@turbo-project/storybook-app': ['@turbo-project/afds'],
  '@turbo-project/afds-registry': ['@turbo-project/afds'],
  '@turbo-project/afds': ['figma-token-bridge'],
  'figma-token-bridge': ['@turbo-project/tsconfig'],
}
// config 패키지는 어디서든 의존해도 된다.
const CONFIG_PACKAGES = new Set([
  '@turbo-project/eslint-config',
  '@turbo-project/prettier-config',
  '@turbo-project/tsconfig',
])

const ROOT = resolve(process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), '..', '..'))
const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  'coverage',
  'storybook-static',
  '.turbo',
])
const SOURCE_EXT = /\.(ts|tsx|js|mjs|cjs)$/
// 줄 머리의 import/export 문과 따옴표·백틱 뒤가 아닌 import()/require(). 테스트 픽스처 문자열
// (`import … from '../../x'` 를 템플릿에 담은 것)은 코드가 아니므로 줄 머리 고정으로 거른다.
const SPEC_RE =
  /^[ \t]*(?:(?:import|export)\b[^'"`;]*?\bfrom\s*|import\s*)(['"])(\.{1,2}(?:\/[^'"]*)?)\1|(?<![\w'"`.])(?:import|require)\s*\(\s*(['"`])(\.{1,2}(?:\/[^'"`]*)?)\3/gm

// R1 예외 — `파일|경로 문자열`. 코드 import 지만 패키지 밖 정본 파일을 읽는 실측 사례.
const ALLOWED_RELATIVE = new Set([
  // 루트 registry.json 은 shadcn 레지스트리 정본이고 afds-registry 테스트가 정합을 검증한다.
  'packages/afds-registry/src/__tests__/registry-consistency.test.ts|../../../../registry.json',
  'packages/afds-registry/src/__tests__/shadcn-registry-closure.test.ts|../../../../registry.json',
  'packages/afds-registry/src/__tests__/spec-description.test.ts|../../../../registry.json',
])

function walk(dir, out) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) walk(join(dir, e.name), out)
    } else out.push(join(dir, e.name))
  }
  return out
}

const files = ['packages', 'apps'].flatMap(d => {
  try {
    return walk(join(ROOT, d), [])
  } catch (err) {
    if (err.code === 'ENOENT') return []
    throw err
  }
})

// 패키지 = package.json 이 있는 디렉터리.
const pkgs = files
  .filter(f => f.endsWith(`${sep}package.json`))
  .map(f => ({ dir: dirname(f), file: f, json: JSON.parse(readFileSync(f, 'utf8')) }))
const rel = p => relative(ROOT, p).split(sep).join('/')
const ownerOf = p =>
  pkgs
    .filter(k => p === k.dir || p.startsWith(k.dir + sep))
    .sort((a, b) => b.dir.length - a.dir.length)[0]

const errors = []
const fail = (file, msg) => errors.push(`::error file=${rel(file)}::${msg}`)

// R3
const names = new Set(pkgs.map(k => k.json.name))
for (const k of pkgs) {
  const allowed = ALLOWED_EDGES[k.json.name] ?? []
  for (const field of [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies',
  ]) {
    for (const dep of Object.keys(k.json[field] ?? {})) {
      if (!names.has(dep) || CONFIG_PACKAGES.has(dep) || allowed.includes(dep)) continue
      fail(
        k.file,
        `R3 허용 밖 패키지 간선: ${k.json.name} → ${dep} (${field}). ALLOWED_EDGES 는 리뷰 대상이다.`,
      )
    }
  }
}

// R1
const sources = files.filter(f => SOURCE_EXT.test(f))
for (const f of sources) {
  const me = ownerOf(f)
  const src = readFileSync(f, 'utf8')
  for (const m of src.matchAll(SPEC_RE)) {
    const spec = m[2] ?? m[4]
    // 보간이 든 템플릿은 정적으로 풀 수 없다 — 경로로 보지 않는다.
    if (m[3] === '`' && spec.includes('${')) continue
    if (ALLOWED_RELATIVE.has(`${rel(f)}|${spec}`)) continue
    const target = resolve(dirname(f), spec)
    const other = ownerOf(target)
    if (other !== me) {
      const where = other ? rel(other.dir) : '패키지 밖'
      fail(
        f,
        `R1 다른 패키지로 넘어가는 상대경로 '${spec}' → ${where}. 패키지 이름으로 import 하라.`,
      )
    }
  }
}

if (sources.length === 0) {
  console.log('::error::소스를 한 파일도 읽지 못했다 — 루트 경로를 확인하라: ' + ROOT)
  process.exit(1)
}
for (const e of errors) console.log(e)
console.log(`패키지 ${pkgs.length}개 · 소스 ${sources.length}개 검사 — 위반 ${errors.length}건`)
process.exit(errors.length ? 1 : 0)
