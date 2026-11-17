/**
 * 문서 인용 검증기 (Doc Citation Verifier)
 *
 * 마크다운 문서가 백틱으로 인용한 것들이 실재하는지 기계로 대조한다:
 * - 파일 경로            (`packages/afds/src/...` · basename)
 * - `파일:줄` 인용의 줄 범위 (직전 파일을 물려받는 `:줄` 단독 인용 포함)
 * - 코드 심볼            (`SomeSymbol` — 단어 경계 고정)
 * - 네임스페이스 파트     (`DrawerPrimitive.Popup` · `Popover.Positioner` · `Select.Item`)
 * - 부재 주장            (`expectAbsent` — 생기면 주장이 깨지므로 실패)
 * - 기준 커밋 대비 줄 변화 — **두 종류를 갈라서 다룬다**:
 *     · 줄 이동  (인용한 내용이 파일 안에 그대로 있고 줄번호만 밀렸다) → **정보. 로그에만 찍는다**
 *     · 내용 소실 (인용한 내용이 파일에서 사라졌다)                  → **실패**
 *
 *   ⚠️ 로그의 `줄이동 N(정보)` 에서 **N 은 게이트가 아니다.** 그 N 이 다음번에 내용 소실로
 *   바뀌어도 걸리는 것은 소실 판정 로직이고 숫자가 아니다. 그 로직이 실제로 소실을 소실로
 *   분류한다는 것은 `knownContentLoss` 에서 항목을 하나 빼면 `exit 1` 이 나는 것으로 확인한다.
 *
 * 왜 필요한가 — 이 저장소가 반복해서 겪은 결함이 "문서가 실재하지 않는 API·클래스·토큰을
 * 안내하고 에이전트가 그것을 사실로 읽는다" 다. 사람이 눈으로 훑는 것으로는 막히지 않는다.
 * `base-ui-coverage-audit.md` 조사 중 실제로 이 유형이 세 번 나왔고(없는 훅 4개 안내 ·
 * 없는 Drawer 파트 안내 · 삭제된 토큰 파일 인용) 그중 하나는 이 검증기가 잡았다.
 *
 * 사용법:
 *   npx tsx scripts/verify-doc-citations.ts                        # 기본 대상(패키지 루트에서)
 *   npx tsx scripts/verify-doc-citations.ts docs/some-doc.md       # 특정 문서
 *
 *   ⚠️ `pnpm --filter @turbo-project/afds verify:docs` 는 `package.json` 에 그 스크립트가
 *   등록돼 있을 때만 동작한다. 미등록이면 pnpm 은 경고만 내고 **exit 0** 이다 —
 *   즉 CI 에 그 형태로만 배선하면 아무것도 실행하지 않고 초록이 된다. 등록 전에는
 *   위의 `npx tsx` 직접 호출을 써라. (`package.json` 은 다른 레인 소유다.)
 *
 * 종료코드: 실패 0건이면 0, 하나라도 어긋나면 1.
 *   ⚠️ 파이프로 종료코드를 읽지 마라 — `... | tail -3; echo $?` 는 `tail` 의 코드를 읽어
 *   실패를 0 으로 보고한다. 이 저장소가 겪은 "실패했는데 exit 0" 그대로다.
 *
 * 검증할 수 없는 것 (설계상 제외 — 문서 쪽에 표시를 남긴다):
 *   - 수치·집계 (개수, 비율) → 문서의 재현 명령으로 사람이 확인
 *   - 판단·권고 (우선순위, 비용 추정)
 *   - 인용한 줄이 **말하는 내용이 참인지** → 드리프트 검사는 "그 사이 바뀌었는가" 만 본다
 *   - 저장소 범위 밖 경로·심볼 → 대조할 대상이 없다. "미검증" 으로 집계한다
 *
 * 강제되는 범위 (중요):
 *   저장소 내부 경로·줄인용·파트·부재·드리프트·하한선은 강제된다.
 *   **심볼과 범위 밖 경로는 강제되지 않는다** — 소비처 심볼과 구분할 수단이 없어
 *   "미검증" 으로 집계한다. 그래서 하한선(`minCounts`)이 필요하다.
 *
 *   소비처 저장소를 대조하는 모드(`AFDS_CONSUMER_ROOT`)가 있었으나 걷어냈다 —
 *   **CI 에 배선된 적이 없어 강제력이 0 이었다**(#209). 그 모드가 내던 실패 전수를
 *   갈라 보니 죽은 인용은 0건이었고, 대조 가능한 13건은 이 검사의 탐색 공간을
 *   넓히면(#214) 모드 없이 같은 값을 준다.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join, resolve, basename, isAbsolute, relative } from 'node:path'
import { execFileSync, spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { nearestIndex, isPrependOnlyPath } from './lib/citation-drift'
import { extractCitations } from './lib/citation-antecedent'
import { resolveBySuffix, uniqueBySuffix, existsOnRefFiles } from './lib/path-resolve'
import { classifyPathCitation, extractPathCitations } from './lib/path-citation'

const require_ = createRequire(import.meta.url)

// 대상 · 경로 해소

// `new URL(...).pathname` 은 퍼센트 인코딩을 디코딩하지 않는다 — 공백이 든 경로에서 전부 깨진다.
const AFDS_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const repoRoot = (() => {
  try {
    return execFileSync('git', ['rev-parse', '--show-toplevel'], {
      cwd: AFDS_ROOT,
      encoding: 'utf8',
    }).trim()
  } catch {
    return resolve(AFDS_ROOT, '../..')
  }
})()

/** Base UI 실제 설치 경로. null 이면 파트 인용이 있을 때 실패한다(가드가 조용히 사라지지 않게). */
const baseUiRoot = (() => {
  try {
    return dirname(require_.resolve('@base-ui/react/package.json', { paths: [AFDS_ROOT] }))
  } catch {
    return null
  }
})()

const searchRoots = [
  repoRoot,
  AFDS_ROOT,
  join(AFDS_ROOT, 'src'),
  join(AFDS_ROOT, 'src/bricks'),
  join(AFDS_ROOT, 'docs'),
  join(repoRoot, '.changeset'),
  ...(baseUiRoot ? [baseUiRoot] : []),
]

const symbolRoots = [
  join(AFDS_ROOT, 'src'),
  join(repoRoot, 'packages/afds-registry/src'),
  join(AFDS_ROOT, 'tokens'),
  join(AFDS_ROOT, 'scripts'),
  join(repoRoot, '.claude/rules'),
  join(repoRoot, '.husky'),
  ...(baseUiRoot ? [baseUiRoot] : []),
]

/** AFDS 네임스페이스 파트를 찾을 소스 루트 (스토리 파일 포함). */
const namespaceRoots = [join(AFDS_ROOT, 'src'), join(repoRoot, 'packages/afds-registry/src')]

// 문서별 설정

interface DocConfig {
  /** 문서가 "실재하지 않는다" 를 주장하는 대상 — 존재하면 주장이 깨지므로 실패로 올린다. */
  expectAbsent?: string[]
  /** negative-control 용으로 문서가 의도적으로 인용하는 가짜 이름·자리표시자. */
  fixtures?: string[]
  /** 파일+줄 쌍으로 한정한 가짜 인용 (`파일:줄`). 줄번호만으로 두면 어느 파일이든 무검사가 된다. */
  fixtureCites?: string[]
  /** 명령·규약 예시 등 파일 경로가 아닌 문자열. */
  notPaths?: string[]
  /** 문서의 기준 커밋 — 그 시점에만 존재하고 이후 삭제된 파일도 실재로 인정한다. */
  baselineRefs?: string[]
  /**
   * 추출이 고장났는지 **이름으로** 확인한다. 반드시 추출돼야 하는 인용을 적어 두고, 하나라도
   * 빠지면 실패한다.
   *
   * 개수 하한(`minCounts`)을 쓰지 않는 이유 — 이 저장소에서 개수 게이트가 두 번 무력했다:
   * `filesScanned > 20` 하한은 **68개 중 47개가 사라져도 통과**했고, 등식의 양변이 같은
   * 소스에서 나오면 뿌리를 지워도 함께 줄어 통과했다. 개수는 "무엇이 사라졌는가" 를 말하지
   * 못한다. 카나리아는 이름을 말한다.
   *
   * **무엇을 지키고 무엇은 못 지키는가 (설계 선택이지 결함이 아니다):**
   *   · 지킨다   — 여기 **적어 둔** 인용이 추출·검증 집합에서 사라지는 것
   *   · 못 지킨다 — **적지 않은** 인용이 사라지는 것. 카나리아 집합은 전수가 아니라 **표본**이다
   *
   * 그래서 "카나리아 통과" 를 "인용이 전부 살아 있다" 로 읽으면 안 된다. 인용 하나하나의
   * 실재는 경로·줄인용·심볼·파트 검사가 개별로 보고, 카나리아는 **그 검사들이 돌기는 했는지**
   * (추출 자체가 고장나지 않았는지)를 본다. 층이 다르다.
   *
   * 이름은 추측하지 마라 — `AFDS_DOC_DUMP=1` 로 실제 추출 집합을 덤프해서 골라라. 초안은
   * 이름을 추측해 넣었고 **8건 전부 누락으로 잡혔다**(문서가 쓰는 인용 형태와 달랐다).
   */
  canaries?: {
    paths?: string[]
    symbols?: string[]
    /** `파일:줄` 형태. 추출된 줄 인용 집합에 있어야 한다. */
    cites?: string[]
    /** `Alias.Part` 형태. */
    parts?: string[]
  }
  /**
   * 인용한 **내용이 파일에서 사라진** 것 중, 문서가 이미 그 사실을 본문에 설명한 항목.
   * `파일:줄` 로 **이름을 명시한다** — 개수 상한을 두지 않는다.
   * 여기 적었는데 실제로는 소실이 아니면 죽은 예외로 실패한다.
   */
  knownContentLoss?: string[]
}

