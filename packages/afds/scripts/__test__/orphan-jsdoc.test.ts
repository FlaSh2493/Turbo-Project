import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * JSDoc 블록이 **아무 선언에도 붙지 않는** 자리를 막는다 (#187).
 *
 * JSDoc 이 끝난 **바로 다음 줄**에서 또 JSDoc 이 시작하면 앞 블록은 어느 선언에도 붙지
 * 않는다 — 도구도 IDE 도 무시하고 사람만 읽는다. #187 에서 8건을 정리했고(표류한 설명이
 * 엉뚱한 심볼의 문서 자리를 차지하거나 같은 대상을 두 번 설명했다) 이 검사가 재유입을 막는다.
 *
 * **0건이 항상 결함은 아니다.** 형태가 둘로 갈린다.
 *
 * - **인접** — `*\/` 다음 줄이 곧 `/**`. 앞 블록이 붙을 곳이 없다 → 위반.
 * - **빈 줄 분리** — 사이에 빈 줄이 있으면 앞 블록은 **파일·모듈 머리말**로 읽힌다. TS/JS 의
 *   정상 관용이고 #187 기준 12곳이 이 형태였다 → 통과해야 한다.
 *
 * **두 형태를 「일관성」을 이유로 합치지 마라.** 단순히 「`*\/` 뒤 `/**` = 실패」로 만들면 그
 * 정상 머리말들이 **거짓 실패**한다. `eslint-globs.test.ts` 가 커버 글롭과 금지 글롭을 나눈
 * 것과 같은 이유다.
 *
 * ## 검출기가 읽어야 하는 세 형태 — 픽스처로 고정한다
 *
 * #187 에서 검출기를 세 번 고쳐야 이슈가 센 20건에 도달했다. 그 진화를 픽스처로 못박아
 * 두지 않으면 다음 사람이 1단계로 되돌리고, 그때 줄어든 수가 「깨끗해졌다」로 읽힌다.
 *
 * | 검출 방식 | #187 시점 결과 |
 * | --- | --- |
 * | `*\/` 가 **단독**인 줄 + 다음 줄 `/**` | 7건 |
 * | ↑ + 사이 빈 줄 허용(= 머리말 형태까지 분류) | 19건 |
 * | ↑ + **단일행 `/** … *\/` 뒤 블록** | **20건** |
 *
 * 세 번째가 `calendar.stories.tsx:597` 이었다. 1단계의 7 은 「없다」가 아니라 **「검사 방법이
 * 못 봤다」**였다.
 */

const REPO_ROOT = join(__dirname, '../../../..')

/**
 * 스캔 루트. **합성 트리를 가리키게 할 수 있다** — 실재 트리가 깨끗하면 위반 분기가 한 번도
 * 실행되지 않아, 판정을 지워도 아무것도 실패하지 않는 상태가 된다(`ci-structure` 의 `CI_YML`
 * override 와 같은 이유). 아래 픽스처 단정이 그 분기를 매 실행마다 통과시킨다.
 */
const SCAN_ROOT = process.env.ORPHAN_SCAN_ROOT?.trim() || REPO_ROOT

const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  '.git',
  '.turbo',
  'coverage',
  'storybook-static',
  '.next',
])
const CODE_FILE_RE = /\.(ts|tsx|js|jsx|mjs|cjs)$/

export type Shape = 'adjacent' | 'preamble'

export interface Finding {
  line: number
  shape: Shape
  /** 한 줄로 시작하고 끝나는 JSDoc 이 앞 블록이었는가 — 3단계 검출기가 잡는 형태다. */
  oneLine: boolean
}

/**
 * 파일 한 개의 내용에서 「JSDoc 이 끝난 뒤 곧 JSDoc 이 시작하는」 자리를 찾는다.
 *
 * `*\/` 로 끝나는 줄을 블록 종료로 본다 — 단독 `*\/`, 이어지는 `* … *\/`, 그리고 **한 줄로
 * 끝나는 `/** … *\/`** 셋 다. 마지막을 빼면 3단계 검출기가 되지 못한다.
 */
export function findOrphans(source: string): Finding[] {
  const lines = source.split('\n')
  const out: Finding[] = []
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim()
    const endsBlock = t.endsWith('*/') && (t === '*/' || t.startsWith('/**') || t.startsWith('*'))
    if (!endsBlock) continue
    let j = i + 1
    let blanks = 0
    while (j < lines.length && lines[j].trim() === '') {
      blanks++
      j++
    }
    if (j >= lines.length || !lines[j].trim().startsWith('/**')) continue
    out.push({
      line: i + 1,
      shape: blanks === 0 ? 'adjacent' : 'preamble',
      oneLine: t.startsWith('/**'),
    })
  }
  return out
}

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue
      walk(join(dir, entry.name), acc)
    } else if (CODE_FILE_RE.test(entry.name)) {
      acc.push(join(dir, entry.name))
    }
  }
  return acc
}

interface Scan {
  files: number
  adjacent: Array<{ file: string; line: number }>
  preamble: Array<{ file: string; line: number }>
}

