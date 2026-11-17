import type { Format } from 'style-dictionary/types'

/**
 * Tailwind v4 전용 통합 CSS 포맷터
 * SD v5의 변수 참조 및 DTCG 형식을 안전하게 처리
 */
export const tailwindIntegrated: Format = {
  name: 'afds/css/tailwind-integrated',
  format: async ({ dictionary, options }) => {
    const { namespace, tier, selector, tailwind } = options

    // 원래 값이 alias인 경우 CSS var()로 변환하는 헬퍼
    const formatValue = (token: any) => {
      const originalValue = token.original.$value ?? token.original.value
      // Alias 패턴 {path.to.token} 인지 확인
      if (typeof originalValue === 'string' && /^\{[a-zA-Z0-9_.-]+\}$/.test(originalValue)) {
        const aliasPath = originalValue.slice(1, -1).replace(/\./g, '-')
        return `var(--${namespace}-${aliasPath})`
      }
      return token.value ?? originalValue
    }

    // Typography composite 토큰 식별 — :root/@theme 제외, @utility로 별도 출력
    const isTypoComposite = (t: any) => {
      const type = t.$type || t.type
      const original = t.original?.$value ?? t.original?.value
      return type === 'typography' && original && typeof original === 'object'
    }

    // Gradient composite 토큰 식별 — :root/@theme 제외, @utility로 별도 출력
    const isGradientComposite = (t: any) => {
      const type = t.$type || t.type
      const original = t.original?.$value ?? t.original?.value
      return type === 'gradient' && original && typeof original === 'object'
    }

    const isUtilityComposite = (t: any) => isTypoComposite(t) || isGradientComposite(t)

    // 1. :root {} 블록 생성 (실제 변수 정의 — include된 토큰 및 utility composite 제외)
    const rootLines = dictionary.allTokens
      .filter(token => token.isSource && !isUtilityComposite(token))
      .map(token => {
        const val = formatValue(token)
        return `  --${token.name}: ${val};`
      })
    const rootBlock = rootLines.length > 0 ? `${selector} {\n${rootLines.join('\n')}\n}` : ''

    // 2. @theme {} 블록 생성 (Tailwind v4 유틸리티 연결용 — utility composite 제외)
    let themeBlock = ''
    if (tailwind) {
      const themeLines = dictionary.allTokens
        .filter(token => token.isSource && !isUtilityComposite(token))
        .map(token => {
          // Typography 처리
          if (token.$type === 'typography') {
            const val = token.original.$value ?? token.original.value
            const name = token.name.replace(`${namespace}-typography-`, '')

            const resolve = (v: any) => {
              if (typeof v === 'string' && /^\{[a-zA-Z0-9_.-]+\}$/.test(v)) {
                return `var(--${namespace}-${v.slice(1, -1).replace(/\./g, '-')})`
              }
              return v
            }

            return [
              `  --font-size-${namespace}-${name}: ${resolve(val.fontSize)};`,
              `  --font-weight-${namespace}-${name}: ${resolve(val.fontWeight)};`,
              `  --font-line-height-${namespace}-${name}: ${resolve(val.lineHeight)};`,
              `  --font-family-${namespace}-${name}: ${resolve(val.fontFamily)};`,
              `  --font-${namespace}-${name}: var(--${token.name});`,
            ].join('\n')
          }

          // Color 처리 (afds-color-brand -> --color-afds-brand 연결)
          // 이를 통해 bg-afds-brand 유틸리티가 정상 작동함
          if (token.name.startsWith(`${namespace}-color-`)) {
            const colorName = token.name.replace(`${namespace}-color-`, '')
            return `  --color-${namespace}-${colorName}: var(--${token.name});`
          }

          // Spacing 처리
          if (token.name.startsWith(`${namespace}-spacing-`)) {
            const spacingName = token.name.replace(`${namespace}-spacing-`, '')
            return `  --spacing-${namespace}-${spacingName}: var(--${token.name});`
          }

          // Radius 처리
          if (token.name.startsWith(`${namespace}-radius-`)) {
            const radiusName = token.name.replace(`${namespace}-radius-`, '')
            return `  --radius-${namespace}-${radiusName}: var(--${token.name});`
          }

          // Shadow 처리
          if (token.name.startsWith(`${namespace}-shadow-`)) {
            const shadowName = token.name.replace(`${namespace}-shadow-`, '')
            return `  --shadow-${namespace}-${shadowName}: var(--${token.name});`
          }

          // Duration 처리 — Tailwind v4 animation-* 유틸리티에 직접 연결
          // (의도적으로 namespace 미포함: tailwind는 --animation-{n} 형식을 기대)
          if (token.name.startsWith(`${namespace}-duration-`)) {
            const durationName = token.name.replace(`${namespace}-duration-`, '')
            return `  --animation-${durationName}: var(--${token.name});`
          }

          // Typography 개별 토큰 처리 — Tailwind v4 theme namespace에 맞게 변환
          // --afds-typography-font-size-16   → --text-afds-16       → text-afds-16
          // --afds-typography-line-height-24 → --leading-afds-24    → leading-afds-24
          // --afds-typography-font-family-*  → --font-family-afds-* → font-afds-*
          // --afds-typography-font-weight-*  → --font-weight-afds-*
          if (token.name.startsWith(`${namespace}-typography-font-size-`)) {
            const size = token.name.replace(`${namespace}-typography-font-size-`, '')
            return `  --text-${namespace}-${size}: var(--${token.name});`
          }
          if (token.name.startsWith(`${namespace}-typography-line-height-`)) {
            const size = token.name.replace(`${namespace}-typography-line-height-`, '')
            return `  --leading-${namespace}-${size}: var(--${token.name});`
          }
          if (token.name.startsWith(`${namespace}-typography-font-family-`)) {
            const name = token.name.replace(`${namespace}-typography-font-family-`, '')
            return `  --font-family-${namespace}-${name}: var(--${token.name});`
          }
          if (token.name.startsWith(`${namespace}-typography-font-weight-`)) {
            const name = token.name.replace(`${namespace}-typography-font-weight-`, '')
            return `  --font-weight-${namespace}-${name}: var(--${token.name});`
          }

          return `  --${token.name}: var(--${token.name});`
        })

      if (themeLines.length > 0) {
        const themeType = tailwind === 'inline' ? '@theme inline' : '@theme'
        const sep = rootBlock ? '\n\n' : ''
        themeBlock = `${sep}${themeType} {\n${themeLines.join('\n')}\n}`
      }
    }

    // 3. @utility {} 블록 생성 — typography / gradient composite 토큰을 Tailwind v4 유틸리티 클래스로 변환
    //    예) text.heading0 (typography composite) → @utility heading0 { font-size: ...; ... }
    //    예) gradient.ai (gradient, modes=['text','bg','border']) → @utility text-gradient-ai {...} ...
    let utilityBlock = ''
    const utilityTokens = dictionary.allTokens.filter(isUtilityComposite)
    if (utilityTokens.length > 0) {
      // JSON 경로(camelCase / underscore)를 SD의 name/kebab 변환과 동일한 kebab-case로
      // 정규화 — 예) "typography.fontSize.s_36" → "typography-font-size-s-36"
      const toKebab = (s: string) =>
        s
          .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
          .replace(/_/g, '-')
          .toLowerCase()
      const resolveAlias = (v: any) => {
        if (typeof v === 'string' && /^\{[a-zA-Z0-9_.-]+\}$/.test(v)) {
          const path = v.slice(1, -1).split('.').map(toKebab).join('-')
          return `var(--${namespace}-${path})`
        }
        return v
      }
      const buildLinearGradient = (val: Record<string, any>) => {
        const stops = Array.isArray(val.stops)
          ? val.stops.map((s: any) => `${resolveAlias(s.color)} ${s.position}`).join(', ')
          : ''
        return `linear-gradient(${val.angle}, ${stops})`
      }
      const blocks = utilityTokens
        .map(token => {
          // token.name 예: "afds-text-heading0" → utility 이름 "heading0"
          //   (namespace + 첫 카테고리 prefix 제거)
          const utilName = token.name.replace(new RegExp(`^${namespace}-[^-]+-`), '')
          const val = (token.original.$value ?? token.original.value) as Record<string, any>

          if (isGradientComposite(token)) {
            const gradient = buildLinearGradient(val)
            const modes: string[] = Array.isArray(val.modes) ? val.modes : []
            return modes
              .map(mode => {
                if (mode === 'text') {
                  return [
                    `@utility text-gradient-${utilName} {`,
                    `  background: ${gradient};`,
                    `  -webkit-background-clip: text;`,
                    `  background-clip: text;`,
                    `  -webkit-text-fill-color: transparent;`,
                    `}`,
                  ].join('\n')
                }
                if (mode === 'bg') {
                  return [
                    `@utility bg-gradient-${utilName} {`,
                    `  background: ${gradient};`,
                    `}`,
                  ].join('\n')
                }
                if (mode === 'border') {
                  return [
                    `@utility border-gradient-${utilName} {`,
                    `  position: relative;`,
                    `  outline: none;`,
                    ``,
                    `  &::before {`,
                    `    content: '';`,
                    `    position: absolute;`,
                    `    inset: -1px;`,
                    `    border-radius: inherit;`,
                    `    padding: 1px;`,
                    `    background: ${gradient};`,
                    `    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);`,
                    `    -webkit-mask-composite: xor;`,
                    `    mask-composite: exclude;`,
                    `    pointer-events: none;`,
                    `  }`,
                    `}`,
                  ].join('\n')
                }
                return ''
              })
              .filter(Boolean)
              .join('\n\n')
          }

          const lines: string[] = []
          if (val.fontSize) lines.push(`  font-size: ${resolveAlias(val.fontSize)};`)
          if (val.lineHeight) lines.push(`  line-height: ${resolveAlias(val.lineHeight)};`)
          if (val.fontWeight) lines.push(`  font-weight: ${resolveAlias(val.fontWeight)};`)
          if (val.fontFamily) lines.push(`  font-family: ${resolveAlias(val.fontFamily)};`)
          if (val.fontFeatureSettings)
            lines.push(`  font-feature-settings: ${val.fontFeatureSettings} !important;`)
          return `@utility ${utilName} {\n${lines.join('\n')}\n}`
        })
        .join('\n\n')
      const sep = rootBlock || themeBlock ? '\n\n' : ''
      utilityBlock = `${sep}${blocks}`
    }

    const header = `/* generated by figma-token-bridge (Style Dictionary v5) — DO NOT EDIT DIRECTLY */\n\n`
    return `${header}${rootBlock}${themeBlock}${utilityBlock}\n`
  },
}
