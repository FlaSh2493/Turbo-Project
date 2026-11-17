import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { scanArbitraryTokenValues } from '../lib/tailwind-arbitrary-values'

/**
 * Tailwind 임의 값(색·길이) **래칫** — `packages/afds/src/bricks` ·
 * `packages/afds-registry/src/compositions`.
 *
 * **배경**: `packages/config/eslint-config/eslint.config.js` 의 `no-restricted-syntax` 는
 * 리터럴 **전체**가 hex 일 때만 잡는다(`/^#[0-9a-fA-F]{3,6}$/`) — `text-[#FF5733] w-[137px]`
 * 는 통과한다. `.claude/rules/afds-component-tokens.md` 금지 패턴 절이 이 형태를 명시하는데도
 * 새 위반을 막을 기계가 없었다. 기존 위반이 있어(§8-3) 하드 게이트는 불가하고 래칫이다.
 *
 * **보호 문장**: 「bricks·컴포지션의 Tailwind 임의 값(색·길이)은 늘어날 수 없다 — 새로 쓰면
 * CI 가 막고, 줄이면 기준도 함께 줄어야 한다.」
 *
 * **래칫 판정은 하나의 규칙으로 네 요구를 모두 담는다 — 파일별 실측이 기준과 정확히 같아야
 * 한다(누락 키는 0으로 읽는다).** 그래서:
 * - 기존 파일의 건수가 늘면(실측 > 기준) 실패한다.
 * - 기존 파일의 건수가 줄었는데 기준을 안 낮추면(실측 < 기준) 실패한다 — 단조 감소를
 *   기준 파일 갱신으로 강제한다.
 * - 기준에 없는 새 파일에 1건이라도 있으면(기준 0 → 실측 N) 위 첫째 규칙과 같은 경로로 실패한다.
 * - 기준에 있던 파일이 트리에서 사라지거나 0건으로 고쳐지면(실측 0 → 기준 N) 위 둘째 규칙과
 *   같은 경로로 실패한다 — 기준 정리(항목 삭제)를 강제한다.
 *
 * **기준 파일 수정이 유일한 예외 경로다** — PR diff 에 드러나고 리뷰어가 본다. 해결법은
 * 기본이 AFDS 토큰으로 바꾸는 것(`.claude/rules/afds-component-tokens.md`)이고, 토큰으로
 * 표현할 수 없는 값이면 기준 파일을 올리는 변경을 PR 에 드러내고 리뷰어 승인을 받는 것이다.
 *
 * CI: afds-registry-test.yml 의 test 스텝이 돌린다 — packages/afds/* 변경도 ci-detect 가 afds_registry 를
 * 켜므로 afds 만 바꾼 PR 에서도 돈다.
 */
const AFDS_BRICKS_DIR = join(__dirname, '../../../afds/src/bricks')
const AFDS_REGISTRY_COMPOSITIONS_DIR = join(__dirname, '../compositions')
const BASELINE_PATH = join(__dirname, 'arbitrary-token-ratchet.baseline.json')
/** 실패 메시지용 표시 경로 — 워크트리마다 다른 절대 경로 대신 저장소 기준 상대 경로를 보여준다. */
const BASELINE_DISPLAY_PATH = relative(join(__dirname, '../../../..'), BASELINE_PATH)

interface Baseline {
  afdsBricks: Record<string, number>
  afdsRegistryCompositions: Record<string, number>
}

function loadBaseline(): Baseline {
  return JSON.parse(readFileSync(BASELINE_PATH, 'utf-8')) as Baseline
}

/** 두 값이 다른 모든 키에 대해 「기준 · 실측 · 방향 · 해결법」을 담은 실패 문구를 만든다. */
function ratchetFailures(
  treeLabel: string,
  actual: Record<string, number>,
  baseline: Record<string, number>,
): string[] {
  const keys = new Set([...Object.keys(actual), ...Object.keys(baseline)])
  const failures: string[] = []
  for (const key of [...keys].sort()) {
    const actualCount = actual[key] ?? 0
    const baseCount = baseline[key] ?? 0
    if (actualCount === baseCount) continue
    const path = `${treeLabel}/${key}`
    if (actualCount > baseCount) {
      failures.push(
        `${path}: 기준 ${baseCount}건 → 실측 ${actualCount}건 (증가). ` +
          `AFDS 토큰으로 바꿔라(.claude/rules/afds-component-tokens.md). ` +
          `토큰으로 표현할 수 없다면 기준 파일(${BASELINE_DISPLAY_PATH})을 올리는 변경을 PR 에 드러내고 리뷰어 승인을 받아라.`,
      )
    } else {
      failures.push(
        `${path}: 기준 ${baseCount}건 → 실측 ${actualCount}건 (감소). ` +
          `기준 파일(${BASELINE_DISPLAY_PATH})을 실측만큼 낮춰라 — 단조 감소를 기준 갱신으로 강제한다. ` +
          `파일이 사라졌다면 기준에서 그 항목을 지워라.`,
      )
    }
  }
  return failures
}

describe('Tailwind 임의 값(색·길이) 래칫 — bricks · compositions', () => {
  const afdsScan = scanArbitraryTokenValues(AFDS_BRICKS_DIR)
  const registryScan = scanArbitraryTokenValues(AFDS_REGISTRY_COMPOSITIONS_DIR)
  const baseline = loadBaseline()

  it('대조군 — 두 트리 모두에서 파일을 1개 이상 훑었다 (글롭이 조용히 비지 않는다)', () => {
    expect(afdsScan.filesScanned, 'afds bricks 트리에서 스캔한 파일 수').toBeGreaterThan(0)
    expect(
      registryScan.filesScanned,
      'afds-registry compositions 트리에서 스캔한 파일 수',
    ).toBeGreaterThan(0)
  })

  it('기준 파일의 키가 정렬돼 있다 — diff 를 읽을 수 있게', () => {
    expect(Object.keys(baseline.afdsBricks)).toEqual([...Object.keys(baseline.afdsBricks)].sort())
    expect(Object.keys(baseline.afdsRegistryCompositions)).toEqual(
      [...Object.keys(baseline.afdsRegistryCompositions)].sort(),
    )
  })

  it('afds bricks — 파일별 건수가 기준과 정확히 같다', () => {
    const failures = ratchetFailures('afds/src/bricks', afdsScan.counts, baseline.afdsBricks)
    expect(failures, failures.join('\n')).toEqual([])
  })

  it('afds-registry compositions — 파일별 건수가 기준과 정확히 같다', () => {
    const failures = ratchetFailures(
      'afds-registry/src/compositions',
      registryScan.counts,
      baseline.afdsRegistryCompositions,
    )
    expect(failures, failures.join('\n')).toEqual([])
  })
})
