# Flex

> CSS Flexbox를 props로 제어하는 레이아웃 컴포넌트

## Rules

1. `gap` 값은 AFDS spacing 토큰 문자열 (예: `"spacing-8"`, `"spacing-24"`) — 내부적으로 `gap-afds-spacing-*` 클래스로 변환된다
2. 1D 레이아웃에 사용 — 2D는 `Grid` 사용
3. 수직 스택은 `VStack`, 수평 스택은 `HStack` 단축 사용 권장

## Examples

```tsx
<Flex direction="row" gap="spacing-4" align="center">
  <span>아이템 1</span>
  <span>아이템 2</span>
</Flex>
```
