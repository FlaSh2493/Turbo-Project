---
domain: common
category: form
---

# CheckBox

> 단독 또는 그룹으로 사용하는 체크박스 컴포넌트.

## Rules

1. `CheckBoxGroup` 내부에서 사용할 때는 `value` prop 필수
2. 인접한 시각 레이블이 없으면 `aria-label` 필수

## Examples

```tsx
<CheckBox variant="default" label="동의합니다" checked={agreed} onCheckedChange={setAgreed} />
```
