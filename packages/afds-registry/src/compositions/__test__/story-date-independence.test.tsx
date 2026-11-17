import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as React from 'react'
import { render, cleanup } from '@testing-library/react'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as DatePickerStories from '../date-picker/date-picker.stories'
import * as RangeDatePickerStories from '../range-date-picker/range-date-picker.stories'
import * as DropdownStories from '../date-picker-dropdown/date-picker-dropdown.stories'
import * as PeriodFilterStories from '../period-filter/period-filter.stories'

/**
 * 스토리 스냅샷이 **실행 날짜와 무관**함을 직접 증명한다.
 *
 * `packages/afds/src/bricks/form/calendar/__test__/story-date-independence.test.tsx` 와
 * 짝이다 — 그 파일은 `bricks/form/calendar` 자신만 본다. 여기는 컴포지션이 afds-registry 로
 * 이전되며 함께 옮겨진 4개(DatePicker·RangeDatePicker·DatePickerDropdown·PeriodFilter)를
 * 본다. 로직·근거는 이전 지점의 원문 그대로다.
 *
 * Chromatic 은 이 성질을 증명해 주지 못한다: `exitZeroOnChanges: true` 라 체크는 항상 초록이고,
 * "변경 0건" 을 보려면 하루를 기다려야 한다. 그래서 시스템 시각을 서로 다른 두 날짜로 바꿔
 * 각각 렌더한 뒤 DOM 이 동일한지 단정한다 — 날짜 의존이 하나라도 남아 있으면 여기서 깨진다.
 *
 * 실패하면 해당 스토리에 `new Date()`/`Date.now()` 가 렌더 시점에 남아 있거나,
 * 캘린더의 표시 월이 고정되지 않아 `isToday` 가 매칭되고 있다는 뜻이다.
 */

/**
 * 두 날짜가 우연히 비슷하면 테스트가 통과해도 아무것도 증명하지 못한다.
 * 연·월·일·요일·월길이·윤년이 서로 다른 쌍들을 쓴다.
 *
 * **전제: 모든 날짜는 스토리가 고정한 달(2026-01)보다 뒤다.**
 * 이 수정이 보장하는 것은 "날짜와 무관" 이 아니라 **"고정한 달이 과거다"** 이기 때문이다.
 * 시계가 2026년 1월 안에 들어가면 `isToday` 가 매칭되어 today 인디케이터가 나타나 DOM 이
 * 달라진다 — 그러나 시간은 앞으로만 가므로 현실에서 다시 일어날 수 없다.
 */
const DATE_PAIRS: ReadonlyArray<readonly [string, Date, Date]> = [
  ['평범한 두 날짜', new Date(2026, 7, 27, 12), new Date(2027, 2, 3, 12)],
  ['윤년 2월 29일 ↔ 평년', new Date(2028, 1, 29, 12), new Date(2027, 1, 28, 12)],
  ['월말 ↔ 월초', new Date(2026, 2, 31, 23), new Date(2026, 3, 1, 0)],
  ['연말 ↔ 연초', new Date(2026, 11, 31, 23), new Date(2027, 0, 1, 0)],
]

/**
 * 렌더마다 새로 생성되는 id 를 지운다 (react-aria / base-ui).
 *
 * 속성 이름 앞을 **공백으로 앵커한다.** 앵커가 없으면 `id=` 가 `data-grid=`·`data-testid=` 의
 * 꼬리에도 걸려서 그 값까지 `_` 로 지워진다(실측). 지워진 자리에 날짜 의존이 숨어 있으면
 * 이 테스트는 조용히 통과한다 — 마스킹은 거짓 음성 방향이라 더 위험하다.
 */
const normalize = (html: string) =>
  html
    .replace(/(?<=\s)(id|for|aria-labelledby|aria-describedby|aria-controls)="[^"]*"/g, '$1="_"')
    .replace(/:r[0-9a-z]+:/g, ':_:')

