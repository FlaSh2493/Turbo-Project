/**
 * 토큰 매니페스트 회귀 테스트
 *
 * 배경: `dist/manifest/tokens.*.json` 과 `dist/llms.txt` 는 에이전트가 읽는 계약인데,
 * 파서가 DTCG(`$value`)를 읽고 JSON 은 레거시(`value`)라 primitive 91개가 통째로 드롭되고
 * semantic 은 `--afds-color-color-icon` 같은 없는 변수명으로 나간 적이 있다.
 * 그 결함이 조용히 배포된 이유는 파서 버그가 아니라 검증 부재였다 — 이 파일이 그 구멍을 막는다.
 */
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  PRIMITIVE_COLOR_VALUES,
  PRIMITIVE_RADIUS_VALUES,
  PRIMITIVE_SPACING_VALUES,
  PRIMITIVE_TYPOGRAPHY_VALUES,
  SEMANTIC_COLOR_VALUES,
  CUSTOM_DURATION_VALUES,
  CUSTOM_SHADOW_VALUES,
  CUSTOM_TEXT_VALUES,
} from '../../src/schemas/tokens.schema'
import {
  buildTokenInfo,
  readCssFacts,
  renderTokenSections,
  verifyTokenManifest,
  type TokenInfo,
  type TokenLayer,
} from '../tokens-manifest'

const PKG_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const TOKENS_DIR = join(PKG_ROOT, 'tokens')
const TOKENS_JSON_DIR = join(TOKENS_DIR, 'json')

const tokens = buildTokenInfo(TOKENS_JSON_DIR)

/** 레이어의 모든 엔트리를 `layer.category.role` 경로와 함께 펼친다. */
function flatEntries(layer: TokenLayer) {
  return Object.entries(layer).flatMap(([category, entries]) =>
    Object.entries(entries).map(([role, entry]) => ({ at: `${category}.${role}`, ...entry })),
  )
}

/** 매니페스트 카테고리 키 → 스키마 이름 (primitive color 만 `afds-` 네임스페이스가 붙는다) */
function namesOf(layer: TokenLayer, category: string, prefix = ''): string[] {
  return Object.keys(layer[category] ?? {}).map(k => `${prefix}${k}`)
}

