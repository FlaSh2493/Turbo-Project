# figma-token-bridge

Figma Variables ↔ 코드 사이의 **범용 디자인 토큰 변환 레이어**.
W3C DTCG JSON을 단일 진실의 원천으로 삼아 CSS Variables와 TypeScript 타입을 자동 생성합니다.

## 개요

```
Figma Variables
    ↓ (Token Studio / Variables export)
DTCG JSON  ←── 단일 진실의 원천 (직접 편집)
    ↓  figma-token-bridge generate
CSS Variables + TypeScript  ←── generated (편집 금지)
```

## 핵심 설계 철학 (Design Principles)

1. **단일 진실의 원천 (Single Source of Truth)**: Figma에서 추출된 W3C 표준 DTCG(Design Tokens Community Group) JSON만을 유일한 원천으로 삼습니다. 브릿지 레벨에서의 임의 값 변형은 허용하지 않습니다.
2. **안전성 최우선 (Security & Stability)**: 런타임 콜스택 오버플로우를 유발하는 순환 참조(Circular Alias)를 컴파일 타임에 완벽히 차단하고, 토큰 값에 의한 CSS Injection 공격을 선제적으로 방어합니다.
3. **엄격한 1:1 Alias 매핑 (Strict 1:1 Alias Mapping)**: 복합 토큰(Composite Token)을 위한 문자열 내 부분 치환(String Interpolation, 예: `1px solid {color.gray.500}`)을 의도적으로 지원하지 않습니다. 1개의 토큰 값은 정확히 1개의 Alias만을 지칭해야 하며(`{color.gray.500}`), 이는 W3C 표준을 엄격하게 준수하고 파싱 예측 가능성을 극대화하기 위한 **의도적 제약(By Design)**입니다. 복잡한 형태의 조합이 필요한 경우(예: 테두리 두께, 스타일, 색상의 조합) 토큰 레벨에서 하나의 문자열로 합치는 대신, 코드 레벨의 유틸리티나 디자인 시스템의 Style(Typography, Component Recipe) 계층에서 조합하여 사용하는 것을 권장합니다.

3-Tier 구조를 지원합니다:

| Tier      | 역할              | CSS 출력                                |
| --------- | ----------------- | --------------------------------------- |
| Primitive | 원시 팔레트 값    | `@theme` 블록 (Tailwind v4 클래스 생성) |
| Semantic  | 의도 기반 alias   | `:root` 블록                            |
| Dark      | 다크모드 override | `.dark { }` 블록 (selector 설정 가능)   |

## 설치

```bash
pnpm add -D figma-token-bridge
# 또는
npm install -D figma-token-bridge
```

## 빠른 시작

### 1. config 파일 작성

```typescript
// token-bridge.config.ts
import { defineConfig } from 'figma-token-bridge'

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

### 2. DTCG JSON 작성

```jsonc
// tokens/json/primitive.tokens.json
{
  "color": {
    "gray": {
      "500": { "$value": "#888888", "$type": "color", "$description": "Gray 500" },
    },
    "primary": {
      "500": { "$value": "#556af9", "$type": "color", "$description": "Brand main" },
    },
  },
  "spacing": {
    "4": { "$value": "16px", "$type": "dimension" },
  },
  "radius": {
    "lg": { "$value": "8px", "$type": "dimension" },
  },
}
```

```jsonc
// tokens/json/semantic.tokens.json
{
  "color": {
    "surface": { "$value": "{color.white}", "$type": "color", "$description": "기본 배경" },
    "fg": { "$value": "{color.gray.700}", "$type": "color", "$description": "기본 텍스트" },
    "brand": { "$value": "{color.primary.500}", "$type": "color", "$description": "브랜드 메인" },
  },
}
```

```jsonc
// tokens/json/dark.tokens.json
{
  "color": {
    "surface": { "$value": "{color.gray.900}", "$type": "color", "$description": "다크 기본 배경" },
    "fg": { "$value": "{color.gray.100}", "$type": "color", "$description": "다크 기본 텍스트" },
  },
}
```

### 3. 생성 실행

```bash
npx figma-token-bridge generate
```

**출력 결과:**

```css
/* tokens/tokens.css — @theme (Tailwind 클래스 생성) */
@theme {
  --color-afds-gray-500: #888888;
  --color-afds-primary-500: #556af9;
  --spacing-afds-4: 16px;
  --radius-afds-lg: 8px;
}

