---
domain: common
category: navigation
---

# PaginationBar

> Total 카운트(좌측) + Pagination(중앙)을 한 줄에 배치한 페이지 하단 바.

## Rules

1. 좌측 라벨 포맷은 `totalFormatter`로 다국어·접두어를 자유롭게 바꾼다 (기본 `Total {n}`)
2. 페이지 사이즈 셀렉터·점프 입력 등 추가 컨트롤이 필요하면 이 컴포넌트를 확장하지 말고 별도 합성을 만든다

## Examples

```tsx
<PaginationBar
  total={total}
  currentPage={page}
  totalPages={totalPages}
  onPageChange={setPage}
  totalFormatter={n => `전체 ${n.toLocaleString()}건`}
/>
```
