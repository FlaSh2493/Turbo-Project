# CheckBox

> 디자인 토큰이 적용된 체크박스 dot-notation 합성 컴포넌트. base-ui Checkbox + AFDS 전용 Container/Indicator/Label 파트로 구성. **controlled/uncontrolled 모두 자동 지원**.

## Rules

1. controlled: `checked` + `onCheckedChange`, uncontrolled: `defaultChecked`. **둘 다 시각 자동 추적됨**
2. Indicator는 `keepMounted` 권장 (애니메이션 호환)
3. `CheckBox.Indicator`는 check 아이콘(`children`)과 indeterminate 마크(`indeterminateMark`)를 통합한다. 커스텀 아이콘은 `children`으로, indeterminate 커스텀은 `indeterminateMark` prop으로 전달한다.

## Examples

```tsx
<CheckBox.Container>
  <CheckBox.Root defaultChecked>
    <CheckBox.Indicator keepMounted />
  </CheckBox.Root>
  <CheckBox.Label>동의합니다</CheckBox.Label>
</CheckBox.Container>
```

### Controlled

```tsx
const [checked, setChecked] = useState(false)
return (
  <CheckBox.Container>
    <CheckBox.Root checked={checked} onCheckedChange={setChecked}>
      <CheckBox.Indicator keepMounted />
    </CheckBox.Root>
    <CheckBox.Label>동의합니다</CheckBox.Label>
  </CheckBox.Container>
)
```

### Indeterminate

```tsx
<CheckBox.Container>
  <CheckBox.Root indeterminate>
    <CheckBox.Indicator keepMounted />
  </CheckBox.Root>
  <CheckBox.Label>부분 선택</CheckBox.Label>
</CheckBox.Container>
```

### 커스텀 아이콘

```tsx
<CheckBox.Indicator keepMounted>
  <StarIcon size={16} />
</CheckBox.Indicator>
```
