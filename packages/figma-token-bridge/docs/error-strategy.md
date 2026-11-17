# figma-token-bridge Error Strategy

## 원칙

1. **에러는 즉시 중단** — 잘못된 토큰이 CSS/TS로 생성되는 것을 막는다
2. **경고는 계속 진행** — 불완전하지만 동작 가능한 경우
3. **info는 조용히 기록** — 개선 가능성 힌트, 기본적으로 숨김
4. **에러 메시지는 위치를 포함** — 파일명 + JSON 경로로 즉시 수정 가능하게

---

## 레벨 정의

### `error` — 생성 중단

파일이 생성되지 않습니다. 반드시 수정 후 재실행해야 합니다.

| 코드   | 조건                    | 예시                                                    |
| ------ | ----------------------- | ------------------------------------------------------- |
| `E001` | `$type` 누락            | `color.gray.500` 에 `$type` 없음                        |
| `E002` | 허용되지 않은 `$type`   | `$type: "gradient"` (미지원)                            |
| `E003` | alias 참조 대상 없음    | `{color.primary.999}` 가 primitive에 없음               |
| `E004` | 순환 참조               | `color.a → {color.b} → {color.a}`                       |
| `E005` | JSON 파싱 실패          | 파일이 유효한 JSON이 아님                               |
| `E006` | source 파일 없음        | config의 source 경로가 존재하지 않음                    |
| `E007` | CSS injection 위험 문자 | `$value`에 `;`, `{`, `}`, `@`, `/*`, `url(` 등 포함     |
| `E008` | output 파일 쓰기 실패   | 디렉토리 권한 없음 또는 path traversal 차단             |
| `E009` | 유효하지 않은 namespace | namespace가 `/^[a-z][a-z0-9-]{0,63}$/` 패턴에 맞지 않음 |

```
✗ [E003] tokens.semantic.json → color.brand
  Alias '{color.primary.999}' not found in primitive tokens.
  Available: color.primary.50, color.primary.500, color.primary.600
```

### `warning` — 계속 진행, 로그 출력

파일은 생성되지만, 의도하지 않은 동작이 있을 수 있습니다.

| 코드   | 조건                                        | 예시                                              |
| ------ | ------------------------------------------- | ------------------------------------------------- |
| `W001` | dark tier에서 미존재 semantic 토큰 override | `color.chart-1`이 semantic에 없는데 dark에서 정의 |
| `W002` | `$description` 누락                         | 문서화 미흡                                       |
| `W003` | primitive에서 alias 참조 사용               | primitive는 raw value만 권장                      |

```
⚠ [W001] tokens.dark.json → color.chart-1
  Token 'color.chart-1' does not exist in semantic tokens.
  This override will have no effect.
```

### `info` — 계속 진행, 기본 숨김 (`--verbose` 시 출력)

개선 힌트입니다. 동작에 영향을 주지 않습니다.

| 코드   | 조건                       | 예시                                             |
| ------ | -------------------------- | ------------------------------------------------ |
| `I001` | 미사용 primitive 토큰      | `color.gray.300`이 semantic에서 참조되지 않음    |
| `I002` | 동일한 값을 가진 토큰 중복 | `color.gray.500`과 `color.neutral.500`이 같은 값 |

```
ℹ [I001] tokens.primitive.json → color.gray.300
  Primitive token is never referenced by semantic tokens.
```

---

## 출력 형식

```
figma-token-bridge generate

Validating...
  ✗ [E003] tokens.semantic.json → color.brand: alias '{color.primary.999}' not found
  ⚠ [W001] tokens.dark.json → color.chart-1: token does not exist in semantic

1 error found. Generation aborted.
Fix the errors above and run again.
```

```
figma-token-bridge generate

Validating...
  ⚠ [W001] tokens.dark.json → color.chart-1: token does not exist in semantic

Generating...
  ✓ tokens/primitive.css
  ✓ tokens/semantic.css
  ✓ tokens/dark.css
  ✓ tokens.ts

Done. 1 warning(s). Run with --verbose to see info messages.
```

---

## CLI 옵션

```bash
# 경고를 에러로 취급 (CI 환경 권장)
figma-token-bridge generate --strict

# info 메시지 포함 출력
figma-token-bridge generate --verbose

# 에러/경고만 출력, 성공 메시지 숨김
figma-token-bridge generate --quiet
```

---

## 종료 코드

| 코드 | 의미                             |
| ---- | -------------------------------- |
| `0`  | 성공 (warning 있어도 0)          |
| `1`  | error 발생으로 생성 중단         |
| `2`  | `--strict` 모드에서 warning 발생 |
| `3`  | 설정 파일(config) 로드 실패      |
