# Modal

> 사용자 확인이나 추가 작업이 필요한 모달 다이얼로그 컴포넌트

## Rules

1. `Modal.Title` 사용 필수 — `aria-labelledby` 자동 연결
2. `open`과 `onOpenChange`로 제어
3. 포커스 트랩과 `Esc` 닫기 자동 적용
4. 파괴적 액션은 `Button variant="danger"` 사용

## Examples

```tsx
// App.tsx
;<ModalContainer />

// 어디서나
modal.open(({ isOpen, close }) => (
  <Modal.Root open={isOpen} onOpenChange={o => !o && close()} size="md">
    <Modal.Portal>
      <Modal.Overlay />
      <Modal.Content>
        <Modal.Header>
          <Modal.Title>모달 제목</Modal.Title>
        </Modal.Header>
        <Modal.Body>본문 내용</Modal.Body>
        <Modal.Footer>
          <Button variant="ghost" onClick={close}>
            취소
          </Button>
          <Button onClick={close}>확인</Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal.Portal>
  </Modal.Root>
))
```
