---
domain: common
category: form
---

# PeriodFilter

> Before / After / Range 모드와 사용자 정의 빠른 옵션을 묶은 기간 필터 패널. 자체 오버레이는 가지지 않으며 호출자가 `Popover.Content` 등에 배치한다.

## Rules

1. 날짜는 로컬 타임 기준 `YYYY-MM-DD` 문자열로 직렬화된다 — 값 형태: `{ mode: 'after'|'before', date }`, `{ mode: 'range', from, to }`, `{ mode: extraOptionValue }`, 또는 `null`
2. Apply 시 `selectedMode`가 없으면 `null`을 emit(필터 해제) — `after`/`before`는 날짜 있을 때만, `range`는 `from`·`to` 둘 다 있어야 emit
3. Reset 버튼은 내부 상태만 초기화한다 — 외부 상태에 반영하려면 사용자가 Apply를 다시 눌러야 한다
4. `disabledAfter` Date를 지정하면 그 날짜보다 이후는 캘린더에서 disabled 처리된다 — 미지정 시 비활성화 규칙 없음 (SSR hydration 안전성을 위해 호출자가 명시적으로 전달)
5. `extraOptions`를 누르면 즉시 모드가 그 값으로 설정되고 아코디언은 닫힌다 (`{ mode: optionValue }`로 반환)

## Examples

```tsx
<Popover.Root open={open} onOpenChange={setOpen}>
  <Popover.Trigger render={<Button>{label}</Button>} />
  <Popover.Content align="start" className="p-0">
    <PeriodFilter
      value={value}
      onChange={setValue}
      onClose={() => setOpen(false)}
      disabledAfter={new Date()}
      extraOptions={[
        { value: 'today', label: '오늘' },
        { value: 'last-7d', label: '최근 7일' },
      ]}
      afterLabel="시작일 이후"
      beforeLabel="종료일 이전"
      rangeLabel="기간 지정"
      resetText="초기화"
      cancelText="취소"
      applyText="적용"
    />
  </Popover.Content>
</Popover.Root>
```
