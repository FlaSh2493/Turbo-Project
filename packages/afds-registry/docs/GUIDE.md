# 컴포지션 추가·관리 가이드

**상세 문서입니다.** 무엇인지·어떻게 설치하는지·무엇을 조심해야 하는지는
[README](../README.md) 를 먼저 보세요. 여기서는 되풀이하지 않습니다.

> 아래 명령의 `pnpm --filter` 대상은 **`@turbo-project/afds-registry`** 입니다 — 디렉터리는
> `packages/afds-registry` 인데 패키지 이름만 다릅니다. 이유는 [README 「이름이 셋인데 서로
> 다릅니다」](../README.md) 참고.

레지스트리는 파일을 따로 들고 있지 않습니다. 표준 `shadcn` CLI 가 이 저장소에서 소스를
**직접** 읽습니다. 기본 ref 는 기본 브랜치이므로 **main 에 머지하는 것이 곧 배포**입니다.

```bash
npx shadcn@4.19.1 add FlaSh2493/turbo-project/<이름>#main
```

소비처가 특정 시점에 고정하려면 `#` 뒤에 **태그** 또는 **전체 40자 커밋 SHA** 를 씁니다.
짧은 SHA 는 거부됩니다(실측: `Could not resolve GitHub ref`).

---

## Composition 추가

Composition은 AFDS 기초 컴포넌트를 조합한 재사용 가능한 UI 패턴입니다.

### 1. 디렉토리 생성

`packages/afds-registry/src/compositions/` 아래에 **kebab-case** 이름으로 디렉토리를 만듭니다.

```
packages/afds-registry/src/compositions/
└── my-component/
    ├── index.ts              # export barrel (필수)
    ├── my-component.tsx      # 컴포넌트 구현 (필수)
    ├── my-component.style.ts # 스타일 (선택)
    └── my-component.spec.md  # 스펙 문서 (필수 — 없으면 레지스트리 생성이 실패한다)
```

`*.spec.md` 는 소비처로 **함께 배포**됩니다. 에이전트가 이 컴포지션을 이해하는 정본이므로
없으면 `generate:registry` 가 빌드를 실패시킵니다. 배포되는 문서라는 뜻은 곧 여기 적힌
클래스명·API 가 소비처 코드로 그대로 복사된다는 뜻입니다 — 실제로 존재하는 것만 적으세요.
맨 앞에는 `domain`·`category` frontmatter 가 **둘 다 필수**입니다(값은
`packages/afds-registry/taxonomy.json` 목록에서 고릅니다) — `resolveSpecCategories` 가 이를 읽어
`registry.json` 의 `categories` 를 만듭니다.

### 2. 파일 작성 규칙

