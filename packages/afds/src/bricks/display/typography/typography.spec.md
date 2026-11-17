# Typography

> AFDS 타이포그래피 스케일을 적용하는 텍스트 컴포넌트

## Rules

1. `as` prop으로 렌더링 태그 지정 — `heading` 계열은 `h1`–`h6` 사용 (기본 `span`)
2. 색상은 반드시 `color` prop으로만 지정 — `className`에 임의 색상 금지
3. `color` prop 값: 시맨틱(`primary`, `secondary`, `disabled`, `inverse`, `brand`, `brand-subtle`, `warning`, `gradient-ai`) 또는 팔레트(`gray-*`, `brand-*`, `extra-ui-*`, `graph-*`)

## Examples

```tsx
<Typography variant="heading1" as="h1" color="text-primary">
  페이지 제목
</Typography>
```
