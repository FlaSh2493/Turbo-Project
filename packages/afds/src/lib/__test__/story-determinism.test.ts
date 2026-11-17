import { describe, expect, it } from 'vitest'
import { mkdtempSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { findStoryDeterminismViolations } from './story-determinism.analyzer'

// **`process.cwd()` 로 잡지 않는다.** 어디서 vitest 를 띄우느냐에 따라 스캔 대상이 통째로
// 달라지면 "위반 0건" 이 "깨끗하다" 가 아니라 "엉뚱한 데를 봤다" 가 될 수 있다.
// 이 파일 위치를 기준으로 삼으면 실행 위치와 무관하게 같은 곳을 본다.
const PKG_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const SRC_DIR = join(PKG_DIR, 'src')

// **Storybook 이 읽는 뿌리를 전부 검사한다.** `apps/storybook/.storybook/main.cjs` 는
// `packages/afds/src/**` 와 `packages/afds/tokens/stories/**` 두 곳에서 스토리를 읽는다.
// `src/` 만 보면 tokens 스토리 5개는 Chromatic 이 스냅샷하는데 가드는 보지 않는다 —
// 지금은 그 5개에 비결정 호출이 없지만, 검사 범위가 스냅샷 범위보다 좁다는 사실 자체가 구멍이다.
// (`apps/storybook/stories/` 는 `.mdx` 뿐이라 대상 없음 — 실측 확인.)
const STORY_ROOTS = [SRC_DIR, join(PKG_DIR, 'tokens', 'stories')]

/**
 * 스토리 스냅샷이 실행 날짜·난수에 좌우되지 않게 강제한다.
 *
 * Chromatic 이 매일 "변경" 을 내면 사람이 **맹목 수락을 학습**하고 시각 회귀 검사의 신호가
 * 0이 된다. 거짓 양성은 검사를 시끄럽게 만드는 데서 그치지 않고 검사 자체를 무력화한다.
 */
describe('스토리 결정성', () => {
  const scans = STORY_ROOTS.map(root => ({
    root,
    ...findStoryDeterminismViolations(root),
  }))
  const violations = scans.flatMap(s =>
    s.violations.map(v => ({ ...v, file: `${relative(PKG_DIR, s.root)}/${v.file}` })),
  )
  const scannedFiles = scans.flatMap(s =>
    s.scannedFiles.map(f => `${relative(PKG_DIR, s.root)}/${f}`),
  )
  const filesScanned = scans.reduce((n, s) => n + s.filesScanned, 0)

  it('렌더 중에 new Date()/Date.now()/Math.random() 을 호출하는 스토리가 없다', () => {
    const report = violations.map(v => `  ${v.file}:${v.line}  ${v.expression}`).join('\n')

    expect(
      violations,
      `렌더 시점 비결정 호출 ${violations.length}건:\n${report}\n\n` +
        '고정 값을 쓰거나(예: new Date(2026, 0, 15)) 이벤트 핸들러 안으로 옮겨라.',
    ).toHaveLength(0)
  })

  // **하한으로는 "일부를 조용히 버림" 을 잡을 수 없다.** `> 30` 이면 64개 중 33개가 사라져도
  // 통과한다 — 실제로 수집기가 `compositions/` 를 건너뛰게 만들면 40개만 스캔하면서
  // 트리에 위반이 있는데도 전부 통과했다. 그래서 두 가지로 바꾼다:
  //   (1) 독립적으로 센 파일 수와 **등식**으로 비교한다 (분석기의 수집기를 쓰지 않는다)
  //   (2) 날짜 계열 스토리 5개가 **이름으로** 스캔 목록에 있는지 단정한다
  // (1)만으로는 "다른 파일이 늘어 수가 맞는" 경우를 못 잡고, (2)가 실제로 지켜야 할 것이다.
  const globStories = (dir: string, acc: string[] = []): string[] => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) globStories(full, acc)
      else if (/\.stories\.(tsx|ts|jsx|js|mjs)$/.test(entry)) acc.push(relative(PKG_DIR, full))
    }
    return acc
  }

  it('검사기가 스토리 파일을 하나도 빠뜨리지 않고 읽는다', () => {
    console.info(
      `[story-determinism] 검사 대상 = ${filesScanned}개 ` +
        `(src/** + tokens/stories/**, .stories.{tsx,ts,jsx,js,mjs})`,
    )

    const expected = STORY_ROOTS.flatMap(r => globStories(r)).sort()
    expect([...scannedFiles].sort(), '스캔 목록이 실제 파일 목록과 다르다').toEqual(expected)
    expect(filesScanned).toBe(expected.length)

    // 이 PR 이 지키려는 대상 자체가 스캔에서 빠지면 나머지 단정은 전부 공허하다.
    // **`STORY_ROOTS` 는 자기 자신과 비교되면 안 된다.** 위 등식은 스캔 목록과 glob 결과를
    // 대조하는데 둘 다 같은 상수에서 나오므로, 뿌리를 하나 지우면 **양쪽이 함께 줄어 통과**한다
    // (실측: tokens 뿌리를 빼자 64개로 줄었는데 전부 통과했다).
    // M1 에서 닫은 것이 "수집기 vs 범위" 였다면 여기는 "범위 vs Storybook 설정" 이 열려 있었다.
    // 현실적 드리프트는 `main.cjs` 에 뿌리가 추가되는 쪽이므로, **각 뿌리의 대표 파일을
    // 이름으로** 단정해 뿌리 자체가 사라지는 경우를 잡는다.
    const tokenStories = [
      'tokens/stories/design-tokens.stories.tsx',
      'tokens/stories/primitive-tokens.stories.tsx',
      'tokens/stories/custom-tokens.stories.tsx',
      'tokens/stories/effects-tokens.stories.tsx',
      'tokens/stories/motion-tokens.stories.tsx',
    ]
    for (const f of tokenStories) {
      expect(scannedFiles, `tokens 뿌리가 검사에서 빠졌다: ${f}`).toContain(f)
    }

    // 컴포지션 날짜 계열 스토리 4개는 afds-registry 로 이전됐다 — 같은 단정이
    // `packages/afds-registry/src/lib/__test__/story-determinism.test.ts` 에 있다.
    const dateStories = ['src/bricks/form/calendar/calendar.stories.tsx']
    for (const f of dateStories) {
      expect(scannedFiles, `날짜 계열 스토리가 스캔에서 빠졌다: ${f}`).toContain(f)
    }
  })

  it('렌더 시점 호출은 잡고 이벤트 핸들러 안의 호출은 잡지 않는다', () => {
    const fixture = mkdtempSync(join(tmpdir(), 'afds-story-'))
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

  // useState 지연 초기화와 useMemo 팩토리는 콜백처럼 생겼지만 **렌더 중에 실행된다**.
  // 콜백으로 분류하면 이 경로로 비결정성이 그대로 새어 들어온다.
  it('useState/useMemo 의 렌더 시점 팩토리 안도 잡는다', () => {
    const fixture = mkdtempSync(join(tmpdir(), 'afds-story-lazy-'))
    try {
      writeFileSync(
        join(fixture, 'b.stories.tsx'),
        [
          'export const A = { render: function A() {',
          '  const [d] = React.useState(() => new Date())',
          '  const m = React.useMemo(() => new Date(), [])',
          '  const onClick = () => new Date()',
          '  return <div onClick={onClick}>{String(d)}{String(m)}</div>',
          '} }',
        ].join('\n'),
      )
      const { violations: found } = findStoryDeterminismViolations(fixture)

      // useState·useMemo 두 건만 — onClick 안의 것은 여전히 제외된다.
      expect(found).toHaveLength(2)
    } finally {
      rmSync(fixture, { recursive: true, force: true })
    }
  })

  /** 픽스처를 임시 디렉토리에 쓰고 검사한 뒤 지운다. */
  const scan = (source: string) => {
    const fixture = mkdtempSync(join(tmpdir(), 'afds-story-fx-'))
    try {
      writeFileSync(join(fixture, 'x.stories.tsx'), source)
      return findStoryDeterminismViolations(fixture).violations
    } finally {
      rmSync(fixture, { recursive: true, force: true })
    }
  }

  // 핸들러 판정은 형태를 열거하지 않는다 — 함수가 묶이는 **이름**을 `on[A-Z]` 가 참조하는가로
  // 본다. 아래 셋은 전부 정상적인 코드인데 예전 판정은 위반으로 잡았다(거짓 양성).
  // 가드가 멀쩡한 코드에 시끄러우면 사람이 가드를 끄고, 그 순간 검사가 0이 된다.
  it.each([
    [
      'function 선언 핸들러',
      'export const S = { render: () => {\n' +
        '  function handleSubmit() { console.log(new Date()) }\n' +
        '  return <button onClick={handleSubmit}>x</button>\n} }',
    ],
    [
      'useCallback 로 감싼 핸들러',
      'export const S = { render: () => {\n' +
        '  const onClick = React.useCallback(() => new Date(), [])\n' +
        '  return <button onClick={onClick}>x</button>\n} }',
    ],
    [
      '객체 속성에 담은 핸들러',
      'export const S = { render: () => {\n' +
        '  const h = { onClick: () => new Date() }\n' +
        '  return <button onClick={h.onClick}>x</button>\n} }',
    ],
  ])('정상 핸들러를 위반으로 잡지 않는다 — %s', (_label, source) => {
    expect(scan(source)).toEqual([])
  })

  // 같은 계열의 **네 번째** 누락(앞선 셋: IIFE · useState · useMemo). 렌더에서도 부르고
  // 핸들러에도 넘기는 함수를, 핸들러 참조 하나만 보고 통째로 면제하고 있었다.
  // 판정을 "핸들러에 쓰이는가" 에서 **"핸들러에만 쓰이는가"** 로 바꿔서 닫았다.
  it('렌더와 핸들러에서 함께 쓰는 함수는 면제하지 않는다', () => {
    const found = scan(
      'export const S = { render: () => {\n' +
        '  const stamp = () => Date.now()\n' +
        '  return <div data-stamp={String(stamp())} onClick={stamp} />\n} }',
    )
    expect(found).toHaveLength(1)
    expect(found[0]?.expression).toBe('Date.now()')
  })

  // 위 케이스의 대조군 — 핸들러에만 쓰면 여전히 면제된다. 둘이 함께 있어야 판정이 고정된다.
  it('핸들러에만 쓰는 같은 함수는 면제된다', () => {
    expect(
      scan(
        'export const S = { render: () => {\n' +
          '  const stamp = () => Date.now()\n' +
          '  return <div onClick={stamp} />\n} }',
      ),
    ).toEqual([])
  })

  it.each([
    [
      "Date['now']() — 표기법만 바꾼 것",
      "export const S = { render: () => <div>{Date['now']()}</div> }",
    ],
    ['performance.now()', 'export const S = { render: () => <div>{performance.now()}</div> }'],
    ['crypto.randomUUID()', 'export const S = { render: () => <div>{crypto.randomUUID()}</div> }'],
    [
      'new Date(...spread) — 인자 수를 정적으로 알 수 없다',
      'export const S = { render: () => <div>{String(new Date(...xs))}</div> }',
    ],
  ])('날짜 밖의 비결정 소스도 잡는다 — %s', (_label, source) => {
    expect(scan(source)).toHaveLength(1)
  })

  // 독립 리뷰가 실행으로 찾아낸 누락 3건. 셋 다 `Date` 를 **제 이름 그대로** 쓰는데도 샜다 —
  // "못 잡는 건 이름을 지운 우회뿐" 이라는 당시 문서 주장이 사실이 아니었다.
  it.each([
    [
      'shorthand 속성을 거친 렌더 참조',
      'export const S = { render: () => {\n' +
        '  const stamp = () => Date.now()\n' +
        '  const cfg = { stamp }\n' +
        '  return <div data-x={String(cfg.stamp())} onClick={stamp} />\n} }',
    ],
    [
      'onClick={stamp()} — 값을 만들려고 렌더 중 호출',
      'export const S = { render: () => {\n' +
        '  const stamp = () => Date.now()\n' +
        '  return <div onClick={stamp()} />\n} }',
    ],
    [
      'Date() — new 없이도 현재 시각 문자열',
      'export const S = { render: () => <div>{Date()}</div> }',
    ],
  ])('이름을 지우지 않은 누락도 잡는다 — %s', (_label, source) => {
    expect(scan(source)).toHaveLength(1)
  })

  // 위 첫 케이스의 대조군 — shorthand 가 아니면 원래도 잡혔다. 둘을 함께 두어야
  // "shorthand 라서 샜다" 는 진단이 고정된다.
  it('대조군: shorthand 가 아닌 `{ stamp: stamp }` 도 잡는다', () => {
    expect(
      scan(
        'export const S = { render: () => {\n' +
          '  const stamp = () => Date.now()\n' +
          '  const cfg = { stamp: stamp }\n' +
          '  return <div data-x={String(cfg.stamp())} onClick={stamp} />\n} }',
      ),
    ).toHaveLength(1)
  })

  // 축약 메서드도 함수 경계다. 화살표만 경계로 세면 정상 핸들러가 오탐이 된다 —
  // 시끄러운 가드는 사람이 끄고, 꺼진 가드는 없는 것과 같다.
  it('축약 메서드 핸들러를 오탐하지 않는다', () => {
    expect(
      scan(
        'export const S = { render: () => {\n' +
          '  const h = { onClick() { return new Date() } }\n' +
          '  return <div onClick={h.onClick} />\n} }',
      ),
    ).toEqual([])
  })

  it('축약 메서드라도 렌더에서 호출하면 잡는다', () => {
    expect(
      scan(
        'export const S = { render: () => {\n' +
          '  const h = { onClick() { return new Date() } }\n' +
          '  return <div data-x={String(h.onClick())} onClick={h.onClick} />\n} }',
      ),
    ).toHaveLength(1)
  })

  // **알려진 한계를 테스트로 고정한다.** 통과한다고 "안전" 이라는 뜻이 아니라,
  // 이 두 경로는 못 잡는다는 사실이 문서와 어긋나지 않는지 지키는 것이다.
  // 이름을 지우는 우회는 타입체커 없이는 잡을 수 없다 — 감추지 말고 적어 둔다.
  it.each([
    [
      'Date 별칭',
      'const D = Date\nexport const S = { render: () => <div>{String(new D())}</div> }',
    ],
    ['구조분해', 'const { now } = Date\nexport const S = { render: () => <div>{now()}</div> }'],
  ])('알려진 한계: 이름을 지운 우회는 잡지 못한다 — %s', (_label, source) => {
    expect(scan(source)).toEqual([])
  })

  // `Date` 라는 이름을 파일이 직접 만들면 전역 `Date` 가 아니다 — 잡지 않는다.
  it.each([
    [
      'import 한 Date 유틸',
      "import { Date } from './date-util'\nexport const S = { render: () => <div>{Date(1)}</div> }",
    ],
    [
      '지역 const Date 섀도잉',
      'const Date = (x: number) => x\nexport const S = { render: () => <div>{Date(1)}</div> }',
    ],
  ])('섀도잉된 Date 는 오탐하지 않는다 — %s', (_label, source) => {
    expect(scan(source)).toEqual([])
  })

  // **알려진 오탐 2, 의도적으로 남긴다.** 핸들러가 한 단계 간접을 거쳐 헬퍼를 부르면
  // 그 헬퍼가 위반으로 잡힌다 — `stamp` 의 유일한 참조가 `useCallback` 인자 안이라
  // `on[A-Z]` 속성 밖이기 때문이다. 닫으려면 "핸들러에 묶인 함수 안에서만 불리는가" 를
  // **전이적으로** 따라가야 하고(재귀·순환 처리 포함), 그건 이 가드의 성격을 바꾼다.
  // 저장소에 해당 형태 0건이고 방향은 fail-closed(시끄러움)다. 사실만 고정해 둔다.
  it('알려진 오탐: useCallback 안에서 부르는 헬퍼는 위반으로 잡힌다', () => {
    expect(
      scan(
        'export const S = { render: () => {\n' +
          '  const stamp = () => Date.now()\n' +
          '  const h = React.useCallback(() => stamp(), [])\n' +
          '  return <div onClick={h} />\n} }',
      ),
    ).toHaveLength(1)
  })

  // **타입 전용 import 는 값 바인딩을 만들지 않는다** — 그 파일의 `Date()` 는 여전히 전역이다.
  // 섀도잉 면제를 넣으면서 이걸 빠뜨려 진짜 전역 호출을 조용히 삼키고 있었다(독립 리뷰가 적발).
  it.each([
    [
      'type-only import',
      "import type { Date } from './types'\nexport const S = { render: () => <div>{Date()}</div> }",
    ],
    [
      'inline type 지정자',
      "import { type Date } from './t'\nexport const S = { render: () => <div>{Date()}</div> }",
    ],
    [
      'type-only default import',
      "import type Date from './t'\nexport const S = { render: () => <div>{Date()}</div> }",
    ],
  ])('타입 전용 import 는 섀도잉이 아니다 — %s', (_label, source) => {
    expect(scan(source)).toHaveLength(1)
  })

  // 섀도잉으로 **인정하는** 선언 형태들. 분기를 지워도 통과하면 그 분기는 검증되지 않은 코드다 —
  // 실제로 `ImportClause`(default) · `FunctionDeclaration` · `ClassDeclaration` 세 분기가
  // 테스트 0건이었다(독립 리뷰가 뮤테이션으로 적발). 각각을 못 박는다.
  it.each([
    [
      'default 값 import',
      "import Date from './date-util'\nexport const S = { render: () => <div>{Date(1)}</div> }",
    ],
    [
      'function 선언',
      'function Date(x: number) { return x }\nexport const S = { render: () => <div>{Date(1)}</div> }',
    ],
    ['class 선언', 'class Date {}\nexport const S = { render: () => <div>{String(Date)}</div> }'],
  ])('값 바인딩을 만드는 선언은 섀도잉으로 인정한다 — %s', (_label, source) => {
    expect(scan(source)).toEqual([])
  })

  // **알려진 오탐 3, 의도적으로 남긴다 (CodeRabbit 지적을 기각한 건).**
  // 파라미터·구조분해로 만든 `Date` 바인딩은 섀도잉으로 인정하지 않는다 — 그래서 그 파일의
  // `Date()` 는 위반으로 잡힌다.
  //
  // 고칠 수 있지만 **방향이 반대다.** 섀도잉 면제는 이 가드에서 **유일한 fail-open 지점**이고
  // (스코프를 안 보므로 파일 어디서든 `Date` 를 가리면 진짜 전역 호출까지 함께 면제된다),
  // 인정하는 선언 형태를 늘리면 그 구멍이 그만큼 넓어진다.
  // 두 실패 모두 저장소 실사례 0건이므로, 확률이 같다면 **시끄러운 쪽(fail-closed)** 을 남긴다.
  it.each([
    [
      '함수 파라미터',
      'export const S = { render: () => { const f = (Date: any) => Date(); return <div>{f(() => 1)}</div> } }',
    ],
    [
      '객체 구조분해',
      'const { Date } = globalThis as any\nexport const S = { render: () => <div>{Date()}</div> }',
    ],
    [
      '배열 구조분해',
      'const [Date] = [] as any\nexport const S = { render: () => <div>{Date()}</div> }',
    ],
  ])('알려진 오탐: 파라미터·구조분해 Date 는 섀도잉으로 인정하지 않는다 — %s', (_label, source) => {
    expect(scan(source)).toHaveLength(1)
  })

  // **알려진 오탐, 의도적으로 남긴다.** class 메서드를 핸들러로 넘기면 위반으로 잡힌다 —
  // 메서드에서 인스턴스 변수(`c`)까지 잇는 것은 심볼 해석이 필요하고, 그것은 이 가드의
  // 비용 특성을 바꾼다. 저장소 스토리 파일에 class 선언이 **0건**이라 실현되지 않는다
  // (실측: `grep -c '^class ' --include='*.stories.tsx' src` → 0).
  // 방향도 fail-closed(시끄러움)라 조용히 놓치는 쪽이 아니다. 사실만 고정해 둔다.
  it('알려진 오탐: class 메서드 핸들러는 위반으로 잡힌다', () => {
    expect(
      scan(
        'class C { onClick() { return new Date() } }\n' +
          'export const S = { render: () => { const c = new C(); return <div onClick={c.onClick} /> } }',
      ),
    ).toHaveLength(1)
  })
})
