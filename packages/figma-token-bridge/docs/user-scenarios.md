# figma-token-bridge 사용 시나리오

> 이 문서는 `figma-token-bridge`의 동작 원리와 주요 사용 시나리오를 설명합니다.

---

## 전체 동작 흐름

```
┌─────────────────────────────────────────────────────────────┐
│                         Figma                               │
│   Variables: Primitive/Color/Gray/500  →  #888888           │
│              Semantic/Color/Surface    →  {Primitive/...}   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │  플러그인으로 DTCG JSON 내보내기
                      │  (또는 직접 편집)
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   DTCG JSON 파일들                           │
│            ← 유일한 편집 대상 (단일 진실의 원천) →            │
│                                                             │
│  tokens.primitive.json   원시값: #ffffff, 16px, ...         │
│  tokens.semantic.json    의미값: {color.primary.500}, ...   │
│  tokens.dark.json        다크모드 override                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │  figma-token-bridge generate
                      │
                      ├─── 1. JSON 파일 로드
                      ├─── 2. DTCG 스펙 검증 (에러 시 중단)
                      ├─── 3. CSS 변수 생성
                      └─── 4. TypeScript 타입 생성
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              생성 파일들 (⚠ DO NOT EDIT DIRECTLY)            │
│                                                             │
│  primitive.css    @theme { --color-afds-gray-500: ... }     │
│  semantic.css     :root  { --afds-color-surface: ... }      │
│  dark.css         .dark  { --afds-color-surface: ... }      │
│  tokens.ts        PrimitiveColorSchema, SemanticColor, ...  │
└─────────────────────────────────────────────────────────────┘
```

---

## 파이프라인 내부 동작 상세

```
generate() 호출
      │
      ├─ [단계 0] tier 설정 확인
      │    tier가 하나도 없으면 W004 경고 → 종료 (ok: true)
      │
      ├─ [단계 1] JSON 로드
      │    primitive.json ─── 파싱 ──► DtcgFile 객체
      │    semantic.json  ─── 파싱 ──► DtcgFile 객체    ✗ 파일 없음 → E006
      │    dark.json      ─── 파싱 ──► DtcgFile 객체    ✗ JSON 오류 → E005
      │
      ├─ [단계 2] 검증 (Validation)
      │    validatePrimitive()
      │      ├─ $type 누락?          → E001 (error, 중단)
      │      ├─ $type 허용값 외?     → E002 (error, 중단)
      │      ├─ primitive에서 alias? → W003 (warning, 계속)
      │      ├─ $description 없음?   → W002 (warning, 계속)
      │      └─ 순환 참조?           → E004 (error, 중단)
      │
      │    validateSemantic()
      │      ├─ $type 누락/오류      → E001, E002
      │      ├─ alias 참조 대상 없음 → E003 (error) + 사용 가능 토큰 힌트
      │      ├─ $description 없음?   → W002
      │      ├─ 순환 참조?           → E004
      │      └─ 미사용 primitive?    → I001 (info, --verbose 시 표시)
      │
      │    validateDark()
      │      ├─ $type 누락/오류      → E001, E002
      │      └─ semantic에 없는 토큰?→ W001 (warning, 계속)
      │
      │    error 있음? ──────────────────────────► ok: false 반환 (파일 생성 안 함)
      │    warning만 있음? ─────────────────────► 계속 진행
      │
      ├─ [단계 3] CSS 생성
      │    primitive ─► @theme { } 또는 :root { }    (tailwind 옵션에 따라)
      │    semantic  ─► :root { }
      │    dark      ─► .dark { } 또는 커스텀 selector
      │
      │    alias 변환: {color.primary.500} ──► var(--color-afds-primary-500)
      │                                        (빌드타임 인라인 아님 → 런타임 참조)
      │
      └─ [단계 4] TypeScript 생성
           primitive color ─► PrimitiveColorSchema (z.enum)
           semantic color  ─► SemanticColorSchema (z.enum) + semanticColor() 헬퍼
```

---

## CSS 변수명 변환 규칙

