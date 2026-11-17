# AFDS 개선 로드맵 문서 작성 계획

> 작성일: 2026-07-10 · 대상: `@turbo-project/afds` v0.7.1 · 상태: 계획(승인 대기)
>
> **기준 시점 문서** — 아래 진단·상태는 모두 2026-07-10 스냅샷이며 소급 갱신하지 않는다.
> 이후 반영분: **P2-1의 lint 스크립트·turbo task·CI 스텝과 `src/primitives` 글롭 정정은 v0.7.2에서 도입됨**
> (토큰 가드레일 `error` 승격은 기존 위반이 남아 있어 보류 — `warn` 유지). 현재 상태는 `eslint.config.js`를 확인한다.

## Context

turbo-project 레포의 `packages/afds`(Agent Friendly Design System)를 분석해 개선점을 정리한다.

분석 소스 3종을 종합했다:

1. **Astryx 비교 문서** — [astryx-analysis-insights.md](../astryx-analysis-insights.md) (2026-07-08, 미커밋 `??` 상태). Meta Astryx 대비 격차 분석 + 등급별 권고 매트릭스.
2. **코드베이스 실측** (탐색 에이전트 3개: 구조/품질/인프라) — Astryx 문서에 없는 net-new 문제 다수 발견. 특히 Astryx 문서의 A5 전제(EmptyState/FormField "구현돼 있으나 미노출")가 **사실과 다름** — `src/components/composed/`는 빈 `__test__/` 디렉토리만 있는 죽은 스캐폴딩.
3. **외부 전문가 미팅 문서** (2026-05-15, Doxus Brain 프로젝트: 회의록/미팅결과/개인 피드백) — "유지보수 부담 최소화", "DS가 병목이 되면 안 된다", "외부 라이브러리(Base UI) 베이스 + 팀 규칙 가미" 방향성.

사용자 결정:

- **산출물**: `packages/afds/docs/`에 개선 로드맵 문서 작성. 코드 수정 실행은 이후 별도 진행.
- **범위**: ① 문서/규칙 신뢰도 회복 ② 코드 품질/일관성 ③ 테스트/CI 인프라 ④ Astryx 로드맵 반영 ⑤ 그 외 추가 제안 — 전부 포함.

## Deliverable

**신규 파일 1개**: `packages/afds/docs/improvement-roadmap.md` (한국어, 기존 docs 스타일에 맞춤)

다른 파일은 수정하지 않는다 (프로젝트 규칙: "요청한 것만 수정한다"). Astryx 문서의 A5 오류 정정, CLAUDE.md 인덱스 추가 등은 로드맵의 액션 아이템으로만 기재.

## 문서 구조 및 핵심 내용

### 0. 개요

- 분석 일자(2026-07-10), 대상 버전(v0.7.1), 분석 소스 3종 명시
- 기존 계획 문서들과의 관계: 이 문서는 [astryx-analysis-insights.md](../astryx-analysis-insights.md) · [enhancement-plan.md](../enhancement-plan.md) · [token-improvement-plan.md](../token-improvement-plan.md)를 **대체하지 않고 통합 우선순위를 부여**하는 상위 로드맵

### 1. P0 — 문서·규칙 신뢰도 회복 (Agent-Friendly 정체성 직결, 최우선)

"AI 에이전트가 1급 사용자"인 DS에서 에이전트가 읽는 규칙·문서가 허구를 지시하는 것이 가장 치명적 결함이라는 논지. 실측 근거와 함께:

