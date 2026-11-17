---
domain: common
category: overlay
---

# BaseTooltip

> 트리거 hover·focus(또는 click) 시 추가 정보를 표시하는 컴포지션 툴팁.

## Rules

1. 기본은 hover/focus 트리거 — `mode="click"`은 모바일 또는 명시적 상호작용용
2. dot-notation으로 직접 합성이 필요하면 `components/overlay/tooltip`의 `Tooltip`을 사용한다

## Examples

```tsx
<BaseTooltip content="추가 정보" side="top">
  <button>hover me</button>
</BaseTooltip>
```
