---
domain: common
category: overlay
---

# NegativeModal

> 위험·되돌릴 수 없는 액션을 위한 확인/취소 모달. 확인 버튼은 warning 톤으로 강조된다.

## Rules

1. 확인 버튼 클릭 시 `onConfirm` 실행 후 자동으로 닫힌다
2. `message`는 `whitespace-pre-line` 처리되므로 `\n`으로 줄바꿈한다
3. 단일 acknowledge는 `AlertModal`을, 추가 입력이 필요하면 `Modal`을 직접 합성한다

## Examples

```tsx
<NegativeModal
  open={open}
  onOpenChange={setOpen}
  title="캠페인을 중지할까요?"
  message={'중지된 캠페인은 다시 시작할 수 없습니다.\n계속 진행하시겠어요?'}
  confirmText="중지"
  cancelText="취소"
  onConfirm={() => stopCampaign(id)}
/>
```
