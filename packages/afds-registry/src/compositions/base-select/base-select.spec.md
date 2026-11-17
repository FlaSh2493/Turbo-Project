---
domain: common
category: form
---

# BaseSelect

> 단일 선택 + 옵션 배열 props만 받는 표준 Select 합성.

## Rules

1. 옵션 시그니처는 `{ value, label }`로 고정 — 아이콘·설명·그룹 등이 필요하면 `Select` Compound를 직접 사용한다
2. `Select`의 모든 prop을 통과시키지 않는다 — 새 prop이 필요하면 실제 사용 케이스를 먼저 확인하고 추가한다

## Examples

```tsx
<BaseSelect
  options={[
    { value: 'all', label: '전체' },
    { value: 'active', label: '활성' },
    { value: 'paused', label: '일시중지' },
  ]}
  value={value}
  onValueChange={setValue}
  placeholder="상태 선택"
  hasSearch
  searchPlaceholder="검색"
  contentWidth="200px"
/>
```
