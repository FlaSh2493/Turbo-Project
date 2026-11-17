# Switch

> 즉시 상태가 전환되는 토글 — base-ui Switch dot-notation 그대로 노출

## Rules

1. `Root` 안에 `Thumb`를 반드시 포함한다
2. `checked` + `onCheckedChange`로 제어, `defaultChecked`로 비제어
3. 폼 제출 시 `Root`에 `name` prop 추가
4. 인접 레이블이 없으면 `Root`에 `aria-label` 필수

## Examples

```tsx
<Switch.Root checked={checked} onCheckedChange={setChecked} aria-label="알림 토글">
  <Switch.Thumb />
</Switch.Root>
```
