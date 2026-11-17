import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as React from 'react'
import { ScrollArea } from '../scroll-area'

/**
 * **세로 스크롤바가 콘텐츠를 덮던 결함**(upstream #675 계열, 소비처 갭 G5).
 *
 * 소비처 브라우저 실측: 폭 200px 목록에서 스크롤바 x=183~200, 체크박스 x=184~200 —
 * 17px 전부 겹쳐 조작 불가. 우회는 `contentClassName="pr-[17px]"` 였다.
 *
 * ⚠️ **이 테스트가 재는 것과 재지 못하는 것**
 * 재는 것: `data-has-overflow-y` 속성이 거터 클래스를 구동하는가.
 * 재지 못하는 것: **픽셀 겹침이 실제로 해소되는가.** jsdom 은 레이아웃을 계산하지 않으므로
 * 좌표를 판정할 수 없다. 겹침 해소는 브라우저에서만 확인되고 Chromatic 쿼터가 없어 미검증이다.
 * 두 층을 섞으면 "테스트가 통과했으니 겹침이 해소됐다" 가 된다 — 그렇게 읽지 마라.
 */

/** jsdom 은 레이아웃을 계산하지 않는다(scrollHeight/clientHeight 가 0). 수치를 직접 넣는다. */
const fakeMetrics = (scrollHeight: number, clientHeight: number) => {
  const vp = document.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement
  for (const [k, v] of [
    ['scrollHeight', scrollHeight],
    ['clientHeight', clientHeight],
    ['scrollWidth', 200],
    ['clientWidth', 200],
  ] as const) {
    Object.defineProperty(vp, k, { configurable: true, value: v })
  }
  vp.dispatchEvent(new Event('scroll', { bubbles: true }))
  window.dispatchEvent(new Event('resize'))
}

const content = () => document.querySelector('[data-slot="scroll-area-content"]') as HTMLElement
const settle = () => new Promise(r => setTimeout(r, 120))

