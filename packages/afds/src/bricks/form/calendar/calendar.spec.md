# Calendar

> 날짜 선택을 위한 완전 헤드리스 Compound 캘린더 컴포넌트. 소비자가 훅을 직접 호출해 상태를 만들고 Compound 슬롯에 prop으로 주입한다. 접근성·키보드 내비·국제화는 react-aria가 담당한다.

## Rules

1. 모든 슬롯 훅은 반드시 `state` 인자를 받아 호출해야 한다. Context에서 자동으로 가져오지 않는다.
2. `Calendar.GridBody`의 `children`은 반드시 `(date: CalendarDate) => ReactNode` 형태여야 한다.
3. `Calendar.Cell`을 GridBody children 안에서 쓸 때는 `state={cal.state}` prop을 전달한다.
4. `RangeCalendar.Cell`은 `currentMonthDate={body.startDate}`를 넘겨야 월 경계 밖 날짜가 정확히 표시된다.
5. 색상맵·툴팁 등 부가 표시는 Cell의 `children` render-prop으로 처리한다.
6. `name` 지정 시 hidden input이 자동 렌더되어 네이티브 `<form>` 제출에 참여한다. 직렬화 포맷은 `YYYY-MM-DD`이며, 값이 없으면 빈 문자열이다. `RangeCalendar`는 `startName` / `endName` 두 prop으로 각각 독립된 hidden input을 렌더한다 (단일 묶음 키 없음).

## Examples

```tsx
import { useState } from 'react'
import {
  Calendar,
  useCalendar,
  useCalendarHeading,
  useCalendarNavigation,
  useCalendarGridHeader,
  useCalendarGridBody,
} from '@turbo-project/afds'
import type { CalendarDate } from '@internationalized/date'

function MyCalendar() {
  const [date, setDate] = useState<Date>()
  const cal = useCalendar({ value: date, onValueChange: setDate, locale: 'ko-KR' })

  const heading = useCalendarHeading(cal.state, cal.locale)
  const nav = useCalendarNavigation(cal.state)
  const header = useCalendarGridHeader(cal.state)
  const body = useCalendarGridBody(cal.state, cal.locale)

  return (
    <Calendar cal={cal}>
      <Calendar.Header>
        <Calendar.PreviousButton {...nav.prev} />
        <Calendar.Heading title={heading.title} />
        <Calendar.NextButton {...nav.next} />
      </Calendar.Header>
      <Calendar.Grid>
        <Calendar.GridHeader weekDays={header.weekDays} />
        <Calendar.GridBody gridProps={body.gridProps} weeks={body.weeks}>
          {(date: CalendarDate) => <Calendar.Cell state={cal.state} date={date} />}
        </Calendar.GridBody>
      </Calendar.Grid>
    </Calendar>
  )
}
```
