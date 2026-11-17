---
domain: common
category: form
---

# CheckBoxCard

> 테두리 카드형(선택 리스트 UI)으로 표시되는 체크박스 컴포지션. 네이티브 체크박스를 숨기고 카드 전체를 선택 영역으로 사용한다.

## Rules

1. `CheckBoxGroup` 내부에서 사용할 때는 `value` prop 필수
2. `label` 없이 사용할 때는 `aria-label` 필수
3. `checked`는 `boolean | 'indeterminate'`를 지원하며 controlled/uncontrolled 모두 자동 추적된다

## Examples

```tsx
<CheckBoxCard label="선택 항목" checked={selected} onCheckedChange={setSelected} />
```
