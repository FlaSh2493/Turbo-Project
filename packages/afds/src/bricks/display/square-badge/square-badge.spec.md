# SquareBadge

> 사각형 형태의 뱃지 복합 컴포넌트

## Rules

1. `variant`와 `color`를 Root에 지정하면 텍스트 색이 Content까지 상속된다
2. 원형 뱃지 필요 시 `RoundBadge` 사용
3. `outlined`의 border 두께 변경은 `className`으로 처리

## Examples

```tsx
<SquareBadge.Root variant="filled" color="brand" aria-label="브랜드">
  <SquareBadge.Content>NEW</SquareBadge.Content>
</SquareBadge.Root>

<SquareBadge.Root variant="outlined" color="success" aria-label="성공">
  <SquareBadge.Content>NEW</SquareBadge.Content>
</SquareBadge.Root>
```
