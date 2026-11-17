# FadeSwap

> children의 `key`가 바뀔 때 페이드 아웃 후 페이드 인으로 교체하는 컴포넌트

## Rules

1. children에 반드시 고유한 `key` 부여 — 없으면 전환 미동작
2. `duration`은 ms 단위 (기본 200ms)
3. 탭·스텝·슬라이드 콘텐츠 전환에 적합

## Examples

```tsx
<FadeSwap duration={200}>
  <div key={activeTab}>{tabContent[activeTab]}</div>
</FadeSwap>
```
