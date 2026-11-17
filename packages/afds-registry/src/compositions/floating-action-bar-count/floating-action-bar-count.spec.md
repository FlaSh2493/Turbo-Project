---
domain: common
category: display
---

# FloatingActionBarCount

> `FloatingActionBar.Card` 내부에 배치하는 선택 개수 표시 컴포지션.

## Rules

1. `FloatingActionBar.Card`의 자식으로 사용할 때만 의미가 있다
2. 도메인 표현(`n명`, `n건` 등)이 필요하면 `formatter`로 커스터마이즈한다

## Examples

```tsx
<FloatingActionBar show={selected.length > 0} onClose={() => setSelected([])}>
  <FloatingActionBar.Dim />
  <FloatingActionBar.Card>
    <FloatingActionBarCount count={selected.length} formatter={n => `${n}명 선택됨`} />
    <Button variant="ghost" size="sm">
      처리
    </Button>
    <FloatingActionBar.ClearButton />
  </FloatingActionBar.Card>
</FloatingActionBar>
```
