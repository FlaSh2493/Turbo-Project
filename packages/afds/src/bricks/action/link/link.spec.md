# Link

> 텍스트 형식의 내비게이션 링크 컴포넌트

## Rules

1. 외부 링크는 `target="_blank"`와 `rel="noopener noreferrer"` 함께 설정
2. 네비게이션 목적에만 사용 — 버튼 대체 금지
3. 버튼 스타일이 필요하면 `Button` + `render` prop 패턴 사용

## Examples

```tsx
<Link href="https://example.com" target="_blank" rel="noopener noreferrer">
  외부 링크
</Link>
```
