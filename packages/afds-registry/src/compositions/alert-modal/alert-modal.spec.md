---
domain: common
category: overlay
---

# AlertModal

> 단일 확인 버튼만 가진 간단한 알림 모달.

## Rules

1. `message`는 `whitespace-pre-line` 처리되므로 `\n` 으로 줄바꿈한다
2. 확인 버튼 클릭 시 자동으로 닫히며 `onConfirm`이 함께 호출된다
3. 확인/취소 분기가 필요하면 `NegativeModal`을, 추가 입력이 필요하면 `Modal`을 직접 합성한다

## Examples

```tsx
<AlertModal
  open={open}
  onOpenChange={setOpen}
  title="저장되었습니다"
  message={'변경사항이 정상적으로\n반영되었습니다.'}
  confirmText="확인"
  onConfirm={() => refetch()}
/>
```
