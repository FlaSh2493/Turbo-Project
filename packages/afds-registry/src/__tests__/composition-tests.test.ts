import { describe, it, expect } from 'vitest'
import { readdirSync, type Dirent } from 'node:fs'
import { join } from 'node:path'
import { isDistributableFile, isSkippedDir } from '../lib/composition-files'

/**
 * 모든 컴포지션에 테스트가 있는가 — **래칫**. 23개 중 11개만 보유해(스토리는 23/23 이라
 * 하드 게이트로 넣었다) 지금 막으면 12건이 즉시 깨진다.
 *
 * **강제되는 불변식은 「면제 개수가 늘지 않는다」 하나다.** 개별 보유는 거래될 수 있다 —
 * 명부 안의 하나가 테스트를 얻어 목록에서 빠지면 다른 하나가 잃고 그 자리에 들어와도
 * 통과한다. 자유 손실은 아니다(보상 획득이 없으면 상한이 걸린다). 기준 시점 보유 11개를
 * 개별로 고정하려면 별도 명부가 필요하고 여기엔 없다. 다만 **신규 컴포지션은 어떤 경우에도
 * 면제받지 못한다** — 명부 밖 이름은 면제 불가다.
 *
 * **아래 상수들은 신뢰 경계다.** `KNOWN_MISSING_CAP`·`BASELINE_SIZE` 의 「올리지 않는다」는
 * 관례이지 기계가 아니다 — 상수 자신이 정본이라 강제할 단정이 있을 수 없다. 네 곳을 함께
 * 올리면 신규도 면제된다. 상한형 래칫의 일반 성질이고, diff 에 드러나는 것이 방어다.
 *
 * "테스트가 있다" 의 정의 — 셋 다 실측 근거가 있다.
 *
 * 1. `*.test.ts(x)` 만 센다 — 컴포지션 디렉터리 안 테스트 파일 13/13 이 이 형태다.
 *    (`compositions` 트리 전체로는 14개다. `compositions/__test__/` 의 1개는 컴포지션 소속이
 *    아니라 이 게이트가 세지 않는다.)
 * 2. `*.spec.ts(x)` 는 세지 않고 존재도 막는다. `composition-files.ts` 의 `EXCLUDED_FILE_RE`
 *    가 `.stories.`·`.test.` 만 걸러 **`isDistributableFile` 이 참** — 소비처로 복사된다.
 *    테스트로 인정하면 "테스트가 소비자 코드로 배포되는" 상태가 게이트를 만족시킨다.
 *    (`*.spec.md` 는 이미 스펙 문서를 뜻한다.)
 * 3. `__test__/`·`__tests__/` 안을 **들여다본다 — 스토리 게이트와 정반대다.** 각 게이트는
 *    자기가 세는 산출물이 **실제로 사는 트리**를 따라간다 — 스토리는 컴포넌트 옆에 있어야
 *    수집·배포되니 `__test__/` 안은 없는 것과 같고, 테스트는 관례상 그 안에 살며 애초에
 *    배포 대상이 아니다. 순회가 반대인 것은 불일치가 아니라 그 규칙의 귀결이다.
 *    실측: 이 규칙으로 보유 11/23 · 스토리 게이트 규칙으로 0/23("검사 방법이 못 본 0건").
 *
 * 래칫·면제 목록의 일반 규칙은 `docs/info/harness.md` §7 을 따른다.
 */
const COMPOSITIONS_DIR = join(__dirname, '../compositions')

/** 정의 ① — 테스트 파일로 인정하는 이름. */
const TEST_FILE_RE = /\.test\.(ts|tsx)$/

/** 정의 ② — 테스트로 인정하지 않고 존재 자체를 막는 이름. */
const SPEC_CODE_FILE_RE = /\.spec\.(ts|tsx)$/

/**
 * 기준 시점에 존재한 컴포지션 **전체 명부** — 역사적 사실이라 고치지 않는다.
 *
 * 상한만으로는 래칫이 샌다: 면제 항목에 테스트를 써 주면 목록에서 1칸이 비고, 그 자리에 새
 * 컴포지션을 넣으면 개수가 그대로라 통과한다. 명부 밖 이름을 면제 불가로 막아 그 슬롯 재활용을
 * 차단한다 — **신규 컴포지션은 어떤 경우에도 면제받지 못한다.**
 */
