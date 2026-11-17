import { describe, it, expect } from 'vitest'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  countWarnings,
  eslintOwnedOnly,
  eslintRuleId,
  fromOxlint,
  ratchetFailures,
  NO_RULE,
} from '../lib/lint-ratchet'

/**
 * afds lint 경고 래칫 — 판정 로직과 **배선**.
 *
 * 보호 문장: 「afds eslint 경고는 `파일::규칙` 별로 늘 수 없다 — 줄면 기준도 함께 줄어야 한다.」
 * 배선 단정이 없으면 `lint` 를 `eslint .` 로 되돌리는 변경이 래칫을 조용히 끈다.
 */
const PKG_DIR = join(__dirname, '../..')

describe('lint-ratchet — 배선', () => {
  it('`lint` 스크립트가 래칫을 호출한다 (eslint . 로 되돌리면 실패)', () => {
    const pkg = JSON.parse(readFileSync(join(PKG_DIR, 'package.json'), 'utf-8')) as {
      scripts: Record<string, string>
    }
    expect(pkg.scripts.lint).toContain('scripts/lint-ratchet.ts')
  })

  it('`lint` 스크립트가 oxlint·ESLint 를 모두 돌린다 (한쪽을 빼면 실패)', () => {
    const src = readFileSync(join(PKG_DIR, 'scripts/lint-ratchet.ts'), 'utf-8')
    expect(src).toContain("'oxlint'")
    expect(src).toContain("'--report-unused-disable-directives'")
    expect(src).toContain("'eslint'")
  })

  it('oxlint 는 afds·afds-registry 모두 정확 버전으로 고정돼 있다 (범위 `^` 는 진단 집합을 조용히 바꾼다)', () => {
    for (const dir of ['../..', '../../../afds-registry']) {
      const pkg = JSON.parse(readFileSync(join(__dirname, dir, 'package.json'), 'utf-8')) as {
        devDependencies: Record<string, string>
      }
      expect(pkg.devDependencies.oxlint).toMatch(/^\d+\.\d+\.\d+$/)
    }
  })

  it('기준 파일의 키가 정렬돼 있고 값이 양의 정수다', () => {
    const baseline = JSON.parse(
      readFileSync(join(PKG_DIR, 'scripts/lint-ratchet.baseline.json'), 'utf-8'),
    ) as Record<string, number>
    const keys = Object.keys(baseline)
    expect(keys.length).toBeGreaterThan(0)
    expect(keys).toEqual([...keys].sort())
    for (const n of Object.values(baseline)) expect(Number.isInteger(n) && n > 0).toBe(true)
  })
})

describe('lint-ratchet — 판정', () => {
  const results = [
    {
      filePath: '/r/src/a.ts',
      messages: [
        { ruleId: 'x', severity: 1 },
        { ruleId: 'x', severity: 1 },
        { ruleId: null, severity: 1 },
        { ruleId: 'e', severity: 2 },
      ],
    },
  ]

  it('경고만 상대경로::규칙 으로 센다 (오류 제외, ruleId 없음은 NO_RULE)', () => {
    expect(countWarnings(results, '/r')).toEqual({
      'src/a.ts::x': 2,
      [`src/a.ts::${NO_RULE}`]: 1,
    })
  })

  it('기준과 같으면 통과', () => {
    expect(ratchetFailures({ k: 2 }, { k: 2 }, 'b.json')).toEqual([])
  })

  it('증가 · 새 키는 실패', () => {
    expect(ratchetFailures({ k: 3 }, { k: 2 }, 'b.json')[0]).toContain('증가')
    expect(ratchetFailures({ n: 1 }, {}, 'b.json')[0]).toContain('증가')
  })

  it('감소 · 사라진 키는 기준을 안 내리면 실패', () => {
    expect(ratchetFailures({ k: 1 }, { k: 2 }, 'b.json')[0]).toContain('감소')
    expect(ratchetFailures({}, { k: 2 }, 'b.json')[0]).toContain('감소')
  })
})

describe('lint-ratchet — oxlint 어댑터', () => {
  it('규칙 코드를 ESLint ruleId 로 되돌린다', () => {
    expect(eslintRuleId('typescript(no-explicit-any)')).toBe('@typescript-eslint/no-explicit-any')
    expect(eslintRuleId('unused-imports(no-unused-vars)')).toBe('unused-imports/no-unused-vars')
    expect(eslintRuleId('eslint(no-var)')).toBe('no-var')
    expect(eslintRuleId(null)).toBeNull()
  })

  it('진단을 ESLint JSON 모양으로 옮겨 같은 키로 센다', () => {
    const results = fromOxlint(
      [
        { code: 'typescript(no-explicit-any)', severity: 'warning', filename: 'src/a.ts' },
        { code: null, severity: 'warning', filename: 'src/a.ts' },
        { code: 'eslint(no-var)', severity: 'error', filename: 'src/a.ts' },
      ],
      '/r',
    )
    expect(countWarnings(results, '/r')).toEqual({
      'src/a.ts::@typescript-eslint/no-explicit-any': 1,
      [`src/a.ts::${NO_RULE}`]: 1,
    })
    expect(results[0].messages.filter(m => m.severity === 2)).toHaveLength(1)
  })
})

