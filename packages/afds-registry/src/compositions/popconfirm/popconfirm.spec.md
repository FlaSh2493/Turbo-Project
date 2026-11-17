---
domain: common
category: overlay
---

# PopConfirm

> 특정 요소를 클릭했을 때 확인/취소 버튼이 포함된 팝오버를 표시하는 컴포넌트.

## Rules

1. 추가 입력·상세 설명이 필요한 경우는 `Modal`을 사용한다 — PopConfirm은 인라인 예/아니오 확인 전용
2. `onConfirm`이 Promise를 반환하면 진행 중 `loadingText`가 표시된다
3. 확인/취소 후 포커스를 트리거로 복귀시키기 위해 트리거 요소는 직접 렌더한다 (`children`)

## Examples

```tsx
<PopConfirm
  title="정말 삭제하시겠습니까?"
  confirmText="삭제"
  cancelText="취소"
  loadingText="삭제 중..."
  onConfirm={async () => {
    await deleteItem(id)
  }}
>
  <Button variant="ghost">삭제</Button>
</PopConfirm>
```
