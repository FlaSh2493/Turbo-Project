# CheckBoxGroup

> 디자인 토큰이 적용된 체크박스 그룹 dot-notation 합성 컴포넌트. base-ui CheckboxGroup을 래핑한 `Root` 파트로 구성. 개별 체크박스는 `CheckBox.*`와 조합해 사용한다.

## Rules

1. 개별 체크박스는 `CheckBox.*`(`CheckBox.Root` 등)로 구성한다
2. controlled — `value` + `onValueChange`, uncontrolled — `defaultValue`

## Examples

```tsx
<CheckBoxGroup.Root defaultValue={['apple']} className="flex flex-col gap-2">
  <CheckBox.Container>
    <CheckBox.Root value="apple" defaultChecked>
      <CheckBox.Indicator keepMounted>
        <CheckIcon size={16} />
      </CheckBox.Indicator>
    </CheckBox.Root>
    <CheckBox.Label>사과</CheckBox.Label>
  </CheckBox.Container>
</CheckBoxGroup.Root>
```