/* tokens/tokens.semantic.css */
:root {
  --afds-color-surface: var(--color-afds-white);
  --afds-color-fg: var(--color-afds-gray-700);
  --afds-color-brand: var(--color-afds-primary-500);
}

/* tokens/tokens.dark.css */
.dark {
  --afds-color-surface: var(--color-afds-gray-900);
  --afds-color-fg: var(--color-afds-gray-100);
}
```

## CLI

```bash
# 생성 (기본: token-bridge.config.ts 자동 탐색)
figma-token-bridge generate

# config 직접 지정
figma-token-bridge generate --config ./custom.config.ts

# 검증만 실행 (파일 미생성)
figma-token-bridge validate

# 경고를 에러로 취급 (CI 권장)
figma-token-bridge generate --strict

# info 메시지 포함 출력
figma-token-bridge generate --verbose
```

## API

```typescript
import { generate, validate, defineConfig } from 'figma-token-bridge'

const config = defineConfig({ namespace: 'afds' /* ... */ })

// 검증
const result = await validate(config)
if (!result.ok) {
  console.error(result.errors)
}

// 생성
await generate(config)
```

## 네이밍 규칙

| Tier                | JSON 경로        | CSS 변수                | Tailwind 클래스          |
| ------------------- | ---------------- | ----------------------- | ------------------------ |
| primitive / color   | `color.gray.500` | `--color-afds-gray-500` | `bg-afds-gray-500`       |
| primitive / spacing | `spacing.4`      | `--spacing-afds-4`      | `p-afds-4`, `gap-afds-4` |
| primitive / radius  | `radius.lg`      | `--radius-afds-lg`      | `rounded-afds-lg`        |
| semantic / color    | `color.brand`    | `--afds-color-brand`    | —                        |

```
primitive: --{tailwind-category}-{namespace}-{path-kebab}
semantic:  --{namespace}-{category}-{path-kebab}
```

## 검증 규칙

| 코드   | 레벨    | 조건                                                                  |
| ------ | ------- | --------------------------------------------------------------------- |
| `E001` | error   | `$type` 누락                                                          |
| `E002` | error   | 허용되지 않은 `$type`                                                 |
| `E003` | error   | alias 참조 대상 없음                                                  |
| `E004` | error   | 순환 참조                                                             |
| `E005` | error   | JSON 파싱 실패                                                        |
| `E006` | error   | source 파일 없음                                                      |
| `E007` | error   | CSS injection 위험 문자 (`$value`에 `;`, `{`, `}`, `@`, `/*`, `url(`) |
| `E008` | error   | output 파일 쓰기 실패                                                 |
| `E009` | error   | 유효하지 않은 namespace                                               |
| `W001` | warning | dark tier에서 미존재 semantic 토큰 override                           |
| `W002` | warning | `$description` 누락                                                   |
| `W003` | warning | primitive에서 alias 참조 사용                                         |

**에러 시:**

```
✗ [E003] tokens.semantic.json → color.brand
  Alias '{color.primary.999}' not found in primitive tokens.
  Available: color.primary.50, color.primary.500, color.primary.600
```

## package.json 통합

```json
{
  "scripts": {
    "generate:tokens": "figma-token-bridge generate",
    "build": "pnpm generate:tokens && tsc"
  }
}
```

## 지원 `$type`

`color` · `dimension` · `shadow` · `string` · `number` · `boolean`

## 종료 코드

| 코드 | 의미                             |
| ---- | -------------------------------- |
| `0`  | 성공                             |
| `1`  | error 발생으로 생성 중단         |
| `2`  | `--strict` 모드에서 warning 발생 |
| `3`  | config 파일 로드 실패            |

## 로드맵

| 버전 | 범위                                                    |
| ---- | ------------------------------------------------------- |
| v1   | DTCG JSON → CSS + TS 변환, alias 런타임 참조, CLI + API |
| v2   | watch 모드, 에러 메시지 개선                            |
| v3   | Figma REST API 자동 export → JSON → PR 자동 생성        |
