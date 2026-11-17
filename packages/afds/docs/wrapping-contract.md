# 래핑 계약 (Wrapping Contract)

AFDS 브릭은 Base UI / react-aria 같은 외부 컴포넌트를 래핑한다. 래핑에는 고유한 함정이 있다 —
**래핑한 컴포넌트가 소비자가 넘긴 prop 을 조용히 지우거나, 반대로 내부 동작을 소비자가 조용히
지우게 한다.** 어느 쪽도 소비자는 알 수 없다. 타입은 통과하고, 렌더는 성공하고, 동작만 사라진다.

이 문서는 브릭이 소비자 props 와 내부 props 를 어떻게 합쳐야 하는지를 규정한다.
`src/bricks/**` 와 `src/compositions/**` 는 이 계약을 따라야 하며, 위반은 `src/lib/__test__/wrapping-contract.test.ts`
가 기계적으로 잡는다.

## 왜 필요했나

이 문서가 없던 시절, 두 브릭이 **정반대 순서**로 작성되어 있었다.

```tsx
// select.tsx — 소비자가 이긴다: 소비자 onClick 이 선택 동작을 지운다
<Menu.Item onClick={handleClick} {...props} />

// calendar.tsx — 내부가 이긴다: react-aria 가 소비자 onFocus·aria-label 을 지운다
<button {...props} {...buttonProps} />
```

어느 하나가 버그인 게 아니라 **규칙이 존재하지 않았다.** 계약을 코드에만 두고 문서로 남기지
않으면 다음 사람이 같은 자리에서 같은 선택을 다시 하게 된다.

## 규칙

### 1. `data-slot` 재라벨링은 결함이 아니라 기능이다

`data-slot` 은 DOM 계약이다 — 테스트·스타일링·매니페스트가 이것으로 붙는다.
그리고 **래핑 컴포넌트가 브릭의 역할을 바꿔 달 때 재라벨링하는 것이 의도된 메커니즘이다.**

```tsx
// ScrollArea 는 자기 자신을 scroll-area 로 표시한다
<ScrollAreaPrimitive.Root data-slot="scroll-area" {...props} />

// Modal.Body 는 그 ScrollArea 를 자기 역할로 다시 이름 붙인다
<ScrollArea data-slot="modal-body" ... />   // → 렌더 결과는 modal-body
```

이것이 동작하는 이유는 `data-slot` 이 `{...props}` **앞**에 있기 때문이다.
따라서 `data-slot` 을 `{...props}` 뒤로 옮기면 **재라벨링이 전부 죽는다.**

> **주의.** 이 저장소에서 실제로 있었던 오독이다. "`data-slot` 은 내부 계약이니 소비자가
> 덮을 수 없어야 한다" 는 판단으로 132곳을 일괄 이동시켰더니 테스트 39개가 깨졌다.
> 값이 상수 리터럴인지만 보고 **누가 그 값을 공급하는지**를 보지 않은 것이 원인이었다.
> 공급자는 소비자가 아니라 또 다른 AFDS 컴포넌트였다.

대신 지켜야 할 것:

- `data-slot` 값은 **문자열 리터럴**이어야 한다 (정적 DOM 계약의 전제)
- 소비자 props 를 펼치는 **host 엘리먼트**에는 `data-slot` 이 있어야 한다

#### AFDS 내부 재라벨링 실례

`bricks/**` 14곳:

| 위치                                                     | 대상               | 재라벨링                               |
| -------------------------------------------------------- | ------------------ | -------------------------------------- |
| `form/select/select.tsx:346`                             | `<Input.Root>`     | `input` → `select-search`              |
| `form/select/select.tsx:419`                             | `<ScrollArea>`     | `scroll-area` → `select-list`          |
| `form/multi-select/multi-select.tsx:372`                 | `<Input.Root>`     | `input` → `select-search`              |
| `form/multi-select/multi-select.tsx:496`                 | `<ScrollArea>`     | `scroll-area` → `select-list`          |
| `layout/center/center.tsx:20`                            | `<Flex>`           | `flex` → `center`                      |
| `layout/stack/stack.tsx:17`                              | `<Flex>`           | `flex` → `vstack`                      |
| `layout/stack/stack.tsx:33`                              | `<Flex>`           | `flex` → `hstack`                      |
| `layout/container/container.tsx:25`                      | `<Box>`            | `box` → `container`                    |
| `layout/grid/grid.tsx:53`                                | `<Box>`            | `box` → `grid`                         |
| `feedback/toast/toast.tsx:217`                           | `<Toast.Viewport>` | `toast-viewport` → `toaster-viewport`  |
| `feedback/toast/toast.tsx:219`                           | `<SmoothList>`     | `smooth-list` → `toaster-list`         |
| `action/accordion/accordion.tsx:161`                     | `<Typography>`     | `typography` → `accordion-body`        |
| `action/floating-action-bar/floating-action-bar.tsx:145` | `<Button>`         | `button` → `floating-action-bar-clear` |
| `overlay/modal/modal.tsx:191`                            | `<ScrollArea>`     | `scroll-area` → `modal-body`           |

