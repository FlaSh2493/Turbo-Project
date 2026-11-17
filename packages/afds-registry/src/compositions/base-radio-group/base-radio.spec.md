# Radio

> RadioGroup 내에서 개별 선택지를 표현하는 라디오 버튼 아이템.

## Rules

1. `RadioGroup` 내부에서는 반드시 고유한 `value`를 전달한다
2. 단독 사용 시에만 `checked`/`onCheckedChange`로 상태를 직접 관리한다 — 그룹 내부에서는 그룹이 상태를 소유한다

## Examples

```tsx
<RadioGroup value={selected} onValueChange={setSelected}>
  <Radio value="option1" label="옵션 1" />
  <Radio value="option2" label="옵션 2" />
</RadioGroup>
```
