import { describe, it, expect } from 'vitest'
import { classifyPathCitation, extractPathCitations, type PathProbe } from '../lib/path-citation'

/**
 * 경로 인용 분류의 **분기 순서**를 고정한다.
 *
 * **왜 필요한가.** 이 판정의 정확성은 순서에 있다. PR #205 가 「경로 모호」를 `repoScoped`
 * 판정보다 **앞**에 둬서, 소비처가 자기 도구 설정을 가리키는 인용이 「모호」로 실패했다 —
 * 실측: `packages/afds-registry/README.md:87` 이 소비자에게 자기 `vite.config.ts` 의
 * `resolve.alias` 를 설정하라고 안내하는데 우리 저장소에 무관한 `vite.config.ts` 가 2개 있다.
 * PR #213 이 순서를 고쳤고 이 픽스처가 그것을 못박는다.
 *
 * 순서는 조각으로 나누면 고정되지 않으므로 판정이 함수 하나다.
 */
describe('classifyPathCitation', () => {
  /** 아무것도 해소되지 않고 범위 밖인 기본 상태 — 각 테스트가 필요한 것만 켠다. */
  const base: PathProbe = {
    existsInSearchRoots: false,
    basenameHits: 0,
    suffixHits: [],
    onRef: false,
    hasRefs: false,
    repoScoped: false,
  }

  it('대조군 — 네 해소 경로가 각각 어느 단계에서 해소됐는지 말한다', () => {
    // `via` 가 없으면 순서 회귀를 「해소됐다」로만 보고 지나친다.
    expect(classifyPathCitation('a/b.ts', { ...base, existsInSearchRoots: true })).toEqual({
      kind: 'resolved',
      via: 'search-roots',
    })
    expect(classifyPathCitation('b.ts', { ...base, basenameHits: 1 })).toEqual({
      kind: 'resolved',
      via: 'basename',
    })
    expect(classifyPathCitation('x/b.ts', { ...base, suffixHits: ['p/x/b.ts'] })).toEqual({
      kind: 'resolved',
      via: 'suffix',
    })
    expect(classifyPathCitation('a/b.ts', { ...base, onRef: true })).toEqual({
      kind: 'resolved',
      via: 'ref',
    })
  })

  it('★ 소비처 파일 인용은 모호 실패로 가지 않는다 (#213 이 고친 회귀)', () => {
    // `vite.config.ts` 의 형태 — 저장소에 무관한 동명 파일이 2개 있고 범위 밖이다.
    // 「디렉터리를 한 칸 더 붙여라」는 소비자에게 우리 저장소 경로를 붙이라는 틀린 안내다.
    const verdict = classifyPathCitation('vite.config.ts', {
      ...base,
      suffixHits: [
        'apps/storybook/vite.config.ts',
        'packages/figma-variables-exporter/vite.config.ts',
      ],
      repoScoped: false,
    })
    expect(verdict).toEqual({ kind: 'consumer-unverified' })
  })

  it('★ 저장소 내부 주장의 모호는 실패다 — 붙일 디렉터리를 안내한다', () => {
    const verdict = classifyPathCitation('packages/afds/index.ts', {
      ...base,
      suffixHits: ['packages/afds/src/index.ts', 'packages/afds-registry/src/index.ts'],
      repoScoped: true,
    })
    expect(verdict).toEqual({
      kind: 'ambiguous',
      hits: ['packages/afds/src/index.ts', 'packages/afds-registry/src/index.ts'],
    })
  })

  it('★ 범위 밖은 미검증이다 — 실패가 아니다', () => {
    // 뭉개면 저장소 밖을 가리키는 인용이 전부 실패로 나온다. 소비처 대조 모드를 걷어낸
    // 뒤로 이 갈림이 유일한 출구다 — `consumer-missing` 은 도달할 수 없어 없앴다.
    expect(classifyPathCitation('src/whatever.ts', base)).toEqual({
      kind: 'consumer-unverified',
    })
  })

  it('저장소 내부 주장은 미확인(실패)이다 — 범위 밖과 갈린다', () => {
    expect(classifyPathCitation('packages/afds/nope.ts', { ...base, repoScoped: true })).toEqual({
      kind: 'missing',
    })
  })

  it('★ 기준 ref 를 읽을 수 없는 것과 없는 것을 구분한다', () => {
    // `false` 로 뭉개면 shallow clone 에서 **없는 파일로 오판**해 거짓 실패가 난다.
    expect(
      classifyPathCitation('a/b.ts', { ...base, onRef: null, hasRefs: true, repoScoped: true }),
    ).toEqual({ kind: 'ref-unverifiable' })
    // ref 가 설정돼 있지 않으면 조회 불가가 아니라 그냥 다음 단계로 간다.
    expect(
      classifyPathCitation('a/b.ts', { ...base, onRef: null, hasRefs: false, repoScoped: true }),
    ).toEqual({ kind: 'missing' })
  })

  it('basename 해소는 디렉터리 구분자가 없는 약칭에만 적용된다', () => {
    // 구분자가 있는 인용에 basename 을 쓰면 엉뚱한 파일이 해소된다.
    expect(classifyPathCitation('x/b.ts', { ...base, basenameHits: 3, repoScoped: true })).toEqual({
      kind: 'missing',
    })
    expect(classifyPathCitation('b.ts', { ...base, basenameHits: 3 })).toEqual({
      kind: 'resolved',
      via: 'basename',
    })
  })

  it('접미사는 정확히 1건일 때만 해소한다', () => {
    expect(classifyPathCitation('x/b.ts', { ...base, suffixHits: ['p/x/b.ts'] })).toEqual({
      kind: 'resolved',
      via: 'suffix',
    })
    // 2건이면 해소가 아니다 — 저장소 내부면 모호, 범위 밖이면 소비처 분류다(위 두 테스트).
    expect(
      classifyPathCitation('x/b.ts', { ...base, suffixHits: ['a/x/b.ts', 'c/x/b.ts'] }).kind,
    ).not.toBe('resolved')
  })

  it('★ 해소 단계의 우선순위 — 워크트리 > basename > 접미사 > ref', () => {
    // **접미사를 1건으로 둬야 이 단정이 무는다.** 처음에 2건으로 썼더니 「접미사를 워크트리
    // 앞으로 옮기는」 돌연변이를 잡지 못했다 — 2건이면 접미사 분기가 애초에 발동하지 않아
    // 순서를 바꿔도 결과가 같았다. 각 단계가 **실제로 답할 수 있는 상태**로 만들어야 한다.
    const all = {
      ...base,
      existsInSearchRoots: true,
      basenameHits: 1,
      suffixHits: ['p/x/b.ts'],
      onRef: true,
      repoScoped: true,
    }
    expect(classifyPathCitation('b.ts', all)).toEqual({ kind: 'resolved', via: 'search-roots' })
    // 앞 단계를 하나씩 끄면 다음 단계가 답한다.
    expect(classifyPathCitation('b.ts', { ...all, existsInSearchRoots: false })).toEqual({
      kind: 'resolved',
      via: 'basename',
    })
    expect(
      classifyPathCitation('b.ts', { ...all, existsInSearchRoots: false, basenameHits: 0 }),
    ).toEqual({ kind: 'resolved', via: 'suffix' })
    expect(
      classifyPathCitation('b.ts', {
        ...all,
        existsInSearchRoots: false,
        basenameHits: 0,
        suffixHits: [],
      }),
    ).toEqual({ kind: 'resolved', via: 'ref' })
  })
})

