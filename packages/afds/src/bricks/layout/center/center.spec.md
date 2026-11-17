# Center

> 자식 요소를 수직·수평 중앙 정렬하는 Flex 프리셋 컴포넌트

## Rules

1. 부모 요소에 명시적 높이/너비 필요
2. `inline` prop으로 `inline-flex` 렌더링
3. 모든 `FlexProps` 상속 — 필요 시 `align`/`justify` 오버라이드 가능

## Examples

```tsx
<Center className="h-64">
  <span>중앙 정렬 콘텐츠</span>
</Center>
```
