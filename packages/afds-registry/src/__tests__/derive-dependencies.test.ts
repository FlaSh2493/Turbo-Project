import { describe, it, expect } from 'vitest'
import {
  AFDS_PACKAGE,
  buildDependencies,
  dependencyName,
  parseCompositionDepsOverride,
  parseDependencyOverride,
  toPackageName,
} from '../lib/derive-dependencies'
import { extractSpecifiers } from '../lib/extract-specifiers'

const RANGES = {
  '@tanstack/react-table': '^8.21.3',
  '@base-ui/react': '^1.4.1',
  'lucide-react': '^1.0.67',
  clsx: '^2.1.1',
}

describe('toPackageName — 서브패스를 패키지명으로 정규화', () => {
  it('스코프 패키지의 서브패스를 접는다', () => {
    expect(toPackageName('@base-ui/react/checkbox')).toBe('@base-ui/react')
    expect(toPackageName('@base-ui/react')).toBe('@base-ui/react')
  })

  it('비스코프 패키지의 서브패스를 접는다', () => {
    expect(toPackageName('lodash/merge')).toBe('lodash')
  })

  it('AFDS 서브패스도 패키지명으로 접는다 — transform.ts 산출물을 별개 패키지로 오인하지 않는다', () => {
    expect(toPackageName('@turbo-project/afds/bricks')).toBe(AFDS_PACKAGE)
    expect(toPackageName('@turbo-project/afds/lib/utils')).toBe(AFDS_PACKAGE)
  })

  it('상대·절대 경로는 외부 의존성이 아니다', () => {
    expect(toPackageName('./table')).toBeNull()
    expect(toPackageName('../base-tooltip')).toBeNull()
    expect(toPackageName('../../bricks/action/button')).toBeNull()
    expect(toPackageName('/abs/path')).toBeNull()
  })

  it('node 빌트인은 제외한다 (접두 유무 모두)', () => {
    expect(toPackageName('node:fs')).toBeNull()
    expect(toPackageName('fs')).toBeNull()
    expect(toPackageName('path')).toBeNull()
  })

  it('스코프만 있는 specifier 는 패키지가 아니다', () => {
    expect(toPackageName('@scope')).toBeNull()
  })
})

describe('extractSpecifiers — TypeScript 스캐너로 import 를 읽는다', () => {
  it('import / export-from / side-effect / 동적 import / require 를 모두 잡는다', () => {
    const source = `
      import { A } from 'pkg-a'
      import type { B } from 'pkg-b'
      export { C } from 'pkg-c'
      export * from 'pkg-d'
      import 'pkg-e'
      const f = await import('pkg-f')
      const g = require('pkg-g')
    `
    expect(extractSpecifiers(source).sort()).toEqual([
      'pkg-a',
      'pkg-b',
      'pkg-c',
      'pkg-d',
      'pkg-e',
      'pkg-f',
      'pkg-g',
    ])
  })

  it('여러 줄에 걸친 import 도 잡는다', () => {
    const source = `import {\n  useReactTable,\n  type Table,\n} from '@tanstack/react-table'`
    expect(extractSpecifiers(source)).toEqual(['@tanstack/react-table'])
  })

  it('주석 안의 예시 import 는 유령 의존성이 되지 않는다 — 정규식 구현이 틀리는 지점', () => {
    const source = `
      // import { Ghost } from 'phantom-pkg'
      /* import { Ghost2 } from 'phantom-pkg-2' */
      import { Real } from 'real-pkg'
    `
    expect(extractSpecifiers(source)).toEqual(['real-pkg'])
  })
})

