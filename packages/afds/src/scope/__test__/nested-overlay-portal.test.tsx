import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { Modal } from '../../bricks/overlay/modal/modal'
import { Drawer } from '../../bricks/overlay/drawer/drawer'
import { Select } from '../../bricks/form/select/select'
import { MultiSelect } from '../../bricks/form/multi-select/multi-select'
import { AfdsScope } from '../afds-scope'

/**
 * **중첩 오버레이는 자기를 감싼 오버레이 안으로 포털된다.**
 *
 * Chromatic 으로 증명할 수 없다 — 쿼터가 소진돼 `UI Tests` 가 비교를 수행하지 않는다
 * (빌드 로그 `Snapshot quota reached`). 그래서 시각이 아니라 **DOM 위치를 단정**한다.
 *
 * 이 결함은 실제로 소비처를 이탈시켰다 — 모달 안에서 AFDS Select 을 포기하고
 * `relative`+`absolute` 목록에 바깥클릭·ARIA 를 손으로 붙여 쓰고 있다(upstream #675).
 *
 * **표를 파라미터화한 이유**: 처음에는 `Select` 만 렌더했는데, 그 상태로 `MultiSelect` 배선을
 * 통째로 되돌려도 전부 통과했다(독립 리뷰가 적발). 고쳤다고 주장하는 지점마다 테스트가 있어야
 * 한다. 세 번째 오버레이가 생기면 아래 목록에만 넣으면 된다.
 */

interface OverlayCase {
  name: string
  render: (container?: HTMLElement | null) => React.ReactElement
}

/** 드롭다운을 여는 오버레이들 — 이 PR 이 `container` 를 배선한 대상 전부. */
const OVERLAYS: OverlayCase[] = [
  {
    name: 'Select',
    render: container => (
      <Select defaultValue="a">
        <Select.Trigger placeholder="선택" />
        <Select.Content container={container}>
          <Select.List>
            <Select.Item value="a">A</Select.Item>
          </Select.List>
        </Select.Content>
      </Select>
    ),
  },
  {
    name: 'MultiSelect',
    render: container => (
      <MultiSelect>
        <MultiSelect.Trigger placeholder="선택" />
        <MultiSelect.Content container={container}>
          <MultiSelect.List>
            <MultiSelect.Item value="a">A</MultiSelect.Item>
          </MultiSelect.List>
        </MultiSelect.Content>
      </MultiSelect>
    ),
  },
]

interface ContainerCase {
  name: string
  slot: string
  wrap: (children: React.ReactNode) => React.ReactElement
  /** host 엘리먼트(`Modal.Content`/`Drawer.Panel`)에 **직접** ref 를 다는 변형. ref 안정성 검증용. */
  wrapWithRef: (ref: React.Ref<HTMLDivElement>) => React.ReactElement
}

/** 오버레이를 감싸는 컨테이너들 — 자기 노드로 포털 컨텍스트를 재공급하는 대상 전부. */
const CONTAINERS: ContainerCase[] = [
  {
    name: 'Modal',
    slot: 'modal-content',
    wrap: children => (
      <Modal.Root open>
        <Modal.Portal>
          <Modal.Overlay />
          <Modal.Content>{children}</Modal.Content>
        </Modal.Portal>
      </Modal.Root>
    ),
    wrapWithRef: ref => (
      <Modal.Root open>
        <Modal.Portal>
          <Modal.Overlay />
          <Modal.Content ref={ref}>x</Modal.Content>
        </Modal.Portal>
      </Modal.Root>
    ),
  },
  {
    name: 'Drawer',
    slot: 'drawer-panel',
    wrap: children => (
      <Drawer.Root open onOpenChange={() => {}}>
        <Drawer.Viewport>
          <Drawer.Overlay />
          <Drawer.Panel>{children}</Drawer.Panel>
        </Drawer.Viewport>
      </Drawer.Root>
    ),
    wrapWithRef: ref => (
      <Drawer.Root open onOpenChange={() => {}}>
        <Drawer.Viewport>
          <Drawer.Overlay />
          <Drawer.Panel ref={ref}>x</Drawer.Panel>
        </Drawer.Viewport>
      </Drawer.Root>
    ),
  },
]

