/**
 * afds `lint` — oxlint 와 ESLint(oxlint 가 못 하는 `no-restricted-syntax` 만)를 JSON 으로 돌려
 * 병합하고 경고를 `파일::규칙` 별로 기준선과 대조한다.
 *
 * `eslint .` 는 경고가 있어도 종료 코드 0 이라 afds 경고가 조용히 늘 수 있었다.
 * 오류가 하나라도 있으면 실패하고, 경고는 기준선과 정확히 같아야 한다.
 * 판정 로직은 `lib/lint-ratchet.ts`, 기준은 `lint-ratchet.baseline.json`.
 */
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  countWarnings,
  eslintOwnedOnly,
  fromOxlint,
  ratchetFailures,
  type LintFileResult,
  type OxlintDiagnostic,
} from './lib/lint-ratchet'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const BASELINE = join(dirname(fileURLToPath(import.meta.url)), 'lint-ratchet.baseline.json')

/**
 * 도구가 죽거나(신호·spawn 실패·종료 코드 2 이상) JSON 을 못 읽으면 0건이 아니라 실패다.
 * 1 은 lint 오류가 있다는 뜻이라 JSON 은 정상이고, 아래에서 오류로 따로 판정한다.
 */
function runJson<T>(tool: string, args: string[]): T {
  const run = spawnSync('pnpm', ['exec', tool, ...args, '-f', 'json'], {
    cwd: ROOT,
    encoding: 'utf-8',
    maxBuffer: 256 * 1024 * 1024,
    // Windows 의 `pnpm` 은 `pnpm.cmd` 라 셸 없이는 못 띄운다(`verify-exports.ts` 와 같은 사정).
    shell: process.platform === 'win32',
  })
  try {
    if (run.status !== 0 && run.status !== 1) throw new Error('abnormal exit')
    return JSON.parse(String(run.stdout)) as T
  } catch {
    console.error(`${tool} 출력을 JSON 으로 읽지 못했다 (종료 코드 ${run.status}).`)
    console.error(String(run.stderr))
    process.exit(1)
  }
}

// 미사용 지시문 판정은 규칙을 실제로 돌리는 도구가 한다 — `no-restricted-syntax` 지시문은 ESLint,
// 나머지는 oxlint. oxlint 는 `no-restricted-syntax` 를 몰라 그 지시문을 늘 미사용으로 보고,
// ESLint 는 oxlint 가 맡은 규칙이 꺼져 있어 그 지시문을 늘 미사용으로 본다(병합에서 서로 버린다).
const oxlint = runJson<{ diagnostics: OxlintDiagnostic[] }>('oxlint', [
  '--report-unused-disable-directives',
  '.',
])
if (!Array.isArray(oxlint.diagnostics)) {
  console.error('oxlint JSON 에 diagnostics 가 없다.')
  process.exit(1)
}
const eslint = runJson<LintFileResult[]>('eslint', ['.'])
if (!Array.isArray(eslint)) {
  console.error('eslint JSON 이 배열이 아니다.')
  process.exit(1)
}
const results = [...fromOxlint(oxlint.diagnostics, ROOT), ...eslintOwnedOnly(eslint)]

const errors = results.reduce((n, f) => n + f.messages.filter(m => m.severity === 2).length, 0)
if (errors > 0) {
  for (const f of results)
    for (const m of f.messages)
      if (m.severity === 2) console.error(`${f.filePath}:${m.line} ${m.ruleId ?? ''} ${m.message}`)
  console.error(`\nlint 오류 ${errors}건 — 래칫 이전에 오류부터 0 이어야 한다.`)
  process.exit(1)
}

const actual = countWarnings(results, ROOT)
const baseline = JSON.parse(readFileSync(BASELINE, 'utf-8')) as Record<string, number>
const failures = ratchetFailures(
  actual,
  baseline,
  'packages/afds/scripts/lint-ratchet.baseline.json',
)

const total = Object.values(actual).reduce((a, b) => a + b, 0)
if (failures.length > 0) {
  console.error(
    `afds lint 경고 래칫 실패 (${failures.length}키):\n${failures.map(f => `  - ${f}`).join('\n')}`,
  )
  process.exit(1)
}
console.log(
  `afds lint 경고 래칫 통과 — 경고 ${total}건 / 키 ${Object.keys(actual).length}개 (기준과 일치)`,
)
