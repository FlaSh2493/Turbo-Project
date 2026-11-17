import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, type Dirent } from 'node:fs'
import { join, relative } from 'node:path'
import { isSkippedDir, isImportScannableFile } from '../lib/composition-files'

/**
 * 타입 우회·lint 비활성 **래칫** — `packages/afds/src/bricks` · `packages/afds-registry/src/compositions`
 * 의 배포 코드(스토리·테스트 제외, `composition-files.ts` 와 같은 기준).
 *
 * **보호 문장**: 「`as unknown as` · `as never` · `@ts-ignore`/`@ts-expect-error`/`@ts-nocheck` · `eslint-disable`
 * 은 늘 수 없다 — 새로 쓰면 CI 가 막고, 줄이면 기준도 함께 줄어야 한다.」
 *
 * 판정은 `arbitrary-token-ratchet.test.ts` 와 같다 — `파일::종류` 별 실측이 기준과 정확히 같아야
 * 한다(누락 키는 0). 기준 파일 수정이 유일한 예외 경로이고 PR diff 에 드러난다.
 *
 * ponytail: 정규식 계수라 문자열·코드 뒤 주석 안의 같은 글자도 센다(주석 줄은 `eslint-disable`
 * 외엔 건너뛴다). 이유 주석 면제·AST 판정은 오탐이 실제로 마찰이 될 때 더한다.
 */
const TREES = {
  afdsBricks: join(__dirname, '../../../afds/src/bricks'),
  afdsRegistryCompositions: join(__dirname, '../compositions'),
} as const
const BASELINE_PATH = join(__dirname, 'type-bypass-ratchet.baseline.json')
const BASELINE_DISPLAY_PATH = relative(join(__dirname, '../../../..'), BASELINE_PATH)

/** 주석 줄에 적힌 `as unknown as` 설명까지 세지 않도록 `eslint-disable` 외에는 주석 줄을 건너뛴다. */
const KINDS: { kind: string; re: RegExp; countInComments: boolean }[] = [
  { kind: 'as-unknown-as', re: /\bas unknown as\b/g, countInComments: false },
  { kind: 'as-never', re: /\bas never\b/g, countInComments: false },
  { kind: 'ts-directive', re: /@ts-(?:ignore|expect-error|nocheck)\b/g, countInComments: true },
  { kind: 'eslint-disable', re: /(?:es|ox)lint-disable/g, countInComments: true },
]
const COMMENT_LINE_RE = /^(?:\/\/|\/\*|\*)/

type Counts = Record<string, number>
type Baseline = Record<keyof typeof TREES, Counts>

function scan(root: string): { counts: Counts; filesScanned: number } {
  const counts: Counts = {}
  let filesScanned = 0
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true }) as Dirent[]) {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) {
        if (!isSkippedDir(entry.name)) walk(path)
        continue
      }
      if (!isImportScannableFile(entry.name)) continue
      filesScanned++
      const lines = readFileSync(path, 'utf-8').split('\n')
      for (const { kind, re, countInComments } of KINDS) {
        let n = 0
        for (const line of lines) {
          if (!countInComments && COMMENT_LINE_RE.test(line.trim())) continue
          n += line.match(re)?.length ?? 0
        }
        if (n > 0) counts[`${relative(root, path)}::${kind}`] = n
      }
    }
  }
  walk(root)
  return { counts, filesScanned }
}

function ratchetFailures(treeLabel: string, actual: Counts, baseline: Counts): string[] {
  const failures: string[] = []
  for (const key of [...new Set([...Object.keys(actual), ...Object.keys(baseline)])].sort()) {
    const a = actual[key] ?? 0
    const b = baseline[key] ?? 0
    if (a === b) continue
    failures.push(
      a > b
        ? `${treeLabel}/${key}: 기준 ${b}건 → 실측 ${a}건 (증가). 타입을 맞춰라. 불가피하면 기준 파일(${BASELINE_DISPLAY_PATH})을 올리는 변경을 PR 에 드러내고 리뷰어 승인을 받아라.`
        : `${treeLabel}/${key}: 기준 ${b}건 → 실측 ${a}건 (감소). 기준 파일(${BASELINE_DISPLAY_PATH})을 실측만큼 낮춰라 — 파일이 사라졌다면 그 항목을 지워라.`,
    )
  }
  return failures
}

describe('타입 우회 · lint 비활성 래칫 — bricks · compositions', () => {
  const baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf-8')) as Baseline
  const scans = {
    afdsBricks: scan(TREES.afdsBricks),
    afdsRegistryCompositions: scan(TREES.afdsRegistryCompositions),
  }

  it('대조군 — 두 트리 모두에서 파일을 1개 이상 훑었다', () => {
    expect(scans.afdsBricks.filesScanned).toBeGreaterThan(0)
    expect(scans.afdsRegistryCompositions.filesScanned).toBeGreaterThan(0)
  })

  it('기준 파일의 키가 정렬돼 있다', () => {
    for (const tree of Object.keys(TREES) as (keyof typeof TREES)[]) {
      expect(Object.keys(baseline[tree])).toEqual([...Object.keys(baseline[tree])].sort())
    }
  })

  for (const tree of Object.keys(TREES) as (keyof typeof TREES)[]) {
    it(`${tree} — 파일::종류 별 건수가 기준과 정확히 같다`, () => {
      const failures = ratchetFailures(tree, scans[tree].counts, baseline[tree])
      expect(failures, failures.join('\n')).toEqual([])
    })
  }
})
