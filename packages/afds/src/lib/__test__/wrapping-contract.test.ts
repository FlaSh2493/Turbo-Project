import { describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import {
  CONTRACT_REQUIRED_SYMBOLS,
  findWrappingContractViolations,
} from './wrapping-contract.analyzer'

// **`process.cwd()` 로 잡지 않는다.** 어디서 vitest 를 띄우느냐에 따라 검사 대상이 통째로
// 달라지면 "위반 0건" 이 "깨끗하다" 가 아니라 "엉뚱한 데를 봤다" 가 될 수 있다.
const PKG_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')

// **검사 범위: `src/bricks/**`.**
//
// 이슈 #105 가 `src/compositions/**` 로 확장했었다 — compositions 가 `afds-registry` 로 소비처
// 코드베이스에 복사되는데 브릭보다 위험도가 높다는 이유였다(위반이 복사된 뒤에는 회수되지
// 않는다). 그 위험도 판단은 여전히 맞다 — 다만 compositions 자체가 afds-registry 로 이전되며
// 대상이 옮겨갔다. 같은 가드가
// `packages/afds-registry/src/lib/__test__/wrapping-contract.test.ts` 에 있다(analyzer 는 이
// 파일 옆의 사본 — 공개 export 가 아니라 패키지 경계를 넘어 import 할 수 없다).
const CONTRACT_ROOTS = [join(PKG_DIR, 'src', 'bricks')]

/**
 * 래핑 계약 가드 — 위반을 사람 리뷰에 맡기지 않는다.
 *
 * 계약 전문은 `docs/wrapping-contract.md`. 여기서 검사하는 것:
 *  1. handler-clobber  — 내부 이벤트 핸들러가 `{...props}` 앞에 있으면 소비자가 조용히 덮는다
 *  2. spread-inversion — `{...props}` 뒤의 또 다른 스프레드는 소비자 props 를 통째로 지운다
 *  3. dynamic-slot     — `data-slot` 값은 문자열 리터럴이어야 한다
 *  4. missing-slot     — 소비자 props 를 펼치는 host 엘리먼트에는 `data-slot` 이 있어야 한다
 *
 * `data-slot` 을 `{...props}` **앞**에 두는 것은 위반이 아니다 —
 * 래핑 컴포넌트가 브릭의 역할을 바꿔 다는 재라벨링이 의도된 메커니즘이기 때문이다
 * (예: `<ScrollArea>` 의 `scroll-area` → `Modal.Body` 의 `modal-body`).
 */
describe('AFDS 래핑 계약', () => {
  const scans = CONTRACT_ROOTS.map(root => ({ root, ...findWrappingContractViolations(root) }))
  const violations = scans.flatMap(s =>
    s.violations.map(v => ({ ...v, file: `${relative(PKG_DIR, s.root)}/${v.file}` })),
  )
  const scannedFiles = scans.flatMap(s =>
    s.scannedFiles.map(f => `${relative(PKG_DIR, s.root)}/${f}`),
  )
  const filesScanned = scans.reduce((n, s) => n + s.filesScanned, 0)

  it('src/bricks 전체가 래핑 계약을 지킨다', () => {
    const report = violations
      .map(v => `  [${v.rule}] ${v.file}:${v.line}\n    ${v.detail}`)
      .join('\n')

    expect(violations, `래핑 계약 위반 ${violations.length}건:\n${report}`).toHaveLength(0)
  })

  // 위 테스트는 파일을 한 개도 읽지 않아도 "위반 0건" 으로 통과한다.
  //
  // **하한(`> 20`)으로 단정하지 않는다.** 하한은 "일부를 조용히 버림" 을 못 잡는다 —
  // 68개 중 47개가 사라져도 통과한다. 자매 가드(`story-determinism`)에서 정확히 이 결함이
  // 실증됐다: 수집기가 한 디렉토리를 건너뛰게 하자 검사 대상이 줄었는데도 전부 통과했다.
  // 그래서 (1) 독립적으로 센 **파일 목록과 등식**으로 비교하고,
  // (2) 이번에 고친 두 파일이 **이름으로** 스캔 목록에 있는지 따로 단정한다.
  // (1)만으로는 "다른 파일이 늘어 수가 맞는" 경우를 놓친다.
  const globTsx = (dir: string, acc: string[] = []): string[] => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) {
        if (entry === '__test__') continue
        globTsx(full, acc)
        // analyzer 의 `collectTsxFiles` 와 **같은 조건**이어야 한다. 어긋나면 등식이
        // 위반과 무관하게 깨지고 원인을 찾기 어렵다(오늘은 갈리는 파일이 0개라 잠복 중이었다).
      } else if (entry.endsWith('.tsx') && !entry.endsWith('.stories.tsx')) {
        acc.push(relative(PKG_DIR, full))
      }
    }
    return acc
  }

  it('검사기가 검사 대상 파일을 하나도 빠뜨리지 않고 읽는다', () => {
    // "위반 0건" 이 **깨끗한 것**인지 **아무것도 안 본 것**인지 구분되어야 한다.
    // 라벨을 하드코딩하지 않는다 — 루트가 바뀌면 로그가 거짓말을 한다(실측: 루트를 하나로
    // 줄여도 `(bricks + compositions)` 를 그대로 출력했다).
    const rootLabel = CONTRACT_ROOTS.map(r => relative(PKG_DIR, r)).join(' + ')
    console.info(`[wrapping-contract] 검사 대상 = ${filesScanned}개 (${rootLabel})`)

    expect([...scannedFiles].sort(), '스캔 목록이 실제 파일 목록과 다르다').toEqual(
      CONTRACT_ROOTS.flatMap(r => globTsx(r)).sort(),
    )
  })

  // `CONTRACT_REQUIRED_SYMBOLS` 가 **사본이 아니라 강제**임을 지킨다.
  //
  // 목록만 두면 그건 진실의 복사본이고 조용히 드리프트한다. 그래서 목록이 주장하는 것을
  // 전부 실측으로 확인한다 — 심볼이 그 모듈에 실제로 있는가, 루트에서 실제로 꺼내지는가,
  // 문서의 규칙 번호와 실제로 맞물리는가, 그리고 위반 메시지가 정말 이 목록에서 나오는가.

  it('목록의 `from` 이 실제로 그 심볼을 내보내는 specifier 다', () => {
    // 내부 파일 경로가 아니라 **소비자가 쓰는 specifier** 를 적었는지 확인한다.
    // 서브패스를 적으면 내부 배치가 공개 API 가 되므로, 루트여야 한다.
    const pkg = JSON.parse(readFileSync(join(PKG_DIR, 'package.json'), 'utf8'))
    for (const { symbol, from } of CONTRACT_REQUIRED_SYMBOLS) {
      expect(from, `${symbol} 의 from 이 루트가 아니다`).toBe(pkg.name)
      expect(pkg.exports?.['.'], 'package.json 에 루트 export 가 없다').toBeDefined()
    }
  })

  // **이름 grep 으로 확인하지 않는다.** `export *` 배럴에는 심볼 이름이 나오지 않아
  // 소스를 grep 하면 거짓 음성이 난다(이 저장소에서 실제로 밟았다). 실제로 꺼내 본다.
  // 타임아웃을 명시한다: 이 단정은 **루트 배럴 전체를 실제로 로드**하므로 느리다(단독 ~3.5s).
  // 기본 5s 는 전체 스위트를 병렬로 돌릴 때 넘긴다 — 모듈 하나만 늘어도 깨졌다(실측).
  // 느린 것이 이 테스트의 비용이지 결함이 아니다. 빠르게 하려면 이름 grep 으로 돌아가야 하는데
  // `export *` 에서 거짓 음성이 나므로 그건 검사를 포기하는 것이다.
  it('목록의 심볼을 AFDS 루트에서 실제로 꺼낼 수 있다', { timeout: 20_000 }, async () => {
    const afds = (await import('../../index')) as Record<string, unknown>
    for (const { symbol } of CONTRACT_REQUIRED_SYMBOLS) {
      expect(typeof afds[symbol], `루트에서 ${symbol} 을 꺼낼 수 없다`).toBe('function')
    }
  })

  // 문서와 코드를 **번호로** 묶는다 — 한쪽만 고치면 여기서 드러난다.
  it('목록의 rule 번호가 계약 문서의 해당 규칙을 가리킨다', () => {
    const doc = readFileSync(join(PKG_DIR, 'docs', 'wrapping-contract.md'), 'utf8')
    // `### 3. …` **제목을 포함해** 다음 `### ` 직전까지가 그 규칙이다.
    // 제목에만 심볼이 있는 규칙이 실제로 있다(규칙 4 `ref` 는 `mergeRefs` 로 합성한다).
    const sections = new Map<number, string>()
    const re = /^(### (\d+)\.[\s\S]*?)(?=^### |$(?![\s\S]))/gm
    for (const m of doc.matchAll(re)) sections.set(Number(m[2]), m[1])

    for (const { symbol, rule } of CONTRACT_REQUIRED_SYMBOLS) {
      const body = sections.get(rule)
      expect(body, `계약 문서에 규칙 ${rule} 이 없다`).toBeDefined()
      expect(body, `문서 규칙 ${rule} 이 ${symbol} 을 언급하지 않는다`).toContain(symbol)
    }
  })

  // 메시지가 목록에서 이름을 가져오는지 — 리터럴로 박아 두면 이 단정은 통과하지만
  // 목록을 바꿔도 메시지가 안 바뀐다. 그래서 **목록 값과 메시지를 함께** 본다.
  it('위반 메시지가 목록의 심볼 이름을 쓴다', () => {
    const fixture = mkdtempSync(join(tmpdir(), 'afds-sym-'))
    try {
      writeFileSync(
        join(fixture, 'a.tsx'),
        'export const Bad = ({ ...props }: any) => (\n' +
          '  <div data-slot="bad" onClick={() => internal()} {...props} />\n)\n',
      )
      const { violations: found } = findWrappingContractViolations(fixture)
      const clobber = found.find(v => v.rule === 'handler-clobber')
      expect(clobber).toBeDefined()

      const expected = CONTRACT_REQUIRED_SYMBOLS.find(s => s.rule === 3)!.symbol
      expect(clobber!.detail, 'handler-clobber 메시지가 규칙 3 심볼을 안내하지 않는다').toContain(
        expected,
      )
    } finally {
      rmSync(fixture, { recursive: true, force: true })
    }
  })

  // **이 테스트는 진단용이지 추가 방어력이 없다.** 독립 리뷰가 뮤테이션으로 확인했다 —
  // 이것만 단독으로 실패시키는 변경은 존재하지 않는다(analyzer 의 5개 규칙 중 정적 문자열
  // `data-slot` 을 위반으로 잡을 수 있는 규칙이 없으므로, 여기 단정은 메인 테스트의 부분집합이다).
  // 그래도 남기는 이유는 **실패했을 때 원인을 즉시 지목**하기 때문이다 — "위반 0건" 이 깨졌을 때
  // 재라벨링이 원인인지 아닌지를 이 테스트 이름이 바로 알려준다.
  //
  // **재라벨링은 결함이 아니다** (#100 에서 확정). 래핑 컴포넌트가 브릭의 역할을 바꿔 다는 것은
  // 의도된 합성 메커니즘이다 — `<Modal.Content data-slot="alert-modal">` 처럼.
  //
  // compositions 범위의 같은 검사(재라벨링 지점 9곳)는 afds-registry 로 이전됐다 —
  // `packages/afds-registry/src/lib/__test__/wrapping-contract.test.ts`. bricks 자체에도
  // 재라벨링 지점이 있으므로(Modal 이 내부 ScrollArea 의 슬롯을 relabel) 그 실측 지점으로
  // "위반 0건" 이 *본 적이 없어서* 0인지 *보고 통과시킨* 0인지를 여기서도 구분해 둔다.
  it('브릭의 data-slot 재라벨링을 위반으로 잡지 않는다', () => {
    const relabelSites = [
      'src/bricks/overlay/modal/modal.tsx', // <ScrollArea data-slot="modal-body">
    ]

    for (const f of relabelSites) {
      // (1) 검사 대상에 실제로 들어 있고
      expect(scannedFiles, `재라벨링 지점이 스캔에서 빠졌다: ${f}`).toContain(f)
      // (2) 그런데도 위반이 아니다
      expect(
        violations.filter(v => v.file === f),
        `재라벨링을 위반으로 잡았다: ${f}`,
      ).toEqual([])
    }
  })

  it('위반이 있는 코드를 실제로 잡는다 (가드 자체의 회귀 방지)', () => {
    const fixture = mkdtempSync(join(tmpdir(), 'afds-contract-'))
    try {
      writeFileSync(
        join(fixture, 'violation.tsx'),
        // 내부 핸들러가 소비자 rest 스프레드 앞 → handler-clobber
        `export const Bad = ({ ...props }: any) => (\n  <div data-slot="bad" onClick={() => internal()} {...props} />\n)\n`,
      )
      const result = findWrappingContractViolations(fixture)

      expect(result.filesScanned).toBe(1)
      expect(result.violations.map(v => v.rule)).toContain('handler-clobber')
    } finally {
      rmSync(fixture, { recursive: true, force: true })
    }
  })

  // blocker 회귀 방어: 소비자 props 가 mergeProps 호출 안에 들어가 있어도 검사 대상이어야 한다.
  // 이름 리터럴로 판정하던 시절 이 형태가 통째로 검사 시야에서 사라졌다.
  it('mergeProps 스프레드 안의 소비자 props 도 검사한다', () => {
    const fixture = mkdtempSync(join(tmpdir(), 'afds-contract-merge-'))
    try {
      writeFileSync(
        join(fixture, 'merge.tsx'),
        [
          'export const A = ({ ...props }: any) => (',
          '  <div data-slot="a" {...mergeProps(inner, props)} {...inner} />',
          ')',
          'export const B = ({ ...props }: any) => (',
          '  <div data-slot="b" {...mergeProps(props, inner)} />',
          ')',
        ].join('\n'),
      )
      const rules = findWrappingContractViolations(fixture).violations.map(v => v.rule)

      expect(rules).toContain('spread-inversion')
      expect(rules).toContain('merge-arg-order')
    } finally {
      rmSync(fixture, { recursive: true, force: true })
    }
  })

  it('없는 경로는 조용히 0건이 아니라 예외로 끝난다', () => {
    expect(() => findWrappingContractViolations('/nonexistent')).toThrow()
  })
})