describe('buildTokenInfo — 이름은 tokens.schema.ts, 값은 tokens/json', () => {
  it('세 레이어 모두 엔트리가 0이 아니다', () => {
    expect(flatEntries(tokens.primitive).length).toBeGreaterThan(0)
    expect(flatEntries(tokens.semantic).length).toBeGreaterThan(0)
    expect(flatEntries(tokens.custom).length).toBeGreaterThan(0)
  })

  it('생성된 이름 집합이 tokens.schema.ts export 와 정확히 일치한다', () => {
    const cases: [string[], readonly string[]][] = [
      [namesOf(tokens.primitive, 'color', 'afds-'), PRIMITIVE_COLOR_VALUES],
      [namesOf(tokens.primitive, 'typography'), PRIMITIVE_TYPOGRAPHY_VALUES],
      [namesOf(tokens.primitive, 'radius'), PRIMITIVE_RADIUS_VALUES],
      [namesOf(tokens.primitive, 'spacing'), PRIMITIVE_SPACING_VALUES],
      [namesOf(tokens.custom, 'shadow'), CUSTOM_SHADOW_VALUES],
      [namesOf(tokens.custom, 'duration'), CUSTOM_DURATION_VALUES],
      [namesOf(tokens.custom, 'text'), CUSTOM_TEXT_VALUES],
    ]
    for (const [derived, schema] of cases) {
      expect([...derived].sort()).toEqual([...schema].sort())
    }

    // semantic 은 카테고리로 중첩되므로 `{category}-{role}` 로 되돌려 비교한다.
    const semanticNames = Object.entries(tokens.semantic).flatMap(([category, entries]) =>
      Object.keys(entries).map(role => `${category}-${role}`),
    )
    expect(semanticNames.sort()).toEqual([...SEMANTIC_COLOR_VALUES].sort())
  })

  it('semantic 이 실제 카테고리로 중첩된다 — `--afds-color-color-*` 형태가 없다', () => {
    // 회귀 방어: 파서가 최상위 `color` 래퍼를 카테고리로 착각하면 이 형태가 만들어졌었다.
    expect(Object.keys(tokens.semantic).sort()).toEqual([
      'bg',
      'border',
      'divider',
      'icon',
      'interaction',
      'text',
    ])
    const allCssVars = [tokens.primitive, tokens.semantic, tokens.custom]
      .flatMap(flatEntries)
      .map(e => e.cssVar)
      .filter((v): v is string => Boolean(v))
    expect(allCssVars.filter(v => v.startsWith('--afds-color-color-'))).toEqual([])
  })

  it('resolves 에 실제 값이 들어간다', () => {
    expect(tokens.primitive.radius.sm.resolves).toBe('5px')
    expect(tokens.primitive.radius.sm.tailwind).toBe('rounded-afds-sm')
    // 정확한 색상 값은 verifyTokenManifest 가 tokens/*.css 와 대조한다. 여기선 형태만 본다.
    expect(tokens.primitive.color['brand-500'].resolves).toMatch(/^#[0-9a-f]{6}$/)
    expect(tokens.primitive.spacing['spacing-8'].resolves).toBe('8px')
    expect(tokens.custom.shadow['1'].resolves).toBe('0 4px 30px 0 rgba(0, 0, 0, 0.1)')
    expect(tokens.custom.duration['300'].resolves).toBe('300ms')
    // semantic 은 CSS 가 선언하는 형태(참조)로, custom text 는 참조를 푼 원시 값으로 싣는다.
    expect(tokens.semantic.bg.surface.resolves).toBe('var(--afds-color-gray-0)')
    expect(tokens.custom.text.body1.resolves).toBe('16px/26px 500')
  })

  it('모든 엔트리가 값이 채워진 채로 나온다 (빈 껍데기 금지)', () => {
    for (const layer of [tokens.primitive, tokens.semantic, tokens.custom]) {
      for (const entry of flatEntries(layer)) {
        expect(entry.resolves, `${entry.at} 의 resolves 가 비었다`).toBeTruthy()
        expect(entry.cssVar ?? entry.tailwind, `${entry.at} 가 쓸 수 없다`).toBeTruthy()
      }
    }
  })

  it('JSON 값이 숫자로 저장돼도 resolves 를 채운다', () => {
    // 레거시 Tokens Studio 는 fontWeight·duration 을 숫자로도 저장한다. 현재 JSON 은 전부
    // 문자열이라 지금 버그는 아니지만, 숫자가 오면 resolves 가 비어 가드가 빌드를 실패시킨다.
    const dir = mkdtempSync(join(tmpdir(), 'afds-num-'))
    cpSync(TOKENS_JSON_DIR, dir, { recursive: true })
    const custom = JSON.parse(readFileSync(join(dir, 'custom.tokens.json'), 'utf-8'))
    custom.duration['300'].value = 300
    custom.shadow['1'].value = { ...custom.shadow['1'].value, offsetY: 4, blur: 30 }
    writeFileSync(join(dir, 'custom.tokens.json'), JSON.stringify(custom))

    const built = buildTokenInfo(dir)
    expect(built.custom.duration['300'].resolves).toBe('300')
    expect(built.custom.shadow['1'].resolves).toBe('0 4 30 0 rgba(0, 0, 0, 0.1)')
  })

  it('tokens.schema.ts 와 tokens/json 이 어긋나면 조용히 넘기지 않고 실패한다', () => {
    const dir = mkdtempSync(join(tmpdir(), 'afds-tokens-'))
    cpSync(TOKENS_JSON_DIR, dir, { recursive: true })
    const primitive = JSON.parse(
      readFileSync(join(dir, 'primitive.tokens.json'), 'utf-8'),
    ) as Record<string, Record<string, unknown>>
    delete primitive.radius.SM
    writeFileSync(join(dir, 'primitive.tokens.json'), JSON.stringify(primitive))

    expect(() => buildTokenInfo(dir)).toThrow(/tokens.schema.ts 에는 있으나 JSON 에 없음: sm/)
  })
})

describe('renderTokenSections — llms.txt 토큰 섹션', () => {
  const text = renderTokenSections(tokens).join('\n')

  /** 헤더 줄(부제가 붙을 수 있다) 다음, 다음 `###` 헤더가 나오기 전까지의 본문 */
  function sectionBody(heading: string): string[] {
    const lines = text.split('\n')
    const start = lines.findIndex(l => l.startsWith(heading))
    expect(start, `${heading} 섹션이 없다`).toBeGreaterThanOrEqual(0)
    const rest = lines.slice(start + 1)
    const end = rest.findIndex(l => l.startsWith('### '))
    return end === -1 ? rest : rest.slice(0, end)
  }

  it('Semantic · Primitive · Custom 섹션이 비어 있지 않다', () => {
    // 회귀 방어: 카테고리 조회가 실제 구조와 어긋나 헤더만 남고 공백으로 나간 적이 있다.
    for (const heading of ['### Semantic', '### Primitive', '### Custom']) {
      const bullets = sectionBody(heading).filter(l => l.startsWith('- '))
      expect(bullets.length, `${heading} 이 비었다`).toBeGreaterThan(0)
    }
  })

  it('Semantic 섹션이 카테고리 6개를 모두 싣는다', () => {
    for (const label of [
      'Color · Icon',
      'Color · Background',
      'Color · Text',
      'Color · Border',
      'Color · Divider',
      'Color · Interaction',
    ]) {
      expect(text).toContain(`#### ${label}`)
    }
  })

  it('토큰 값이 함께 노출된다 — 소비자가 rounded-[5px] 를 쓸 이유가 없어야 한다', () => {
    expect(text).toContain('`rounded-afds-sm` → 5px')
    // semantic 은 매니페스트에선 참조로 두고, llms.txt 에선 최종 값으로 푼다 (P3-4)
    expect(text).toContain('`bg-afds-bg-surface` → #ffffff')
    expect(text).not.toContain('→ var(--afds-color-gray-0)')
  })

  it('interaction 카테고리를 CSS var only 로 잘못 안내하지 않는다', () => {
    // @theme 에 --color-afds-interaction-* 가 있어 bg-afds-interaction-* 는 실존 유틸이다 (P3-1)
    expect(text).toContain('`bg-afds-interaction-hover-overlay`')
    expect(text).not.toContain('Color · Interaction (CSS var only)')
  })
})

describe('verifyTokenManifest — 빌드 가드', () => {
  it('실제 산출물은 통과한다', () => {
    expect(() => verifyTokenManifest(tokens, TOKENS_DIR)).not.toThrow()
  })

  it('레이어가 비면 실패한다', () => {
    const broken: TokenInfo = { ...tokens, primitive: {} }
    expect(() => verifyTokenManifest(broken, TOKENS_DIR)).toThrow(/primitive: 엔트리가 0개다/)
  })

  it('tokens/*.css 에 없는 cssVar 는 실패한다', () => {
    const broken: TokenInfo = {
      ...tokens,
      semantic: { color: { icon: { cssVar: '--afds-color-color-icon' } } },
    }
    expect(() => verifyTokenManifest(broken, TOKENS_DIR)).toThrow(
      /cssVar '--afds-color-color-icon' 가 tokens\/\*\.css 에 없다/,
    )
  })

  it('resolves 가 CSS 선언과 다르면 실패한다', () => {
    const broken: TokenInfo = {
      ...tokens,
      primitive: { radius: { sm: { cssVar: '--afds-radius-sm', resolves: '4px' } } },
    }
    expect(() => verifyTokenManifest(broken, TOKENS_DIR)).toThrow(
      /resolves '4px' 가 CSS 선언 --afds-radius-sm 의 값 '5px' 와 다르다/,
    )
  })

  it('cssVar 없는 토큰(@utility)도 값이 검증된다', () => {
    // @utility 본문을 파싱해 대조하므로, CSS 변수가 없다는 것이 값 검증 면제가 되지 않는다.
    const broken: TokenInfo = {
      ...tokens,
      custom: { text: { body1: { tailwind: 'body1', resolves: '99px/99px 900' } } },
    }
    expect(() => verifyTokenManifest(broken, TOKENS_DIR)).toThrow(
      /resolves '99px\/99px 900' 가 @utility body1 의 값 '16px\/26px 500' 와 다르다/,
    )
  })

  it('cssVar 를 비우고 실존 유틸명을 넣어도 값 검증을 우회할 수 없다', () => {
    // 리뷰 지적(P2-4)의 우회 경로: cssVar 를 지우면 값 검사 밖으로 나갔었다.
    const broken: TokenInfo = {
      ...tokens,
      primitive: { radius: { sm: { tailwind: 'body1', resolves: '5px' } } },
    }
    expect(() => verifyTokenManifest(broken, TOKENS_DIR)).toThrow(
      /primitive.radius.sm: resolves '5px' 가 @utility body1 의 값 '16px\/26px 500' 와 다르다/,
    )
  })

  it('CSS 에 있는 토큰을 매니페스트가 빠뜨리면 실패한다 (역방향)', () => {
    // 이번 결함이 '조용한 누락'이었다. 매니페스트만 순회하면 엔트리가 증발해도 빌드가 초록이다.
    const dropCategory: TokenInfo = { ...tokens, semantic: { ...tokens.semantic } }
    delete dropCategory.semantic.text
    expect(() => verifyTokenManifest(dropCategory, TOKENS_DIR)).toThrow(
      /누락: '--afds-color-text-primary' 가 tokens\/\*\.css 에 선언됐으나 매니페스트에 없다/,
    )

    const dropUtility: TokenInfo = {
      ...tokens,
      custom: { ...tokens.custom, text: { body1: tokens.custom.text.body1 } },
    }
    expect(() => verifyTokenManifest(dropUtility, TOKENS_DIR)).toThrow(
      /누락: '@utility heading0' 가 tokens\/\*\.css 에 있으나 매니페스트에 없다/,
    )
  })

  it('실존하지 않는 tailwind 클래스는 실패한다', () => {
    // 에이전트가 JSX 에 복사해 넣는 값이므로 cssVar 가 정상이어도 검증해야 한다.
    const broken: TokenInfo = {
      ...tokens,
      primitive: {
        ...tokens.primitive,
        radius: {
          ...tokens.primitive.radius,
          sm: { ...tokens.primitive.radius.sm, tailwind: 'rounded-afds-NOPE' },
        },
      },
    }
    expect(() => verifyTokenManifest(broken, TOKENS_DIR)).toThrow(
      /tailwind 'rounded-afds-NOPE' 를 뒷받침하는 @theme 변수가 없다/,
    )
  })

  it('값이 같은 토큰끼리 맞바꿔도 신원 검사가 잡는다', () => {
    // 값 대조만으로는 통과한다 — body3·caption1 은 둘 다 12px/16px 500,
    // bg-surface·bg-canvas 는 둘 다 var(--afds-color-gray-0) 이다.
    const swapUtility: TokenInfo = {
      ...tokens,
      custom: {
        ...tokens.custom,
        text: {
          ...tokens.custom.text,
          body3: { ...tokens.custom.text.body3, tailwind: 'caption1' },
          caption1: { ...tokens.custom.text.caption1, tailwind: 'body3' },
        },
      },
    }
    expect(() => verifyTokenManifest(swapUtility, TOKENS_DIR)).toThrow(
      /custom.text.body3: '@utility caption1' 는 이 토큰의 이름이 아니다 \(기대 'body3'\)/,
    )

    const swapCssVar: TokenInfo = {
      ...tokens,
      semantic: {
        ...tokens.semantic,
        bg: {
          ...tokens.semantic.bg,
          surface: { ...tokens.semantic.bg.surface, cssVar: '--afds-color-bg-canvas' },
          canvas: { ...tokens.semantic.bg.canvas, cssVar: '--afds-color-bg-surface' },
        },
      },
    }
    expect(() => verifyTokenManifest(swapCssVar, TOKENS_DIR)).toThrow(
      /semantic.bg.surface: cssVar '--afds-color-bg-canvas' 는 이 토큰의 이름이 아니다/,
    )
  })

  it('값을 읽을 수 없는 @utility 는 통과가 아니라 실패다', () => {
    // 검증 근거를 못 찾은 엔트리를 조용히 넘기면 면제 경로가 다시 생긴다.
    const dir = mkdtempSync(join(tmpdir(), 'afds-css-'))
    cpSync(TOKENS_DIR, dir, { recursive: true })
    // typography 삼요소가 없어 값을 조립할 수 없는 유틸리티
    writeFileSync(join(dir, 'tokens.custom.css'), '\n@utility opaque-util {\n  color: red;\n}\n', {
      flag: 'a',
    })

    const broken: TokenInfo = {
      ...tokens,
      custom: { text: { body1: { tailwind: 'opaque-util', resolves: '16px/26px 500' } } },
    }
    expect(() => verifyTokenManifest(broken, dir)).toThrow(
      /'@utility opaque-util' 본문에서 값을 읽지 못해 resolves 를 검증할 수 없다/,
    )
  })

  it('resolves 가 비면 실패한다', () => {
    // 값 없는 엔트리는 소비 프로젝트가 rounded-[5px] 를 쓰게 만든 구멍이다.
    const broken: TokenInfo = {
      ...tokens,
      primitive: { radius: { sm: { cssVar: '--afds-radius-sm' } } },
    }
    expect(() => verifyTokenManifest(broken, TOKENS_DIR)).toThrow(
      /primitive.radius.sm: resolves 가 비었다/,
    )
  })

  it('cssVar 도 @utility 도 없는 토큰은 실패한다', () => {
    const broken: TokenInfo = { ...tokens, custom: { text: { body1: { tailwind: 'body9' } } } }
    expect(() => verifyTokenManifest(broken, TOKENS_DIR)).toThrow(/@utility body9/)
  })
})

describe('readCssFacts — tokens/*.css 실측', () => {
  it('가드가 대조하는 CSS 사실이 실제로 존재한다', () => {
    const { declarations, utilities } = readCssFacts(TOKENS_DIR)
    expect(declarations.get('--afds-radius-sm')).toBe('5px')
    expect(declarations.get('--afds-color-icon-lnb-default')).toBe(
      'var(--afds-color-alpha-white-050)',
    )
    // 이름뿐 아니라 본문까지 읽어야 cssVar 없는 토큰의 값을 검증할 수 있다.
    expect(utilities.get('body1')?.get('font-size')).toBe('var(--afds-typography-font-size-s-16)')
    expect(utilities.get('body1')?.get('font-weight')).toBe(
      'var(--afds-typography-font-weight-medium)',
    )
  })
})