| #    | 불일치                                                                                                                                                                                                                  | 실측 근거                               |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| P0-1 | `.claude/rules/afds-component-tokens.md`가 지시하는 토큰 유틸 API(`afdsColor()`, `afdsSpacing()`, `afdsRadius()`, `AfdsColorToken` 등)가 **코드에 0건** — `src/utils/` 자체가 없음 (실재는 `src/lib/`의 `cn`, `slot`뿐) | grep 0건                                |
| P0-2 | 규칙상 의무인 `data-component` 실사용 **0회** (`data-slot` 164회), `data-variant`/`data-size`는 ~40개 중 5개만                                                                                                          | grep                                    |
| P0-3 | `naming-consistency.md`가 미실행 작업을 완료로 기술 — Modal→Dialog 리네임 없음(Dialog export 부재), 존재하지 않는 서브파트(Dialog.Description, Select.Group 등) 문서화                                                  | `src/bricks/overlay/modal/modal.tsx`    |
| P0-4 | `prop-naming-conventions.md`가 phantom 컴포넌트(Textarea/Heading/Text) 기준으로 규칙 기술 — 실재는 `Typography` 단일 컴포넌트                                                                                           | `src/bricks/display/typography`         |
| P0-5 | `overview.md` 드리프트 (v0.1.0/2-tier/components 레이어 기준 — 실재 v0.7.1/4-tier/bricks) — Astryx A9와 동일                                                                                                            |                                         |
| P0-6 | **Astryx 문서 A5 전제 정정**: EmptyState/FormField/DataCard는 "배럴 미노출"이 아니라 **빈 스캐폴딩** — 신규 구현 항목으로 재분류 필요                                                                                   | `src/components/composed/*` 빈 디렉토리 |
| P0-7 | `token-improvement-plan.md`의 `token-bridge.config.ts` 스니펫이 실제 config와 불일치 (dark tier 등)                                                                                                                     | `token-bridge.config.ts`                |
| P0-8 | `astryx-analysis-insights.md` 자체가 미커밋(`??`) — 클론하는 사람/에이전트에게 안 보임                                                                                                                                  | git status                              |

각 항목에 정정 방향(규칙을 코드에 맞출지, 코드를 규칙에 맞출지) 권고 포함. 예: P0-1은 유틸 구현이 아니라 규칙에서 삭제(현행 Tailwind 클래스 방식이 실질 표준), P0-2는 `data-component` 규칙 폐기 또는 일괄 부여 중 결정 필요 등.

### 2. P1 — 코드 품질·일관성·접근성

| #    | 항목                                                                                                                                                                                                                                                                                                           | 근거 위치                                        |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| P1-1 | **Modal 접근성 결함**: `ModalTitle`이 `ModalPrimitive.Title` 대신 plain div → `aria-labelledby` 미연결, Description 부재 → `aria-describedby` 불가 (Drawer는 올바름 — 대조)                                                                                                                                    | `modal.tsx:163-171`                              |
| P1-2 | 컴파운드 export 패턴 2종 혼재: `Object.assign(Root, {...})` (Select/Calendar/MultiSelect 등 6개) vs 객체 리터럴 (Modal/Drawer/Popover 등 9개) — 한쪽으로 통일                                                                                                                                                  |                                                  |
| P1-3 | 서브파트 개별 export 불일치 (Drawer는 네임스페이스만, Select는 SelectRoot 누락) — 철학 문서의 "모든 sub-part는 독립 컴포넌트" 규칙 위반                                                                                                                                                                        | `drawer.tsx:270`, `select.tsx:59`                |
| P1-4 | 오버레이 4종의 Portal 노출 방식이 4가지 — 합성 표면 통일                                                                                                                                                                                                                                                       |                                                  |
| P1-5 | 토큰 위반 스윕: raw Tailwind palette(`to-black`, `from-black/5`), raw primitive(`bg-afds-gray-700` 등 7곳+), arbitrary px(`rounded-[5px]`, `h-[34px]` 등 다수), `text-[12px]`, button의 color-mix 하드코딩                                                                                                     | 품질 탐색 §5의 파일:라인 목록 전재               |
| P1-6 | select/multi-select 트리거 인디케이터 중복 로직 공용화                                                                                                                                                                                                                                                         | `select.tsx:126-137`, `multi-select.tsx:146-153` |
| P1-7 | 잔재 정리: `radixOpen`/`radixOnOpenChange` (base-ui 전환 후 Radix 잔재), `Popover.Anchor` 무기능, `avoidCollisions` dead prop, Drawer의 자기-매핑 ternary, `ModalContent` onExited stale closure                                                                                                               | `use-tooltip.ts`, `popover.tsx:71-77,116`        |
| P1-8 | 세부 일관성: Drawer만 dotted displayName, Drawer controlled-only(defaultOpen 부재), Input `error: boolean` vs 관례 문서의 `state` enum — 입력 status 계약 통일(Astryx B6)과 묶어 해결, aria-label 언어 혼재(`"toast-close"` 등), 구조 규칙상 필수인 `.style.ts` 누락 4개(box, fade-in, fade-swap, smooth-list) |                                                  |

