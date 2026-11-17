# 중첩 오버레이 포털 (Nested Overlay Portal)

모달·드로어 **안에서 연 오버레이**(Select·MultiSelect·Popover·Tooltip)가 어디에 렌더되는지에 대한 규칙.

## 왜 이 문서가 있는가 — 소비처가 컴포넌트를 버렸다

`소비처 앱` 의 두 모달이 AFDS `Select` 을 **포기하고** 드롭다운을 손으로 만들었다.
그 저장소 README 가 이유를 적어 두었다:

> **왜 포털 없는 인라인인가**: AFDS `Select`/`Popover` 의 dropdown content 는 0.7.0 에서
> `.afds` 스코프(+모달 포털)를 이탈하는 이슈가 있다(upstream #675 — `Select.Content`
> container 미forward). 그래서 모달 안에서는 AFDS Select 대신 `relative` 래퍼 + `absolute`
> `<ul>`(포털 없음)로 구현해 모달 DOM·`.afds` 스코프 안에 머물게 한다.

그 대가로 **바깥 클릭 닫힘**(`useRef` + `document mousedown`)과 **ARIA**
(`aria-haspopup="listbox"` · `role="listbox"` · `role="option"` · `aria-selected`)를 손으로
다시 구현했다. 그리고 두 번째 모달이 "형제와 동일하게" 그것을 복제했다 — **우회가 패턴이 됐다.**

이 문서와 그 수정의 목적은 **그 우회를 걷어낼 수 있게 만드는 것**이다.

## 규칙

**모달 안에서 연 오버레이는 모달 DOM 안에 머문다.** `container` 를 넘기지 마라.

```tsx
<Modal.Content>
  <Select>
    <Select.Trigger placeholder="차원 선택" />
    {/* container 미지정 = 모달 안으로 해소된다 */}
    <Select.Content>
      <Select.List>…</Select.List>
    </Select.Content>
  </Select>
</Modal.Content>
```

## 어떻게 동작하는가 — 두 층이 함께 필요하다

한쪽만으로는 고쳐지지 않는다. 돌연변이로 확인했다(`nested-overlay-portal.test.tsx`).

| 층  | 무엇                                                                         | 빠지면                                                                              |
| --- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 1   | `Select.Content` 가 `container` 를 받아 `useResolvedPortalContainer` 로 해석 | Select 이 포털 체계에 **참여조차 하지 않는다** — `document.body` 로 간다            |
| 2   | `Modal.Content` 가 **자기 노드로** `AfdsPortalContext` 를 재공급             | Select 이 스코프를 따르는데 **스코프 포털 타깃은 모달의 형제**라 여전히 모달 밖이다 |

즉 `<AfdsScope>` 만으로는 부족하다. 스코프가 공급하는 타깃은 모달과 형제이므로,
모달이 자기 노드로 컨텍스트를 덮어써야 그 안에서 해소된다.

## 해석 우선순위

```text
명시 container  >  가장 가까운 Modal.Content  >  AfdsScope 포털 타깃  >  document.body
```

`useResolvedPortalContainer` 는 **`undefined`(미지정)만** 컨텍스트로 폴백한다.

> **명시 `null` 은 body opt-out 이 아니다 — 포털을 아예 렌더하지 않는다.** 실측:
> `container={null}` 로 드롭다운을 열면 `[data-slot="select-content"]` 가 **존재하지 않는다**.
> body 로 보내려면 `document.body` 를 직접 넘겨라.
> (`Select`·`MultiSelect`·`Drawer`·`Popover` 의 JSDoc 이 이것을 "opt-out" 이라고 **거짓**으로
> 적고 있었다. 독립 리뷰 2건이 각각 적발했고 넷 다 고쳤다. 픽스처로 고정했다.)

## 탈출구

의도적으로 모달 밖에 띄워야 하면 `container` 를 명시한다.

```tsx
<Select.Content container={someElement}>…</Select.Content>
```

컨테이너를 직접 해석해야 하면 훅을 쓴다. 루트에서 꺼낼 수 있다.

```tsx
import { useResolvedPortalContainer } from '@turbo-project/afds'
```

## 소비처가 우회를 걷어내는 방법

1. `relative` 래퍼 + `absolute <ul>` 을 `Select` 합성으로 되돌린다
2. `document` `mousedown` 리스너와 `useRef` 를 **지운다** — base-ui 가 처리한다
3. 손으로 붙인 `aria-haspopup`·`role="listbox"`·`role="option"`·`aria-selected` 를 **지운다**
4. `Select.Content` 에 `container` 를 넘기지 **않는다**

## 적용 범위

`Select` · `MultiSelect` · `Popover` · `Drawer` · `Tooltip` · `Modal` 이 모두 `container` 를 받고
`useResolvedPortalContainer` 로 해석한다. `Select`/`MultiSelect` 가 마지막으로 합류했다.

**자기 노드로 컨텍스트를 재공급하는 것**은 `Modal.Content` 와 `Drawer.Panel` 이다.
둘 다 병합 ref 를 `useMemo` 로 안정화한다 — `mergeRefs` 를 렌더 안에서 인라인 호출하면
매 렌더 새 함수가 되어 소비자 callback ref 가 뗐다 붙는다(실측: 마운트에 `el,null,el`).

## 검증 — 시각이 아니라 DOM 위치로

Chromatic 으로 증명하지 않는다. 쿼터가 소진돼 `UI Tests` 가 **비교를 수행하지 않는다**
(빌드 로그 `Snapshot quota reached`). "pending" 은 실행 중이 아니라 안 본 것이다.

대신 `src/scope/__test__/nested-overlay-portal.test.tsx` 가 **DOM 위치를 단정**한다 —
**오버레이(`Select`·`MultiSelect`) × 컨테이너(`Modal`·`Drawer`)** 로 파라미터화한다.
처음에는 `Select` 만 렌더했는데, 그 상태로 `MultiSelect` 배선을 통째로 되돌려도 전부
통과했다(독립 리뷰가 적발) — **고쳤다고 주장하는 지점마다 테스트가 있어야 한다.**
목록이 비면 `it.each` 가 0건 실행으로 조용히 통과하므로 비어 있지 않음도 단정한다.

네 지점을 각각 되돌려 확인했다:
`Select` 배선 8 failed · `MultiSelect` 배선 8 failed · `Modal` 재공급 4 failed ·
`Drawer` 재공급 4 failed · ref 안정화 각 1 failed.
