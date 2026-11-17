---
paths:
  - 'packages/afds/src/bricks/**'
  - 'packages/afds-registry/src/compositions/**'
---

# AFDS 컴포넌트 합성 패턴 규칙

AFDS 컴포넌트(특히 합성/Compound)를 구현할 때 자주 쓰는 세 가지 패턴.

- **`render`** — sub-part 의 element 또는 콘텐츠를 외부에서 치환
- **`Trigger`** — 오버레이/팝업의 열기 액션 sub-part
- **`Indicator`** — 상태를 시각화하는 sub-part

대상: `packages/afds/src/bricks/`, `packages/afds-registry/src/compositions/`.

---

## 1. `render` 패턴

### 특징

- Base UI 의 `render` 컨벤션을 따른다. prop 이름은 반드시 **`render`** —
  `as` · `asChild` · `component` 같은 변형 금지.
- 함수형을 지원하면 state 타입을 `interface XxxRenderState` 로 명시한다.
- `render` 가 책임지는 **영역(scope)** 을 JSDoc 에 분명히 적는다.

### 유형 — 세 가지

| 유형                                | 시그니처                        | 책임 영역                                             | 사용 컴포넌트                                                                 |
| ----------------------------------- | ------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------- |
| **(A) ReactElement 치환**           | `render={<MyEl />}`             | sub-part 의 **루트 element** 전체                     | `Popover.Trigger` · `Modal.Trigger` · `Tooltip.Trigger` · `Accordion.Trigger` |
| **(B) 함수형 — Trigger value 영역** | `render={(state) => ReactNode}` | Trigger 내부 **value 영역만** (indicator 영역은 별도) | `Select.Trigger` · `MultiSelect.Trigger`                                      |
| **(C) 함수형 — 반복 아이템 렌더러** | `render={(item) => ReactNode}`  | 컬렉션의 **각 아이템/셀** 콘텐츠                      | `Pagination`(item) · `Calendar`/`RangeCalendar`(day · cell)                   |

- (A) 는 base-ui primitive 를 거의 그대로 노출하는 sub-part 에서 쓰인다.
  사용자 element 가 그대로 sub-part 의 루트가 된다.
- (B) 는 루트 element 는 AFDS 가 유지하고, 내부 일부 슬롯의 콘텐츠만 갈아낀다.
  state 가 필요해서 함수 형태로 받는다.
- (C) 는 컬렉션 컴포넌트가 각 아이템을 어떻게 그릴지 외부에 위임할 때 쓴다.
  state 가 아닌 **데이터(item/date/cell)** 가 인자로 들어온다.

### 사용 예시

```tsx
// (A) ReactElement 치환 — Popover.Trigger 루트가 사용자의 Button 으로 바뀐다
<Popover.Trigger render={<Button variant="outline">열기</Button>} />

// (B) 함수형 콘텐츠 치환 — Select.Trigger 의 value 영역만 갈아낀다.
//     라벨 앞에 prefix 텍스트를 붙이는 식. indicator 영역은 별도라 건드리지 않는다.
<Select.Trigger
  placeholder="선택"
  render={({ selectedOption }) => `선택: ${selectedOption.label}`}
/>
```

---

## 2. `Trigger` 패턴

### 특징

- 사용자의 액션(열기 · 이전/다음 · 펼침)을 받는 **인터랙티브 sub-part**.
- 이름은 `{Component}.Trigger` (혹은 `PrevTrigger`/`NextTrigger`).
  Base UI primitive 의 `Trigger` 위에 얹어 `*.Trigger.Props` 를 `Omit` 으로 확장한다.
- **`render` 를 반드시 지원**한다 — 어떤 형태(A / B)를 받는지는 유형마다 다르고
  JSDoc 에 명시한다.
- 기본 DOM 은 `<button>`. 토큰(`afds-*`) 으로 스타일한다.
- ARIA 는 Base UI 가 주입하는 값을 신뢰 — `aria-haspopup` 같은 수동 지정 금지.

### 유형 — 세 가지

| 유형                          | 구조                                                       | 받는 render 형태          | 사용 컴포넌트                                                                 |
| ----------------------------- | ---------------------------------------------------------- | ------------------------- | ----------------------------------------------------------------------------- |
| **(1) Primitive passthrough** | base-ui Trigger 를 거의 그대로 노출                        | (A) ReactElement          | `Popover.Trigger` · `Modal.Trigger` · `Tooltip.Trigger` · `Accordion.Trigger` |
| **(2) Composite**             | value 영역 + indicator 영역 두 슬롯 (아래 다이어그램 참고) | (B) 함수형 — value 영역만 | `Select.Trigger` · `MultiSelect.Trigger`                                      |
| **(3) Directional**           | Prev/Next 등 방향성 액션 한 쌍                             | (A) ReactElement          | `Pagination.PrevTrigger` · `Pagination.NextTrigger`                           |

