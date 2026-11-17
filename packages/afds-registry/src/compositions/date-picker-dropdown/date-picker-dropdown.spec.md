---
domain: common
category: form
---

# DatePickerDropdown

> 캘린더 아이콘 트리거 + Popover로 펼쳐지는 단일 날짜 선택기. 선택 시 자동으로 닫히고 `ko-KR`(`YYYY. MM. DD`) 포맷으로 표시된다.

## Rules

1. 단일 날짜 전용 — 범위·다중 선택이 필요하면 `PeriodFilter` 또는 `DatePicker`(range mode)를 직접 합성한다
2. `onValueChange`는 `Date | undefined`만 처리한다 — 다른 모드 값(`Date[]`, `{from,to}`)은 무시된다
3. 트리거 라벨을 커스터마이즈하려면 `triggerLabel`로 전달한다

## Examples

```tsx
<DatePickerDropdown value={date} onValueChange={setDate} placeholder="날짜 선택" />
```