const BASELINE_COMPOSITIONS = [
  'alert-modal',
  'base-check-box',
  'base-input',
  'base-multi-select',
  'base-radio-group',
  'base-select',
  'base-table',
  'base-tooltip',
  'check-box-card',
  'date-picker',
  'date-picker-dropdown',
  'floating-action-bar-count',
  'ghost-select',
  'negative-modal',
  'overflow-tooltip',
  'page-layout',
  'pagination-bar',
  'period-filter',
  'popconfirm',
  'radio-card',
  'range-date-picker',
  'range-filter',
  'section-error-fallback',
] as const

/** 명부 크기 — 역사적 스냅샷이라 **변하지 않는다.** 명부에 이름을 더하려면 이 수도 함께 고쳐야 한다. */
const BASELINE_SIZE = 23

/** 테스트 없이 통과시키는 컴포지션 — **줄어들기만 한다.** 더할 수 없고, 테스트가 생기면 빼야 한다. */
const KNOWN_MISSING_TESTS = [
  'base-multi-select',
  'base-select',
  'date-picker',
  'date-picker-dropdown',
  'floating-action-bar-count',
  'ghost-select',
  'negative-modal',
  'pagination-bar',
  'period-filter',
  'range-date-picker',
  'range-filter',
] as const

/** 래칫 상한 — 기준 시점의 미보유 수. **올리지 않는다.** */
const KNOWN_MISSING_CAP = 12

/** `globSync` 는 Node 22 부터다 — 루트 `engines` 가 `>=18` 이라 하한을 올리지 않으려고 `readdirSync` 를 쓴다. */
function collectFiles(dir: string): string[] {
  let entries: Dirent[]
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    // 디렉터리를 읽을 수 없으면 빈 목록 — "테스트가 없다" 로 드러나는 쪽이 안전하다.
    return []
  }
  const found: string[] = []
  for (const entry of entries) {
    if (entry.isDirectory()) {
      // 정의 ③ — `__test__`/`__tests__` 는 **들어간다.** 현재 테스트 13/13 이 그 안에 있다.
      if (entry.name === 'node_modules') continue
      found.push(...collectFiles(join(dir, entry.name)))
    } else {
      found.push(join(dir, entry.name))
    }
  }
  return found
}

function testFilesOf(name: string): string[] {
  return collectFiles(join(COMPOSITIONS_DIR, name)).filter(p => TEST_FILE_RE.test(p))
}

function specCodeFilesOf(name: string): string[] {
  return collectFiles(join(COMPOSITIONS_DIR, name)).filter(p => SPEC_CODE_FILE_RE.test(p))
}

/**
 * 대상 선정에 `index.ts` 조건을 걸지 않는다 — 걸면 배럴 없는 디렉터리가 검사에서 빠져
 * **자동 통과**한다(스토리 게이트와 같은 판단).
 */
function compositionDirNames(): string[] {
  return readdirSync(COMPOSITIONS_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory() && !isSkippedDir(e.name))
    .map(e => e.name)
    .sort()
}

