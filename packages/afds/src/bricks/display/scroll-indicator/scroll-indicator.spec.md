# ScrollIndicator

> 스크롤 컨테이너의 현재 위치를 미니맵으로 시각화하는 UI 컴포넌트

## Rules

1. `scrollContainerRef`에 스크롤 컨테이너 ref 전달 필수
2. 부모 컨테이너에 `position: relative`를 지정하고 ScrollIndicator는 그 안에 배치한다
3. 위치 조정은 `className`(예: `bottom-afds-16 right-afds-16`)으로 수행한다

## Examples

```tsx
const containerRef = useRef<HTMLDivElement>(null)

<div className="relative">
  <div ref={containerRef} className="overflow-x-auto">
    {/* 가로로 긴 콘텐츠 */}
  </div>
  <ScrollIndicator
    scrollContainerRef={containerRef}
    className="bottom-afds-16 right-afds-16"
    aria-hidden="true"
  />
</div>
```
