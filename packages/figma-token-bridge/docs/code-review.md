# figma-token-bridge 종합 코드 리뷰

> 리뷰 기준일: 2026-02-27
> 리뷰어: Code Reviewer (claude-sonnet-4-6)
> 리뷰 대상: `packages/figma-token-bridge` (v0.1.0)
> 검토 파일: 11개 소스 파일 + 4개 테스트 파일
> LSP 진단 도구: `tsc --noEmit` 실행 완료

---

## 심각도 요약

| 심각도     | 건수 | 설명                                    |
| ---------- | ---- | --------------------------------------- |
| Critical   | 2    | 즉시 수정 필요 (보안 취약점, 빌드 실패) |
| Major      | 4    | 강력히 수정 권장 (버그, 설계 결함)      |
| Minor      | 7    | 수정 권장 (유지보수성, 일관성)          |
| Suggestion | 4    | 선택적 개선 (DX, 성능)                  |

---

## Critical

### [Critical-1] TypeScript 컴파일 에러 — 빌드 실패

**파일:** `src/transform/to-css.ts:100`

**LSP 진단 결과:**

```
error TS2345: Argument of type '"primitive"' is not assignable to
             parameter of type '"semantic" | "dark"'.
```

**원인:**
`generatePrimitiveCss()`에서 tailwind 옵션이 false일 때 `generateRootBlock(file, 'primitive', namespace, ':root')`를 호출한다. 그러나 `generateRootBlock()`의 tier 파라미터 타입이 `'semantic' | 'dark'`로 선언되어 있어 `'primitive'`를 전달할 수 없다.

```typescript
// to-css.ts:70 — tier 타입이 'semantic' | 'dark'로만 제한됨
function generateRootBlock(
  file: DtcgFile,
  tier: 'semantic' | 'dark',  // <-- 'primitive' 불허
  namespace: string,
  selector: string,
): string

// to-css.ts:100 — 'primitive'를 전달해 컴파일 에러 발생
: generateRootBlock(file, 'primitive', namespace, ':root')  // TS2345
```

이 에러로 인해 `tsc --noEmit`이 실패하고, tsup 빌드도 타입 검사 활성화 시 실패한다.

**수정 방법:**
`generateRootBlock`의 tier 파라미터 타입을 파일 최상위에 정의된 `Tier`(= `'primitive' | 'semantic' | 'dark'`) 타입으로 확장한다.

```typescript
// tier: 'semantic' | 'dark' → tier: Tier 로 변경
function generateRootBlock(file: DtcgFile, tier: Tier, namespace: string, selector: string): string
```

---

### [Critical-2] Path Traversal 취약점 — configDir 외부 파일 읽기/쓰기 가능

**파일:** `src/generate.ts:36`, `src/generate.ts:64`, `cli/index.ts:33`

**문제:**
`loadJson()`과 `writeFile()` 내부에서 `path.resolve(configDir, filePath)`를 사용하지만, 결과 경로가 `configDir` 내부에 있는지 검증하지 않는다. 공격자가 `source: "../../etc/passwd"` 같은 경로를 config에 삽입하면 임의 파일을 읽거나 덮어쓸 수 있다.

**실증:**

```
configDir : /safe/base/dir
filePath  : ../../etc/passwd
resolved  : /safe/etc/passwd  ← configDir 탈출 성공
```

이 패키지는 외부 제공 config를 `--config`로 받을 수 있으며, CI 환경에서 자동화된 config를 처리하는 경우 특히 위험하다.

**수정 방법:**
`path.resolve()` 직후 경로가 base 디렉터리 하위인지 검사하는 가드를 추가한다.

```typescript
function assertWithinBase(resolved: string, base: string, label: string): void {
  const normalizedBase = path.resolve(base) + path.sep
  if (!resolved.startsWith(normalizedBase)) {
    throw new Error(`Path traversal detected: '${label}' resolves outside the config directory.`)
  }
}

function loadJson(filePath: string, configDir: string) {
  const resolved = path.resolve(configDir, filePath)
  assertWithinBase(resolved, configDir, filePath) // 추가
  // ...
}
```

---

## Major

### [Major-1] Dynamic import()로 임의 코드 실행 가능 — config 로더

