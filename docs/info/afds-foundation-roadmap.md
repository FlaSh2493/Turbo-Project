# AFDS 기초 컴포넌트 진단 및 로드맵

이 문서는 AFDS(Agent Friendly Design System)의 현재 기초 컴포넌트 구비 현황을 진단하고, 디자인 시스템의 완성도를 높이기 위해 필요한 기초 컴포넌트 로드맵을 제안합니다.

---

## 1. 현재 상태 진단 (Diagnosis)

### ✅ 강점 (Strengths)

1. **체계적인 계층 구조**: `primitives` -> `headless` (필요시) -> `components`로 이어지는 계층 구조가 잘 잡혀 있습니다.
2. **에이전트 친화적 설계**: 모든 컴포넌트에 대해 `data-slot`, `data-component`, `data-variant` 등의 속성과 `Zod Schema`를 통한 런타임 검증이 통합되어 있습니다.
3. **높은 커버리지**: 현재 약 35여 개의 핵심 컴포넌트가 구현되어 있어, 표준 UI Kit 수준의 완성도를 갖추었습니다.
4. **일관된 네이밍 및 레이아웃 API**: 최근 개선 작업을 통해 `Dialog` 네이밍 통일 및 `Stack`, `Flex`, `Grid`의 API 정비가 완료되었습니다.

### ⚠️ 보완 필요 사항 (Weaknesses)

1. **Typography 체계화**: `Heading`과 `Text`의 variant를 디자인 토큰과 완벽히 동기화하는 작업이 진행 예정입니다.
2. **테스트 및 문서화**: 컴포넌트별 `spec.md`와 유닛 테스트가 존재하지만, 전체적인 테스트 커버리지 리포트나 에이전트 전용 문서(`llms.txt`)의 최신화 자동화가 더욱 강화되어야 합니다.

---

## 2. 디자인 시스템 기초 컴포넌트 조사 (Essential Components Research)

디자인 시스템이 "체계적으로 잘 구비되었다"고 판단하기 위해 필수적인 기초 컴포넌트들을 8개 카테고리로 분류하였습니다.

### 1) Layout (뼈대) - [완료]

- **Box/Flex/Grid**: 가장 기본적인 레이아웃 단위
- **Stack**: 요소 간의 간격(Gap)을 일관되게 관리
- **Container**: 화면 폭에 따른 중앙 정렬 및 패딩 관리

### 2) Typography (타이포그래피) - [진행 예정]

- **Heading**: H1~H6 수준의 제목
- **Text**: 본문 및 보조 텍스트
- **Label**: 폼 요소와 연동되는 레이블

### 3) Form / Data Entry (입력)

- **Input/Textarea**: 기본 텍스트 입력
- **Checkbox/Radio/Switch**: 선택형 입력
- **Select/Combobox**: 목록 선택 (접근성 고려 필수)
- **Slider**: 범위 선택
- **Button/IconButton**: 액션 트리거

### 4) Feedback (피드백)

- **Alert/Toast**: 상태 알림
- **Progress/Spinner**: 로딩 및 진행률 표시
- **Skeleton**: 데이터 로딩 중 플레이스홀더
- **Badge**: 상태 또는 수치 태그

### 5) Overlay (오버레이) - [개선 완료]

- **Modal/Dialog**: 화면 중앙 팝업 (`Dialog`로 명칭 통일 완료)
- **Drawer/Sheet**: 화면 측면에서 나오는 패널
- **Popover/Tooltip**: 특정 요소 근처의 추가 정보
- **Dropdown Menu**: 메뉴 목록

---

## 3. AFDS 로드맵 제안 (Roadmap)

진단 결과와 조사를 바탕으로 AFDS가 향후 보완해야 할 우선순위를 제안합니다.

### 🔵 완료된 작업 (Completed)

- **Layout 컴포넌트 정비**: `Stack`, `Flex`, `Grid`의 API를 Tailwind v4 최적화 및 CVA variant 기반으로 정비 완료.
- **네이밍 일관성 확보**: `Modal`을 `Dialog`로 변경하여 프리미티브와의 일관성 확보 (Modal은 alias로 유지).

### 🔴 Phase 1: 기반 다지기 (High Priority)

- **Typography 체계화 (진행 예정)**: `Heading`과 `Text`의 variant를 디자인 토큰과 완벽히 동기화.
- **Form 요소 접근성 강화**: `Select`, `Combobox`의 키보드 내비게이션 및 스크린 리더 호환성 재검증.

### 🟡 Phase 2: 복잡성 해결 (Medium Priority)

- **DataTable 고도화**: 단순 `Table`을 넘어 정렬, 필터링, 페이지네이션 로직이 포함된 `headless/use-table` 구현 고려.
- **Compound Component 패턴 통일**: 모든 복합 컴포넌트가 `Component.Root`, `Component.Trigger` 등 일관된 네이밍 컨벤션을 따르도록 리팩토링.

---

## 4. 결론

AFDS는 현재 **레고 브릭의 약 85% 이상이 매우 높은 수준으로 준비**되어 있습니다. 레이아웃과 명칭 개선을 통해 더욱 견고한 시스템이 되었으며, 향후 타이포그래피와 폼 요소의 접근성을 보강하면 표준 UI Kit로서 완벽한 모습을 갖추게 될 것입니다.
