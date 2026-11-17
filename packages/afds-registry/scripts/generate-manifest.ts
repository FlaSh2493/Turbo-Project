import { writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildRegistry } from '../src/lib/build-registry'
import { buildShadcnRegistry, SHADCN_REGISTRY_CONFIG } from '../src/lib/build-shadcn-registry'
import { loadTaxonomy } from '../src/lib/taxonomy'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const REPO_ROOT = join(ROOT, '../..')

const AFDS_DIR = join(ROOT, '../../packages/afds')
// 컴포지션은 더 이상 afds 에 없다(afds-registry 로 이전) — 로컬 경로에서 읽는다.
const COMPOSITIONS_DIR = join(ROOT, 'src/compositions')
const TAXONOMY = loadTaxonomy(join(ROOT, 'taxonomy.json'))

// ── shadcn 규격 산출물 ────────────────────────────────────────────────────────
// **저장소 루트**여야 한다. shadcn 의 GitHub 소스 스킴(`owner/repo/<item>#<ref>`)이
// 루트의 `registry.json` 을 읽는다 — 호스팅 없이 저장소에서 바로 소비하는 경로다.
const SHADCN_REGISTRY_FILE = join(REPO_ROOT, 'registry.json')

console.log('Generating registry manifest...')

const { manifest, errors, log, coverage, distributableFiles } = buildRegistry({
  afdsDir: AFDS_DIR,
  compositionsDir: COMPOSITIONS_DIR,
  taxonomy: TAXONOMY,
})

for (const line of log) console.log(line)

// 가드가 무엇을 들여다봤는지 항상 출력한다. "위반 0건" 이 "깨끗하다" 인지
// "보지 않았다" 인지 구분되어야 한다.
console.log('\n가드 검사 범위:')
console.log(`  스캔한 코드 파일        ${coverage.filesScanned}개`)
console.log(
  `  분류한 상대 specifier   ${coverage.relativeSpecifiers}건 ` +
    `(컴포지션 내부 ${coverage.internalPaths} · 형제 ${coverage.siblingRefs} · ` +
    `AFDS ${coverage.afdsRefs} · 트리 밖 ${coverage.outsideRefs})`,
)
// bare specifier 도 출력한다. 예전에는 분류에서 통째로 빠져 있어서 "검사했고 통과" 와
// "분류 밖이라 안 봤다" 가 구분되지 않았다. AFDS 서브패스는 exports 선언과 대조된다.
console.log(
  `  분류한 bare specifier   ${coverage.bareSpecifiers}건 ` +
    `(AFDS 루트 ${coverage.afdsRootRefs} · AFDS 서브패스 ${coverage.afdsSubpathRefs} · ` +
    `외부 패키지 ${coverage.externalRefs})`,
)
console.log(
  `  심볼 대조               ${coverage.symbolsChecked}개 이름 / ${coverage.symbolCheckedSites}개 import 문` +
    ` (AFDS binding ${coverage.afdsBindingSites}건 중` +
    ` 대조 ${coverage.symbolCheckedSites} · 비-배럴 ${coverage.symbolSkippedNonBarrel} ·` +
    ` 검증불가 ${coverage.symbolSkippedUnresolved})`,
)
console.log(`  표면을 읽은 배럴        ${coverage.barrelsResolved.join(', ') || '(없음)'}`)
if (coverage.nonBarrelSubpaths.length > 0) {
  // 심볼 표면이라는 개념이 없는 서브패스(CSS·JSON). 오류는 아니지만 **미검사**이므로
  // 보이지 않으면 "검사했고 통과" 와 구분되지 않는다.
  console.log(`  심볼 미검사 서브패스    ${coverage.nonBarrelSubpaths.join(', ')} (CSS·JSON)`)
}
if (coverage.barrelsUnresolved.length > 0) {
  console.log(`  ❌ 표면을 못 읽은 배럴  ${coverage.barrelsUnresolved.join(', ')}`)
}

// 규격 산출물도 **같은 수집 결과**에서 만든다. 두 산출물이 갈라지지 않게 하는 유일한 방법이다.
const shadcn = buildShadcnRegistry({
  manifest,
  distributableFiles,
  compositionsDir: COMPOSITIONS_DIR,
  ...SHADCN_REGISTRY_CONFIG,
})

const allErrors = [...errors, ...shadcn.errors]
if (allErrors.length > 0) {
  console.error(`\n❌ 레지스트리 생성 실패 — ${allErrors.length}건:`)
  for (const error of allErrors) console.error(`   - ${error}`)
  process.exit(1)
}

// **이 산출물은 포맷 게이트(`pnpm format:check`)의 대상이다** (#199). 생성물이지만
// `.prettierignore` 에 **없다** — 소비처가 읽는 공개 계약이라 형식 드리프트를 잡아야 한다.
//
// 여기서 쓰는 형식이 곧 게이트를 통과하는 형식은 아니다. `generate:registry` 가
// `tsx … && prettier --write ../../registry.json` 이라 **생성 직후 prettier 가 정규화**한다.
// 즉 아래 `2` 가 아니라 **그 뒤 단계가 게이트 통과를 보장한다.**
//
// 실측(#199): `&& prettier --write` 를 떼고 indent 를 `4` 로 바꿔 생성하면
// `pnpm format:check` 가 exit 1 이고 게이트가 `registry.json` 을 지목한다. 반대로 그
// 단계가 붙어 있으면 indent 를 바꿔도 즉시 되돌려져 게이트가 통과한다.
// **그러니 `generate:registry` 에서 prettier 단계를 떼지 마라** — 떼면 실패가 CI 의
// `format` 잡에서 나타나 원인이 생성기임을 알기 어렵다.
writeFileSync(SHADCN_REGISTRY_FILE, JSON.stringify(shadcn.registry, null, 2) + '\n')

const fileCount = shadcn.registry.items.reduce((n, item) => n + item.files.length, 0)
console.log(
  `\n✅ registry.json generated with ${shadcn.registry.items.length} items ` +
    `/ ${fileCount} files (AFDS ${manifest.afdsVersion}) → ${SHADCN_REGISTRY_FILE}`,
)