**파일:** `cli/index.ts:39-41`

```typescript
const mod = await import(resolved)
const config: TokenBridgeConfig = mod.default ?? mod
return { config, dir: path.dirname(resolved) }
```

**두 가지 문제:**

1. `--config`로 전달된 경로를 `import()`하므로 악성 JS/TS 파일이 Node.js 프로세스 권한으로 실행될 수 있다. `resolved`는 외부 입력(`configPath`)을 기반으로 만들어진다.

2. `mod.default ?? mod`가 `TokenBridgeConfig` 스키마를 만족하는지 런타임 검증이 없다. 잘못된 config 객체가 파이프라인 전체에 전파되어 예상치 못한 위치에서 `TypeError`가 발생할 수 있다.

**추가 문제:** Windows에서 절대경로를 `import()`할 때 `file://` URL 없이는 동작하지 않는 경우가 있다.

**수정 방법:**

```typescript
import { pathToFileURL } from 'node:url'

async function loadConfig(configPath: string) {
  const resolved = path.resolve(process.cwd(), configPath)
  // 허용된 확장자만 import
  if (!/\.(ts|js|mjs|cjs)$/.test(resolved)) {
    console.error(c.red('Config file must be a .ts, .js, .mjs, or .cjs file'))
    return null
  }
  const mod = await import(pathToFileURL(resolved).href)
  const config = mod.default ?? mod
  // 최소 런타임 검증
  if (
    typeof config !== 'object' ||
    config === null ||
    typeof config.namespace !== 'string' ||
    typeof config.tiers !== 'object'
  ) {
    console.error(c.red('Invalid config: missing required fields (namespace, tiers)'))
    return null
  }
  return { config: config as TokenBridgeConfig, dir: path.dirname(resolved) }
}
```

---

### [Major-2] 순환 참조 감지 로직의 Set 복사 방식 — 미탐 가능성

**파일:** `src/resolvers/alias.ts:27`

```typescript
return detectCircularAlias(nextPath, aliasMap, new Set(visited))
```

**문제:**
재귀 호출마다 `new Set(visited)`를 복사해 전달한다. 이 방식은 경로 추적에서 backtracking이 올바르게 작동하지 않아, 특정 그래프 구조에서 순환 참조를 감지하지 못할 수 있다.

올바른 DFS 기반 순환 감지는 단일 `visited` Set을 공유하고 재귀 리턴 시 삭제(backtrack)해야 한다.

```typescript
// 현재 방식 (문제 있음)
return detectCircularAlias(nextPath, aliasMap, new Set(visited))

// 올바른 방식
visited.add(path)
const result = detectCircularAlias(nextPath, aliasMap, visited)
visited.delete(path) // backtrack
return result
```

현재 테스트(직접/간접 순환 참조)는 통과하지만, 더 복잡한 alias 그래프에서 미탐이 발생할 수 있다.

---

### [Major-3] validate()와 generate() 간 JSON 로딩 로직 중복 — 행동 불일치 유발

**파일:** `src/generate.ts:79-197`

**문제:**
`generate()`와 `validate()`가 동일한 JSON 로딩 로직을 각각 독립적으로 구현한다. 구현 방식이 미묘하게 달라 행동 불일치가 발생한다.

`validate()`는 tier 로드와 검증을 교차 실행하므로, primitive 로드 실패 시에도 semantic 검증이 `primitiveFile: undefined`로 진행되어 E003 에러가 누락된다.

```typescript
// validate()의 문제 있는 패턴
if (tiers.semantic) {
  const { file, error } = loadJson(tiers.semantic.source, configDir)
  if (error) return makeLoadErrorValidation(...)  // primitive 로드 실패를 무시하고 진행
  semanticFile = file ?? undefined
  if (semanticFile) validationResults.push(
    validateSemantic(semanticFile, primitiveFile)  // primitiveFile이 undefined일 수 있음
  )
}
```

반면 `generate()`는 전체 로드 완료 후 일괄 검증하므로 이 문제가 없다.

**수정 방법:**
공통 로드 단계를 `loadTiers()` 함수로 추출하고 두 함수가 공유한다.

---

### [Major-4] CSS 값 이스케이프 없음 — 생성된 CSS 파일 오염 가능

