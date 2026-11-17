import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { scanDefaultScaleClasses } from '../lib/tailwind-arbitrary-values'

/**
 * Tailwind 기본 팔레트·spacing·radius **경고** — `packages/afds/src/bricks` ·
 * `packages/afds-registry/src/compositions`. **실패시키지 않는다.**
 *
 * `.claude/rules/afds-component-tokens.md` 금지 패턴 1·2(`text-red-500`·`p-4`·`rounded-lg`)를
 * 찾는다. 래칫(`arbitrary-token-ratchet.test.ts`)에 넣지 않은 것은 사용자 결정이다: 기본 척도는
 * 막지 않고 알린다. 판정은 `tailwind-arbitrary-values.ts` 의 `findDefaultScaleClasses` 가 정본이다.
 *
 * **`::warning` 은 기준(`default-scale-warnings.baseline.json`)보다 건수가 늘어난 파일에만 찍는다**
 * (기준에 없는 새 파일은 기준 0). 그런 파일은 모든 위치를 찍는다. GitHub 은 스텝마다 warning
 * 주석을 10건까지만 보여 주므로, 기존 경고를 다 찍으면 PR 이 새로 만든 경고가 그 뒤로 밀려
 * 보이지 않는다. CI checkout 이 depth 1 이라 base 커밋과 diff 할 수 없어 기준 파일로 대신한다.
 * 나머지는 트리별 합계 한 줄만 찍는다.
 *
 * `console.log` 가 아니라 `process.stdout.write` 를 쓴다 — vitest 는 console 출력을 가로채
 * `stdout | <파일>` 머리와 함께 다시 찍고, 색이 켜지면 그 줄 앞에 ANSI 리셋 코드가 붙는다(실측
 * vitest 4.0.16). 워크플로 명령은 **줄 맨 앞**이 `::` 여야 인식된다.
 */
const REPO_ROOT = join(__dirname, '../../../..')
const BASELINE_PATH = join(__dirname, 'default-scale-warnings.baseline.json')
const BASELINE_DISPLAY_PATH = relative(REPO_ROOT, BASELINE_PATH)
const TREES = {
  afdsBricks: join(__dirname, '../../../afds/src/bricks'),
  afdsRegistryCompositions: join(__dirname, '../compositions'),
}

const baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf-8')) as Record<
  keyof typeof TREES,
  Record<string, number>
>

describe('Tailwind 기본 팔레트·spacing·radius — 경고만(실패 없음)', () => {
  it('기준보다 늘어난 파일만 ::warning 으로 찍는다', () => {
    for (const [label, root] of Object.entries(TREES) as [keyof typeof TREES, string][]) {
      const { matches, filesScanned } = scanDefaultScaleClasses(root)
      // 대조군 — 대상이 조용히 비면 경고 0건이 「깨끗함」으로 읽힌다.
      expect(filesScanned, `${relative(REPO_ROOT, root)} 에서 스캔한 파일 수`).toBeGreaterThan(0)

      const byFile = new Map<string, typeof matches>()
      for (const m of matches) byFile.set(m.file, [...(byFile.get(m.file) ?? []), m])
      const base = baseline[label]
      let annotated = 0
      // ponytail: 파일 단위 건수만 본다 — 줄였다가 옛 건수까지 다시 늘린 파일은 기준을 낮추기
      // 전까지 조용하다. 막으려면 이 테스트를 래칫처럼 「감소 시 실패」로 바꿔야 한다.
      for (const [file, fileMatches] of byFile) {
        const baseCount = base[file] ?? 0
        if (fileMatches.length <= baseCount) continue
        const path = relative(REPO_ROOT, join(root, file))
        for (const { line, className } of fileMatches) {
          process.stdout.write(
            `::warning file=${path},line=${line}::${className} — AFDS 토큰으로 바꾸세요(.claude/rules/afds-component-tokens.md)\n`,
          )
        }
        annotated += fileMatches.length
      }
      for (const [file, baseCount] of Object.entries(base)) {
        const count = byFile.get(file)?.length ?? 0
        if (count < baseCount) {
          process.stdout.write(
            `기본 척도 경고 감소: ${label}/${file} 기준 ${baseCount}건 → 실측 ${count}건 — ${BASELINE_DISPLAY_PATH} 를 낮추세요(실패 아님)\n`,
          )
        }
      }
      process.stdout.write(
        `Tailwind 기본 척도 경고 ${label}: 합계 ${matches.length}건 · 기준 초과로 주석 ${annotated}건\n`,
      )
    }
  })
})
