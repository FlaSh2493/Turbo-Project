# Modal.context

> Modal 복합 컴포넌트의 내부 Context 정의 — `ModalContext`(size 공유)와 `ModalExitContext`(파괴 콜백 공유)를 제공한다

## Rules

1. 소비자 코드에서 직접 `ModalContext` 또는 `ModalExitContext` 를 import 하지 않는다
2. `useModalContext()` 는 반드시 `<Modal.Root>` 하위에서만 호출한다 — 외부 호출 시 에러 발생
3. `ModalExitContext` 는 `ModalContainer` 가 주입하므로 `Modal.Root` 외부에서도 호출 가능하다

## Examples

```tsx
// Modal 복합 컴포넌트를 사용 — context 는 내부에서 자동 주입됨
<Modal.Root size="md">
  <Modal.Header>제목</Modal.Header>
  <Modal.Body>내용</Modal.Body>
</Modal.Root>
```
