# Progress

> 작업 진행률을 가로 바로 표시하는 합성 컴포넌트 — Root · Track · Indicator · Value · Label을 조합해 사용한다

## Rules

1. `Progress.Track`·`Progress.Indicator`는 반드시 `Progress.Root` 안에서 사용한다
2. `Progress.Value`·`Progress.Label`도 반드시 `Progress.Root` 안에서 사용한다 (context 의존)
3. `value`는 0–`max` 범위 권장 (범위 초과 시 자동 클램핑)
4. 시각적 높이 커스텀은 `Progress.Track`의 `className`으로 제어한다

## Examples

```tsx
// 기본
<Progress value={60}>
  <Progress.Track>
    <Progress.Indicator />
  </Progress.Track>
</Progress>

// 레이블 + 높이 커스텀
<Progress value={60} aria-label="파일 업로드 진행률">
  <Progress.Label>파일 업로드 중</Progress.Label>
  <Progress.Track className="h-2">
    <Progress.Indicator />
  </Progress.Track>
</Progress>
```
