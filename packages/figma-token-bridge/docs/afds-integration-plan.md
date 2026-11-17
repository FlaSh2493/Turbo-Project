# AFDS × figma-token-bridge 통합 계획

> **작성일:** 2026-02-27
> **최종 업데이트:** 2026-02-28
> **대상:** `packages/afds` 토큰 시스템을 `figma-token-bridge` 기반으로 전환
> **현재 상태:** figma-token-bridge v0.1.0 완성 (105/105 테스트 통과), AFDS 통합 준비 완료

---

## 1. 현황 분석

### 1-1. AFDS 현재 토큰 구조

```
packages/afds/tokens/
├── tokens.css              # @theme + :root 수동 작성 (204줄)
├── tokens.dark.css         # .dark {} 수동 작성 (45줄)
├── tokens.ts               # TypeScript 타입 + Zod 수동 작성 (167줄)
├── tokens.components.css   # 컴포넌트 tier 수동 작성
└── json/
    └── semantics/
        └── components/     # 컴포넌트 레벨 JSON (현재 사용 미확인)
```

**현재 문제점:**

- `tokens.css`, `tokens.dark.css`, `tokens.ts` 세 파일을 **수동으로 동기화** 해야 함
- Figma에서 토큰이 변경되면 세 파일을 모두 직접 수정 → 누락 위험
- CSS 변수명 규칙 현황: `--color-gray-*` (@theme), `--color-surface` (:root semantic)
- DTCG JSON 소스 파일 없음 → Figma 토큰 export 자동화 불가

### 1-2. figma-token-bridge 현재 상태 (v0.1.0 완성)

```
packages/figma-token-bridge/
├── src/
│   ├── generate.ts      ✅ loadTiers() 헬퍼, path traversal 방어, E008 분리
│   ├── schema/
│   │   ├── validate.ts  ✅ E007 CSS injection (@포함), JSON 구조검증
│   │   └── dtcg.schema.ts ✅ flattenTokens 깊이 제한(20)
│   ├── resolvers/
│   │   └── alias.ts     ✅ DFS 순환 참조 감지
│   └── transform/
│       ├── to-css.ts    ✅ SAFE_SELECTOR_RE export
│       └── to-ts.ts     ✅ 백틱/템플릿 리터럴 이스케이프
├── cli/index.ts         ✅ SAFE_SELECTOR_RE import, isValidConfig
└── tests/               105/105 pass (95.42% statements)
```

**생성 파일 규칙:**

| tier                 | CSS 변수 패턴                | 예시                    |
| -------------------- | ---------------------------- | ----------------------- |
| primitive (`@theme`) | `--color-{namespace}-{name}` | `--color-afds-gray-500` |
| semantic (`:root`)   | `--{namespace}-color-{name}` | `--afds-color-surface`  |
| dark (`.dark`)       | `--{namespace}-color-{name}` | `--afds-color-surface`  |

---

## 2. 목표 아키텍처

```
Figma
  ↓ (Figma Token Studio / Variables export)
packages/afds/tokens/json/
  ├── primitive.tokens.json   # raw values (색상값, spacing px, ...)
  ├── semantic.tokens.json    # alias 참조 (light mode)
  └── dark.tokens.json        # alias 참조 (dark mode override)
  ↓ (figma-token-bridge generate)
packages/afds/tokens/
  ├── tokens.css              # @theme 블록 (Tailwind v4 클래스) ← generated
  ├── tokens.semantic.css     # :root 블록 (--afds-color-* semantic) ← generated
  ├── tokens.dark.css         # .dark 블록 (dark mode override) ← generated
  └── tokens.ts               # TypeScript 타입 + Zod ← generated
```

---

## 3. CSS 변수 네이밍 전환 분석

현재 AFDS와 figma-token-bridge 출력의 차이:

| 현재 (수동, tokens.css @theme) | 변환 후 (generated)        | 비고           |
| ------------------------------ | -------------------------- | -------------- |
| `--color-gray-500`             | `--color-afds-gray-500`    | namespace 추가 |
| `--color-primary-500`          | `--color-afds-primary-500` | namespace 추가 |

| 현재 (수동, tokens.css :root) | 변환 후 (generated)    | 비고                    |
| ----------------------------- | ---------------------- | ----------------------- |
| `--color-surface`             | `--afds-color-surface` | namespace prefix로 이동 |
| `--color-brand`               | `--afds-color-brand`   | namespace prefix로 이동 |
| `--color-fg`                  | `--afds-color-fg`      | namespace prefix로 이동 |