describe('ScrollArea 스크롤바 거터', () => {
  it('오버플로가 있으면 콘텐츠가 거터를 예약한다', async () => {
    render(
      <ScrollArea style={{ height: 100 }}>
        <div>내용</div>
      </ScrollArea>,
    )
    fakeMetrics(2000, 100)
    await settle()
    expect(content()).toHaveAttribute('data-has-overflow-y')
    // 조건은 변수에, 폭 소비는 투명 border 에 — 두 고리가 다 있어야 거터가 선다.
    expect(content().className).toContain(
      'data-[has-overflow-y]:[--scroll-area-gutter:var(--scrollbar-track-size)]',
    )
    expect(content().className).toContain(
      '[border-right:var(--scroll-area-gutter)_solid_transparent]',
    )
  })

  // **음성 대조.** 평범한 jsdom 의 "속성 없음" 은 근거가 될 수 없다 — 레이아웃이 계산되지
  // 않아서일 수도 있기 때문이다(실제로 그랬다: scrollHeight/clientHeight 가 0 0).
  // 같은 방식으로 수치를 넣되 **오버플로만 없게** 해야 조건 하나로 좁혀진다.
  it('오버플로가 없으면 속성이 붙지 않는다 (거터도 적용되지 않는다)', async () => {
    render(
      <ScrollArea style={{ height: 100 }}>
        <div>내용</div>
      </ScrollArea>,
    )
    fakeMetrics(100, 100)
    await settle()
    expect(content()).not.toHaveAttribute('data-has-overflow-y')
  })

  // `hideVertical={!isHovered}` 로 hover-reveal 하는 사용처가 있다(소비처 `WeekGrid:173`).
  // 거터를 **가시성**에 걸면 hover 마다 17px 이 생겼다 사라져 콘텐츠가 리플로우한다.
  // 오버플로에 걸었으므로 hide 여부와 무관하게 콘텐츠 클래스가 같아야 한다.
  it('hideVertical 을 토글해도 콘텐츠 거터가 변하지 않는다 (hover-reveal 리플로우 방지)', async () => {
    const { rerender } = render(
      <ScrollArea style={{ height: 100 }} hideVertical={false}>
        <div>내용</div>
      </ScrollArea>,
    )
    fakeMetrics(2000, 100)
    await settle()
    const shown = content().className

    rerender(
      <ScrollArea style={{ height: 100 }} hideVertical>
        <div>내용</div>
      </ScrollArea>,
    )
    fakeMetrics(2000, 100)
    await settle()

    expect(content().className, 'hide 토글이 콘텐츠 거터를 바꿨다').toBe(shown)
  })

  // **네이티브 스크롤바 억제.** base-ui 는 Viewport 에 `overflow: scroll` 을 주면서 CSS 를
  // 배포하지 않는다(패키지 내 `.css` 0개). 억제가 없으면 클래식 스크롤바 플랫폼에서
  // 네이티브+커스텀이 둘 다 뜨고, 네이티브가 폭을 예약해 **올바른 거터 폭이 플랫폼마다 달라진다.**
  // 즉 이 억제는 위 거터 규칙의 **선행조건**이다.
  //
  // ⚠️ **jsdom 이 볼 수 있는 한계**: 실제 스크롤바를 렌더하지도, CSS 를 적용하지도 않는다.
  // 그래서 단정할 수 있는 것은 **선언의 존재**까지다 — "네이티브 바가 실제로 사라졌는가" 는
  // 브라우저에서만 확인되고 지금 미검증이다. 그럼에도 이 단정을 두는 이유는, 선언이 통째로
  // 사라지는 회귀(누가 className 을 갈아끼우는 것)를 잡기 때문이다.
  it('Viewport 가 네이티브 스크롤바 억제 선언을 갖는다 (선언 존재까지만 검증)', () => {
    render(
      <ScrollArea style={{ height: 100 }}>
        <div>내용</div>
      </ScrollArea>,
    )
    const vp = document.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement
    expect(vp, 'Viewport 가 없다').not.toBeNull()
    expect(vp.className, 'Firefox 계열 억제 선언이 없다').toContain('[scrollbar-width:none]')
    expect(vp.className, 'WebKit 계열 억제 선언이 없다').toContain('[&::-webkit-scrollbar]:hidden')
  })

  // 정의가 하나라는 것이 이 설계의 전부다. 둘이 되면 소비처가 또 `pr-[17px]` 를 적는다.
  // upstream #136 이후 기본값은 `verticalTrackSizeOverride ?? '17px'` 형태의 fallback 식이
  // 됐다 — 콜론 뒤에 순수 리터럴이 아니라 표현식이 오므로 정규식은 콜론과 `'17px'` 사이에
  // 따옴표가 아닌 임의 문자(fallback 변수·`??`)를 허용해야 한다. 그래도 **같은 줄에 두 번째
  // px 리터럴이 있으면 여전히 걸린다** — 검증하는 불변조건은 바뀌지 않았다.
  it('17px 정의가 컴포넌트에 정확히 한 곳만 있다', () => {
    const dir = dirname(fileURLToPath(import.meta.url))
    const src = readFileSync(join(dir, '..', 'scroll-area.tsx'), 'utf8')
    const style = readFileSync(join(dir, '..', 'scroll-area.style.ts'), 'utf8')

    const defs = [...src.matchAll(/'--scrollbar-track-size':[^'\n]*'(\d+px)'/g)]
    expect(
      defs.map(m => m[1]),
      '--scrollbar-track-size 정의가 하나가 아니다',
    ).toEqual(['17px'])

    // 소비는 변수를 통해야 한다 — 스타일에 17px 리터럴이 있으면 두 번째 정의다.
    expect(style).not.toMatch(/17px/)
    expect(style, '스크롤바 폭이 변수를 소비하지 않는다').toContain('var(--scrollbar-track-size)')
  })

  // 변수를 Root 로 올렸다. 올린 것이 Scrollbar 쪽 소비를 깨뜨리면 안 된다.
  it('변수는 Root 에 정의되고 Scrollbar 는 그것을 상속한다', async () => {
    render(
      <ScrollArea style={{ height: 100 }}>
        <div>내용</div>
      </ScrollArea>,
    )
    // 오버플로가 없으면 base-ui 가 스크롤바를 **아예 렌더하지 않는다**(소비처 실측 `barCount: 0`).
    // 상속을 확인하려면 바가 존재해야 하므로 수치를 먼저 넣는다.
    fakeMetrics(2000, 100)
    await settle()

    const root = document.querySelector('[data-slot="scroll-area"]') as HTMLElement
    expect(root.style.getPropertyValue('--scrollbar-track-size')).toBe('17px')

    const bar = document.querySelector('[data-slot="scroll-area-scrollbar"]') as HTMLElement
    expect(bar, '스크롤바가 렌더되지 않았다').not.toBeNull()
    // 스크롤바 자신은 정의하지 않는다(정의가 둘이 되면 안 된다) — 상속으로 받는다.
    expect(bar.style.getPropertyValue('--scrollbar-track-size')).toBe('')
    expect(bar.className, '스크롤바가 변수로 폭을 잡지 않는다').toContain(
      'var(--scrollbar-track-size)',
    )
  })

  /**
   * **upstream #136** — `scrollBarVerticalStyle` 로 트랙 폭을 재정의하면 세로 Scrollbar 의
   * 실제 폭과 Content 거터 폭이 달라지던 결함. 재정의가 Scrollbar 자신의 인라인 style 로만
   * 들어가 Root 의 단일 정의(위 테스트가 지키는 그 정의)를 건드리지 못했던 것이 원인이다.
   * `CustomScrollBar` 스토리(`scroll-area.stories.tsx`)가 8px 재정의로 이미 이 결함을 겪는다.
   *
   * ⚠️ **이 테스트가 재는 것과 재지 못하는 것**
   * 재는 것: Root 의 정의값과 Scrollbar 자신의 정의 유무 — 재정의가 **Root 한 곳**으로만
   * 흘러 Scrollbar 는 여전히 독자 정의를 갖지 않는가.
   * 재지 못하는 것: 실제 렌더된 트랙의 픽셀 폭과 Content 거터의 픽셀 폭이 브라우저에서
   * 같은 자리를 차지하는가 — jsdom 은 좌표를 계산하지 않는다. "겹침이 해소됐다" 는 뜻이 아니다.
   */
  it.each(['8px', '24px'])(
    '%s 로 재정의해도 Root 정의값만 바뀌고 Scrollbar 는 여전히 독자 정의를 갖지 않는다',
    async trackSize => {
      render(
        <ScrollArea
          style={{ height: 100 }}
          scrollBarVerticalStyle={{ '--scrollbar-track-size': trackSize } as React.CSSProperties}
        >
          <div>내용</div>
        </ScrollArea>,
      )
      fakeMetrics(2000, 100)
      await settle()

      const root = document.querySelector('[data-slot="scroll-area"]') as HTMLElement
      // Content 가 이 값을 `--scroll-area-gutter` 로 넘기고 그것이 border 폭이 된다 — 재정의가
      // 여기 반영되지 않으면 거터는 여전히 기본 17px 이다(결함 재현 시 실패 지점).
      expect(
        root.style.getPropertyValue('--scrollbar-track-size'),
        'Root 가 재정의를 못 받았다',
      ).toBe(trackSize)

      const bar = document.querySelector('[data-slot="scroll-area-scrollbar"]') as HTMLElement
      expect(bar, '스크롤바가 렌더되지 않았다').not.toBeNull()
      // 결함 상태에서는 여기가 정확히 이 값(예: '8px')이 된다 — 재정의가 Scrollbar 자신의
      // style 로만 들어가 Root 와 별개의 두 번째 정의가 생겼기 때문. 빈 문자열이어야
      // Scrollbar 가 Root 의 값을 그대로 상속한다는 뜻이 된다(같은 값을 보는 유일한 방법).
      expect(
        bar.style.getPropertyValue('--scrollbar-track-size'),
        'Scrollbar 가 독자적으로 재정의해 Root 와 분리됐다',
      ).toBe('')
    },
  )
})

/**
 * **upstream #244** — 거터가 Content 의 `padding-right` 였을 때 생긴 결함 둘.
 * ① 전체폭 요소(테이블 헤더 배경·행 구분선)가 트랙 폭만큼 잘렸다.
 * ② `contentClassName` 의 좌우 패딩이 조용히 트랙 폭으로 덮였다.
 *
 * 예약을 **패딩에서 투명 border 로** 옮겨 고쳤다. border 는 소비처의 `p-*` 와 다른 속성이라
 * 경쟁하지 않고, `box-sizing: border-box` 라 예약 동작은 패딩과 같다.
 *
 * ⚠️ **이 테스트가 재는 것과 재지 못하는 것**
 * 재는 것: Content 가 어떤 클래스를 갖는가 · 소비처 패딩이 살아남았는가 · **DOM 이 그대로인가**.
 * 재지 못하는 것: **좌표**. jsdom 은 레이아웃도 `box-sizing` 도 계산하지 않으므로 "border 가
 * 패딩과 같은 폭을 예약한다" 를 여기서 확인할 수 없다. 전후 좌표는 Storybook 실측으로 확인했고
 * (PR 본문), 그 축은 여기서 자동화되지 않는다.
 */
describe('ScrollArea gutter 모드 (upstream #244)', () => {
  // ── 축 1. 하위호환 — 기본값이 예전 동작을 그대로 낸다
  // 두 번 `render` 하면 트리가 둘 남고 `document.querySelector` 가 **첫 번째만** 돌려주므로
  // 두 값이 자동으로 같아진다(항상 통과하는 단정). 사이에 `unmount` 해야 실제로 두 번 잰다.
  it('gutter 를 주지 않으면 reserve 로 동작한다', async () => {
    const first = render(
      <ScrollArea style={{ height: 100 }}>
        <div>내용</div>
      </ScrollArea>,
    )
    fakeMetrics(2000, 100)
    await settle()
    const implicit = content().className
    first.unmount()

    render(
      <ScrollArea style={{ height: 100 }} gutter="reserve">
        <div>내용</div>
      </ScrollArea>,
    )
    fakeMetrics(2000, 100)
    await settle()

    expect(content().className, '기본값이 reserve 가 아니다').toBe(implicit)
  })

  // ── 축 2. overlay — 예약을 하지 않는다
  it('overlay 는 오버플로가 있어도 거터를 예약하지 않는다', async () => {
    render(
      <ScrollArea style={{ height: 100 }} gutter="overlay">
        <div>내용</div>
      </ScrollArea>,
    )
    fakeMetrics(2000, 100)
    await settle()

    expect(content(), '오버플로 자체가 없으면 이 테스트는 아무것도 재지 않는다').toHaveAttribute(
      'data-has-overflow-y',
    )
    expect(content().className, 'overlay 인데 거터 조건이 남아 있다').not.toContain(
      'data-[has-overflow-y]:[--scroll-area-gutter:',
    )
    // 변수 기본값(0px)은 **두 모드 모두** 남는다 — 중첩 시 바깥 값을 물려받지 않기 위한 차단막이라
    // overlay 에서 빼면 reserve 안에 든 overlay 가 거터를 갖는다.
    expect(content().className, '상속 차단 기본값이 빠졌다').toContain('[--scroll-area-gutter:0px]')
  })

  // ── 축 3. 소비처 패딩 보존 — ② 의 기준
  // 결함 상태에서는 우리 `pr-*` 가 Content 에 남아 소비처 값을 이겼다. `tailwind-merge` 는
  // 토큰 스케일(`p-afds-spacing-10`)을 패딩으로 인식하지 못해 걷어내 주지도 않는다(실측).
  // 그러므로 **Content 에 우리 패딩 유틸리티가 하나도 없어야** 소비처 값이 온전히 남는다.
  it.each(['p-afds-spacing-10', 'p-[10px]', 'pr-0', 'px-afds-spacing-14'])(
    'contentClassName="%s" 이 그대로 남고 Content 에 우리 패딩 유틸리티가 없다',
    async consumerPadding => {
      render(
        <ScrollArea style={{ height: 100 }} contentClassName={consumerPadding}>
          <div>내용</div>
        </ScrollArea>,
      )
      fakeMetrics(2000, 100)
      await settle()

      expect(content().className, '소비처 패딩이 사라졌다').toContain(consumerPadding)
      expect(
        content()
          .className.split(/\s+/)
          .filter(c => /(^|:)p[trblxye]?-/.test(c)),
        'Content 에 우리 패딩 유틸리티가 남아 소비처 값과 경쟁한다',
      ).toEqual([consumerPadding])
    },
  )

  // ── 축 4. Content 유틸리티가 자식에게 닿는다
  // 예약을 **내부 래퍼**로 주는 안을 실측으로 버린 자리다: 래퍼가 중간에 서면 소비처가 Content 에
  // 준 `h-full`·`flex`·`grid`·`space-y` 가 자식에게 닿지 못한다(실측: `base-table` 의
  // `contentClassName="h-full w-full"` + 자식 `grid h-full` 에서 그리드 높이 398 → 24).
  // jsdom 은 높이를 못 재므로 여기서는 **자식이 여전히 Content 의 직계인가**만 고정한다.
  it.each(['reserve', 'overlay'] as const)(
    '%s 에서 자식이 Content 의 직계로 남는다 (사이에 래퍼를 끼우지 않는다)',
    async mode => {
      render(
        <ScrollArea style={{ height: 100 }} gutter={mode} contentClassName="h-full w-full">
          <div data-testid="child">내용</div>
        </ScrollArea>,
      )
      fakeMetrics(2000, 100)
      await settle()

      expect(content().children, 'Content 의 자식이 하나가 아니다').toHaveLength(1)
      expect(
        content().firstElementChild?.getAttribute('data-testid'),
        '소비처 자식과 Content 사이에 요소가 끼었다',
      ).toBe('child')
    },
  )
})
