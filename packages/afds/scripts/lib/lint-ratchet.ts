/**
 * afds lint 경고 **래칫**의 판정 로직 — `scripts/lint-ratchet.ts` 가 엔트리다.
 *
 * 엔트리는 ESLint 를 띄우고 `process.exit` 까지 하는 스크립트라 import 하면 죽는다.
 * 판정만 여기로 빼서 `__test__/lint-ratchet.test.ts` 가 픽스처로 고정한다
 * ([[citation-drift.ts]] 와 같은 형태).
 *
 * 판정 규칙은 `afds-registry/src/__tests__/arbitrary-token-ratchet.test.ts` 의 `ratchetFailures` 와
 * 같다 — 키별 실측이 기준과 **정확히** 같아야 한다(누락 키는 0). 늘어도, 줄었는데 기준을
 * 안 내려도 실패한다.
 */

import { readFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

export interface LintMessage {
  ruleId: string | null
  severity: number
  line?: number
  message?: string
}

export interface LintFileResult {
  filePath: string
  messages: LintMessage[]
}

/** oxlint `-f json` 의 diagnostic 중 판정에 쓰는 필드. `filename` 은 실행 cwd 기준 상대경로다. */
export interface OxlintDiagnostic {
  code?: string | null
  severity: string
  filename: string
  message?: string
  labels?: { span?: { line?: number } }[]
}

/**
 * oxlint 규칙 코드(`typescript(no-explicit-any)`)를 ESLint ruleId 로 되돌린다 — 기준선 키가
 * ESLint 이름이라 도구를 바꿔도 키가 갈라지지 않는다. 코드가 없는 진단(미사용 지시문)은 null.
 */
export function eslintRuleId(code: string | null | undefined): string | null {
  const m = code?.match(/^([^(]+)\((.+)\)$/)
  if (!m) return null
  const [, plugin, rule] = m
  if (plugin === 'eslint') return rule
  return `${plugin === 'typescript' ? '@typescript-eslint' : plugin}/${rule}`
}

/**
 * oxlint 가 모르는 규칙 — ESLint 만 실제로 돌린다. 이 규칙**만** 가리키는 지시문의 「미사용」
 * 판정은 oxlint 가 아니라 ESLint 몫이다(oxlint 는 그 지시문을 늘 미사용으로 본다).
 */
const ESLINT_ONLY_RULE = 'no-restricted-syntax'

/**
 * 지시문 줄에서 `--` 앞 규칙 목록만 읽어 정확히 ESLint 전용 규칙 하나인지 본다. 줄 전체를 문자열
 * 검색하면 사유 주석이나 다른 규칙과 함께 적힌 지시문(`a, b`)까지 oxlint 보고를 통째로 버린다.
 * 규칙 없는 `/* eslint-disable *\/` 는 목록이 비어 아니다 — 그 지시문이 ESLint 위반만 덮으면
 * oxlint 보고가 남아 오탐이 된다(드묾, 기준선 방향으로만 틀린다).
 */
function targetsOnlyEslintRule(text: string): boolean {
  const m = text.match(/eslint-disable(?:-next-line|-line)?\s+(.*?)(?:\s--\s.*)?(?:\*\/\}?)?\s*$/)
  const rules = m?.[1].split(',').map(r => r.trim()) ?? []
  return rules.length === 1 && rules[0] === ESLINT_ONLY_RULE
}

/**
 * ESLint 쪽에서는 `no-restricted-syntax` 지시문의 미사용 보고만 남긴다. 다른 규칙의 지시문은
 * ESLint 에서 그 규칙이 꺼져 있어 늘 미사용으로 보이므로 oxlint 판정을 따른다. 경고가 아닌
 * 메시지(파싱 오류 같은 fatal)는 ruleId 가 없어도 버리지 않는다 — 버리면 실패가 0건이 된다.
 */
export function eslintOwnedOnly(results: LintFileResult[]): LintFileResult[] {
  return results.map(f => ({
    ...f,
    messages: f.messages.filter(
      m => m.ruleId !== null || m.severity !== 1 || m.message?.includes(`'${ESLINT_ONLY_RULE}'`),
    ),
  }))
}

/** oxlint 진단을 ESLint JSON 과 같은 모양으로 바꿔 한 번에 센다. */
export function fromOxlint(diagnostics: OxlintDiagnostic[], root: string): LintFileResult[] {
  const byFile = new Map<string, LintMessage[]>()
  const sources = new Map<string, string[]>() // 파일당 1회만 읽는다
  const lineOf = (filePath: string, line: number | undefined): string => {
    if (line === undefined) return ''
    if (!sources.has(filePath)) sources.set(filePath, readFileSync(filePath, 'utf-8').split('\n'))
    return sources.get(filePath)![line - 1] ?? ''
  }
  for (const d of diagnostics) {
    const filePath = join(root, d.filename)
    const line = d.labels?.[0]?.span?.line
    if (!d.code && targetsOnlyEslintRule(lineOf(filePath, line))) continue
    const list = byFile.get(filePath) ?? []
    list.push({
      ruleId: eslintRuleId(d.code),
      severity: d.severity === 'error' ? 2 : 1,
      line,
      message: d.message,
    })
    byFile.set(filePath, list)
  }
  return [...byFile].map(([filePath, messages]) => ({ filePath, messages }))
}

/** ruleId 가 없는 경고(미사용 지시문 등)의 키 이름. */
export const NO_RULE = '(no-rule)'

/** 경고(severity 1)만 `상대경로::규칙` 키로 센다. 오류는 ESLint 종료 코드가 따로 잡는다. */
export function countWarnings(results: LintFileResult[], root: string): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const file of results) {
    // 기준선 키는 `/` 구분자다 — Windows 의 `\` 를 그대로 두면 키가 갈라진다.
    const rel = relative(root, file.filePath).split(sep).join('/')
    for (const m of file.messages) {
      if (m.severity !== 1) continue
      const key = `${rel}::${m.ruleId ?? NO_RULE}`
      counts[key] = (counts[key] ?? 0) + 1
    }
  }
  return counts
}

export function ratchetFailures(
  actual: Record<string, number>,
  baseline: Record<string, number>,
  baselinePath: string,
): string[] {
  const keys = new Set([...Object.keys(actual), ...Object.keys(baseline)])
  const failures: string[] = []
  for (const key of [...keys].sort()) {
    const a = actual[key] ?? 0
    const b = baseline[key] ?? 0
    if (a === b) continue
    failures.push(
      a > b
        ? `${key}: 기준 ${b}건 → 실측 ${a}건 (증가). 경고를 고쳐라. 불가피하면 ${baselinePath} 를 올리는 변경을 PR 에 드러내고 리뷰어 승인을 받아라.`
        : `${key}: 기준 ${b}건 → 실측 ${a}건 (감소). ${baselinePath} 를 실측만큼 낮춰라 — 단조 감소를 기준 갱신으로 강제한다.`,
    )
  }
  return failures
}
