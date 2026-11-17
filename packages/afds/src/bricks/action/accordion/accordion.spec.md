# Accordion

> 클릭으로 내용을 펼치고 접을 수 있는 복합(Compound) 컴포넌트. 슬롯 분리형으로 설계되어 디폴트 비주얼 프리셋과 자유로운 합성 모두 지원한다.

## Rules

1. 디폴트 비주얼은 `Typography`(라벨) + `Indicator` + `Body` 조합으로 구성한다
2. `Accordion.Item` 의 `value` prop 중복 금지
3. `Accordion.Trigger` 는 반드시 `Accordion.Item` 내부에 배치
4. 제어 시 `value` 와 `onValueChange` 동시 사용
5. 시각·동작 조정 = `className`, 구조·아이콘 교체 = `children`, 상태 주입 필요 시 Primitive
6. `Indicator` 의 회전 외 동작은 Indicator 미사용 + raw `data-panel-open` CSS 셀렉터 활용

## Examples

```tsx
<Accordion.Root defaultValue={['item-1']}>
  <Accordion.Item value="item-1">
    <Accordion.Trigger>
      <Typography variant="title3">제목</Typography>
      <Accordion.Indicator />
    </Accordion.Trigger>
    <Accordion.Content>
      <Accordion.Body>내용</Accordion.Body>
    </Accordion.Content>
  </Accordion.Item>
</Accordion.Root>
```
