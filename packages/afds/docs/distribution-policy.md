# AFDS 배포 채널 정본 정책 + brick↔composition 경계 기준 (초안)

> 상태: **초안 — §6-A 는 확정됨(아래 참고), 나머지는 사용자 리뷰 필수** · 작성 시점 대상:
> `@turbo-project/afds` v0.7.1 + `@turbo-project/afds-registry` v0.5.0 · 관련 이슈: #1047 (MISSION #106)
>
> 이 문서는 결정을 확정하지 않은 **권장안**이었다. §6-A(npm entry 처리)는 upstream #143 에서
> **확정됐다** — 미리보기/deprecate 단계 없이 즉시 완전 제거. 아래 §1·§3-1·§6-A 는 그 확정
> 이후 갱신했다. 그 외(§4·§5·§6-B/C/D)는 여전히 **미확정 초안**이다.

## 1. 배경 — 이중 배포 채널 현황 (히스토리)

작성 시점(afds 0.7.1)에는 동일한 조합(composition) 코드가 **두 경로로 동시 배포**되고 있었다:

| 채널                                           | 형태                | 위치                                                                         | 소비 방식                                                        |
| ---------------------------------------------- | ------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| **npm entry** (upstream #143 에서 완전 제거됨) | 라이브러리 import   | `@turbo-project/afds/compositions` (`package.json` exports `./compositions`) | `import { BaseSelect } from '@turbo-project/afds/compositions'`  |
| **afds-registry**                              | 복사-소유(shadcn식) | 표준 `shadcn` CLI 가 GitHub main에서 fetch → 프로젝트로 복사                 | `npx shadcn@4.19.1 add FlaSh2493/turbo-project/base-select#main` |

두 채널이 같은 23종 compositions를 배포해 **정본(source of truth)이 불명확**했다 — 개선이
한쪽에만 반영되면 드리프트가 발생하는 문제였다(Astryx 분석 X1). **지금은 npm entry 채널
자체가 없어져 이 문제가 성립하지 않는다** — 정본은 afds-registry(복사-소유) 하나뿐이다.

## 2. 설계 철학 (확정 전제)

- **AFDS = 필수적인 작은 컴포넌트(brick)만** 남긴다 — 표면적 최소화가 제1 목표.
- **조합 결과 중 재활용 UI는 afds-registry에 올려 shadcn처럼 복사-소유로 배포**한다.
- 이 철학대로면 "조합의 정본"은 afds-registry(복사-소유)이고, npm `./compositions` entry는 철학과 긴장 관계다.

## 3. 정본 정책 권장안

### 3-1. 조합(composition)의 정본 = afds-registry 복사-소유

- afds-registry를 조합 배포의 **정본 채널**로 선언.
- **확정(upstream #143)**: npm `@turbo-project/afds/compositions` entry는 과도기 역할로 축소하지
  않고 **즉시 완전히 제거했다** — 컴포지션 소스 자체가 `packages/afds-registry/src/compositions/`
  로 이전됐다. §6-A 참고.

### 3-2. 소비자 안내 1페이지

- "언제 npm import vs 언제 `shadcn add`"를 안내하는 1페이지를 README/overview에 추가한다.

## 4. brick ↔ composition 경계 기준

무엇을 AFDS brick으로 남기고 무엇을 afds-registry(조합)로 보낼지 판단 기준:

| 축        | brick (AFDS 잔류)          | composition (afds-registry 이관) |
| --------- | -------------------------- | -------------------------------- |
| 범용성    | 도메인 무관, 어디서나 쓰임 | 특정 화면/도메인 패턴            |
| 구성      | 단일 의미 단위             | 복수 brick 조합                  |
| 변경 빈도 | 낮음(디자인 시스템 안정성) | 높음(제품 요구 반영)             |
| 소유      | AFDS 팀이 관리             | 소비 프로젝트가 복사-소유·수정   |

### "styled 기본값" 애매지대

`base-select`/`base-input` 등 "headless + 기본 스타일" 조합은 brick도 composition도 아닌 회색지대다. 두 선택지:

- **(a)** brick의 기본 스타일로 흡수 → AFDS가 styled 컴포넌트로 직접 제공
- **(b)** composition(afds-registry)로 유지 → 소비자가 복사-소유
- 결정 필요 → §6-B.

## 5. 기존 23종 재분류 (초안 — 확정 아님)

> 아래는 §4 기준을 적용한 **1차 제안**이다. 각 행은 리뷰에서 조정될 수 있다.

| composition                                                                                                  | 성격            | 1차 제안                               |
| ------------------------------------------------------------------------------------------------------------ | --------------- | -------------------------------------- |
| base-check-box · base-input · base-multi-select · base-radio-group · base-select · base-table · base-tooltip | styled 기본값   | §6-B 결정 대상 (brick 흡수 vs 유지)    |
| check-box-card · radio-card                                                                                  | 범용 선택 카드  | 유지(범용) 또는 afds-registry          |
| date-picker · date-picker-dropdown · range-date-picker                                                       | 날짜 선택       | 유지(범용 조합)                        |
| overflow-tooltip · ghost-select                                                                              | 유틸 변형       | 유지(범용)                             |
| alert-modal · negative-modal · popconfirm                                                                    | 모달 프리셋     | 유지 또는 afds-registry (준-도메인)    |
| period-filter · range-filter                                                                                 | 필터 블록       | **afds-registry 이관** (도메인성 높음) |
| pagination-bar · floating-action-bar-count                                                                   | 액션/페이지 바  | afds-registry 이관 후보                |
| page-layout · section-error-fallback                                                                         | 레이아웃/도메인 | afds-registry 이관 후보                |

## 6. 결정 필요 항목 (리뷰 안건)

- **A. npm `./compositions` entry 처리 — 확정됨(upstream #143).** 제시했던 세 선택지
  (미리보기 전용 / 0.9 deprecate·1.0 제거 / 현행 유지) 중 어느 것도 아니다 — **즉시 완전
  제거**를 택했다. 근거: 컴포지션 소스 자체가 `packages/afds-registry`로 물리적으로 이전되어(사용자
  결정 "afds에 컴포지션이 있을 필요가 없다") 남겨 둘 npm entry 대상이 없어졌다. `exports`에서
  `./compositions`를 뺐고, 표준 `shadcn add`(복사-소유)가 유일한 배포 채널이다.
- **B. "styled 기본값"(base-\*) 처리**: (a) brick 흡수, (b) composition 유지 — 택1.
- **C. 23종 재분류 확정**: §5 표를 검토·수정.
- **D. F5 해석기 연계**: 시안→AFDS 해석기 리포트가 갭을 "brick 갭 vs 조합 갭"으로 구분 출력하게 하면, 이 경계 기준이 로드맵이 아니라 실사용 속에서 운영된다 (X2 ↔ F5).

## 관련 문서

- Astryx 분석 X1/X2: [astryx-analysis-insights.md](./astryx-analysis-insights.md)
- 설계 철학(AFDS = 필수 소형): [afds-component-philosophy.md](../../../.claude/rules/afds-component-philosophy.md)
- 컴포넌트 개요: [overview.md](./overview.md)