### 3. P2 — 테스트·CI·인프라

| #    | 항목                                                                                                                                                                                                                                   | 근거                                                  |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| P2-1 | **CI에 lint 부재** — afds에 `lint` 스크립트 없음, turbo lint task 없음, 토큰 가드레일이 `warn`이고 존재하지 않는 `src/primitives/**` glob 대상. → lint 스크립트 신설 + CI 추가 + 가드레일 `error` 승격 + glob을 `src/bricks/**`로 정정 | `eslint.config.js`, `.github/workflows/afds-test.yml` |
| P2-2 | React 19 peer 지원 주장 vs 실측 React 18.3.1 단일 — CI 듀얼 버전 매트릭스                                                                                                                                                              |                                                       |
| P2-3 | 테스트 갭: compositions 14/23 미테스트(base-select, date-picker 등 복잡 컴포넌트 포함), `form/check-box-group` 브릭 0테스트, headless 3/8 미테스트                                                                                     |                                                       |
| P2-4 | a11y 자동화 부재 — `@storybook/addon-a11y` 도입 (접근성이 설계 원칙인데 자동 검증 0)                                                                                                                                                   |                                                       |
| P2-5 | coverage 리포트 신뢰 불가(2026-02, branch 0.76%로 계측 깨짐) + CI 미수집 — 재계측 후 게이트 검토                                                                                                                                       |                                                       |
| P2-6 | Chromatic `exitZeroOnChanges: true` — 시각 회귀가 PR을 못 막음. 정책 결정 필요                                                                                                                                                         | `chromatic.yml`                                       |
| P2-7 | CI 위생: 존재하지 않는 워크플로 파일을 참조하는 stale `paths` 필터 2건, Node 22/24 혼재, `chromaui/action@latest` 미고정                                                                                                               |                                                       |
| P2-8 | headless MDX 문서 4/8 누락 (pagination, segment-control, select, tooltip — 규칙상 필수)                                                                                                                                                |                                                       |

### 4. P3 — Astryx 로드맵 통합 (기존 권고 재확인 + 정정)

[astryx-analysis-insights.md](../astryx-analysis-insights.md)의 등급 매트릭스를 요약 승계하되 실측 반영 조정:

- 강력권장 유지: Typography 시맨틱(최대 격차), Radius/Shadow 역할 기반 네이밍, Easing 토큰, 자기검증 프롬프트, Skeleton
- **조정**: A5(EmptyState/FormField)는 "배럴 노출"(저비용)에서 "신규 구현"(중비용)으로 재분류 — 우선순위 재검토
- 권장/추천/비추천 항목은 표로 요약하고 원문 링크로 위임 (중복 서술 최소화)
- Spacing 시맨틱 하향(기존 token-improvement-plan 축소) 재확인

### 5. P4 — 추가 제안 (탐색에서 새로 발견, 어느 문서에도 없음)

- 토큰 파이프라인 정합성: `tokens.motion.css`/`tokens.dark.css`가 `token-bridge.config.ts` tier 밖(수동 관리) — 파이프라인 편입 또는 명시적 예외 문서화
- 레포 위생: `tokens/json/.omc/state/*` OMC 상태 파일·`.DS_Store`가 토큰 소스에 커밋됨 — 제거 + `.gitignore`
- `console.error` 몽키패치(storybook preview.tsx) 부채 기록
- 다크모드 기대치 불일치: `tokens.dark.css` exports로 배포 중인데 철학 문서는 "공식 지원 전" — README에 상태 명시
- 중복 헤들리스 시스템: Base UI(peer) + `react-aria`/`react-stately` 메타패키지(runtime dep) 공존 — 장기적으로 `@react-aria/*` 서브모듈 cherry-pick 또는 정리 검토

