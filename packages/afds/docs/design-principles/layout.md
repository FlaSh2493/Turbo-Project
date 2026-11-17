# Layout Principles

AFDS의 레이아웃 시스템은 공간의 **깊이(Z-Index)**와 **크기(Breakpoint)**에 대한 명확한 위계를 정의합니다.
매직 넘버(예: `z-index: 9999`) 사용을 지양하고, 의미론적 토큰을 사용합니다.

## 1. Z-Index System (Layer Hierarchy)

화면의 깊이감을 나타내는 레벨입니다. 숫자가 클수록 사용자에게 가깝게(위에) 배치됩니다.

| Token Name      | Value   | Description       | Usage Examples                                  |
| :-------------- | :------ | :---------------- | :---------------------------------------------- |
| `layer-base`    | **0**   | 기본 레이어       | 본문 텍스트, 카드, 배경 이미지                  |
| `layer-sticky`  | **100** | 고정 요소         | Sticky Header, Sidebar, Bottom Navigation       |
| `layer-overlay` | **200** | 딤드(Dimmed) 배경 | 모달 뒤의 어두운 배경 (Backdrop)                |
| `layer-modal`   | **300** | 대화상자          | Dialog, Alert Modal, Drawer                     |
| `layer-popover` | **400** | 일시적 부유 요소  | Dropdown Menu, Select List, Tooltip, Hover Card |
| `layer-toast`   | **500** | 최상위 알림       | Toast Message, Global Notification              |

**규칙:**

- 동일 레벨 내에서의 충돌은 DOM 순서에 따릅니다.
- 특정 컴포넌트 내부에서만 유효한 `z-index`는 로컬 스코프(Local Scope)로 관리하며, 전역 토큰을 침범하지 않도록 합니다.

## 2. Breakpoint System (Responsive Design)

Tailwind CSS의 기본 Breakpoint를 사용하되, 각 지점이 의미하는 디바이스 환경을 정의합니다.

| Token Name         | Min-Width  | Device Context       | Layout Strategy                            |
| :----------------- | :--------- | :------------------- | :----------------------------------------- |
| `mobile` (default) | **0px**    | 모바일 (Portrait)    | 1 Column, Full Width, Bottom Sheet 활용    |
| `tablet` (sm)      | **640px**  | 대형폰 / 소형 태블릿 | Grid 시작, 여백(Padding) 증가              |
| `desktop` (md)     | **768px**  | 태블릿 (Landscape)   | Sidebar 등장 가능, Multi-column            |
| `laptop` (lg)      | **1024px** | 노트북 / 데스크탑    | Container 폭 고정, 복잡한 대시보드 UI 허용 |
| `wide` (xl)        | **1280px** | 대형 모니터          | 최대 폭 제한 (Max-width), 중앙 정렬        |

**규칙:**

- **Mobile First**: 기본 스타일은 모바일 기준으로 작성하고, `md:`, `lg:` 등을 통해 확장합니다.
- **Touch Target**: `mobile` 및 `tablet` 환경에서는 모든 터치 요소가 최소 **44x44px** 영역을 확보해야 합니다.
