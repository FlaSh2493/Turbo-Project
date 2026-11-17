# Stack

> 수직(`VStack`) 또는 수평(`HStack`) 방향으로 자식을 배치하는 Flex 프리셋 컴포넌트

## Rules

1. `VStack`은 세로 스택 — 기본 `align="stretch"`, `width="100%"`
2. `HStack`은 가로 스택 — 기본 `align="center"`
3. 모든 `FlexProps` 상속 가능

## Examples

```tsx
<VStack gap="spacing-4">
  <span>항목 1</span>
  <span>항목 2</span>
</VStack>
```
