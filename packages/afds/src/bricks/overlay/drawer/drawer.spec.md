# Drawer

> 화면 가장자리에서 슬라이드로 나타나는 오버레이 컴포넌트

## Rules

1. `Drawer.Title` 사용 필수 — `aria-labelledby` 자동 연결
2. `open`과 `onOpenChange`로 제어
3. 포커스 트랩과 `Esc` 닫기 자동 적용
4. `Drawer.Panel`은 반드시 `Drawer.Viewport` 안에 배치해야 한다

## Examples

```tsx
<Drawer.Root open={open} onOpenChange={setOpen} direction="right">
  <Drawer.Overlay />
  <Drawer.Viewport>
    <Drawer.Panel>
      <Drawer.Header>
        <Drawer.Title>드로어 제목</Drawer.Title>
      </Drawer.Header>
      <Drawer.Content>콘텐츠</Drawer.Content>
      <Drawer.Footer>
        <Drawer.Close>닫기</Drawer.Close>
      </Drawer.Footer>
    </Drawer.Panel>
  </Drawer.Viewport>
</Drawer.Root>
```
