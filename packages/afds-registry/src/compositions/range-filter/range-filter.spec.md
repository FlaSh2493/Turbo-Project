---
domain: common
category: form
---

# RangeFilter

> 숫자 최소/최대값 두 입력 + Reset/Cancel/Apply 패널 형태의 범위 필터. 자체 오버레이는 가지지 않으며 호출자가 `Popover.Content` 등에 배치한다.

## Rules

1. 입력값은 항상 `string`으로 관리되며, Apply 시 `min.trim()`/`max.trim()`로 emit된다
2. Apply 클릭 전에는 에러 스타일이 노출되지 않는다 — Apply 후 `validateRange` 실패가 있으면 `onChange` 호출 없이 입력에만 에러 스타일이 부여된다
3. Reset 버튼은 내부 상태만 비운다 — 외부 상태에 반영하려면 사용자가 Apply를 다시 눌러야 한다
4. 검증 규칙(스텝·정수 강제 등)은 `validate-range.ts`에 격리되어 있다 — 변경 시 그 파일을 우선 검토한다
5. 날짜 범위는 `PeriodFilter`를 사용한다

## Examples

```tsx
<Popover.Root open={open} onOpenChange={setOpen}>
  <Popover.Trigger render={<Button>{label}</Button>} />
  <Popover.Content align="start">
    <RangeFilter
      value={value}
      onChange={setValue}
      onClose={() => setOpen(false)}
      minLabel="최소"
      maxLabel="최대"
      minValue={0}
      maxValue={1_000_000}
      resetText="초기화"
      cancelText="취소"
      applyText="적용"
    />
  </Popover.Content>
</Popover.Root>
```