### 6. 실행 순서 제안 (로드맵 마무리 섹션)

1. **Wave 1 (신뢰도)**: P0 문서 정정 일괄 + astryx 문서 커밋 — 코드 무변경, 순수 문서
2. **Wave 2 (안전망)**: P2-1 lint CI, P2-7 CI 위생, P2-4 a11y addon — 이후 작업의 회귀 방지
3. **Wave 3 (품질)**: P1-1 Modal a11y → P1-5 토큰 스윕 → P1-2/3/4 API 통일(breaking 가능성 있어 deprecated alias 병행)
4. **Wave 4 (로드맵)**: P3 토큰 시맨틱 계층(디자이너 협의 선행) + 신규 브릭
5. 각 Wave에 논의 대상 태그(🎨 디자이너 / 💻 FE / 공동) 승계 — astryx 문서 관례 유지

### 7. 호환성·버전 영향 분류 (전 항목)

> 전제: AFDS는 v0.7.1(0.x)이고 **이미 실소비자가 존재**한다 (소비처 앱, 소비처 앱 등 별도 레포). semver상 0.x는 minor로도 breaking이 허용되지만, 실소비자가 있으므로 **🔴 항목은 사실상 메이저급으로 취급**한다 — deprecated alias 병행 + changeset 마이그레이션 노트 필수, alias 제거는 1.0에서 일괄.

분류 범례:

| 등급               | 의미                                                                                        | 릴리스 처리                                         |
| ------------------ | ------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| ⚪ 무배포          | docs/CI/레포 위생 — 패키지 산출물 불변                                                      | 배포 불필요                                         |
| 🟢 비파괴          | additive API/신규 컴포넌트/내부 리팩터/버그픽스                                             | patch/minor                                         |
| 🟡 잠재 파괴       | 공개 API는 유지되나 DOM 구조·시각 픽셀·`data-slot` 등 소비자가 의존했을 수 있는 표면이 변함 | minor + Chromatic 검증 + 마이그레이션 노트          |
| 🔴 파괴 (메이저급) | 공개 API 변경/제거 — 소비 코드 수정 강제                                                    | deprecated alias와 함께 minor 선배포 → 1.0에서 제거 |

항목별 분류:

