# ScrollArea

> 커스텀 스크롤바를 제공하는 스크롤 컨테이너 컴포넌트

## Rules

1. 부모에 명시적 높이/너비 설정 필수
2. `hideVertical`/`hideHorizontal`로 스크롤 방향 제어
3. `offsetYStart`/`offsetYEnd`/`offsetXStart`/`offsetXEnd`로 스크롤바 오프셋 조정
4. `gutter`는 세로 스크롤바 폭을 예약할지 정한다. 예약은 **콘텐츠 요소의 투명 오른쪽 border**로
   잡으므로 그 요소의 모든 자손이 함께 밀린다 — 테이블 헤더 배경·행 구분선처럼 컨테이너 끝까지
   이어져야 하는 요소가 있으면 `gutter="overlay"`를 쓴다. 대신 본문이 스크롤바 아래로 들어간다
5. 예약은 스크롤바의 **가시성이 아니라 세로 오버플로의 존재**에 걸린다. `hideVertical`을
   hover로 토글해도 레이아웃이 흔들리지 않는다
6. `contentClassName`의 좌우 패딩은 예약과 경쟁하지 않고 준 값 그대로 남는다. 반대로
   `contentClassName`에 `border-r-*`를 주면 예약과 충돌한다 — 그때는 `gutter="overlay"`로 끄고
   직접 여백을 잡는다

## Examples

```tsx
<ScrollArea className="h-64">
  <div>스크롤 가능한 콘텐츠</div>
</ScrollArea>
```

```tsx
// 전체폭 요소가 컨테이너 끝까지 이어져야 하는 경우 — 헤더 배경·행 구분선이 잘리지 않는다
<ScrollArea className="h-80 rounded border" gutter="overlay">
  <table className="w-full table-fixed border-collapse">
    <thead className="bg-afds-bg-surface-sunken">…</thead>
    <tbody>…</tbody>
  </table>
</ScrollArea>
```

```tsx
// 소비처 패딩은 오버플로 유무와 무관하게 그대로 유지된다
<ScrollArea className="h-52 w-56" contentClassName="p-afds-spacing-10">
  <div>카드 목록</div>
</ScrollArea>
```