```
Primitive tier:   {category}.{path}      →  --{category}-{namespace}-{path}
  color.gray.500                         →  --color-afds-gray-500
  spacing.4                              →  --spacing-afds-4
  radius.lg                              →  --radius-afds-lg

Semantic/Dark tier:  {category}.{path}  →  --{namespace}-{category}-{path}
  color.surface                          →  --afds-color-surface
  color.fg                               →  --afds-color-fg
```

---

## 시나리오 1: 최초 설정

디자인시스템 프로젝트에 처음 도입하는 경우입니다.

### 1-1. 설치

```bash
pnpm add figma-token-bridge
```

### 1-2. config 파일 생성

```ts
// token-bridge.config.ts
import { defineConfig } from 'figma-token-bridge'

export default defineConfig({
  namespace: 'afds', // CSS 변수 prefix: --color-afds-*, --afds-color-*

  tiers: {
    primitive: {
      source: './tokens/tokens.primitive.json',
      output: './tokens/primitive.css',
      tailwind: true, // true → @theme {}, false/생략 → :root {}
    },
    semantic: {
      source: './tokens/tokens.semantic.json',
      output: './tokens/semantic.css',
    },
    dark: {
      source: './tokens/tokens.dark.json',
      output: './tokens/dark.css',
      selector: '.dark', // 생략 시 기본값: '.dark'
    },
  },

  typescript: {
    output: './tokens/tokens.ts',
    zod: true, // false → 타입만 (Zod 없이)
  },
})
```

### 1-3. DTCG JSON 작성 (또는 Figma 플러그인으로 내보내기)

**tokens/tokens.primitive.json** — 원시값. 컴포넌트에서 직접 사용하지 않음.

```jsonc
{
  "color": {
    "gray": {
      "500": { "$value": "#888888", "$type": "color", "$description": "중간 회색" },
      "700": { "$value": "#3d3d3d", "$type": "color", "$description": "어두운 회색" },
    },
    "primary": {
      "500": { "$value": "#556af9", "$type": "color", "$description": "브랜드 메인" },
    },
  },
  "spacing": {
    "4": { "$value": "16px", "$type": "dimension", "$description": "기본 간격" },
  },
}
```

**tokens/tokens.semantic.json** — 의미값. alias로 primitive를 참조.

```jsonc
{
  "color": {
    "fg": { "$value": "{color.gray.700}", "$type": "color", "$description": "기본 텍스트" },
    "brand": { "$value": "{color.primary.500}", "$type": "color", "$description": "브랜드 색상" },
  },
}
```

**tokens/tokens.dark.json** — 다크모드에서 semantic 토큰을 override.

```jsonc
{
  "color": {
    "fg": { "$value": "{color.gray.500}", "$type": "color", "$description": "다크모드 텍스트" },
  },
}
```

### 1-4. 생성 실행

```bash
npx figma-token-bridge generate
```

```
figma-token-bridge generate

Validating...
Generating...
  ✓ ./tokens/primitive.css
  ✓ ./tokens/semantic.css
  ✓ ./tokens/dark.css
  ✓ ./tokens/tokens.ts

Done.
```

---

## 시나리오 2: Figma에서 토큰 업데이트 후 반영

디자이너가 Figma Variables를 수정하고, 개발자가 코드에 반영하는 반복 작업입니다.

```
[디자이너]                               [개발자]
     │                                       │
     │ 1. Figma Variables 수정               │
     │    (색상 변경, 토큰 추가 등)            │
     │                                       │
     │ 2. DTCG 플러그인으로 JSON 내보내기      │
     │    → PR 또는 직접 커밋                 │
     │                                       │
     │                                       │ 3. JSON 파일 변경 확인
     │                                       │
     │                                       │ 4. 검증 먼저 실행
     │                                       │    $ figma-token-bridge validate
     │                                       │
     │                                       │ 5. 문제 없으면 생성
     │                                       │    $ figma-token-bridge generate
     │                                       │
     │                                       │ 6. 생성된 CSS/TS 파일 커밋
     │                                       │    (generated 파일은 직접 편집 금지)
```

### 2-1. 검증 실행 (파일 생성 없음)

```bash
npx figma-token-bridge validate

# 성공
✓ Validation passed.

# 실패 예시 — 수정할 위치와 사용 가능한 값을 알려줌
✗ [E003] tokens.semantic.json → color.brand
  Alias '{color.primary.999}' not found in primitive tokens.
  Available: color.primary.400, color.primary.500, color.primary.600
```

