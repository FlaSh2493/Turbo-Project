import { describe, it, expect } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  countArbitraryTokenValues,
  findDefaultScaleClasses,
  scanArbitraryTokenValues,
  scanDefaultScaleClasses,
} from '../tailwind-arbitrary-values'

const countDefaultScaleClasses = (source: string) => findDefaultScaleClasses(source).length

describe('countArbitraryTokenValues — 문자열 단위 판정', () => {
  it('앵커 없이 섞인 클래스 문자열에서도 색·길이를 각각 센다', () => {
    // ESLint `no-restricted-syntax`(eslint.config.js:70)가 놓치는 정확히 이 형태 —
    // 리터럴 전체가 아니라 클래스 문자열 일부에 임의 값이 섞여 있다.
    expect(countArbitraryTokenValues("className='text-[#FF5733] w-[137px]'")).toBe(2)
  })

  it('hex 3·6·8자리 · rgb/rgba/hsl 함수 호출을 색으로 센다', () => {
    expect(countArbitraryTokenValues('bg-[#fff]')).toBe(1)
    expect(countArbitraryTokenValues('bg-[#112233]')).toBe(1)
    expect(countArbitraryTokenValues('bg-[#11223344]')).toBe(1)
    expect(countArbitraryTokenValues('bg-[rgba(0,0,0,0.5)]')).toBe(1)
    expect(countArbitraryTokenValues('text-[hsl(0,0%,0%)]')).toBe(1)
  })

  it('px·rem 리터럴(음수 포함)을 길이로 센다', () => {
    expect(countArbitraryTokenValues('w-[137px]')).toBe(1)
    expect(countArbitraryTokenValues('p-[2.5rem]')).toBe(1)
    expect(countArbitraryTokenValues('top-[-8px]')).toBe(1)
  })

  it('var() 로만 이뤄진 브래킷은 fallback 에 raw 값이 있어도 토큰 참조라 세지 않는다', () => {
    expect(countArbitraryTokenValues('bg-[var(--afds-color-bg-surface)]')).toBe(0)
    // fallback 의 raw 길이(10px)도 소비는 토큰이 우선이므로 0건으로 통일한다.
    expect(countArbitraryTokenValues('w-[var(--x,10px)]')).toBe(0)
    // fallback 안에 중첩 괄호(calc)가 있어도 괄호 깊이로 var() 를 끝까지 걷어낸다.
    expect(countArbitraryTokenValues('w-[var(--x,calc(1px+2px))]')).toBe(0)
    // var() 여럿뿐이면 걷어내고 남는 게 없어 0건이다.
    expect(countArbitraryTokenValues('w-[var(--a)_var(--b)]')).toBe(0)
  })

  it('var() 뒤에 raw 값이 남으면 var() 만 걷어내고 그 값은 그대로 센다', () => {
    // CodeRabbit 지적 — `PURE_VAR_RE`(브래킷이 `var(` 로 "시작"하는지만 봄)는
    // var() 뒤에 이어지는 raw 값을 통째로 놓쳤다.
    expect(countArbitraryTokenValues('p-[var(--x)_137px]')).toBe(1)
    expect(countArbitraryTokenValues('shadow-[var(--s)_0_0_1px_#fff]')).toBe(1)
  })

  it('calc() 는 통째로 제외하지 않는다 — 안의 raw 색·길이를 그대로 센다', () => {
    // 예전에는 `calc(` 로 시작하면 안을 통째로 건너뛰어 이 케이스가 0건으로 샜다.
    expect(countArbitraryTokenValues('w-[calc(137px)]')).toBe(1)
    // raw 길이가 없고 var() 참조뿐이면 여전히 0건이다(계산식 자체가 토큰만 쓴다).
    expect(countArbitraryTokenValues('w-[calc(100%-var(--x))]')).toBe(0)
    // 실재 사례: packages/afds/src/bricks/overlay/drawer/drawer.style.ts
    expect(countArbitraryTokenValues('h-[calc(100dvh-100px)]')).toBe(1)
  })

  it('브래킷 내용이 언더스코어(Tailwind 의 공백 표기)로 이어져도 경계를 놓치지 않는다', () => {
    // \b 는 언더스코어를 단어 문자로 봐서 `4px` 뒤 `_` 에서 경계를 못 잡던 버그.
    expect(countArbitraryTokenValues('m-[4px_auto]')).toBe(1)
    expect(countArbitraryTokenValues('border-[1px_solid]')).toBe(1)
    expect(countArbitraryTokenValues('shadow-[0_0_0_1px_var(--x)]')).toBe(1)
    expect(countArbitraryTokenValues('ring-[#fff_inset]')).toBe(1)
  })

  it('숫자·색이 섞인 shorthand 브래킷 하나는 1건이다 (하위 토큰별 중복 계산 금지)', () => {
    // 실재 사례: packages/afds-registry/src/compositions/base-table/table.style.ts
    expect(countArbitraryTokenValues('shadow-[4px_0_6px_-2px_rgba(0,0,0,0.08)]')).toBe(1)
  })

  it('AFDS 시맨틱 토큰 클래스는 임의 값이 아니므로 세지 않는다', () => {
    expect(countArbitraryTokenValues('bg-afds-bg-surface text-afds-text-primary')).toBe(0)
  })

  it('color-mix() 처럼 지원 함수 밖의 임의 값은 세지 않는다 (색·길이 패턴 밖)', () => {
    // 실재 사례: packages/afds/src/bricks/action/button/button.style.ts:8
    expect(
      countArbitraryTokenValues('-[color-mix(in_srgb,var(--afds-color-brand-700),black_3%)]'),
    ).toBe(0)
  })

  it('한 문자열의 여러 브래킷을 모두 센다', () => {
    expect(
      countArbitraryTokenValues('className="text-[#FF5733] bg-[rgba(0,0,0,0.5)] p-afds-spacing-8"'),
    ).toBe(2)
  })
})

