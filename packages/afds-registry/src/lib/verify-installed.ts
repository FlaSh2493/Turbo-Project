/**
 * 치환 후에도 AFDS 내부를 가리키는 상대 import 가 남아 있는지 찾는다.
 *
 * **원래 자리는 자체 CLI 의 설치 직전 검사였다**(철거됨). 그 CLI 는 `--ref`/`AFDS_REGISTRY_REF`
 * 로 지정된 커밋에서 소스를 받았기 때문에 빌드 가드가 본 적 없는 소스를 설치할 수 있었고,
 * 그 구멍을 막는 마지막 관문이었다. 표준 `shadcn` CLI 는 파일을 그대로 복사하므로
 * **설치 시점 검사는 지금 존재하지 않는다** — 생성 시점 가드가 유일한 방어선이다.
 *
 * 함수는 살아 있고 **문서 검사가 쓴다**: `docs-import-truth.test.ts` 가 문서의 예시 import
 * 를 `transformImports` → `findLeftoverAfdsImports` 로 흘려, 문서가 안내하는 import 가
 * 실제로 치환 가능한지 대조한다.
 *
 * 파서를 쓰지 않고 문장 모양으로 검사한다 — 이 제약도 CLI 번들 시절의 것이다(`typescript`
 * 를 끌어들이면 런타임에 `Dynamic require of "fs"` 로 죽었다). 오탐을 줄이려고 import/export
 * 문 모양만 본다(주석 안의 산문은 잡지 않는다).
 */

/** `from '../../x'` · `import '../../x'` · `import('../../x')` · `require('../../x')` */
const LEFTOVER_AFDS_IMPORT =
  /(?:\bfrom\s*|\bimport\s*|\bimport\s*\(\s*|\brequire\s*\(\s*)(['"])((?:\.\.\/){2,}[^'"]*)\1/g

export interface LeftoverImport {
  specifier: string
  /** 1-기반 줄 번호 */
  line: number
}

export function findLeftoverAfdsImports(content: string): LeftoverImport[] {
  const found: LeftoverImport[] = []
  for (const match of content.matchAll(LEFTOVER_AFDS_IMPORT)) {
    const line = content.slice(0, match.index).split('\n').length
    // 그룹 1 = 인용부호(백레퍼런스용), 그룹 2 = specifier. 앞의 대안은 전부 non-capturing.
    found.push({ specifier: match[2], line })
  }
  return found
}
