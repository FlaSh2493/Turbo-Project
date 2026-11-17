/**
 * PostCSS 플러그인 — AFDS preflight + theme 변수를 특정 스코프(`.afds`)로 가둔다.
 *
 * `@turbo-project/afds/styles` precompiled 번들은 Tailwind v4 의 preflight(전역 reset)을 `@layer base` 에,
 * theme 변수(`--spacing`/`--text-*`/`--color-*`/`--afds-*` 등)를 `@layer theme` 의 `:root,:host` 와
 * 레이어 밖 bare `:root`(토큰)에 전역 선언한다. Ant Design·MUI·Radix 처럼 전역 스타일/Tailwind 를
 * 쓰는 host 와 한 페이지에 공존하면 이 선언들이 host 로 누수되므로, scoped 산출물에서 `.afds` 로 가둔다.
 *
 * 레이어별 규칙:
 * - `@layer base`(preflight): 루트성(`html`/`:host`/`:root`/`body`)→`scope`, 그 외 셀렉터→`scope <sel>`.
 * - `@layer theme` + 레이어 밖(unlayered) 최상위: **루트성 셀렉터만** →`scope`(변수 선언 블록). 그 외 불변.
 * - `@layer utilities`/`@layer components`, 그리고 `@media`/`@supports`/`@container`/`@keyframes` 등
 *   비-layer at-rule 내부: **무변환**(전역 utility class·조건부 규칙 보존).
 *
 * `rule.selectors` 는 postcss list.comma(bracket-aware)라 `:where(a,b)` 내부 콤마는 분리되지 않는다.
 * 런타임 의존성을 늘리지 않도록 `postcss` 는 타입으로만 import 한다.
 */
import type { AtRule, Container, Document, Plugin, Rule } from 'postcss'

export interface ScopeAfdsPreflightOptions {
  /**
   * preflight·theme 변수를 가둘 스코프 셀렉터.
   * @default '.afds'
   */
  scope?: string
}

const ROOTISH = new Set(['html', ':host', ':root', 'body'])

/**
 * 규칙의 변환 모드를 판정한다.
 * - `'base'`    — `@layer base`(preflight): 전체 셀렉터 변환.
 * - `'rootish'` — `@layer theme` 또는 레이어 밖 최상위: 루트성 셀렉터만 변환.
 * - `'skip'`    — `@layer utilities`/`components`, 또는 비-layer at-rule(`@media`/`@supports`/`@container`/
 *                 `@keyframes` 등) 내부: 무변환.
 */
const classify = (node: Container | Document | undefined): 'base' | 'rootish' | 'skip' => {
  let parent = node
  let layer: string | null = null
  while (parent) {
    if (parent.type === 'atrule') {
      const at = parent as AtRule
      if (at.name === 'layer') {
        if (layer === null) layer = at.params.trim()
      } else {
        // @media / @supports / @container / @keyframes 등 — 조건부/비-layer at-rule 내부는 건드리지 않음
        return 'skip'
      }
    }
    parent = parent.parent
  }
  if (layer === 'base') return 'base'
  if (layer === 'theme' || layer === null) return 'rootish'
  return 'skip' // utilities / components / 기타 named layer
}

export const scopeAfdsPreflight = Object.assign(
  (opts: ScopeAfdsPreflightOptions = {}): Plugin => {
    const scope = opts.scope ?? '.afds'
    return {
      postcssPlugin: 'scope-afds-preflight',
      Rule(rule: Rule) {
        const mode = classify(rule.parent)
        if (mode === 'skip') return

        if (mode === 'base') {
          // preflight: 루트성→scope, 그 외→`scope <sel>` (descendant)
          rule.selectors = [
            ...new Set(
              rule.selectors.map(sel => {
                const s = sel.trim()
                return ROOTISH.has(s) ? scope : `${scope} ${s}`
              }),
            ),
          ]
          return
        }

        // mode === 'rootish' (@layer theme / unlayered): 루트성 셀렉터만 scope, 그 외 불변
        if (!rule.selectors.some(sel => ROOTISH.has(sel.trim()))) return
        rule.selectors = [
          ...new Set(rule.selectors.map(sel => (ROOTISH.has(sel.trim()) ? scope : sel.trim()))),
        ]
      },
    }
  },
  { postcss: true as const },
)

export default scopeAfdsPreflight
