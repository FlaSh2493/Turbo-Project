import { describe, expect, it } from 'vitest'
import { mkdtempSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { findStoryDeterminismViolations } from './story-determinism.analyzer'

// **`process.cwd()` 로 잡지 않는다.** 어디서 vitest 를 띄우느냐에 따라 스캔 대상이 통째로
// 달라지면 "위반 0건" 이 "깨끗하다" 가 아니라 "엉뚱한 데를 봤다" 가 될 수 있다.
const PKG_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')

// **검사 범위: `src/compositions/**`.** afds 의 같은 가드는 `src/**` + `tokens/stories/**`
// 를 본다(Storybook 이 읽는 뿌리 전부) — 컴포지션이 이 패키지로 이전되며 그중 날짜 계열
// 스토리 4개가 여기로 왔다. `apps/storybook/.storybook/main.cjs` 가 이 패키지의 스토리도
// 읽으므로 같은 결정성 검사가 필요하다.
const STORY_ROOT = join(PKG_DIR, 'src', 'compositions')

/**
 * 스토리 스냅샷이 실행 날짜·난수에 좌우되지 않게 강제한다.
 *
 * Chromatic 이 매일 "변경" 을 내면 사람이 맹목 수락을 학습하고 시각 회귀 검사의 신호가
 * 0이 된다. 판정 로직 자체의 단위 테스트(오탐·누락 경계 사례)는 afds 의
 * `story-determinism.test.ts` 가 이미 exhaustively 검증한다 — analyzer 는 그 파일과
 * 동일한 사본이므로 여기서 반복하지 않는다. 여기서 보는 것은 **이 패키지의 실제 트리**다.
 */
describe('스토리 결정성 (compositions)', () => {
  const {
    violations: rawViolations,
    scannedFiles: rawScannedFiles,
    filesScanned,
  } = findStoryDeterminismViolations(STORY_ROOT)
  const violations = rawViolations.map(v => ({ ...v, file: `src/compositions/${v.file}` }))
  const scannedFiles = rawScannedFiles.map(f => `src/compositions/${f}`)

  it('렌더 중에 new Date()/Date.now()/Math.random() 을 호출하는 스토리가 없다', () => {
    const report = violations.map(v => `  ${v.file}:${v.line}  ${v.expression}`).join('\n')

    expect(
      violations,
      `렌더 시점 비결정 호출 ${violations.length}건:\n${report}\n\n` +
        '고정 값을 쓰거나(예: new Date(2026, 0, 15)) 이벤트 핸들러 안으로 옮겨라.',
    ).toHaveLength(0)
  })

  // 하한이 아니라 등식으로 "일부를 조용히 버림" 을 잡는다(afds 쪽과 같은 이유).
  const globStories = (dir: string, acc: string[] = []): string[] => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) globStories(full, acc)
      else if (/\.stories\.(tsx|ts|jsx|js|mjs)$/.test(entry)) acc.push(relative(PKG_DIR, full))
    }
    return acc
  }

  it('검사기가 스토리 파일을 하나도 빠뜨리지 않고 읽는다', () => {
    console.info(`[story-determinism] 검사 대상 = ${filesScanned}개 (src/compositions/**)`)

    expect([...scannedFiles].sort(), '스캔 목록이 실제 파일 목록과 다르다').toEqual(
      globStories(STORY_ROOT).sort(),
    )
    expect(filesScanned).toBe(scannedFiles.length)

    // afds 의 같은 검사에서 이전해 온 날짜 계열 스토리 4개 — 스캔에서 빠지면 나머지
    // 단정이 전부 공허해진다.
    const dateStories = [
      'src/compositions/date-picker/date-picker.stories.tsx',
      'src/compositions/range-date-picker/range-date-picker.stories.tsx',
      'src/compositions/date-picker-dropdown/date-picker-dropdown.stories.tsx',
      'src/compositions/period-filter/period-filter.stories.tsx',
    ]
    for (const f of dateStories) {
      expect(scannedFiles, `날짜 계열 스토리가 스캔에서 빠졌다: ${f}`).toContain(f)
    }
  })

  // 옮긴 analyzer 가 새 위치에서도 실제로 발화하는지 최소 1건으로 확인한다(파괴 재현).
  it('렌더 시점 호출은 잡고 이벤트 핸들러 안의 호출은 잡지 않는다', () => {
    const fixture = mkdtempSync(join(tmpdir(), 'afds-registry-story-'))
    try {
      writeFileSync(
        join(fixture, 'a.stories.tsx'),
        [
          'export const Bad = { render: function B() {',
          '  const now = new Date()',
          '  return <div>{String(now)}</div>',
          '} }',
          'export const Ok = { render: function O() {',
          '  const onClick = () => console.log(new Date(), Math.random())',
          '  const fixed = new Date(2026, 0, 15)',
          '  return <button onClick={onClick}>{String(fixed)}</button>',
          '} }',
        ].join('\n'),
      )
      const { violations: found, filesScanned: n } = findStoryDeterminismViolations(fixture)

      expect(n).toBe(1)
      expect(found).toHaveLength(1)
      expect(found[0]?.expression).toBe('new Date()')
    } finally {
      rmSync(fixture, { recursive: true, force: true })
    }
  })
})
