import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { generate } from '../src/generate.js'
import { defineConfig } from '../src/config.js'

// 임시 디렉토리에서 파일 I/O 테스트
function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'ftb-test-'))
}

function writeJson(dir: string, filename: string, data: object) {
  fs.writeFileSync(path.join(dir, filename), JSON.stringify(data, null, 2))
}

const PRIMITIVE = {
  color: {
    white: { $value: '#ffffff', $type: 'color', $description: 'Pure white' },
    gray: {
      '500': { $value: '#888888', $type: 'color', $description: 'Gray 500' },
      '700': { $value: '#3d3d3d', $type: 'color', $description: 'Gray 700' },
    },
    primary: {
      '500': { $value: '#556af9', $type: 'color', $description: 'Primary 500' },
    },
  },
  spacing: {
    '4': { $value: '16px', $type: 'dimension', $description: 'Spacing 4' },
  },
  radius: {
    lg: { $value: '8px', $type: 'dimension', $description: 'Radius LG' },
  },
}

const SEMANTIC = {
  color: {
    surface: { $value: '{color.white}', $type: 'color', $description: 'Surface background' },
    fg: { $value: '{color.gray.700}', $type: 'color', $description: 'Foreground text' },
    brand: { $value: '{color.primary.500}', $type: 'color', $description: 'Brand color' },
  },
}

describe('generate (콤팩트 통합 테스트)', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = createTempDir()
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('전체 파이프라인: primitive + semantic 생성', async () => {
    writeJson(tmpDir, 'primitive.json', PRIMITIVE)
    writeJson(tmpDir, 'semantic.json', SEMANTIC)

    const config = defineConfig({
      namespace: 'afds',
      tiers: {
        primitive: { source: 'primitive.json', output: 'out/primitive.css', tailwind: true },
        semantic: { source: 'semantic.json', output: 'out/semantic.css' },
      },
      typescript: { output: 'out/tokens.ts', zod: true },
    })

    const result = await generate(config, tmpDir)

    expect(result.ok).toBe(true)
    expect(fs.existsSync(path.join(tmpDir, 'out/primitive.css'))).toBe(true)
    expect(fs.existsSync(path.join(tmpDir, 'out/semantic.css'))).toBe(true)
    expect(fs.existsSync(path.join(tmpDir, 'out/tokens.ts'))).toBe(true)
  })

  it('생성된 CSS 변수명 및 @theme 확인', async () => {
    writeJson(tmpDir, 'primitive.json', PRIMITIVE)

    const config = defineConfig({
      namespace: 'afds',
      tiers: {
        primitive: { source: 'primitive.json', output: 'out/primitive.css', tailwind: true },
      },
    })

    await generate(config, tmpDir)

    const css = fs.readFileSync(path.join(tmpDir, 'out/primitive.css'), 'utf-8')
    // 1. :root {} 확인 (표준 --afds-color-*)
    expect(css).toContain('--afds-color-white: #ffffff;')
    // 2. @theme {} 확인 (Tailwind v4 연결용 --color-afds-*)
    expect(css).toContain('@theme {')
    expect(css).toContain('--color-afds-white: var(--afds-color-white);')
  })

  it('소스 파일 없으면 에러 결과 반환', async () => {
    const config = defineConfig({
      namespace: 'afds',
      tiers: {
        primitive: { source: 'nonexistent.json', output: 'out/primitive.css' },
      },
    })

    const result = await generate(config, tmpDir)
    expect(result.ok).toBe(false)
    expect(result.validation.errors.length).toBeGreaterThan(0)
  })
})
