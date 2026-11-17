---
domain: common
category: form
---

# GhostSelect

> 헤더·타이틀 영역에서 사용하는 보더 없는 고스트 스타일 Select.

## Rules

1. 옵션 시그니처는 `{ value, label, tooltip? }`로 고정 — 다른 형태(아이콘, 설명, 그룹 등)는 `Select`를 직접 사용한다
2. 옵션에 `tooltip`을 지정하면 우측에 InfoCircle + Tooltip이 자동 노출된다
3. 검색·그룹화·다수 옵션이 필요하면 `Select` Compound 또는 `BaseSelect`를 사용한다

## Examples

```tsx
<GhostSelect
  value={metric}
  onValueChange={setMetric}
  options={[
    { value: 'clicks', label: '클릭수' },
    { value: 'impressions', label: '노출수', tooltip: '광고가 사용자에게 노출된 횟수' },
    { value: 'ctr', label: 'CTR' },
  ]}
/>
```