| 항목                                                            | 등급  | 판단 근거                                                                                                                                                                                         |
| --------------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0-1 ~ P0-8 (문서·규칙 정정)                                    | ⚪    | 순수 문서. 단 P0-2에서 "data-component 일괄 부여"를 택하면 그 구현은 🟢 (DOM 속성 추가는 additive)                                                                                                |
| P1-1 Modal a11y                                                 | 🟡    | `ModalTitle` div → `ModalPrimitive.Title` 요소로 DOM 마크업 변경 (이를 셀렉터로 잡는 소비자 CSS/테스트 영향 가능). `Description` 추가 자체는 🟢                                                   |
| P1-2 컴파운드 export 통일                                       | 🟢    | **`Object.assign(Root, …)` 방향으로 통일 시** additive (`<Modal>`이 새로 호출 가능해질 뿐). 반대 방향(객체 리터럴로 통일)은 🔴이므로 비권장                                                       |
| P1-3 서브파트 개별 export                                       | 🟢    | export 추가만                                                                                                                                                                                     |
| P1-4 오버레이 Portal 노출 통일                                  | 🔴    | Popover/Drawer의 합성 표면(컴포넌트 트리 계약) 변경 — 기존 조합 코드가 깨짐. deprecated 경로 병행 필수                                                                                            |
| P1-5 토큰 위반 스윕                                             | 🟡    | API 불변. 토큰 매핑이 1:1 값이면 🟢이나, arbitrary px를 토큰 스케일로 스냅하면 픽셀 변화 발생 — Chromatic으로 diff 검증                                                                           |
| P1-6 인디케이터 공용화                                          | 🟢    | 내부 리팩터. 단 multi-select의 `data-slot="select-indicator"`를 교정하면 그 부분만 🟡 (CSS 셀렉터 의존 가능)                                                                                      |
| P1-7 잔재 정리                                                  | 혼합  | `radixOpen`/`avoidCollisions` **제거는 🔴** (deprecate 선행) · `onExited` stale closure 수정은 🟢 버그픽스 · `Popover.Anchor` 기능화는 🟡 (무동작→동작 행동 변화)                                 |
| P1-8 세부 일관성                                                | 혼합  | Input `error` → `status` 계약은 🔴 (alias 병행) · Drawer `defaultOpen` 추가 🟢 · displayName 통일 🟢 (스냅샷 테스트 의존 소비자만 🟡) · aria-label 문구 정리 🟢 · `.style.ts` 신설 🟢 (내부 구조) |
| P2-1 ~ P2-8 (테스트·CI)                                         | ⚪    | 인프라만. 단 P2-4 a11y addon이 **발견한 결함의 후속 수정**은 건별로 🟡 가능성                                                                                                                     |
| P3 Typography/Radius/Shadow/Easing 시맨틱 토큰                  | 🟢→🟡 | 토큰 **추가**는 🟢 additive. 기존 컴포넌트가 새 시맨틱을 소비하도록 전환하는 2단계에서 시각 변화가 생기면 🟡                                                                                      |
| P3 Skeleton/Banner/VisuallyHidden/Kbd/EmptyState/FormField 신규 | 🟢    | 신규 컴포넌트 — minor                                                                                                                                                                             |
| P3 Button variant 어휘 전환 (`fill`→`primary` 등)               | 🔴    | enum 값 변경 — 전 소비자 코드 수정. deprecated alias 병행, 1.0 후보                                                                                                                               |
| P3 IconButton 분리 (Button size enum 축소)                      | 🔴    | `icon-*` size 값 제거 — 동상                                                                                                                                                                      |
| P3 입력 status 계약 통일 (B6)                                   | 🔴    | P1-8과 동일 건 — prop 셰이프 변경                                                                                                                                                                 |
| P3 Modal→Dialog 리네임 (P0-3의 이행 선택 시)                    | 🔴    | alias 병행 전제. 문서만 정정(리네임 포기)하면 ⚪                                                                                                                                                  |
| P4 토큰 파이프라인 편입 / 레포 위생 / console.error 부채        | ⚪    | 내부·문서                                                                                                                                                                                         |
| P4 react-aria 메타패키지 정리                                   | 🟢    | 번들 크기 영향만. 단 peer/dependency 구조를 바꾸면 소비자 설치 절차 영향으로 🟡                                                                                                                   |
| P4 다크모드 상태 명시                                           | ⚪    | README 문서                                                                                                                                                                                       |

**메이저(1.0) 후보 묶음**: P1-4(Portal 표면) · P1-7 제거건 · P1-8/B6(status 계약) · P3 Button variant+IconButton · (선택 시) Modal→Dialog. 이들은 개별 산발 배포 대신 **"deprecation minor 릴리스 → 1.0에서 alias 일괄 제거"** 2단계로 묶어 소비자 마이그레이션을 1회로 압축한다. 나머지 🟢/🟡는 수시 minor/patch로 배포.

## 작성 시 준수 사항

- 모든 주장에 파일:라인 근거 병기 (탐색 결과의 실측 인용 유지)
- 기존 docs 문체·포맷(한국어, 표 중심, 상대 링크) 준수
- 기존 계획 문서와 중복 서술하지 않고 링크로 위임 — 이 문서는 "통합 우선순위 + 정정 + net-new"에 집중
- Storybook JSDoc/기존 문서 섹션 삭제 금지 규칙과 무관 (신규 파일만 생성)

## Verification

1. 생성된 문서의 상대 링크가 모두 실제 파일로 해석되는지 확인 (`ls` 대조)
2. 문서 내 파일:라인 인용 중 핵심 항목(P0-1 grep 0건, P1-1 modal.tsx Title, P2-1 lint 부재) 스팟 재검증
3. 사용자 리뷰 — 우선순위/등급에 대한 이견 반영
