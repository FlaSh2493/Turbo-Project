import { describe, it, expect } from 'vitest'
import postcss from 'postcss'
import { scopeAfdsPreflight } from '../scope-afds-preflight'

/**
 * host(Tailwind v4 등)와 AFDS `styles/scoped` 공존 시, AFDS 가 host 의 공용 CSS 변수를 덮어쓰지
 * 않음을 **CSS 텍스트/AST 레벨**로 검증한다.
 *
 * ⚠️ jsdom 은 stylesheet cascade·custom property 해석을 하지 않으므로 `getComputedStyle` 로 cascade 를
 * 검증하지 않는다(false-pass). 실제 cascade 증명은 Storybook iframe + browser ui-test(#723)가 담당한다.
 */
const run = (css: string) => postcss([scopeAfdsPreflight()]).process(css, { from: undefined }).css

const bareRootDeclCount = (css: string): number => {
  let count = 0
  postcss.parse(css).walkRules(rule => {
    if (rule.selectors.some(s => s.trim() === ':root' || s.trim() === ':host')) {
      count += rule.nodes.filter(n => n.type === 'decl').length
    }
  })
  return count
}

describe('host Tailwind 변수 공존 (CSS/AST 검증)', () => {
  it('scoped 변환 결과는 공용 변수를 bare :root/:host 로 재선언하지 않는다', () => {
    const input = [
      '@layer theme { :root, :host { --spacing: .25rem; --color-blue-500: #3b82f6; --font-sans: ui-sans-serif; } }',
      ':root { --afds-color-x: #fff; }',
      '@layer utilities { .text-sm { font-size: var(--text-sm); } }',
    ].join('\n')
    const out = run(input)

    // host 의 :root 공용 변수를 덮을 수 있는 bare :root/:host 선언이 0 이어야 한다
    expect(bareRootDeclCount(out)).toBe(0)
    // AFDS 변수는 .afds 아래로 이동
    expect(out).toContain('.afds')
    expect(out).toContain('--spacing')
    expect(out).toContain('--afds-color-x')
    // 유틸 class 셀렉터는 전역 유지(.afds 로 안 감)
    expect(out).toContain('.text-sm')
    expect(out).not.toContain('.afds .text-sm')
  })

  it('host :root 변수 + AFDS scoped 를 합쳐도 host 선언이 보존된다', () => {
    const hostCss = ':root { --spacing: 10px; }'
    const afdsScoped = run('@layer theme { :root { --spacing: .25rem; } }')

    // host 선언은 그대로
    expect(hostCss).toContain('--spacing: 10px')
    // AFDS 쪽에는 host 와 충돌할 bare :root --spacing 이 없다(→ host 값 보존)
    expect(afdsScoped).not.toMatch(/:root\s*\{[^}]*--spacing/)
    expect(afdsScoped).toContain('.afds')
    expect(bareRootDeclCount(hostCss + '\n' + afdsScoped)).toBe(1) // host 의 1건만
  })
})