describe('countDefaultScaleClasses — Tailwind 기본 팔레트·spacing·radius', () => {
  it('기본 팔레트를 센다 — opacity 접미사 · variant 접두 포함', () => {
    expect(countDefaultScaleClasses("'text-red-500 bg-gray-100'")).toBe(2)
    expect(countDefaultScaleClasses("'bg-gray-100/50'")).toBe(1)
    expect(countDefaultScaleClasses("'hover:border-t-slate-950 ring-offset-sky-50'")).toBe(2)
  })

  it('white/black · AFDS 팔레트 토큰은 팔레트로 세지 않는다', () => {
    expect(countDefaultScaleClasses("'text-white bg-black'")).toBe(0)
    expect(countDefaultScaleClasses("'bg-afds-gray-700 stroke-afds-gray-200'")).toBe(0)
  })

  it('기본 spacing 을 센다 — 음수 · 소수 · variant 접두 포함', () => {
    expect(countDefaultScaleClasses("'p-4 mt-2'")).toBe(2)
    expect(countDefaultScaleClasses("'-mt-2'")).toBe(1)
    expect(countDefaultScaleClasses("'gap-2.5 space-x-4'")).toBe(2)
    expect(countDefaultScaleClasses("'hover:p-4 md:gap-x-1'")).toBe(2)
    expect(countDefaultScaleClasses("'p-0.5'")).toBe(1)
  })

  it('값 0 · 분수 위치 · AFDS spacing 토큰 · w/h 는 세지 않는다', () => {
    // 리셋은 디자인 값이 아니다.
    expect(countDefaultScaleClasses("'m-0 inset-0 -mt-0'")).toBe(0)
    // left-1/2 는 50% 위치다 — spacing 척도가 아니다.
    expect(countDefaultScaleClasses("'left-1/2 top-1/2'")).toBe(0)
    expect(countDefaultScaleClasses("'p-afds-spacing-20 gap-afds-spacing-8'")).toBe(0)
    expect(countDefaultScaleClasses("'w-4 h-2 size-6'")).toBe(0)
  })

  it('기본 radius 를 센다 — 맨 rounded 와 모서리 방향 포함', () => {
    expect(countDefaultScaleClasses("'rounded-lg'")).toBe(1)
    expect(countDefaultScaleClasses("'rounded'")).toBe(1)
    expect(countDefaultScaleClasses("'rounded-tl-md rounded-l-lg'")).toBe(2)
  })

  it('rounded-full · rounded-none · AFDS radius 토큰은 세지 않는다', () => {
    expect(countDefaultScaleClasses("'rounded-full rounded-none'")).toBe(0)
    expect(countDefaultScaleClasses("'rounded-afds-md rounded-l-afds-pill'")).toBe(0)
  })

  it('클래스 토큰 경계 밖은 세지 않는다 — 단어 일부 · 식별자 뒤 문자', () => {
    expect(countDefaultScaleClasses("'xp-4 top-2x'")).toBe(0)
    expect(countDefaultScaleClasses('rounded: true, rounded?: boolean')).toBe(0)
  })
})

