# Container

> 콘텐츠의 최대 너비와 수평 중앙 정렬을 설정하는 레이아웃 컴포넌트

## Rules

1. 페이지 레이아웃에서 `Section > Container` 패턴 권장
2. `center` prop(기본 `true`)으로 `mx-auto` 제어
3. 중첩 `Container` 사용 금지

## Examples

```tsx
<Container size="lg">
  <p>콘텐츠</p>
</Container>
```
