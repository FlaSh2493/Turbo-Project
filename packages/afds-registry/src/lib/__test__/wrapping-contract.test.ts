import { describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readdirSync, statSync } from 'node:fs'
import {
  CONTRACT_REQUIRED_SYMBOLS,
  findWrappingContractViolations,
} from './wrapping-contract.analyzer'

// **`process.cwd()` 로 잡지 않는다.** 어디서 vitest 를 띄우느냐에 따라 검사 대상이 통째로
// 달라지면 "위반 0건" 이 "깨끗하다" 가 아니라 "엉뚱한 데를 봤다" 가 될 수 있다.
const PKG_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')

// **검사 범위: `src/compositions/**`.**
//
// afds 의 같은 가드(`packages/afds/src/lib/__test__/wrapping-contract.test.ts`, 이슈 #105)가
// 전에는 `src/bricks/**` + `src/compositions/**` 둘 다 봤다 — compositions 는 소비처
// 코드베이스로 복사되므로 위반이 회수되지 않는다는 것이 이유였다(당시 경로는 자체 CLI 의
// `add`, 지금은 `shadcn add` 다). 컴포지션이 이
// 패키지로 이전되며 그 위험은 그대로 여기로 옮겨온다.
const CONTRACT_ROOTS = [join(PKG_DIR, 'src', 'compositions')]

/**
 * 래핑 계약 가드 — 위반을 사람 리뷰에 맡기지 않는다.
 *
 * 계약 전문은 afds 의 `docs/wrapping-contract.md`(이 패키지는 그 문서를 소유하지 않는다).
 * 여기서 검사하는 것:
 *  1. handler-clobber  — 내부 이벤트 핸들러가 `{...props}` 앞에 있으면 소비자가 조용히 덮는다
 *  2. spread-inversion — `{...props}` 뒤의 또 다른 스프레드는 소비자 props 를 통째로 지운다
 *  3. dynamic-slot     — `data-slot` 값은 문자열 리터럴이어야 한다
 *  4. missing-slot     — 소비자 props 를 펼치는 host 엘리먼트에는 `data-slot` 이 있어야 한다
 *
 * `data-slot` 을 `{...props}` **앞**에 두는 것은 위반이 아니다 — 래핑 컴포넌트가 브릭의
 * 역할을 바꿔 다는 재라벨링이 의도된 메커니즘이기 때문이다(예: `<Modal.Content
 * data-slot="alert-modal">`).
 */
describe('AFDS 래핑 계약 (compositions)', () => {
  const scans = CONTRACT_ROOTS.map(root => ({ root, ...findWrappingContractViolations(root) }))
  const violations = scans.flatMap(s =>
    s.violations.map(v => ({ ...v, file: `${relative(PKG_DIR, s.root)}/${v.file}` })),
  )
  const scannedFiles = scans.flatMap(s =>
    s.scannedFiles.map(f => `${relative(PKG_DIR, s.root)}/${f}`),
  )
  const filesScanned = scans.reduce((n, s) => n + s.filesScanned, 0)

  it('src/compositions 전체가 래핑 계약을 지킨다', () => {
    const report = violations
      .map(v => `  [${v.rule}] ${v.file}:${v.line}\n    ${v.detail}`)
      .join('\n')

    expect(violations, `래핑 계약 위반 ${violations.length}건:\n${report}`).toHaveLength(0)
  })

  // 위 테스트는 파일을 한 개도 읽지 않아도 "위반 0건" 으로 통과한다 — 독립적으로 센
  // 파일 목록과 등식으로 비교해 "일부를 조용히 버림" 을 잡는다.
  const globTsx = (dir: string, acc: string[] = []): string[] => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) {
        if (entry === '__test__') continue
        globTsx(full, acc)
        // analyzer 의 `collectTsxFiles` 와 **같은 조건**이어야 한다.
      } else if (entry.endsWith('.tsx') && !entry.endsWith('.stories.tsx')) {
        acc.push(relative(PKG_DIR, full))
      }
    }
    return acc
  }

  it('검사기가 검사 대상 파일을 하나도 빠뜨리지 않고 읽는다', () => {
    const rootLabel = CONTRACT_ROOTS.map(r => relative(PKG_DIR, r)).join(' + ')
    console.info(`[wrapping-contract] 검사 대상 = ${filesScanned}개 (${rootLabel})`)

    expect([...scannedFiles].sort(), '스캔 목록이 실제 파일 목록과 다르다').toEqual(
      CONTRACT_ROOTS.flatMap(r => globTsx(r)).sort(),
    )

    // afds #117 이 확장 대상으로 고친 두 파일이 이전 후에도 스캔에 있는지 확인한다.
    for (const f of [
      'src/compositions/overflow-tooltip/overflow-tooltip.tsx',
      'src/compositions/base-check-box/base-check-box-group.tsx',
    ]) {
      expect(scannedFiles, `확장 대상이 스캔에서 빠졌다: ${f}`).toContain(f)
    }
  })

  // **재라벨링은 결함이 아니다** (afds #100 에서 확정). 래핑 컴포넌트가 브릭의 역할을
  // 바꿔 다는 것은 의도된 합성 메커니즘이다 — `<Modal.Content data-slot="alert-modal">` 처럼.
  // 재라벨링 지점의 다수가 compositions 에 있으므로(afds #117 실측 11곳 중 대표 9곳) 이 목록이
  // 실제로 검사되고도 위반으로 안 잡히는지 이름으로 못 박는다.
  it('컴포지션의 data-slot 재라벨링을 위반으로 잡지 않는다', () => {
    const relabelSites = [
      'src/compositions/alert-modal/alert-modal.tsx', // <Modal.Content>
      'src/compositions/negative-modal/negative-modal.tsx', // <Modal.Content>
      'src/compositions/popconfirm/popconfirm.tsx', // <Typography> · <Button>×2
      'src/compositions/page-layout/page-layout.tsx', // <Typography>
      'src/compositions/base-check-box/base-check-box-group.tsx', // <CheckboxGroupPrimitive>
      'src/compositions/base-radio-group/base-radio-group.tsx', // <RadioGroupPrimitive>
      'src/compositions/base-table/table-empty-state.tsx', // <Flex>
      'src/compositions/section-error-fallback/section-error-fallback.tsx', // <Flex>
      'src/compositions/floating-action-bar-count/floating-action-bar-count.tsx', // <Flex>
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
    const fixture = mkdtempSync(join(tmpdir(), 'afds-registry-contract-'))
    try {
      writeFileSync(
        join(fixture, 'violation.tsx'),
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
  it('mergeProps 스프레드 안의 소비자 props 도 검사한다', () => {
    const fixture = mkdtempSync(join(tmpdir(), 'afds-registry-contract-merge-'))
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

  // 메시지가 목록에서 이름을 가져오는지 — CONTRACT_REQUIRED_SYMBOLS 는 afds 사본과
  // 동일해야 한다(analyzer 파일 자체가 사본이므로).
  it('위반 메시지가 목록의 심볼 이름을 쓴다', () => {
    const fixture = mkdtempSync(join(tmpdir(), 'afds-registry-sym-'))
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
})
