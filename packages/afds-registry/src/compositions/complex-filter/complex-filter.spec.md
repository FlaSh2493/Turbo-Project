---
domain: common
category: form
---

# ComplexFilter

> 입력 하나와 칩으로 이뤄진 검색 필터 바. 입력하면 키워드 추천이, 빈 입력을 누르면 필드 메뉴가 열리고 고른 결과가 칩으로 쌓인다. `ComplexFilter.Root` 아래 파트를 조립해 쓴다.

## Rules

1. 파트(`MatchMode` · `Input` · `Chip` · `Actions` · `CollapseToggle`)는 `ComplexFilter.Root` 안에서만 쓴다 — 밖에서 쓰면 던진다. `Root` 의 `children` 이 `undefined` 면 기본 배치(`MatchMode` · `Input` · `Actions` + `CollapseToggle`)를 그린다
2. 칩은 `Input` 의 children 으로 넣고, `Root` 의 `chips` 에 있는 것이어야 한다. `Input` 의 `children` 이 `undefined` 일 때만 `chips` 를 기본 칩으로 그린다(`null` 이면 칩 없음). 칩 목록 전용 파트(`Chips`)는 두지 않는다 — 상태가 controlled 라 소비자가 `chips` 를 이미 갖고 있다
3. `CollapseToggle` 은 `Actions` 안에서 쓴다 — `Actions` 의 `children` 이 `undefined` 면 기본으로 그리고, 주면 대체한다. `Actions` 밖에 두면 우측 그룹 간격(10)과 첫 줄 고정이 깨진다
4. 상태는 모두 controlled 다. 결합 방식(AND/OR)의 의미 적용과 최근 검색 저장·개수 상한은 소비자가 한다 — 모듈은 선택 UI 와 콜백만 노출한다
5. 문구는 영문 기본값이다. `labels` 로 바꿀 것만 부분 override 한다(객체형은 한 단계 병합, 함수형은 통째 교체). 문구가 20개이고 함수형이 섞여 개별 prop 대신 객체를 쓴다 — 다른 컴포지션(개별 문구 prop)과 다른 점이다
6. 컨텍스트 훅은 공개하지 않는다(`base-table` 은 `useTableContext` 를 공개). 공개하면 내부 controller 구조가 계약이 된다. 커스텀 파트가 필요해지면 그때 공개한다
7. 테스트 식별자는 `data-testid` 를 유지한다(규약은 `data-slot` 을 쓰라 하지만 동적 testid `…-option-${key}-${value}` · `…-field-${key}` · `…-suggestion-${key}` · `…-match-${value}` 는 `data-slot` 에 담을 수 없다 — 값이 리터럴이어야 한다). `data-slot` 은 파트 단위 리터럴만 둔다
8. 팝업을 여는 입력 래퍼와 필드 메뉴 행은 base-ui 가 `data-slot="popover-trigger"` 를 넘기지만 **우리 값(`complex-filter-input-anchor` · `complex-filter-field-row`)이 뒤에서 덮는다** — 두 요소는 Popover 트리거 버튼이 아니라 앵커이기 때문이다
9. `portalContainer` 가 `null` 이어도 팝업은 사라지지 않는다(AFDS 는 명시 `null` 이면 포털을 그리지 않으므로 내부에서 `undefined` 로 바꿔 넘긴다)
10. 키워드 칩 수정 팝업은 연산자가 1개면 토글 없이 제목 뒤에 연산자 라벨을 일반 텍스트로 붙인다(「이름에 포함」, 대괄호 없음). 서브메뉴·칩 수정 팝업은 필드 라벨을 `aria-label` 로 갖고, 필드 메뉴(부모 카드) 팝업은 `aria-label` 이 없다
11. 알려진 한계: 좁은 뷰포트에서 팝오버가 오른쪽으로 flip 돼 칩의 X 를 덮을 수 있다(AFDS `Popover.Content` 가 `collisionAvoidance` 를 전달하지 않는다)
12. 긴 값 목록(다중·단일·최근 검색 서브메뉴, 칩 수정 팝업)은 팝업 최대 높이(430px, 화면이 더 작으면 가용 높이) 안에서 `ScrollArea` 로 스크롤하고 스크롤바는 마우스를 올렸을 때만 보인다
13. 컨텍스트로 내려가는 값은 안정화돼 있다(`useFilterController` 가 고정 함수 껍데기와 `useMemo` 로 같은 객체를 돌려준다). 소스 레포(소비처 앱)의 훅과 달라진 부분이며, 소비자가 `fields`·`chips`·`labels` 를 렌더마다 새로 만들어 넘기면 그만큼은 파트가 다시 그려진다
14. 사용처가 1곳이라 「3곳 이상 반복」 기준(`philosophy.md`)에는 못 미친다 — 사용자 결정으로 컴포지션에 둔다
15. `suggest: false` 는 추천 행에서만 빠진다. 칩은 그대로 그려지고, 수정 가능 여부는 칩의 `editable` 이 정한다

## Examples

```tsx
const [chips, setChips] = useState<ComplexFilterChip[]>([])

// 기본 배치
<ComplexFilter.Root
  fields={[
    { type: 'keyword', key: 'name', label: 'Name', conditions: ['like', 'unlike'] },
    { type: 'select', key: 'status', label: 'Status', options: [{ value: 'done', label: 'Done' }] },
  ]}
  chips={chips}
  onChange={setChips}
  onClear={() => setChips([])}
/>

// 직접 조립
<ComplexFilter.Root fields={fields} chips={chips} onChange={setChips} onClear={clear} matchMode={matchMode}>
  <ComplexFilter.MatchMode />
  <ComplexFilter.Input>
    {chips.map(chip => (
      <ComplexFilter.Chip key={chip.id} chip={chip} />
    ))}
  </ComplexFilter.Input>
  <ComplexFilter.Actions>
    <ComplexFilter.CollapseToggle />
  </ComplexFilter.Actions>
</ComplexFilter.Root>
```
