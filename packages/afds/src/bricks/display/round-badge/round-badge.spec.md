# RoundBadge

> 원형 도트와 텍스트로 구성된 뱃지 복합 컴포넌트

## Rules

1. `RoundBadge.Dot` 색상은 시맨틱 `color` prop으로 지정한다 (`disabled` / `success` / `warning` / `error`).
2. 정의된 4종 외 색상이 필요할 경우에만 `className`으로 `bg-afds-*` 토큰 클래스를 직접 지정한다.
3. 상태 전달 시 Root에 `aria-label` 추가.
4. 사각형 뱃지 필요 시 `SquareBadge` 사용.

## Examples

```tsx
<RoundBadge.Root aria-label="온라인 상태">
  <RoundBadge.Dot color="success" />
  <RoundBadge.Content>온라인</RoundBadge.Content>
</RoundBadge.Root>

// 토큰 외 색상이 필요한 경우 — className 오버라이드
<RoundBadge.Root>
  <RoundBadge.Dot className="bg-afds-extra-ui-blue" />
  <RoundBadge.Content>정보</RoundBadge.Content>
</RoundBadge.Root>
```
