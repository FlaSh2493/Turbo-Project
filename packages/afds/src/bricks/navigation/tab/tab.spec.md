# Tab

> 콘텐츠를 탭으로 전환하는 내비게이션 컴포넌트

## Rules

1. `Tab.Tab`의 `value`와 `Tab.Panel`의 `value` 반드시 일치
2. 화살표 키로 탭 간 탐색
3. `value`와 `onValueChange`로 제어

## Examples

```tsx
<Tab.Root defaultValue="tab1">
  <Tab.List>
    <Tab.Tab value="tab1">탭 1</Tab.Tab>
    <Tab.Tab value="tab2">탭 2</Tab.Tab>
  </Tab.List>
  <Tab.Panel value="tab1">탭 1 콘텐츠</Tab.Panel>
  <Tab.Panel value="tab2">탭 2 콘텐츠</Tab.Panel>
</Tab.Root>
```