/**
 * **파일 경로 후보 추출**을 고정한다 — 특히 자리표시자 건너뛰기.
 *
 * **왜 필요한가.** 문서는 규약을 설명할 때 틀을 인용한다
 * (`src/bricks/<category>/<name>/<name>.spec.md`). 실재 경로로 검사하면 **영구 거짓 양성**이다.
 * 실측(#214): 그 형태가 미등록 문서의 CI 모드 실패 1건이었고, `<Component>/index.tsx` 는
 * `notPaths` 에 **손으로** 등재돼 있었다.
 *
 * **입력을 「그 분기가 실제로 발동하는」 형태로 쓴다.** 앞선 라운드에서 우선순위 픽스처가
 * `suffixHits` 를 2건으로 써서 대상 분기가 발동하지 않았고, 돌연변이를 잡지 못했다. 여기서는
 * 자리표시자 입력이 **확장자 필터를 통과해** 자리표시자 분기까지 도달해야 한다 — 그래서
 * 아래 입력은 모두 `.ts`·`.md` 로 끝난다.
 */
describe('extractPathCitations', () => {
  it('대조군 — 실재 경로 형태를 뽑고, `파일:줄` 의 줄은 뗀다', () => {
    // **하이픈이 든 실제 형태를 반드시 넣는다.** 처음에는 `a/b.ts` 류만 써서, 자리표시자
    // 규칙을 `[<>-]` 로 과차단하는 돌연변이를 **잡지 못했다** — 이 저장소의 경로는 대부분
    // 하이픈을 포함한다(`base-tooltip.tsx` · `overflow-tooltip.tsx`). 대조군은 **대표성**이
    // 있어야 과차단을 잡는다.
    expect(
      extractPathCitations(
        '`packages/afds/src/index.ts` 와 `bricks/button/button.spec.md:12` 를 보라',
      ),
    ).toEqual(['packages/afds/src/index.ts', 'bricks/button/button.spec.md'])
    expect(
      extractPathCitations(
        '`packages/afds-registry/src/compositions/base-tooltip/base-tooltip.tsx` 와 `range-filter/index.ts`',
      ),
    ).toEqual([
      'packages/afds-registry/src/compositions/base-tooltip/base-tooltip.tsx',
      'range-filter/index.ts',
    ])
  })

  it('★ 꺾쇠 자리표시자를 건너뛴다 — 확장자 필터를 통과하는 입력으로 확인한다', () => {
    // 이 셋은 모두 `.md`·`.ts` 로 끝나므로 확장자 필터를 통과한다. 즉 건너뛴 이유가
    // **자리표시자 규칙**이지 확장자 필터가 아니다.
    for (const t of [
      'src/bricks/<category>/<name>/<name>.spec.md',
      '<name>.schema.ts',
      '<composition>/hooks/x.ts',
      '<Component>/index.tsx',
      // **양쪽 꺾쇠를 각각만 가진 형태를 모두 넣는다.** 위 넷은 전부 짝 꺾쇠라
      // `[<>]` 를 `[<]` 로 좁히는 돌연변이가 **생존했다**(독립 리뷰 적발) — `<` 만 봐도
      // 넷 다 걸리기 때문이다. 그리고 `>` 쪽만 추가했더니 이번엔 `[>]` 로 좁히는 돌연변이가
      // **생존했다** — 같은 비대칭이 거울처럼 다시 났다. 두 방향 다 필요하다.
      'foo>bar.ts',
      'name>.spec.md',
      'foo<bar.ts',
      '<name.spec.md',
    ]) {
      expect(extractPathCitations(`규약은 \`${t}\` 다`), t).toEqual([])
    }
  })

  it('★ 자리표시자는 건너뛰고 **같은 문서의 실재 경로는 검사한다**', () => {
    const doc = [
      '| 컴포넌트 스펙 | `src/bricks/<category>/<name>/<name>.spec.md` | 사용 규칙 |',
      '실제 파일은 `packages/afds/src/bricks/action/button/button.spec.md` 다.',
    ].join('\n')
    expect(extractPathCitations(doc)).toEqual([
      'packages/afds/src/bricks/action/button/button.spec.md',
    ])
  })

  it('글롭은 건너뛴다 (기존 규칙 — 함께 고정한다)', () => {
    expect(extractPathCitations('`*.spec.md` 규약')).toEqual([])
    expect(extractPathCitations('`src/**/*.ts` 글롭')).toEqual([])
  })

  it('확장자로 끝나지 않으면 애초에 후보가 아니다 — 자리표시자 규칙과 무관하다', () => {
    // **꺾쇠가 없는 입력을 반드시 함께 넣는다.** 처음에는 JSX 인용만 써서, 확장자 필터를
    // 제거하는 돌연변이를 **잡지 못했다** — 그 입력들은 꺾쇠가 있어 자리표시자 규칙이
    // 대신 걸러 버렸다. 두 규칙을 갈라 보려면 **각각만 걸리는 입력**이 필요하다.
    for (const t of ['pnpm build', 'TooltipProps', 'resolve.alias', 'packages/afds']) {
      expect(extractPathCitations(`\`${t}\``), t).toEqual([])
    }
    // JSX·HTML 인용 70여 건은 확장자 필터에서 이미 걸린다(자리표시자 규칙 없이도).
    for (const t of [
      '<a>',
      '<AfdsScope>',
      '<Select.Trigger render={<button/>} />',
      '--diff <파일경로>',
    ]) {
      expect(extractPathCitations(`\`${t}\``), t).toEqual([])
    }
  })

  it('확장자 조각 단독은 후보가 아니다', () => {
    expect(extractPathCitations('`.ts` · `.tsx` · `.d.ts`')).toEqual([])
  })

  it('같은 경로를 여러 번 인용해도 한 번만 돌려준다', () => {
    expect(extractPathCitations('`a/b.ts` 그리고 다시 `a/b.ts` 와 `a/b.ts:9`')).toEqual(['a/b.ts'])
  })
})