const renderAt = async (date: Date, story: CollectedStory) => {
  vi.setSystemTime(date)
  const { container } = render(<story.render />)
  // play 가 있으면 Chromatic 은 그것이 끝난 뒤 스냅샷을 찍는다. 열린 팝오버 안의 캘린더가
  // 현재 달을 렌더하는 부류를 이 테스트가 놓치지 않으려면 여기서도 play 를 돌려야 한다.
  if (story.play) await story.play({ canvasElement: container })
  // 열림 애니메이션이 **끝난 뒤** 찍는다. Chromatic 도 애니메이션을 정지시킨 뒤 스냅샷하므로
  // 진행 중 상태(`data-starting-style`)를 비교하면 내용과 무관한 차이를 잡게 된다.
  await vi.advanceTimersByTimeAsync(2000)
  // 팝오버는 body 로 포털된다 — container 만 보면 열린 캘린더를 놓친다.
  const html = normalize(container.innerHTML + document.body.innerHTML)
  cleanup()
  return html
}

type StoryModule = Record<string, unknown>

interface CollectedStory {
  id: string
  render: React.ComponentType
  /** Storybook play 함수. 있으면 Chromatic 은 **play 완료 후** 스냅샷을 찍는다. */
  play?: (ctx: { canvasElement: HTMLElement }) => Promise<void> | void
}

/**
 * 스토리 모듈에서 렌더 가능한 컴포넌트를 모은다.
 *
 * `render` 가 없는 args-only 스토리(`export const Default: Story = {}`)를 **그냥 버리면 안 된다.**
 * 실제로 그렇게 버려진 `RangeDatePicker/Default` 가 표시 월을 고정하지 않아 매월 스냅샷을
 * 바꾸고 있었는데, 이 테스트는 그것을 검사조차 하지 않았다. Storybook 과 같은 방식으로
 * `meta.component` 에 `meta.args + story.args` 를 씌워 조립한다.
 */
const storyComponents = (mod: StoryModule, moduleName: string) => {
  const meta = mod.default as
    | { component?: React.ComponentType; args?: Record<string, unknown> }
    | undefined

  const collected: CollectedStory[] = []
  const dropped: string[] = []

  for (const [name, story] of Object.entries(mod)) {
    if (name === 'default') continue
    const s = story as { render?: React.ComponentType; args?: Record<string, unknown> } | undefined

    const play = (s as { play?: CollectedStory['play'] })?.play

    if (typeof s?.render === 'function') {
      collected.push({ id: `${moduleName}/${name}`, render: s.render, play })
      continue
    }

    const Component = meta?.component
    if (!Component) {
      dropped.push(`${moduleName}/${name}`)
      continue
    }
    const args = { ...(meta?.args ?? {}), ...(s?.args ?? {}) }
    const Composed = () => React.createElement(Component, args)
    collected.push({ id: `${moduleName}/${name}`, render: Composed, play })
  }

  return { collected, dropped }
}

const MODULES: ReadonlyArray<readonly [StoryModule, string]> = [
  [DatePickerStories, 'DatePicker'],
  [RangeDatePickerStories, 'RangeDatePicker'],
  [DropdownStories, 'DatePickerDropdown'],
  [PeriodFilterStories, 'PeriodFilter'],
]

/** `MODULES` 가 덮는 스토리 파일. 위 배열과 **반드시 나란히** 갱신한다 (아래 테스트가 강제한다). */
const COVERED_FILES = [
  'date-picker/date-picker.stories.tsx',
  'range-date-picker/range-date-picker.stories.tsx',
  'date-picker-dropdown/date-picker-dropdown.stories.tsx',
  'period-filter/period-filter.stories.tsx',
]

const results = MODULES.map(([mod, name]) => storyComponents(mod, name))
const allStories = results.flatMap(r => r.collected)
const droppedStories = results.flatMap(r => r.dropped)
const totalExports = MODULES.reduce(
  (n, [mod]) => n + Object.keys(mod).filter(k => k !== 'default').length,
  0,
)

