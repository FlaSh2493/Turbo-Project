---
domain: common
category: overlay
---

# OverflowTooltip

> 텍스트가 실제로 잘릴(ellipsis · line-clamp) 때만 자동으로 Tooltip을 띄우는 합성.

## Rules

1. 기본(`axis="inline"`)은 단일 라인 ellipsis(가로) 판정이다. 여러 줄 line-clamp 는 `axis="block"` 과
   `className="line-clamp-N"` 을 함께 준다 — `block` 은 `truncate`(nowrap)를 붙이지 않고 세로 넘침을 본다.
   **`line-clamp-N` 없이 `block` 만 주면 잘리지 않으므로 툴팁이 열리지 않는다**
2. 너비 제약(`w-*`, `max-w-*`)은 `className`을 통해 wrapper에 부여한다
3. overflow가 아닐 때는 툴팁 팝업이 열리지 않는다(트리거는 항상 감싸져 있다) — 항상 노출해야 하면 `Tooltip`을 직접 사용한다.
   단 `open`을 **명시하면 제어 컴포넌트로 전환**되어 잘리지 않아도 그 값을 따른다
4. `onOpenChange`는 내부 overflow 감지를 **덮지 않고 합성**된다 — 소비자 콜백이 먼저 실행되고
   내부 감지가 이어진다. 소비자 콜백이 throw하면 내부 감지가 실행되지 않는다
5. 열리는 순간의 레이아웃으로 잘림을 확정한다. 그 전의 판정(`useOverflowDetect`)은
   ResizeObserver·폰트 로딩 완료에 맞춰 갱신되는 보조 값이다

## Hook · helpers

툴팁 없이 잘림 여부만 필요하거나 직접 툴팁을 조립할 때 쓴다.

- `useOverflowDetect(axis, text?)` → `{ node, setNode, overflow, measure }`. `setNode` 를 대상 요소의
  `ref` 로 넘긴다. 노드를 ref 객체가 아니라 상태로 들고 있어서, 훅을 직접 조립하는 소비자가 요소를
  교체(예: 툴팁 트리거 안쪽으로 이동)해도 관찰 대상이 갱신된다. `OverflowTooltip` 은 노드를 교체하지 않는다.
  요소 크기·`document.fonts.ready` 가 바뀌면 다시 잰다
- `isTextTruncated({ scrollWidth, clientWidth })` — 가로 잘림
- `isTextClamped({ scrollHeight, clientHeight })` — 세로 클램프

## Examples

```tsx
<OverflowTooltip className="w-[200px]">매우 긴 캠페인 이름이 들어갈 수도 있는 셀</OverflowTooltip>
```

`open`을 넘기면 제어 컴포넌트가 된다 — 잘림 여부와 무관하게 호출자가 결정한다.

```tsx
<OverflowTooltip open={isHelpMode} onOpenChange={setIsHelpMode}>
  매우 긴 캠페인 이름
</OverflowTooltip>
```

여러 줄 클램프:

```tsx
<OverflowTooltip axis="block" className="line-clamp-2">
  여러 줄로 이어지는 긴 설명 문장
</OverflowTooltip>
```

훅 단독 사용:

```tsx
import { useOverflowDetect } from '.' // 설치 위치에 맞게 경로를 바꾼다

const { setNode, overflow } = useOverflowDetect('inline', label)
<span ref={setNode} className="truncate">{label}</span>
```