const DOC_CONFIG: Record<string, DocConfig> = {
  /**
   * 규칙 문서 — dot-notation 규약을 **자리표시자**로 설명한다.
   *
   * `fixtures` 에 넣는 근거: 이 세 이름은 **부재가 요점**이다. `Component` · `Primitive` 는
   * 특정 컴포넌트가 아니라 「복수 sub-part 를 가진 컴포넌트 일반」을 가리키는 메타 표기이고,
   * 실재하면 오히려 문서의 서술이 좁아진다.
   *
   * **이 목록은 낡지 않는다** — `fixtures`·`notPaths`·`expectAbsent`·`fixtureCites` 는
   * **죽은 예외 검사**가 덮는다(문서에서 그 문자열이 사라지면 `죽은 예외` 로 실패한다).
   * 그래서 항목을 더하는 비용이 낮다. `REF_PREFIXES`·`findByBasename` 루트처럼 **아무것도
   * 갱신을 강제하지 않는 목록과는 부류가 다르다** — 그쪽은 diff 가시성만이 방어다.
   *
   * 꺾쇠 자리표시자(`<name>.spec.md` 류)는 여기 적지 않는다 — 추출 단계가 **구문으로**
   * 건너뛴다(`lib/path-citation.ts`). 규칙으로 되는 것을 목록으로 적지 않는다.
   */
  '.claude/rules/afds-component-philosophy.md': {
    fixtures: ['Primitive.X', 'Component.Root', 'Component.Item'],
  },
  /**
   * 같은 dot-notation 메타 표기를 이 문서도 쓴다(`:96`) — 위와 같은 근거다.
   *
   * 나머지 규칙 문서는 설정이 **없다**(실패 0). 설정을 「일관성」으로 붙이지 않는다.
   * (수를 적지 않는다 — 규칙 파일이 늘면 그 수가 낡는다.)
   */
  '.claude/rules/afds-component-structure.md': {
    fixtures: ['Component.Root', 'Component.Item'],
  },
  /**
   * `expectAbsent` 다 — **예외가 아니라 반대 방향의 단정**이다.
   *
   * 이 문서(`:313`)는 「`tokens/tokens.ts` 는 **존재하지 않는다**. 타입은
   * `src/schemas/tokens.schema.ts` 다」라고 서술한다. 즉 **부재가 문서의 주장**이므로
   * `notPaths` 로 검사에서 빼는 것이 아니라 `expectAbsent` 로 **실재하면 실패**하게 둔다 —
   * 그 파일이 생기면 문서의 서술이 거짓이 되기 때문이다. 예외보다 강한 검사다.
   */
  '.claude/rules/afds-component-tokens.md': {
    expectAbsent: ['tokens/tokens.ts'],
  },
  /**
   * **중괄호 자리표시자** — `{category}` · `{name}` 은 규약의 틀이고 특정 파일이 아니다.
   *
   * `notPaths` 에 적는 것은 **임시 처방**이다. 꺾쇠(`<...>`)는 추출 단계가 구문으로 건너뛰지만
   * (`lib/path-citation.ts`) 중괄호는 아직 아니다 —
   * #214 가 같은 규칙으로 확장하면
   * **이 항목은 지워야 한다.** 안전 근거도 동일하다: `[{}]` 를 포함한 추적 파일이 저장소
   * 0건 · 소비처 0건이다.
   *
   * 규칙으로 되는 것을 목록으로 적는 것이므로 **빚으로 표시해 둔다.**
   */
  '.claude/rules/afds-storybook-headless.md': {
    notPaths: ['src/headless/{category}/{name}.docs.mdx'],
  },
}

/** 코드 심볼이 아닌 토큰 — 커밋 해시·에러코드·DOM 이벤트명·일반 명사. */
const NOT_SYMBOL =
  /^(TS\d+|MODULE_NOT_FOUND|ELIFECYCLE|GIT_DIR|[0-9a-f]{7,8}|animationend|build|dependencies|exports|peerDependencies|peerDependenciesMeta|types|ignore|source|transform|performance|link|table|calendar|variant|positionerProps|condition|__test__)$/

/** 네임스페이스 파트로 볼 수 없는 접두어 — React 등 외부 전역. */
const NOT_NAMESPACE = /^(React|JSX|Intl|Object|Array|Promise|Math|JSON|Node)$/

/** Base UI 원시 별칭 → 서브패스. 이 별칭은 Base UI 에 실재해야 하며 없으면 실패다. */
const PRIMITIVE_SUBPATH: Record<string, string> = {
  DrawerPrimitive: 'drawer',
  ModalPrimitive: 'dialog',
  PopoverPrimitive: 'popover',
  TooltipPrimitive: 'tooltip',
  AccordionPrimitive: 'accordion',
  AvatarPrimitive: 'avatar',
  ProgressPrimitive: 'progress',
  CheckboxPrimitive: 'checkbox',
  CheckboxGroupPrimitive: 'checkbox-group',
  SwitchPrimitive: 'switch',
  SeparatorPrimitive: 'separator',
  ScrollAreaPrimitive: 'scroll-area',
  RadioPrimitive: 'radio',
  RadioGroupPrimitive: 'radio-group',
  InputPrimitive: 'input',
  ButtonPrimitive: 'button',
}

/**
 * AFDS 이름과 겹치는 별칭 → 대응하는 Base UI 서브패스.
 * AFDS 네임스페이스에서 못 찾으면 Base UI 쪽 파트로 한 번 더 본다 —
 * 문서가 두 계층을 같은 표기로 인용하기 때문이다(`Popover.Positioner` 는 Base UI 쪽).
 */
const NAMESPACE_BASEUI_SUBPATH: Record<string, string> = {
  Menu: 'menu',
  Modal: 'dialog',
  Dialog: 'dialog',
  Popover: 'popover',
  Tooltip: 'tooltip',
  Toast: 'toast',
  Select: 'select',
  Accordion: 'accordion',
  Drawer: 'drawer',
  Switch: 'switch',
  Checkbox: 'checkbox',
  RadioGroup: 'radio-group',
  ScrollArea: 'scroll-area',
  Avatar: 'avatar',
  Progress: 'progress',
  Separator: 'separator',
  Input: 'input',
  Field: 'field',
}

// 검사 유틸

/** 개행으로 끝나는 파일에서 1 크게 나오지 않게 한다(off-by-one 방지). */
const readLines = (file: string) => readFileSync(file, 'utf8').replace(/\n$/, '').split('\n')

/**
 * 접두 목록은 **빠른 정확 경로 확인**용이다. 완결성은 접미사 해소가 준다
 * ([[lib/path-resolve.ts]] 의 `existsOnRefFiles` 주석) — 이 목록이 낡아도 **누락을 만들지
 * 않는다.** 예전에는 이것이 유일한 수단이어서 `.changeset/` 의 파일이 ref 에서 안 보였다.
 */
