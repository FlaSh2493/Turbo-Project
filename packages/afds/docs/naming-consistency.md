# 명칭 일관성 개선 사항

## 개요

AFDS 컴포넌트의 명칭 일관성 현황과, 내부 프리미티브(Base UI)와 노출 컴포넌트 간 명칭 정합을 위한 개선 방향을 정리한다. (본 문서는 코드 실측 기준 — 계획 항목은 "예정"으로 표기)

## Modal (Dialog 리네임은 예정)

- **현재 상태(실재)**: 컴포넌트 이름은 `Modal`이며 내부적으로 Base UI의 Dialog primitive를 사용한다. `Dialog` export는 **아직 없다**.
- **개선 방향(예정, 1.0)**: 내부 primitive와의 일관성을 위해 `Modal`→`Dialog` 리네임을 검토 중이다. breaking 변경이므로 deprecated 별칭(`Modal`)과 함께 1.0에서 도입한다 — **현재 미실행**.

```tsx
// 현재 사용법 (실재)
import { Modal } from '@turbo-project/afds'
;<Modal.Root>
  <Modal.Trigger>열기</Modal.Trigger>
  <Modal.Content>
    <Modal.Header>
      <Modal.Title>제목</Modal.Title>
    </Modal.Header>
    <Modal.Body>...</Modal.Body>
  </Modal.Content>
</Modal.Root>
```

## 컴포넌트 패턴 표준화

복합 컴포넌트(Compound Component) 패턴을 표준으로 한다. 아래는 **v0.7.2 시점 스냅샷**이다(정본은 코드):

- `Modal`: Root, Trigger, Portal, Overlay, Content, Header, Title, Body, Footer, Close
- `Select`: Root, Trigger, Content, Search, Item, List, Fallback
- `Drawer`, `Popover`, `Tooltip` 등도 compound로 제공

> sub-part의 정확한 목록은 각 컴포넌트의 `.tsx` export가 진실의 원천이다 — 문서에 하드코딩하지 않고 코드/`manifest`를 확인한다.

## 데이터 속성(Data Attributes) 컨벤션

- `data-slot`: 내부 요소 식별자 — `modal-title`, `select-item` 등 (전 컴포넌트 표준)
- `data-variant` / `data-size`: **일부 컴포넌트만** 노출 (`data-variant`=Button·SquareBadge, `data-size`=Spinner·SegmentControl·Button·Modal)
- `data-component`: **현재 사용하지 않는다**
