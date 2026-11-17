import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import postcss from 'postcss'
import { scopeAfdsPreflight } from '../scope-afds-preflight'

const run = (css: string, scope?: string) =>
  postcss([scopeAfdsPreflight(scope ? { scope } : undefined)]).process(css, { from: undefined }).css

const hasBareRootish = (css: string) => /(?:^|[}{;,])\s*(:root|:host)\s*[,{]/.test(css)

describe('scopeAfdsPreflight', () => {
  // ── @layer base (preflight) ──────────────────────────────────────────────
  it('@layer base 루트성(html/body)을 scope 로 치환한다', () => {
    const out = run('@layer base {\n  html { line-height: 1.5; }\n  body { margin: 0; }\n}')
    expect(out).toMatch(/\.afds\s*\{[^}]*line-height/)
    expect(out).not.toMatch(/(^|\s)html\s*\{/)
    expect(out).not.toMatch(/(^|\s)body\s*\{/)
  })

  it('@layer base 비루트는 descendant(scope <sel>)로 prefix 한다', () => {
    const out = run(
      '@layer base {\n  * { box-sizing: border-box; }\n  h1 { font-size: inherit; }\n}',
    )
    expect(out).toMatch(/\.afds \*\s*\{/)
    expect(out).toMatch(/\.afds h1\s*\{/)
  })

  it(':where(a, b) 내부 콤마를 분리하지 않는다', () => {
    const out = run('@layer base {\n  :where(ul, ol) { list-style: none; }\n}')
    expect(out).toContain('.afds :where(ul, ol)')
  })

  it('루트성 결합(html, :host)이 중복 .afds 로 합쳐진다', () => {
    const out = run('@layer base {\n  html, :host { -webkit-text-size-adjust: 100%; }\n}')
    const sel = out.slice(out.indexOf('{') + 1, out.lastIndexOf('{')).trim()
    expect(sel).toBe('.afds')
  })

  // ── @layer theme (변수 선언) — 루트성만 스코프 (B안) ───────────────────────
  it('@layer theme 의 :root,:host 를 .afds 로 스코프한다', () => {
    const out = run(
      '@layer theme {\n  :root, :host { --spacing: .25rem; --color-blue-500: #3b82f6; }\n}',
    )
    expect(out).toContain('.afds')
    expect(hasBareRootish(out)).toBe(false)
    expect(out).toContain('--spacing')
  })

  // ── 레이어 밖(unlayered) bare :root 토큰 → .afds ───────────────────────────
  it('레이어 밖 bare :root{--afds-*} 를 .afds 로 스코프한다', () => {
    const out = run(':root {\n  --afds-color-x: #fff;\n}')
    expect(out).toMatch(/\.afds\s*\{[^}]*--afds-color-x/)
    expect(hasBareRootish(out)).toBe(false)
  })

  // ── utilities/components 레이어 class 셀렉터는 전역 유지 ────────────────────
  it('@layer utilities 의 class 셀렉터는 변환하지 않는다(전역 유지)', () => {
    const out = run('@layer utilities {\n  .text-sm { font-size: var(--text-sm); }\n}')
    expect(out).toContain('.text-sm')
    expect(out).not.toContain('.afds .text-sm')
    expect(out).not.toContain('.afds.text-sm')
  })

  // ── 비-layer at-rule 내부 :root 는 건드리지 않는다 ─────────────────────────
  it('@media 내부 :root 는 변환하지 않는다', () => {
    const out = run('@media (prefers-color-scheme: dark) {\n  :root { --x: 1; }\n}')
    expect(out).toContain(':root')
    expect(out).not.toContain('.afds')
  })

  it('커스텀 scope 옵션을 적용한다', () => {
    const out = run('@layer base {\n  * { box-sizing: border-box; }\n}', '#root .scoped')
    expect(out).toContain('#root .scoped *')
  })

  // ── 빌드 산출물 통합 회귀 가드 (pnpm build 후에만; 없으면 skip) ─────────────
  it('실제 빌드 산출물에 스코프 적용 시 bare :root/:host 0 + theme 변수는 .afds, 유틸은 전역', () => {
    const distIndex = join(process.cwd(), 'dist/styles/index.css')
    if (!existsSync(distIndex)) {
      console.warn('[skip] dist/styles/index.css 없음 — pnpm build 후 검증됨')
      return
    }
    const out = run(readFileSync(distIndex, 'utf8'))
    expect(out).toContain('@layer base') // Tailwind 출력 구조 가드
    expect(out).toMatch(/\.afds \*/) // preflight 스코프됨
    expect(hasBareRootish(out)).toBe(false) // theme/token 변수 누수 0
    expect(out).toContain('.text-sm') // 유틸 class 는 전역 유지
  })
})
