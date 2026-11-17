---
domain: common
category: form
---

# RadioCard

> 테두리 카드형(선택 리스트 UI)으로 표시되는 라디오 컴포지션. 카드 전체를 선택 영역으로 사용하며 라벨(좌)과 라디오 dot(우)을 함께 배치한다.

## Rules

1. base-ui RadioGroup 안에서 사용한다 — `RadioGroup.Root`(components) 또는 `BaseRadioGroup`(compositions) 어느 쪽이든 가능. 선택 상태는 그룹이 소유한다.
2. 각 카드에 고유 `value`를 지정한다 (필수)
3. `label` 없이 사용할 때는 `aria-label`을 전달한다

## Examples

```tsx
<RadioGroup.Root defaultValue="b">
  <RadioCard value="a" label="옵션 A" />
  <RadioCard value="b" label="옵션 B" />
</RadioGroup.Root>
```