### (2) Composite Trigger — 내부는 두 영역으로 분리된다

```
┌─ {Component}.Trigger ───────────────────────────────┐
│                                                     │
│  [ value 영역 ]            [ indicator 영역 ]       │
│   render prop               indicator prop          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

- **value 영역** — 텍스트 · 선택값 · 라벨. `render` 함수 prop 으로 커스텀한다.
- **indicator 영역** — ▾ 같은 상태 신호. `indicator` named prop 으로 노드를 전달한다.
- 두 영역은 **독립된 named prop** 이므로 하나만 커스텀할 수 있다 — 서로 침범하지 않는다.
- `indicator` 를 명시하지 않으면 Trigger 가 기본 아이콘(`<ChevronDownIcon size={16}>`)을 **자동 렌더**한다.
- `{Component}.Indicator` sub-part 는 존재하지 않는다 — indicator 영역 커스텀은 `indicator` prop 으로만 한다.

### 사용 예시

```tsx
// 기본 — value 는 placeholder, indicator 는 자동(ChevronDown)
<Select.Trigger placeholder="선택하세요" />

// ReactElement 치환형 Trigger (Popover/Dialog) — 루트 element 통째 교체
<Dialog.Trigger render={<Button variant="destructive">삭제</Button>} />

// 함수형 치환형 Trigger (Select)
// value 영역: render prop으로 콘텐츠만 교체 (indicator 는 건드리지 않음)
<Select.Trigger
  placeholder="선택"
  render={({ selectedOption }) => (
    <span>
      <strong>{selectedOption.label}</strong>
      <small className="text-afds-text-secondary"> · {selectedOption.value}</small>
    </span>
  )}
/>

// indicator 영역만 교체
<Select.Trigger placeholder="선택" indicator={<ChevronsUpDownIcon size={16} />} />

// 둘 다 커스텀
<Select.Trigger
  placeholder="선택"
  render={({ selectedOption }) => `선택: ${selectedOption.label}`}
  indicator={<ChevronsUpDownIcon size={16} />}
/>
```

---

## 3. `Indicator` 패턴

### 특징

- 상태(열림/닫힘 · 체크 · 진행률 · 선택 위치 …) 를 **시각화하는 작은 sub-part**.
- 이름은 `{Component}.Indicator`. Base UI primitive 의 `Indicator` 위에 얹는다.
- **부모 compound 의 상태에 종속**된다 — primitive 가 open/checked/value 를 자동으로 전달.
- 기본 children(예: `<ChevronDownIcon />`) 을 갖고, 사용자가 `children` 을 넘기면 그것을 우선한다.
- 자체 layout/정렬은 Indicator 가 책임 — 부모는 "자리" 만 비워둔다.
- `data-slot="indicator"` 를 부여해 외부 selector 진입점을 만든다.

### 유형 — 세 가지

| 유형                 | 표현하는 상태                                                                                   | 위치                            | 사용 컴포넌트                                 |
| -------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------- | --------------------------------------------- |
| **(i) Binary 상태**  | 체크 / 선택 여부 (on·off). 시각 마크를 내장하며 `children`/`indeterminateMark` prop 으로 커스텀 | Root 내부 단독                  | `CheckBox.Indicator` · `RadioGroup.Indicator` |
| **(ii) 값 / 진행률** | 진행도 · 스크롤 위치 같은 연속 값                                                               | Root 내부 단독                  | `Progress.Indicator` · `ScrollIndicator`      |
| **(iii) 위치 이동**  | 현재 선택된 항목 (애니메이션으로 미끄러짐)                                                      | Root 내부, 항목들과 같은 좌표계 | `SegmentControl.Indicator`                    |

- 모두 Trigger 없이 Root 의 상태만 받아 단독 렌더된다.
- `Select`/`MultiSelect` 의 열림/닫힘 아이콘은 Indicator sub-part 가 아닌 **Trigger 의 `indicator` prop** 으로 커스텀한다.

### 사용 예시

```tsx
// Root 내부 단독
<Progress value={60}>
  <Progress.Indicator />
</Progress>

// CheckBox.Indicator — check 아이콘(children)과 indeterminate 마크(indeterminateMark) 내장
<CheckBox.Root>
  <CheckBox.Indicator keepMounted />
</CheckBox.Root>

// 커스텀 check 아이콘
<CheckBox.Indicator keepMounted>
  <StarIcon size={16} />
</CheckBox.Indicator>

// RadioGroup.Indicator — dot 내장
<RadioGroup.Item value="a">
  <RadioGroup.Indicator />
</RadioGroup.Item>
```
