import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { transformImports } from '../lib/transform'
import { findLeftoverAfdsImports } from '../lib/verify-installed'

/**
 * GUIDE.md · README.md 의 예시 import 가 실제 transform 규칙을 통과하는지 검증한다 (#142).
 *
 * `GUIDE.md` 의 신규 composition 예제가 #118 에서 제거된 `../../lib/utils` 규칙을 계속
 * 안내하고 있었다 — 문서를 그대로 따라 작성한 컴포지션은 `generate:registry` 에서 막혔다.
 * "문서가 없는 기계를 안내한다" 는 이 저장소가 반복한 결함 형태다.
 *
 * **왜 실제 프로덕션 함수로 검사하는가.** 규칙을 다시 옮겨 적으면(`AFDS_IMPORT_RULES` 복사)
 * 그 사본이 정본과 갈라지는 순간 이 테스트가 무의미해진다. 그래서 `add` 가 설치 직전에 쓰는
 * 것과 **동일한 함수**(`transformImports` → `findLeftoverAfdsImports`)로 문서 본문을 그대로
 * 검사한다 — 규칙이 바뀌면 이 테스트도 같은 순간에 갱신된다.
 *
 * **코드펜스 경계를 따로 추적하지 않는다.** `from '...'`/`import '...'`/`import(...)`/
 * `require(...)` 형태의 리터럴 구문은 실측상 이 두 문서에서 실제 코드 예시 밖에는 등장하지
 * 않는다 — 표는 화살표(`→`)와 백틱 인용만 쓰고, `GUIDE.md` 의 셸 예시(`grep -rn "from
 * '\.\./\.\./"`)조차 인용부호가 안 맞아(백레퍼런스 불일치) 매치되지 않는다(실측 확인).
 * 그 형태가 실제 코드 예시 밖에서 새로 생기면 이 검사가 그것도 함께 본다 — 오탐이 나면
 * 그때 펜스 경계 추적을 추가하면 된다.
 *
 * **못 잡는 것.** 표·다이어그램처럼 `from '...'` 구문이 아닌 산문 서술(예: 예전 README 의
 * `../../lib/utils → @turbo-project/afds/lib/utils` 화살표 표기)은 이 검사가 보지 않는다 —
 * 사람이 표를 실제 규칙과 대조해야 한다.
 */

const AFDS_REGISTRY_ROOT = join(__dirname, '..', '..')

function assertNoLeftoverAfdsImports(label: string, content: string) {
  const transformed = transformImports(content)
  const leftovers = findLeftoverAfdsImports(transformed)
  expect(
    leftovers,
    `${label} 에 치환되지 않은 AFDS 내부 import: ${JSON.stringify(leftovers)}`,
  ).toEqual([])
}

describe('문서 예시의 transform 진실성 (#142)', () => {
  it('docs/GUIDE.md 의 예시 import는 전부 실제 transform 규칙으로 치환된다', () => {
    const content = readFileSync(join(AFDS_REGISTRY_ROOT, 'docs/GUIDE.md'), 'utf-8')
    assertNoLeftoverAfdsImports('docs/GUIDE.md', content)
  })

  it('README.md 의 예시 import는 전부 실제 transform 규칙으로 치환된다', () => {
    const content = readFileSync(join(AFDS_REGISTRY_ROOT, 'README.md'), 'utf-8')
    assertNoLeftoverAfdsImports('README.md', content)
  })

  it('파괴 재현 — 제거된 규칙(../../lib/utils)을 문서가 다시 안내하면 잡힌다', () => {
    const stale = "```tsx\nimport { cn } from '../../lib/utils'\n```"
    const transformed = transformImports(stale)
    const leftovers = findLeftoverAfdsImports(transformed)
    expect(leftovers.map(l => l.specifier)).toEqual(['../../lib/utils'])
  })

  it('정상 예시(현재 규칙에 있는 서브패스)는 잡히지 않는다', () => {
    const ok = "```tsx\nimport { Button } from '../../bricks/action/button'\n```"
    assertNoLeftoverAfdsImports('fixture', ok)
  })
})
