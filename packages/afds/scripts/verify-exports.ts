import { execFileSync, spawnSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
} from 'node:fs'
import { builtinModules, createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join, posix, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

/**
 * `package.json` 의 `exports` 가 선언한 모든 타깃이 **실제 배포 tarball 안에서** 존재하고
 * 해소되는지 검증한다.
 *
 * **왜 필요한가.** 이 저장소의 결함이 반복해서 같은 형태였다 — 선언과 산출물이 어긋났고
 * 아무도 확인하지 않았다:
 *
 * - `dist/manifest/tokens.primitive.json` 이 `{}` 로 몇 달간 배포됐다 (CI 는 내용을 안 봤다)
 * - `exports["./compositions"]` 가 `dist/compositions/index.js` 를 가리키는데 기본 `build` 가
 *   그 디렉터리를 제외했다 → 배포본에서 `MODULE_NOT_FOUND`, 컴포지션 23종이 npm 채널에서
 *   도달 불가였다 (이슈 #106). 모노레포 안에서는 `source` 조건으로 해소돼 아무도 몰랐다.
 *
 * **그래서 작업 트리를 보지 않는다.** `npm pack` 으로 실제 tarball 을 만들어 풀고, 그 안에서
 * 검사한다. 작업 트리 검사는 #106 을 만든 것과 같은 실수다 — 로컬에 파일이 있는 것과 배포본에
 * 실리는 것은 다르고, barrel 이 끌어오는 형제 파일이 배포에서 빠져도 로컬 로드는 성공한다.
 *
 * 검사 항목:
 * - **경로 표기** — Node 는 `.`/`..` 세그먼트가 든 타깃을 `ERR_INVALID_PACKAGE_TARGET` 으로
 *   거부한다. 정규화해서 삼키면 가드가 Node 보다 관대해진다. 그런 표기는 실패시킨다.
 * - **tarball 존재 + 파일 여부** — 디렉터리 타깃은 소비처에서 `ERR_UNSUPPORTED_DIR_IMPORT` 다.
 * - **실제 로드** — JS 진입점은 풀어놓은 tarball 에서 `import()` 한다. 전이 의존 파일이
 *   배포에서 빠졌다면 여기서 터진다.
 * - **빈 모듈** — 0바이트 파일·아무것도 내보내지 않는 index 는 존재 검사와 로드 검사를 모두
 *   통과한다. export 개수를 세서 0이면 실패시킨다.
 * - **배열 fallback** — Node 는 하나만 해소되면 성공으로 본다. 전 항목을 필수로 보면 가드가
 *   Node 보다 엄격해져 오탐한다. 그룹 단위로 "≥1 해소" 를 본다.
 * - **서브패스 스냅샷** — `exports` 에서 서브패스를 지워도 "위반 0건" 으로 통과하면, #106 의
 *   그럴듯한 대안 "해결"(선언을 지운다)이 가드를 빠져나간다. 삭제도 **추가도** 스냅샷 등록을
 *   요구한다 — 추가를 그냥 통과시키면 스냅샷이 서서히 부분집합이 되고 새 서브패스가
 *   이후 삭제로부터 보호되지 않는다.
 * - **루트 표면** — #106 을 고치면서 지켜야 할 결정이 "컴포지션을 루트 entry 로 노출하지
 *   않는다"(0.5.1)이다. 루트와 컴포지션 네임스페이스의 **값 동일성**으로 강제한다.
 * - **배포 스크립트** — 루트 `release` 가 컴포지션 포함 빌드(`build:full` 또는
 *   `BUILD_COMPOSITIONS`)로 가지 않을 것. 그 경로에서는 위 루트 표면 단정이 적용되지 않으므로,
 *   한 단어만 바꿔 단정을 통째로 끄는 것을 막는다.
 *
 * **가드가 끝까지 돌았음을 단정한다.** 타깃 모듈이 import 시점에 `process.exit()` 를 부르면
 * 검사 루프 중간에 프로세스가 죽고 남은 타깃은 검사되지 않은 채 exit 0 이 된다 — 로그가
 * 정상처럼 보이므로 가드가 없는 것보다 나쁘다. 그래서 로드 검사는 자식 프로세스에 격리하고,
 * **결과 프레임이 없으면** 실패시킨다(타임아웃도 여기서 걸린다). 결과를 stdout 이나 임시
 * 파일이 아니라 **fd 3** 으로 받는 이유는 `loadInChild` 주석에 적었다 — 둘 다 나중 쓰기가
 * 이겨서 타깃 모듈이 위조할 수 있다.
 *
 * **검사하지 못하는 형태.** 와일드카드 서브패스(`"./bricks/*": "./dist/bricks/*.js"`)는 다루지
 * 않는다. 조용히 통과시키면 "검증했다" 가 거짓이 되고, 존재 검사에 그대로 넣으면 리터럴 `*` 를
 * 못 찾아 "파일 없음" 이라는 거짓 메시지로 정당한 export 를 막는다. 그래서 검사 불가임을 그대로
 * 말하고 실패시킨다 — 그때 고쳐야 할 것은 export 가 아니라 이 가드다. 현재 0건이다.
 *
 * 검사한 수를 **항상 출력**한다. 0건 통과와 실제 통과를 구분할 수 없으면 가드가 있으나 마나다.
 */

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const require = createRequire(import.meta.url)

/** 실제로 파일을 가리키는 조건만 검사한다. `browser`·`node` 같은 플랫폼 조건도 값이 경로면 포함된다. */
const IGNORED_KEYS = new Set(['//', 'comment'])

/**
 * 현재 `exports` 서브패스의 스냅샷. **삭제는 실패, 추가는 허용**이다 — `exports` 축소를
 * "위반 0건" 으로 통과시키지 않기 위한 하한선이다.
 *
 * 손으로 고른 목록이 아니라 전량 스냅샷이다. 일부만 담으면 "왜 `./tokens` 는 필수인데
 * `./tokens/fonts` 는 아닌가" 에 답할 수 없고, 빠진 것은 조용히 삭제될 수 있다.
 * 서브패스를 지우거나 이름을 바꾸려면 이 목록도 같이 고쳐야 한다 — 의도적 결정에 마찰을
 * 주는 것이 목적이다. 새로 추가한 서브패스는 여기 넣어야 이후 삭제로부터 보호된다.
 */
const REQUIRED_SUBPATHS = [
  '.',
  './bricks',
  './headless',
  './hooks',
  './lib/compose-event-handlers',
  './lib/utils',
  './llms.txt',
  './manifest.json',
  './postcss',
  './schemas',
  './scope',
  './styles',
  './styles/scoped',
  './tokens',
  './tokens.css',
  './tokens.custom.css',
  './tokens.effects.css',
  './tokens.motion.css',
  './tokens.semantic.css',
  './tokens/fonts',
]

/** Windows 의 npm 은 `npm.cmd` 이고 Node 18.20+/20.12+ 는 shell 없이 `.cmd` 실행을 거부한다. */
const IS_WINDOWS = process.platform === 'win32'

interface Target {
  /** `./compositions` 같은 exports 키 */
  subpath: string
  /** `default`·`types`·`source` 등 조건 경로 (중첩이면 `.` 으로 연결) */
  condition: string
  /** 선언된 상대경로 */
  declared: string
  /**
   * 배열 fallback 그룹 키. 같은 그룹 안에서는 하나만 해소되면 성공이다(Node 규약).
   * 배열이 아니면 `null`.
   */
  fallbackGroup: string | null
}

function collectTargets(
  subpath: string,
  value: unknown,
  condition: string,
  acc: Target[],
  fallbackGroup: string | null,
) {
  if (typeof value === 'string') {
    acc.push({ subpath, condition: condition || 'default', declared: value, fallbackGroup })
    return
  }
  if (Array.isArray(value)) {
    // Node 는 배열을 fallback 목록으로 읽는다 — 하나만 해소되면 성공.
    const group = `${subpath}|${condition}`
    value.forEach((v, i) => collectTargets(subpath, v, `${condition}[${i}]`, acc, group))
    return
  }
  if (value && typeof value === 'object') {
    for (const [key, nested] of Object.entries(value)) {
      if (IGNORED_KEYS.has(key)) continue
      collectTargets(subpath, nested, condition ? `${condition}.${key}` : key, acc, fallbackGroup)
    }
  }
}

/** npm 은 `./` 접두사 없는 정규화된 POSIX 상대경로를 돌려준다. */
function toPackedPath(declared: string): string {
  return declared.replace(/^\.\//, '')
}

/**
 * Node 가 받아들이는 표기인가. `.`/`..` 세그먼트는 `ERR_INVALID_PACKAGE_TARGET`,
 * 빈 세그먼트(`//`)는 DEP0166 이다. 정규화로 삼키면 가드가 Node 보다 관대해진다.
 */
function isCanonicalTarget(declared: string): boolean {
  if (!declared.startsWith('./')) return false
  const rest = toPackedPath(declared)
  if (rest !== posix.normalize(rest)) return false
  return !rest.split('/').some(seg => seg === '' || seg === '.' || seg === '..')
}

interface PackResult {
  /** tarball 에 실제로 실린 파일 경로 (POSIX 상대) */
  files: Set<string>
  /** 풀어놓은 tarball 의 `package/` 경로 */
  extractedRoot: string
  cleanup: () => void
}

/**
 * 실제 tarball 을 만들어 푼다. `--ignore-scripts` 로 라이프사이클 재진입을 막는다
 * (현재 afds 에 `prepack`/`prepare` 는 없지만 추가돼도 안전해야 한다).
 *
 * 푸는 위치는 `<pkg>/node_modules/.verify-exports/` 다. `node_modules` 안이라 다음 `npm pack`
 * 에 섞이지 않고, Node 의 상위 탐색이 `<pkg>/node_modules` 와 워크스페이스 루트를 찾으므로
 * 풀어놓은 코드의 bare import(`react` 등)가 해소된다.
 */
function packAndExtract(): PackResult {
  const tgzDir = mkdtempSync(join(tmpdir(), 'afds-verify-exports-'))
  const extractBase = join(ROOT, 'node_modules', '.verify-exports')
  const cleanup = () => {
    rmSync(tgzDir, { recursive: true, force: true })
    rmSync(extractBase, { recursive: true, force: true })
  }
  // try/finally 는 `process.exit()` 를 건너뛴다 — 실패 경로마다 tmpdir 이 하나씩 쌓였다.
  process.on('exit', cleanup)

  // 그리고 `exit` 훅은 시그널에서 돌지 않는다. Ctrl-C 는 프로세스 그룹에 SIGINT 를 보내는데,
  // 핸들러가 없으면 기본 동작으로 **즉사**해서 정리가 아예 안 된다. A/B 실측:
  //   핸들러 없음 → 종료코드 -2(SIGINT 즉사), tmpdir 잔여 1
  //   핸들러 있음 → 종료코드 1,             tmpdir 잔여 0
  // 핸들러를 달면 즉사가 막히고, 같은 그룹 신호로 죽은 `npm`/`tar` 때문에 `execFileSync` 가
  // throw 해 아래 catch 의 cleanup 이 돈다. 7초짜리 빌드 단계 중 Ctrl-C 는 흔하다.
  for (const sig of ['SIGINT', 'SIGTERM'] as const) {
    process.on(sig, () => {
      cleanup()
      process.exit(sig === 'SIGINT' ? 130 : 143)
    })
  }

  try {
    const stdout = execFileSync(
      'npm',
      ['pack', '--json', '--ignore-scripts', '--pack-destination', tgzDir],
      {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
        maxBuffer: 64 * 1024 * 1024,
        shell: IS_WINDOWS,
      },
    )
    const parsed = JSON.parse(stdout)
    const entry = Array.isArray(parsed) ? parsed[0] : parsed
    if (!entry || !Array.isArray(entry.files) || !entry.filename) {
      throw new Error('npm pack --json 출력에 files/filename 이 없다')
    }

    rmSync(extractBase, { recursive: true, force: true })
    mkdirSync(extractBase, { recursive: true })
    execFileSync('tar', ['-xzf', join(tgzDir, entry.filename), '-C', extractBase], {
      stdio: ['ignore', 'ignore', 'pipe'],
    })

    const extractedRoot = join(extractBase, 'package')
    if (!existsSync(extractedRoot)) {
      throw new Error(`tarball 을 풀었지만 package/ 가 없다: ${extractedRoot}`)
    }

    return {
      files: new Set<string>(entry.files.map((f: { path: string }) => f.path)),
      extractedRoot,
      cleanup,
    }
  } catch (err) {
    cleanup()
    throw err
  }
}

interface LoadItem {
  k: string
  url: string
}

interface LoadResult {
  k: string
  ok: boolean
  n?: number
  e?: string
}

/** 균형 잡힌 첫 JSON 배열만 떼어낸다. 뒤에 덧붙인 것은 무시된다. */
function firstJsonArray(raw: string): string | null {
  const start = raw.indexOf('[')
  if (start === -1) return null
  let depth = 0
  for (let i = start; i < raw.length; i++) {
    if (raw[i] === '[') depth++
    else if (raw[i] === ']' && --depth === 0) return raw.slice(start, i + 1)
  }
  return null
}

/**
 * 로드 검사를 자식 프로세스에 격리한다. 타깃이 `process.exit()` 를 부르거나 멈추면 부모가
 * 결과 부재/타임아웃으로 알아챈다 — 같은 프로세스에서 돌리면 검사되지 않은 채 exit 0 이 된다.
 *
 * **결과를 stdout 으로도 임시 파일로도 받지 않는다.** 둘 다 나중 쓰기가 이깁니다:
 *
 * - stdout — 모듈이 `beforeExit` 에서 완료 마커를 다시 쓰면 진짜보다 뒤에 온다(실측: 실제
 *   결함이 ✅ 로 통과했다). `indexOf` 로 바꿔도 앞쪽 위조에 뚫린다.
 * - 임시 파일 — env 로만 경로를 넘기고 import 전에 지워도, `mkdtemp` 는 접두사와 위치가
 *   고정이라 모듈이 `os.tmpdir()` 를 열거해 찾아낸 뒤 `exit` 훅에서 덮어쓴다(실측 확인).
 *
 * 그래서 **fd 3 파이프**로 받고 **첫 JSON 프레임만** 채택한다. 파일과 달리 나중 쓰기가 앞
 * 데이터를 지우지 못하므로, 자식이 검사 직후 쓴 프레임이 언제나 이긴다. 모듈 출력이 섞이는
 * stdout/stderr 는 통째로 버린다.
 *
 * 자기 dist 안의 적대적 모듈을 완전히 막을 수는 없다(그건 이미 진 싸움이다). 이 격리의 목표는
 * **사고로 검사가 무력화되는 것을 막고, 무력화되면 반드시 실패로 드러나게 하는 것**이다.
 */
function loadInChild(items: LoadItem[]): LoadResult[] {
  const child = [
    '(async () => {',
    "  const fs = require('node:fs')",
    '  const items = JSON.parse(process.argv[1])',
    '  const out = []',
    '  for (const it of items) {',
    '    try {',
    '      const m = await import(it.url)',
    '      out.push({ k: it.k, ok: true, n: Object.keys(m).length })',
    '    } catch (e) {',
    '      out.push({ k: it.k, ok: false, e: String((e && e.message) || e) })',
    '    }',
    '  }',
    '  fs.writeSync(3, JSON.stringify(out))',
    '})()',
  ].join('\n')

  const res = spawnSync(process.execPath, ['-e', child, JSON.stringify(items)], {
    cwd: ROOT,
    // 타깃 모듈이 쓰는 stdout/stderr 는 결과 채널이 아니다 — 버린다. 결과는 fd 3 으로만 온다.
    stdio: ['ignore', 'ignore', 'ignore', 'pipe'],
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    timeout: 180_000,
  })

  const frame = firstJsonArray(String(res.output?.[3] ?? ''))
  if (frame === null) {
    throw new Error(
      '로드 검사가 끝까지 돌지 않았다 (결과 프레임 없음). ' +
        '타깃 모듈이 import 중 process.exit() 를 호출했거나 프로세스가 죽었다.',
    )
  }
  try {
    return JSON.parse(frame)
  } catch (err) {
    throw new Error(`로드 검사 결과가 손상됐다: ${(err as Error).message}`)
  }
}

/**
 * 재수출 대상 목록. `export * from` 만 보면 단정이 파서만큼만 강해진다 —
 * `export * as ns from`·`export { X } from`·`export type { T } from` 도 루트 표면을 넓힌다.
 */
const REEXPORT_RE =
  /export\s+(?:type\s+)?(?:\*(?:\s+as\s+[\w$]+)?|\{[^}]*\})\s+from\s+['"]([^'"]+)['"]/g

/**
 * 주석을 걷어낸다. JSDoc `@example` 안의 import 문을 실제 코드로 읽으면 **정당한 파일을 틀린
 * 이유로 막는다** — 이 패키지가 실제로 그런 `.d.ts` 를 낸다(`dist/bricks/feedback/toast/
 * toast.d.ts:61` 의 JSDoc 예시). `src/index.ts` 에 사용 예시 JSDoc 을 하나 붙이는 순간
 * 빌드가 틀린 이유로 죽는다.
 *
 * 규칙 두 가지 (둘 다 실측으로 정해졌다):
 *
 * - **블록 주석은 줄 시작에서 열린 것만** 지운다. 아무 데서나 `/*` 를 지우면 문자열 리터럴
 *   안의 여는 토큰이 주석 시작으로 읽혀 다음 닫는 토큰까지 먹고, 그 사이 진짜 export 문이
 *   사라진다 — 오탐이 아니라 **미탐**이다. (JSDoc 안이라 닫는 토큰을 리터럴로 못 쓴다.)
 * - **라인 주석은 줄 끝 것도** 지운다. `export * from './bricks' // was: … './compositions'`
 *   같은 리팩터링 흔적이 목록에 섞이면 런타임/타입 불일치로 오탐한다. 앞에 공백을 요구해
 *   문자열 안의 `https://` 는 건드리지 않는다.
 *
 * 이 함수의 결과는 이제 **런타임/타입 재수출 목록 일치 판정에만** 쓴다. 컴포지션 누출 판정은
 * 값 동일성으로 옮겼으므로, 여기서 파싱이 틀려도 폭발 반경이 그 하나로 제한된다.
 */
function stripComments(src: string): string {
  // 블록 주석은 **줄 시작에서 열린 것만** 지운다. 아무 데서나 `/*` 를 지우면 문자열 리터럴
  // 안의 `/*` 가 주석 시작으로 읽혀 다음 `*/` 까지 통째로 먹고, 그 사이의 진짜 export 문이
  // 사라진다 — 오탐이 아니라 **미탐**이다(실측: 이 패키지 dist 에 문자열 안 `/*` 가 19개
  // 파일, 템플릿 안이 37개 파일). 생성된 JSDoc 은 언제나 줄 시작에서 열리므로 이걸로 충분하다.
  return (
    src
      .replace(/^[ \t]*\/\*[\s\S]*?\*\//gm, '')
      // 줄 끝 주석도 걷는다 — `export * from './bricks' // export * from './compositions'` 같은
      // 리팩터링 흔적이 목록에 섞이면 런타임/타입 불일치로 오탐한다. 앞에 공백을 요구해서
      // 문자열 안의 `https://` 는 건드리지 않는다.
      .replace(/(^|\s)\/\/[^\n]*/g, '$1')
  )
}

function matchAllSpecifiers(src: string, re: RegExp): string[] {
  return [...stripComments(src).matchAll(new RegExp(re.source, 'g'))].map(m => m[1])
}

function reexportSpecifiers(file: string): string[] {
  return [...new Set(matchAllSpecifiers(readFileSync(file, 'utf8'), REEXPORT_RE))].sort()
}

/**
 * `.d.ts` 안의 bare 타입 의존을 뽑는다 — `import type ... from 'x'` · `export ... from 'x'` ·
 * 인라인 `import('x')` · **`import X = require('x')`**.
 *
 * `import = require` 는 TS 전용 문법이라 `from` 도 `import(` 도 아니어서 처음에 놓쳤다.
 * 미선언 패키지를 그 형태로 쓰면 검사를 통째로 우회한다(실측 확인).
 */
const DTS_SPECIFIER_RE =
  /(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*)['"]([^'"]+)['"]|^[ \t]*import\s+['"]([^'"]+)['"]/gm

/**
 * 삼중슬래시 지시문(`/// <reference types="pkg" />`)은 **주석 제거 전 원문에서** 뽑아야 한다.
 * `///` 는 라인 주석이라 `stripComments` 가 지워 버린다 — 그러면 그 타입 의존이 검사에서
 * 통째로 사라진다(실측 확인). 줄 시작에 앵커해서 JSDoc 안의 예시(` * /// ...`)는 잡지 않는다.
 */
const TRIPLE_SLASH_RE = /^[ \t]*\/\/\/\s*<reference\s+types\s*=\s*['"]([^'"]+)['"]/gm

const BUILTINS = new Set(builtinModules)

/** `@scope/pkg/sub` → `@scope/pkg`, `pkg/sub` → `pkg`. 상대·builtin 은 null. */
function barePackageName(spec: string): string | null {
  if (spec.startsWith('.') || spec.startsWith('/')) return null
  if (spec.startsWith('node:')) return null
  const name = spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0]
  if (BUILTINS.has(name)) return null
  return name || null
}

type DeclSite = 'dependencies' | 'peer' | 'peer-optional' | 'optional' | '미선언'

/**
 * 배포된 `.d.ts` 가 import 하는 bare 패키지가 `package.json` 에 선언돼 있는지 본다.
 *
 * **왜.** 이슈 #113 — `dist/postcss/scope-afds-preflight.d.ts` 가 `import type { Plugin } from
 * 'postcss'` 를 하는데 `postcss` 는 devDependency 뿐이었다. 소비처가 `skipLibCheck: false` 면
 * `TS2307` 이다. 모듈 해소는 멀쩡하므로 이 파일의 다른 검사(존재·로드)는 전부 통과한다 —
 * **타입 해소는 모듈 해소와 별개 경로**이고 그 틈으로 배포됐다.
 *
 * 인스턴스가 아니라 계열을 막는다: 다음 미선언 패키지도 같은 틈으로 나가지 못한다.
 *
 * **선언 위치를 함께 출력한다.** 지금은 `.d.ts` 만 보므로 `optional peer` 도 정상이다 —
 * 그 서브패스를 쓰는 소비처만 타입이 필요하기 때문이다. 하지만 검사를 **런타임(`.js`)으로
 * 넓히면 `optional peer` 는 실패로 취급해야 한다** — 소비처에 없을 수 있는 것을 런타임에
 * 요구하는 것이기 때문이다. 넓히는 것은 별건이고, 넓힐 때 이 구분이 없으면 조용히 통과한다.
 */
function scanDtsTypeDeps(extractedRoot: string, pkg: Record<string, unknown>) {
  const deps = (pkg.dependencies ?? {}) as Record<string, string>
  const peers = (pkg.peerDependencies ?? {}) as Record<string, string>
  const opts = (pkg.optionalDependencies ?? {}) as Record<string, string>
  const peerMeta = (pkg.peerDependenciesMeta ?? {}) as Record<string, { optional?: boolean }>

  const siteOf = (name: string): DeclSite => {
    if (name in deps) return 'dependencies'
    if (name in peers) return peerMeta[name]?.optional ? 'peer-optional' : 'peer'
    if (name in opts) return 'optional'
    return '미선언'
  }

  const files: string[] = []
  const walk = (dir: string) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, e.name)
      if (e.isDirectory()) walk(full)
      else if (e.name.endsWith('.d.ts')) files.push(full)
    }
  }
  const distDir = join(extractedRoot, 'dist')
  if (existsSync(distDir)) walk(distDir)

  /** 패키지 → 처음 발견한 파일(상대경로) */
  const found = new Map<string, string>()
  for (const f of files) {
    const raw = readFileSync(f, 'utf8')
    const rel = f.slice(extractedRoot.length + 1)

    // 삼중슬래시는 주석 제거 **전** 원문에서 (stripComments 가 지운다)
    for (const m of raw.matchAll(new RegExp(TRIPLE_SLASH_RE.source, 'gm'))) {
      const name = barePackageName(m[1] ?? '')
      if (name && !found.has(name)) found.set(name, rel)
    }

    // 나머지는 주석 제거 후 (JSDoc 예시 안의 import 를 실제 의존으로 오인하지 않기 위해)
    for (const m of stripComments(raw).matchAll(new RegExp(DTS_SPECIFIER_RE.source, 'gm'))) {
      const name = barePackageName(m[1] ?? m[2] ?? '')
      if (name && !found.has(name)) found.set(name, rel)
    }
  }

  const bySite = new Map<DeclSite, string[]>()
  const undeclared: string[] = []
  for (const [name, file] of [...found].sort()) {
    const site = siteOf(name)
    bySite.set(site, [...(bySite.get(site) ?? []), name])
    if (site === '미선언') {
      undeclared.push(
        `${name} — 예: ${file}. dependencies·peerDependencies 어디에도 없다 ` +
          `(소비처가 skipLibCheck:false 면 TS2307).`,
      )
    }
  }
  return { fileCount: files.length, packages: found.size, bySite, undeclared }
}