function scan(root: string): Scan {
  const out: Scan = { files: 0, adjacent: [], preamble: [] }
  for (const path of walk(root)) {
    out.files++
    let src: string
    try {
      src = readFileSync(path, 'utf-8')
    } catch {
      continue
    }
    const rel = path.slice(root.length + 1)
    for (const f of findOrphans(src)) {
      ;(f.shape === 'adjacent' ? out.adjacent : out.preamble).push({ file: rel, line: f.line })
    }
  }
  return out
}

// ── 픽스처 — 검출기가 읽어야 하는 형태를 고정한다 ────────────────────────────────
// 문자열로 둔다. 실제 파일로 두면 이 파일 자신이 위반이 되고, 다른 검사(lint·포맷)의
// 대상이 되어 형태가 조용히 교정된다.
const CLOSE = '*' + '/' // 이 파일 안에서 블록을 닫지 않으려고 쪼개 쓴다

const FIXTURES = {
  // 1단계가 잡는 형태 — 블록 종료가 단독으로 있는 줄 다음이 곧 새 블록이다.
  adjacentMultiline: `/**\n * 고아\n ${CLOSE}\n/**\n * 붙는 것\n ${CLOSE}\nexport const x = 1\n`,
  // 2단계가 가르는 형태 — 사이 빈 줄. 머리말이므로 통과해야 한다.
  preambleSeparated: `/**\n * 파일 머리말\n ${CLOSE}\n\n/**\n * 붙는 것\n ${CLOSE}\nexport const x = 1\n`,
  // 3단계만 잡는 형태 — 한 줄로 시작하고 끝나는 JSDoc 뒤에 블록이 온다.
  adjacentOneLine: `/** 고아 한 줄 ${CLOSE}\n/**\n * 붙는 것\n ${CLOSE}\nexport const x = 1\n`,
  // 대조 — JSDoc 뒤에 코드가 오면 아무것도 아니다.
  attachedNormally: `/**\n * 정상\n ${CLOSE}\nexport const x = 1\n`,
} as const

describe('고아 JSDoc', () => {
  describe('검출기 — 세 형태를 고정한다 (실재 트리가 깨끗해도 위반 분기가 실행된다)', () => {
    it('단독 */ 다음 줄이 곧 /** 이면 인접으로 판정한다 (1단계)', () => {
      const f = findOrphans(FIXTURES.adjacentMultiline)
      expect(f).toHaveLength(1)
      expect(f[0].shape).toBe('adjacent')
      expect(f[0].oneLine).toBe(false)
    })

    it('사이에 빈 줄이 있으면 머리말로 판정한다 — 통과해야 하는 형태 (2단계)', () => {
      const f = findOrphans(FIXTURES.preambleSeparated)
      expect(f).toHaveLength(1)
      expect(f[0].shape).toBe('preamble')
    })

    it('단일행 /** … */ 뒤에 블록이 오는 것도 인접으로 판정한다 (3단계)', () => {
      // 이 형태를 빼면 검출기가 1단계로 퇴화하고, 줄어든 수가 "깨끗해졌다" 로 읽힌다.
      const f = findOrphans(FIXTURES.adjacentOneLine)
      expect(f).toHaveLength(1)
      expect(f[0].shape).toBe('adjacent')
      expect(f[0].oneLine).toBe(true)
    })

    it('JSDoc 뒤에 코드가 오면 아무것도 보고하지 않는다', () => {
      expect(findOrphans(FIXTURES.attachedNormally)).toEqual([])
    })
  })

  describe('저장소', () => {
    const result = scan(SCAN_ROOT)

    it('대조군 — 스캔이 실제로 파일을 읽었다', () => {
      // 0 이면 아래 단정이 빈 목록을 돌며 조용히 통과한다.
      expect(result.files, `스캔한 코드 파일 ${result.files}개`).toBeGreaterThan(0)
    })

    it('대조군 — 정상 머리말 형태가 실재하고 위반으로 세지 않는다', () => {
      // 이 단정이 없으면 "두 형태를 가른다" 는 주장이 검사되지 않는다 — 머리말이 0건이면
      // 인접만 세는 검출기와 구별되지 않는다.
      expect(
        result.preamble.length,
        `빈 줄로 분리된 머리말 ${result.preamble.length}건`,
      ).toBeGreaterThan(0)
    })

    it('아무것에도 붙지 않는 JSDoc 이 없다', () => {
      const violations = result.adjacent.map(
        v => `${v.file}:${v.line} — JSDoc 이 끝난 다음 줄에서 곧 JSDoc 이 시작한다`,
      )
      expect(
        result.files,
        `검사한 파일 ${result.files}개 · 머리말 ${result.preamble.length}건`,
      ).toBeGreaterThan(0)
      // 위반 목록을 메시지에 담는다 — vitest 기본 출력은 `Array(n)` 으로 접혀 **어느 파일인지
      // 보이지 않는다.** 판정을 읽고 고치는 사람에게 필요한 것은 개수가 아니라 위치다.
      expect(
        violations,
        violations.length
          ? `아무것에도 붙지 않는 JSDoc ${violations.length}건:\n  ${violations.join('\n  ')}\n` +
              '앞 블록이 파일 머리말이면 빈 줄 하나로 분리하고, 다른 심볼의 설명이면 그 심볼로 옮겨라.'
          : '',
      ).toEqual([])
    })
  })
})