describe('findDefaultScaleClasses — 위치', () => {
  it('줄 번호(1부터)와 클래스를 돌려준다', () => {
    expect(
      findDefaultScaleClasses("const a = 1\nclassName='text-gray-500 p-4 rounded-lg'"),
    ).toEqual([
      { line: 2, className: 'text-gray-500' },
      { line: 2, className: 'p-4' },
      { line: 2, className: 'rounded-lg' },
    ])
  })

  it('임의 값은 이 탐지에 섞지 않는다 — 래칫 몫이다', () => {
    expect(countDefaultScaleClasses("'w-[137px] text-[#fff]'")).toBe(0)
  })

  it('주석 줄(//·/*·*)은 세지 않는다', () => {
    // 실재 사례: packages/afds/src/bricks/feedback/toast/toast.style.ts
    expect(countDefaultScaleClasses('  // py-3 (12px): afds-spacing-12 토큰 미정의')).toBe(0)
    expect(countDefaultScaleClasses('/* p-4 rounded-lg */')).toBe(0)
    expect(countDefaultScaleClasses('   * text-gray-500 는 쓰지 않는다')).toBe(0)
  })

  it('*: 로 시작하는 줄은 자식 variant 라 주석으로 보지 않는다', () => {
    expect(findDefaultScaleClasses("const a = 1\n  *:p-4 rounded-lg'")).toEqual([
      { line: 2, className: 'p-4' },
      { line: 2, className: 'rounded-lg' },
    ])
  })
})

describe('scanArbitraryTokenValues — 트리 순회', () => {
  function withFixtureTree(build: (root: string) => void, run: (root: string) => void): void {
    const root = mkdtempSync(join(tmpdir(), 'arbitrary-token-fixture-'))
    try {
      build(root)
      run(root)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  }

  it('코드 파일만 세고 스토리·테스트·__test__ 디렉터리는 제외한다', () => {
    withFixtureTree(
      root => {
        writeFileSync(join(root, 'a.tsx'), "className='text-[#FF5733]'")
        writeFileSync(join(root, 'a.stories.tsx'), "className='text-[#FF5733] w-[1px]'")
        writeFileSync(join(root, 'a.test.tsx'), "className='text-[#FF5733] w-[1px]'")
        writeFileSync(join(root, 'clean.tsx'), "className='bg-afds-bg-surface'")
        mkdirSync(join(root, '__test__'))
        writeFileSync(join(root, '__test__', 'b.tsx'), "className='w-[137px]'")
      },
      root => {
        const { counts, filesScanned } = scanArbitraryTokenValues(root)
        expect(counts).toEqual({ 'a.tsx': 1 })
        // `isImportScannableFile` 이 .stories./.test. 를 이미 걸러 코드 파일 취급조차 안 한다 —
        // a.tsx · clean.tsx 2개만 "훑은 파일" 이다(__test__ 안의 b.tsx 도 디렉터리 단계에서 제외).
        expect(filesScanned).toBe(2)
      },
    )
  })

  it('하위 디렉터리를 재귀적으로 순회하고 상대 경로를 키로 쓴다', () => {
    withFixtureTree(
      root => {
        mkdirSync(join(root, 'nested'), { recursive: true })
        writeFileSync(join(root, 'nested', 'deep.ts'), "'w-[10px] w-[20px]'")
      },
      root => {
        const { counts } = scanArbitraryTokenValues(root)
        expect(counts).toEqual({ 'nested/deep.ts': 2 })
      },
    )
  })

  it('scanDefaultScaleClasses 도 같은 제외 기준을 쓰고 상대 경로를 붙인다', () => {
    withFixtureTree(
      root => {
        writeFileSync(join(root, 'a.tsx'), "className='p-4'")
        writeFileSync(join(root, 'a.stories.tsx'), "className='p-4'")
        mkdirSync(join(root, '__test__'))
        writeFileSync(join(root, '__test__', 'b.tsx'), "className='p-4'")
      },
      root => {
        expect(scanDefaultScaleClasses(root)).toEqual({
          matches: [{ file: 'a.tsx', line: 1, className: 'p-4' }],
          filesScanned: 1,
        })
      },
    )
  })

  it('빈 디렉터리는 0파일·빈 결과를 낸다 — 조용히 통과가 아니라 분모로 드러난다', () => {
    withFixtureTree(
      () => {},
      root => {
        const { counts, filesScanned } = scanArbitraryTokenValues(root)
        expect(counts).toEqual({})
        expect(filesScanned).toBe(0)
      },
    )
  })
})