**⚠ 브레이킹 체인지:**

1. `@theme`: `--color-gray-*` → `--color-afds-gray-*` (Tailwind 클래스 변경)
2. `:root`: `--color-surface` → `--afds-color-surface` (컴포넌트 CSS 수정 필요)

**마이그레이션 전략:**

1. 컴포넌트 CSS를 새 변수명으로 일괄 치환
2. Storybook 시각적 회귀 테스트로 확인
3. 수동 작성 파일 제거

---

## 4. DTCG JSON 설계

### 4-1. primitive.tokens.json

```json
{
  "color": {
    "white": { "$value": "#ffffff", "$type": "color" },
    "black": { "$value": "#000000", "$type": "color" },
    "gray": {
      "50": { "$value": "#fafafa", "$type": "color" },
      "100": { "$value": "#f8f8f8", "$type": "color" },
      "200": { "$value": "#eeeeee", "$type": "color" },
      "300": { "$value": "#dddddd", "$type": "color" },
      "400": { "$value": "#bbbbbb", "$type": "color" },
      "500": { "$value": "#888888", "$type": "color" },
      "600": { "$value": "#777777", "$type": "color" },
      "700": { "$value": "#3d3d3d", "$type": "color" },
      "800": { "$value": "#222222", "$type": "color" },
      "900": { "$value": "#111111", "$type": "color" },
      "950": { "$value": "#0a0a0a", "$type": "color" }
    },
    "primary": {
      "50": { "$value": "#fafaff", "$type": "color" },
      "100": { "$value": "#f0f1ff", "$type": "color" },
      "200": { "$value": "#d4d8ff", "$type": "color" },
      "300": { "$value": "#8896ff", "$type": "color" },
      "400": { "$value": "#6b7cfc", "$type": "color" },
      "500": { "$value": "#556af9", "$type": "color" },
      "600": { "$value": "#4458e0", "$type": "color" },
      "700": { "$value": "#3344c7", "$type": "color" },
      "800": { "$value": "#1a1f3f", "$type": "color" },
      "900": { "$value": "#0f1229", "$type": "color" },
      "950": { "$value": "#080a18", "$type": "color" }
    },
    "red": {
      "50": { "$value": "#fef2f2", "$type": "color" },
      "500": { "$value": "#c00000", "$type": "color" },
      "700": { "$value": "#800000", "$type": "color" }
    },
    "yellow": {
      "50": { "$value": "#fff8e6", "$type": "color" },
      "500": { "$value": "#ff9900", "$type": "color" }
    },
    "green": {
      "50": { "$value": "#f0fdf4", "$type": "color" },
      "500": { "$value": "#22c55e", "$type": "color" }
    }
  },
  "spacing": {
    "0": { "$value": "0px", "$type": "dimension" },
    "1": { "$value": "4px", "$type": "dimension" },
    "2": { "$value": "8px", "$type": "dimension" },
    "3": { "$value": "12px", "$type": "dimension" },
    "4": { "$value": "16px", "$type": "dimension" },
    "5": { "$value": "20px", "$type": "dimension" },
    "6": { "$value": "24px", "$type": "dimension" },
    "8": { "$value": "32px", "$type": "dimension" }
  },
  "radius": {
    "none": { "$value": "0px", "$type": "dimension" },
    "sm": { "$value": "4px", "$type": "dimension" },
    "md": { "$value": "6px", "$type": "dimension" },
    "lg": { "$value": "8px", "$type": "dimension" },
    "xl": { "$value": "12px", "$type": "dimension" },
    "full": { "$value": "9999px", "$type": "dimension" }
  }
}
```

### 4-2. semantic.tokens.json

```json
{
  "color": {
    "surface": { "$value": "{color.white}", "$type": "color" },
    "surface-subtle": { "$value": "{color.gray.50}", "$type": "color" },
    "surface-muted": { "$value": "{color.gray.100}", "$type": "color" },
    "fg": { "$value": "{color.gray.700}", "$type": "color" },
    "fg-muted": { "$value": "{color.gray.500}", "$type": "color" },
    "fg-inverse": { "$value": "{color.white}", "$type": "color" },
    "brand": { "$value": "{color.primary.500}", "$type": "color" },
    "brand-hover": { "$value": "{color.primary.600}", "$type": "color" },
    "error": { "$value": "{color.red.500}", "$type": "color" },
    "warning": { "$value": "{color.yellow.500}", "$type": "color" },
    "success": { "$value": "{color.green.500}", "$type": "color" },
    "line": { "$value": "{color.gray.200}", "$type": "color" },
    "link": { "$value": "{color.primary.500}", "$type": "color" },
    "error-subtle": { "$value": "{color.red.50}", "$type": "color" },
    "warning-subtle": { "$value": "{color.yellow.50}", "$type": "color" },
    "success-subtle": { "$value": "{color.green.50}", "$type": "color" },
    "brand-subtle": { "$value": "{color.primary.50}", "$type": "color" },
    "fg-disabled": { "$value": "{color.gray.400}", "$type": "color" },
    "surface-disabled": { "$value": "{color.gray.100}", "$type": "color" },
    "error-hover": { "$value": "{color.red.700}", "$type": "color" }
  }
}
```

