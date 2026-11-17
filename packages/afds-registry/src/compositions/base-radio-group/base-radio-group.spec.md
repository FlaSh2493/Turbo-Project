---
domain: common
category: form
---

# RadioGroup

> 단일 선택을 위한 라디오 버튼 그룹 컴포넌트.

## Rules

1. children `Radio`에는 고유한 `value`가 반드시 부여되어야 한다 — 중복 금지
2. 그룹 자체에 `aria-label`을 부여한다
3. 화살표 키 탐색·`Space` 선택은 기본 동작 — 자식에서 키 이벤트를 가로채지 않는다

## Examples

```tsx
<RadioGroup value={selected} onValueChange={setSelected} aria-label="결제 수단 선택">
  <Radio value="card" label="신용카드" />
  <Radio value="bank" label="계좌이체" />
</RadioGroup>
```