### 2-2. 생성 실행

```bash
npx figma-token-bridge generate

# warning이 있어도 생성은 진행됨
⚠ [W002] tokens.primitive.json → color.gray.50
  Missing '$description'.

Generating...
  ✓ ./tokens/primitive.css
Done. 1 warning(s)
```

---

## 시나리오 3: 에러 상황 대응

### E001 — `$type` 누락

```jsonc
// 잘못된 토큰
"color": {
  "brand": { "$value": "#556af9" }   // $type 없음!
}
```

```bash
$ figma-token-bridge generate
✗ [E001] tokens.primitive.json → color.brand
  Missing '$type' field.

1 error(s) found. Generation aborted.
```

**해결**: `"$type": "color"` 추가.

---

### E003 — alias 참조 대상 없음

```jsonc
// semantic에서 존재하지 않는 primitive 참조
"color": {
  "brand": { "$value": "{color.primary.999}", "$type": "color" }
}
```

```bash
✗ [E003] tokens.semantic.json → color.brand
  Alias '{color.primary.999}' not found in primitive tokens.
  Available: color.primary.400, color.primary.500, color.primary.600
```

**해결**: alias 경로를 올바른 primitive 토큰으로 수정.

---

### E004 — 순환 참조

```jsonc
// A → B → A 순환
"color": {
  "a": { "$value": "{color.b}", "$type": "color" },
  "b": { "$value": "{color.a}", "$type": "color" }
}
```

```bash
✗ [E004] tokens.semantic.json → color.a
  Circular alias reference detected.
```

---

### W001 — dark tier에서 없는 semantic 토큰 override

```jsonc
// dark.json에 semantic에 없는 토큰 정의 → 효과 없음
"color": {
  "chart-1": { "$value": "{color.primary.400}", "$type": "color" }
}
```

```bash
⚠ [W001] tokens.dark.json → color.chart-1
  Token 'color.chart-1' does not exist in semantic tokens. This override will have no effect.
```

**의미**: dark.json은 semantic.json에 있는 토큰만 override 가능합니다.

---

## 시나리오 4: Tailwind 없는 환경

`tailwind` 옵션을 생략하면 `@theme` 대신 `:root`로 생성됩니다.

```ts
// token-bridge.config.ts
export default defineConfig({
  namespace: 'myds',
  tiers: {
    primitive: {
      source: './tokens/tokens.primitive.json',
      output: './tokens/primitive.css',
      // tailwind 생략 → :root {} 생성
    },
  },
})
```

```css
/* primitive.css — @theme 없이 :root로 생성 */
:root {
  --color-myds-gray-500: #888888;
  --color-myds-primary-500: #556af9;
}
```

---

## 시나리오 5: API로 직접 사용 (Node.js 스크립트)

CLI 대신 Node.js 스크립트나 빌드 파이프라인에 통합하는 경우입니다.

```ts
import { generate, validate, defineConfig } from 'figma-token-bridge'

const config = defineConfig({
  namespace: 'afds',
  tiers: {
    primitive: {
      source: './tokens/tokens.primitive.json',
      output: './tokens/primitive.css',
      tailwind: true,
    },
    semantic: {
      source: './tokens/tokens.semantic.json',
      output: './tokens/semantic.css',
    },
  },
})

// 1단계: 검증만
const validResult = await validate(config)
if (!validResult.ok) {
  validResult.errors.forEach(e => console.error(`[${e.code}] ${e.location}: ${e.message}`))
  process.exit(1)
}

// 2단계: 생성
const genResult = await generate(config)
if (!genResult.ok) {
  console.error('Generation failed')
  process.exit(1)
}

console.log('Generated:', genResult.generated)
// → ['./tokens/primitive.css', './tokens/semantic.css']
```

---

## 시나리오 6: CI/CD 파이프라인 통합

PR 단계에서 토큰 검증을 자동화합니다.

```yaml
# .github/workflows/token-check.yml
- name: Validate design tokens
  run: npx figma-token-bridge validate --strict
  # --strict: warning도 에러로 처리 → CI 실패
```