**파일:** `src/transform/to-css.ts:59-61`, `src/transform/to-css.ts:80-82`

```typescript
const value = isAlias(token.$value)
  ? resolveAliasToVar(String(token.$value), namespace)
  : String(token.$value)
return `  ${cssVar}: ${value};`
```

**문제:**
`token.$value`를 검증 없이 CSS 변수 값으로 삽입한다. DTCG JSON에 다음 값이 포함되면 생성된 CSS가 구조적으로 오염된다.

```json
{ "$value": "#fff; } body { display: none; } :root { --x: x", "$type": "color" }
```

생성 결과:

```css
:root {
  --afds-color-surface: #fff;
}
body {
  display: none;
}
:root {
  --x: x;
}
```

검증 단계(validate.ts)에서 `$value`에 세미콜론(`;`), 중괄호(`{`, `}`)가 포함되면 에러로 차단해야 한다.

**수정 방법:**
validate.ts에 E007 코드를 추가하고, `validateTokenBase()`에서 `$value` 검증을 수행한다.

```typescript
// E007: CSS에서 허용되지 않는 문자 포함
if (typeof token.$value === 'string' && /[;{}]/.test(token.$value)) {
  messages.push({
    level: 'error',
    code: 'E007',
    location,
    message: `Token value contains forbidden CSS characters: '${token.$value}'`,
  })
}
```

---

## Minor

### [Minor-1] parseDtcgJson()이 JSON 구조를 검증하지 않고 캐스팅만 수행

**파일:** `src/schema/validate.ts:241-242`

```typescript
const parsed = JSON.parse(content)
return { file: parsed as DtcgFile, error: null }
```

`JSON.parse()` 결과가 배열, null, 문자열인 경우에도 `DtcgFile`로 통과된다. 이후 `flattenTokens()`가 `Object.entries()`를 호출하면 런타임 에러가 발생할 수 있다.

**수정 방법:**

```typescript
if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
  return {
    file: null,
    error: {
      level: 'error',
      code: 'E005',
      location: filename,
      message: 'JSON root must be an object.',
    },
  }
}
```

---

### [Minor-2] E006 에러 코드가 파일 없음과 쓰기 실패 양쪽에 재사용됨

**파일:** `src/generate.ts:132`, `src/generate.ts:139`, `src/generate.ts:146`

```typescript
if (error) return makeLoadErrorResult(tiers.primitive.output, error)
```

`makeLoadErrorResult()`는 E006("source 파일 없음") 코드를 반환하는데, 출력 파일 쓰기 실패 시에도 동일하게 사용된다. 에러 코드의 의미가 혼용되어 사용자가 "파일을 찾지 못한 것인지, 쓰기 권한이 없는 것인지" 구분할 수 없다.

**수정 방법:**
파일 쓰기 실패에 `E007` 코드를 신설하고 `makeWriteErrorResult()` 헬퍼를 분리한다. (CSS Injection 이슈에서 E007을 다른 목적으로 제안했으므로 E008이 될 수 있다.)

---

### [Minor-3] validate.ts의 location 문자열 하드코딩

**파일:** `src/schema/validate.ts:81`, `src/schema/validate.ts:135`, `src/schema/validate.ts:214`

```typescript
const location = `tokens.primitive.json → ${tokenPath}`
const location = `tokens.semantic.json → ${tokenPath}`
const location = `tokens.dark.json → ${tokenPath}`
```

실제 파일명이 아닌 고정 문자열을 사용한다. `source: './my-brand/custom-primitive.json'`으로 설정해도 에러 메시지에는 항상 `tokens.primitive.json`이 표시되어 사용자가 혼란스럽다.

**수정 방법:**
각 validator 함수에 `sourcePath` 파라미터를 추가한다.

```typescript
export function validatePrimitive(file: DtcgFile, sourcePath = 'tokens.primitive.json'): ValidationResult {
  // ...
  const location = `${sourcePath} → ${tokenPath}`
```

---

### [Minor-4] generateTypeScript()가 shadow/string/boolean 카테고리를 무시

**파일:** `src/transform/to-ts.ts:67-104`

