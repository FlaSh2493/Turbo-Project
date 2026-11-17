/**
 * Tailwind 임의 값(`-[...]`) 중 색·길이를 세는 정본 — 토큰 래칫(`arbitrary-token-ratchet.test.ts`)
 * 이 이 파일 하나에 의존한다. AFDS 토큰 대신 쓴 Tailwind 기본 팔레트·spacing/radius 탐지도
 * 여기 있지만 그쪽은 경고만 낸다(`default-scale-warnings.test.ts`) — 래칫 건수에 넣지 않는다.
 *
 * ESLint `no-restricted-syntax`(`packages/config/eslint-config/eslint.config.js`)의
 * `Literal[value=/^#[0-9a-fA-F]{3,6}$/]` 는 리터럴 **전체**가 hex 일 때만 잡는다 —
 * `text-[#FF5733] w-[137px]` 는 통과한다. 여기는 그 반대로 **앵커 없이** 문자열 어디든
 * 나타나는 `-[...]` 브래킷을 본다. 두 검사의 경계는 `.claude/rules/afds-component-tokens.md`
 * 금지 패턴 절에 적는다.
 */
import { readFileSync, readdirSync, type Dirent } from 'node:fs'
import { join, relative } from 'node:path'
import { isSkippedDir, isImportScannableFile } from './composition-files'

/** Tailwind 임의 값 브래킷 하나(`-[내용]`) — 전역 매칭이라 한 문자열에 여러 개 있어도 전부 잡는다. */
const ARBITRARY_BRACKET_RE = /-\[([^\]]*)\]/g

/**
 * content 안의 `var(...)` 는 균형 괄호로 통째로 걷어내고 나머지만 원시 값 검사에 넘긴다 —
 * `var(--x,10px)` 같은 fallback 은 var() 째로 사라지니 0건이고, `var(--x)_137px` 처럼 var()
 * 뒤에 raw 값이 남으면 그 값은 그대로 잡힌다. 예전엔 브래킷이 `var(` 로 "시작"하기만 하면
 * (`PURE_VAR_RE = /^var\(/`) 안을 통째로 건너뛰어 이 137px 을 놓쳤다.
 *
 * `calc(...)` 는 따로 걷어내지 않는다 — 안의 내용을 그대로 COLOR_RE/LENGTH_RE 로 검사한다.
 * raw 값이 없으면(예: `calc(100%-var(--x))`, var() 는 이미 걷어낸 뒤라 남는 게 없다) 자연히
 * 0건이고, 있으면(`calc(137px)`) 1건이다(실재: `packages/afds/src/bricks/overlay/drawer/drawer.style.ts`
 * 의 `calc(100dvh-100px)`).
 */
function stripVarGroups(content: string): string {
  let result = ''
  let depth = 0
  for (let i = 0; i < content.length; i++) {
    if (depth === 0 && content.startsWith('var(', i)) {
      depth = 1
      i += 3 // 루프의 i++ 와 합쳐 'var(' 4글자를 건너뛴다
      continue
    }
    if (depth > 0) {
      if (content[i] === '(') depth++
      else if (content[i] === ')') depth--
      continue
    }
    result += content[i]
  }
  return result
}

/**
 * 색 — hex 리터럴 또는 rgb/rgba/hsl/hsla 함수 호출.
 *
 * 경계는 `\b` 가 아니라 `(?![0-9a-zA-Z])` 다 — `\b` 는 언더스코어를 단어 문자로 봐서
 * `ring-[#fff_inset]` 처럼 값 뒤에 `_` 로 다른 값이 이어지면 경계를 못 잡고 통째로
 * 놓쳤다(Tailwind 임의 값은 공백을 `_` 로 쓴다).
 */
const COLOR_RE = /#[0-9a-fA-F]{3,8}(?![0-9a-zA-Z])|(?:rgba?|hsla?)\(/