describe('buildDependencies', () => {
  it('AFDS 는 항상 포함하고 버전을 붙이지 않는다 — 캐럿이 0.x 마이너를 잠그는 것을 피한다', () => {
    const { dependencies } = buildDependencies(['react'], RANGES)
    expect(dependencies).toEqual([AFDS_PACKAGE])
    expect(dependencies.some(d => d.startsWith(`${AFDS_PACKAGE}@`))).toBe(false)
  })

  it('서드파티에는 AFDS 가 선언한 범위를 붙인다', () => {
    const { dependencies } = buildDependencies(
      ['@tanstack/react-table', '@base-ui/react/checkbox'],
      RANGES,
    )
    expect(dependencies).toEqual([
      AFDS_PACKAGE,
      '@base-ui/react@^1.4.1',
      '@tanstack/react-table@^8.21.3',
    ])
  })

  it('react / react-dom 은 소비처가 이미 갖고 있다고 보고 제외한다', () => {
    const { dependencies } = buildDependencies(['react', 'react-dom', 'clsx'], RANGES)
    expect(dependencies).toEqual([AFDS_PACKAGE, 'clsx@^2.1.1'])
  })

  it('범위를 못 찾은 패키지는 missingRanges 로 보고한다 — 호출자가 빌드를 실패시킨다', () => {
    const { dependencies, missingRanges } = buildDependencies(['unknown-pkg', 'clsx'], RANGES)
    expect(missingRanges).toEqual(['unknown-pkg'])
    expect(dependencies).toEqual([AFDS_PACKAGE, 'clsx@^2.1.1'])
  })

  it('중복 서브패스 import 는 한 번만 센다', () => {
    const { dependencies } = buildDependencies(
      ['@base-ui/react/checkbox', '@base-ui/react/checkbox-group', '@base-ui/react/accordion'],
      RANGES,
    )
    expect(dependencies).toEqual([AFDS_PACKAGE, '@base-ui/react@^1.4.1'])
  })
})

describe('parseDependencyOverride — 폴백이 아니라 override', () => {
  it('주석이 있으면 그 목록을 그대로 돌려준다', () => {
    const source = `// afds-registry Dependencies: @tanstack/react-table@^8.21.3, clsx@^2.1.1\nexport {}`
    expect(parseDependencyOverride(source)).toEqual([
      '@tanstack/react-table@^8.21.3',
      'clsx@^2.1.1',
    ])
  })

  it('주석이 없으면 null — 호출자가 도출 결과를 쓴다', () => {
    expect(parseDependencyOverride('export {}')).toBeNull()
  })
})

describe('parseCompositionDepsOverride', () => {
  // 이전 정규식 `([\w,-]+)` 은 공백을 캡처하지 못해 `DatePicker,` 까지만 읽고
  // split 결과에 빈 문자열을 남겼다. 빈 이름은 `add` 에서
  // `Component "" not found in registry` 실패가 된다.
  it('공백으로 구분된 목록을 온전히 읽는다', () => {
    const source = `// afds-registry CompositionDeps: DatePicker, BaseInput\nexport {}`
    expect(parseCompositionDepsOverride(source)).toEqual(['DatePicker', 'BaseInput'])
  })

  it('공백 없는 표기도 읽는다 (기존 형식 하위호환)', () => {
    expect(
      parseCompositionDepsOverride('// afds-registry CompositionDeps: DatePicker,BaseInput'),
    ).toEqual(['DatePicker', 'BaseInput'])
  })

  it('빈 이름을 만들지 않는다', () => {
    const parsed = parseCompositionDepsOverride(
      '// afds-registry CompositionDeps: DatePicker, , BaseInput',
    )
    expect(parsed).toEqual(['DatePicker', 'BaseInput'])
    expect(parsed).not.toContain('')
  })

  it('주석이 없으면 null — 형제 import 도출 결과를 쓴다', () => {
    expect(parseCompositionDepsOverride('export {}')).toBeNull()
  })
})

describe('dependencyName', () => {
  it('스코프 패키지의 범위를 떼어낸다', () => {
    expect(dependencyName('@tanstack/react-table@^8.21.3')).toBe('@tanstack/react-table')
  })

  it('범위가 없으면 그대로 돌려준다', () => {
    expect(dependencyName('@turbo-project/afds')).toBe('@turbo-project/afds')
    expect(dependencyName('clsx')).toBe('clsx')
  })

  it('비스코프 패키지의 범위를 떼어낸다', () => {
    expect(dependencyName('clsx@^2.1.1')).toBe('clsx')
  })
})
