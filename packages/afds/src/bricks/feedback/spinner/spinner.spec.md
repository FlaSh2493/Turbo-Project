# Spinner

> 로딩 상태를 나타내는 스피너 컴포넌트

## Rules

1. `fullscreen="container"` 사용 시 부모 요소에 `position: relative` 필요
2. `fullscreen="viewport"`는 전역 로딩에만 사용

## Examples

```tsx
<div style={{ position: 'relative', height: 200 }}>
  <Spinner size="md" fullscreen="container" dim="white" />
</div>
```