/**
 * 길이 — px/rem 단위의 숫자 리터럴(음수·소수 허용).
 *
 * 위 COLOR_RE 와 같은 이유로 경계를 `(?![0-9a-zA-Z])` 로 뒀다 — `m-[4px_auto]` 의 `4px` 뒤
 * `_` 를 놓치던 버그.
 *
 * 선행 `-?` 는 없앴다 — `.test()` 는 문자열 앵커가 없어 `top-[-8px]` 도 `-` 를 건너뛰고
 * `8px` 에서 그대로 매칭되므로 있으나 없으나 결과가 같다(no-op).
 */
const LENGTH_RE = /\d+(?:\.\d+)?(?:px|rem)(?![0-9a-zA-Z])/

/**
 * 파일 내용에서 색·길이 Tailwind 임의 값 건수를 센다.
 *
 * **브래킷 단위로 센다** — 하나의 브래킷 안에 숫자·색이 여럿 섞인 shorthand(예:
 * `shadow-[4px_0_6px_-2px_rgba(0,0,0,0.08)]`, 실재: `afds-registry/compositions/base-table`)도
 * 1건이다. 하위 토큰별로 세면 색+길이가 함께 있는 브래킷이 중복 계산된다.
 */
export function countArbitraryTokenValues(source: string): number {
  let count = 0
  for (const match of source.matchAll(ARBITRARY_BRACKET_RE)) {
    const content = stripVarGroups(match[1].trim())
    if (COLOR_RE.test(content) || LENGTH_RE.test(content)) count++
  }
  return count
}

/**
 * 클래스 토큰 경계. 앞: 문자열 시작·공백·따옴표·`:`(variant)·`!`(important). 뒤: 공백·따옴표·끝.
 * `p-afds-spacing-20`·`rounded-afds-md` 가 걸리지 않는 것은 이 경계 덕이 아니라 값 자리
 * (숫자·고정 크기 이름)가 `afds-` 를 받지 않아서다 — 값 패턴을 넓힐 때 그 점을 지켜라.
 */
const BEFORE = String.raw`(?<=^|[\s'"\`:!])`
const AFTER = String.raw`(?=[\s'"\`]|$)`

const COLOR_NAMES =
  'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose'

/**
 * 기본 팔레트(`text-red-500`). 뒤의 `/NN`(opacity)은 팔레트에만 허용한다.
 * `white`/`black` 은 셰이드가 없어 이 패턴 밖이다(규칙 문서 경계 노트).
 */
const PALETTE_RE = new RegExp(
  BEFORE +
    String.raw`(?:text|bg|border(?:-[trblxy])?|ring|ring-offset|fill|stroke|outline|divide|from|via|to|shadow|decoration|placeholder|caret|accent)` +
    `-(?:${COLOR_NAMES})-(?:50|100|200|300|400|500|600|700|800|900|950)` +
    String.raw`(?:\/\d+)?` +
    AFTER,
  'g',
)

/**
 * 기본 spacing(`p-4`·`-mt-2`·`gap-2.5`). **값 `0` 은 세지 않는다** — 리셋은 디자인 값이 아니다.
 * 뒤 경계에 `/` 가 없는 것은 의도다 — `left-1/2`(분수 위치)는 spacing 척도가 아니다.
 */
const SPACING_RE = new RegExp(
  BEFORE +
    String.raw`-?(?:p|px|py|pt|pr|pb|pl|ps|pe|m|mx|my|mt|mr|mb|ml|ms|me|gap|gap-x|gap-y|space-x|space-y|inset|inset-x|inset-y|top|right|bottom|left)` +
    String.raw`-(?:[1-9]\d*(?:\.\d+)?|0\.\d+)` +
    AFTER,
  'g',
)

/**
 * 기본 radius(`rounded-lg`·맨 `rounded`). `rounded-full`·`rounded-none` 은 세지 않는다.
 */
const RADIUS_RE = new RegExp(
  BEFORE +
    String.raw`rounded(?:(?:-(?:t|r|b|l|s|e|tl|tr|br|bl|ss|se|es|ee))?-(?:xs|sm|md|lg|xl|2xl|3xl|4xl))?` +
    AFTER,
  'g',
)

export interface DefaultScaleMatch {
  /** 1부터 센다. */
  line: number
  className: string
}