`compositions/**` 9곳: `page-layout`, `section-error-fallback`, `popconfirm`(3),
`base-table/table-empty-state`, `negative-modal`, `alert-modal`,
`floating-action-bar-count`.

### 2. `className` 은 합성한다

`className` 은 구조분해로 빼내고 `cn()` 으로 합성한다. `{...props}` 에 남겨두면
소비자 className 이 variant 클래스를 통째로 대체한다.

```tsx
const Brick = ({ className, ...props }) => (
  <div className={cn(brickVariants(), className)} {...props} />
)
```

> **알려진 한계 — 함수형 `className` 은 현재 대부분 동작하지 않습니다 (별건).**
> Base UI 의 `className` 은 `string | ((state) => string)` 을 받지만, AFDS 를 거치면
> 두 층에서 무너집니다.
>
> 1. **타입 층** — Base UI 파생 Props 50개 중 20개가 함수형을 아예 거부합니다
>    (`Omit` 후 재선언 / `& { className?: string }` 교집합 / `extends` 후 좁힘).
> 2. **런타임 층** — 타입이 함수를 받아주는 27개 중 실제로 동작하는 것은 3개뿐입니다.
>    `cn()` = `twMerge(clsx())` 는 함수를 받으면 **예외도 문자열화도 없이 조용히 버립니다.**
>    실행 확인: `cn('flex items-center', fn)` → `"flex items-center"`
>
> 나머지 22개는 **타입 통과 + 클래스 소멸 + 오류 신호 0** 입니다.
> 고치려면 Props 타입 50개와 `cn()` 동작을 함께 바꿔야 해서 파급이 큽니다 — 별도 일감입니다.
> 그때까지 **새로 좁히지 마십시오**: 브릭을 수정할 때 `className` 타입을 `string` 으로
> 재선언하거나 교집합으로 덮어쓰지 않습니다.

## 합성 도구를 어디서 가져오는가 — 루트에서 가져온다

아래 예시들은 `'@turbo-project/afds'` (**루트**)에서 가져온다. AFDS 소스 안에서도 그렇다.

```ts
import { composeEventHandlers, mergeRefs, mergeProps } from '@turbo-project/afds'
```

셋 다 `src/lib/index.ts` → `src/index.ts` 로 루트에 공개돼 있다. 루트는 `./lib` 을 재수출하고
`./compositions` 는 재수출하지 않으므로 **순환이 없다**. 실측(로드해서 확인, 이름 grep 아님):

```
node -e "const m=require('./dist/index.js'); ['composeEventHandlers','mergeRefs','mergeProps']..."
  → 전부 function
```

**왜 깊은 상대경로가 아닌가.** `src/compositions/**` 는 `afds-registry` 로 **소비처 코드베이스에
복사**된다. 복사될 때 `transform` 이 상대경로를 서브패스로 치환하는데,
`'../../lib/compose-event-handlers'` 에는 치환 규칙이 없어 **레지스트리 생성기가 막는다**
(실측 — 소비처에 상대경로가 그대로 남아 컴파일되지 않기 때문). 루트 import 는 치환할 것이
없으므로 그대로 남고 소비처에서 해소된다. 실측한 `transform` 결과:

```
import { composeEventHandlers } from '@turbo-project/afds'      ← 그대로 (해소됨)
import { cn } from '@turbo-project/afds/lib/utils'              ← 서브패스로 치환
import { BaseTooltip } from '../base-tooltip'               ← 형제 컴포지션은 그대로
```

`@turbo-project/afds` 는 모든 컴포지션의 `dependencies` 에 이미 들어 있어 새 의존성이 아니다.

> **이것은 현재 관례이지 확정된 정답이 아니다.** 서브패스 방향
> (`@turbo-project/afds/lib/compose-event-handlers`)에도 근거가 있다 — `cn` 이 이미
> `@turbo-project/afds/lib/utils` 로 나가므로 **배포 산출물 이디엄과는 그쪽이 일치**하고,
> 통일 비용도 그쪽이 싸다(서브패스 3개 추가 대 소스 16파일 변경).
> 루트를 택한 실질 근거는 "내부 파일 배치를 공개 API 로 노출하지 않는다" 와
> "이미 실측·구현됐다" 다. **두 방향의 통일은 이슈에서 검토 중이며, 한쪽을 정답으로
> 적어 두면 다음 사람이 근소한 선택을 확정된 규칙으로 읽는다.**