- **import 경로**: AFDS 내부 그룹(bricks·headless·schemas·hooks)은 상대 경로로 import 합니다.
  소비처에 복사될 때 `src/lib/transform.ts` 의 규칙에 따라 `@turbo-project/afds/*` 서브패스로
  치환됩니다. `cn` 같은 **루트 레벨 유틸리티는 서브패스로 직접** import 합니다 —
  `@turbo-project/afds/lib/utils`. 치환 대상이 아니라 그대로 남습니다.

  실측(현재): 컴포지션 소스에서 `cn` 을 import 하는 **16개 파일 전부**가
  `@turbo-project/afds/lib/utils` 를 쓰고, **루트 배럴(`@turbo-project/afds`)에서 가져오는 것은 0건**입니다.
  루트 배럴과 서브패스를 섞으면 Module Federation 에서 AFDS 인스턴스가 갈라지므로
  생성 가드가 루트 배럴 import 를 막습니다(#141).

- **타입은 `import type` 으로** 가져옵니다. 소비처의 Vite `react-ts` 템플릿은
  `verbatimModuleSyntax: true` 가 **기본값**이라 타입을 값 import 로 섞으면 `TS1484` 로
  컴파일이 깨집니다. `packages/afds-registry/tsconfig.json` 이 같은 설정을 켜 두었으므로
  `pnpm --filter @turbo-project/afds-registry check-types` 가 이것을 막습니다.

  | 소스                                  | 치환 결과                      |
  | ------------------------------------- | ------------------------------ |
  | `../../bricks` · `../../bricks/*`     | `@turbo-project/afds/bricks`   |
  | `../../headless` · `../../headless/*` | `@turbo-project/afds/headless` |
  | `../../schemas` · `../../schemas/*`   | `@turbo-project/afds/schemas`  |
  | `../../hooks` · `../../hooks/*`       | `@turbo-project/afds/hooks`    |

  중첩 파일(`<composition>/hooks/x.ts`)은 상향이 한 단 더 깊습니다(`../../../bricks/*`) —
  규칙이 깊이를 고정하지 않으므로 그대로 동작합니다.

  **위 표에 없는 서브패스를 가리키는 상대 import 를 쓰면 `generate:registry` 가 실패합니다**
  (예: `../../lib/*` · `../../types` — 치환 규칙이 없거나 AFDS `exports` 에 대응 서브패스가
  없습니다). 상대경로가 그대로 소비처에 내려가 컴파일되지 않기 때문입니다. 검증 단위는
  **모듈 specifier 하나**입니다. 새 경로가 필요하면 `AFDS_IMPORT_RULES` 에 규칙을 추가하고,
  그 서브패스가 `packages/afds/package.json` 의 `exports` 에 선언돼 있어야 합니다.

  **배럴로 접힌 뒤에도 심볼이 살아남아야 합니다.** 깊은 경로는 배럴 하나로 접히는데
  (`../../bricks/form/calendar/calendar` → `@turbo-project/afds/bricks`), AFDS 의 그룹 배럴은
  `export *` 가 아니라 명시적 named 재수출이라 이름이 탈락할 수 있습니다. 그러면 소비처에서
  `TS2305 (has no exported member)` 가 납니다. 생성 시점에 배럴의 실제 export 표면과
  대조하므로 배럴에 없는 이름을 깊은 경로에서 가져오면 빌드가 실패합니다.

- **형제 컴포지션**: `../<sibling>` 로 import 합니다. 치환하지 않습니다 —
  `add` 가 형제 컴포지션을 함께 내려주므로 상대경로가 그대로 동작합니다.
- **외부 npm 패키지**: 그냥 import 하면 됩니다. 레지스트리 생성이 import 에서 도출하고,
  버전 범위는 `packages/afds/package.json` 의 dependencies ∪ peerDependencies 에서 가져옵니다.
  **거기 선언되지 않은 패키지를 import 하면 빌드가 실패합니다.**
- `__test__/`, `__tests__/`, `*.stories.tsx`, `*.test.ts(x)` 는 설치 대상에서 자동 제외됩니다.
  `*.spec.md` 는 배포됩니다.

```tsx
// my-component.tsx 예시
import { Button } from '../../bricks/action/button'
import { cn } from '@turbo-project/afds/lib/utils'

export function MyComponent() {
  return <Button>Hello</Button>
}
```

### 3. 레지스트리 갱신

```bash
pnpm --filter @turbo-project/afds-registry run generate:registry
```

저장소 루트의 `registry.json` 이 자동 갱신됩니다. 커밋해야 합니다 —
정합 테스트가 커밋된 파일과 소스에서 재생성한 결과를 비교합니다.

생성이 **실패하는 조건** (전부 소비처에서 컴파일 실패로 나타나던 결함이다):

1. 도출된 패키지의 버전 범위를 AFDS package.json 에서 찾을 수 없다
   — 단 `// afds-registry Dependencies:` override 가 있으면 이 검사를 건너뛴다(아래 3-1)
2. 컴포지션에 `*.spec.md` 가 없다
3. AFDS 내부를 가리키는 **모듈 specifier** 를 치환할 transform 규칙이 없다
4. 실제로 매칭된 transform 규칙의 치환 대상이 AFDS `exports` 에 없다
5. 깊은 경로에서 가져오는 이름이 치환 대상 배럴의 export 표면에 없다 (`TS2305` 예방)
   — 배럴 표면을 **읽지 못한 경우도 오류다.** 검증 불가를 통과로 넘기면 "위반 0건" 이
   "깨끗하다" 인지 "보지 않았다" 인지 구분되지 않는다
6. 상대 참조가 컴포지션 내부도, 형제 컴포지션도, AFDS 소스도 가리키지 않는다

`import … from` 만 보지 않는다 — side-effect import·동적 `import()`·`require()`·
`export … from` 까지 TypeScript 스캐너로 한 번에 훑고, 주석 안의 예시 import 는 잡지 않는다.

생성 로그 끝에 **가드가 검사한 사이트 수**를 항상 출력한다(스캔 파일·분류한 상대 specifier·
심볼 대조 수·표면을 읽은 배럴). 위반 0건이 실제로 깨끗한 것인지 확인할 근거다.

**설치 시점 검사는 없다.** 예전에는 자체 CLI 가 치환 후 남은 AFDS 내부 상대 import 를
설치 직전에 한 번 더 걸렀는데, 그 CLI 를 제거하면서 함께 사라졌다. 표준 CLI 는 파일을
그대로 복사할 뿐이다.

그래서 **생성 시점 가드가 유일한 방어선**이다 — 위 검사가 통과한 산출물만 `main` 에 들어가고,
소비처는 그 산출물을 그대로 받는다. 가드를 약화시키면 대신 잡아 줄 것이 없다.

### 3-1. 의존성 도출을 손으로 덮어써야 할 때

도출이 구조적으로 불가능한 예외 상황에서만 `index.ts` 에 override 주석을 씁니다.
**폴백이 아니라 전체 override 입니다** — 이 주석이 있으면 도출 결과를 쓰지 않습니다.

```ts
// afds-registry Dependencies: @turbo-project/afds, @tanstack/react-table@^8.21.3
```

> 접두어 `afds-registry` 는 **파서가 찾는 리터럴**입니다(`derive-dependencies.ts`). 자체 CLI 는
> 사라졌지만 이 키워드는 그대로입니다 — 바꾸려면 파서와 함께 바꿔야 합니다.

### 4. 배포

main 에 머지하면 곧 배포입니다. 소비 명령은 [README](../README.md#설치-소비자) 참고.

---

## 프로젝트 구조

```
packages/afds-registry/
├── src/
│   ├── compositions/<이름>/     # ★ 정본 — 여기 디렉터리가 곧 레지스트리 아이템이다
│   ├── lib/
│   │   ├── build-registry.ts        # 컴포지션 소스 → 매니페스트 (가드 포함)
│   │   ├── build-shadcn-registry.ts # 매니페스트 → shadcn 규격 registry.json
│   │   ├── transform.ts             # AFDS 내부 상대 import 치환 규칙 (가드가 쓴다)
│   │   ├── verify-installed.ts      # 미치환 import 검출 (문서 검사가 쓴다)
│   │   ├── composition-files.ts · derive-dependencies.ts
│   │   ├── extract-specifiers.ts · spec-summary.ts · barrel-exports.ts
│   └── types/index.ts
└── scripts/generate-manifest.ts     # 산출물 생성 진입점
                                     # → 저장소 루트 registry.json
```

자체 CLI(`src/cli/`)는 제거됐습니다. 소비는 표준 `shadcn` CLI 가 이 저장소를 직접 읽어서 합니다.

## 소비 시 알아둘 제약

- **파일당 5 MiB** 상한이 있습니다(레지스트리 소스 파일).
- **GitHub Enterprise 는 지원하지 않습니다** — 호스트가 `github.com` 으로 고정돼 있습니다.
- 저장소 트리에 **심링크를 두지 마세요**(공식 문서 권고).
- 공개 저장소는 익명으로 먼저 읽고, 404 일 때만 인증 경로로 전환합니다. 우리 저장소는
  비공개라 항상 인증 경로를 탑니다.

## 채택하지 않은 선택지와 근거

### 이름공간(`@afds-registry/...`) 표기는 아직 쓰지 않습니다

`components.json` 의 `registries` 에 등록해 `@afds-registry/base-input` 처럼 쓰려면 레지스트리
값이 **`{name}` 을 포함한 URL 템플릿**이어야 합니다(설정 스키마가 요구). GitHub 소스
형태(`FlaSh2493/turbo-project#main`)는 그 자리에 넣을 수 없습니다 — 실측 결과
`Invalid configuration found in components.json` 으로 거부됩니다.

이름공간이 필요해지면 `shadcn build` 산출물을 HTTP 로 서빙해야 하며, 비공개를 유지하려면
`registries` 값을 객체 형태로 두고 인증 헤더를 넣습니다(환경변수 보간 `${VAR}` 지원, 값이
비면 변수 이름을 짚어 실패합니다). `shadcn registry add` 는 헤더를 쓰지 못하므로
`components.json` 을 직접 편집해야 합니다.

```jsonc
// 참고용 — 지금은 쓰지 않는 대안 경로
{
  "registries": {
    "@afds-registry": {
      "url": "https://raw.githubusercontent.com/FlaSh2493/turbo-project/main/r/{name}.json",
      "headers": { "Authorization": "Bearer ${AFDS_REGISTRY_TOKEN}" },
    },
  },
}
```

패키지 안에 빌드 산출물을 담아 로컬 경로로 가리키는 방법도 **동작하지 않습니다.** 설정
검증은 통과하지만(스키마가 `{name}` 포함만 요구) 실행 시 그 경로가 shadcn 기본 레지스트리
URL 에 접두돼 `https://ui.shadcn.com/r/./node_modules/...` 를 찾아갑니다. `search` 는
`Invalid URL` 입니다. **오류가 우리 설정이 아니라 남의 서버를 가리키므로** 원인을 엉뚱한
데서 찾게 됩니다 — 이 형태를 쓰지 마세요.

### 레지스트리 파일을 나누는 선택지 (`include`) — 지금은 쓰지 않습니다

루트 `registry.json` 이 하위 레지스트리 파일을 `include` 로 끌어올 수 있습니다. 공식
지원이고([문서](https://ui.shadcn.com/docs/registry/github)) GitHub 소스 스킴에서도
동작하는 것을 실측했습니다(공개 저장소 `junwen-k/ui-x` 대상 — 레지스트리 파일 2개 · 26
아이템 해소, `search`·`add` 정상).

```jsonc
// 예: 진입점은 include 만, 아이템은 패키지 안에
{ "name": "afds-registry", "homepage": "…", "include": ["./packages/afds-registry/registry.json"] }
```

제약(실측):

- **상대 경로만** — 원격(URL) include 불가, `..` 금지
- 파일 이름은 반드시 `registry.json`
- **깊이 상한 32** — 33개째부터 `Registry include tree is too deep`
- 같은 파일을 두 번 포함할 수 없음
- 포함된 파일은 `name`·`homepage` 를 생략할 수 있고, 그 안의 `files[].path` 는 **그 파일이
  있는 위치 기준 상대경로**가 됨
- **HTTP 엔드포인트는 include 를 거부합니다** — `Registry catalog … uses "include", but
consumer registry endpoints must serve a resolved registry catalog. Run "npx shadcn build"`.
  즉 나중에 HTTP 채널을 붙이면 평탄화 단계가 반드시 따라붙습니다.

**도입 조건**: 두 번째 패키지가 레지스트리 아이템을 내기 시작할 때. 지금은 아이템이 전부
`packages/afds-registry/src/compositions/` 에서 기계 생성되므로 파일을 나눠도 이점이 겉모습에
그치고, 대신 **검사할 파일이 하나에서 둘로 늘어납니다**(정합 검사를 한쪽만 걸면 다른 쪽이
조용히 낡습니다).

### 탐색으로 찾을 수 없는 것

`shadcn search` 는 **이 레지스트리의 컴포지션만** 나열합니다. AFDS 의 브릭·headless 훅은
레지스트리 아이템이 아니라 `@turbo-project/afds` 패키지의 내용물이라 **구조적으로 나오지
않습니다.** 그쪽은 AFDS 문서와 `manifest.json` 을 보세요.

---

---

## 검증

```bash
# 산출물 재생성 — 커밋된 registry.json 과 달라지면 CI 가 막는다
pnpm --filter @turbo-project/afds-registry generate:registry
git diff --exit-code registry.json

# 규격 준수
pnpm --filter @turbo-project/afds-registry validate:registry

# 가드 (전이 폐쇄·의존성 합집합·디렉터리 대조·docs·파일 type)
pnpm --filter @turbo-project/afds-registry test
```

### 소비처에서 실제로 받아 보기

모노레포 **밖** 임시 프로젝트에서 확인합니다. `components.json` 이 먼저 있어야 하고,
`init` 은 전제 세 가지(지원 프레임워크 · Tailwind v4 · tsconfig `paths`)를 요구합니다 —
[README 「`shadcn init` 의 전제 세 가지」](../README.md) 참고.

```bash
# 셋을 다 주어야 비대화형으로 끝납니다 — `-t` 만 주면 컴포넌트 라이브러리를 되묻고,
# 되묻는 지점에서 비대화형이면 아무것도 하지 않고 종료코드 0 으로 끝납니다.
npx shadcn@4.19.1 init -t vite -b base -p nova
npx shadcn@4.19.1 add FlaSh2493/turbo-project/<이름>#<브랜치>

# ★ 타입체크는 `tsc -b` 로 합니다 (아래 이유)
npx tsc -b
```

설치된 파일이 `src/components/ui/` 가 아니라 **`./@/components/ui/`** 에 생겼다면 루트
`tsconfig.json` 에 `paths` 가 없는 것입니다 — [README 의 「`paths` 를 한쪽에만 두면 조용히 어긋납니다」 절](../README.md) 참고.

**`tsc` 까지 봐야 합니다.** 파일이 복사되는 것과 컴파일되는 것은 다릅니다 — 의존성 누락은
pnpm 소비처에서 먼저 드러납니다(호이스팅하지 않기 때문).

> **★ `tsc --noEmit` 을 쓰지 마세요 — 0개 파일을 검사하고 통과합니다.**
>
> Vite 의 `react-ts` 스캐폴드는 루트 `tsconfig.json` 을 **참조만 담은 껍데기**로 만듭니다:
>
> ```json
> { "files": [], "references": [{ "path": "./tsconfig.app.json" }] }
> ```
>
> `files: []` 이므로 `tsc --noEmit` 은 **검사 대상이 0개**입니다(실측:
> `tsc --noEmit --listFiles` 출력 0줄, `tsc --noEmit` **exit 0**). 즉 "통과" 가 아니라
> **아무것도 보지 않았다** 입니다. 실제로 이 문서가 적어 둔 명령이 `base-input.tsx` 의
> `TS1484` 오류 2건을 가렸습니다.
>
> `tsc -b`(프로젝트 참조를 따라 빌드) 또는 `tsc -p tsconfig.app.json` 을 쓰면 잡힙니다.
> 검사 대상이 실제로 있었는지 확인하려면 `--listFiles | wc -l` 을 함께 보세요.