describe('컴포지션 테스트 존재 (래칫)', () => {
  const dirs = compositionDirNames()
  const exempt = new Set<string>(KNOWN_MISSING_TESTS)
  const baseline = new Set<string>(BASELINE_COMPOSITIONS)

  it('대조군 — 검사할 컴포지션 디렉터리가 실제로 있다', () => {
    // 분모가 0 이면 아래 단정이 빈 목록을 돌며 조용히 통과한다.
    expect(dirs.length).toBeGreaterThan(0)
  })

  it('대조군 — 기준 명부가 기준 크기 그대로다', () => {
    expect(
      BASELINE_COMPOSITIONS.length,
      '기준 명부는 역사적 스냅샷이다 — 크기가 변하면 안 된다',
    ).toBe(BASELINE_SIZE)
  })

  it('면제 목록이 무결하다 — 중복 없음 · 정렬됨 · 상한 이내', () => {
    const list = [...KNOWN_MISSING_TESTS]
    expect(new Set(list).size, `면제 목록에 중복이 있다: ${list.join(', ')}`).toBe(list.length)
    expect(list, '면제 목록은 정렬돼 있어야 한다 — diff 를 읽을 수 있게').toEqual([...list].sort())
    expect(
      list.length,
      `면제 목록은 ${KNOWN_MISSING_CAP}개를 넘을 수 없다 — 래칫은 줄어들기만 한다 (현재 ${list.length}개)`,
    ).toBeLessThanOrEqual(KNOWN_MISSING_CAP)
  })

  it('면제 목록에 기준 명부 밖의 이름이 없다 — 신규 컴포지션은 면제받지 못한다', () => {
    const outsiders = [...KNOWN_MISSING_TESTS].filter(name => !baseline.has(name))
    expect(
      outsiders,
      `기준 명부(${BASELINE_SIZE}개)에 없는 이름은 면제할 수 없다. 새 컴포지션이라면 테스트를 써라: ${outsiders.join(', ')}`,
    ).toEqual([])
  })

  it('면제 목록에 사라진 컴포지션이 남아 있지 않다', () => {
    const present = new Set(dirs)
    const stale = [...KNOWN_MISSING_TESTS].filter(name => !present.has(name))
    expect(
      stale,
      `삭제·개명된 컴포지션이 면제 목록에 남아 있다 — 목록에서 빼라: ${stale.join(', ')}`,
    ).toEqual([])
  })

  it('모든 컴포지션에 *.test.ts(x) 가 있다 (면제 목록 제외)', () => {
    const missing: string[] = []
    let covered = 0
    for (const name of dirs) {
      if (testFilesOf(name).length > 0) {
        covered++
        continue
      }
      if (exempt.has(name)) continue
      missing.push(`${name}: *.test.ts(x) 가 없다`)
    }
    // "위반 0건" 이 "아무것도 안 봤다" 인지 구분하려면 분모가 필요하다.
    expect(
      dirs.length,
      `검사한 컴포지션 ${dirs.length}개 · 테스트 보유 ${covered}개`,
    ).toBeGreaterThan(0)
    expect(missing).toEqual([])
  })

  it('면제 목록의 컴포지션이 테스트를 얻으면 목록에서 빠져야 한다 (단조 감소)', () => {
    const graduated = [...KNOWN_MISSING_TESTS].filter(name => testFilesOf(name).length > 0)
    expect(
      graduated,
      `테스트가 생겼다 — KNOWN_MISSING_TESTS 에서 빼라 (래칫을 한 칸 조인다): ${graduated.join(', ')}`,
    ).toEqual([])
  })

  it('테스트로 센 파일은 소비처 배포 대상이 아니다', () => {
    // 분류 정본(`composition-files.ts`)과 묶어 둔다 — `EXCLUDED_FILE_RE` 가 느슨해져
    // 테스트 파일이 소비처로 복사되기 시작하면 여기서 먼저 깨진다.
    const leaking: string[] = []
    let checked = 0
    for (const name of dirs) {
      for (const path of testFilesOf(name)) {
        checked++
        const fileName = path.slice(path.lastIndexOf('/') + 1)
        if (isDistributableFile(fileName)) leaking.push(`${name}/${fileName}`)
      }
    }
    expect(checked, `대조군 — 테스트 파일 ${checked}개를 실제로 대조했다`).toBeGreaterThan(0)
    expect(leaking).toEqual([])
  })

  it('컴포지션 안에 *.spec.ts(x) 를 두지 않는다', () => {
    // 정의 ② — vitest 는 수집하지만 소비처로 복사된다. `*.spec.md`(스펙 문서)와 다르다.
    const offenders: string[] = []
    for (const name of dirs) {
      for (const path of specCodeFilesOf(name)) {
        offenders.push(`${name}: ${path.slice(path.lastIndexOf('/') + 1)}`)
      }
    }
    expect(
      offenders,
      '테스트라면 *.test.ts(x) 로 쓴다 — *.spec.ts(x) 는 테스트로 세지 않고 소비처로 배포된다',
    ).toEqual([])
  })
})