describe('lint-ratchet — 미사용 지시문 분담', () => {
  const UNUSED = 'Unused eslint-disable directive (no problems were reported).'
  const root = mkdtempSync(join(tmpdir(), 'lint-ratchet-'))
  mkdirSync(join(root, 'src'))
  writeFileSync(
    join(root, 'src/a.tsx'),
    '// eslint-disable-next-line no-restricted-syntax -- x\n<div style={{}} />\n' +
      '// eslint-disable-next-line @typescript-eslint/no-explicit-any\nconst a: any = 1\n',
  )
  const oxUnused = (line: number) => ({
    severity: 'warning',
    filename: 'src/a.tsx',
    message: UNUSED,
    labels: [{ span: { line } }],
  })

  it('쓰이는 no-restricted-syntax 지시문은 oxlint 의 미사용 보고를 버려 0건이다', () => {
    // oxlint 는 그 규칙을 몰라 늘 미사용으로 본다 — ESLint 는 쓰였다고 보고 아무 보고도 안 낸다.
    const merged = [...fromOxlint([oxUnused(1)], root), ...eslintOwnedOnly([])]
    expect(countWarnings(merged, root)).toEqual({})
  })

  it('쓰이지 않는 no-restricted-syntax 지시문은 ESLint 보고가 남아 1건으로 센다', () => {
    const eslint = [
      {
        filePath: join(root, 'src/a.tsx'),
        messages: [
          {
            ruleId: null,
            severity: 1,
            message:
              "Unused eslint-disable directive (no problems were reported from 'no-restricted-syntax').",
          },
        ],
      },
    ]
    const merged = [...fromOxlint([oxUnused(1)], root), ...eslintOwnedOnly(eslint)]
    expect(countWarnings(merged, root)).toEqual({ [`src/a.tsx::${NO_RULE}`]: 1 })
  })

  it('다른 규칙 지시문은 oxlint 판정을 따르고 ESLint 의 보고는 버린다', () => {
    const eslint = [
      {
        filePath: join(root, 'src/a.tsx'),
        messages: [
          {
            ruleId: null,
            severity: 1,
            message:
              "Unused eslint-disable directive (no problems were reported from '@typescript-eslint/no-explicit-any').",
          },
        ],
      },
    ]
    const merged = [...fromOxlint([oxUnused(3)], root), ...eslintOwnedOnly(eslint)]
    expect(countWarnings(merged, root)).toEqual({ [`src/a.tsx::${NO_RULE}`]: 1 })
  })

  it('규칙이 둘인 지시문(5a)은 oxlint 의 미사용 보고를 버리지 않는다', () => {
    writeFileSync(
      join(root, 'src/b.tsx'),
      '// eslint-disable-next-line no-restricted-syntax, @typescript-eslint/no-explicit-any\nconst a = 1\n',
    )
    const ox = { ...oxUnused(1), filename: 'src/b.tsx' }
    expect(countWarnings(fromOxlint([ox], root), root)).toEqual({ [`src/b.tsx::${NO_RULE}`]: 1 })
  })

  it('사유 주석에만 규칙 이름이 있는 지시문(5c)은 oxlint 의 미사용 보고를 버리지 않는다', () => {
    writeFileSync(
      join(root, 'src/c.tsx'),
      '// eslint-disable-next-line @typescript-eslint/no-explicit-any -- no-restricted-syntax 와 무관\nconst a = 1\n',
    )
    const ox = { ...oxUnused(1), filename: 'src/c.tsx' }
    expect(countWarnings(fromOxlint([ox], root), root)).toEqual({ [`src/c.tsx::${NO_RULE}`]: 1 })
  })

  it('ESLint 의 오류(파싱 실패 등 ruleId 없는 severity 2)는 버리지 않는다', () => {
    const fatal = [
      { filePath: '/r/a.ts', messages: [{ ruleId: null, severity: 2, message: 'Parsing error' }] },
    ]
    expect(eslintOwnedOnly(fatal)[0].messages).toHaveLength(1)
  })

  it('JSX 주석 `{/* ... */}` 형태의 no-restricted-syntax 지시문도 oxlint 보고를 버린다', () => {
    writeFileSync(
      join(root, 'src/d.tsx'),
      '{/* eslint-disable-next-line no-restricted-syntax */}\n<div style={{}} />\n',
    )
    const ox = { ...oxUnused(1), filename: 'src/d.tsx' }
    expect(countWarnings(fromOxlint([ox], root), root)).toEqual({})
  })
})
