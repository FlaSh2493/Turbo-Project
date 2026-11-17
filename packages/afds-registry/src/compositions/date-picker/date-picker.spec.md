---
domain: common
category: form
---

# DatePicker

> `Calendar`를 표준 패널 스타일(테두리·라운드·그림자·패딩)로 감싼 합성. 페이지·폼 영역에 항상 펼쳐진 상태로 노출한다.

## Rules

1. Popover/Drawer 등 드롭다운 형태가 필요하면 `DatePickerDropdown`을 사용한다
2. `footer`는 캘린더 하단에 그대로 렌더된다 — 빠른 선택·적용 버튼 등을 배치한다
3. 그 외 캘린더 동작·표시 옵션은 `CalendarProps`를 그대로 따른다

## Examples

```tsx
<DatePicker
  mode="single"
  selected={date}
  onSelect={setDate}
  footer={
    <div className="flex justify-end pt-3">
      <Button onClick={handleApply}>적용</Button>
    </div>
  }
/>
```