const openDropdown = async () => {
  await userEvent
    .setup()
    .click(document.querySelector('[data-slot="select-trigger"]') as HTMLElement)
  await new Promise(r => setTimeout(r, 50))
  const popup = document.querySelector('[data-slot="select-content"]')
  expect(popup, '드롭다운이 렌더되지 않았다').not.toBeNull()
  return popup as HTMLElement
}

const scopePortal = () => document.querySelector('[data-afds-portal]')

describe('중첩 오버레이 포털', () => {
  const combos = CONTAINERS.flatMap(c => OVERLAYS.map(o => ({ c, o })))

  // ── 축이 조용히 사라지는 것을 막는다 ────────────────────────────────────
  //
  // 처음에는 `length > 0` 으로 단정했는데 **하한이라 아무것도 막지 못했다** —
  // `MultiSelect` 항목 하나만 지우면 스위트가 21 → 12 로 줄어드는데 전부 통과했다.
  // (이 저장소가 반복해 밟은 유형이고, 그것을 막으려고 쓴 가드에서 또 났다.)
  //
  // **기대값을 `OVERLAYS`/`CONTAINERS` 에서 계산하지 않는다.** 계산하면 축이 사라질 때
  // 양변이 함께 줄어 통과한다 — 등식이 자기 자신과 비교되는 형태다. 리터럴로 박는다.
  //
  // **이 가드가 지키는 것**: 축의 구성(어떤 오버레이 × 어떤 컨테이너)과 조합의 개수.
  // **지키지 못하는 것**: 조합당 `it` 개수. `describe.each` 안의 `it` 하나를 지우면
  //   21 → 17 로 줄지만 이 가드는 초록이다(실측 — 추정이 아니다).
  //   총 21건이라는 수치는 이 가드의 보증 범위 밖이다. 그것까지 지키려면 `it` 개수를
  //   세야 하는데, 테스트 파일이 자기 테스트 수를 세는 것은 실행 시점에 알 수 없다.
  it('테스트 축이 사라지지 않았다', () => {
    expect(
      OVERLAYS.map(o => o.name),
      '오버레이 축이 바뀌었다',
    ).toEqual(['Select', 'MultiSelect'])
    expect(
      CONTAINERS.map(c => c.name),
      '컨테이너 축이 바뀌었다',
    ).toEqual(['Modal', 'Drawer'])
    expect(
      combos.map(({ c, o }) => `${c.name}/${o.name}`),
      '조합이 바뀌었다',
    ).toEqual(['Modal/Select', 'Modal/MultiSelect', 'Drawer/Select', 'Drawer/MultiSelect'])
  })

  describe.each(combos)('$c.name 안의 $o.name', ({ c, o }) => {
    it('스코프 없이 — 감싼 오버레이 DOM 안으로 포털된다', async () => {
      render(c.wrap(o.render()))
      const popup = await openDropdown()
      const host = document.querySelector(`[data-slot="${c.slot}"]`)
      expect(host!.contains(popup), `드롭다운이 ${c.name} 밖에 있다`).toBe(true)
    })

    it('스코프 안에서도 — 스코프 타깃은 형제이므로 거기로 가면 안 된다', async () => {
      render(<AfdsScope>{c.wrap(o.render())}</AfdsScope>)
      const popup = await openDropdown()
      const host = document.querySelector(`[data-slot="${c.slot}"]`)
      expect(host!.contains(popup), `드롭다운이 ${c.name} 밖에 있다`).toBe(true)
    })

    it('container 를 명시하면 재공급을 이긴다 (탈출구)', async () => {
      const escape = document.createElement('div')
      document.body.appendChild(escape)
      try {
        render(c.wrap(o.render(escape)))
        const popup = await openDropdown()
        expect(escape.contains(popup), '명시 container 가 무시됐다').toBe(true)
      } finally {
        escape.remove()
      }
    })
  })

  // 감싸는 오버레이가 없을 때의 동작.
  //
  // **"바뀌지 않았다" 가 아니다** — 스코프 케이스는 이 PR 이 **바꾼다**. base 에서는 Select 이
  // 맨 `<Menu.Portal>` 이라 스코프 안에서도 `document.body` 로 갔고, 이제 스코프 포털 타깃으로
  // 간다. 즉 **모달과 무관하게 `<AfdsScope>` 안의 모든 Select 드롭다운이 DOM 위치를 바꾼다.**
  // 조상의 `overflow`/`transform`/스태킹 컨텍스트에 새로 노출될 수 있다.
  // 처음에 이 블록을 "기존 동작 회귀" 라고 라벨했는데 사실과 반대였다(독립 리뷰가 적발).
  describe.each(OVERLAYS)('$name (감싸는 오버레이 없음)', o => {
    it('스코프 있으면 스코프 포털 타깃으로 간다', async () => {
      render(<AfdsScope>{o.render()}</AfdsScope>)
      const popup = await openDropdown()
      expect(scopePortal()!.contains(popup), '스코프 밖으로 나갔다').toBe(true)
    })

    it('스코프 없으면 body 직속 포털로 간다', async () => {
      render(o.render())
      const popup = await openDropdown()
      expect(scopePortal(), '스코프가 없어야 한다').toBeNull()
      // `document.body.contains(popup)` 는 문서에 붙은 **어떤 노드든** 참이라 아무것도
      // 지키지 못한다(독립 리뷰가 판별력 0으로 측정). 포털 루트가 body **직속**인지 본다.
      const portalRoot = popup.closest('[data-base-ui-portal]')
      expect(portalRoot, 'base-ui 포털 루트를 찾지 못했다').not.toBeNull()
      expect(portalRoot!.parentElement, '포털이 body 직속이 아니다').toBe(document.body)
    })
  })

  // 컨텍스트를 재공급하려면 자기 노드가 필요하고, 그러려면 forwardRef 로 온 소비자 ref 와
  // 합성해야 한다. `mergeRefs` 를 렌더 안에서 인라인 호출하면 **매 렌더 새 함수**가 되어
  // React 가 `ref(null) → ref(element)` 를 다시 부른다 — callback ref 에 옵저버·포커스·
  // React 19 cleanup 을 붙인 소비자가 리렌더마다 teardown/setup 을 맞는다(독립 리뷰가 적발).
  it.each([
    { name: 'Modal', slot: 'modal-content' },
    { name: 'Drawer', slot: 'drawer-panel' },
  ])('$name: 소비자 callback ref 가 리렌더마다 뗐다 붙지 않는다', async ({ name }) => {
    const calls: string[] = []
    const target = CONTAINERS.find(c => c.name === name)!

    const Harness = () => {
      const [, force] = React.useReducer((x: number) => x + 1, 0)
      React.useEffect(() => {
        force()
        force()
      }, [])
      const ref = React.useCallback((n: HTMLDivElement | null) => {
        calls.push(n ? 'el' : 'null')
      }, [])
      // **host 엘리먼트에 직접 단다.** 안쪽 `<div>` 에 달면 host 의 ref churn 을 못 본다 —
      // 처음에 그렇게 썼다가 안정화를 되돌려도 통과하는 공허한 테스트가 됐다.
      return target.wrapWithRef(ref)
    }

    render(<Harness />)
    await new Promise(r => setTimeout(r, 50))
    // 안정화 전에는 마운트에 `el,null,el`, 리렌더마다 +2 였다.
    expect(
      calls.filter(c => c === 'null'),
      `ref 가 리렌더마다 분리됐다: ${calls.join(',')}`,
    ).toEqual([])
  })

  // 명시 `null` 의 실제 동작을 고정한다. JSDoc 이 "body opt-out" 이라고 **거짓**을 적고
  // 있었다(독립 리뷰 2건이 각각 적발). 선언형 base-ui Portal 은 `null` 을 미렌더로 처리한다.
  it.each(OVERLAYS)(
    '$name: container={null} 은 포털을 렌더하지 않는다 (body opt-out 아님)',
    async o => {
      render(
        <Modal.Root open>
          <Modal.Portal>
            <Modal.Overlay />
            <Modal.Content>{o.render(null)}</Modal.Content>
          </Modal.Portal>
        </Modal.Root>,
      )
      await userEvent
        .setup()
        .click(document.querySelector('[data-slot="select-trigger"]') as HTMLElement)
      await new Promise(r => setTimeout(r, 50))
      expect(document.querySelector('[data-slot="select-content"]')).toBeNull()
    },
  )
})