const REF_PREFIXES = ['', 'packages/afds/', 'packages/afds/tokens/', 'packages/afds/src/']

/** ref 시점의 추적 파일 목록. 읽을 수 없으면 `null`(ref 부재와 파일 부재를 구분한다). */
const refFilesCache = new Map<string, string[] | null>()
function refFiles(ref: string): string[] | null {
  const hit = refFilesCache.get(ref)
  if (hit !== undefined) return hit
  const r = spawnSync('git', ['ls-tree', '-r', '--name-only', ref], {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  })
  const out = r.status === 0 ? r.stdout.split('\n').filter(Boolean) : null
  refFilesCache.set(ref, out)
  return out
}

/** 워크트리에 없어도 지정된 ref 들에 존재하면 실재로 인정한다. ref 자체가 없으면 null. */
function existsOnRefs(rel: string, refs: string[]): boolean | null {
  return existsOnRefFiles(
    rel,
    refs.map(r => refFiles(r)),
    REF_PREFIXES,
  )
}

/** ref 시점의 파일 내용. 없으면 null. 같은 파일을 인용마다 다시 읽지 않도록 캐시한다. */
const showCache = new Map<string, string[] | null>()
function showAtRef(ref: string, repoRelPath: string): string[] | null {
  const key = `${ref}:${repoRelPath}`
  const hit = showCache.get(key)
  if (hit !== undefined) return hit
  const r = spawnSync('git', ['show', key], {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  })
  const out =
    r.status !== 0 || typeof r.stdout !== 'string' ? null : r.stdout.replace(/\n$/, '').split('\n')
  showCache.set(key, out)
  return out
}

/**
 * 인용 범위 안의 **자명한 줄** — 괄호·구두점뿐이라 아무 주장도 담지 않는다.
 * 드리프트 판정에서 제외한다. 이런 줄은 어디로 움직여도 문서의 주장과 무관하고,
 * 반대로 "사라졌다" 고 세면 재포맷 한 번에 실패가 쏟아진다.
 */
const isTrivialLine = (raw: string) => {
  const t = raw.trim()
  return t.length <= 3 || /^[{}()[\];,]+$/.test(t)
}

/**
 * 문서 각 줄의 **유래 커밋**(blame). 드리프트 검사의 기준을 여기서 얻는다.
 *
 * 왜 전역 `baselineRefs[0]` 이 아닌가 — 그 모델은 "문서가 기준 커밋에 쓰였고 그 뒤로
 * 손대지 않았다" 를 가정한다. 인용을 **고치는 순간 그 가정이 깨진다.** 실측: 감사 문서의
 * `select.tsx:277-291` 은 #121 이 그 구간을 다시 써서 소실 27건을 냈는데, 현재 줄번호인
 * `:305-317` 로 고치면 기준 커밋의 그 자리에 있던(그리고 지금은 지워진) 다른 코드와
 * 비교돼 **소실 20건**이 난다. 어느 쪽으로 적어도 통과할 수 없었다 —
 * **문서를 참으로 만들어도 만족시킬 수 없는 게이트는 고장난 게이트다.**
 *
 * blame 은 인용마다 "그 인용이 쓰인 시점" 을 준다. 갓 고친 인용은 그 커밋과 비교되므로
 * 드리프트가 0 이고, 오래된 인용은 그때 코드와 비교되므로 드리프트가 그대로 잡힌다.
 *
 * 못 잡는 것: **커밋되지 않은 줄**(blame 이 0으로 채운다)은 비교 기준이 없어 건너뛴다.
 * CI 에서는 전부 커밋돼 있으므로 이 통로가 없지만, 로컬에서 "커밋 전에는 안 걸린다" 는
 * 성질은 남는다. 또 문서를 통째로 재포맷하면 blame 이 그 커밋으로 초기화돼 검사가
 * 약해진다 — 조용히 통과하는 쪽이므로 여기 적어 둔다.
 */
