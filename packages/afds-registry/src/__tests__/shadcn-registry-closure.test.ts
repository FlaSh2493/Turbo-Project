import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { basename, join } from 'node:path'
import { isSkippedDir, isSpecDoc } from '../lib/composition-files'
import {
  dirname as posixDirname,
  join as posixJoin,
  normalize as posixNormalize,
} from 'node:path/posix'
import { extractSpecifiers } from '../lib/extract-specifiers'
import { ASSUMED_PRESENT, dependencyName, toPackageName } from '../lib/derive-dependencies'
import shadcnRegistryJson from '../../../../registry.json' with { type: 'json' }

/**
 * 커밋된 `registry.json` 의 **아이템 하나만 설치했을 때** 소비처가 컴파일되는가.
 *
 * **왜 별도 검사인가.** 정합 검사(재생성 결과와 같은가)와 `shadcn registry validate`(규격에
 * 맞는가)는 둘 다 **생성기의 의미 오류를 덮지 못한다** — 생성기를 고치고 재생성해 함께
 * 커밋하는 정상 워크플로에서는 커밋된 산출물과 생성기 출력이 **같은 버그를 공유**하고,
 * 규격 검사는 그 의미를 보지 않는다. 독립 리뷰가 그것을 파괴 재현으로 보였다:
 *
 * - 전이 확장을 없애면 `base-multi-select` 가 `base-tooltip` 을 잃는데 두 검사 모두 통과했다.
 * - 형제 npm 의존성 합집합을 없애면 5건이 누락되는데 두 검사 모두 통과했다.
 *
 * 둘 다 소비처에서 `TS2307` 로 나타난다. 그래서 **산출물만 보고 소비처를 재현해** 단정한다.
 *
 * **근거로 `meta` 를 쓰지 않는다.** `meta.bundledCompositions` 도 같은 생성기의 출력이라
 * 같은 버그를 공유한다. 오직 `files[]` · `dependencies` 와 **컴포지션 소스 원문**만 쓴다.
 */

const REPO_ROOT = join(__dirname, '../../../..')

/** 코드 파일만 파싱한다. `.spec.md` 는 import 를 갖지 않는다. */
const CODE_FILE_RE = /\.(ts|tsx)$/

/** 확장자 없는 상대 import 가 가리킬 수 있는 실제 파일 후보. */
function resolutionCandidates(base: string): string[] {
  const candidates = [base]
  if (!CODE_FILE_RE.test(base)) {
    candidates.push(`${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`)
  }
  // `./x.js` 로 적는 관행(NodeNext)도 받아준다 — 실제 파일은 `.ts`/`.tsx` 다.
  if (/\.jsx?$/.test(base)) {
    candidates.push(base.replace(/\.jsx?$/, '.ts'), base.replace(/\.jsx?$/, '.tsx'))
  }
  return candidates
}

interface RegistryFile {
  path: string
  type: string
  target: string
}
interface RegistryItem {
  name: string
  docs?: string
  files: RegistryFile[]
  dependencies?: string[]
}

const items = (shadcnRegistryJson as { items: RegistryItem[] }).items

