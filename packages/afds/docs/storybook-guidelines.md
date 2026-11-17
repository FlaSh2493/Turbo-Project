# AFDS Storybook 가이드라인

AFDS 스토리북은 컴포넌트의 복잡도와 사용 목적을 기준으로 3단계 계층 구조를 따릅니다. 이 구조는 에이전트가 컴포넌트의 위계를 파악하고 적절한 요소를 선택하는 데 도움을 줍니다.

## 1. 타이틀 구조

`AFDS / [Type] / [Category] / [Component Name]`

### [Type] 분류

- **Bricks**: 더 이상 쪼개지지 않는 디자인 시스템의 원자(Atomic) 단위 프리미티브 컴포넌트입니다.
- **Compositions**: Bricks를 조합하거나 특정 도메인 인터랙션이 포함된 복합 컴포넌트입니다.

### [Category] 분류

- **Action**: 사용자의 의도를 실행하거나 상태를 즉각적으로 전환하는 요소입니다.
  - 예: `Button`, `IconButton`, `DropdownMenu`, `Switch`, `Accordion` 등
- **Layout**: 공간 분할, 배치 및 시각적 구분을 담당하는 요소입니다.
  - 예: `Box`, `Flex`, `Grid`, `Stack`, `Separator`, `Container` 등
- **Typography**: 텍스트의 스타일, 위계 및 의미를 전달하는 요소입니다.
  - 예: `Text`, `Heading`, `Label`
- **Form**: 사용자로부터 데이터를 입력받거나 선택을 유도하는 요소입니다.
  - 예: `Input`, `Select`, `Checkbox`, `Radio`, `Slider`, `NumberField` 등
- **Feedback**: 작업의 결과나 시스템의 상태를 사용자에게 알리는 요소입니다.
  - 예: `Alert`, `Toast`, `Spinner`, `Progress`, `Skeleton`
- **Overlay**: 기존 화면 위에 레이어 형태로 나타나는 요소입니다.
  - 예: `Dialog`, `Drawer`, `Popover`, `Tooltip`
- **Navigation**: 서비스 내 이동이나 현재 위치 파악을 돕는 요소입니다.
  - 예: `Tabs`, `Breadcrumb`, `Pagination`
- **Display**: 정보를 시각화하거나 구조적으로 나열하여 보여주는 요소입니다.
  - 예: `Card`, `Table`, `Badge`, `Avatar`

## 2. 문서 및 소개 페이지

- 시스템 전반에 대한 가이드 및 문서는 `AFDS / Docs / [Name]` 형식을 따릅니다.
- 예: `AFDS / Docs / Introduction`, `AFDS / Docs / Prop Naming Conventions`