```bash
# --strict 옵션: warning을 에러로 처리
$ figma-token-bridge validate --strict

⚠ [W002] tokens.primitive.json → color.gray.50
  Missing '$description'.

1 warning(s) in strict mode. Generation aborted.
# exit code 2
```

**종료 코드**:

| 코드 | 의미                             |
| ---- | -------------------------------- |
| `0`  | 성공 (warning 있어도 0)          |
| `1`  | error 발생으로 중단              |
| `2`  | `--strict` 모드에서 warning 발생 |
| `3`  | config 파일 로드 실패            |

---

## 생성 결과물 예시

### primitive.css (tailwind: true)

```css
/* generated by figma-token-bridge — DO NOT EDIT DIRECTLY */

@theme {
  --color-afds-gray-500: #888888;
  --color-afds-gray-700: #3d3d3d;
  --color-afds-primary-500: #556af9;
  --spacing-afds-4: 16px;
}
```

### semantic.css

```css
/* generated by figma-token-bridge — DO NOT EDIT DIRECTLY */

:root {
  --afds-color-fg: var(--color-afds-gray-700);
  --afds-color-brand: var(--color-afds-primary-500);
}
```

### dark.css

```css
/* generated by figma-token-bridge — DO NOT EDIT DIRECTLY */

.dark {
  --afds-color-fg: var(--color-afds-gray-500);
}
```

> **다크모드 동작 원리**: semantic은 `var()` 런타임 참조를 사용합니다.
> `.dark` 클래스에서 primitive 변수를 override하면 semantic이 자동으로 새 값을 참조합니다.
>
> ```
> 라이트: --color-afds-gray-700 = #3d3d3d
>         --afds-color-fg = var(--color-afds-gray-700)  →  #3d3d3d
>
> 다크:   .dark { --afds-color-fg: var(--color-afds-gray-500) }
>         --color-afds-gray-500 = #888888
>         --afds-color-fg                               →  #888888
> ```

### tokens.ts

```ts
/**
 * generated by figma-token-bridge — DO NOT EDIT DIRECTLY
 */

import { z } from 'zod'

export const PrimitiveColorSchema = z.enum(['afds-gray-500', 'afds-gray-700', 'afds-primary-500'])
export type PrimitiveColor = z.infer<typeof PrimitiveColorSchema>

export const SemanticColorSchema = z.enum(['fg', 'brand'])
export type SemanticColor = z.infer<typeof SemanticColorSchema>

/**
 * semantic color token을 CSS var() 참조로 변환
 * @example semanticColor('brand') → 'var(--afds-color-brand)'
 */
export function semanticColor(token: SemanticColor): string {
  return `var(--afds-color-${token})`
}
```

---

## CLI 옵션 요약

```bash
figma-token-bridge <command> [options]

Commands:
  generate   DTCG JSON → CSS + TypeScript 생성
  validate   DTCG JSON 검증만 (파일 생성 없음)

Options:
  --config <path>  config 파일 경로 (기본: token-bridge.config.ts 자동 탐색)
  --strict         warning을 error로 처리 (CI 권장)
  --verbose        info 메시지 출력 (미사용 primitive 토큰 등)
  --quiet          성공 메시지 숨김
```

---

## 에러/경고 코드 빠른 참조

| 코드 | 레벨    | 의미                                                      | 생성 중단? |
| ---- | ------- | --------------------------------------------------------- | ---------- |
| E001 | error   | `$type` 필드 누락                                         | 중단       |
| E002 | error   | 허용되지 않은 `$type` 값                                  | 중단       |
| E003 | error   | alias 참조 대상이 primitive에 없음                        | 중단       |
| E004 | error   | 순환 alias 참조                                           | 중단       |
| E005 | error   | JSON 파싱 실패                                            | 중단       |
| E006 | error   | 소스 파일을 찾을 수 없음                                  | 중단       |
| W001 | warning | dark tier에서 semantic에 없는 토큰 override               | 계속       |
| W002 | warning | `$description` 누락                                       | 계속       |
| W003 | warning | primitive 토큰에서 alias 사용                             | 계속       |
| W004 | warning | tier가 하나도 설정되지 않음                               | 계속       |
| I001 | info    | semantic에서 참조 안 된 primitive 토큰 (`--verbose` 필요) | 계속       |
