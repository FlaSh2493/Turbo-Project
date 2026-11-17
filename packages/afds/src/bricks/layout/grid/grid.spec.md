# Grid

> CSS Grid를 props로 제어하는 2D 레이아웃 컴포넌트

## Rules

1. `columns`에 숫자 전달 시 `repeat(N, minmax(0, 1fr))` 적용, 문자열 전달 시 그대로 사용
2. 2D 레이아웃에만 사용 — 1D는 `Flex` 사용
3. `gap`/`gapX`/`gapY`로 행/열 간격 개별 제어

## Examples

```tsx
<Grid columns={3} gap="spacing-20">
  <div>셀 1</div>
  <div>셀 2</div>
  <div>셀 3</div>
</Grid>
```
