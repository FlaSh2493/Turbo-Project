---
domain: common
category: display
---

# BaseTable

> TanStack Table 기반의 고성능 데이터 테이블 컴포넌트.

## Rules

1. 외부에서 `useTable`(`useReactTable` 래퍼)로 생성한 인스턴스를 `<BaseTable.Root>`에 `table` prop으로 **한 번만** 주입한다 — `Root`가 `TableContext`로 하위에 제공한다
2. `<BaseTable.Header>` / `<BaseTable.Body>`는 `table` prop을 받지 않고 `Root`가 제공한 context에서 인스턴스를 소비한다 (반드시 `Root` 하위에서만 사용)
3. 컬럼 트랙은 `meta.width` / `meta.minWidth` / `meta.maxWidth`로만 정의한다 — 미지정 시 `minmax(0, 1fr)`로 동작
4. 고정 컬럼(`columnPinning`)은 정확한 sticky 오프셋을 위해 `meta.width`를 반드시 지정한다
5. 빈 상태는 `<BaseTable.Body>` 대신 `<BaseTable.Fallback>`을 조건부로 렌더링한다

## Examples

```tsx
const table = useTable({ data, columns })

<BaseTable.Root table={table}>
  <BaseTable.Header />
  {table.getRowModel().rows.length === 0 ? (
    <BaseTable.Fallback>데이터가 없습니다.</BaseTable.Fallback>
  ) : (
    <BaseTable.Body />
  )}
</BaseTable.Root>
```