### 3. 이벤트 핸들러는 덮어쓰지 않고 합성한다

**소비자 먼저 실행하고, 소비자가 `event.preventDefault()` 를 호출했으면 내부를 생략한다.**
Radix 의 `composeEventHandlers` 와 동일한 규약이다.

```tsx
import { composeEventHandlers } from '@turbo-project/afds'
;<Menu.Item {...props} onClick={composeEventHandlers(props.onClick, handleSelect)} />
```

합성한 핸들러는 반드시 `{...props}` **뒤**에 두어라. 앞에 두면 소비자가 스프레드로 덮는다.

소비자가 아무것도 하지 않으면 내부 동작이 보존되고, 내부 동작을 막고 싶으면
`preventDefault()` 로 **명시적으로** 선언해야 한다. "조용히 사라지는 사고" 와
"발견 가능한 escape hatch" 의 차이가 이 규칙의 전부다.

### 4. `ref` 는 `mergeRefs` 로 합성한다

`ref` 를 받는 것과 내부 부수효과(자동 포커스 등)는 **서로 무관한 관심사**다.
effect 안에서 object/function ref 를 분기하다가 한쪽 경로에서 early return 하면
부수효과가 통째로 사라진다.

```tsx
// ❌ object ref 를 넘기면 focus() 에 도달하지 않는다
useEffect(() => {
  if (ref && typeof ref === 'object') {
    ref.current = inputRef.current
    return
  }
  inputRef.current?.focus()
}, [ref])

// ✅ 관심사를 분리한다
useEffect(() => {
  inputRef.current?.focus({ preventScroll: true })
}, [])
useEffect(() => {
  /* ref 전달 + cleanup */
}, [ref])
```

object ref 경로에도 cleanup(`ref.current = null`)을 반드시 둔다.

### 5. hook/aria props 와 소비자 props 는 `mergeProps` 로 병합한다

`buttonProps`, `rootProps` 처럼 hook 이 만들어낸 props 와 소비자 props 가 같은 키를 가지면
**스프레드 순서로 해결하지 마라** — 순서로는 반드시 한쪽이 사라진다.

```tsx
import { mergeProps } from '@turbo-project/afds'
;<button {...dataAttrs} {...mergeProps(buttonProps, props)} data-slot="calendar-day" />
```

`mergeProps(내부, 소비자)` 의 키별 규칙:

| 키               | 규칙                                                    |
| ---------------- | ------------------------------------------------------- |
| `on[A-Z]` 핸들러 | `composeEventHandlers` 로 합성 (규칙 3)                 |
| `className`      | `cn()` 으로 합성                                        |
| `style`          | 얕게 병합, 겹치면 소비자 우선                           |
| 그 외            | 소비자 우선. 단 소비자 값이 `undefined` 면 내부 값 유지 |
| `ref`            | 다루지 않는다 — `mergeRefs` 사용 (규칙 4)               |

### 6. 임의 소비자 자식의 layout 을 강제하지 않는다

wrapper 가 descendant 셀렉터로 소비자 콘텐츠의 layout 을 강제하면 소비자는 특이도 때문에
되돌릴 수 없다.

```tsx
// ❌ [&>div>*]:flex-col 의 특이도 (0,1,1) 이 소비자 .flex-row (0,1,0) 을 이긴다.
//    cn()/twMerge 도 arbitrary variant 와 평범한 유틸리티를 같은 그룹으로 보지 않아
//    병합으로 해결되지 않는다. 소비자는 inline style 외에 우회 방법이 없다.
viewportClassName = 'flex h-full flex-col [&>div>*]:flex [&>div>*]:flex-col'

// ✅ 자기 자신의 layout 만 책임진다
viewportClassName = 'flex h-full flex-col'
```

