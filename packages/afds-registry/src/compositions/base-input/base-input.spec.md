---
domain: common
category: form
---

# BaseInput

> 텍스트 입력을 받는 폼 인풋 컴포넌트.

## Rules

1. `error` 상태일 때는 `aria-invalid="true"`와 오류 메시지의 `aria-describedby`를 함께 연결한다
2. 시각적 `<label>`이 없으면 `aria-label` 필수

## Examples

```tsx
<BaseInput
  value={name}
  onChange={setName}
  placeholder="이름 입력"
  error={hasError}
  aria-label="이름"
/>
```
