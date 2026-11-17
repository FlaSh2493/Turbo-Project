import { describe, it, expect } from 'vitest'
import {
  AFDS_IMPORT_RULES,
  findAfdsImportRule,
  isAfdsInternalSpecifier,
  isSiblingSpecifier,
  transformImports,
} from '../lib/transform'

describe('transformImports', () => {
  describe('컴포지션 → 컴포지션: 변환하지 않는다 (형제로 함께 다운로드되는 copy-paste 소스)', () => {
    it('형제 컴포지션 import(../base-tooltip)는 그대로 둔다', () => {
      const input = `import { BaseTooltip } from '../base-tooltip'`
      expect(transformImports(input)).toBe(input)
    })

    it('중첩 형제 경로(../date-picker/date-picker)도 그대로 둔다', () => {
      const input = `import DatePicker from '../date-picker/date-picker'`
      expect(transformImports(input)).toBe(input)
    })

    it('컴포지션 import를 @turbo-project/afds/compositions 별칭으로 치환하지 않는다', () => {
      const input = `import { OverflowTooltip } from '../overflow-tooltip'`
      expect(transformImports(input)).not.toContain('@turbo-project/afds')
    })

    it('컴포지션 내부 경로(../types)도 그대로 둔다 — 함께 배포된다', () => {
      const input = `import type { UseTableOptions } from '../types'`
      expect(transformImports(input)).toBe(input)
    })
  })

  describe('패키지 의존성 → @turbo-project/afds 서브패스 별칭 (설치된 패키지에서 가져옴)', () => {
    it('컴포넌트 import는 @turbo-project/afds/bricks 로 치환한다', () => {
      const input = `import { Button } from '../../bricks/action/button'`
      expect(transformImports(input)).toBe(`import { Button } from '@turbo-project/afds/bricks'`)
    })

    // #118 에서 규칙을 제거했다 — 컴포지션은 `cn` 을 루트 bare import 로 가져온다.
    // 기대값만 뒤집지 않고 **치환되지 않는다**는 것을 명시적으로 단정한다. 규칙이 되살아나면
    // 여기서 걸린다.
    it('lib/utils 는 더 이상 치환하지 않는다 (#118 — 루트 bare import 가 정본)', () => {
      const input = `import { cn } from '../../lib/utils'`
      expect(transformImports(input)).toBe(input)
      expect(findAfdsImportRule('../../lib/utils')).toBeUndefined()
    })

    it('headless import는 @turbo-project/afds/headless 로 치환한다', () => {
      const input = `import { useMultiSelectDraft } from '../../headless/multi-select'`
      expect(transformImports(input)).toBe(
        `import { useMultiSelectDraft } from '@turbo-project/afds/headless'`,
      )
    })

    it('hooks import는 @turbo-project/afds/hooks 로 치환한다', () => {
      const input = `import { useMountAnimation } from '../../hooks/use-mount-animation'`
      expect(transformImports(input)).toBe(
        `import { useMountAnimation } from '@turbo-project/afds/hooks'`,
      )
    })

    // 규칙이 없어서 상대경로가 그대로 남던 결함. 실측: 자체 CLI(철거됨) `add PageLayout` 산출물의
    // page-layout.tsx:6 에 `from '../../schemas/tokens.schema'` 가 잔존해 소비처에서 컴파일 불가.
    it('schemas import는 @turbo-project/afds/schemas 로 치환한다', () => {
      const input = `import { type PrimitiveSpacing } from '../../schemas/tokens.schema'`
      expect(transformImports(input)).toBe(
        `import { type PrimitiveSpacing } from '@turbo-project/afds/schemas'`,
      )
    })

    it('배럴 형태(후행 세그먼트 없음)도 치환한다', () => {
      expect(transformImports(`import { Button } from '../../bricks'`)).toBe(
        `import { Button } from '@turbo-project/afds/bricks'`,
      )
    })

    it('중첩 파일의 더 깊은 상향(../../../)도 치환한다', () => {
      expect(transformImports(`import { Button } from '../../../bricks/action/button'`)).toBe(
        `import { Button } from '@turbo-project/afds/bricks'`,
      )
    })

    it('큰따옴표와 공백 없는 from 도 처리한다', () => {
      expect(transformImports(`import { Button } from "../../bricks/action/button"`)).toBe(
        `import { Button } from "@turbo-project/afds/bricks"`,
      )
      expect(transformImports(`import{Button}from'../../bricks/action/button'`)).toBe(
        `import{Button}from'@turbo-project/afds/bricks'`,
      )
    })

    it('치환 후 AFDS 내부 상대경로가 남지 않는다', () => {
      const input = `import { type PrimitiveSpacing } from '../../schemas/tokens.schema'`
      expect(transformImports(input)).not.toContain('../../')
    })
  })

  describe('규칙 조회는 모듈 specifier 단위로 한다 (빌드 가드가 검증에 사용)', () => {
    it('컴포지션이 실제로 쓰는 specifier 를 모두 다룬다', () => {
      // `../../lib/utils` 는 #118 이후 컴포지션이 쓰지 않는다(실측 16건 → 0건). 목록은
      // "실제로 쓰는 것" 이어야 하므로 뺀다 — 안 쓰는 것을 넣어두면 이 테스트가 현실을
      // 대조하지 않고 자기 자신을 대조하게 된다.
      for (const spec of [
        '../../bricks/action/button',
        '../../headless/multi-select',
        '../../schemas/tokens.schema',
      ]) {
        expect(findAfdsImportRule(spec)?.subpath, spec).toBeTruthy()
      }
    })

    // 접두 단위 판정이 통과시켰던 입력. `packages/afds/src/lib/slot.tsx` 는 실존 모듈이므로
    // 가상의 예가 아니다. `lib` 규칙은 `lib/utils` 만 매칭하는데 접두만 보면 "처리됨" 이었다.
    it('같은 접두라도 매칭하지 않으면 누락으로 판정한다', () => {
      expect(findAfdsImportRule('../../lib/slot')).toBeUndefined()
      expect(findAfdsImportRule('../../lib/format')).toBeUndefined()
      expect(findAfdsImportRule('../../lib')).toBeUndefined()
    })

    it('규칙이 없는 디렉터리도 누락으로 판정한다', () => {
      expect(findAfdsImportRule('../../unmapped-dir/thing')).toBeUndefined()
    })

    // `./types` 는 AFDS exports 에 없다. 규칙을 두면 치환 결과가 소비처에서
    // 해소되지 않는다(TS2307). 규칙을 없애 가드가 "규칙 없음" 으로 보고하게 했다.
    it('types 규칙은 없다 — ./types 는 AFDS exports 에 존재하지 않는다', () => {
      expect(findAfdsImportRule('../../types/foo')).toBeUndefined()
      expect(AFDS_IMPORT_RULES.some(r => r.subpath === 'types')).toBe(false)
      const input = `import type { Foo } from '../../types/foo'`
      expect(transformImports(input)).toBe(input)
    })

    it('규칙 조회와 치환 동작이 일치한다', () => {
      for (const spec of [
        '../../lib/slot',
        '../../unmapped-dir/thing',
        '../../types/foo',
        '../../lib/utils',
        '../../bricks',
      ]) {
        const hasRule = findAfdsImportRule(spec) !== undefined
        const transformed = transformImports(`import { x } from '${spec}'`)
        expect(transformed.includes(spec), spec).toBe(!hasRule)
      }
    })

    it('specifier 정규식에 g 플래그가 없어 반복 조회가 안정적이다', () => {
      for (const rule of AFDS_IMPORT_RULES) {
        expect(rule.specifier.flags, rule.subpath).not.toContain('g')
      }
      const spec = '../../bricks/action/button'
      expect(findAfdsImportRule(spec)?.subpath).toBe('bricks')
      expect(findAfdsImportRule(spec)?.subpath).toBe('bricks')
      expect(findAfdsImportRule(spec)?.subpath).toBe('bricks')
    })

    it('여러 번 치환해도 결과가 같다 (멱등)', () => {
      const input = `import { A } from '../../bricks/a'\nimport { B } from '../../bricks/b'`
      const once = transformImports(input)
      expect(transformImports(once)).toBe(once)
    })
  })

  describe('specifier 분류', () => {
    it('AFDS 내부는 2단 이상 상향이다', () => {
      expect(isAfdsInternalSpecifier('../../bricks/a')).toBe(true)
      expect(isAfdsInternalSpecifier('../../../bricks/a')).toBe(true)
      expect(isAfdsInternalSpecifier('../sibling')).toBe(false)
      expect(isAfdsInternalSpecifier('./local')).toBe(false)
      expect(isAfdsInternalSpecifier('react')).toBe(false)
    })

    it('형제 참조는 정확히 1단 상향이다', () => {
      expect(isSiblingSpecifier('../base-tooltip')).toBe(true)
      expect(isSiblingSpecifier('../../bricks/a')).toBe(false)
      expect(isSiblingSpecifier('./local')).toBe(false)
    })
  })
})
