# FadeIn

> 마운트 시 페이드인 애니메이션을 적용하는 래퍼 컴포넌트

## Rules

1. `duration`/`delay`는 밀리초(ms) 단위 숫자
2. `as` prop으로 렌더링 태그 변경 (기본 `div`)
3. `prefers-reduced-motion` 환경에서는 즉시 표시 고려

## Examples

```tsx
<FadeIn duration={300} delay={100}>
  <p>페이드인으로 나타나는 콘텐츠</p>
</FadeIn>
```
