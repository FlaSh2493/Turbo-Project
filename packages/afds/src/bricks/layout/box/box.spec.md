# Box

> 의미 없는 `<div>` 컨테이너 역할의 범용 레이아웃 컴포넌트

## Rules

1. 시맨틱 의미가 필요하면 Box 대신 적절한 태그(`<section>`, `<article>`, `<aside>` 등)를 직접 사용
2. 스타일은 `className`으로만 추가
3. 내부 로직이나 인터랙션이 필요하면 전용 컴포넌트 사용

## Examples

```tsx
<Box className="p-afds-spacing-16">콘텐츠</Box>
```
