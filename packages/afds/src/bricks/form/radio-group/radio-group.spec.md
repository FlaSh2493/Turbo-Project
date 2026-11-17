# RadioGroup

> 디자인 토큰이 적용된 라디오 그룹 dot-notation 합성 컴포넌트. base-ui RadioGroup + AFDS 전용 Container/Indicator/Label 파트로 구성.

## Rules

1. 비활성 상태가 필요하면 `Root`/`Item` 등 관련 파트에 `disabled`를 일관되게 전달
2. `Item` 내부에 `Indicator` 중첩
3. controlled — `value` + `onValueChange`, uncontrolled — `defaultValue`
4. `RadioGroup.Indicator`는 dot을 내장한다. 커스텀 dot은 `children`으로 전달한다.

## Examples

```tsx
const [value, setValue] = useState('a')
return (
  <RadioGroup.Root value={value} onValueChange={v => setValue(String(v))}>
    {options.map(opt => (
      <RadioGroup.Container key={opt.value}>
        <RadioGroup.Item value={opt.value}>
          <RadioGroup.Indicator />
        </RadioGroup.Item>
        <RadioGroup.Label>{opt.label}</RadioGroup.Label>
      </RadioGroup.Container>
    ))}
  </RadioGroup.Root>
)
```
