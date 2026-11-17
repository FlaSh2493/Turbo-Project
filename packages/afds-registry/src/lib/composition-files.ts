/**
 * 컴포지션 디렉터리의 파일 분류 규칙 — 단일 정본.
 *
 * 두 종류의 판정이 필요하고, 둘은 같지 않다:
 *
 * - `isDistributable`: 소비처로 **내려보낼** 파일. 코드(`.ts`/`.tsx`)와 스펙 문서(`*.spec.md`).
 *   에이전트가 컴포지션을 이해하는 정본이 `.spec.md` 이므로 함께 배포한다.
 * - `isImportScannable`: 의존성 도출을 위해 **import 를 읽을** 파일. 코드만.
 *   `.spec.md` 를 스캔하면 마크다운 코드펜스의 예시 import 가 유령 의존성이 된다.
 *
 * 배포 대상 판정과 import 스캔 대상 판정이 갈라지면 "레지스트리에는 있는데 안 내려오는"
 * 결함이 나므로 여기 한 곳에서만 정의한다. (철거된 자체 CLI 의 fetch 경로도 같은 규칙을
 * 공유하던 자리였다 — 지금은 `scripts/generate-manifest.ts` 계열이 유일한 소비자다.)
 */

/** 소비처에 불필요한 디렉터리 — 배포·스캔 양쪽에서 제외한다. */
const SKIPPED_DIR_NAMES = new Set(['__test__', '__tests__', 'node_modules'])

/** 소비처에 불필요한 파일 — 스토리북·테스트. 기존 규칙을 그대로 유지한다. */
const EXCLUDED_FILE_RE = /\.(stories|test)\.(ts|tsx)$/

const CODE_FILE_RE = /\.(ts|tsx)$/
const SPEC_DOC_RE = /\.spec\.md$/

export function isSkippedDir(dirName: string): boolean {
  return SKIPPED_DIR_NAMES.has(dirName)
}

/** 스펙 문서(`*.spec.md`)인가. */
export function isSpecDoc(fileName: string): boolean {
  return SPEC_DOC_RE.test(fileName)
}

/** 소비처로 내려보낼 파일인가 — 코드 + 스펙 문서. */
export function isDistributableFile(fileName: string): boolean {
  if (isSpecDoc(fileName)) return true
  if (!CODE_FILE_RE.test(fileName)) return false
  return !EXCLUDED_FILE_RE.test(fileName)
}

/** 의존성 도출을 위해 import 를 읽을 파일인가 — 코드만. */
export function isImportScannableFile(fileName: string): boolean {
  if (!CODE_FILE_RE.test(fileName)) return false
  return !EXCLUDED_FILE_RE.test(fileName)
}
