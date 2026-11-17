# Astryx(Meta) 디자인 시스템 분석 — AFDS 개선 인사이트

> 작성일: 2026-07-08 · 분석 대상: [Astryx](https://astryx.atmeta.com) (Meta, MIT 오픈소스, StyleX 기반 React DS) · 비교 기준: AFDS v0.7.1
>
> **분석 방법**: Astryx 공식 문서 사이트 전체(Foundations 9종, Guide 11종, 대표 컴포넌트 10종 딥다이브, themes/templates/playground/changelog/blog/community)를 4개 축으로 병렬 조사하고, AFDS 현행 코드(`packages/afds/src`, `tokens/`)와 기존 개선 계획 문서 4건([token-improvement-plan.md](./token-improvement-plan.md), [enhancement-plan.md](./enhancement-plan.md), [layout-improvements.md](./layout-improvements.md), [naming-consistency.md](./naming-consistency.md))과 대조했다. 컴포넌트 페이지는 SPA라 헤드리스 브라우저로 실측했다. 각 주장에 출처 URL을 병기하며, 문서에서 확인 못 한 것은 "확인 안 됨"으로 명시한다.

## 요약 (TL;DR)

1. **Typography 시맨틱 계층 부재가 AFDS 최대 격차** — 기존 token-improvement-plan의 최우선 실행 근거 확보. Astryx의 named type scale + line-height 알고리즘이 구체적 벤치마크.
2. **Spacing 시맨틱 확장은 우선순위 하향** — Astryx도 primitive 단일 스케일만 운영. 기존 계획의 이 항목은 재검토 권장.
3. **Radius/Shadow는 "역할명이 곧 토큰"** (inner/element/container/page, low/med/high) — 시맨틱 확장 시 별칭이 아닌 역할 기반 네이밍 채택 권장.
4. **EmptyState/FormField/DataCard는 신규 구현 필요(중비용)** — `src/components/composed/`는 빈 `__test__/` 디렉토리만 있는 죽은 스캐폴딩으로 구현이 없다. (당초 "배럴 미노출" 전제는 오류 — 실측 정정.) Skeleton/Banner/VisuallyHidden도 실제 부재.
5. **AI 친화 전략에서 AFDS는 "정적 산출물" 방식으로 이미 앞서 있으나**, Astryx의 CLI(`--dense`/`doctor`) + MCP 서버 + 자기검증 프롬프트는 다음 단계로 참고할 가치가 크다.

---

## 적용 권고 매트릭스 (등급 × 논의 대상)

논의 대상 구분 기준: **토큰 체계 변경 = 디자이너 협의 필수** · **prop 이름/구조 변경 = FE 개발자 협의** · **variant 어휘(enum 값) 변경 = 디자이너 + FE 공동** · **MCP/CLI 등 도구 = 개발자 내부 논의**.
등급: 강력권장(반드시 적용) > 권장 > 추천(여력 시) > 비추천(당장 하지 않음).

### 한눈에 보는 요약

| 등급         | 🎨 디자이너 협의                                               | 💻 개발자 내부/FE                                                                                      | 🎨+💻 공동                                                               |
| ------------ | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| **강력권장** | Typography 시맨틱, Radius/Shadow 역할 기반 시맨틱, Easing 토큰 | 자기검증 프롬프트, 문서-코드 드리프트 해소 (EmptyState/FormField는 빈 스캐폴딩 → 신규 구현으로 재분류) | Skeleton 브릭 (비주얼 스펙 필요)                                         |
| **권장**     | `on-*` 색상 페어링·오버레이 interaction                        | 입력 status 계약 통일(prop), 문서 조회 스크립트+doctor, 안티패턴 Do/Don't, 템플릿 승격                 | Banner 브릭, shadow 다크모드(`light-dark()`), motion 원칙+reduced-motion |
| **추천**     | concentric radius 유틸                                         | Button size enum 정리/IconButton 분리(prop), MCP 서버, Toast 고도화, `@layer`·브라우저 tier 문서       | **Button variant 어휘 전환**(enum 어휘라 공동), Typeahead→CommandPalette |
| **비추천**   | Spacing 시맨틱 확장(기존 계획 축소 협의)                       | 플레이그라운드, `lab` 채널                                                                             | 멀티 브랜드 테마, Chat/AppShell 대형 도입                                |

등급 판단 근거 요점:

- **Button variant 어휘 전환**이 "추천"(강력권장 아님)인 이유 — 가치는 분명하나 breaking change라 deprecated alias 병행 등 이행 비용이 있고, enum 어휘는 디자이너 합의가 선행돼야 함. 반면 prop 구조(size enum에서 icon 분리)는 개발자 단독 결정 사안이라 별도 행으로 분리.
- **Spacing 시맨틱 확장**은 유일하게 "기존 계획을 축소하는" 비추천 항목 — 디자이너와의 토큰 협의 시 Typography/Radius/Shadow 확장과 함께 안건으로 올려 트레이드오프를 한 번에 정리할 것.
- **Skeleton/Banner**는 구현은 개발 사안이지만 신규 비주얼 스펙(색·애니메이션·radius)이 필요해 공동으로 분류.

### 강력권장

| 항목                           | AFDS 현황                                                                                         | Astryx 현황                                                                                                   | 논의 대상                     | 상세 |
| ------------------------------ | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------- | ---- |
| Typography 시맨틱 토큰 신설    | primitive font-size만 존재, 컴포넌트가 primitive 직접 참조                                        | named style 14+종(H1~H6/Display/Body/Label/Code)이 1차 소비 토큰, line-height는 티어별 비율+4px 스냅 알고리즘 | 🎨 디자이너 협의              | A1   |
| Radius/Shadow 역할 기반 시맨틱 | primitive 숫자 스케일만(`afds-sm` 등), shadow는 custom 계층                                       | radius `inner/element/container/page`, shadow `low/med/high`+상태 inset 5종 — 역할명이 곧 토큰                | 🎨 디자이너 협의              | A2   |
| Easing 토큰 추가 (1~2개)       | easing 토큰 전무, duration custom 토큰만                                                          | `--ease-standard` 단 1개 + duration 3-tier×3-variant 9종                                                      | 🎨 디자이너 협의              | A3   |
| EmptyState/FormField 신규 구현 | `src/components/composed/`는 빈 스캐폴딩(구현 없음) — 배럴 미노출이 아니라 신규 구현 필요(중비용) | EmptyState·Field 모두 정식 컴포넌트, "styled input을 Field로 재포장 금지" 등 사용 규칙까지 문서화             | 💻 개발자 내부                | A5   |
| 에이전트 자기검증 프롬프트     | 없음 — 에이전트가 문서를 건너뛰고 코딩하는 실패 모드 무방비                                       | "코드 작성 전 3문항에 답하라(import 경로/Dialog 정책/prop명)" 절차를 문서에 원문 제공                         | 💻 개발자 내부                | A6   |
| 문서-코드 드리프트 해소        | overview.md가 v0.1.0/2-tier/components 레이어 기준(실제는 v0.7.1/4-tier/bricks)                   | CLI가 설치 버전 기준 문서를 동적 생성해 드리프트 원천 차단                                                    | 💻 개발자 내부                | A9   |
| Skeleton 신규 브릭             | 없음 — 로딩 표현이 Spinner뿐                                                                      | `width/height/radius/index(stagger)` 4-prop 프리미티브, "Spinner와 동시 사용 금지" 규칙                       | 🎨+💻 공동 (비주얼 스펙 필요) | B1   |

### 권장

| 항목                                         | AFDS 현황                                                                                                          | Astryx 현황                                                                             | 논의 대상                                            | 상세     |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- | ---------------------------------------------------- | -------- |
| Banner/VisuallyHidden/Kbd 브릭               | 전부 없음. 피드백 위계가 Toast(일시)·Modal(차단) 2단뿐. VisuallyHidden은 enhancement-plan Phase 2 기계획 후 미이행 | Banner(지속 노출 경고)로 3단 위계 완성, VisuallyHidden은 Utility 카테고리 정식 컴포넌트 | 🎨+💻 공동 (Banner 비주얼) / VisuallyHidden·Kbd는 💻 | B1       |
| shadow 다크모드 적응 (`light-dark()` 검토)   | `.dark`에서 color만 158개 오버라이드, shadow는 다크 불변                                                           | 토큰 정의에 `light-dark()` 내장, 그림자 색까지 다크 자동 적응                           | 🎨+💻 공동 (토큰+브라우저 기준선)                    | B2       |
| `on-*` 색상 페어링·오버레이 interaction 토큰 | 상태색 위 텍스트 대비 보장 장치 없음, interaction은 색상 변형 방식                                                 | `--color-on-success` 등 페어링 강제, hover/pressed는 반투명 오버레이 토큰               | 🎨 디자이너 협의                                     | B3       |
| 입력 status 계약 통일                        | Input/Select 등 입력 간 통일된 error/success 표현 셰이프 없음                                                      | 전 입력이 `status: {type, message}` 동일 객체 공유, `disabledMessage` 전용 prop         | 💻 FE 개발자 (prop 구조)                             | B6       |
| AFDS 문서 조회 스크립트 + doctor             | manifest/llms.txt 정적 파일뿐 — 검색·압축 조회 불가, 셋업 헬스체크 없음                                            | `astryx component <N> --dense/--json`, `astryx doctor`(exit code)                       | 💻 개발자 내부                                       | B4-1단계 |
| 안티패턴 Do/Don't 표준 섹션                  | 원칙이 `.claude/rules/*.md`에 분산, 컴포넌트별 Do/Don't 포맷 없음                                                  | 전 컴포넌트 페이지 + 전역 Principles에 동일한 Do/Don't 표                               | 💻 개발자 내부 (+🎨 리뷰)                            | A7       |
| motion 사용 원칙 + reduced-motion            | 문서화 없음                                                                                                        | "반복 인터랙션엔 모션 금지" 부정형 가이드 + OS reduced-motion 존중 명문화               | 🎨+💻 공동                                           | A8       |
| compositions → 템플릿 승격                   | compositions 23종이 있으나 "화면 유형→조합" 매핑·탐색 채널 없음                                                    | 페이지 템플릿 10 카테고리를 CLI로 주입, 에이전트 grounding 워크플로의 1단계로 지정      | 💻 개발자 내부                                       | B8       |

### 추천

| 항목                                    | AFDS 현황                                                                 | Astryx 현황                                                                       | 논의 대상                         | 상세     |
| --------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------- | -------- |
| Button variant 어휘 전환                | `fill/primary-line/line/ghost/danger` — 시각 처리 중심, 위계+처리 축 혼재 | `primary/secondary/ghost/destructive` — 업계 관용어, LLM이 사전지식으로 추론 가능 | 🎨+💻 공동 (variant enum 어휘)    | B7       |
| Button size enum 정리 / IconButton 분리 | 한 enum에 `md~lg`+`icon-xs~lg` 혼재                                       | Button(3값)과 IconButton을 별도 컴포넌트로 분리                                   | 💻 FE 개발자 (prop 구조)          | B7       |
| AFDS MCP 서버                           | 없음                                                                      | `search`/`get` 2-tool 호스팅 MCP — 사내 다중 레포 공용 소비에 유리                | 💻 개발자 내부                    | B4-2단계 |
| Typeahead → CommandPalette              | 비동기 검색 콤보박스 계열 전무                                            | `SearchSource` headless 계약을 두 표면이 공유                                     | 🎨+💻 공동 (신규 컴포넌트 디자인) | B5       |
| Toast 고도화 (dedup/지속시간 정책)      | 미대조                                                                    | `uniqueID`+`collisionBehavior`, type이 지속시간 결정(error=수동 닫기)             | 💻 FE 개발자                      | B9       |
| `@layer` 순서·브라우저 tier 문서화      | 없음                                                                      | Tailwind 레이어 순서 명시 + 3-tier 브라우저 지원 표                               | 💻 개발자 내부                    | B10      |
| concentric radius 유틸                  | 없음                                                                      | `max(0px, calc(parent-radius - padding))` 공식 제공                               | 🎨 디자이너 협의 (A2 이후)        | C        |

### 비추천 (당장 하지 않음)

| 항목                         | AFDS 현황                                                  | Astryx 현황                                                               | 사유 · 논의 대상                                                        | 상세 |
| ---------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ---- |
| Spacing 시맨틱 토큰 확장     | primitive만 (기존 token-improvement-plan에 확장 계획 있음) | **Astryx도 primitive 단일 스케일만** — "single primitive scale only" 명시 | 업계 표준이 primitive 직접 소비. 기존 계획 축소를 🎨 디자이너와 협의    | A4   |
| 멀티 브랜드 테마 패키지화    | 단일 테마(라이트/다크)                                     | 테마 7종 독립 패키지 + `defineTheme`/중첩                                 | 현 단일 브랜드 스코프에 과투자. 화이트라벨 요구 발생 시 재론 (🎨+💻)    | C    |
| 플레이그라운드 구축          | Storybook(Chromatic) 운영 중                               | 코드 에디터+테마 에디터 통합 워크스페이스                                 | 구축·운영 비용 대비 효과 낮음. Storybook→샌드박스 링크 정도만 검토 (💻) | C    |
| Chat 계열·AppShell 대형 도입 | 없음                                                       | Chat 15종, AppShell/SideNav/TopNav                                        | 다운스트림 실수요 확인 전 착수 금지 (🎨+💻)                             | 부록 |
| `lab` 실험 배포 채널         | compositions opt-in entry가 유사 역할 수행 중              | `@astryxdesign/lab` → `core` 2단계 승격                                   | 현 규모에서 채널 분리는 오버헤드 (💻)                                   | C    |

---

## 1. Astryx 개요

- **정체**: Meta의 오픈소스 디자인 시스템 (2026-06-18 공개, [github.com/facebook/astryx](https://github.com/facebook/astryx), MIT). React + StyleX(빌드타임 CSS-in-JS), Tailwind 브리지 동시 지원.
- **구성**: `@astryxdesign/core`(컴포넌트 ~93개, 11 카테고리) + `@astryxdesign/theme-*`(테마 7종, 독립 패키지) + `@astryxdesign/cli` + 호스팅 MCP 서버.
- **AFDS와의 포지션 차이**: Astryx는 앱 셸(AppShell/SideNav/TopNav)과 페이지 템플릿까지 커버하는 "제품 뼈대" 지향, AFDS는 headless→bricks→compositions 레이어의 컴포넌트 시스템 지향. 양쪽 모두 "AI 에이전트를 1급 사용자로 취급"하는 철학을 공유하나 구현 방식이 다르다(§5).

---

## 2. 토큰 시스템 비교

출처: [tokens](https://astryx.atmeta.com/docs/tokens) · [color](https://astryx.atmeta.com/docs/color) · [typography](https://astryx.atmeta.com/docs/typography) · [spacing](https://astryx.atmeta.com/docs/spacing) · [shape](https://astryx.atmeta.com/docs/shape) · [elevation](https://astryx.atmeta.com/docs/elevation) · [motion](https://astryx.atmeta.com/docs/motion)

| 영역                | AFDS 현행                                                                                     | Astryx                                                                                                                            | 격차 판정                                 |
| ------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| Color               | primitive + semantic(icon/bg/border/divider/interaction/text), 다크: `.dark` 158개 오버라이드 | semantic만 공개(surface/text/icon/border/status + `on-*` 페어링 + hover/pressed **오버레이 토큰**), 다크: CSS `light-dark()` 내장 | 카테고리 폭 유사, 패턴·다크 메커니즘 차이 |
| Typography          | primitive만                                                                                   | primitive(12단계, base 14px × ratio 1.2) + **semantic named style 14+종**(H1~H6, Display, Body, Label, Code…)                     | **최대 격차**                             |
| Spacing             | primitive만                                                                                   | **primitive만** (4px 그리드 15단계, "single primitive scale only" 명시)                                                           | 격차 아님 — 업계 공통                     |
| Radius              | primitive만                                                                                   | 역할명이 1차 토큰: `--radius-inner`(8)/`element`(12)/`container`(16)/`chat`(28)/`page`(32)/`full`                                 | 격차 + 네이밍 모델 확보                   |
| Shadow              | custom 계층, 다크 불변                                                                        | 역할 3레벨(`low/med/high`) + 상태 inset 5종(hover/selected/success/warning/error), **다크모드에서 그림자 색 자동 적응**           | 격차 — 특히 다크 대응                     |
| Duration            | custom 토큰                                                                                   | 3-tier × 3-variant = 9종 (`--duration-fast-min` 130ms ~ `--duration-slow-max` 1300ms)                                             | 참고                                      |
| Easing              | **없음**                                                                                      | **단 1개** `--ease-standard: cubic-bezier(0.24, 1, 0.4, 1)`                                                                       | 격차 — 단, "1개면 충분"이 눈높이          |
| Opacity             | 없음                                                                                          | 문서에서 확인 안 됨                                                                                                               | 판단 보류                                 |
| Icons/Illustrations | 토큰 범위 밖                                                                                  | 마찬가지로 토큰 범위 밖(가이드라인 문서)                                                                                          | 격차 아님                                 |

### 주목할 세부 패턴

- **Typography line-height 알고리즘**: 크기 티어별 목표 비율(<20px→1.5, 20–31px→1.4, ≥32px→1.25)을 **4px 그리드에 스냅**해 unitless 토큰으로 저장. `defineTheme({typography: {scale: {base, ratio}}})`로 base/ratio만 바꾸면 전체 스케일 재계산. AFDS Style Dictionary 파이프라인([token-bridge.config.ts](../token-bridge.config.ts))에도 응용 가능.
- **`on-*` 색상 페어링**: `--color-success` 위 텍스트는 `--color-on-success` — 대비 보장을 토큰 레벨에서 강제. AFDS semantic color에 없는 패턴.
- **오버레이 interaction**: hover/pressed를 배경색 변형이 아닌 반투명 오버레이 토큰(`--color-overlay-hover/pressed`)으로 표현 → 임의 배경 위에서 일관 동작.
- **Concentric radius 공식**: `max(0px, calc(parent-radius - padding))`으로 중첩 요소 radius를 계산하는 유틸 제공.
- **다크모드 아키텍처**: AFDS는 `.dark` 셀렉터에서 158개 규칙을 사후 오버라이드, Astryx는 토큰 정의 시점에 `light-dark(라이트값, 다크값)` 내장. 유지보수 부담이 구조적으로 다르다 (브라우저 지원: Astryx는 Tier2 기준선을 "Baseline 2024 = `light-dark()` 지원"으로 잡음 — [browser-support](https://astryx.atmeta.com/docs/browser-support)).

---

## 3. 아키텍처 · 테마 비교

출처: [principles](https://astryx.atmeta.com/docs/principles) · [styling](https://astryx.atmeta.com/docs/styling) · [styling-libraries](https://astryx.atmeta.com/docs/styling-libraries) · [theme](https://astryx.atmeta.com/docs/theme) · [cli](https://astryx.atmeta.com/docs/cli)

### 설계 원칙과 탈출구

- Astryx 4대 원칙: "Components over primitives / Semantic tokens over hardcoded values / Theme-agnostic code / Open internals". 여기에 **안티패턴 6종을 정식 문서로 분리**(인라인 스타일, 하드코딩 색상, 하드코딩 `<a>`, Card 남발, Badge 오용, 미문서화 prop 발명).
- 탈출구: `xstyle`(StyleX) → Tailwind 브리지 → `className`/`style` → rest-prop 드릴링 → **data-attribute 선택자**(`.astryx-button[data-variant="primary"]`) → 토큰 typed import → `swizzle`(소스 복사, shadcn식). AFDS의 4단계(className → data-slot → CSS 변수 → headless)와 방향 동일하나 갈래가 더 많다.
- **공존 전략의 방향이 정반대**: Astryx는 "우리가 토큰의 source of truth, 외부 라이브러리(Tailwind/Chakra 등)가 우리 CSS 변수에 매핑해오라"는 **호스트 전략**. AFDS는 `.afds` 스코프 격리로 게스트가 되어도 안전한 **게스트 전략**([scoped-coexistence.md](./scoped-coexistence.md)). 상호 배타적이지 않음 — AFDS가 호스트인 신규 프로젝트용 "토큰 매핑 가이드"는 부재.
- Tailwind와의 CSS `@layer` 선언 순서(reset → 컴포넌트 → 유틸리티)를 명시 문서화 — AFDS 문서에는 이 관점이 없다.

### 테마 아키텍처

- 테마 = **독립 npm 패키지** 7종. `defineTheme({name, color, typography, radius, motion, tokens, components})` — 테마가 색상만이 아니라 **타이포·radius·motion·컴포넌트 오버라이드까지 포함하는 완결된 디자인 언어 계약**.
- 다크모드는 테마의 독립 축이 아니라 토큰의 `[light, dark]` 튜플로 내장, `<Theme mode="light|dark|system">`로 제어.
- **테마 중첩**: 한 트리 안에서 라이트 본문 + 다크 사이드바 같은 서브트리별 테마 공존 가능. `extends`로 브랜드 파생.
- AFDS는 단일 테마 + `.dark` 토글 — 멀티 브랜드/테마 중첩 요구가 생기면 구조 전환 필요 (현재 스코프에선 참고 수준).

### CLI (AFDS 최대 구조적 갭)

`npx astryx` 단일 CLI가 `init`(AI 에이전트 문서 셋업 포함) / `search` / `component <Name>`(props·예제 조회) / `template`(페이지 템플릿 주입) / `swizzle` / `upgrade`(codemod 마이그레이션) / `theme build` / `doctor`(셋업 헬스체크, exit code) 를 통합. 전역 `--json`(구조화 출력) / `--dense`(AI 토큰 절약) / `--detail brief|compact|full` 플래그. AFDS는 npm install + CSS import 수동.

---

## 4. 컴포넌트 API 비교

출처: [components](https://astryx.atmeta.com/components) 및 각 컴포넌트 페이지 (헤드리스 브라우저 실측)

### 대비되는 설계 선택 4가지

1. **관심사 분리 단위 — 컴포넌트 분리 vs prop enum 흡수.**
   Astryx: Button(`sm|md|lg`)과 IconButton을 완전히 별도 컴포넌트로 분리. AFDS: 한 enum에 `md|sm|lg|icon-xs|icon-sm|icon-lg` 혼재([button.style.ts](../src/bricks/action/button/button.style.ts)). 텍스트 크기 축과 아이콘 정사각 크기 축이 한 enum에 섞인 형태 — Astryx식 분리가 각 enum을 짧고 명확하게 유지한다.
   반대 사례도 있음: 확인/파괴 다이얼로그를 Astryx는 `purpose: info|form|required` **prop**으로, AFDS는 `alert-modal`/`negative-modal` **별도 composition**으로 해결. AFDS 방식이 결정론(에이전트가 추측할 여지 축소) 관점에서는 오히려 유리할 수 있어 일률 판단은 부적절.

2. **variant 어휘 — 위계/의미 중심 vs 시각 처리 중심.**
   Astryx `primary|secondary|ghost|destructive`는 업계 관용어(shadcn/MUI/Chakra)와 호환 → 신규 개발자와 **LLM 모두 사전지식으로 올바르게 추론**. AFDS `fill|primary-line|line|ghost|danger`는 시각 처리("채움/선")를 이름에 노출하고, `primary-line`은 위계축+처리축이 한 값에 합성돼 외부인이 "2차 버튼"임을 유추하기 어렵다. variant 이름 자체가 AI 코드 생성 정확도에 영향을 주는 API라는 관점 — [naming-consistency.md](./naming-consistency.md)의 후속 검토 대상 후보.

3. **통일된 status 계약.** Astryx는 모든 입력 컴포넌트가 `status: {type: 'error'|'warning'|'success', message}` 동일 객체 셰이프를 공유. disabled 요소에 Tooltip이 안 먹는 문제도 `disabledMessage` 전용 prop으로 해결. AFDS는 입력 간 통일된 status 셰이프가 확인되지 않음.

4. **공유 데이터 계약의 public 승격.** `SearchSource`/`SearchableItem<T>`/`createStaticSource()`라는 비동기 검색 계약을 Typeahead(드롭다운)와 CommandPalette(풀스크린)가 그대로 공유. AFDS의 headless 훅(`useSelect`) 철학과 같은 방향이지만, "이질적인 두 표면이 나눠 쓰는 명시적 public 타입"으로 승격한 사례는 AFDS에 아직 없다 — Typeahead/CommandPalette 신규 도입 시 처음부터 headless 계약으로 설계할 것.

### 기타 참고 패턴

- **Toast**: 프레젠테이션 컴포넌트와 `useToast()` 명령형 훅의 명확한 이중 API. `uniqueID` + `collisionBehavior: 'ignore'|'overwrite'`로 중복 제거, `type`이 지속시간 정책까지 결정(info=5초 자동, error=수동 닫기).
- **Table**: `useTableXState` + plugin 훅 9종(정렬/선택/필터/페이지네이션/리사이즈/행확장/스티키컬럼) 조합 아키텍처. "함수 prop 없는 컬럼은 server-safe, renderCell은 'use client'"로 RSC 경계 명시.
- **Dialog**: 전용 Header/Footer를 만들지 않고 범용 `Layout`/`LayoutContent`/`LayoutFooter`를 재사용. 크기는 인라인 style이 아닌 CSS 변수(`--x-width`)로 주입.
- **문서 포맷 수렴**: Astryx 컴포넌트 페이지에는 **텍스트 props 표가 없다** — props는 CLI/타입이 source of truth. AFDS의 "코드로 알 수 있으면 spec.md에 적지 않는다" 규칙과 같은 철학. 차이는 Do/Don't 표: Astryx는 전 컴포넌트 페이지에 표준화된 Do/Don't 표가 있고, AFDS spec.md는 Rules 숫자 목록만 강제.

---

## 5. AI 친화 전략 비교 (AFDS 정체성 직결)

출처: [working-with-ai](https://astryx.atmeta.com/docs/working-with-ai)

| 항목                   | Astryx                                                                                                                                                                                 | AFDS                                                                                                                                                      |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AI용 전체 인덱스       | llms.txt **없음**(404 확인) — CLI `search`/`docs`가 대체                                                                                                                               | `dist/llms.txt` 정적 배포                                                                                                                                 |
| 컴포넌트 구조화 문서   | `astryx component <Name> --dense \| --json` **동적 조회** (항상 설치 버전 기준 최신)                                                                                                   | `*.spec.md` + `dist/manifest/{name}.json` **정적 파일** (git 이력 추적 가능)                                                                              |
| DOM 마커               | `data-variant` 등을 **CSS 선택자 안정성** 용도로만 문서화                                                                                                                              | `data-slot`(전 컴포넌트 표준) · 일부 컴포넌트의 `data-variant`/`data-size`를 **AI DOM 판독** 용도로 명시 포지셔닝 — AFDS 고유 (`data-component`는 미사용) |
| MCP 서버               | **있음** — `search(query)`/`get(name)` 2-tool 호스팅형                                                                                                                                 | 없음                                                                                                                                                      |
| 에이전트 컨텍스트 파일 | `npx astryx init --features agents --agent claude \| cursor \| codex`가 CLAUDE.md/.cursorrules/AGENTS.md **자동 생성 + 버전 동기화**                                                   | `.claude/rules/*.md` 수동 관리                                                                                                                            |
| 자기검증 절차          | "Before writing any Astryx code, check your knowledge: ① Button의 import 경로는? ② Dialog를 non-dismissible로 만드는 법은? ③ Selector의 items prop 이름은?" — 답 못 하면 문서 설치부터 | 없음                                                                                                                                                      |
| 토큰 절약 출력         | 전 CLI 명령 `--dense` 플래그                                                                                                                                                           | 압축 레벨 선택 불가                                                                                                                                       |
| 헬스체크               | `astryx doctor`                                                                                                                                                                        | 없음                                                                                                                                                      |

**AFDS가 이미 앞서 있는 점**: ① 산출물 설계 단계부터 AI 1급 사용자를 전제(manifest/spec.md/data-_는 파일 시스템에 항상 존재 — 별도 서버/CLI 인프라 불필요, 폐쇄망에서도 동작) ② data-_ 속성의 AI 판독 포지셔닝 ③ spec.md가 git으로 버전 추적됨.

**Astryx가 앞서 있는 점**: ① 동적 조회 채널(정적 스냅샷의 신선도 문제 해소) ② 에이전트 컨텍스트 파일의 버전 동기화 자동화 ③ "AI가 틀리는 지점을 실측해 그것만 겨냥해 문서화"하는 메타 방법론의 명문화(잘못된 바이너리 경로 추측 방지용 npm script alias까지).

---

## 6. 생태계 · DX 비교

출처: [themes](https://astryx.atmeta.com/themes) · [templates](https://astryx.atmeta.com/templates) · [playground](https://astryx.atmeta.com/playground) · [changelog](https://astryx.atmeta.com/changelog) · [community](https://astryx.atmeta.com/community)

- **템플릿**: 카테고리 10종(Table/Form/Settings/Login/Tools/Content/AI Chat/Gallery/Shell)의 완결 페이지를 CLI로 프로젝트에 주입(`astryx template <name>`). AI 에이전트 공식 워크플로가 "① template --list로 유사 패턴 탐색 → ② --skeleton으로 구조 학습 → ③ component로 API 확인" — **템플릿이 에이전트 grounding 자료로 1급 지위**. AFDS compositions 23개가 개념적 유사물이나 전용 탐색/배포 채널 없음.
- **플레이그라운드**: 코드 에디터 + 라이브 프리뷰 + 테마 에디터 + 템플릿 뷰가 단일 워크스페이스. `#code=` 해시로 소스 공유. AFDS는 Storybook(카탈로그)뿐.
- **릴리스 엔지니어링**: 패키지별 독립 changelog, `astryx upgrade` codemod 자동 마이그레이션, **`@astryxdesign/lab`(실험) → `core`(정식) 2단계 채널** 분리. GitHub Issues 주간 triage SLA 공표, 기여 유형별 예상 소요시간 명시(버그 2h/문서 30m/템플릿 반나절/테마 1일).

---

## 7. 우선순위별 개선 인사이트

### A. 즉시 적용 (저비용 · 고가치)

| #   | 인사이트                                                                                                                                                                                                                                                                                                                                   | 기존 계획과의 관계                                                                             | 대상                                                         |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| A1  | **Typography semantic 계층 신설** — named style(H1~H6/Display/Body/Label/Code)을 컴포넌트의 1차 소비 토큰으로. line-height는 티어별 비율 + 4px 그리드 스냅 알고리즘 참고                                                                                                                                                                   | [token-improvement-plan.md](./token-improvement-plan.md) 기존 항목 — **최우선 실행 근거 확보** | `tokens/json/semantic.tokens.json`                           |
| A2  | **Radius/Shadow 시맨틱을 역할 기반 네이밍으로** — radius `inner/element/container/page`, shadow `low/med/high` + 상태 inset. 숫자 별칭이 아니라 역할명을 1차 토큰으로                                                                                                                                                                      | 기존 계획 항목의 **구체 네이밍 모델 보강**                                                     | 〃                                                           |
| A3  | **Easing 토큰 최소 1개 추가** (`cubic-bezier(0.24,1,0.4,1)` 참고) + duration fast/medium/slow 구조 검토. 대형 easing 카탈로그는 불필요 — Astryx도 1개만 운영                                                                                                                                                                               | 기존 계획 항목 — **적정 눈높이 확정**                                                          | `tokens/json/custom.tokens.json`                             |
| A4  | **Spacing semantic 확장 우선순위 하향** — Astryx도 primitive 단일 스케일. 대신 "컴포넌트 gap prop이 primitive를 직접 소비" 패턴 유지가 업계 표준                                                                                                                                                                                           | 기존 계획 항목의 **수정 근거** (계획 축소)                                                     | token-improvement-plan.md 갱신                               |
| A5  | **EmptyState/FormField/DataCard 신규 구현** — `src/components/composed/`는 빈 `__test__/`만 있는 죽은 스캐폴딩(구현 없음). 당초 "배럴 미노출(저비용)" 전제는 오류 — **신규 구현(중비용)**으로 재분류. Astryx Field의 "styled input을 Field로 다시 감싸지 말 것" 규칙, EmptyState의 `icon+title+description+actions` 최소 API를 spec에 반영 | 신규 (기존 계획에 없음)                                                                        | `src/bricks/`에 신규 구현 (죽은 `composed/` 스캐폴딩 제거)   |
| A6  | **자기검증 프롬프트 도입** — CLAUDE.md/rules 서두에 "AFDS 코드 작성 전 체크: ① Button의 import 경로는? ② Dialog를 닫기 불가로 만드는 법은? ③ Select 옵션은 어떻게 전달하나?" 3문항. 에이전트가 문서를 건너뛰는 실패 모드 차단                                                                                                              | 신규                                                                                           | `CLAUDE.md`, `.claude/rules/`                                |
| A7  | **안티패턴 섹션 표준화** — Astryx의 Do/Don't 표 포맷을 spec.md 표준 섹션 또는 overview.md 안티패턴 챕터로 (인라인 스타일, 하드코딩 색상, 미문서화 prop 발명 등)                                                                                                                                                                            | 신규                                                                                           | spec.md 템플릿, [overview.md](./overview.md)                 |
| A8  | **motion 사용 원칙 + `prefers-reduced-motion` 문서화** — "테이블 행 hover, 분당 수십 번 반복되는 곳엔 모션 금지" 같은 부정형 가이드. 토큰보다 가이드라인 격차가 더 큼                                                                                                                                                                      | 신규                                                                                           | [design-principles/motion.md](./design-principles/motion.md) |
| A9  | **문서-코드 드리프트 해소** — overview.md가 v0.1.0/2-tier/components 레이어 기준. Astryx 대조 과정에서 재확인된 부채                                                                                                                                                                                                                       | 신규                                                                                           | [overview.md](./overview.md)                                 |

### B. 중기 로드맵

| #   | 인사이트                                                                                                                                                                                                                                                                                                                                                 | 근거                                                                 |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| B1  | **Skeleton / Banner / VisuallyHidden / Kbd 신규 브릭** — 전부 실제 부재 확인. Skeleton(`width/height/radius/index` 4 prop)과 Kbd/VisuallyHidden은 구현 비용 최소. Banner는 Toast(일시)·Modal(차단) 사이의 "지속 노출 비파괴 경고" 위계 공백을 메움. VisuallyHidden은 [enhancement-plan.md](./enhancement-plan.md) Phase 2에 이미 계획됨 — 이행 촉구 근거 | §4, Astryx [Skeleton](https://astryx.atmeta.com/components/Skeleton) |
| B2  | **shadow 다크모드 적응 + `light-dark()` 검토** — "color 외 카테고리 다크 불변" 갭 중 shadow가 최우선. 장기적으로 `.dark` 158개 오버라이드를 `light-dark()` 내장형으로 전환 검토 (브라우저 기준선 확인 필요 — Astryx는 Baseline 2024를 Tier2로 운영)                                                                                                      | §2                                                                   |
| B3  | **`on-*` 색상 페어링 + 오버레이 interaction 토큰** — 상태색 위 대비 보장, hover/pressed의 배경 독립성                                                                                                                                                                                                                                                    | §2                                                                   |
| B4  | **AFDS 조회 CLI 또는 MCP 서버** — 정적 manifest/llms.txt를 동적 채널로 확장. 1단계: `node scripts/afds-docs.mjs <Component> [--dense]` 스크립트(저비용). 2단계: `search`/`get` 2-tool MCP 서버 — 사내 여러 레포가 AFDS를 공용 소비하는 구조에서 가치 큼. `doctor`류 셋업 헬스체크도 후보                                                                 | §5                                                                   |
| B5  | **Typeahead → CommandPalette 순차 도입** — `SearchSource`/`SearchableItem<T>` headless 계약을 public 타입으로 먼저 설계하고 두 표면이 공유. 착수 전 다운스트림 제품의 실수요 확인                                                                                                                                                                        | §4                                                                   |
| B6  | **입력 컴포넌트 status 계약 통일** — `status: {type, message}` 단일 셰이프를 Input/Select/MultiSelect/Calendar에 일관 적용. `disabledMessage` 패턴도 검토                                                                                                                                                                                                | §4                                                                   |
| B7  | **Button variant 어휘 재검토** — `fill/primary-line/line` → 위계·의미 중심(`primary/secondary/...`) 전환 검토. v0.x이므로 아직 저비용, deprecated alias 병행([naming-consistency.md](./naming-consistency.md)의 Modal→Dialog 선례). icon 사이즈의 IconButton 분리도 함께 검토                                                                            | §4                                                                   |
| B8  | **compositions → 템플릿 승격** — 자주 쓰는 페이지 단위 조합(대시보드 셸, 설정, 로그인)을 "화면 유형 → composition 매핑표 + 복붙 스타터"로 문서화. 에이전트 grounding 워크플로("템플릿 먼저 찾고 구조 학습 후 코딩")를 rules에 명시                                                                                                                       | §6                                                                   |
| B9  | **Toast 고도화** — `uniqueID`/`collisionBehavior` 중복 제거, type별 지속시간 정책(error는 수동 닫기) 대조 검토                                                                                                                                                                                                                                           | §4                                                                   |
| B10 | **CSS `@layer` 순서 및 브라우저 지원 tier 문서화** — Tailwind 유틸리티와의 레이어 순서 명시, 컴포넌트별 최신 CSS API 의존성 표                                                                                                                                                                                                                           | §3                                                                   |

### C. 참고 (당장 비적용, 요구 발생 시)

- **멀티 브랜드 테마**: 테마의 npm 패키지화, `defineTheme`/`extends` 상속, 테마 중첩(라이트 본문 + 다크 사이드바). 현재 단일 사내 브랜드 스코프에선 과투자 — 화이트라벨 요구 발생 시 이 문서의 §3 참조.
- **플레이그라운드**: 저비용 대안으로 Storybook 스토리에 "CodeSandbox/StackBlitz로 열기" 연동만 검토.
- **`lab` 실험 채널**: 실험 컴포넌트를 정식 entry와 분리 배포(`@turbo-project/afds/lab`)해 승격 전 피드백 수집. compositions opt-in entry가 이미 유사 역할을 부분 수행 중.
- **Table plugin 아키텍처**: base-table 고도화(DataTable은 enhancement-plan에서 명시적 보류 상태) 착수 시 `useTableXState`+plugin 조합 및 RSC 경계 명시 패턴 참조.
- **concentric radius 유틸**: 중첩 카드/버튼 radius 계산 공식. radius 시맨틱(A2) 이후 검토.
- **AFDS 호스트 전략 가이드**: 신규 프로젝트에서 AFDS가 메인 DS일 때 외부 라이브러리가 AFDS CSS 변수에 매핑해오는 가이드 — 게스트 전략(scoped-coexistence)의 대칭 문서.

---

## 부록: 컴포넌트 커버리지 매핑 (Astryx ↔ AFDS)

| Astryx 카테고리  | Astryx 대표                                                       | AFDS 대응                                                                          | 공백                                                                                     |
| ---------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Action (10)      | Button, IconButton, ToggleButton, Toolbar, DropdownMenu           | action 6종 (button, link, switch, accordion, segment-control, floating-action-bar) | ToggleButton(Group), Toolbar, DropdownMenu 단독형                                        |
| Chat (15)        | Chat Composer/Layout/Message/Tool Calls                           | 없음                                                                               | 전체 — 다운스트림 수요 확인 후 대형 이니셔티브로                                         |
| Container (5)    | Card, Carousel, Collapsible, SelectableCard                       | data-card(빈 스캐폴딩), check-box-card/radio-card, accordion                       | Carousel, 범용 Card                                                                      |
| Content (15)     | Avatar, Kbd, Markdown, Code Block, EmptyState, Timestamp          | display 6종 + typography                                                           | **Kbd**, Markdown, CodeBlock, **EmptyState(미구현)**, Timestamp                          |
| Data Input (20)  | Selector, **Typeahead**, Field, Power Search, Slider, NumberInput | form 7종                                                                           | **Typeahead**, **Slider**, NumberField(enhancement-plan Phase 1 항목), **Field(미구현)** |
| Feedback (6)     | Badge, **Banner**, ProgressBar, **Skeleton**, Spinner, StatusDot  | feedback 3종 + badge 2종                                                           | **Banner**, **Skeleton**, StatusDot                                                      |
| Layout (13)      | **AppShell**, Grid, Section, AspectRatio, ResizeHandle            | layout 8종 + page-layout composition                                               | AppShell 급 셸, AspectRatio, ResizeHandle                                                |
| Navigation (9)   | **Breadcrumbs**, SideNav, TopNav, Outline                         | navigation 2종 (pagination, tab)                                                   | **Breadcrumbs**, SideNav/TopNav                                                          |
| Overlay (8)      | **CommandPalette**, Dialog, HoverCard, Lightbox                   | overlay 4종 + modal compositions                                                   | **CommandPalette**, HoverCard, Lightbox                                                  |
| Table & List (5) | Table(plugin 9종), TreeList, MetadataList                         | table + base-table composition                                                     | TreeList, plugin 아키텍처                                                                |
| Utility (1)      | **VisuallyHidden**                                                | 없음                                                                               | **VisuallyHidden**(enhancement-plan Phase 2 기계획)                                      |

굵은 글씨 = §7 우선순위 표에 반영된 항목.

---

## 리서치 신뢰도 노트

- Astryx 컴포넌트 상세와 templates/playground는 SPA 클라이언트 렌더링이라 헤드리스 브라우저 실측으로 보강. WebFetch 요약 특성상 일부 수치(shadow blur 값 등)는 "문서에 없음" 처리.
- Astryx의 `llms.txt`는 404로 부재 확정. 정적 `manifest.json` 파일 존재 여부는 문서상 불명확 — CLI `--json` 출력이 그 역할을 하는 것으로 해석됨.
- AFDS 측 사실(composed는 빈 스캐폴딩=미구현, easing 토큰 부재, Skeleton/Banner/VisuallyHidden 부재)은 로컬 코드로 직접 재검증함.
