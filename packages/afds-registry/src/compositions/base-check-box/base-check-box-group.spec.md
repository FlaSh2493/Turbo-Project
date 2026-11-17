# CheckBoxGroup

> 여러 체크박스의 선택 상태를 통합 관리하는 그룹 컴포넌트.

## Rules

1. children `CheckBox`에는 고유한 `value`가 반드시 부여되어야 한다 — 중복 금지
2. 그룹 자체에 `aria-label`을 부여해 스크린리더가 묶음을 인식하도록 한다

## Examples

```tsx
<CheckBoxGroup value={selected} onValueChange={setSelected} aria-label="관심 항목 선택">
  <CheckBox value="a" label="항목 A" />
  <CheckBox value="b" label="항목 B" />
</CheckBoxGroup>
```