```typescript
const colorPaths = tokens.filter(([p]) => p.startsWith('color.'))
const spacingPaths = tokens.filter(([p]) => p.startsWith('spacing.'))
const radiusPaths = tokens.filter(([p]) => p.startsWith('radius.'))
```

`DTCG_ALLOWED_TYPES`에 `shadow`, `string`, `number`, `boolean`이 포함되어 있고 tech-spec.md에도 shadow 토큰 예시가 있지만, TypeScript 생성에서 color/spacing/radius 외 카테고리는 완전히 무시된다. semantic 파일에서도 color만 처리한다.

---

### [Minor-5] flattenTokens()에 재귀 깊이 제한 없음

**파일:** `src/schema/dtcg.schema.ts:71`

```typescript
result.push(...flattenTokens(value as DtcgGroup, path))
```

재귀 깊이 제한이 없다. 악의적으로 깊게 중첩된 JSON이 제공되면 Call Stack 초과로 프로세스가 비정상 종료된다. 깊이 제한(예: 20단계)과 명확한 에러 메시지를 추가해야 한다.

---

### [Minor-6] validate()가 W004 경고를 반환하지 않음 — generate()와 행동 불일치

**파일:** `src/generate.ts:87-90`

`generate()`는 tier가 하나도 없으면 W004를 반환하지만, `validate()`는 동일 조건에서 빈 ValidationResult(`ok: true, warnings: []`)를 반환한다. `figma-token-bridge validate`를 실행하면 tier 미설정 상황에서 경고 없이 "Validation passed."를 출력한다.

---

### [Minor-7] tsconfig.json에 불필요한 `jsx: "preserve"`

**파일:** `tsconfig.json:7`

```json
"jsx": "preserve"
```

이 패키지는 React나 JSX를 전혀 사용하지 않는 순수 Node.js 툴이다. 불필요한 설정이 혼란을 준다.

---

## Suggestion

### [Suggestion-1] CLI `--config` 플래그 파싱 방어 코드 부재

**파일:** `cli/index.ts:64`

```typescript
const configArg = configFlagIdx !== -1 ? args[configFlagIdx + 1] : null
```

`--config`가 마지막 인수이거나 바로 뒤에 다른 플래그가 오면 `configArg`가 `undefined` 또는 `'--verbose'`가 된다. 현재 코드는 이를 감지하지 못하고 `findDefaultConfig()`로 폴백한다.

```bash
# configArg = '--verbose' 가 되어버림
figma-token-bridge generate --config --verbose
```

**수정 방법:**

```typescript
const nextArg = configFlagIdx !== -1 ? args[configFlagIdx + 1] : null
const configArg = nextArg && !nextArg.startsWith('--') ? nextArg : null
if (configFlagIdx !== -1 && !configArg) {
  console.error(c.red('--config requires a path argument'))
  process.exit(3)
}
```

---

### [Suggestion-2] I002가 문서에 정의되어 있으나 구현 없음

**파일:** `docs/error-strategy.md`, `src/schema/validate.ts`

`error-strategy.md`에 `I002: 동일한 값을 가진 토큰 중복`이 정의되어 있으나 validate.ts에 구현이 없다. 문서와 구현의 불일치는 혼란을 준다. 구현하거나 문서에서 제거해야 한다.

---

### [Suggestion-3] generateSemanticCss()의 `_config` 파라미터가 항상 무시됨

**파일:** `src/transform/to-css.ts:108-115`

```typescript
export function generateSemanticCss(
  file: DtcgFile,
  _config: TierConfig,   // 항상 무시됨
  namespace: string,
): string {
  const block = generateRootBlock(file, 'semantic', namespace, ':root')
```

`_config`의 `selector`가 무시되어 semantic CSS는 항상 `:root`로 고정된다. 의도적 설계라면 주석으로 이유를 명시하고, 향후 `selector` 지원이 계획되어 있다면 TODO를 남겨야 한다.

---

### [Suggestion-4] 비동기 파일 I/O 전환 고려

**파일:** `src/generate.ts:40`, `src/generate.ts:66`

`fs.readFileSync`, `fs.writeFileSync` 등 동기 I/O를 사용한다. CLI 단독 사용에서는 문제없지만, 프로그래밍 API로 사용할 때 이벤트 루프를 블로킹한다. 향후 여러 tier를 병렬 처리할 때를 위해 `fs/promises`로의 전환을 고려할 수 있다.