const blameCache = new Map<string, string[] | null>()
function blameLines(repoRelPath: string): string[] | null {
  if (blameCache.has(repoRelPath)) return blameCache.get(repoRelPath)!
  let out: string[] | null = null
  try {
    const raw = execFileSync('git', ['blame', '-p', '--', repoRelPath], {
      cwd: repoRoot,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    const lines: string[] = []
    for (const l of raw.split('\n')) {
      const m = /^([0-9a-f]{40}) \d+ (\d+)(?: \d+)?$/.exec(l)
      if (m) lines[+m[2]] = m[1]
    }
    out = lines
  } catch {
    out = null
  }
  blameCache.set(repoRelPath, out)
  return out
}

/** blame 이 "아직 커밋되지 않음" 으로 표시하는 SHA. */
const UNCOMMITTED_SHA = '0'.repeat(40)

/**
 * 저장소 추적 파일 목록(저장소 상대 경로). 접미사 해소의 검색 공간이다.
 *
 * `git ls-files` 를 쓰는 이유: gitignore 를 그대로 따르므로 `node_modules` · `dist` 같은
 * 산출물이 섞이지 않는다(같은 파일이 배포본에도 있어 **모호**해지는 것을 막는다).
 * 실패해도 검사를 죽이지 않는다 — 빈 목록이면 접미사 해소만 동작하지 않는다.
 */
const repoFiles: string[] = (() => {
  try {
    return execFileSync('git', ['ls-files'], { cwd: repoRoot, encoding: 'utf8' })
      .split('\n')
      .filter(Boolean)
  } catch {
    return []
  }
})()

function findByBasename(name: string): string[] {
  const roots = [join(AFDS_ROOT, 'src'), join(AFDS_ROOT, 'tokens'), AFDS_ROOT]
  const out: string[] = []
  const walk = (dir: string) => {
    let entries
    try {
      entries = readdirSync(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const e of entries) {
      if (e.name === 'node_modules' || e.name === 'dist') continue
      const p = join(dir, e.name)
      if (e.isDirectory()) walk(p)
      else if (e.name === name) out.push(p)
    }
  }
  for (const r of roots) {
    walk(r)
    if (out.length) return out
  }
  return out
}

/**
 * 단어 경계를 고정한 재귀 검색. 부분 문자열 매칭은 이 저장소에서 이미 세 번 오탐을 냈다.
 *
 * ⚠️ **이 파일 자신을 검색 대상에서 제외한다.** `symbolRoots` 가 `packages/afds/scripts/` 를
 * 포함하는데 이 검증기가 거기 있으므로, 제외하지 않으면 **카나리아로 이름을 적는 행위가 그
 * 심볼을 "실재" 로 만든다**(자기충족). 실제로 신규 문서 카나리아 2개가 그렇게 통과했고
 * 심볼 계수를 3 부풀렸다 — 독립 리뷰가 적발했다.
 */
const SELF_FILE = basename(fileURLToPath(import.meta.url))
const grepWordIn = (needle: string, root: string, excludeSelf: boolean) =>
  existsSync(root) &&
  spawnSync('grep', [
    '-rqE',
    '--exclude-dir=node_modules',
    ...(excludeSelf ? [`--exclude=${SELF_FILE}`] : []),
    `(^|[^A-Za-z0-9_$])${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^A-Za-z0-9_$]|$)`,
    root,
  ]).status === 0

/**
 * 일반 심볼·파트 검사 — **이 파일을 포함**해서 찾는다. 문서가 이 검증기의 설정 키
 * (`DOC_CONFIG` · `knownContentLoss` 등)를 정당하게 설명하므로 그것들은 실재로 인정해야 한다.
 */
const grepWord = (needle: string, root: string) => grepWordIn(needle, root, false)

/**
 * 카나리아 충족 판정 — **이 파일을 제외**해서 찾는다. 제외하지 않으면 카나리아로 이름을 적는
 * 행위가 그 심볼을 "실재" 로 만든다(자기충족). 두 검사의 대상이 다른 것이 요점이다.
 */
const grepWordExceptSelf = (needle: string, root: string) => grepWordIn(needle, root, true)

/**
 * 저장소 내부를 가리키는 주장인가 — 이런 경로는 **항상 실재해야 한다**.
 * 그 밖(소비처 저장소 경로·bare basename)은 대조할 대상이 없어 미검증으로 집계한다.
 */
const isRepoScoped = (p: string) =>
  /^(packages|scripts|tokens|docs|\.changeset|\.github|\.husky|\.claude)\//.test(p) ||
  p.startsWith('./dist/') ||
  p.startsWith('src/bricks/') ||
  p.startsWith('src/compositions/') ||
  p.startsWith('src/headless/') ||
  p.startsWith('src/lib/') ||
  p.startsWith('src/styles/') ||
  p.startsWith('src/hooks/')

// 본체

interface Result {
  fail: string[]
  unverified: string[]
  /** 줄 이동 — 인용한 내용은 그대로 있고 줄번호만 밀렸다. **정보이지 게이트가 아니다.** */
  moved: string[]
  counts: Record<string, number>
  notes: string[]
}

function verifyDoc(docRel: string): Result {
  /**
   * 대상 문서 경로. **저장소 루트 기준을 먼저** 보고 `packages/afds` 기준으로 폴백한다.
   *
   * 등록 문서가 `packages/afds` 밖으로 넓어졌기 때문이다(`docs/info/harness.md` ·
   * `.claude/rules/*.md` · `packages/afds-registry/**`). 폴백을 남기는 이유는 옛 표기
   * (`docs/base-ui-coverage-audit.md` 처럼 afds 기준 상대경로)와 CLI 인자 편의 때문이다.
   *
   * ⚠️ **`README.md` 처럼 양쪽에 다 있는 이름을 대상으로 쓰지 마라** — 어느 파일인지
   * 모호해진다. 그래서 아래 `DEFAULT_DOCS` 는 **전부 저장소 루트 기준**으로 적는다.
   */
  const docPath = isAbsolute(docRel)
    ? docRel
    : ([join(repoRoot, docRel), join(AFDS_ROOT, docRel)].find(existsSync) ??
      join(AFDS_ROOT, docRel))
  const notes: string[] = []
  // 사본·초안도 검증할 수 있게 basename 으로도 설정을 찾는다 — 다만 쓰였으면 밝힌다.
  let cfg = DOC_CONFIG[docRel]
  if (!cfg) {
    const byBase = Object.keys(DOC_CONFIG).find(k => basename(k) === basename(docRel))
    if (byBase) {
      cfg = DOC_CONFIG[byBase]
      notes.push(`설정 basename 폴백: '${docRel}' → '${byBase}' 의 예외를 물려받았다`)
    }
  }
  cfg ??= {}
  const fixtures = new Set(cfg.fixtures ?? [])
  const fixtureCites = new Set(cfg.fixtureCites ?? [])
  const expectAbsent = new Set(cfg.expectAbsent ?? [])
  const notPaths = new Set(cfg.notPaths ?? [])
  const refs = cfg.baselineRefs ?? []

  const doc = readFileSync(docPath, 'utf8')

  const fail: string[] = []
  const unverified: string[] = []
  const moved: string[] = []
  const knownLoss = new Set(cfg.knownContentLoss ?? [])
  const seenLoss = new Set<string>()
  /**
   * 소실 검사가 **실제로 돌았는지** 추적한다. 기준 ref 를 못 읽으면(shallow clone · ref 도달 불가)
   * 검사가 조용히 사라지는데, `knownContentLoss` 가 비어 있는 문서에서는 그것을 관측할 수단이
   * 없었다 — 돌연변이 테스트에서 이 구멍으로 두 개가 살아남았다.
   */
  const baseline = { probed: 0, read: 0, unreadable: new Set<string>() }
  /** 이 문서 각 줄의 유래 커밋. 드리프트 기준을 인용마다 여기서 얻는다. */
  const docBlame = blameLines(relative(repoRoot, docPath))
  /** 아직 커밋되지 않은 줄에 적힌 인용 수 — 기준이 없어 비교하지 못한 건수. */
  let uncommittedCites = 0
  /** 자명한 줄이라 드리프트 판정에서 제외한 건수. */
  let trivialSkipped = 0
  /** 카나리아 충족 확인용 — 실제로 추출·검증된 것을 모은다. */
  const seen = {
    paths: new Set<string>(),
    symbols: new Set<string>(),
    cites: new Set<string>(),
    parts: new Set<string>(),
  }
  const counts: Record<string, number> = { 경로: 0, 줄인용: 0, 심볼: 0, 파트: 0 }

  // 0) 예외 목록 자체를 검사한다 — 문서에 없는 예외는 "무조건 통과" 화이트리스트로 남는다.
  for (const [key, list] of [
    ['fixtures', cfg.fixtures],
    ['fixtureCites', cfg.fixtureCites],
    ['notPaths', cfg.notPaths],
    ['expectAbsent', cfg.expectAbsent],
  ] as const) {
    for (const item of list ?? [])
      if (!doc.includes(item))
        fail.push(`죽은 예외: ${key} 의 '${item}' 가 문서에 없다 — 제거해라(무검사 통로가 된다)`)
  }

  // 1) 파일 경로 — 추출은 `lib/path-citation.ts` 가 한다(순수 함수 — 픽스처로 고정된다).
  const paths = extractPathCitations(doc)
  // 부재 주장은 건너뛰지 않고 반대로 단정한다 — 생기면 문서의 주장이 깨진다.
  for (const p of expectAbsent) {
    const hit = searchRoots.map(r => join(r, p)).find(existsSync)
    if (hit) fail.push(`부재 주장 깨짐: ${p} 가 실재한다 (${relative(repoRoot, hit)})`)
    else counts.경로++
  }
  for (const p of paths) {
    if (notPaths.has(p) || expectAbsent.has(p) || fixtures.has(p)) continue
    // 분기 **순서**가 정확성의 근거이므로 판정은 `lib/path-citation.ts` 가 한 함수로 한다
    // (순수 함수 — 픽스처로 고정된다). 여기서는 관측만 하고 결과를 문장으로 옮긴다.
    const suffixHits = resolveBySuffix(p, repoFiles)
    const verdict = classifyPathCitation(p, {
      existsInSearchRoots: searchRoots.some(r => existsSync(join(r, p))),
      basenameHits: p.includes('/') ? 0 : findByBasename(p).length,
      suffixHits,
      onRef: existsOnRefs(p, refs),
      hasRefs: refs.length > 0,
      repoScoped: isRepoScoped(p),
    })
    switch (verdict.kind) {
      case 'resolved':
        counts.경로++
        seen.paths.add(p)
        break
      case 'ref-unverifiable':
        unverified.push(`기준 ref 조회 불가(shallow clone?): ${p}`)
        break
      case 'ambiguous':
        fail.push(
          `경로 모호: ${p} 가 접미사로 ${verdict.hits.length}건에 걸린다 — 디렉터리를 한 칸 더 붙여라 (${verdict.hits.slice(0, 3).join(' · ')}${verdict.hits.length > 3 ? ' …' : ''})`,
        )
        break
      case 'consumer-unverified':
        unverified.push(`저장소 범위 밖 경로 — 대조할 대상이 없어 판정하지 않는다: ${p}`)
        break
      case 'missing':
        fail.push(`경로 미확인: ${p}`)
        break
    }
  }

  // 2) 줄 인용 — `파일:줄` 과, 직전 파일을 물려받는 `:줄` 단독 인용
  // 추출·선행사 판정은 `lib/citation-antecedent.ts` 가 한다(순수 함수 — 픽스처로 고정된다).
  const { cites, contextless } = extractCitations(doc)
  for (const raw of contextless)
    unverified.push(`문맥 없는 줄 인용 — 같은 블록에 파일 인용이 없어 판정 불가: ${raw}`)
  /** 드리프트 검사는 (파일,줄) 쌍마다 한 번만 한다. */
  const driftSeen = new Set<string>()
  for (const c of cites) {
    if (fixtureCites.has(`${c.file}:${c.to}`) || fixtureCites.has(`${c.file}:${c.from}`)) continue
    let f = searchRoots.map(r => join(r, c.file)).find(existsSync)
    if (!f && !c.file.includes('/')) f = findByBasename(basename(c.file))[0]
    // 위와 같은 접미사 해소. 줄 범위·내용 검사가 **실제 파일**에 대해 돌게 된다.
    if (!f) {
      const hit = uniqueBySuffix(c.file, repoFiles)
      if (hit) f = join(repoRoot, hit)
    }
    if (!f) {
      if (existsOnRefs(c.file, refs) === true) continue // 다른 ref 의 파일 — 줄 범위는 검사 불가
      if (!isRepoScoped(c.file)) {
        unverified.push(`저장소 범위 밖 인용 — 대조할 대상이 없어 판정하지 않는다: ${c.raw}`)
        continue
      }
      fail.push(`인용 파일 미해소: ${c.raw}`)
      continue
    }
    const lines = readLines(f)
    const n = lines.length
    // 끝 줄만 보면 시작 줄의 오류(범위 역전·범위 초과)를 놓친다.
    if (c.from < 1 || c.from > c.to || c.to > n) {
      fail.push(`인용 범위 오류: ${c.raw} (파일 ${n}줄, from=${c.from} to=${c.to})`)
      continue
    }
    counts.줄인용++
    seen.cites.add(`${c.file}:${c.from}${c.to !== c.from ? `-${c.to}` : ''}`)

    // 인용 시점 대비 줄 내용 드리프트 — 검증기가 "실재" 만 보면 놓치는 유형이다.
    // 기준은 **그 인용이 적힌 문서 줄의 blame 커밋**이다(§blameLines 주석: 전역
    // baselineRefs 를 쓰면 인용을 고쳐도 통과할 수 없다).
    const rel = relative(repoRoot, f)
    if (rel.startsWith('..')) continue
    // 위에 추가되는(prepend) 파일은 줄 번호로 가리키는 것이 원리적으로 유지되지 않는다.
    // 근거와 실측은 `./lib/citation-drift` 의 `isPrependOnlyPath` 주석에 있다.
    // **드리프트 판정에서만** 제외한다 — 파일·범위·심볼 실재 검사는 그대로 받는다.
    if (isPrependOnlyPath(rel)) continue
    const provenance = docBlame?.[c.docLine]
    if (!provenance) {
      // blame 을 못 읽었다 — 조용히 넘기지 않는다.
      baseline.probed++
      if (!baseline.unreadable.has(docRel)) {
        baseline.unreadable.add(docRel)
        unverified.push(`${docRel} 의 blame 을 읽을 수 없다 — 소실 검사가 돌지 않았다`)
      }
      continue
    }
    if (provenance === UNCOMMITTED_SHA) {
      // 작업 트리에서 방금 고친 줄 — 비교 기준이 없다. probed 로 세지 않는다(초안 작성을
      // 막지 않기 위해). CI 는 전부 커밋 상태라 이 분기가 없다.
      uncommittedCites++
      continue
    }
    baseline.probed++
    const baseLines = showAtRef(provenance, rel)
    if (!baseLines) {
      const k = `${provenance.slice(0, 7)}:${rel}`
      if (!baseline.unreadable.has(k)) {
        baseline.unreadable.add(k)
        unverified.push(
          `유래 ${provenance.slice(0, 7)} 에서 ${rel} 을 읽을 수 없다 — 이 인용의 소실 검사는 돌지 않았다`,
        )
      }
      continue
    }
    baseline.read++
    for (let ln = c.from; ln <= c.to; ln++) {
      const key = `${rel}:${ln}`
      if (driftSeen.has(key)) continue
      driftSeen.add(key)
      const b = baseLines[ln - 1] ?? null
      const cur = lines[ln - 1] ?? null
      if (b === cur) continue
      if (b !== null && isTrivialLine(b)) {
        trivialSkipped++
        continue
      }
      // 세 종류를 구분한다. 섞어서 개수로 세면 "무엇이 틀렸는가" 를 말할 수 없다.
      if (b !== null && b.trim() !== '' && lines.includes(b)) {
        // ① 줄 이동 — 인용한 내용이 파일 안에 **그대로** 있다. 줄번호만 밀렸다.
        moved.push(`${key} → 현재 :${nearestIndex(lines, b, ln, true) + 1} (인용 ${c.raw})`)
      } else if (b !== null && b.trim() !== '' && nearestIndex(lines, b, ln, false) >= 0) {
        // ② 줄 이동(들여쓰기 변경) — 내용은 같고 앞뒤 공백만 다르다.
        //    #121 이 화살표 함수를 블록 본문으로 바꾸며 구간 전체를 2칸 밀었다. 그것을
        //    "내용 소실" 로 세면 **재들여쓰기 한 번에 27건이 게이트에 걸린다** — 실측값이다.
        //    내용은 살아 있으므로 소실이 아니다. 다만 줄이동과 구분해 적는다.
        moved.push(
          `${key} → 현재 :${nearestIndex(lines, b, ln, false) + 1} (들여쓰기 변경, 인용 ${c.raw})`,
        )
      } else {
        // ③ 내용 소실 — 인용한 내용이 파일에서 사라졌다. 문서가 없는 것을 인용하고 있다 → 실패.
        seenLoss.add(key)
        if (!knownLoss.has(key))
          fail.push(
            `인용 내용 소실: ${key} — 유래 ${provenance.slice(0, 7)} 의 내용이 현재 파일에 없다 (인용 ${c.raw})`,
          )
      }
    }
  }

  // 3) 코드 심볼 — 단어 경계 고정
  const syms = new Set<string>()
  for (const m of doc.matchAll(/`([A-Za-z_$][A-Za-z0-9_$]*)`/g)) {
    const s = m[1]
    if (s.length < 4 || NOT_SYMBOL.test(s) || fixtures.has(s)) continue
    syms.add(s)
  }
  for (const s of syms) {
    const found = symbolRoots.some(r => grepWord(s, r))
    if (found) {
      counts.심볼++
      // 카나리아 충족은 **자기 파일을 뺀** 검색으로만 인정한다(자기충족 차단).
      if (symbolRoots.some(r => grepWordExceptSelf(s, r))) seen.symbols.add(s)
    } else
      unverified.push(`심볼 — 저장소에서 찾지 못했다(소비처 심볼일 수 있어 판정하지 않는다): ${s}`)
  }

  // 4) 네임스페이스 파트 — 없는 파트를 안내하는 유형을 막는다.
  //    `*Primitive.*` 만 보면 문서가 같은 뜻으로 쓰는 `Popover.Positioner` 류를 놓친다.
  const partCites = new Set<string>()
  for (const m of doc.matchAll(/`([A-Z][A-Za-z0-9_]*)\.([A-Z][A-Za-z0-9_]*)`/g)) {
    if (NOT_NAMESPACE.test(m[1])) continue
    partCites.add(`${m[1]}.${m[2]}`)
  }
  const kebab = (n: string) => n.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
  const inBaseUi = (sub: string, part: string) => {
    if (!baseUiRoot) return false
    if (existsSync(join(baseUiRoot, sub, kebab(part)))) return true
    const barrel = join(baseUiRoot, sub, 'index.d.ts')
    return existsSync(barrel) && new RegExp(`\\b${part}\\b`).test(readFileSync(barrel, 'utf8'))
  }
  if (!baseUiRoot && partCites.size) {
    // 가드가 안 돌면 통과가 아니라 실패다 — 이 저장소에서 "넣었지만 안 도는 가드" 가 12건 나왔다.
    fail.push(
      `Base UI 미설치 — 파트 ${partCites.size}건을 검사할 수 없다(@base-ui/react 설치 필요)`,
    )
  } else {
    for (const cite of partCites) {
      if (fixtures.has(cite)) continue // negative-control · 자리표시자
      const [alias, part] = cite.split('.')
      if (PRIMITIVE_SUBPATH[alias]) {
        const sub = PRIMITIVE_SUBPATH[alias]
        if (inBaseUi(sub, part)) {
          counts.파트++
          seen.parts.add(cite)
        } else
          fail.push(`Base UI 파트 부재: ${cite} — @base-ui/react/${sub} 에 ${kebab(part)} 없음`)
        continue
      }
      // AFDS 네임스페이스: 소스에서 실제로 그 표기로 쓰이는가 → 아니면 Base UI 쪽 파트인가
      if (namespaceRoots.some(r => grepWord(cite, r))) {
        counts.파트++
        seen.parts.add(cite)
        continue
      }
      const sub = NAMESPACE_BASEUI_SUBPATH[alias]
      if (sub && inBaseUi(sub, part)) {
        counts.파트++
        seen.parts.add(cite)
        continue
      }
      fail.push(
        `네임스페이스 파트 미확인: ${cite} — AFDS 소스에도 없고 ` +
          `${sub ? `@base-ui/react/${sub} 에도 ${kebab(part)} 가 없다` : `별칭 ${alias} 가 미등록이다`}`,
      )
    }
  }

  // 카나리아 이름은 추측하지 말고 이 덤프에서 골라라 — 실제로 추출·검증된 이름만 유효하다.
  if (process.env.AFDS_DOC_DUMP)
    for (const k of ['paths', 'cites', 'symbols', 'parts'] as const)
      console.log(`\n[dump ${k}] ${[...seen[k]].sort().join(' | ')}`)

  // 5) 카나리아 — 추출이 고장났는지 **이름으로** 확인한다. 개수 하한은 쓰지 않는다(§DocConfig 주석).
  for (const [kind, list] of Object.entries(cfg.canaries ?? {})) {
    const got = seen[kind as keyof typeof seen]
    for (const name of (list as string[]) ?? [])
      if (!got.has(name))
        fail.push(`카나리아 누락: ${kind} 의 '${name}' 이 추출·검증 집합에 없다 — 추출이 고장났다`)
  }

  // 6) 소실 검사가 통째로 안 돌았으면 실패 — "가드가 안 돌면 통과가 아니라 실패다".
  //     `knownContentLoss` 가 비어 있는 문서에도 적용되는 것이 요점이다(역방향 카나리아가 없으므로).
  if (baseline.probed > 0 && baseline.read === 0)
    fail.push(
      `유래 커밋에서 인용 파일을 한 건도 읽지 못했다 (${baseline.probed}건 시도) — ` +
        `인용 내용 소실 검사가 전혀 돌지 않았다. shallow clone 이면 fetch 깊이를 늘려라`,
    )
  // 인용이 있는데 blame 기준이 하나도 서지 않았으면 그것도 "안 돈 것" 이다.
  if (cites.length > 0 && baseline.probed === 0 && uncommittedCites === 0)
    fail.push(
      `줄 인용 ${cites.length}건이 있는데 소실 검사가 한 건도 시도되지 않았다 — 배선이 끊겼다`,
    )

  if (uncommittedCites)
    notes.push(`작업 트리 인용 ${uncommittedCites}건 — 커밋 전이라 기준 비교 없음`)
  if (trivialSkipped) notes.push(`자명한 줄 ${trivialSkipped}건 — 드리프트 판정 제외`)

  // 7) 죽은 knownContentLoss — 소실이 아닌데 예외로 남아 있으면 무검사 통로가 된다.
  for (const key of knownLoss)
    if (!seenLoss.has(key))
      fail.push(`죽은 예외: knownContentLoss 의 '${key}' 는 실제로 소실이 아니다 — 제거해라`)

  return { fail, unverified, moved, counts, notes }
}

// 실행

// 기본 대상에 등록하지 않으면 카나리아 전체가 "사람이 경로를 손으로 칠 때만" 돈다(리뷰 적발).

// 문서 import 진실성 — `import { X } from '@turbo-project/afds*'` 의 X 가 실재하는가
//
// 위의 인용 검사는 **경로·줄·심볼**을 본다. import 문이 실제 export 로 **해소되는지**는
// 아무도 보지 않았다. 그 층이 이 절이다.
//
// ## 정본 표면
//
// `src/index.ts` 를 grep 하면 안 된다 — 순수 배럴(`export * from ...`)이라 `Button`·`Input`·
// `Select` 가 전부 미해소로 나오고, `dist/index.d.ts` 도 마찬가지다(6줄짜리 `export *`).
// 정본은 **빌드 산출물을 실제로 `import()` 한 런타임 표면**이고, 여기에 TypeScript
// 컴파일러가 푼 **타입 표면**을 더한다(`ButtonProps` 처럼 값이 아닌 export 가 있다).
//
// **표면을 못 읽으면 통과가 아니라 실패다.** 빌드 전에 돌리면 검사가 통째로 사라지므로
// CI 에서 이 단계는 Build 뒤에 있다.
//
// ## 계획 언급과 동작하는 import 를 가르는 3분할
//
//   ① 게이트   — **코드펜스 안**의 import. 대상 언어태그: tsx · ts · js · jsx · 무태그.
//                (무태그 3건 중 1건이 실제 결함이었다 — 태그 없다고 빼면 놓친다.)
//   ② 게이트 아님 — 산문·표의 백틱 인용. 계획 문서가 아직 없는 것을 언급하는 것과,
//                **결함을 보고하는 표 행**이 여기 들어간다. 후자를 게이트하면 이 저장소의
//                `stage4-component-priority.md` §1.3b 표가 자기 보고 때문에 실패한다.
//   ③ 별도 게이트 — `- [x] … 구현` 완료 표기. 존재 주장이므로 따로 본다.
//
// 언어태그를 판정에 **쓴다.** mdx·sh·bash·markdown 태그 펜스는 게이트 대상이 아니다 —
// `.claude/rules/afds-storybook-headless.md` 의 `mdx` 펜스는 스토리 템플릿이고 그 안의
// `hookName` 은 자리표시자다.
//
// ## 펜스 추적은 CommonMark 규칙으로 한다
//
// 순진한 토글(``` 를 볼 때마다 뒤집기)은 이 저장소에서 세 번 물었다: 4백틱 펜스를
// 3백틱으로 세어 없는 "불균형 펜스" 결함을 만들 뻔했고, 표적 4줄 중 2줄을 오분류했다.
// 그래서 여는 길이·같은 문자·정보 문자열 없음까지 본다.

interface FenceInfo {
  inFence: boolean
  lang: string | null
}

/** CommonMark 코드펜스 추적. 여는 길이 이상의 같은 문자 + 정보 문자열 없음이 닫는 조건이다. */
function fenceScan(lines: string[]): { info: FenceInfo[]; unclosed: boolean } {
  const info: FenceInfo[] = []
  let open: { char: string; len: number; lang: string } | null = null
  for (const line of lines) {
    const m = /^( {0,3})(`{3,}|~{3,})(.*)$/.exec(line)
    if (open) {
      if (m && m[2][0] === open.char && m[2].length >= open.len && m[3].trim() === '') {
        info.push({ inFence: false, lang: open.lang })
        open = null
        continue
      }
      info.push({ inFence: true, lang: open.lang })
      continue
    }
    if (m) {
      // 백틱 펜스의 정보 문자열에는 백틱이 올 수 없다(CommonMark). 인라인 코드와 구분된다.
      if (m[2][0] === '`' && m[3].includes('`')) {
        info.push({ inFence: false, lang: null })
        continue
      }
      open = { char: m[2][0], len: m[2].length, lang: m[3].trim().split(/\s+/)[0] ?? '' }
      info.push({ inFence: false, lang: open.lang })
      continue
    }
    info.push({ inFence: false, lang: null })
  }
  return { info, unclosed: open !== null }
}

/** 게이트 대상 언어태그. 무태그(`''`)를 포함한다 — 실측 결함이 거기서 나왔다. */
const GATED_LANGS = new Set(['tsx', 'ts', 'js', 'jsx', 'javascript', 'typescript', ''])

/**
 * 문서에 일부러 적어 둔 자리표시자 import. **파일·줄·이름 셋을 모두 맞춰야** 넘어간다 —
 * 이름만 예외로 두면 다른 문서에서 같은 이름을 잘못 써도 통과한다.
 */
const IMPORT_FIXTURES = new Set([
  // 스토리북 템플릿의 훅 이름 자리표시자(`# {HookName}` 과 짝이다).
  '.claude/rules/afds-storybook-headless.md:hookName',
])

/** 문서 import 검사 대상. 에이전트가 읽는 문서를 전부 포함한다. */
const IMPORT_SCAN_GLOBS = [
  'packages/afds/docs',
  '.claude/rules',
  'README.md',
  'packages/afds/README.md',
]

interface Surface {
  /** 서브패스 → 런타임 값 export 이름. */
  values: Map<string, Set<string>>
  /** 서브패스 → 타입 export 이름(값 포함). */
  types: Map<string, Set<string>>
  /** 표면을 읽지 못한 이유. 비어 있지 않으면 검사는 실패다. */
  errors: string[]
}

/** package.json `exports` 에서 JS 서브패스를 **유도한다.** 하드코딩하면 새 서브패스를 놓친다. */
function jsSubpaths(): Map<string, string> {
  const pkg = JSON.parse(readFileSync(join(AFDS_ROOT, 'package.json'), 'utf8'))
  const out = new Map<string, string>()
  for (const [key, val] of Object.entries<any>(pkg.exports ?? {})) {
    const target = typeof val === 'string' ? val : val?.default
    if (typeof target === 'string' && target.endsWith('.js')) out.set(key, target)
  }
  return out
}

async function loadSurface(): Promise<Surface> {
  const values = new Map<string, Set<string>>()
  const types = new Map<string, Set<string>>()
  const errors: string[] = []
  const subpaths = jsSubpaths()
  if (subpaths.size === 0) errors.push('package.json exports 에서 JS 서브패스를 하나도 찾지 못했다')

  for (const [key, target] of subpaths) {
    const file = join(AFDS_ROOT, target)
    if (!existsSync(file)) {
      errors.push(`빌드 산출물이 없다: ${target} (서브패스 '${key}') — 먼저 pnpm build`)
      continue
    }
    try {
      const mod = await import(pathToFileURL(file).href)
      values.set(key, new Set(Object.keys(mod)))
    } catch (e) {
      errors.push(`서브패스 '${key}' 를 import 하지 못했다: ${String(e).slice(0, 160)}`)
    }
  }

  // 타입 표면 — `.d.ts` 는 순수 배럴이라 정규식으로 못 푼다. 컴파일러가 푼다.
  try {
    const ts = require_(require_.resolve('typescript', { paths: [AFDS_ROOT] }))
    const entries = new Map<string, string>()
    for (const [key, target] of subpaths) {
      const dts = join(AFDS_ROOT, target.replace(/\.js$/, '.d.ts'))
      if (existsSync(dts)) entries.set(key, dts)
    }
    const prog = ts.createProgram([...entries.values()], {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      skipLibCheck: true,
      noEmit: true,
    })
    const checker = prog.getTypeChecker()
    for (const [key, dts] of entries) {
      const sf = prog.getSourceFile(dts)
      const sym = sf && checker.getSymbolAtLocation(sf)
      if (!sym) {
        errors.push(`타입 표면을 읽지 못했다: 서브패스 '${key}' (${relative(AFDS_ROOT, dts)})`)
        continue
      }
      types.set(key, new Set(checker.getExportsOfModule(sym).map((s: any) => s.getName())))
    }
  } catch (e) {
    errors.push(`타입 표면 로드 실패: ${String(e).slice(0, 160)}`)
  }
  return { values, types, errors }
}

interface ImportHit {
  file: string
  line: number
  spec: string
  names: string[]
  hasDefault: string | null
  inFence: boolean
  lang: string | null
}

/** `... from '@turbo-project/afds*'` 로 끝나는 import 문을 여러 줄에 걸쳐 뽑는다. */
function extractImports(file: string, lines: string[], info: FenceInfo[]): ImportHit[] {
  const out: ImportHit[] = []
  for (let i = 0; i < lines.length; i++) {
    const m = /from\s+['"](@turbo-project\/afds[^'"]*)['"]/.exec(lines[i])
    if (!m) continue
    let s = i
    while (s >= 0 && i - s < 40 && !/(^|\s)import(\s|$)/.test(lines[s])) s--
    if (s < 0 || !/(^|\s)import(\s|$)/.test(lines[s])) continue
    const stmt = lines.slice(s, i + 1).join('\n')
    const text = stmt.slice(stmt.lastIndexOf('import'))
    const clause = text.slice(0, text.indexOf('from'))
    const braced = /\{([\s\S]*)\}/.exec(clause)
    const names: string[] = []
    if (braced)
      for (const part of braced[1].split(',')) {
        const p = part.trim().replace(/^type\s+/, '')
        if (p) names.push(p.split(/\s+as\s+/)[0].trim())
      }
    const star = /\*\s+as\s+[A-Za-z0-9_$]+/.test(clause)
    const dflt = !braced && !star ? /^import\s+(?:type\s+)?([A-Za-z0-9_$]+)/.exec(clause) : null
    out.push({
      file,
      line: i + 1,
      spec: m[1],
      names,
      hasDefault: dflt ? dflt[1] : null,
      inFence: info[s].inFence || info[i].inFence,
      lang: info[s].lang ?? info[i].lang,
    })
  }
  return out
}

interface ImportResult {
  fail: string[]
  notes: string[]
  counts: Record<string, number>
}

async function verifyImports(): Promise<ImportResult> {
  const fail: string[] = []
  const notes: string[] = []
  const counts: Record<string, number> = {
    문서: 0,
    펜스: 0,
    import문: 0,
    게이트대상: 0,
    이름: 0,
    완료표기: 0,
  }

  const surface = await loadSurface()
  if (surface.errors.length) {
    // 표면을 못 읽었는데 "위반 0건" 으로 넘어가면 검사가 통째로 사라진 것을 알 수 없다.
    surface.errors.forEach(e => fail.push(`export 표면을 읽지 못했다 — 검사가 돌지 않았다: ${e}`))
    return { fail, notes, counts }
  }
  notes.push(
    `정본 표면 ${[...surface.values]
      .map(([k, v]) => `${k}=${v.size}`)
      .join(
        ' · ',
      )} (런타임 값) · 타입 ${[...surface.types].map(([k, v]) => `${k}=${v.size}`).join(' · ')}`,
  )

  let files: string[]
  try {
    files = execFileSync('git', ['ls-files', ...IMPORT_SCAN_GLOBS], {
      cwd: repoRoot,
      encoding: 'utf8',
    })
      .trim()
      .split('\n')
      .filter(f => f.endsWith('.md'))
  } catch (e) {
    fail.push(`문서 목록을 얻지 못했다 — 검사가 돌지 않았다: ${String(e).slice(0, 120)}`)
    return { fail, notes, counts }
  }
  if (files.length === 0) {
    fail.push('검사 대상 문서가 0건이다 — 경로 목록이 깨졌다')
    return { fail, notes, counts }
  }

  const resolveName = (subKey: string, name: string) =>
    surface.values.get(subKey)?.has(name) || surface.types.get(subKey)?.has(name)

  for (const f of files) {
    counts.문서++
    const lines = readFileSync(join(repoRoot, f), 'utf8').split('\n')
    const { info, unclosed } = fenceScan(lines)
    counts.펜스 += info.filter(x => x.inFence).length
    if (unclosed) fail.push(`${f}: 닫히지 않은 코드펜스가 있다 — 문서 구조가 깨졌다`)

    // ── 구조 게이트 ①: 펜스 밖의 맨줄 import.
    // 백틱 없이 열 0 에서 시작하는 `import` 는 산문이 아니다 — 여는 펜스를 잃은 코드블록이다.
    // 실측: `composition-patterns.md:323` 이 그랬고, 그 블록의 마크다운(`## 패턴 7`)이
    // 아래 4백틱 펜스에 통째로 삼켜져 코드로 렌더되고 있었다.
    for (let i = 0; i < lines.length; i++) {
      if (!info[i].inFence && /^import\s/.test(lines[i]) && !lines[i].includes('`'))
        fail.push(`${f}:${i + 1}: 펜스 밖에 맨줄 import 가 있다 — 여는 코드펜스가 빠졌다`)
      // ── 구조 게이트 ②: 펜스 **안**의 마크다운 헤딩(h2 이상).
      // 코드에 `## ` 로 시작하는 줄은 거의 없다. 있다면 펜스가 마크다운을 삼킨 것이다.
      if (info[i].inFence && GATED_LANGS.has(info[i].lang ?? '') && /^#{2,6}\s\S/.test(lines[i]))
        fail.push(`${f}:${i + 1}: 코드펜스 안에 마크다운 헤딩이 있다 — 펜스 경계가 어긋났다`)
    }

    // ── 게이트 ③: 완료 표기. `- [x] … 구현` 은 "그 컴포넌트가 있다" 는 주장이다.
    for (let i = 0; i < lines.length; i++) {
      if (info[i].inFence) continue
      if (!/^\s*[-*]\s*\[x\]/i.test(lines[i]) || !/구현/.test(lines[i])) continue
      counts.완료표기++
      // 백틱 안의 식별자만 본다 — 산문의 일반 명사를 컴포넌트로 오인하지 않기 위해서다.
      for (const bt of lines[i].matchAll(/`([A-Z][A-Za-z0-9]*)`/g)) {
        const nm = bt[1]
        if (![...surface.values.keys()].some(k => resolveName(k, nm)))
          fail.push(
            `${f}:${i + 1}: 완료로 표기했는데 \`${nm}\` 가 어느 서브패스에서도 export 되지 않는다`,
          )
      }
    }

    // ── 게이트 ④: 펜스 안 import 의 이름 해소.
    for (const hit of extractImports(f, lines, info)) {
      counts['import문']++
      if (!hit.inFence) continue // ② 산문·표의 백틱 인용 — 게이트 아님
      if (!GATED_LANGS.has(hit.lang ?? '')) continue // mdx·sh·markdown 등 — 게이트 아님
      // 정규식·글롭 자리표시자는 리터럴 스펙파이어가 아니다.
      if (!/^@turbo-project\/afds(\/[A-Za-z0-9._/-]+)?$/.test(hit.spec)) continue
      counts.게이트대상++

      const subKey =
        hit.spec === '@turbo-project/afds'
          ? '.'
          : '.' + hit.spec.slice('@turbo-project/afds'.length)
      if (!surface.values.has(subKey)) {
        // CSS·JSON 서브패스는 JS 표면이 없다 — import 대상이 아니면 이름 검사도 없다.
        fail.push(`${f}:${hit.line}: '${hit.spec}' 는 JS 를 내보내는 서브패스가 아니다`)
        continue
      }
      if (hit.hasDefault)
        fail.push(
          `${f}:${hit.line}: default import \`${hit.hasDefault}\` — @turbo-project/afds 는 default export 가 없다`,
        )
      for (const nm of hit.names) {
        counts.이름++
        if (IMPORT_FIXTURES.has(`${f}:${nm}`)) continue
        if (resolveName(subKey, nm)) continue
        const elsewhere = [...surface.values.keys()].filter(k => k !== subKey && resolveName(k, nm))
        fail.push(
          elsewhere.length
            ? `${f}:${hit.line}: \`${nm}\` 는 '${hit.spec}' 에 없다 — ${elsewhere.join(' · ')} 에 있다`
            : `${f}:${hit.line}: \`${nm}\` 가 '${hit.spec}' 에서 해소되지 않는다 (어느 서브패스에도 없다)`,
        )
      }
    }
  }

  // 죽은 자리표시자 — 실제로는 해소되는데 예외로 남아 있으면 무검사 통로가 된다.
  for (const key of IMPORT_FIXTURES) {
    const [file, nm] = [key.slice(0, key.lastIndexOf(':')), key.slice(key.lastIndexOf(':') + 1)]
    if (!existsSync(join(repoRoot, file))) {
      fail.push(`죽은 자리표시자: '${key}' 의 파일이 없다`)
      continue
    }
    if (!readFileSync(join(repoRoot, file), 'utf8').includes(nm))
      fail.push(`죽은 자리표시자: '${key}' 의 이름이 그 문서에 없다`)
  }

  return { fail, notes, counts }
}

/**
 * 인용 검사 대상 문서. **전부 저장소 루트 기준**으로 적는다(위 `docPath` 주석의 모호성 경고).
 *
 * #167 로 afds 문서 2건에서 7건으로
 * 넓혔다. 그 전에는 「없는 심볼·경로·플래그·명령을 인용해도 아무 검사도 잡지 않는」 문서가
 * 대부분이었고, PR #164 에서 **삭제된 명령을 안내하는 문서를 세 번** 만들었는데 셋 다
 * CodeRabbit 이 잡았다(우리 기계 검사는 0번).
 */
const DEFAULT_DOCS = [
  // #167 로 추가. 에이전트·소비자가 실제로 읽는 문서들이다.
  'docs/info/harness.md',
  'packages/afds/README.md',
  'packages/afds-registry/README.md',
  'packages/afds-registry/docs/GUIDE.md',
  // `.claude/rules/*.md` 11개 전부 — #167 이 명시한 넷째 항목이 이 글로브다.
  '.claude/rules/afds-component-philosophy.md',
  '.claude/rules/afds-component-patterns.md',
  '.claude/rules/afds-component-structure.md',
  '.claude/rules/afds-component-tokens.md',
  '.claude/rules/afds-storybook-components.md',
  '.claude/rules/afds-storybook-compositions.md',
  '.claude/rules/afds-storybook-headless.md',
  '.claude/rules/afds-storybook-patterns.md',
  '.claude/rules/afds-composition-structure.md',
  '.claude/rules/code-comments.md',
  '.claude/rules/versioning.md',
]

// ── 두 축은 필요한 것이 다르다 ────────────────────────────────────────────────
// 인용 축   `symbolRoots` 아래 **소스를 읽는다.** `dist` 가 필요 없다.
// import 축 `verifyImports()` 가 `dist/*.js` 를 실제로 `import()` 한다 — 빌드가 필요하다.
//
// 실측(`dist` 를 옮긴 상태): 인용 축은 14문서 전부 완주하고 실패 0, ★ 9건은 **전부**
// import 축의 「빌드 산출물이 없다」였다. 즉 축을 쪼개면 인용 축은 빌드 없이 돈다.
//
// CI 가 그 비대칭을 쓴다 — 인용 축은 **입력이 저장소 전역 문서**라 어느 패키지 잡도
// 함의하지 않으므로 무조건 실행 잡(`format`)에 두고, import 축은 afds 의 export 표면이
// 바뀔 때만 깨지므로(그 변경이 afds 잡을 켠다) afds 잡에 남긴다.
const argv = process.argv.slice(2)
const noImports = argv.includes('--no-imports')
// **플래그를 먼저 걷어낸다.** 안 걷어내면 `targets` 가 `['--no-imports']` 가 되어 없는 파일
// 하나만 검사하는 조용한 무동작이 된다 — 이 저장소가 반복해 밟은 형태다.
const flags = argv.filter(a => a.startsWith('--'))
const args = argv.filter(a => !a.startsWith('--'))
// 오타 플래그를 삼키지 않는다. `--no-import` 를 조용히 무시하면 **전체 모드로 도는데
// 인용 축만 돈다고 믿는** 상태가 된다 — 축을 쪼갠 뒤 가장 비싼 오해다.
const unknown = flags.filter(f => f !== '--no-imports')
if (unknown.length) {
  console.error(`★ 알 수 없는 플래그: ${unknown.join(' ')} (아는 것은 --no-imports 뿐이다)`)
  process.exit(2)
}
// 접두를 떼지 않는다 — repoRoot 기준으로 해소하므로 필요 없고, `packages/afds/README.md` 를
// `README.md` 로 만들면 루트 `README.md` 와 **모호**해진다.
const targets = args.length ? args : DEFAULT_DOCS

let failed = 0
for (const t of targets) {
  const { fail, unverified, moved, counts, notes } = verifyDoc(t)
  const summary = Object.entries(counts)
    .map(([k, v]) => `${k} ${v}`)
    .join(' / ')
  console.log(
    `\n${t}\n  ${summary} — 실패 ${fail.length}${
      moved.length ? ` · 줄이동 ${moved.length}(정보)` : ''
    }${unverified.length ? ` · 미검증 ${unverified.length}` : ''}`,
  )
  notes.forEach(n => console.log(`  ⓘ ${n}`))
  fail.forEach(f => console.log(`  ★ ${f}`))
  moved.forEach(d => console.log(`  ~ ${d}`))
  unverified.forEach(u => console.log(`  · ${u}`))
  failed += fail.length
}

// ── 문서 import 진실성 (문서 목록과 무관하게 항상 전수로 돈다) ──────────────
// 인용 검사는 `DOC_CONFIG` 에 등록된 문서만 보지만, import 진실성은 **에이전트가 읽는
// 문서 전부**가 대상이다. 등록 여부에 따라 검사 범위가 달라지면 미등록 문서가 무검사
// 통로가 된다.
// `--no-imports` 는 이 축을 건너뛴다. **건너뛴 사실을 반드시 출력한다** — 조용히 빠지면
// 로그만 보고 "전체가 통과했다" 고 읽게 되고, 그때 이 플래그가 검사를 지우는 도구가 된다.
if (noImports) {
  console.log('\n문서 import 진실성 — 건너뜀 (--no-imports · 이 축은 dist 가 필요하다)')
} else {
  const imp = await verifyImports()
  console.log(
    `\n문서 import 진실성\n  ${Object.entries(imp.counts)
      .map(([k, v]) => `${k} ${v}`)
      .join(' / ')} — 실패 ${imp.fail.length}`,
  )
  imp.notes.forEach(n => console.log(`  ⓘ ${n}`))
  imp.fail.forEach(f => console.log(`  ★ ${f}`))
  failed += imp.fail.length
}

process.exit(failed ? 1 : 0)
