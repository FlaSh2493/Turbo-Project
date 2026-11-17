# Toast

> 사용자 액션 결과를 일시적으로 알리는 알림 컴포넌트

## Rules

1. `Toaster`를 앱 루트에 반드시 배치
2. `useToast` 훅으로만 토스트 표시
3. `duration`(ms)으로 자동 닫힘 시간 설정

## Examples

```tsx
// 앱 루트
;<Toaster offsetY={40} />

// 사용 측
const { toast } = useToast()
toast({ content: '저장되었습니다.', type: 'success' })
```
