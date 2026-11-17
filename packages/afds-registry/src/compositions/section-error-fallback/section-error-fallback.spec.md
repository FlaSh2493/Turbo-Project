---
domain: common
category: feedback
---

# SectionErrorFallback

> 섹션 단위 오류 상태를 표시하는 fallback Composition.

## Rules

1. `reset` prop이 전달되면 재시도 버튼이 표시된다 — 페칭 재시도 함수와 연결한다
2. 페이지 전체 오류에는 사용하지 않는다 — 별도 전체 화면 오류 컴포넌트를 사용한다
3. `title`/`message`/`retryText`는 영어 기본값을 가지므로 도메인 문구는 직접 주입한다
4. 루트 wrapper는 기본 `py-20` 패딩을 가지며 `className`은 병합된다 (덮어쓰기 아님)

## Examples

```tsx
<ErrorBoundary fallback={<SectionErrorFallback reset={() => reset()} />}>
  <DataComponent />
</ErrorBoundary>
```
