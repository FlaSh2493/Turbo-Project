# SmoothList

> 리스트 항목 순서 변경 시 FLIP 애니메이션으로 자연스럽게 위치를 이동하는 컴포넌트

## Rules

1. 모든 children에 `data-layout-id` 속성 필수 — 없으면 애니메이션 미동작
2. `as` prop으로 `ul`/`ol` 등 시맨틱 태그 지정
3. `duration`은 200–400ms 권장

## Examples

```tsx
<SmoothList as="ul" duration={300}>
  {items.map(item => (
    <li key={item.id} data-layout-id={item.id}>
      {item.name}
    </li>
  ))}
</SmoothList>
```
