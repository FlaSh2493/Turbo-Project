// `*RootProps` 는 컴포지션(date-picker · range-date-picker)이 Omit 해서 자기 Props 를 만든다.
// afds-registry CLI 가 컴포지션을 배포할 때 깊은 경로 import 를 배럴(`@turbo-project/afds/bricks`)로
// 접으므로, 배럴에 없으면 소비처에서 TS2305 로 깨진다. 이 배럴은 공개 표면을 의도적으로
// 통제하는 named 재수출이므로 — 실제로 소비되는 것만 올린다.
export { Calendar, type CalendarCellState, type CalendarRootProps } from './calendar'
export {
  RangeCalendar,
  type DateRange,
  type RangeCalendarCellState,
  type RangeCalendarRootProps,
} from './range-calendar'
