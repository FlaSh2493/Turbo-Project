# SegmentControl

> 라디오처럼 동작하는 탭 형식의 단일 선택 컴포넌트

## Rules

1. 2–6개 옵션에 적합
2. `value`와 `onValueChange`로 제어, `defaultValue`로 비제어 초기값 설정
3. `SegmentControl.Item`의 `value` prop 중복 금지
4. `aria-label`을 Root에 반드시 추가
5. 선택 인디케이터를 표시하려면 `<SegmentControl.Indicator />`를 Root 내부에 두어야 한다 — 누락 시 선택 표시가 보이지 않음

## Examples

```tsx
<SegmentControl.Root defaultValue="monthly" aria-label="결제 주기 선택">
  <SegmentControl.Indicator />
  <SegmentControl.Item value="monthly">월간</SegmentControl.Item>
  <SegmentControl.Item value="yearly">연간</SegmentControl.Item>
</SegmentControl.Root>
```
