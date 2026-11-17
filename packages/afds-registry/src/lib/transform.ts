/**
 * 컴포지션 소스의 AFDS 내부 상대 import 를 설치된 패키지의 서브패스로 치환한다.
 *
 * 컴포지션은 모노레포 안에서 `../../bricks/...` 처럼 AFDS 내부를 상대경로로 참조한다.
 * 소비처에는 그 경로가 없으므로 `@turbo-project/afds/bricks` 로 바꿔서 내려보낸다.
 * 규칙이 없는 경로는 **상대경로 그대로 남아 소비처에서 컴파일되지 않는다.**
 *
 * 규칙은 **모듈 specifier** 를 기준으로 정의한다. 이전에는 문장(`from '...'`) 패턴으로
 * 정의했고 접두 이름으로 커버리지를 판정했는데, 그 두 층이 어긋나서 부분 커버리지가
 * 검증을 통과했다(`lib` 규칙은 `../../lib/utils` 만 매칭하는데 접두 `lib` 이 "처리됨" 이었다).
 * specifier 하나가 판정 단위이므로 그 어긋남이 구조적으로 생기지 않는다.
 *
 * specifier 정규식은 **앵커돼 있고 `g` 플래그가 없다** — `test()` 가 `lastIndex` 를 남기지
 * 않으므로 호출 순서에 따라 판정이 달라지는 일이 없다.
 */

export interface AfdsImportRule {
  /**
   * 치환 결과 서브패스 — AFDS package.json `exports` 의 키(`./` 제외)와 대응해야 한다.
   * `scripts/generate-manifest.ts` 가 빌드 시점에 실제 `exports` 와 대조한다.
   */
  subpath: string
  /** 모듈 specifier 매칭. 앵커 필수, `g` 플래그 금지. */
  specifier: RegExp
}

/**
 * AFDS 내부를 가리키는 상대 specifier 인가 — `../../` 이상 상향.
 * 컴포지션 디렉터리는 `src/compositions/<name>/` 이므로 `../../` 가 `src/` 다.
 * 중첩 파일(`<name>/hooks/x.ts`)은 `../../../` 가 되므로 2단 이상을 모두 받는다.
 */
const AFDS_INTERNAL_SPECIFIER = /^(?:\.\.\/){2,}/
/** 형제 컴포지션을 가리키는 상대 specifier 인가 — 정확히 1단 상향. */
const SIBLING_SPECIFIER = /^\.\.\/(?!\.\.\/)/

export function isAfdsInternalSpecifier(specifier: string): boolean {
  return AFDS_INTERNAL_SPECIFIER.test(specifier)
}

export function isSiblingSpecifier(specifier: string): boolean {
  return SIBLING_SPECIFIER.test(specifier)
}

/** `(?:\.\.\/){2,}` — 상향 깊이는 파일 위치에 따라 다르므로 고정하지 않는다. */
const UP = String.raw`(?:\.\.\/){2,}`

/**
 * 상대 import 를 AFDS 서브패스로 치환하는 규칙.
 *
 * 컴포지션이 AFDS 심볼에 도달하는 경로는 **두 가지**였고 여기는 그중 하나다:
 *
 * 1. 상대 import + 아래 규칙 → `@turbo-project/afds/<서브패스>`
 * 2. bare import → 루트 `@turbo-project/afds` 또는 선언된 서브패스 (예: `composeEventHandlers`)
 *
 * 2번은 치환할 것이 없어 이 목록에 나타나지 않는다. 그래도 **가드의 분류에는 잡힌다** —
 * `build-registry.ts` 가 bare specifier 를 분류하고 AFDS 서브패스는 `exports` 선언과
 * 대조한다. 규칙이 없다는 것이 검사하지 않는다는 뜻이 아니다.
 *
 * **컴포지션은 AFDS 서브패스만 쓴다.** 루트 배럴(`@turbo-project/afds`)은 `build-registry.ts` 가
 * **fail-closed 로 막는다** — 루트와 서브패스를 섞으면 Module Federation 에서 shared key 가
 * 갈라져 AFDS 인스턴스가 둘로 쪼개진다(codex 리뷰 #141). 컴포지션은 소비처 코드베이스로
 * 복사되므로 그 위험이 직접적이다.
 *
 * 아래 목록에 남은 규칙들은 아직 상대 import 로 쓰이는 서브패스들이다.
 */
export const AFDS_IMPORT_RULES: AfdsImportRule[] = [
  { subpath: 'bricks', specifier: new RegExp(`^${UP}bricks(?:\\/.+)?$`) },
  // `lib/utils` 규칙은 없다. 컴포지션이 `cn` 을 **bare 서브패스**
  // (`@turbo-project/afds/lib/utils`)로 가져오므로 치환할 상대 import 가 없다 — 실측 16건 → 0건.
  //
  // **이 규칙이 왜 좁았는지는 지우지 않는다.** `packages/afds/src/lib/` 에는 `utils.ts` 외에
  // `slot.tsx`·`index.ts` 가 있고 AFDS exports 에 선언된 것은 `./lib/utils` 뿐이었다. `lib` 하위
  // 전체로 넓혔다면 `../../lib/slot` 이 `@turbo-project/afds/lib/utils` 로 치환돼 다른 모듈을
  // 가리켰을 것이다 — 컴파일은 되고 동작만 틀린다. 그 함정은 규칙을 없앤 지금도 그대로이므로
  // 되살릴 때 같은 실수를 하지 마라.
  //
  // 규칙이 없어진 결과로 `../../lib/...` 상대 import 는 이제 **치환되지 않고 오류가 된다** —
  // `isAfdsInternalSpecifier` 가 잡고 `build-registry.ts` 가 규칙 없는 AFDS 내부 import 로
  // 막는다. 조용히 통과해 소비처에서 컴파일이 깨지는 경로가 아니라, 빌드가 먼저 멈춘다.
  { subpath: 'headless', specifier: new RegExp(`^${UP}headless(?:\\/.+)?$`) },
  { subpath: 'schemas', specifier: new RegExp(`^${UP}schemas(?:\\/.+)?$`) },
  { subpath: 'hooks', specifier: new RegExp(`^${UP}hooks(?:\\/.+)?$`) },
  // 컴포지션→컴포지션 의존성은 변환하지 않는다. 소스가 형제를 `../<sibling>`로 참조하고,
  // add 시 컴포지션이 형제 디렉터리로 함께 다운로드되므로 그대로 동작한다.
  //
  // `types` 규칙은 제거했다 — `./types` 는 AFDS `exports` 에 없어서 치환 결과가
  // 소비처에서 해소되지 않는다(`TS2307: Cannot find module '@turbo-project/afds/types'`).
  // 규칙이 없으면 가드가 "치환 규칙 없음" 으로 정확히 보고한다.
]

/** specifier 하나를 다루는 규칙. 없으면 `undefined` — 그 import 는 치환되지 않는다. */
export function findAfdsImportRule(specifier: string): AfdsImportRule | undefined {
  return AFDS_IMPORT_RULES.find(rule => rule.specifier.test(specifier))
}

/** `from '<specifier>'` 형태. 공백 없는 `from'x'` 도 받는다. */
const FROM_SPECIFIER_RE = /(from\s*)(['"])([^'"]+)\2/g

export function transformImports(content: string): string {
  return content.replace(FROM_SPECIFIER_RE, (whole, from: string, quote: string, spec: string) => {
    const rule = findAfdsImportRule(spec)
    return rule ? `${from}${quote}@turbo-project/afds/${rule.subpath}${quote}` : whole
  })
}