### 4-3. dark.tokens.json

```json
{
  "color": {
    "surface": { "$value": "{color.gray.900}", "$type": "color" },
    "surface-subtle": { "$value": "{color.gray.800}", "$type": "color" },
    "surface-muted": { "$value": "{color.gray.700}", "$type": "color" },
    "fg": { "$value": "{color.gray.100}", "$type": "color" },
    "fg-muted": { "$value": "{color.gray.400}", "$type": "color" },
    "fg-inverse": { "$value": "{color.gray.900}", "$type": "color" },
    "line": { "$value": "{color.gray.700}", "$type": "color" }
  }
}
```

> **참고:** dark tier의 `error-subtle`, `warning-subtle`, `success-subtle`, `brand-subtle`은
> raw 값(`#3d1111` 등)을 사용 중 — alias가 없으므로 W003 경고 발생. `--no-strict`로 처리하거나
> primitive에 dark 팔레트 추가 필요.

---

## 5. token-bridge.config.ts

```typescript
// packages/afds/token-bridge.config.ts
import { defineConfig } from '@turbo-project/figma-token-bridge'

export default defineConfig({
  namespace: 'afds',

  tiers: {
    primitive: {
      source: 'tokens/json/primitive.tokens.json',
      output: 'tokens/tokens.css',
      tailwind: true,
    },
    semantic: {
      source: 'tokens/json/semantic.tokens.json',
      output: 'tokens/tokens.semantic.css',
    },
    dark: {
      source: 'tokens/json/dark.tokens.json',
      output: 'tokens/tokens.dark.css',
      selector: '.dark',
    },
  },

  typescript: {
    output: 'tokens/tokens.ts',
    zod: true,
  },
})
```

---

## 6. 단계별 적용 로드맵

### Phase 1 — DTCG JSON 작성 및 검증

- [ ] `packages/afds/tokens/json/primitive.tokens.json` 작성 (섹션 4-1 기준)
- [ ] `packages/afds/tokens/json/semantic.tokens.json` 작성 (섹션 4-2 기준)
- [ ] `packages/afds/tokens/json/dark.tokens.json` 작성 (섹션 4-3 기준)
- [ ] `packages/afds/token-bridge.config.ts` 작성
- [ ] `figma-token-bridge`를 afds devDependency에 추가:
  ```bash
  pnpm --filter @turbo-project/afds add -D figma-token-bridge
  ```
- [ ] `pnpm figma-token-bridge validate` 실행하여 토큰 검증

### Phase 2 — 생성 파이프라인 연결

- [ ] `afds/package.json`에 스크립트 추가:
  ```json
  "generate:tokens": "figma-token-bridge generate --config token-bridge.config.ts",
  "build": "pnpm generate:tokens && tsup"
  ```
- [ ] 생성 실행: `pnpm generate:tokens`
- [ ] 생성된 파일과 기존 수동 파일 diff 비교 (누락 항목 확인)
- [ ] `tokens.semantic.css` 신규 파일을 `global.css`에서 import 추가:
  ```css
  @import './tokens/tokens.semantic.css';
  ```

### Phase 3 — 컴포넌트 CSS 변수명 마이그레이션

컴포넌트 CSS에서 변수명 패턴 변경:

| 변경 전                  | 변경 후                     |
| ------------------------ | --------------------------- |
| `var(--color-surface)`   | `var(--afds-color-surface)` |
| `var(--color-brand)`     | `var(--afds-color-brand)`   |
| `var(--color-fg)`        | `var(--afds-color-fg)`      |
| `var(--color-line)`      | `var(--afds-color-line)`    |
| `bg-gray-500` (Tailwind) | `bg-afds-gray-500`          |