/** `@ui/base-input/index.ts` → `base-input/index.ts`. 소비처 ui 루트 기준 경로. */
function installedPath(target: string): string {
  return target.replace(/^@ui\//, '')
}

const COMPOSITIONS_DIR = join(__dirname, '../compositions')

/**
 * 컴포지션 디렉터리 = **정본**. `isSkippedDir` 로 제외한 것을 뺀 **원시 하위 디렉터리 목록**이다.
 *
 * 생성물/부산물과 대조하지 않는다 — 자체 CLI 시절의 `src/registry/index.json`·
 * `compositions.approved.json` 은 CLI 철거와 함께 **이미 사라졌다.** 디렉터리는 남는다.
 *
 * **`index.ts` 보유를 조건으로 걸지 않는다.** 예전에는 걸었는데, 그러면 `index.ts` 없는
 * 디렉터리가 **양쪽에서 동시에 빠져** "일치" 가 성립한다 — 정본 집합에서도 빠지고 레지스트리
 * 아이템에서도 빠지므로 이 단정이 아무 말도 하지 않는다. 실측으로 확인했다: `ghost-widget/`
 * 에 `ghost-widget.tsx` 만 두면 이 가드도 `generate:registry` 도 exit 0 이었고, 유일하게
 * 막던 것이 `scripts/verify-compositions.ts` 였다 — **그 게이트는 이미 제거됐다.**
 *
 * 조건을 없애면 그런 디렉터리가 즉시 불일치로 잡힌다. 비컴포지션 디렉터리를 두려면
 * `isSkippedDir` 에 **이름을 적어야** 한다 — 조용히 빠지는 것보다 명시적 예외가 낫다.
 */
function compositionDirNames(): string[] {
  return readdirSync(COMPOSITIONS_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory() && !isSkippedDir(e.name))
    .map(e => e.name)
    .sort()
}

describe('registry.json — 아이템 하나만 설치해도 소비처가 컴파일된다', () => {
  it('대조군 — 검사할 아이템과 코드 파일이 실제로 있다', () => {
    // "위반 0건" 이 "아무것도 안 봤다" 가 되지 않게 분모를 먼저 고정한다.
    expect(items.length).toBeGreaterThan(0)
    const codeFiles = items.flatMap(i => i.files.filter(f => CODE_FILE_RE.test(f.path)))
    expect(codeFiles.length).toBeGreaterThan(0)
  })

  it('아이템 집합이 컴포지션 디렉터리 집합과 정확히 같다 (누락·유령 양방향)', () => {
    // **왜 개수가 아니라 이름인가.** 개수로 세면 누락 1건과 유령 1건이 상쇄돼 통과한다.
    //
    // **왜 이 단정이 필요한가.** 아래 두 검사는 **존재하는 아이템만** 순회하므로 아이템이
    // 통째로 빠지면 아무것도 말하지 않는다. 독립 리뷰가 실증했다 — 생성기가 아이템 하나만
    // 배출하게 해도(1 item / 3 files) 전 게이트가 통과했고, 그때 검사 분모가 80→1 로
    // 붕괴했는데도 `> 0` 대조군이 만족됐다. 승인된 컴포지션이 표준 CLI 로 **설치 불가**가
    // 되는데 아무도 모르는 상태다.
    //
    // 이 단정은 분모까지 함께 고정하므로 무동작 초록도 같이 막는다.
    expect(items.map(i => i.name).sort()).toEqual(compositionDirNames())
  })

  it('파일 type 이 스펙 문서 여부와 일치한다', () => {
    // 스펙 문서를 `registry:ui` 로 두면 shadcn 의 **코드 변환기**를 타고, 코드를
    // `registry:file` 로 두면 변환을 건너뛴다. 분류를 반전시켜도 규격 검사는 열거형 안이라
    // 통과하고, 위 두 검사는 확장자로 코드 여부를 판정해 `type` 을 아예 보지 않는다.
    // 코드 주석이 밝힌 의도가 조용히 뒤집히는 자리라 여기서 고정한다.
    //
    // (소비처에서 실제로 어떤 증상이 나오는지는 **측정하지 않았다** — 원격 registry.json 을
    // 변조할 수 없어 재현할 방법이 없었다.)
    const wrong: string[] = []
    for (const item of items) {
      for (const file of item.files) {
        const expected = isSpecDoc(basename(file.path)) ? 'registry:file' : 'registry:ui'
        if (file.type !== expected) {
          wrong.push(
            `${item.name}: '${file.path}' 의 type 이 '${file.type}' 다 (기대: '${expected}')`,
          )
        }
      }
    }
    expect(wrong).toEqual([])
  })

  it('모든 상대 import 가 그 아이템이 내려보내는 파일 안에서 해소된다 (전이 폐쇄 완결성)', () => {
    const unresolved: string[] = []
    let checked = 0

    for (const item of items) {
      // 이 아이템만 설치했을 때 소비처에 실제로 생기는 파일 집합.
      const installed = new Set(item.files.map(f => installedPath(f.target)))

      for (const file of item.files) {
        if (!CODE_FILE_RE.test(file.path)) continue
        const source = readFileSync(join(REPO_ROOT, file.path), 'utf-8')
        const here = posixDirname(installedPath(file.target))

        for (const specifier of extractSpecifiers(source)) {
          if (!specifier.startsWith('.')) continue
          checked += 1
          const base = posixNormalize(posixJoin(here, specifier))
          if (resolutionCandidates(base).some(c => installed.has(c))) continue
          unresolved.push(
            `${item.name}: '${installedPath(file.target)}' 의 '${specifier}' 가 해소되지 않는다 ` +
              `(찾은 위치: ${base}). 이 아이템의 files[] 에 그 파일이 없다 — ` +
              `형제 컴포지션을 전이적으로 싣지 못한 것이다.`,
          )
        }
      }
    }

    expect(
      checked,
      '상대 import 를 한 건도 검사하지 못했다면 이 검사는 무동작이다',
    ).toBeGreaterThan(0)
    expect(unresolved).toEqual([])
  })

  it('모든 bare import 가 그 아이템의 dependencies 에 선언돼 있다 (의존성 합집합)', () => {
    const missing: string[] = []
    let checked = 0

    for (const item of items) {
      const declared = new Set((item.dependencies ?? []).map(dependencyName))

      for (const file of item.files) {
        if (!CODE_FILE_RE.test(file.path)) continue
        const source = readFileSync(join(REPO_ROOT, file.path), 'utf-8')

        for (const specifier of extractSpecifiers(source)) {
          if (specifier.startsWith('.')) continue
          const pkg = toPackageName(specifier)
          if (!pkg) continue // node 빌트인·절대경로
          if (ASSUMED_PRESENT.has(pkg)) continue // 소비처에 이미 있다고 전제하는 것
          checked += 1
          if (declared.has(pkg)) continue
          missing.push(
            `${item.name}: '${installedPath(file.target)}' 가 '${specifier}' 를 import 하는데 ` +
              `'${pkg}' 가 dependencies 에 없다. 소비처에서 TS2307 · ERR_MODULE_NOT_FOUND 가 난다 ` +
              `(pnpm 은 호이스팅하지 않아 그쪽에서 먼저 드러난다).`,
          )
        }
      }
    }

    expect(
      checked,
      'bare import 를 한 건도 검사하지 못했다면 이 검사는 무동작이다',
    ).toBeGreaterThan(0)
    expect(missing).toEqual([])
  })

  it('모든 아이템이 설치 안내(docs)를 갖고, 그 문구가 실제 AFDS 버전을 담는다', () => {
    // **`docs` 는 `add` 가 출력하는 유일한 아이템 텍스트다**(실측: `description`·`title` 은
    // 출력되지 않는다). 이게 비거나 사라지면 소비자가 받는 유일한 안내가 없어지는데
    // 규격 검사도 정합 검사도 그것을 보지 않는다 — 그래서 여기서 고정한다.
    //
    // 버전까지 단정하는 이유: 문구는 있는데 값이 하드코딩이면 **생성 시점 버전이라는 약속이
    // 거짓**이 된다. `registryAfdsVersion` 이 정확히 그렇게 무의미해졌다.
    const afdsVersion = JSON.parse(
      readFileSync(join(REPO_ROOT, 'packages/afds/package.json'), 'utf-8'),
    ).version as string
    expect(afdsVersion, 'afds 버전을 못 읽으면 이 검사는 무동작이다').toBeTruthy()

    const bad: string[] = []
    for (const item of items) {
      if (!item.docs || item.docs.trim() === '') {
        bad.push(`${item.name}: docs 가 비어 있다`)
        continue
      }
      if (!item.docs.includes(afdsVersion)) {
        bad.push(`${item.name}: docs 가 실제 AFDS 버전 '${afdsVersion}' 을 담지 않는다`)
      }
    }
    expect(bad).toEqual([])
  })

  it('ASSUMED_PRESENT 목록 자체가 고정돼 있다', () => {
    // 위 bare import 검사는 이 집합에 있는 패키지를 **건너뛴다.** 즉 여기에 패키지를 추가하면
    // 그 패키지의 누락이 조용히 통과한다 — 검사를 무력화하는 가장 싼 방법이다.
    // 독립 리뷰가 이 경로를 시도했고 지금은 **다른 검사(회귀 핀·유닛 픽스처)** 가 우연히
    // 막았는데, 그 보호는 새로 추가되는 패키지에는 없다. 그래서 목록 자체를 고정한다.
    //
    // 이 단정이 실패하면 목록을 바꾼 것이다 — 의도한 변경이면 여기도 함께 고쳐서
    // "무엇을 왜 소비처에 있다고 전제하는지" 를 눈에 보이게 남겨라.
    expect([...ASSUMED_PRESENT].sort()).toEqual(['react', 'react-dom'])
  })
})