describe('날짜 계열 컴포지션 스토리는 실행 날짜와 무관하게 렌더된다', () => {
  beforeEach(() => {
    // `performance` 를 함께 가짜로 만들지 않으면 시간 기준이 둘로 갈린다: `Date.now()` 는
    // 가짜 시계를, `performance.now()` 는 진짜 시계를 읽는다. 그러면 Base UI 팝오버의
    // 열림 애니메이션 부트스트랩이 **가짜 시계가 실제 현재보다 과거인지 미래인지**에 따라
    // `data-starting-style` 을 남기거나 지워서, 캘린더 내용과 무관하게 DOM 이 달라진다.
    vi.useFakeTimers({
      shouldAdvanceTime: true,
      toFake: [
        'Date',
        'performance',
        'setTimeout',
        'clearTimeout',
        'setInterval',
        'clearInterval',
        'requestAnimationFrame',
        'cancelAnimationFrame',
        'queueMicrotask',
      ],
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // 하한(`> 10`)으로는 "일부를 조용히 버렸다" 를 잡을 수 없다.
  it('스토리를 하나도 버리지 않고 전부 수집한다', () => {
    expect(droppedStories, '조립하지 못해 버린 스토리').toEqual([])
    expect(allStories).toHaveLength(totalExports)
  })

  // **`MODULES` 는 손으로 유지되는 배열이다.** 캘린더를 렌더하는 새 컴포지션 스토리가
  // 생겨도 이 배열에 넣지 않으면 검사가 조용히 통과한다 — 소스에서 직접 대조한다.
  it('캘린더를 렌더하는 컴포지션 스토리 파일을 하나도 빠뜨리지 않았다', () => {
    const srcDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')

    const walk = (dir: string, acc: string[] = []): string[] => {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry)
        if (statSync(full).isDirectory()) walk(full, acc)
        else if (/\.stories\.(tsx|ts|jsx|js|mjs)$/.test(entry)) acc.push(full)
      }
      return acc
    }

    const CALENDAR_USE = /(Calendar|DatePicker|PeriodFilter)/
    const usesCalendar = walk(srcDir)
      .filter(f => CALENDAR_USE.test(readFileSync(f, 'utf8')))
      .map(f => f.slice(srcDir.length + 1))
      .sort()

    expect(
      usesCalendar,
      '캘린더를 렌더하는 컴포지션 스토리 파일이 늘었는데 MODULES 에 추가되지 않았다',
    ).toEqual([...COVERED_FILES].sort())
  })

  // 고정한 달이 미래로 넘어가면 그 순간 `isToday` 가 다시 매칭되어 이 전제 전체가 무효가
  // 된다 — 4곳에 복제된 `fixedToday` 가 서로 어긋나지 않는지도 함께 본다.
  it('스토리가 고정한 날짜는 모두 같고, 모두 과거다', () => {
    const srcDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')

    const pinned = COVERED_FILES.map(rel => {
      const source = readFileSync(join(srcDir, rel), 'utf8')
      const m = source.match(/const fixedToday = \(\) => new Date\((\d+), (\d+), (\d+)\)/)
      expect(m, `${rel} 에 fixedToday 고정 정의가 없다`).not.toBeNull()
      return { rel, text: m![0], date: new Date(+m![1], +m![2], +m![3]) }
    })

    // 4곳이 서로 다른 달을 가리키면 "고정" 이 아니다.
    expect(
      new Set(pinned.map(p => p.text)).size,
      `서로 다른 고정 값: ${pinned.map(p => `${p.rel}=${p.text}`).join(' | ')}`,
    ).toBe(1)

    // 시계는 앞으로만 가므로, 지금 과거면 앞으로도 계속 과거다.
    const realNow = new Date()
    for (const p of pinned) {
      expect(
        p.date.getTime(),
        `${p.rel} 의 고정 날짜(${p.date.toISOString()})가 과거가 아니다 — ` +
          '고정한 달이 현재 달이 되면 today 인디케이터가 다시 나타나 스냅샷이 흔들린다.',
      ).toBeLessThan(realNow.getTime())
    }
  })

  it.each(allStories)('$id', async story => {
    for (const [label, a, b] of DATE_PAIRS) {
      const first = await renderAt(a, story)
      const second = await renderAt(b, story)
      expect(second, `날짜쌍: ${label}`).toBe(first)
    }
  })
})
