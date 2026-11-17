# Popover

> 트리거 근처에 떠 있는 추가 정보나 액션 패널 컴포넌트

## Rules

1. `Popover.Arrow`로 방향 화살표 추가
2. `side`/`align` prop으로 위치 제어
3. 열림 시 콘텐츠로 포커스 이동, `Esc`로 닫기 자동
4. `open`과 `onOpenChange`로 제어

## Examples

```tsx
<Popover.Root>
  <Popover.Trigger>열기</Popover.Trigger>
  <Popover.Content side="bottom">
    <p>팝오버 내용</p>
    <Popover.Arrow />
  </Popover.Content>
</Popover.Root>
```
