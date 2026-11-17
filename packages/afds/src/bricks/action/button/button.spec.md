# Button

> 사용자 액션을 트리거하는 기본 버튼 컴포넌트

## Rules

1. 아이콘 전용 버튼(`size="icon-*"` 계열)에 `aria-label` 필수
2. 페이지당 `fill` variant는 1–2개 이내로 제한
3. `render` prop으로 `<a>` 렌더링 시 `href` 속성 확인
4. 비동기 처리 중 `disabled` 또는 `aria-busy="true"` 설정

## Examples

```tsx
<Button variant="fill" size="md">
  저장
</Button>
```