async function main() {
  const pkg = require(join(ROOT, 'package.json'))
  const exportsField = pkg.exports

  if (!exportsField || typeof exportsField !== 'object') {
    console.error('❌ package.json 에 exports 필드가 없다 — 검증할 대상이 없다.')
    process.exit(1)
  }

  const targets: Target[] = []
  for (const [subpath, value] of Object.entries(exportsField)) {
    collectTargets(subpath, value, '', targets, null)
  }

  const subpaths = new Set(targets.map(t => t.subpath))
  // `"./x": null` 은 서브패스를 막는 정당한 Node 기능이다. 타깃이 0건이라 `subpaths` 에
  // 들어가지 않으므로 따로 센다 — 안 그러면 출력 수치가 exports 키 수와 어긋나고,
  // `null` 로 새로 막은 서브패스가 등록 검사에도 안 걸린다.
  const declaredSubpaths = Object.keys(exportsField)
  const blockedSubpaths = declaredSubpaths.filter(
    k => (exportsField as Record<string, unknown>)[k] === null,
  )

  // ── package.json 만으로 되는 검사를 먼저 한다 ────────────────────────────────
  // 비싼 pack/extract 뒤에 두면, npm·tar 가 없는 환경에서 그 단계가 죽으면서 이 결과를
  // 영영 출력하지 못한다. 가장 싼 검사가 가장 비싼 단계에 인질로 잡히면 안 된다.
  const cheapFailures: [string, string[], string?][] = []

  const snapshot = new Set(REQUIRED_SUBPATHS)
  const missingRequired = REQUIRED_SUBPATHS.filter(s => !subpaths.has(s))
  if (missingRequired.length > 0) {
    cheapFailures.push([
      'exports 에서 필수 서브패스가 사라졌다',
      missingRequired,
      '지우는 것이 의도라면 scripts/verify-exports.ts 의 REQUIRED_SUBPATHS 도 같이 고쳐라.',
    ])
  }
  // 추가를 그냥 통과시키면 스냅샷이 서서히 부분집합이 되고, 새 서브패스는 이후 삭제로부터
  // 보호되지 않는다 — 아무도 못 잡는 드리프트다. 등록을 요구해 스냅샷을 정확히 유지한다.
  const unregistered = declaredSubpaths.filter(s => !snapshot.has(s)).sort()
  if (unregistered.length > 0) {
    cheapFailures.push([
      'exports 에 스냅샷에 없는 서브패스가 있다',
      unregistered,
      'scripts/verify-exports.ts 의 REQUIRED_SUBPATHS 에 추가해라 — 등록해야 이후 삭제로부터 보호된다.',
    ])
  }

  if (cheapFailures.length > 0) {
    for (const [title, items, hint] of cheapFailures) {
      console.error(`\n❌ ${title} — ${items.length}건:`)
      for (const i of items) console.error(`   - ${i}`)
      if (hint) console.error(`   ${hint}`)
    }
    process.exit(1)
  }

  let pack: PackResult
  try {
    pack = packAndExtract()
  } catch (err) {
    // 조용히 넘어가면 "가드가 있는데 안 본다" 가 된다 — 이 저장소가 반복한 실패다.
    console.error('❌ 배포 tarball 을 만들지 못했다:', (err as Error).message)
    console.error('   `npm pack --json --ignore-scripts` 와 `tar` 가 실행 가능해야 한다.')
    process.exit(1)
  }

  const invalidForm: string[] = []
  const uncheckable: string[] = []
  const notPacked: string[] = []
  const notAFile: string[] = []
  const unresolvable: string[] = []
  const emptyModule: string[] = []

  const label = (t: Target) => `${t.subpath} [${t.condition}] → ${t.declared}`

  /** fallbackGroup 별로 "하나라도 성공" 을 집계한다. */
  const groupOk = new Map<string, boolean>()
  const groupMembers = new Map<string, string[]>()
  const noteGroup = (t: Target, ok: boolean) => {
    if (!t.fallbackGroup) return
    groupOk.set(t.fallbackGroup, (groupOk.get(t.fallbackGroup) ?? false) || ok)
    groupMembers.set(t.fallbackGroup, [...(groupMembers.get(t.fallbackGroup) ?? []), label(t)])
  }
  /** 그룹 소속이면 개별 실패를 보고하지 않는다 — 판정은 그룹 단위다. */
  const report = (bucket: string[], t: Target, extra = '') => {
    if (t.fallbackGroup) return
    bucket.push(`${label(t)}${extra}`)
  }

  const toLoad: LoadItem[] = []
  const loadTarget = new Map<string, Target>()

  try {
    for (const target of targets) {
      if (target.subpath.includes('*') || target.declared.includes('*')) {
        uncheckable.push(label(target))
        noteGroup(target, false)
        continue
      }

      if (!isCanonicalTarget(target.declared)) {
        report(invalidForm, target)
        noteGroup(target, false)
        continue
      }

      const packedPath = toPackedPath(target.declared)
      const absolute = join(pack.extractedRoot, packedPath)

      // 디렉터리 타깃을 먼저 걸러낸다. `npm pack` 은 파일만 열거하므로 디렉터리는 packed 목록에
      // 없고, 순서를 바꾸면 원인을 "`files` 가 제외했다" 로 오진한다. 실제 원인은 다르다 —
      // 소비처에서 `ERR_UNSUPPORTED_DIR_IMPORT` 가 난다.
      if (existsSync(absolute) && !statSync(absolute).isFile()) {
        report(notAFile, target, ' (디렉터리다 — 소비처에서 ERR_UNSUPPORTED_DIR_IMPORT)')
        noteGroup(target, false)
        continue
      }

      if (!pack.files.has(packedPath)) {
        report(notPacked, target)
        noteGroup(target, false)
        continue
      }

      if (!existsSync(absolute)) {
        report(notPacked, target, ' (packed 목록에는 있으나 풀어놓은 tarball 에 없다)')
        noteGroup(target, false)
        continue
      }

      const isJs = /\.(js|mjs|cjs)$/.test(target.declared)
      const isTypeOnly = target.condition.split('.').includes('types')
      if (isJs && !isTypeOnly) {
        const k = `${target.subpath} ${target.condition}`
        toLoad.push({ k, url: pathToFileURL(absolute).href })
        loadTarget.set(k, target)
      } else {
        noteGroup(target, true)
      }
    }

    let loaded: LoadResult[] = []
    if (toLoad.length > 0) {
      try {
        loaded = loadInChild(toLoad)
      } catch (err) {
        console.error('❌', (err as Error).message)
        console.error(`   검사하려던 JS 타깃 ${toLoad.length}건의 결과를 신뢰할 수 없다.`)
        process.exit(1)
      }
      if (loaded.length !== toLoad.length) {
        console.error(
          `❌ 로드 검사 결과 수가 맞지 않는다 — 요청 ${toLoad.length}건, 응답 ${loaded.length}건.`,
        )
        process.exit(1)
      }
    }

    for (const r of loaded) {
      const target = loadTarget.get(r.k)!
      if (!r.ok) {
        report(unresolvable, target, `: ${r.e}`)
        noteGroup(target, false)
      } else if ((r.n ?? 0) === 0) {
        report(emptyModule, target, ' (export 0개 — 빈 파일이거나 재수출이 비었다)')
        noteGroup(target, false)
      } else {
        noteGroup(target, true)
      }
    }

    // 배열 fallback: 그룹 안에서 하나도 해소되지 않았을 때만 실패다.
    const deadGroups: string[] = []
    for (const [group, ok] of groupOk) {
      if (!ok) deadGroups.push(`${group} — 후보 전부 실패: ${groupMembers.get(group)!.join(' | ')}`)
    }

    // 루트 표면 — dist/index.js 와 dist/index.d.ts 의 재수출 목록이 어긋나면 런타임과
    // 타입이 서로 다른 걸 노출한다. (컴포지션 루트 비노출 단정은 컴포지션이 afds-registry 로
    // 이전되며 제거했다 — `./compositions` subpath 자체가 더는 존재하지 않아 판정할 대상이 없다.)
    const rootJs = join(pack.extractedRoot, 'dist/index.js')
    const rootDts = join(pack.extractedRoot, 'dist/index.d.ts')
    const rootSurface: string[] = []
    let rootJsSpecs: string[] = []
    if (existsSync(rootJs) && existsSync(rootDts)) {
      rootJsSpecs = reexportSpecifiers(rootJs)
      const rootDtsSpecs = reexportSpecifiers(rootDts)
      if (JSON.stringify(rootJsSpecs) !== JSON.stringify(rootDtsSpecs)) {
        rootSurface.push(
          'dist/index.js 와 dist/index.d.ts 의 재수출 목록이 다르다 — 런타임과 타입이 어긋난다' +
            `\n       index.js  : ${rootJsSpecs.join(', ')}` +
            `\n       index.d.ts: ${rootDtsSpecs.join(', ')}`,
        )
      }
    } else {
      rootSurface.push(`루트 entry 산출물을 찾지 못했다 (${rootJs} / ${rootDts})`)
    }

    const sourceTargets = targets.filter(t => t.condition.split('.').includes('source'))
    const conditions = [...new Set(targets.map(t => t.condition))].sort()

    // 배포된 `.d.ts` 의 타입 의존이 선언돼 있는가. 모듈 해소(위 검사들)와 별개 경로다.
    const dts = scanDtsTypeDeps(pack.extractedRoot, pkg)
    const dtsSites = (['dependencies', 'peer', 'peer-optional', 'optional', '미선언'] as const)
      .map(site => [site, dts.bySite.get(site)?.length ?? 0] as const)
      .filter(([, n]) => n > 0)
      .map(([site, n]) => `${site} ${n}`)
      .join(' · ')

    console.log('exports 타깃 검증 (실제 배포 tarball 기준):')
    console.log(
      `  서브패스              ${subpaths.size}개 / exports 키 ${declaredSubpaths.length}개` +
        `${blockedSubpaths.length > 0 ? ` (null 차단 ${blockedSubpaths.length}개)` : ''}` +
        ` — 스냅샷 ${REQUIRED_SUBPATHS.length}개 대조`,
    )
    console.log(`  선언된 타깃           ${targets.length}건`)
    console.log(`  조건별                ${conditions.join(', ')}`)
    console.log(`  source 조건 타깃      ${sourceTargets.length}건`)
    console.log(`  로드 검사             ${toLoad.length}건 (자식 프로세스 격리 + fd3 프레임 단정)`)
    console.log(`  tarball 포함 파일     ${pack.files.size}건`)
    console.log(`  검사 불가 형태        ${uncheckable.length}건`)
    console.log(
      `  .d.ts 타입 의존       ${dts.fileCount}개 파일 / bare 패키지 ${dts.packages}종` +
        `${dtsSites ? ` (${dtsSites})` : ''}`,
    )
    console.log(
      `  루트 표면 단정        적용 — index.js/index.d.ts 재수출 목록 동일성` +
        `${rootSurface.length > 0 ? ' (어긋남 발견)' : ''}`,
    )

    const fail: [string, string[], string?][] = [
      [
        'Node 가 거부하는 경로 표기다 (`.`/`..`/빈 세그먼트 → ERR_INVALID_PACKAGE_TARGET)',
        invalidForm,
      ],
      ['배포 tarball 에 없다', notPacked, '`files` / `.npmignore` 가 이 경로를 제외하고 있다.'],
      ['파일이 아니다', notAFile],
      ['배포본에서 로드되지 않는다', unresolvable],
      ['모듈이 비어 있다', emptyModule],
      ['배열 fallback 후보가 전부 실패했다', deadGroups],
      ['이 가드가 검사할 수 없는 형태다', uncheckable],
      [
        '배포된 .d.ts 가 선언되지 않은 패키지를 타입 import 한다',
        dts.undeclared,
        'dependencies 또는 peerDependencies 에 선언하거나 .d.ts 에서 그 타입 의존을 제거할 것.',
      ],
      ['루트 entry 표면이 어긋났다', rootSurface],
    ]

    const failed = fail.filter(([, items]) => items.length > 0)
    if (failed.length > 0) {
      for (const [title, items, hint] of failed) {
        console.error(`\n❌ ${title} — ${items.length}건:`)
        for (const i of items) console.error(`   - ${i}`)
        if (hint) console.error(`   ${hint}`)
      }
      if (uncheckable.length > 0) {
        console.error(
          '\n   와일드카드 서브패스는 미지원이다. export 가 잘못된 것이 아니라 가드를 확장해야 한다',
        )
        console.error('   (패턴 전개 후 매치 ≥1 확인 + 각 매치의 배포 포함·로드 검사).')
      }
      console.error('\n   exports 선언과 배포 산출물이 어긋났다. 배포하면 소비처에서 실패한다.')
      process.exit(1)
    }

    console.log(
      `✅ exports 타깃 ${targets.length}건 전부 배포본에 실리고 해소된다 (로드 ${toLoad.length}건 완료).`,
    )
  } finally {
    pack.cleanup()
  }
}

main().catch(err => {
  console.error('❌ verify-exports 실행 실패:', err)
  process.exit(1)
})
