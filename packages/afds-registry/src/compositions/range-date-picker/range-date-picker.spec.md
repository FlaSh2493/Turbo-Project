---
domain: common
category: form
---

# RangeDatePicker

> `RangeCalendar`를 표준 패널 스타일(테두리·라운드·그림자·패딩)로 감싼 범위 날짜 선택 합성.

## Rules

1. 시작일·종료일 두 날짜를 한 패널에서 선택한다 — 단일 날짜는 `DatePicker`/`DatePickerDropdown`을 사용한다
2. `footer`는 패널 하단에 그대로 렌더된다 — 빠른 선택·적용 버튼 등을 배치한다
3. `isDateUnavailable`로 선택 불가 날짜를 제어한다 (예: 미래 차단)

## Examples

```tsx
<RangeDatePicker
  value={range}
  onValueChange={setRange}
  footer={
    <div className="flex justify-end pt-3">
      <Button onClick={handleApply}>적용</Button>
    </div>
  }
/>
```
