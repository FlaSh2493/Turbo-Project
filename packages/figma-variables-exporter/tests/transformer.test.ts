import { describe, it, expect } from 'vitest'
import { transformVariables } from '../src/plugin/transformer'

const colorVar = {
  id: 'v1',
  name: 'color/gray/500',
  resolvedType: 'COLOR' as const,
  valuesByMode: { m1: { r: 0.5, g: 0.5, b: 0.5, a: 1 } },
}

const floatVar = {
  id: 'v2',
  name: 'spacing/base',
  resolvedType: 'FLOAT' as const,
  valuesByMode: { m1: 8 },
}

const stringVar = {
  id: 'v3',
  name: 'font/family',
  resolvedType: 'STRING' as const,
  valuesByMode: { m1: 'Inter' },
}

const aliasVar = {
  id: 'v4',
  name: 'semantic/primary',
  resolvedType: 'COLOR' as const,
  valuesByMode: { m1: { type: 'VARIABLE_ALIAS', id: 'v1' } },
}

const alphaColorVar = {
  id: 'v5',
  name: 'color/overlay',
  resolvedType: 'COLOR' as const,
  valuesByMode: { m1: { r: 0, g: 0, b: 0, a: 0.5 } },
}

const singleModeCollection = {
  id: 'c1',
  name: 'Primitive',
  modes: [{ modeId: 'm1', name: 'Default' }],
  variableIds: ['v1', 'v2', 'v3'],
}

const multiModeCollection = {
  id: 'c2',
  name: 'Semantic',
  modes: [
    { modeId: 'light', name: 'Light' },
    { modeId: 'dark', name: 'Dark' },
  ],
  variableIds: ['v4'],
}

describe('transformVariables', () => {
  it('COLOR 변수를 hex로 변환', () => {
    const files = transformVariables([singleModeCollection], [colorVar])
    const token = (files[0].content as any).color.gray['500']
    expect(token['$value']).toBe('#808080')
    expect(token['$type']).toBe('color')
  })

  it('FLOAT 변수를 number로 변환', () => {
    const files = transformVariables([singleModeCollection], [floatVar])
    const token = (files[0].content as any).spacing.base
    expect(token['$value']).toBe(8)
    expect(token['$type']).toBe('number')
  })

  it('STRING 변수를 string으로 변환', () => {
    const files = transformVariables([singleModeCollection], [stringVar])
    const token = (files[0].content as any).font.family
    expect(token['$value']).toBe('Inter')
    expect(token['$type']).toBe('string')
  })

  it('VARIABLE_ALIAS를 DTCG alias 형식으로 변환', () => {
    const files = transformVariables(
      [{ ...singleModeCollection, variableIds: ['v4'] }],
      [colorVar, aliasVar],
    )
    const token = (files[0].content as any).semantic.primary
    expect(token['$value']).toBe('{color.gray.500}')
  })

  it('단일 모드 컬렉션 파일명: primitive.tokens.json', () => {
    const files = transformVariables([singleModeCollection], [colorVar])
    expect(files[0].filename).toBe('primitive.tokens.json')
  })

  it('멀티 모드 컬렉션 파일명: semantic.light.tokens.json, semantic.dark.tokens.json', () => {
    const vars = [
      {
        ...aliasVar,
        valuesByMode: {
          light: { type: 'VARIABLE_ALIAS', id: 'v1' },
          dark: { type: 'VARIABLE_ALIAS', id: 'v1' },
        },
      },
    ]
    const files = transformVariables([multiModeCollection], [...vars, colorVar])
    expect(files[0].filename).toBe('semantic.light.tokens.json')
    expect(files[1].filename).toBe('semantic.dark.tokens.json')
  })

  it('슬래시 경로를 중첩 객체로 변환', () => {
    const files = transformVariables([singleModeCollection], [colorVar])
    const content = files[0].content as any
    expect(content).toHaveProperty('color')
    expect(content.color).toHaveProperty('gray')
    expect(content.color.gray).toHaveProperty('500')
  })

  it('알파 채널 포함 색상을 #rrggbbaa로 변환', () => {
    const col = { ...singleModeCollection, variableIds: ['v5'] }
    const files = transformVariables([col], [alphaColorVar])
    const token = (files[0].content as any).color.overlay
    expect(token['$value']).toBe('#00000080')
  })
})
