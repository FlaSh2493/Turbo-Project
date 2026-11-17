# Pagination

> 페이지 범위 계산을 헤드리스 훅으로 분리한 컴파운드 페이지네이션. Prev/Next, 페이지 번호, Ellipsis 를 자유롭게 조합한다.

## Rules

1. 모든 파트는 `Pagination.Root` 하위에서만 렌더링한다 (Context 미존재 시 런타임 에러)
2. `Pagination.Item` 의 `value` 는 `[1, totalPages]` 범위여야 한다
3. `Pagination.Items` 의 children 은 render prop 함수여야 한다
4. `defaultPage` 는 uncontrolled 초기값이므로 이후 변경해도 무시된다 (React 컨벤션)
5. `usePagination` 결과를 spread하면 `items`/`goTo`/`prev`/`next`/`isFirst`/`isLast` 가 외부 훅에 위임된다
6. 완전 커스텀 UI 가 필요한 경우 `usePagination` 훅을 직접 사용한다

## Examples

```tsx
<Pagination.Root defaultPage={1} totalPages={20} onPageChange={setPage} pageRange={5}>
  <Pagination.PrevTrigger />
  <Pagination.List>
    <Pagination.Items
      render={item =>
        item.type === 'page' ? (
          <Pagination.Item key={item.value} value={item.value} />
        ) : (
          <Pagination.Ellipsis key={`e-${item.index}`} />
        )
      }
    />
  </Pagination.List>
  <Pagination.NextTrigger />
</Pagination.Root>
```