```bash
# 대상 파일 파악
grep -r -- '--color-surface\|--color-brand\|--color-fg\|--color-line' \
  packages/afds/src --include='*.style.ts' -l
```

- [ ] 컴포넌트 CSS 변수명 일괄 치환 (alert, badge, button, dialog, drawer, dropdown-menu, icon-button, toast)
- [ ] `tokens.components.css`의 `var(--color-*)` → `var(--afds-color-*)` 치환
- [ ] Storybook 시각적 확인 (라이트 / 다크 토글)
- [ ] 기존 수동 작성 `:root` 블록 (`tokens.css` 하단) 제거

### Phase 4 — CI 통합

- [ ] Turbo 파이프라인에 `generate:tokens` 태스크 추가:
  ```json
  {
    "tasks": {
      "generate:tokens": {
        "inputs": ["tokens/json/**/*.json", "token-bridge.config.ts"],
        "outputs": [
          "tokens/tokens.css",
          "tokens/tokens.semantic.css",
          "tokens/tokens.dark.css",
          "tokens/tokens.ts"
        ]
      },
      "build": {
        "dependsOn": ["generate:tokens", "^build"]
      }
    }
  }
  ```
- [ ] CI에서 `--strict` 플래그 적용
- [ ] 생성 파일 git 추적 여부 결정 (권장: 추적 — diff로 토큰 변경 가시성 확보)

### Phase 5 — Figma 자동화 (선택, 별도 일정)

- [ ] Figma Token Studio 또는 Variables Export 플러그인으로 DTCG JSON 자동 export
- [ ] GitHub Actions: Figma export → PR 자동 생성
- [ ] 토큰 변경 diff 알림 설정

---

## 7. 검증 체크리스트

```bash
# 1. 토큰 유효성 검사
pnpm figma-token-bridge validate --strict

# 2. 생성 실행
pnpm generate:tokens

# 3. CSS 변수 수량 확인 (기존 대비 누락 없는지)
grep -c '^  --' tokens/tokens.css
grep -c '^  --' tokens/tokens.semantic.css

# 4. TypeScript 타입 확인
pnpm check-types

# 5. 테스트 통과 확인
pnpm test
```

**시각적 확인:**

- [ ] Storybook에서 Button, Alert, Badge, Dialog, Drawer, Toast 렌더링 확인
- [ ] 라이트 모드 / 다크 모드 토글 정상 동작
- [ ] 레거시 `--color-*` 변수 미사용 확인 (`grep -r -- '--color-surface' src/`)

---

## 8. 예상 리스크 및 대응

| 리스크                                                      | 가능성 | 대응                                             |
| ----------------------------------------------------------- | ------ | ------------------------------------------------ |
| CSS 변수명 변경으로 컴포넌트 렌더링 깨짐                    | 높음   | Phase 3에서 일괄 치환 + Storybook 확인           |
| Tailwind 클래스명 변경 (`bg-gray-500` → `bg-afds-gray-500`) | 높음   | 컴포넌트 tsx 파일도 치환 필요                    |
| dark `*-subtle` 토큰 raw 값 W003 경고                       | 중간   | primitive에 dark 팔레트 추가 또는 `--no-strict`  |
| `tokens.components.css` 미관리                              | 낮음   | 별도 config tier로 추후 분리 또는 현행 수동 유지 |

---

## 9. figma-token-bridge v0.1.0 완성 항목

이번 세션에서 완료된 보안/품질 개선:

| #   | 분류   | 내용                                                  | 파일                        |
| --- | ------ | ----------------------------------------------------- | --------------------------- |
| H2  | High   | `loadTiers()` 헬퍼 추출 (generate/validate 중복 제거) | `generate.ts`               |
| H3  | High   | `realResolved` non-null assertion 제거                | `generate.ts`               |
| H4  | High   | `CSS_UNSAFE_RE`에 `@` 추가 (at-rule 인젝션 방어)      | `validate.ts`               |
| H5  | High   | `escapeTsString` 백틱/`${` 이스케이프 추가            | `to-ts.ts`                  |
| M2  | Medium | `SAFE_SELECTOR_RE` 단일 소스 (export/import)          | `to-css.ts`, `cli/index.ts` |
| M5  | Medium | E007/E008/E009 에러 코드 문서 추가                    | `error-strategy.md`         |
| —   | Test   | E005 catch 브랜치 테스트 5개 추가                     | `coverage.test.ts`          |

**최종 테스트:** 105/105 pass | Security PASS | Quality PASS | Architecture PASS