layout 강제가 꼭 필요하면 AFDS 자체 슬롯 안으로만 스코프하고, 임의 소비자 콘텐츠에는
누수시키지 않는다. (이슈 #90)

## 기계 검사

`src/lib/__test__/wrapping-contract.test.ts` 가 `src/bricks/**` 와 `src/compositions/**` 전체를 AST 로 훑어
아래를 강제한다. `pnpm --filter @turbo-project/afds test:run` 에 포함된다.

| 규칙               | 검사 내용                                                       |
| ------------------ | --------------------------------------------------------------- |
| `handler-clobber`  | 구조분해되지 않은 내부 이벤트 핸들러가 `{...props}` 앞에 있는가 |
| `spread-inversion` | `{...props}` 뒤에 또 다른 스프레드가 오는가                     |
| `dynamic-slot`     | `data-slot` 값이 문자열 리터럴이 아닌가                         |
| `missing-slot`     | 소비자 props 를 펼치는 host 엘리먼트에 `data-slot` 이 없는가    |

소비자 스프레드는 **이름이 아니라 감싸는 함수의 rest 바인딩 참조**로 판정한다. 처음에는
`/\.\.\.props/` 로 이름을 고정했는데, 그러자 `{...rest}` 와 `{...mergeProps(inner, props)}` 가
검사 시야에서 통째로 사라졌다 — 이 계약을 도입한 PR 이 고친 calendar 4곳이 정확히 그
사각지대에 들어가서, 원래 결함을 되돌려도 위반 0건이 나왔다. 이름이나 앵커에 의존하는
검사는 그것이 없는 자리를 원리적으로 보지 못한다.

같은 이유로 가드는 **위반 수만 보고하지 않고 `filesScanned`(검사 대상으로 인식한 파일 수)를
함께 반환한다.** "위반 0건" 은 코드가 옳아서일 수도, 아무것도 못 봐서일 수도 있다.

**검사 범위는 `src/bricks/**`+`src/compositions/**` 다** (이슈 #105 에서 확장, 현재 68개).

처음에는 브릭만 봤다. compositions 에 선재 위반 2건이 있어 범위를 넓히면 CI 가 즉시 깨졌기
때문인데, 그건 범위 관리 결정이었지 위험도 판단이 아니었다. **실제 우선순위는 거꾸로였다** —
compositions 는 `afds-registry` 를 통해 **소비처 코드베이스로 복사**되고 `./compositions` 번들로도
배포된다. 브릭의 위반은 패키지 안에 머물러 업데이트로 일괄 회수되지만, compositions 의 위반은
**복사된 뒤에는 회수되지 않는다.** 검사하지 않던 쪽이 위험도가 높은 쪽이었다.

확장하면서 트립와이어도 바꿨다. `filesScanned > 20` 이라는 하한은 "일부를 조용히 버림" 을
잡지 못한다(68개 중 47개가 사라져도 통과). 자매 가드에서 이 결함이 실증됐으므로 여기서는
**독립적으로 센 파일 목록과 등식**으로 비교하고, 확장 대상 두 파일을 **이름으로** 따로 단정한다.

**재라벨링은 범위를 넓혀도 위반이 아니다.** 재라벨링 지점의 다수가 compositions 에 있어
확장이 이 관용을 깨뜨릴 수 있으므로, 대표 지점들을 **이름으로 못 박아** (1) 검사 대상에 실제로
들어 있고 (2) 그런데도 위반이 아님을 함께 단정한다. "위반 0건" 만 보면 그 지점을 _본 적이
없어서_ 0인지 _보고 통과시킨_ 0인지 구분되지 않는다.

알려진 한계(현재 잡지 못함): 소비자 props 를 지역 변수에 재대입한 뒤 스프레드하는 형태
(`const p = props; <div {...p} />`), `React.cloneElement` 경유, 내부 핸들러를 스프레드로
전달하는 형태(`{...internalHandlers} {...props}`). 저장소에 실사례가 없어 규칙을 넣지 않았다.

정적으로 잡히지 않는 것(규칙 4 의 ref effect, 규칙 6 의 CSS 특이도)은 각 컴포넌트의
동작 테스트가 담당한다.

jsdom 에는 CSS 엔진이 없어 **계산된** 특이도는 확인할 수 없다. 그렇다고 "Chromatic 이 본다" 로
넘기지 마라 — 오버레이 계열 스토리는 스냅샷 시점에 닫혀 있어 Chromatic 도 보지 못한다.
대신 **주입되는 클래스 문자열과 그 셀렉터에 매칭되는 자손을 직접 단정**해라. 어떤 자손이
어떤 유틸리티에 의존하고 있었는지는 jsdom 렌더로 열거할 수 있다.

## 알려진 후속 과제

- **`data-slot` 이름과 컴포넌트 이름의 불일치 18건.** `MultiSelect*` 가 `select-*` 를 쓰고
  (매니페스트가 Select 와 MultiSelect 를 구분하지 못한다), `RoundBadge`/`SquareBadge` 가
  `badge-*` 를, `RadioGroup*` 이 `radio-*` 를 쓴다. 재라벨링이 의도된 메커니즘인 이상
  이것들은 **재라벨링을 해야 하는데 빠뜨린** 경우다. 기계 검사에 넣지 않은 이유는
  공개 API 이름 해석(`export const X = { Root, Item }`)과 `-root` 접미사 정규화가 필요하고,
  그러고도 18건짜리 예외 목록이 남아 규칙이 무의미해지기 때문이다. DOM 계약 변경이라
  소비처 테스트가 걸린다 — 별도 일감으로 다룬다.
