---
domain: common
category: layout
---

# PageLayout

> 페이지 표준 헤더(타이틀/액션) + 12-컬럼 그리드 본문을 묶은 Compound 레이아웃.

## Rules

1. `cols`/`rows`/`gap`/`colSpan`/`rowSpan`은 사전 정의된 매핑 테이블 안의 값만 동작한다 — 범위를 벗어나면 `grid-cols-1` 등으로 폴백된다
2. 헤더 외 영역(사이드바·푸터)이 필요하면 이 컴포넌트를 확장하지 말고 페이지 단위에서 직접 조립한다
3. 폼·플로우 위주 단일 컬럼 페이지에는 12-컬럼 그리드가 과할 수 있으니 개별 레이아웃을 검토한다
4. 콘텐츠 폭은 `Contents` 의 `width` 로 정한다 — XDS Figma "Layout"(node 23216:21)의 세 유형이다. 헤더는 어느 유형이든 영역 전체 폭을 쓴다

   | `width`        | 콘텐츠 폭                             | Figma 표기 화면              |
   | -------------- | ------------------------------------- | ---------------------------- |
   | `fluid` (기본) | 최대폭 없음, 최소 924px               | 소재센터·데이터센터·운영센터 |
   | `bounded`      | 최대 1340px · 최소 924px, 가운데 정렬 | 대시보드                     |
   | `narrow`       | 660px 고정, 가운데 정렬               | 설정·자산관리 등             |

5. 최소 폭은 콘텐츠 924px + 좌우 패딩 40px = 964px 이다. LNB(60px)와 함께 쓰면 브라우저 1024px 에서 가로 스크롤 없이 맞고, 그보다 좁으면 가로 스크롤이 생긴다

## Examples

```tsx
<PageLayout>
  <PageLayout.Header>
    <PageLayout.Header.Title>캠페인</PageLayout.Header.Title>
    <PageLayout.Header.Actions>
      <Button variant="ghost">내보내기</Button>
      <Button>새 캠페인</Button>
    </PageLayout.Header.Actions>
  </PageLayout.Header>

  <PageLayout.Contents cols={12} gap="spacing-14" width="bounded">
    <PageLayout.Contents.Section colSpan={8}>
      <ChartCard />
    </PageLayout.Contents.Section>
    <PageLayout.Contents.Section colSpan={4} rowSpan={2}>
      <SummaryCard />
    </PageLayout.Contents.Section>
  </PageLayout.Contents>
</PageLayout>
```
