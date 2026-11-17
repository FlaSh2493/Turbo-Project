# Avatar

> 사용자 프로필 이미지와 폴백 콘텐츠를 표시하는 컴포넌트

## Rules

1. `src` 없거나 이미지 로드 실패 시 `fallback` 콘텐츠 표시
2. 크기는 부모 `className`으로 지정 (`w-*`, `h-*`)
3. 장식용 아바타는 `alt=""` 설정

## Examples

```tsx
<Avatar src="/profile.jpg" alt="홍길동 프로필 이미지" className="w-10 h-10 rounded-full" />
```
