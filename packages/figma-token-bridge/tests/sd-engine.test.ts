import { describe, it, expect } from 'vitest'
import { compositeToCssString } from '../src/transforms.js'
import { tailwindIntegrated } from '../src/formats.js'

describe('SD Composite Transform', () => {
  it('compositeToCssString: converts typography object to CSS shorthand', () => {
    const token = {
      $type: 'typography',
      $value: {
        fontSize: '16px',
        lineHeight: 1.5,
        fontWeight: 500,
        fontFamily: 'Pretendard',
      },
    } as any
    expect((compositeToCssString as any).transform(token, {})).toBe('500 16px/1.5 Pretendard')
  })

  it('compositeToCssString: converts shadow object to CSS shadow string', () => {
    const token = {
      $type: 'shadow',
      $value: {
        color: '#00000040',
        offsetX: '0px',
        offsetY: '4px',
        blur: '10px',
        spread: '0px',
      },
    } as any
    expect((compositeToCssString as any).transform(token, {})).toBe('0px 4px 10px 0px #00000040')
  })
})

describe('SD Formatter (Simplified)', () => {
  it('tailwindIntegrated: generates :root and @theme blocks with standard SD naming', async () => {
    const dictionary = {
      allTokens: [
        {
          name: 'afds-color-white',
          value: '#ffffff',
          isSource: true,
          original: { $value: '#ffffff' },
        },
        {
          name: 'afds-color-brand',
          value: 'var(--afds-color-primary-500)',
          isSource: true,
          original: { $value: '{color.primary.500}' },
        },
      ],
    } as any
    const options = {
      namespace: 'afds',
      tier: 'semantic',
      selector: ':root',
      tailwind: true,
      outputReferences: true,
    } as any

    const result = await (tailwindIntegrated as any).format({
      dictionary,
      options,
      file: {} as any,
      platform: {} as any,
    })

    expect(result).toContain(':root {')
    expect(result).toContain('  --afds-color-white: #ffffff;')
    expect(result).toContain('  --afds-color-brand: var(--afds-color-primary-500);')
    expect(result).toContain('@theme {')
    expect(result).toContain('  --color-afds-white: var(--afds-color-white);')
    expect(result).toContain('  --color-afds-brand: var(--afds-color-brand);')
  })
})
