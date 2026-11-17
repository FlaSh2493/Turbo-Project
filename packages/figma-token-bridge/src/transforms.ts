import type { Transform, TransformedToken } from 'style-dictionary/types'

/**
 * Typography/Shadow 객체를 CSS 문자열로 변환 (CSS는 객체 타입을 지원하지 않으므로 필수)
 */
export const compositeToCssString: Transform = {
  name: 'afds/composite/css',
  type: 'value',
  transitive: true,
  filter: (token: TransformedToken) =>
    ['typography', 'shadow', 'gradient'].includes(token.$type || (token as any).type || ''),
  transform: (token: TransformedToken) => {
    const val = token.$value ?? token.value
    if (val === undefined || val === null) return val
    const type = token.$type || (token as any).type
    if (type === 'typography' && typeof val === 'object' && !Array.isArray(val)) {
      // fontFamily는 선택적(typography composite 명세상 누락 가능)
      const parts = [val.fontWeight, `${val.fontSize}/${val.lineHeight}`, val.fontFamily].filter(
        Boolean,
      )
      return parts.join(' ')
    }
    if (type === 'shadow') {
      const shadows = Array.isArray(val) ? val : [val]
      return shadows
        .map((s: any) => `${s.offsetX} ${s.offsetY} ${s.blur} ${s.spread} ${s.color}`)
        .join(', ')
    }
    if (type === 'gradient' && typeof val === 'object' && !Array.isArray(val)) {
      const stops = Array.isArray(val.stops)
        ? val.stops.map((s: any) => `${s.color} ${s.position}`).join(', ')
        : ''
      return `linear-gradient(${val.angle}, ${stops})`
    }
    return val
  },
}
