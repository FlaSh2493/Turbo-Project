# FloatingActionBar

> 화면 하단에 고정되어 슬라이드로 표시되는 액션 바 컴포넌트

## Rules

1. `show` prop으로 표시/숨김 제어
2. `Dim`/`Card`/`ClearButton`은 모두 명시 슬롯 — 자동 주입 없음
3. 스크롤 이벤트 기반 `show` 전환은 소비자가 직접 구현

## Examples

```tsx
<FloatingActionBar show={isVisible} onClose={() => setVisible(false)}>
  <FloatingActionBar.Dim />
  <FloatingActionBar.Card>
    <Button variant="ghost" size="sm">
      적용
    </Button>
    <FloatingActionBar.ClearButton />
  </FloatingActionBar.Card>
</FloatingActionBar>
```