---

## 테스트 커버리지 분석

| 파일                    | 수준 | 누락된 케이스                                             |
| ----------------------- | ---- | --------------------------------------------------------- |
| `schema/dtcg.schema.ts` | 충분 | -                                                         |
| `schema/validate.ts`    | 부분 | E002(허용 안 된 $type), E004 통합 테스트, E005(깨진 JSON) |
| `transform/to-css.ts`   | 충분 | CSS 값 특수문자 삽입 케이스                               |
| `transform/to-ts.ts`    | 부분 | zod:false 옵션, shadow 타입 토큰                          |
| `resolvers/alias.ts`    | 충분 | 복잡한 다이아몬드 그래프 케이스                           |
| `generate.ts`           | 충분 | W004(tier 없음), validate() W004 불일치                   |
| `cli/index.ts`          | 없음 | CLI 통합 테스트 전무                                      |

**추가 권장 테스트:**

1. E002: `$type: "gradient"` 등 허용되지 않은 타입 검증
2. E005: 유효하지 않은 JSON 파일 처리
3. path traversal: `../../` 포함 경로 차단 확인
4. CSS 특수문자: 세미콜론/중괄호 포함 `$value` 차단 확인
5. CLI 통합: `child_process.spawn`으로 CLI 실행 후 stdout/exit code 검증

---

## 아키텍처 총평

### 잘된 점

- **3-tier 구조의 명확한 책임 분리**: Primitive(원시값) → Semantic(의미값) → Dark(override) 계층이 논리적이며 W3C DTCG 스펙을 충실히 따른다.
- **에러 코드 체계의 일관성**: E/W/I 레벨 분류와 코드 체계(E001~E006, W001~W004, I001)가 일관적이고, location 필드로 즉시 수정 가능한 에러 메시지를 제공한다.
- **파이프라인 설계**: validate → transform → write 순서가 명확하고 에러 시 즉시 중단 원칙이 일관되게 적용된다.
- **CSS alias 처리 전략**: alias를 빌드타임 인라인이 아닌 `var()` 런타임 참조로 처리하여 다크모드 CSS cascade가 올바르게 동작한다.
- **통합 테스트 신뢰성**: 임시 디렉터리를 활용한 실제 파일 I/O 테스트가 핵심 시나리오를 잘 커버한다.

### 개선이 필요한 부분

- **입력 신뢰 경계 없음**: CLI 도구임에도 파일 경로 검증이 없어 configDir 외부 접근이 가능하다 (Critical-2).
- **타입 캐스팅 남용**: `as DtcgFile`, `as DtcgToken` 등 런타임 검증 없는 캐스팅이 여러 곳에 있어 잘못된 JSON이 파이프라인 깊숙이 침투할 수 있다 (Minor-1).
- **generate/validate 코드 중복**: 두 함수가 로딩 로직을 공유하지 않아 tier 추가 시 양쪽 모두 수정해야 하며, 행동 불일치가 발생한다 (Major-3).

---

## 우선순위별 수정 로드맵

| 순위 | 항목                          | 이유                        |
| ---- | ----------------------------- | --------------------------- |
| 1    | Critical-1 (TS 컴파일 에러)   | 빌드 자체가 실패함          |
| 2    | Critical-2 (Path Traversal)   | 파일시스템 임의 접근 가능   |
| 3    | Major-1 (Dynamic import 검증) | 임의 코드 실행 가능         |
| 4    | Major-4 (CSS Injection)       | 생성 파일 오염 가능         |
| 5    | Major-2 (순환 참조 미탐)      | 잠재적 E004 미감지          |
| 6    | Major-3 (로딩 로직 중복)      | validate() 행동 불일치 버그 |
| 7    | Minor-1~7                     | 코드 품질 및 일관성         |
| 8    | Suggestion-1~4                | DX 및 성능 개선             |

---

_이 리뷰는 소스 코드 정적 분석, `tsc --noEmit` LSP 진단, 보안 패턴 검사(path traversal 시뮬레이션 포함)를 기반으로 작성되었습니다._