/**
 * 주석 줄 — trim 한 줄이 `//`·`/*`·`*` 로 시작한다. `*:` 는 Tailwind 자식 variant 라 주석으로 보지 않는다.
 * ponytail: 코드 뒤에 붙은 주석(`x // py-3`)·JSX 주석 안 단어는 여전히 센다 —
 * 문자열 리터럴만 보는 파서로 바꾸면 없어진다.
 */
const COMMENT_LINE_RE = /^(?:\/\/|\/\*|\*(?!:))/

/** AFDS 토큰 대신 쓴 Tailwind 기본 팔레트·spacing·radius 클래스를 위치와 함께 찾는다. 주석 줄은 건너뛴다. */
export function findDefaultScaleClasses(source: string): DefaultScaleMatch[] {
  const matches: DefaultScaleMatch[] = []
  source.split('\n').forEach((text, i) => {
    if (COMMENT_LINE_RE.test(text.trim())) return
    for (const re of [PALETTE_RE, SPACING_RE, RADIUS_RE]) {
      for (const m of text.matchAll(re)) matches.push({ line: i + 1, className: m[0] })
    }
  })
  return matches
}

export interface ArbitraryTokenScan {
  /** 위반이 있는 파일만 담는다(0건 파일은 기준 파일에 실을 필요가 없다). 키는 `root` 상대 경로. */
  counts: Record<string, number>
  /** 훑은 코드 파일 총수(위반 유무 무관) — 대상 집합이 조용히 비었는지 확인하는 분모. */
  filesScanned: number
}

/**
 * `root` 아래 `.ts`/`.tsx` 코드 파일을 재귀 순회해 `visit(root 상대 경로, 내용)` 을 부르고 훑은 파일 수를 돌려준다.
 *
 * 스토리·테스트 제외 기준은 `composition-files.ts` 의 `isSkippedDir`/`isImportScannableFile` 을
 * 그대로 재사용한다 — 원래 목적(소비처 배포 대상 판정)과 다르지만 "코드 · 스토리 아님 · 테스트
 * 아님" 판정 자체는 이 래칫이 원하는 기준과 같다. 판정을 새로 만들면 두 정의가 갈라질 때
 * 조용히 어긋난다.
 */
function walkScannableFiles(root: string, visit: (path: string, source: string) => void): number {
  let filesScanned = 0

  function walk(dir: string): void {
    let entries: Dirent[]
    try {
      entries = readdirSync(dir, { withFileTypes: true })
    } catch {
      // 디렉터리를 읽을 수 없으면 그 아래는 "파일 없음" 으로 드러나는 쪽이 안전하다.
      return
    }
    for (const entry of entries) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) {
        if (isSkippedDir(entry.name)) continue
        walk(full)
        continue
      }
      if (!isImportScannableFile(entry.name)) continue
      filesScanned++
      visit(relative(root, full), readFileSync(full, 'utf-8'))
    }
  }

  walk(root)
  return filesScanned
}

/** `root` 아래 코드 파일별 임의 값 건수를 센다. */
export function scanArbitraryTokenValues(root: string): ArbitraryTokenScan {
  const counts: Record<string, number> = {}
  const filesScanned = walkScannableFiles(root, (path, source) => {
    const count = countArbitraryTokenValues(source)
    if (count > 0) counts[path] = count
  })
  return { counts, filesScanned }
}

export interface DefaultScaleScan {
  /** `file` 은 `root` 상대 경로. */
  matches: (DefaultScaleMatch & { file: string })[]
  filesScanned: number
}

/** `root` 아래 코드 파일에서 기본 팔레트·spacing·radius 클래스를 찾는다 — 래칫과 같은 대상·제외. */
export function scanDefaultScaleClasses(root: string): DefaultScaleScan {
  const matches: DefaultScaleScan['matches'] = []
  const filesScanned = walkScannableFiles(root, (file, source) => {
    for (const m of findDefaultScaleClasses(source)) matches.push({ file, ...m })
  })
  return { matches, filesScanned }
}
